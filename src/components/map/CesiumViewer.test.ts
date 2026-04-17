// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Cesium from 'cesium'
import CesiumViewer from './CesiumViewer.vue'
import { syncAnalysisLayer } from '../../map/layers/AnalysisLayer'
import { buildCameraFlyToOptions, getInitialCameraKey, resolveResetCameraTarget } from './camera'
import { getObstacleFlyToOptions, type ObstacleLayerSyncResult } from '../../map/layers/ObstacleLayer'
import type { InitialCameraTarget, PolygonObstacleAnalysisState, RenderedObstacle } from '../../types/tool'

const { syncObstacleLayerMock, syncAnalysisLayerMock, flyToMock, flyToBoundingSphereMock, addImageryProviderMock, destroyMock } = vi.hoisted(() => ({
  syncObstacleLayerMock: vi.fn(),
  syncAnalysisLayerMock: vi.fn(),
  flyToMock: vi.fn(),
  flyToBoundingSphereMock: vi.fn(),
  addImageryProviderMock: vi.fn(),
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
          },
          imageryLayers: {
            addImageryProvider: addImageryProviderMock,
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
  }
})

vi.mock('../../map/layers/ObstacleLayer', async () => {
  const actual = await vi.importActual<typeof import('../../map/layers/ObstacleLayer')>(
    '../../map/layers/ObstacleLayer',
  )

  return {
    ...actual,
    syncObstacleLayer: syncObstacleLayerMock,
  }
})

vi.mock('../../map/layers/AnalysisLayer', async () => {
  const actual = await vi.importActual<typeof import('../../map/layers/AnalysisLayer')>(
    '../../map/layers/AnalysisLayer',
  )

  return {
    ...actual,
    syncAnalysisLayer: syncAnalysisLayerMock,
  }
})

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

function createProtectionZoneSampling(): PolygonObstacleAnalysisState['protectionZoneSampling'] {
  return {
    circleAngleStepDegrees: 5,
    sectorAngleStepDegrees: 5,
  }
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
    syncAnalysisLayerMock.mockReset()
    flyToMock.mockReset()
    flyToBoundingSphereMock.mockReset()
    addImageryProviderMock.mockReset()
    destroyMock.mockReset()
    syncAnalysisLayerMock.mockReturnValue({
      message: '分析保护区无增量变化。',
      addedKeys: [],
      updatedKeys: [],
    })
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
        initialCameraTarget: null,
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
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
        initialCameraTarget: null,
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
      },
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)
    expect(flyToMock).toHaveBeenCalledTimes(0)

    await wrapper.setProps({
      initialCameraTarget: createBootstrapTarget(),
    })

    await flushPromises()

    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)
    expect(flyToMock).toHaveBeenCalledTimes(1)

    await wrapper.setProps({
      initialCameraTarget: createBootstrapTarget(),
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('still flies to newly added imported obstacle extents after bootstrap', async () => {
    const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 500)
    const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 1800)

    syncObstacleLayerMock
      .mockReturnValueOnce(createSyncResult())
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
        initialCameraTarget: createBootstrapTarget(),
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
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
        initialCameraTarget: target,
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
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
        initialCameraTarget: null,
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
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
        initialCameraTarget: null,
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
      },
    })

    await flushPromises()

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToMock).toHaveBeenCalledWith(buildCameraFlyToOptions(resolveResetCameraTarget(null)))

    wrapper.unmount()
  })

  it('still flies to newly added imported obstacle extents when bootstrap target is absent', async () => {
    const boundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 500)
    const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 1800)

    syncObstacleLayerMock
      .mockReturnValueOnce(createSyncResult())
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
        initialCameraTarget: null,
        visibleProtectionZones: [],
        protectionZoneSampling: createProtectionZoneSampling(),
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

    const initialSampling = createProtectionZoneSampling()
    const wrapper = mount(CesiumViewer, {
      props: {
        resetTick: 0,
        obstacles: [],
        initialCameraTarget: null,
        visibleProtectionZones: [createVisibleProtectionZoneRegion()],
        protectionZoneSampling: initialSampling,
      },
    })

    await flushPromises()

    expect(syncAnalysisLayer).toHaveBeenCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [createVisibleProtectionZoneRegion()],
      initialSampling,
    )

    const nextSampling = {
      circleAngleStepDegrees: 10,
      sectorAngleStepDegrees: 15,
    }

    await wrapper.setProps({
      visibleProtectionZones: [
        createVisibleProtectionZoneRegion({
          key: 'airport-1:station-1:zone-a:rule-a:region-south',
          id: 'airport-1-station-1-zone-a-rule-a-region-south',
          regionCode: 'region-south',
          regionName: '南侧区域',
        }),
      ],
      protectionZoneSampling: nextSampling,
    })

    await flushPromises()

    expect(syncAnalysisLayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ camera: expect.anything() }),
      [
        createVisibleProtectionZoneRegion({
          key: 'airport-1:station-1:zone-a:rule-a:region-south',
          id: 'airport-1-station-1-zone-a-rule-a-region-south',
          regionCode: 'region-south',
          regionName: '南侧区域',
        }),
      ],
      nextSampling,
    )

    expect(flyToMock).toHaveBeenCalledTimes(1)
    expect(flyToBoundingSphereMock).toHaveBeenCalledTimes(0)

    wrapper.unmount()
  })
})
