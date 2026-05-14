import * as Cesium from 'cesium'
import { describe, expect, it, vi } from 'vitest'
import { rebuildObstacleLayer, syncObstacleLayer } from './ObstacleLayer'
import type { RenderedObstacle } from '../../types/tool'

vi.mock('cesium', async (importOriginal) => {
  const actual = await importOriginal<typeof import('cesium')>()
  return {
    ...actual,
    CustomDataSource: vi.fn(),
  }
})

function createMultiPolygonObstacle(id: string, topElevation = 549.9): RenderedObstacle {
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

function createPointObstacle(id: string, topElevation = 549.9): RenderedObstacle {
  return {
    id,
    name: `点障碍物-${id}`,
    obstacleType: '树木/树林',
    topElevation,
    geometry: {
      type: 'Point',
      coordinates: [103.9758638888889, 30.506880555555554],
    },
  }
}

interface MockEntity {
  id: string
  name?: string
  point?: Record<string, unknown>
  polygon?: Record<string, unknown>
  position?: unknown
  label?: Record<string, unknown>
  properties?: Record<string, unknown>
  show?: boolean
}

function createViewerWithDs() {
  const entitiesById = new Map<string, MockEntity>()
  const entitiesValues: MockEntity[] = []

  const entitiesAdd = vi.fn((entityDef: MockEntity) => {
    entitiesById.set(entityDef.id, entityDef)
    entitiesValues.push(entityDef)
    return entityDef
  })

  const entitiesGetById = vi.fn((id: string) => {
    return entitiesById.get(id) ?? null
  })

  const mockDataSource = {
    name: 'obstacles',
    entities: {
      add: entitiesAdd,
      getById: entitiesGetById,
      values: entitiesValues,
    },
  }

  const ctorImpl = (_name: string) => {
    entitiesById.clear()
    entitiesValues.length = 0
    return mockDataSource
  }
  vi.mocked(Cesium.CustomDataSource).mockImplementation(ctorImpl as never)

  const dataSourceAdd = vi.fn((ds: unknown) => ds)
  const dataSourceRemove = vi.fn()

  return {
    viewer: {
      dataSources: {
        add: dataSourceAdd,
        remove: dataSourceRemove,
      },
    } as unknown as Cesium.Viewer,
    add: entitiesAdd,
    getById: entitiesGetById,
    dataSourceRemove,
    entitiesById,
    mockDataSource,
  }
}

describe('syncObstacleLayer', () => {
  it('adds only missing obstacle entities and returns a fly-to bounding sphere for new obstacles', () => {
    const { viewer, add, getById } = createViewerWithDs()
    getById.mockImplementation((id: string) => {
      if (id === 'polygon-obstacle-history-1-0') return { id }
      return null
    })

    const result = syncObstacleLayer(viewer as never, [createMultiPolygonObstacle('history-1'), createMultiPolygonObstacle('import-1')])

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('polygon-obstacle-import-1-0')
    expect(add.mock.calls[0][0].polygon!.perPositionHeight).toBe(false)
    expect(result.addedEntityIds).toEqual(['polygon-obstacle-import-1-0'])
    expect(result.flyToBoundingSphere).toBeDefined()
    expect(result.flyToOffset).toBeDefined()
    expect(result.flyToOffset?.pitch).toBeCloseTo(-Math.PI / 2)
    expect(result.flyToOffset?.range).toBeGreaterThan(result.flyToBoundingSphere!.radius)
    expect(result.message).toContain('同步到地图图层')
  })

  it('adds entities without fly-to output when newly added fly-to is disabled', () => {
    const { viewer, add } = createViewerWithDs()

    const result = syncObstacleLayer(viewer as never, [createMultiPolygonObstacle('import-2')], {
      flyToNewlyAdded: false,
    })

    expect(add).toHaveBeenCalledTimes(1)
    expect(result.addedEntityIds).toEqual(['polygon-obstacle-import-2-0'])
    expect(result.flyToBoundingSphere).toBeUndefined()
    expect(result.flyToOffset).toBeUndefined()
  })

  it('returns no new entities when all obstacle polygons already exist', () => {
    const { viewer, add, getById } = createViewerWithDs()
    getById.mockImplementation((id: string) => {
      if (id === 'polygon-obstacle-history-1-0') return { id }
      return null
    })

    const result = syncObstacleLayer(viewer as never, [createMultiPolygonObstacle('history-1')])

    expect(add).not.toHaveBeenCalled()
    expect(result.addedEntityIds).toEqual([])
    expect(result.flyToBoundingSphere).toBeUndefined()
    expect(result.message).toContain('未新增')
  })

  it('renders point obstacles with a point graphic and name label', () => {
    const { viewer, add } = createViewerWithDs()

    const result = syncObstacleLayer(viewer as never, [createPointObstacle('point-1')])

    expect(add).toHaveBeenCalledTimes(2)
    expect(add.mock.calls[0][0].id).toBe('obstacle-point-1-point')
    expect(add.mock.calls[0][0].point).toBeTruthy()
    expect(add.mock.calls[1][0].id).toBe('obstacle-point-1-label')
    expect(add.mock.calls[1][0].label?.text).toBe('点障碍物-point-1')
    expect(result.flyToBoundingSphere).toBeDefined()
  })

  it('renders multipolygon obstacles with a polygon and name label', () => {
    const { viewer, add } = createViewerWithDs()

    syncObstacleLayer(viewer as never, [createMultiPolygonObstacle('import-3')])

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].polygon).toBeTruthy()
    expect(add.mock.calls[0][0].label?.text).toBe('障碍物-import-3')
  })

  it('ignores unsupported obstacle geometry without throwing', () => {
    const { viewer, add } = createViewerWithDs()

    const result = syncObstacleLayer(viewer as never, [
      {
        id: 'bad-1',
        name: '坏障碍物',
        obstacleType: '未知',
        topElevation: 0,
        geometry: {
          type: 'LineString',
          coordinates: [],
        } as never,
      },
    ])

    expect(add).not.toHaveBeenCalled()
    expect(result.addedEntityIds).toEqual([])
  })

  it('returns empty result for null viewer', () => {
    const result = syncObstacleLayer(null, [createMultiPolygonObstacle('obs-1')])

    expect(result.message).toContain('未返回可渲染')
    expect(result.addedEntityIds).toEqual([])
  })

  it('returns empty result for empty obstacles array', () => {
    const { viewer } = createViewerWithDs()

    const result = syncObstacleLayer(viewer as never, [])

    expect(result.message).toContain('未返回可渲染')
    expect(result.addedEntityIds).toEqual([])
  })
})

