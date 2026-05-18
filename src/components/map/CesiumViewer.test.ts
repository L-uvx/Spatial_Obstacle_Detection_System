// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Cesium from 'cesium'
import CesiumViewer from './CesiumViewer.vue'
import { rebuildAnalysisLayer, applyAnalysisVisibility } from '../../map/layers/AnalysisLayer'
import { buildCameraFlyToOptions, buildTopDownView, getInitialCameraKey, resolveResetCameraTarget } from './camera'
import { getObstacleFlyToOptions, type ObstacleLayerSyncResult } from '../../map/layers/ObstacleLayer'
import { syncStationLayer } from '../../map/layers/StationLayer'
import type { InitialCameraTarget, PolygonObstacleAnalysisState, RenderedObstacle, RenderedStation } from '../../types/tool'

const { syncObstacleLayerMock, rebuildObstacleLayerMock, rebuildAnalysisLayerMock, applyAnalysisVisibilityMock, syncStationLayerMock, flyToMock, flyToBoundingSphereMock, addImageryProviderMock, dataSourcesAddMock, dataSourcesRemoveMock, destroyMock } = vi.hoisted(() => ({
  syncObstacleLayerMock: vi.fn(),
  rebuildObstacleLayerMock: vi.fn(),
  rebuildAnalysisLayerMock: vi.fn(),
  applyAnalysisVisibilityMock: vi.fn(),
  syncStationLayerMock: vi.fn(),
  flyToMock: vi.fn(),
  flyToBoundingSphereMock: vi.fn(),
  addImageryProviderMock: vi.fn(),
  dataSourcesAddMock: vi.fn(),
  dataSourcesRemoveMock: vi.fn(),
  destroyMock: vi.fn(),
}))

vi.mock('cesium', async () => {
  const actual = await vi.importActual<typeof import('cesium')>('cesium')

  return {
    ...actual,
    createWorldTerrainAsync: vi.fn(async () => ({}) as Cesium.TerrainProvider),
    Viewer: vi.fn(
      () =>
        ({
          camera: {
            flyTo: flyToMock,
            flyToBoundingSphere: flyToBoundingSphereMock,
            get positionCartographic() {
              return Cesium.Cartographic.fromDegrees(114.21, 30.77, 5000)
            },
          },
          imageryLayers: {
            addImageryProvider: addImageryProviderMock,
          },
          dataSources: {
            add: dataSourcesAddMock,
            remove: dataSourcesRemoveMock,
          },
          scene: {
            globe: {
              depthTestAgainstTerrain: false,
            },
          },
          isDestroyed: () => false,
          destroy: destroyMock,
        }) as unknown as Cesium.Viewer,
    ),
    CustomDataSource: vi.fn(),
  }
})

vi.mock('../../map/layers/ObstacleLayer', async () => {
  const actual = await vi.importActual<typeof import('../../map/layers/ObstacleLayer')>(
    '../../map/layers/ObstacleLayer',
  )

  return {
    ...actual,
    syncObstacleLayer: syncObstacleLayerMock,
    rebuildObstacleLayer: rebuildObstacleLayerMock,
  }
})

vi.mock('../../map/layers/AnalysisLayer', async () => {
  const actual = await vi.importActual<typeof import('../../map/layers/AnalysisLayer')>(
    '../../map/layers/AnalysisLayer',
  )

  return {
    ...actual,
    rebuildAnalysisLayer: rebuildAnalysisLayerMock,
    applyAnalysisVisibility: applyAnalysisVisibilityMock,
  }
})

vi.mock('../../map/layers/StationLayer', async () => {
  const actual = await vi.importActual<typeof import('../../map/layers/StationLayer')>(
    '../../map/layers/StationLayer',
  )

  return {
    ...actual,
    syncStationLayer: syncStationLayerMock,
  }
})

vi.mock('../../utils/tiandituTerrain', () => ({
  createTiandituTerrainProvider: vi.fn(() => ({}) as Cesium.TerrainProvider),
}))

