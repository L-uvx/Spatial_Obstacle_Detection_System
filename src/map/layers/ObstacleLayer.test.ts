import { describe, expect, it, vi } from 'vitest'
import { syncObstacleLayer } from './ObstacleLayer'
import type { RenderedObstacle } from '../../types/tool'

function createObstacle(id: string, topElevation = 549.9): RenderedObstacle {
  return {
    id,
    name: `障碍物-${id}`,
    obstacleType: '建筑物/构建物',
    topElevation,
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

describe('syncObstacleLayer', () => {
  it('adds only missing obstacle entities and returns a fly-to bounding sphere for new obstacles', () => {
    const existingEntityIds = new Set<string>(['polygon-obstacle-history-1-0'])
    const add = vi.fn((entity: { id: string; polygon: { perPositionHeight?: boolean } }) => {
      existingEntityIds.add(entity.id)
      return entity
    })

    const viewer = {
      entities: {
        getById: vi.fn((id: string) => (existingEntityIds.has(id) ? { id } : undefined)),
        add,
      },
    }

    const result = syncObstacleLayer(viewer as never, [createObstacle('history-1'), createObstacle('import-1')])

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('polygon-obstacle-import-1-0')
    expect(add.mock.calls[0][0].polygon.perPositionHeight).toBe(false)
    expect(result.addedEntityIds).toEqual(['polygon-obstacle-import-1-0'])
    expect(result.flyToBoundingSphere).toBeDefined()
    expect(result.flyToOffset).toBeDefined()
    expect(result.flyToOffset?.pitch).toBeCloseTo(-Math.PI / 2)
    expect(result.flyToOffset?.range).toBeGreaterThan(result.flyToBoundingSphere!.radius)
    expect(result.message).toContain('同步到地图图层')
  })

  it('adds entities without fly-to output when newly added fly-to is disabled', () => {
    const add = vi.fn((entity: { id: string; polygon: { perPositionHeight?: boolean } }) => entity)

    const viewer = {
      entities: {
        getById: vi.fn(() => undefined),
        add,
      },
    }

    const result = syncObstacleLayer(viewer as never, [createObstacle('import-2')], {
      flyToNewlyAdded: false,
    })

    expect(add).toHaveBeenCalledTimes(1)
    expect(result.addedEntityIds).toEqual(['polygon-obstacle-import-2-0'])
    expect(result.flyToBoundingSphere).toBeUndefined()
    expect(result.flyToOffset).toBeUndefined()
  })

  it('returns no new entities when all obstacle polygons already exist', () => {
    const existingEntityIds = new Set<string>(['polygon-obstacle-history-1-0'])
    const add = vi.fn()

    const viewer = {
      entities: {
        getById: vi.fn((id: string) => (existingEntityIds.has(id) ? { id } : undefined)),
        add,
      },
    }

    const result = syncObstacleLayer(viewer as never, [createObstacle('history-1')])

    expect(add).not.toHaveBeenCalled()
    expect(result.addedEntityIds).toEqual([])
    expect(result.flyToBoundingSphere).toBeUndefined()
    expect(result.message).toContain('未新增')
  })
})
