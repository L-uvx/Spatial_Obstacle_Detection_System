import { describe, expect, it, vi } from 'vitest'
import { syncStationLayer } from './StationLayer'
import type { RenderedStation } from '../../types/tool'

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

describe('syncStationLayer', () => {
  it('syncs current-airport stations as point and label entities', () => {
    const add = vi.fn((entity: { id: string; point?: object; label?: { text?: string }; position?: object }) => entity)

    const viewer = {
      entities: {
        values: [],
        add,
        remove: vi.fn(),
      },
    }

    const result = syncStationLayer(viewer as never, [createStation('station-1')])

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('station-layer-station-1')
    expect(add.mock.calls[0][0].point).toBeDefined()
    expect(add.mock.calls[0][0].label?.text).toBe('台站-station-1')
    expect(add.mock.calls[0][0].position).toBeDefined()
    expect(result.addedEntityIds).toEqual(['station-layer-station-1'])
    expect(result.removedEntityIds).toEqual([])
  })

  it('removes stale station entities when switching airports', () => {
    const staleEntity = {
      id: 'station-layer-station-old',
      properties: {
        stationId: {
          getValue: () => 'station-old',
        },
      },
    }
    const nextStation = createStation('station-next', {
      airportId: 'airport-2',
      name: '下一机场台站',
      longitude: 104.45,
      latitude: 30.31,
      altitude: 600,
    })
    const add = vi.fn((entity: { id: string; label?: { text?: string } }) => entity)
    const remove = vi.fn()

    const viewer = {
      entities: {
        values: [staleEntity],
        add,
        remove,
      },
    }

    const result = syncStationLayer(viewer as never, [nextStation])

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(staleEntity)
    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('station-layer-station-next')
    expect(add.mock.calls[0][0].label?.text).toBe('下一机场台站')
    expect(result.removedEntityIds).toEqual(['station-layer-station-old'])
    expect(result.addedEntityIds).toEqual(['station-layer-station-next'])
  })

  it('keeps existing station entities for the same airport selection', () => {
    const existingEntity = {
      id: 'station-layer-station-1',
      properties: {
        stationId: {
          getValue: () => 'station-1',
        },
      },
    }
    const add = vi.fn()
    const remove = vi.fn()

    const viewer = {
      entities: {
        values: [existingEntity],
        add,
        remove,
      },
    }

    const result = syncStationLayer(viewer as never, [createStation('station-1')])

    expect(add).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(result.addedEntityIds).toEqual([])
    expect(result.removedEntityIds).toEqual([])
  })

  it('updates existing same-id station entities when station data changes', () => {
    const existingEntity = {
      id: 'station-layer-station-1',
      name: '旧台站',
      position: { kind: 'old-position' },
      properties: {
        stationId: {
          getValue: () => 'station-1',
        },
        altitude: 491.1,
      },
      label: {
        text: '旧台站',
      },
    }
    const add = vi.fn()
    const remove = vi.fn()

    const viewer = {
      entities: {
        values: [existingEntity],
        add,
        remove,
      },
    }

    const result = syncStationLayer(
      viewer as never,
      [
        createStation('station-1', {
          name: '更新后台站',
          longitude: 104.45,
          latitude: 30.31,
          altitude: 600,
        }),
      ],
    )

    expect(add).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(existingEntity.name).toBe('更新后台站')
    expect(existingEntity.label.text).toBe('更新后台站')
    expect(existingEntity.position).not.toEqual({ kind: 'old-position' })
    expect(existingEntity.properties.altitude).toBe(600)
    expect(result.addedEntityIds).toEqual([])
    expect(result.removedEntityIds).toEqual([])
  })

  it('removes all stale station entities when switching away from an airport with multiple stations', () => {
    const staleEntityA = {
      id: 'station-layer-station-old-a',
      properties: {
        stationId: {
          getValue: () => 'station-old-a',
        },
      },
    }
    const staleEntityB = {
      id: 'station-layer-station-old-b',
      properties: {
        stationId: {
          getValue: () => 'station-old-b',
        },
      },
    }
    const retainedEntity = {
      id: 'not-station-layer-entity',
    }
    const entityValues = [staleEntityA, staleEntityB, retainedEntity]
    const add = vi.fn((entity: { id: string }) => entity)
    const remove = vi.fn((entity: (typeof entityValues)[number]) => {
      const index = entityValues.indexOf(entity)

      if (index >= 0) {
        entityValues.splice(index, 1)
      }
    })

    const viewer = {
      entities: {
        values: entityValues,
        add,
        remove,
      },
    }

    const result = syncStationLayer(
      viewer as never,
      [
        createStation('station-next', {
          airportId: 'airport-2',
          name: '下一机场台站',
          longitude: 104.45,
          latitude: 30.31,
          altitude: 600,
        }),
      ],
    )

    expect(remove).toHaveBeenCalledTimes(2)
    expect(remove).toHaveBeenCalledWith(staleEntityA)
    expect(remove).toHaveBeenCalledWith(staleEntityB)
    expect(add).toHaveBeenCalledTimes(1)
    expect(result.removedEntityIds).toEqual([
      'station-layer-station-old-a',
      'station-layer-station-old-b',
    ])
    expect(result.addedEntityIds).toEqual(['station-layer-station-next'])
  })
})