function createObstacle(id: string): RenderedObstacle {
  return {
    id,
    name: `障碍物-${id}`,
    obstacleType: '建筑物/构建物',
    topElevation: 549.9,
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [103.9758638888889, 30.506880555555554],
            [103.97811111111112, 30.50565],
            [103.97690833333334, 30.50386388888889],
            [103.97425, 30.50510277777778],
            [103.97421944444444, 30.505241666666667],
            [103.9758638888889, 30.506880555555554],
          ],
        ],
      ],
    },
  }
}

function createBootstrapTarget(): InitialCameraTarget {
  return {
    longitude: 103.95056,
    latitude: 30.57972,
    height: 10000,
    pitch: -90,
  }
}

function createStation(id: string, overrides: Partial<RenderedStation> = {}): RenderedStation {
  return {
    id,
    airportId: 'airport-1',
    name: `台站-${id}`,
    stationType: 'NDB',
    longitude: 103.935861,
    latitude: 30.554611,
    altitude: 491.1,
    ...overrides,
  }
}

function createVisibleProtectionZoneRegion(
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
            [114.205, 30.7],
            [114.205, 30.695],
            [114.2, 30.695],
            [114.2, 30.7],
          ],
          [
            [114.201, 30.699],
            [114.204, 30.699],
            [114.204, 30.696],
            [114.201, 30.696],
            [114.201, 30.699],
          ],
        ],
      ],
    },
    vertical: {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 500,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'point',
          point: [0, 0],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 50,
          endMeters: 5000,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 3,
          distanceOffsetMeters: 50,
        },
      },
    },
    properties: {
      label: '北侧区域',
    },
    ...overrides,
  }
}

function createFlatVisibleProtectionZoneRegion(
  overrides: Partial<PolygonObstacleAnalysisState['visibleProtectionZones'][number]> = {},
): PolygonObstacleAnalysisState['visibleProtectionZones'][number] {
  return createVisibleProtectionZoneRegion({
    key: 'airport-1:station-1:zone-a:rule-a:region-flat',
    id: 'airport-1-station-1-zone-a-rule-a-region-flat',
    regionCode: 'region-flat',
    regionName: '平面区域',
    vertical: {
      mode: 'flat',
      baseReference: 'station',
      baseHeightMeters: 500,
    },
    properties: {
      label: '平面区域',
    },
    ...overrides,
  })
}

