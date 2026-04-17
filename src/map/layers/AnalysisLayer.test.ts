import { describe, expect, it, vi } from 'vitest'
import { syncAnalysisLayer } from './AnalysisLayer'
import type { PolygonObstacleAnalysisState } from '../../types/tool'

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
      shapeType: 'circle',
      center: {
        longitude: 114.2,
        latitude: 30.7,
      },
      radiusMeters: 500,
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

function createSampling(): PolygonObstacleAnalysisState['protectionZoneSampling'] {
  return {
    circleAngleStepDegrees: 5,
    sectorAngleStepDegrees: 5,
  }
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
  it('adds missing entities for visible regions', () => {
    const { viewer, add, removeById, entitiesById } = createViewer()

    const result = syncAnalysisLayer(viewer as never, [createVisibleRegion()], createSampling())

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north')
    expect(add.mock.calls[0][0].polygon?.perPositionHeight).toBe(false)
    expect(add.mock.calls[0][0].polygon?.height).toBe(500)
    expect(add.mock.calls[0][0].polygon?.extrudedHeight).toBeUndefined()
    expect(result.addedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
    expect(result.updatedKeys).toEqual([])
    expect(removeById).not.toHaveBeenCalled()
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north')).toBe(true)
  })

  it('renders sector analytic surfaces with per-position heights', () => {
    const { viewer, add } = createViewer()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'sector',
          center: {
            longitude: 114.2,
            latitude: 30.7,
          },
          innerRadiusMeters: 50,
          outerRadiusMeters: 500,
          startAzimuthDegrees: 0,
          endAzimuthDegrees: 90,
        },
        vertical: {
          mode: 'analytic_surface',
          baseReference: 'station',
          baseHeightMeters: 500,
          heightFunction: {
            type: 'elevation_angle',
            distanceMetric: 'radial',
            elevationAngleDegrees: 3,
            startDistanceMeters: 50,
            endDistanceMeters: 500,
          },
        },
      }),
    ], createSampling())

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].polygon?.perPositionHeight).toBe(true)
    expect(add.mock.calls[0][0].polygon?.height).toBeUndefined()
    expect(add.mock.calls[0][0].polygon?.extrudedHeight).toBeUndefined()
  })

  it('renders radial band analytic surfaces as a 360 degree ring with per-position heights', () => {
    const { viewer, add } = createViewer()

    syncAnalysisLayer(viewer as never, [
      createVisibleRegion({
        geometry: {
          shapeType: 'radial_band',
          center: {
            longitude: 103.935861,
            latitude: 30.554611,
          },
          innerRadiusMeters: 50,
          outerRadiusMeters: 37040,
        },
        vertical: {
          mode: 'analytic_surface',
          baseReference: 'station',
          baseHeightMeters: 491.1,
          heightFunction: {
            type: 'elevation_angle',
            distanceMetric: 'radial',
            elevationAngleDegrees: 3,
            startDistanceMeters: 50,
            endDistanceMeters: 37040,
          },
        },
      }),
    ], createSampling())

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].polygon?.perPositionHeight).toBe(true)
    expect(add.mock.calls[0][0].polygon?.height).toBeUndefined()
    expect(add.mock.calls[0][0].polygon?.extrudedHeight).toBeUndefined()
    expect((add.mock.calls[0][0].polygon?.hierarchy as { holes?: unknown[] } | undefined)?.holes).toHaveLength(1)
  })

  it('rebuilds only the changed region key when visible region content changes', () => {
    const { viewer, add, removeById } = createViewer()
    const sampling = createSampling()
    const initialRegion = createVisibleRegion({
      geometry: {
        shapeType: 'circle',
        center: {
          longitude: 114.2,
          latitude: 30.7,
        },
        radiusMeters: 500,
      },
    })

    syncAnalysisLayer(viewer as never, [initialRegion], sampling)
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(
      viewer as never,
      [
        createVisibleRegion({
          geometry: {
            shapeType: 'circle',
            center: {
              longitude: 114.2,
              latitude: 30.7,
            },
            radiusMeters: 900,
          },
        }),
      ],
      sampling,
    )

    expect(removeById).toHaveBeenCalledTimes(1)
    expect(removeById).toHaveBeenCalledWith('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north')
    expect(add).toHaveBeenCalledTimes(1)
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-north'])
  })

  it('removes stale entity ids when a region is no longer visible', () => {
    const { viewer, add, removeById, entitiesById } = createViewer()
    const sampling = createSampling()

    syncAnalysisLayer(
      viewer as never,
      [
        createVisibleRegion(),
        createVisibleRegion({
          key: 'airport-1:station-1:zone-a:rule-a:region-south',
          id: 'airport-1-station-1-zone-a-rule-a-region-south',
          regionCode: 'region-south',
          regionName: '南侧区域',
        }),
      ],
      sampling,
    )
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [createVisibleRegion()], sampling)

    expect(removeById).toHaveBeenCalledTimes(1)
    expect(removeById).toHaveBeenCalledWith('analysis-zone-airport-1:station-1:zone-a:rule-a:region-south')
    expect(add).not.toHaveBeenCalled()
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual([])
    expect(result.removedKeys).toEqual(['airport-1:station-1:zone-a:rule-a:region-south'])
    expect(result.message).toBe('分析保护区已同步到地图图层。')
    expect(entitiesById.has('analysis-zone-airport-1:station-1:zone-a:rule-a:region-south')).toBe(false)
  })

  it('returns no-op when the same region and sampling are synced twice', () => {
    const { viewer, add, removeById } = createViewer()
    const sampling = createSampling()

    syncAnalysisLayer(viewer as never, [createVisibleRegion()], sampling)
    add.mockClear()
    removeById.mockClear()

    const result = syncAnalysisLayer(viewer as never, [createVisibleRegion()], sampling)

    expect(add).not.toHaveBeenCalled()
    expect(removeById).not.toHaveBeenCalled()
    expect(result.addedKeys).toEqual([])
    expect(result.updatedKeys).toEqual([])
    expect(result.removedKeys).toEqual([])
    expect(result.message).toBe('分析保护区无增量变化。')
  })
})
