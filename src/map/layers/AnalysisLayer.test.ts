import * as Cesium from 'cesium'
import { describe, expect, it, vi } from 'vitest'
import { syncAnalysisLayer } from './AnalysisLayer'
import type { PolygonObstacleAnalysisState, ProtectionZoneMultipolygonGeometry, PositionCoordinate } from '../../types/tool'

function createRing(points: PositionCoordinate[]): PositionCoordinate[] {
  return points
}

function toHierarchyPoints(hierarchy: unknown) {
  const polygonHierarchy = hierarchy as Cesium.PolygonHierarchy

  return polygonHierarchy.positions.map((position) => {
    const cartographic = Cesium.Cartographic.fromCartesian(position)

    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
    }
  })
}

function toHoleHierarchyPoints(hierarchy: unknown) {
  const polygonHierarchy = hierarchy as Cesium.PolygonHierarchy

  return polygonHierarchy.holes.map((hole) => toHierarchyPoints(hole))
}

function expectHierarchyToMatchRing(
  hierarchy: unknown,
  expectedRing: PositionCoordinate[],
  expectedHeights: number[],
) {
  const positions = toHierarchyPoints(hierarchy)

  expect(positions).toHaveLength(expectedRing.length)

  for (const [index, expectedPoint] of expectedRing.entries()) {
    expect(positions[index]?.longitude).toBeCloseTo(expectedPoint[0], 10)
    expect(positions[index]?.latitude).toBeCloseTo(expectedPoint[1], 10)
    expect(positions[index]?.height).toBeCloseTo(expectedHeights[index] ?? Number.NaN, 6)
  }
}

function buildExpectedAnalyticHeights(
  ring: PositionCoordinate[],
  vertical: Extract<PolygonObstacleAnalysisState['visibleProtectionZones'][number]['vertical'], { mode: 'analytic_surface' }>,
) {
  expect(vertical.surface.type).toBe('distance_parameterized')

  if (vertical.surface.type !== 'distance_parameterized') {
    throw new Error(`Expected distance_parameterized surface but received ${vertical.surface.type}`)
  }

  const surface = vertical.surface

  return ring.map(([longitude, latitude]) => {
    let radialDistanceMeters = 0

    if (surface.distanceSource.kind === 'point' && surface.distanceMetric === 'radial') {
      const [sourceLongitude, sourceLatitude] = surface.distanceSource.point
      const averageLatitude = (sourceLatitude + latitude) / 2
      const deltaLatitudeMeters = (latitude - sourceLatitude) * 111320
      const deltaLongitudeMeters = (longitude - sourceLongitude) * 111320 * Math.cos((averageLatitude * Math.PI) / 180)
      radialDistanceMeters = Math.sqrt(deltaLatitudeMeters ** 2 + deltaLongitudeMeters ** 2)
    } else if (
      surface.distanceSource.kind === 'front_reference_line'
      && surface.distanceMetric === 'axial_from_reference_line'
    ) {
      const [stationLongitude, stationLatitude] = surface.distanceSource.stationPoint
      const [centerLongitude, centerLatitude] = surface.distanceSource.centerPoint
      const axisAverageLatitude = (stationLatitude + centerLatitude) / 2
      const metersPerDegreeLongitude = 111320 * Math.cos((axisAverageLatitude * Math.PI) / 180)
      const axisDx = (centerLongitude - stationLongitude) * metersPerDegreeLongitude
      const axisDy = (centerLatitude - stationLatitude) * 111320
      const axisLength = Math.sqrt(axisDx ** 2 + axisDy ** 2)

      if (axisLength > 0.01) {
        const pointAverageLatitude = (stationLatitude + latitude) / 2
        const pointMetersPerDegreeLongitude = 111320 * Math.cos((pointAverageLatitude * Math.PI) / 180)
        const pointDx = (longitude - stationLongitude) * pointMetersPerDegreeLongitude
        const pointDy = (latitude - stationLatitude) * 111320
        radialDistanceMeters = Math.sqrt(pointDx ** 2 + pointDy ** 2)

        const pointLength = Math.sqrt(pointDx ** 2 + pointDy ** 2)

        if (pointLength > 0.01) {
          const angleCosine = ((axisDx / axisLength) * (pointDx / pointLength)) + ((axisDy / axisLength) * (pointDy / pointLength))
          const boundedDistance = Math.min(
            Math.max(radialDistanceMeters, surface.clampRange.startMeters),
            surface.clampRange.endMeters,
          )
          const runwayProjection = surface.planarControl.frontOffsetMeters / angleCosine
          const effectiveDistance = Math.max(0, boundedDistance - runwayProjection)

          return vertical.baseHeightMeters + Math.tan((surface.heightModel.angleDegrees * Math.PI) / 180) * effectiveDistance
        }

        return vertical.baseHeightMeters
      }

      return vertical.baseHeightMeters
    } else {
      throw new Error(
        `Unsupported analytic surface distance model: ${surface.distanceSource.kind}/${surface.distanceMetric}`,
      )
    }

    const boundedDistance = Math.min(
      Math.max(radialDistanceMeters, surface.clampRange.startMeters),
      surface.clampRange.endMeters,
    )

    if (surface.heightModel.type === 'radar_site_protection_mask_angle') {
      const distanceKilometers = boundedDistance / 1000
      const correction = distanceKilometers / surface.heightModel.distanceKilometersCorrectionDivisor
      const tangent = Math.tan((surface.heightModel.maskAngleDegrees * Math.PI) / 180 + correction)

      return Number.isFinite(tangent)
        ? vertical.baseHeightMeters + tangent * boundedDistance
        : vertical.baseHeightMeters
    }

    const relativeDistance = Math.max(boundedDistance - surface.heightModel.distanceOffsetMeters, 0)

    return vertical.baseHeightMeters + Math.tan((surface.heightModel.angleDegrees * Math.PI) / 180) * relativeDistance
  })
}