function createLocRegion3VisibleProtectionZoneRegion(
  overrides: Partial<PolygonObstacleAnalysisState['visibleProtectionZones'][number]> = {},
): PolygonObstacleAnalysisState['visibleProtectionZones'][number] {
  return createVisibleProtectionZoneRegion({
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

function createSyncResult(overrides: Partial<ObstacleLayerSyncResult> = {}): ObstacleLayerSyncResult {
  return {
    message: '障碍物已同步到地图图层。',
    addedEntityIds: [],
    ...overrides,
  }
}

describe('resolveResetCameraTarget', () => {
  it('prefers the bootstrap airport target when available', () => {
    const bootstrapTarget = createBootstrapTarget()

    expect(resolveResetCameraTarget(bootstrapTarget)).toEqual(bootstrapTarget)
  })

  it('falls back to mapConfig.initialView when bootstrap target is missing', () => {
    const target = resolveResetCameraTarget(null)

    expect(target.longitude).toBeTypeOf('number')
    expect(target.latitude).toBeTypeOf('number')
    expect(target.height).toBeTypeOf('number')
    expect(target.pitch).toBe(-90)
  })
})

describe('buildCameraFlyToOptions', () => {
  it('creates top-down camera options from a target', () => {
    const options = buildCameraFlyToOptions(createBootstrapTarget())

    expect(options.duration).toBe(1.5)
    expect(options.orientation.heading).toBe(0)
    expect(options.orientation.pitch).toBeCloseTo(-Math.PI / 2)
    expect(options.orientation.roll).toBe(0)
    expect(options.destination).toBeInstanceOf(Cesium.Cartesian3)
  })
})

describe('getInitialCameraKey', () => {
  it('changes when heading or roll changes', () => {
    const baseTarget: InitialCameraTarget = {
      longitude: 103.95056,
      latitude: 30.57972,
      height: 10000,
      heading: 0,
      pitch: -90,
      roll: 0,
    }

    expect(getInitialCameraKey(baseTarget)).not.toBe(
      getInitialCameraKey({
        ...baseTarget,
        heading: 45,
      }),
    )

    expect(getInitialCameraKey(baseTarget)).not.toBe(
      getInitialCameraKey({
        ...baseTarget,
        roll: 10,
      }),
    )
  })
})

describe('getObstacleFlyToOptions', () => {
  it('builds fly-to options using the provided top-down offset', () => {
    const result = {
      message: '障碍物已同步到地图图层。',
      addedEntityIds: ['polygon-obstacle-import-1-0'],
      flyToBoundingSphere: new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 500),
      flyToOffset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 1800),
    } satisfies ObstacleLayerSyncResult

    const options = getObstacleFlyToOptions(result)

    expect(options).toBeDefined()
    expect(options?.duration).toBe(1.5)
    expect(options?.offset?.pitch).toBeCloseTo(-Math.PI / 2)
    expect(options?.offset?.range).toBe(1800)
  })

  it('returns undefined when there is no fly-to target', () => {
    expect(
      getObstacleFlyToOptions({
        message: '未返回可渲染的障碍物。',
        addedEntityIds: [],
      }),
    ).toBeUndefined()
  })
})

describe('CesiumViewer camera rules', () => {
  beforeEach(() => {
    syncObstacleLayerMock.mockReset()
    rebuildObstacleLayerMock.mockReset()
    rebuildAnalysisLayerMock.mockReset()
    applyAnalysisVisibilityMock.mockReset()
    syncStationLayerMock.mockReset()
    flyToMock.mockReset()
    flyToBoundingSphereMock.mockReset()
    addImageryProviderMock.mockReset()
    dataSourcesAddMock.mockReset()
    dataSourcesRemoveMock.mockReset()
    destroyMock.mockReset()
    syncStationLayerMock.mockReturnValue({
      message: '台站已同步到地图图层。',
      addedEntityIds: [],
      removedEntityIds: [],
    })
  })

  it('forwards analytic_surface zones and the real analysis layer renders them', async () => {
    const actualAnalysisLayer = await vi.importActual<typeof import('../../map/layers/AnalysisLayer')>(
      '../../map/layers/AnalysisLayer',
    )
    const entitiesAdd = vi.fn()
    const dataSource = { entities: { add: entitiesAdd, values: [] } }
    vi.mocked(Cesium.CustomDataSource).mockImplementation(() => dataSource as unknown as Cesium.CustomDataSource)

    const zone = createVisibleProtectionZoneRegion()

    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [zone],
        visibleProtectionZones: [zone],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(rebuildAnalysisLayer).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [zone],
    )

    expect(applyAnalysisVisibility).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      new Set([zone.key]),
    )

    actualAnalysisLayer.rebuildAnalysisLayer(
      {
        dataSources: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as unknown as Cesium.Viewer,
      [zone],
    )

    expect(entitiesAdd).toHaveBeenCalledTimes(8)
    expect(entitiesAdd.mock.calls.every((call) => call[0].show === false)).toBe(true)
    expect(entitiesAdd.mock.calls.every((call) => call[0].polygon?.perPositionHeight === true)).toBe(true)
    expect(entitiesAdd.mock.calls.every((call) => call[0].polygon?.height === undefined)).toBe(true)
    expect(entitiesAdd.mock.calls.every((call) => call[0].polygon?.extrudedHeight === undefined)).toBe(true)
    expect(entitiesAdd.mock.calls[0]?.[0].id).toBe('analysis-zone-airport-1:station-1:zone-a:rule-a:region-north-0')

    wrapper.unmount()
  })

  it('forwards loc_building_restriction_zone_region_3 zones unchanged to rebuildAnalysisLayer', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const zone = createLocRegion3VisibleProtectionZoneRegion()
    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [zone],
        visibleProtectionZones: [zone],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(rebuildAnalysisLayerMock).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [zone],
    )

    wrapper.unmount()
  })

  it('does not trigger obstacle-extent fly when bootstrap obstacles arrive before the airport target', async () => {
    syncObstacleLayerMock
      .mockReturnValueOnce(createSyncResult())
      .mockReturnValueOnce(createSyncResult({
        addedEntityIds: ['polygon-obstacle-history-1-0'],
      }))
      .mockReturnValueOnce(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    await wrapper.setProps({
      obstacles: [createObstacle('history-1')],
    })

    await flushPromises()

    expect(syncObstacleLayerMock).toHaveBeenLastCalledWith(expect.objectContaining({ camera: expect.anything() }), [createObstacle('history-1')], {
      flyToNewlyAdded: false,
    })
    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)

    await wrapper.setProps({
      initialCameraTarget: createBootstrapTarget(),
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)
    expect(flyToMock).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('flies to the airport target once when bootstrap target arrives after historical obstacles', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [createObstacle('history-1')],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)
    expect(flyToMock).toHaveBeenCalledTimes(1)

    await wrapper.setProps({
      initialCameraTarget: createBootstrapTarget(),
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)
    expect(flyToMock).toHaveBeenCalledTimes(2)

    await wrapper.setProps({
      initialCameraTarget: createBootstrapTarget(),
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('still flies to newly added imported obstacle extents after bootstrap', async () => {
    const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 500)
    const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 1800)

    syncObstacleLayerMock
      .mockReturnValueOnce(
        createSyncResult({
          addedEntityIds: ['polygon-obstacle-import-1-0'],
          flyToBoundingSphere: boundingSphere,
          flyToOffset: offset,
        }),
      )

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [createObstacle('history-1')],
        visibleStations: [],
        initialCameraTarget: createBootstrapTarget(),
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)

    await wrapper.setProps({
      obstacles: [createObstacle('history-1'), createObstacle('import-1')],
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(1)
    expect(flyToBoundingSphereMock).toHaveBeenCalledWith(boundingSphere, {
      duration: 1.5,
      offset,
    })

    wrapper.unmount()
  })

  it('resets to the bootstrap airport target when available', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const target = createBootstrapTarget()
    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: target,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    flyToMock.mockClear()

    await wrapper.setProps({
      resetTick: 1,
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToMock).toHaveBeenCalledWith(buildCameraFlyToOptions(target))

    wrapper.unmount()
  })

  it('resets to the fallback initial view when bootstrap target is absent', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [createObstacle('history-1')],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    flyToMock.mockClear()

    await wrapper.setProps({
      resetTick: 1,
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToMock).toHaveBeenCalledWith(buildCameraFlyToOptions(resolveResetCameraTarget(null)))

    wrapper.unmount()
  })

  it('flies to the fallback initial view on startup when bootstrap target is absent and there are no obstacles', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToMock).toHaveBeenCalledWith(buildCameraFlyToOptions(resolveResetCameraTarget(null)))

    wrapper.unmount()
  })

  it('flies to top-down view from current position when topDownTick changes', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
        topDownTick: 0,
      },
    })

    await flushPromises()

    flyToMock.mockClear()

    await wrapper.setProps({
      topDownTick: 1,
    })

    await flushPromises()

    const expectedPosition = Cesium.Cartographic.fromDegrees(114.21, 30.77, 5000)
    const target = buildTopDownView(expectedPosition)

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToMock).toHaveBeenCalledWith(buildCameraFlyToOptions(target))

    wrapper.unmount()
  })

  it('still flies to newly added imported obstacle extents when bootstrap target is absent', async () => {
    const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 500)
    const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 1800)

    syncObstacleLayerMock
      .mockReturnValueOnce(
        createSyncResult({
          addedEntityIds: ['polygon-obstacle-import-1-0'],
          flyToBoundingSphere: boundingSphere,
          flyToOffset: offset,
        }),
      )

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [createObstacle('history-1')],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)

    await wrapper.setProps({
      obstacles: [createObstacle('history-1'), createObstacle('import-1')],
    })

    await flushPromises()

    expect(syncObstacleLayerMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [createObstacle('history-1'), createObstacle('import-1')],
      { flyToNewlyAdded: true },
    )
    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(1)
    expect(flyToBoundingSphereMock).toHaveBeenCalledWith(boundingSphere, {
      duration: 1.5,
      offset,
    })

    wrapper.unmount()
  })

  it('syncs visible protection zones on init and when zone inputs change', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())
    const initialZone = createFlatVisibleProtectionZoneRegion()
    const nextZone = createFlatVisibleProtectionZoneRegion({
      key: 'airport-1:station-1:zone-a:rule-a:region-south',
      id: 'airport-1-station-1-zone-a-rule-a-region-south',
      regionCode: 'region-south',
      regionName: '南侧区域',
      properties: {
        label: '南侧区域',
      },
    })

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [initialZone],
        visibleProtectionZones: [initialZone],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(rebuildAnalysisLayer).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [initialZone],
    )

    expect(applyAnalysisVisibility).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      new Set([initialZone.key]),
    )

    await wrapper.setProps({
      visibleProtectionZones: [nextZone],
    })

    await flushPromises()

    expect(applyAnalysisVisibility).toHaveBeenCalledTimes(2)
    expect(applyAnalysisVisibility).toHaveBeenLastCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      new Set([nextZone.key]),
    )

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)

    wrapper.unmount()
  })

  it('syncs visible stations on init and when the selected airport stations change', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [createStation('station-1')],
        initialCameraTarget: createBootstrapTarget(),
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(syncStationLayer).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [createStation('station-1')],
      '',
    )

    await wrapper.setProps({
      visibleStations: [
        createStation('station-2', {
          airportId: 'airport-2',
          name: '下一机场台站',
          longitude: 104.45,
          latitude: 30.31,
          altitude: 600,
        }),
      ],
      initialCameraTarget: {
        longitude: 104.44194,
        latitude: 30.31252,
        height: 10000,
        pitch: -90,
      },
    })

    await flushPromises()

    expect(syncStationLayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [
        createStation('station-2', {
          airportId: 'airport-2',
          name: '下一机场台站',
          longitude: 104.45,
          latitude: 30.31,
          altitude: 600,
        }),
      ],
      '',
    )
    expect(flyToMock).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('flies to the requested target when flyToTargetTick changes', async () => {
    syncObstacleLayerMock.mockReturnValue(createSyncResult())

    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        visibleStations: [],
        initialCameraTarget: null,
        loadedProtectionZones: [],
        visibleProtectionZones: [],
        flyToTargetTick: 0,
        flyToTargetPayload: null,
        obstacleRebuildTick: 0,
        selectedAirportId: '',
      },
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)

    const target: InitialCameraTarget = {
      longitude: 114.2,
      latitude: 30.7,
      height: 12000,
      pitch: -90,
    }

    await wrapper.setProps({
      flyToTargetPayload: target,
      flyToTargetTick: 1,
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(2)

    const flyToOptions = flyToMock.mock.calls[1]?.[0]

    expect(flyToOptions).toEqual(
      expect.objectContaining({
        duration: 1.5,
        destination: expect.any(Cesium.Cartesian3),
        orientation: expect.objectContaining({
          pitch: Cesium.Math.toRadians(-90),
        }),
      }),
    )

    wrapper.unmount()
  })
})