describe('rebuildObstacleLayer', () => {
  it('creates DataSource with obstacles but no labels', () => {
    const { viewer, add } = createViewerWithDs()

    rebuildObstacleLayer(viewer as never, [createMultiPolygonObstacle('obs-1')])

    expect(viewer.dataSources.add).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledTimes(1)
    // No label when showLabel is false
    expect(add.mock.calls[0][0].label).toBeUndefined()
    expect(add.mock.calls[0][0].position).toBeUndefined()
  })

  it('creates Point obstacle entities without labels', () => {
    const { viewer, add } = createViewerWithDs()

    rebuildObstacleLayer(viewer as never, [createPointObstacle('point-1')])

    // Point entity added but no separate label entity
    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('obstacle-point-1-point')
    expect(add.mock.calls[0][0].point).toBeTruthy()
    expect(add.mock.calls[0][0].label).toBeUndefined()
  })

  it('destroys old DataSource before creating new one', () => {
    const { viewer, add } = createViewerWithDs()

    rebuildObstacleLayer(viewer as never, [createMultiPolygonObstacle('obs-1')])
    rebuildObstacleLayer(viewer as never, [createMultiPolygonObstacle('obs-2')])

    expect(viewer.dataSources.remove).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledTimes(2)
    expect(viewer.dataSources.add).toHaveBeenCalledTimes(2)
  })

  it('removes old DataSource and does not add new one for empty obstacles', () => {
    const { viewer, add } = createViewerWithDs()

    rebuildObstacleLayer(viewer as never, [createMultiPolygonObstacle('obs-1')])
    rebuildObstacleLayer(viewer as never, [])

    expect(viewer.dataSources.remove).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledTimes(1) // only from first call
    expect(viewer.dataSources.add).toHaveBeenCalledTimes(1)
  })

  it('handles null viewer safely', () => {
    expect(() => rebuildObstacleLayer(null as never, [createMultiPolygonObstacle('obs-1')])).not.toThrow()
  })

  it('handles undefined viewer safely', () => {
    expect(() => rebuildObstacleLayer(undefined, [createMultiPolygonObstacle('obs-1')])).not.toThrow()
  })
})