function buildExpectedRadarMaskAngleHeights(
  ring: PositionCoordinate[],
  vertical: Extract<PolygonObstacleAnalysisState['visibleProtectionZones'][number]['vertical'], { mode: 'analytic_surface' }>,
) {
  expect(vertical.surface.type).toBe('distance_parameterized')

  if (vertical.surface.type !== 'distance_parameterized') {
    throw new Error(`Expected distance_parameterized surface but received ${vertical.surface.type}`)
  }

  const surface = vertical.surface

  if (surface.distanceSource.kind !== 'point' || surface.distanceMetric !== 'radial') {
    throw new Error(
      `Expected point/radial surface but received ${surface.distanceSource.kind}/${surface.distanceMetric}`,
    )
  }

  if (surface.heightModel.type !== 'radar_site_protection_mask_angle') {
    throw new Error(`Expected radar_site_protection_mask_angle but received ${surface.heightModel.type}`)
  }

  const heightModel = surface.heightModel

  const [sourceLongitude, sourceLatitude] = surface.distanceSource.point

  return ring.map(([longitude, latitude]) => {
    const averageLatitude = (sourceLatitude + latitude) / 2
    const deltaLatitudeMeters = (latitude - sourceLatitude) * 111320
    const deltaLongitudeMeters = (longitude - sourceLongitude) * 111320 * Math.cos((averageLatitude * Math.PI) / 180)
    const radialDistanceMeters = Math.sqrt(deltaLatitudeMeters ** 2 + deltaLongitudeMeters ** 2)
    const boundedDistance = Math.min(
      Math.max(radialDistanceMeters, surface.clampRange.startMeters),
      surface.clampRange.endMeters,
    )
    const distanceKilometers = boundedDistance / 1000
    const correction = distanceKilometers / heightModel.distanceKilometersCorrectionDivisor
    const tangent = Math.tan((heightModel.maskAngleDegrees * Math.PI) / 180 + correction)

    return Number.isFinite(tangent)
      ? vertical.baseHeightMeters + tangent * boundedDistance
      : vertical.baseHeightMeters
  })
}

function buildExpectedRadialConeHeights(
  ring: PositionCoordinate[],
  vertical: Extract<PolygonObstacleAnalysisState['visibleProtectionZones'][number]['vertical'], { mode: 'analytic_surface' }>,
) {
  expect(vertical.surface.type).toBe('radial_cone_surface')

  if (vertical.surface.type !== 'radial_cone_surface') {
    throw new Error(`Expected radial_cone_surface but received ${vertical.surface.type}`)
  }

  const surface = vertical.surface
  const [sourceLongitude, sourceLatitude] = surface.distanceSource.point

  return ring.map(([longitude, latitude]) => {
    const averageLatitude = (sourceLatitude + latitude) / 2
    const deltaLatitudeMeters = (latitude - sourceLatitude) * 111320
    const deltaLongitudeMeters = (longitude - sourceLongitude) * 111320 * Math.cos((averageLatitude * Math.PI) / 180)
    const radialDistanceMeters = Math.sqrt(deltaLatitudeMeters ** 2 + deltaLongitudeMeters ** 2)
    const boundedDistance = Math.min(
      Math.max(radialDistanceMeters, surface.clampRange.startMeters),
      surface.clampRange.endMeters,
    )

    if (surface.heightModel.type === 'radar_site_protection_mask_angle') {
      const distanceKilometers = boundedDistance / 1000
      const correction = distanceKilometers / surface.heightModel.distanceKilometersCorrectionDivisor
      const tangent = Math.tan((surface.heightModel.maskAngleDegrees * Math.PI) / 180 + correction)

      return Number.isFinite(tangent)
        ? vertical.baseHeightMeters + tangent * boundedDistance
        : vertical.baseHeightMeters
    }

    const relativeDistance = Math.max(boundedDistance - surface.heightModel.distanceOffsetMeters, 0)

    return vertical.baseHeightMeters + Math.tan((surface.heightModel.angleDegrees * Math.PI) / 180) * relativeDistance
  })
}

