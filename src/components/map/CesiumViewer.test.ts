import { describe, expect, it } from 'vitest'
import * as Cesium from 'cesium'
import { getObstacleFlyToOptions, type ObstacleLayerSyncResult } from '../../map/layers/ObstacleLayer'

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
