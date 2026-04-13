// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Cesium from 'cesium'
import CesiumViewer from './CesiumViewer.vue'
import { buildCameraFlyToOptions, getInitialCameraKey, resolveResetCameraTarget } from './camera'
import { getObstacleFlyToOptions, type ObstacleLayerSyncResult } from '../../map/layers/ObstacleLayer'
import type { InitialCameraTarget, RenderedObstacle } from '../../types/tool'

const { syncObstacleLayerMock, flyToMock, flyToBoundingSphereMock, addImageryProviderMock, destroyMock } = vi.hoisted(() => ({
  syncObstacleLayerMock: vi.fn(),
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
    flyToMock.mockReset()
    flyToBoundingSphereMock.mockReset()
    addImageryProviderMock.mockReset()
    destroyMock.mockReset()
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
})