function createVisibleRegion(
  overrides: Partial<PolygonObstacleAnalysisState['visibleProtectionZones'][number]> = {},
): PolygonObstacleAnalysisState['visibleProtectionZones'][number] {
  return {
    key: 'airport-1:station-1:zone-a:rule-a:region-north',
    id: 'airport-1-station-1-zone-a-rule-a-region-north',
    airportId: 'airport-1',
    airportName: '天河机场',
    stationId: 'station-1',
    stationName: '导航台A',
    stationType: 'VOR',
    zoneCode: 'zone-a',
    zoneName: 'A区',
    ruleCode: 'rule-a',
    ruleName: '规则A',
    regionCode: 'region-north',
    regionName: '北侧区域',
    geometry: {
      shapeType: 'multipolygon',
      coordinates: [
        [
          [
            [114.2, 30.7],
            [114.21, 30.7],
            [114.21, 30.69],
            [114.2, 30.69],
            [114.2, 30.7],
          ],
        ],
      ],
    },
    vertical: {
      mode: 'flat',
      baseReference: 'station',
      baseHeightMeters: 500,
    },
    properties: {
      label: '北侧区域',
    },
    ...overrides,
  }
}

function createLocRegion3VisibleRegion(
  overrides: Partial<PolygonObstacleAnalysisState['visibleProtectionZones'][number]> = {},
): PolygonObstacleAnalysisState['visibleProtectionZones'][number] {
  return createVisibleRegion({
    vertical: {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 492,
      surface: {
        type: 'loc_building_restriction_zone_region_3',
        stationPoint: [103.938972, 30.561306],
        apexPoint: [103.95397513931144, 30.593665083709087],
        rootLeftPoint: [103.949136618227, 30.59534448405252],
        rootRightPoint: [103.95881349354343, 30.591985503088146],
        arcRadiusMeters: 9865.303478328966,
        arcPoints: [
          [103.95117724149101, 30.649664183802024],
          [103.95562327488403, 30.64911929778665],
          [103.96003752578038, 30.64840710649382],
        ],
        arcHeightMeters: 562,
        alphaDegrees: 15.04,
      },
    },
    ...overrides,
  })
}

function createRadialConeVisibleRegion(
  overrides: Partial<PolygonObstacleAnalysisState['visibleProtectionZones'][number]> = {},
): PolygonObstacleAnalysisState['visibleProtectionZones'][number] {
  return createVisibleRegion({
    geometry: {
      shapeType: 'multipolygon',
      coordinates: [
        [
          [
            [103.991621, 30.614791],
            [104.011621, 30.587841],
            [103.991621, 30.560891],
            [103.971621, 30.587841],
            [103.991621, 30.614791],
          ],
        ],
      ],
    },
    vertical: {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 530,
      surface: {
        type: 'radial_cone_surface',
        distanceSource: {
          kind: 'point',
          point: [103.991621, 30.587841],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 0,
          endMeters: 29999,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 15,
          distanceOffsetMeters: 0,
        },
      },
    },
    ...overrides,
  })
}

function createViewer() {
  const entitiesById = new Map<string, { id: string; polygon?: Record<string, unknown> }>()
  const add = vi.fn((entity: { id: string; polygon?: Record<string, unknown> }) => {
    entitiesById.set(entity.id, entity)
    return entity
  })
  const removeById = vi.fn((id: string) => entitiesById.delete(id))
  const getById = vi.fn((id: string) => entitiesById.get(id))

  return {
    viewer: {
      entities: {
        add,
        removeById,
        getById,
      },
    },
    add,
    removeById,
    getById,
    entitiesById,
  }
}

describe('syncAnalysisLayer', () => {
  const multiPolygonGeometry = {
    shapeType: 'multipolygon' as const,
    coordinates: [
      [
        createRing([
          [114.2, 30.7],
          [114.21, 30.7],
          [114.21, 30.69],
          [114.2, 30.69],
          [114.2, 30.7],
        ]),
      ],
      [
        createRing([
          [114.22, 30.71],
          [114.23, 30.71],
          [114.23, 30.7],
          [114.22, 30.7],
          [114.22, 30.71],
        ]),
      ],
    ],
  } satisfies ProtectionZoneMultipolygonGeometry

  const holeGeometry = {
    shapeType: 'multipolygon' as const,
    coordinates: [
      [
        createRing([
          [103.94, 30.56],
          [103.95, 30.56],
          [103.95, 30.55],
          [103.94, 30.55],
          [103.94, 30.56],
        ]),
        createRing([
          [103.944, 30.557],
          [103.946, 30.557],
          [103.946, 30.553],
          [103.944, 30.553],
          [103.944, 30.557],
        ]),
      ],
    ],
  } satisfies ProtectionZoneMultipolygonGeometry

  it('adds one entity for a single multipolygon region', () => {
    const { viewer, add, removeById, entitiesById } = createViewer()

    const result = syncAnalysisLayer(viewer as never, [createVisibleRegion()])
    const hierarchy = add.mock.calls[0][0].polygon?.hierarchy

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(add.mock.calls[0][0].polygon?.perPositionHeight).toBe(false)
    expect(add.mock.calls[0][0].polygon?.outline).toBe(false)
    expect(add.mock.calls[0][0].polygon?.height).toBe(500)
    expect(add.mock.calls[0][0].polygon?.extrudedHeight).toBeUndefined()
    expectHierarchyToMatchRing(
      hierarchy,
      createVisibleRegion().geometry.coordinates[0][0],
      [500, 500, 500, 500, 500],
    )
    expect(result.addedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
    expect(result.updatedKeys).toEqual([])
    expect(removeById).not.toHaveBeenCalled()
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')).toBe(true)
  })

  it('preserves holes for a multipolygon polygon with inner rings', () => {
    const { viewer, add } = createViewer()
    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: holeGeometry,
        vertical: {
          mode: 'flat',
          baseReference: 'station',
          baseHeightMeters: 492,
        },
      }),
    ])

    const hierarchy = add.mock.calls[0][0].polygon?.hierarchy
    const holes = toHoleHierarchyPoints(hierarchy)

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].polygon?.perPositionHeight).toBe(false)
    expect(add.mock.calls[0][0].polygon?.height).toBe(492)
    expect(holes).toHaveLength(1)
    expectHierarchyToMatchRing(hierarchy, holeGeometry.coordinates[0][0], [492, 492, 492, 492, 492])
    expectHierarchyToMatchRing((hierarchy as Cesium.PolygonHierarchy).holes[0], holeGeometry.coordinates[0][1], [492, 492, 492, 492, 492])
  })

  it('renders distance_parameterized point+radial with no holes as triangle fan', () => {
    const { viewer, add } = createViewer()
    const center: [number, number] = [114.2, 30.69]
    const ring = createRing([
      [114.19, 30.70],
      [114.21, 30.70],
      [114.21, 30.68],
      [114.19, 30.68],
      [114.19, 30.70],
    ])
    const vertical = {
      mode: 'analytic_surface' as const,
      baseReference: 'station' as const,
      baseHeightMeters: 500,
      surface: {
        type: 'distance_parameterized' as const,
        distanceSource: {
          kind: 'point' as const,
          point: center,
        },
        distanceMetric: 'radial' as const,
        clampRange: {
          startMeters: 0,
          endMeters: 5000,
        },
        heightModel: {
          type: 'angle_linear_rise' as const,
          angleDegrees: 3,
          distanceOffsetMeters: 0,
        },
      },
    }
    const expectedHeights = buildExpectedAnalyticHeights(ring, vertical)

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [[ring]],
        },
        vertical,
      }),
    ])

    expect(add).toHaveBeenCalledTimes(ring.length - 1)
    expect(add.mock.calls.every((call) => call[0].polygon?.perPositionHeight === true)).toBe(true)
    expect(add.mock.calls.every((call) => call[0].polygon?.height === undefined)).toBe(true)
    expect(add.mock.calls.every((call) => call[0].polygon?.outline === false)).toBe(true)

    for (let index = 0; index < ring.length - 1; index += 1) {
      expectHierarchyToMatchRing(
        add.mock.calls[index][0].polygon?.hierarchy,
        [center, ring[index], ring[index + 1], center],
        [vertical.baseHeightMeters, expectedHeights[index], expectedHeights[index + 1], vertical.baseHeightMeters],
      )
    }
  })

  it('renders distance_parameterized point+radial ring as triangle strip', () => {
    const { viewer, add } = createViewer()
    const center: [number, number] = [114.2, 30.69]
    const outerRing = createRing([
      [114.18, 30.71],
      [114.18, 30.67],
      [114.22, 30.67],
      [114.22, 30.71],
      [114.18, 30.71],
    ])
    const innerRing = createRing([
      [114.19, 30.70],
      [114.21, 30.70],
      [114.21, 30.68],
      [114.19, 30.68],
      [114.19, 30.70],
    ])
    const vertical = {
      mode: 'analytic_surface' as const,
      baseReference: 'station' as const,
      baseHeightMeters: 500,
      surface: {
        type: 'distance_parameterized' as const,
        distanceSource: {
          kind: 'point' as const,
          point: center,
        },
        distanceMetric: 'radial' as const,
        clampRange: {
          startMeters: 0,
          endMeters: 5000,
        },
        heightModel: {
          type: 'angle_linear_rise' as const,
          angleDegrees: 3,
          distanceOffsetMeters: 0,
        },
      },
    }
    const outerHeights = buildExpectedAnalyticHeights(outerRing, vertical)
    const innerHeights = buildExpectedAnalyticHeights(innerRing, vertical)
    const vertexCount = outerRing.length - 1

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [[outerRing, innerRing]],
        },
        vertical,
      }),
    ])

    expect(add).toHaveBeenCalledTimes(vertexCount * 2)
    expect(add.mock.calls.every((call) => call[0].polygon?.perPositionHeight === true)).toBe(true)
    expect(add.mock.calls.every((call) => call[0].polygon?.height === undefined)).toBe(true)
    expect(add.mock.calls.every((call) => call[0].polygon?.outline === false)).toBe(true)

    function innerIdx(segmentIndex: number) {
      return segmentIndex === 0 ? 0 : vertexCount - segmentIndex
    }

    for (let i = 0; i < vertexCount; i += 1) {
      const il = innerIdx(i)
      const ih = innerIdx(i + 1)

      expectHierarchyToMatchRing(
        add.mock.calls[i * 2][0].polygon?.hierarchy,
        [outerRing[i], outerRing[i + 1], innerRing[il], outerRing[i]],
        [outerHeights[i], outerHeights[i + 1], innerHeights[il], outerHeights[i]],
      )

      expectHierarchyToMatchRing(
        add.mock.calls[i * 2 + 1][0].polygon?.hierarchy,
        [outerRing[i + 1], innerRing[ih], innerRing[il], outerRing[i + 1]],
        [outerHeights[i + 1], innerHeights[ih], innerHeights[il], outerHeights[i + 1]],
      )
    }
  })

  it('renders radar_site_protection_mask_angle point+radial ring as triangle strip', () => {
    const { viewer, add } = createViewer()
    const center: [number, number] = [103.935511, 30.542172]
    const outerRing = createRing([
      [103.94, 30.56],
      [103.94, 30.55],
      [103.95, 30.55],
      [103.95, 30.56],
      [103.94, 30.56],
    ])
    const innerRing = createRing([
      [103.944, 30.557],
      [103.946, 30.557],
      [103.946, 30.553],
      [103.944, 30.553],
      [103.944, 30.557],
    ])
    const vertical = {
      mode: 'analytic_surface' as const,
      baseReference: 'station' as const,
      baseHeightMeters: 525,
      surface: {
        type: 'distance_parameterized' as const,
        distanceSource: {
          kind: 'point' as const,
          point: center,
        },
        distanceMetric: 'radial' as const,
        clampRange: {
          startMeters: 0,
          endMeters: 30000,
        },
        heightModel: {
          type: 'radar_site_protection_mask_angle' as const,
          angleDegrees: null,
          distanceOffsetMeters: 0,
          maskAngleDegrees: 0.25,
          distanceKilometersCorrectionDivisor: 16970,
        },
      },
    }
    const outerHeights = buildExpectedRadarMaskAngleHeights(outerRing, vertical)
    const innerHeights = buildExpectedRadarMaskAngleHeights(innerRing, vertical)
    const vertexCount = outerRing.length - 1

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [[outerRing, innerRing]],
        },
        vertical,
      }),
    ])

    expect(add).toHaveBeenCalledTimes(vertexCount * 2)
    expect(add.mock.calls.every((call) => call[0].polygon?.perPositionHeight === true)).toBe(true)
    expect(add.mock.calls.every((call) => call[0].polygon?.height === undefined)).toBe(true)

    function innerIdx(segmentIndex: number) {
      return segmentIndex === 0 ? 0 : vertexCount - segmentIndex
    }

    for (let i = 0; i < vertexCount; i += 1) {
      const il = innerIdx(i)
      const ih = innerIdx(i + 1)

      expectHierarchyToMatchRing(
        add.mock.calls[i * 2][0].polygon?.hierarchy,
        [outerRing[i], outerRing[i + 1], innerRing[il], outerRing[i]],
        [outerHeights[i], outerHeights[i + 1], innerHeights[il], outerHeights[i]],
      )

      expectHierarchyToMatchRing(
        add.mock.calls[i * 2 + 1][0].polygon?.hierarchy,
        [outerRing[i + 1], innerRing[ih], innerRing[il], outerRing[i + 1]],
        [outerHeights[i + 1], innerHeights[ih], innerHeights[il], outerHeights[i + 1]],
      )
    }
  })

  it('renders front_reference_line analytic_surface regions through the per-position-height path', () => {
    const { viewer, add } = createViewer()
    const vertical = {
      mode: 'analytic_surface' as const,
      baseReference: 'gp360_altitude' as const,
      baseHeightMeters: 493.8,
      surface: {
        type: 'distance_parameterized' as const,
        distanceSource: {
          kind: 'front_reference_line' as const,
          stationPoint: [103.942962, 30.594308] as [number, number],
          centerPoint: [103.952962, 30.594308] as [number, number],
          leftPoint: [103.952492, 30.594308] as [number, number],
          rightPoint: [103.953432, 30.594308] as [number, number],
        },
        distanceMetric: 'axial_from_reference_line' as const,
        planarControl: {
          frontOffsetMeters: 350,
          halfAngleDegrees: 15,
          radiusMeters: 18160,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 18160,
        },
        heightModel: {
          type: 'angle_linear_rise' as const,
          angleDegrees: 1,
          distanceOffsetMeters: 120,
        },
      },
    }
    const ring = createRing([
      [103.95282, 30.594308],
      [103.95282, 30.595308],
      [103.953104, 30.595308],
      [103.953104, 30.594308],
      [103.95282, 30.594308],
    ])

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [[ring]],
        },
        vertical,
      }),
    ])

    const polygon = add.mock.calls[0][0].polygon

    expect(add).toHaveBeenCalledTimes(1)
    expect(polygon?.perPositionHeight).toBe(true)
    expect(polygon?.height).toBeUndefined()
    expectHierarchyToMatchRing(polygon?.hierarchy, ring, buildExpectedAnalyticHeights(ring, vertical))
  })

  it('renders loc_building_restriction_zone_region_3 as fan triangles plus side closing triangles', () => {
    const { viewer, add } = createViewer()

    syncAnalysisLayer(viewer as never, [createLocRegion3VisibleRegion()])

    expect(add).toHaveBeenCalledTimes(4)
    expect(add.mock.calls.map((call) => call[0].id)).toEqual([
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0',
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1',
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-2',
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-3',
    ])
    expect(add.mock.calls.every((call) => call[0].polygon?.outline === false)).toBe(true)

    const firstHierarchy = add.mock.calls[0][0].polygon?.hierarchy
    const secondHierarchy = add.mock.calls[1][0].polygon?.hierarchy
    const leftClosingHierarchy = add.mock.calls[2][0].polygon?.hierarchy
    const rightClosingHierarchy = add.mock.calls[3][0].polygon?.hierarchy

    expect(add.mock.calls[0][0].polygon?.perPositionHeight).toBe(true)
    expect(add.mock.calls[0][0].polygon?.height).toBeUndefined()

    expectHierarchyToMatchRing(
      firstHierarchy,
      [
        [103.95397513931144, 30.593665083709087],
        [103.95117724149101, 30.649664183802024],
        [103.95562327488403, 30.64911929778665],
        [103.95397513931144, 30.593665083709087],
      ],
      [492, 562, 562, 492],
    )

    expectHierarchyToMatchRing(
      secondHierarchy,
      [
        [103.95397513931144, 30.593665083709087],
        [103.95562327488403, 30.64911929778665],
        [103.96003752578038, 30.64840710649382],
        [103.95397513931144, 30.593665083709087],
      ],
      [492, 562, 562, 492],
    )

    expectHierarchyToMatchRing(
      leftClosingHierarchy,
      [
        [103.95397513931144, 30.593665083709087],
        [103.949136618227, 30.59534448405252],
        [103.95117724149101, 30.649664183802024],
        [103.95397513931144, 30.593665083709087],
      ],
      [492, 492, 562, 492],
    )

    expectHierarchyToMatchRing(
      rightClosingHierarchy,
      [
        [103.95397513931144, 30.593665083709087],
        [103.95881349354343, 30.591985503088146],
        [103.96003752578038, 30.64840710649382],
        [103.95397513931144, 30.593665083709087],
      ],
      [492, 492, 562, 492],
    )
  })

  it('renders radial_cone_surface as one triangle entity per outer ring segment', () => {
    const { viewer, add } = createViewer()
    const region = createRadialConeVisibleRegion()
    const ring = region.geometry.coordinates[0][0]

    syncAnalysisLayer(viewer as never, [region])

    expect(add).toHaveBeenCalledTimes(ring.length - 1)
    expect(add.mock.calls.every((call) => call[0].polygon?.perPositionHeight === true)).toBe(true)
    expect(add.mock.calls.every((call) => call[0].polygon?.height === undefined)).toBe(true)
  })

  it('builds each radial_cone_surface triangle as center, current ring point, next ring point, center', () => {
    const { viewer, add } = createViewer()
    const region = createRadialConeVisibleRegion()
    const ring = region.geometry.coordinates[0][0]
    const center = region.vertical.mode === 'analytic_surface'
      && region.vertical.surface.type === 'radial_cone_surface'
      ? region.vertical.surface.distanceSource.point
      : null
    const expectedHeights = buildExpectedRadialConeHeights(ring, region.vertical as Extract<PolygonObstacleAnalysisState['visibleProtectionZones'][number]['vertical'], { mode: 'analytic_surface' }>)

    syncAnalysisLayer(viewer as never, [region])

    expect(center).not.toBeNull()

    for (let index = 0; index < ring.length - 1; index += 1) {
      expectHierarchyToMatchRing(
        add.mock.calls[index][0].polygon?.hierarchy,
        [center as [number, number], ring[index], ring[index + 1], center as [number, number]],
        [region.vertical.baseHeightMeters, expectedHeights[index], expectedHeights[index + 1], region.vertical.baseHeightMeters],
      )
    }
  })

  it('keeps the first and last point of every radial_cone_surface triangle at the center base height', () => {
    const { viewer, add } = createViewer()
    const region = createRadialConeVisibleRegion()
    const center = region.vertical.mode === 'analytic_surface'
      && region.vertical.surface.type === 'radial_cone_surface'
      ? region.vertical.surface.distanceSource.point
      : null

    syncAnalysisLayer(viewer as never, [region])

    expect(center).not.toBeNull()

    for (const call of add.mock.calls) {
      const positions = toHierarchyPoints(call[0].polygon?.hierarchy)

      expect(positions[0]?.longitude).toBeCloseTo((center as [number, number])[0], 10)
      expect(positions[0]?.latitude).toBeCloseTo((center as [number, number])[1], 10)
      expect(positions[0]?.height).toBeCloseTo(region.vertical.baseHeightMeters, 6)
      expect(positions[positions.length - 1]?.longitude).toBeCloseTo((center as [number, number])[0], 10)
      expect(positions[positions.length - 1]?.latitude).toBeCloseTo((center as [number, number])[1], 10)
      expect(positions[positions.length - 1]?.height).toBeCloseTo(region.vertical.baseHeightMeters, 6)
    }
  })

  it('uses radar_site_protection_mask_angle heights for radial_cone_surface outer vertices', () => {
    const { viewer, add } = createViewer()
    const region = createRadialConeVisibleRegion({
      vertical: {
        mode: 'analytic_surface',
        baseReference: 'station',
        baseHeightMeters: 530,
        surface: {
          type: 'radial_cone_surface',
          distanceSource: {
            kind: 'point',
            point: [103.991621, 30.587841],
          },
          distanceMetric: 'radial',
          clampRange: {
            startMeters: 0,
            endMeters: 29999,
          },
          heightModel: {
            type: 'radar_site_protection_mask_angle',
            angleDegrees: null,
            distanceOffsetMeters: 0,
            maskAngleDegrees: 0.25,
            distanceKilometersCorrectionDivisor: 16970,
          },
        },
      },
    })
    const ring = region.geometry.coordinates[0][0]
    const expectedHeights = buildExpectedRadialConeHeights(ring, region.vertical as Extract<PolygonObstacleAnalysisState['visibleProtectionZones'][number]['vertical'], { mode: 'analytic_surface' }>)

    syncAnalysisLayer(viewer as never, [region])

    for (let index = 0; index < ring.length - 1; index += 1) {
      const positions = toHierarchyPoints(add.mock.calls[index][0].polygon?.hierarchy)

      expect(positions[1]?.height).toBeCloseTo(expectedHeights[index] ?? Number.NaN, 6)
      expect(positions[2]?.height).toBeCloseTo(expectedHeights[index + 1] ?? Number.NaN, 6)
    }
  })

  it('uses region style fill as polygon material when provided', () => {
    const { viewer, add } = createViewer()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        style: {
          fill: 'rgba(255, 165, 0, 0.25)',
        },
      }),
    ])

    const material = add.mock.calls[0][0].polygon?.material as Cesium.Color

    expect(material.equals(Cesium.Color.fromCssColorString('rgba(255, 165, 0, 0.25)'))).toBe(true)
  })

  it('falls back to the default material color when style fill is invalid', () => {
    const { viewer, add } = createViewer()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        style: {
          fill: 'not-a-color',
        },
      }),
    ])

    const material = add.mock.calls[0][0].polygon?.material as Cesium.Color

    expect(material.equals(Cesium.Color.fromCssColorString('#4db3ff').withAlpha(0.28))).toBe(true)
  })

  it('rebuilds region entities when only fill color changes', () => {
    const { viewer, add, removeById } = createViewer()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        style: {
          fill: 'rgba(255, 165, 0, 0.25)',
        },
      }),
    ])
    add.mockClear()
    removeById.mockClear()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        style: {
          fill: 'rgba(255, 0, 0, 0.25)',
        },
      }),
    ])

    expect(removeById).toHaveBeenCalledTimes(1)
    expect(removeById).toHaveBeenCalledWith('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(add).toHaveBeenCalledTimes(1)
    const material = add.mock.calls[0][0].polygon?.material as Cesium.Color
    expect(material.equals(Cesium.Color.fromCssColorString('rgba(255, 0, 0, 0.25)'))).toBe(true)
  })

  it('renders all polygons from a multipolygon region', () => {
    const { viewer, add, entitiesById } = createViewer()

    const result = syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [
            [
              createRing([
                [114.2, 30.7],
                [114.21, 30.7],
                [114.21, 30.69],
                [114.2, 30.69],
                [114.2, 30.7],
              ]),
            ],
            [
              createRing([
                [114.22, 30.71],
                [114.23, 30.71],
                [114.23, 30.7],
                [114.22, 30.7],
                [114.22, 30.71],
              ]),
            ],
          ],
        } satisfies ProtectionZoneMultipolygonGeometry,
      }),
    ])

    expect(add).toHaveBeenCalledTimes(2)
    expect(add.mock.calls[0][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(add.mock.calls[1][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1')
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')).toBe(true)
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1')).toBe(true)
    expect(result.addedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
  })

  it('rebuilds all cached entity ids for a region when its multipolygon changes', () => {
    const { viewer, add, removeById } = createViewer()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [
            [
              [
                [114.2, 30.7],
                [114.21, 30.7],
                [114.21, 30.69],
                [114.2, 30.69],
                [114.2, 30.7],
              ],
            ],
            [
              [
                [114.22, 30.71],
                [114.23, 30.71],
                [114.23, 30.7],
                [114.22, 30.7],
                [114.22, 30.71],
              ],
            ],
          ],
        },
      }),
    ])
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [
            [
              createRing([
                [114.2, 30.7],
                [114.215, 30.7],
                [114.215, 30.685],
                [114.2, 30.685],
                [114.2, 30.7],
              ]),
            ],
            [
              createRing([
                [114.225, 30.715],
                [114.235, 30.715],
                [114.235, 30.705],
                [114.225, 30.705],
                [114.225, 30.715],
              ]),
            ],
          ],
        } satisfies ProtectionZoneMultipolygonGeometry,
      }),
    ])

    expect(removeById).toHaveBeenCalledTimes(2)
    expect(removeById).toHaveBeenNthCalledWith(1, 'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(removeById).toHaveBeenNthCalledWith(2, 'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1')
    expect(add).toHaveBeenCalledTimes(2)
    expect(add.mock.calls[0][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(add.mock.calls[1][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1')
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
  })

  it('removes all stale entity ids when a region is no longer visible', () => {
    const { viewer, add, removeById, entitiesById } = createViewer()

    syncAnalysisLayer(
      viewer as never,
      [
        createVisibleRegion({
          geometry: multiPolygonGeometry,
        }),
        createVisibleRegion({
          key: 'airport-1:station-1:zone-a:rule-a:region-south',
          id: 'airport-1-station-1-zone-a-rule-a-region-south',
          regionCode: 'region-south',
          regionName: '南侧区域',
        }),
      ],
    )
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [createVisibleRegion({ geometry: multiPolygonGeometry })])

    expect(removeById).toHaveBeenCalledTimes(1)
    expect(removeById).toHaveBeenCalledWith('analysis-zone-airport-1:station-1:zone-a:rule-a:region-south-0')
    expect(add).not.toHaveBeenCalled()
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual([])
    expect(result.removedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-south'])
    expect(result.message).toBe('分析保护区已同步到地图图层。')
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-south-0')).toBe(false)
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1')).toBe(true)
  })

  it('returns no-op when the same multipolygon region is synced twice', () => {
    const { viewer, add, removeById } = createViewer()

    syncAnalysisLayer(viewer as never, [createVisibleRegion()])
    const firstEntity = viewer.entities.getById('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [createVisibleRegion()])
    const secondEntity = viewer.entities.getById('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')

    expect(add).not.toHaveBeenCalled()
    expect(removeById).not.toHaveBeenCalled()
    expect(secondEntity).toBe(firstEntity)
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual([])
    expect(result.removedKeys).toEqual([])
    expect(result.message).toBe('分析保护区无增量变化。')
  })

  it('rebuilds changed regions in place while keeping stable entity ids', () => {
    const { viewer, add, removeById } = createViewer()

    syncAnalysisLayer(viewer as never, [createVisibleRegion()])
    const originalEntity = viewer.entities.getById('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        vertical: {
          mode: 'flat',
          baseReference: 'station',
          baseHeightMeters: 540,
        },
      }),
    ])

    const rebuiltEntity = viewer.entities.getById('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')

    expect(removeById).toHaveBeenCalledWith('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(rebuiltEntity).not.toBe(originalEntity)
    expect(rebuiltEntity?.polygon?.height).toBe(540)
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
    expect(result.removedKeys).toEqual([])
  })

  it('rebuilds all cached triangle entity ids for loc_building_restriction_zone_region_3 updates', () => {
    const { viewer, add, removeById } = createViewer()

    syncAnalysisLayer(viewer as never, [createLocRegion3VisibleRegion()])
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [
      createLocRegion3VisibleRegion({
        vertical: {
          mode: 'analytic_surface',
          baseReference: 'station',
          baseHeightMeters: 500,
          surface: {
            type: 'loc_building_restriction_zone_region_3',
            stationPoint: [103.938972, 30.561306],
            apexPoint: [103.95397513931144, 30.593665083709087],
            rootLeftPoint: [103.949136618227, 30.59534448405252],
            rootRightPoint: [103.95881349354343, 30.591985503088146],
            arcRadiusMeters: 9865.303478328966,
            arcPoints: [
              [103.95117724149101, 30.649664183802024],
              [103.956, 30.6492],
              [103.96003752578038, 30.64840710649382],
            ],
            arcHeightMeters: 570,
            alphaDegrees: 15.04,
          },
        },
      }),
    ])

    expect(removeById).toHaveBeenCalledTimes(4)
    expect(removeById).toHaveBeenNthCalledWith(1, 'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')
    expect(removeById).toHaveBeenNthCalledWith(2, 'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1')
    expect(removeById).toHaveBeenNthCalledWith(3, 'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-2')
    expect(removeById).toHaveBeenNthCalledWith(4, 'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-3')
    expect(add).toHaveBeenCalledTimes(4)
    expect(add.mock.calls.map((call) => call[0].id)).toEqual([
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0',
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-1',
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-2',
      'analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-3',
    ])
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
    expect(result.removedKeys).toEqual([])
  })

  it('fails fast when an unexpected vertical mode reaches the analytic layer', () => {
    const { viewer } = createViewer()

    expect(() => syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        vertical: {
          mode: 'unexpected-mode',
        } as never,
      }),
    ])).toThrow('Unsupported protection zone vertical mode: unexpected-mode')
  })
})
