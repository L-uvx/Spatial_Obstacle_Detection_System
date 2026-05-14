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

function createMockEntity(id: string, show: boolean, overrides: Record<string, unknown> = {}) {
  return {
    id,
    show,
    name: '',
    position: {} as Record<string, unknown>,
    properties: {} as Record<string, unknown>,
    point: {} as Record<string, unknown>,
    label: {} as Record<string, unknown>,
    ...overrides,
  }
}

describe('syncStationLayer', () => {
  it('syncs current-airport stations as point and label entities with show=true', () => {
    const add = vi.fn(
      (entity: {
        id: string
        show?: boolean
        point?: object
        label?: { text?: string; font?: string; outlineWidth?: number; pixelOffset?: object }
        position?: object
      }) => entity,
    )

    const viewer = {
      entities: {
        values: [],
        add,
        remove: vi.fn(),
      },
    }

    const result = syncStationLayer(viewer as never, [createStation('station-1')], 'airport-1')

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('station-layer-station-1')
    expect(add.mock.calls[0][0].show).toBe(true)
    expect(add.mock.calls[0][0].point).toMatchObject({
      pixelSize: 8,
    })
    expect(add.mock.calls[0][0].label?.text).toBe('台站-station-1')
    expect(add.mock.calls[0][0].label).toMatchObject({
      text: '台站-station-1',
      font: 'bold 18px sans-serif',
      outlineWidth: 3,
    })
    expect(add.mock.calls[0][0].label?.pixelOffset).toBeDefined()
    expect(add.mock.calls[0][0].position).toBeDefined()
    expect(result.addedEntityIds).toEqual(['station-layer-station-1'])
    expect(result.removedEntityIds).toEqual([])
    expect(viewer.entities.remove).not.toHaveBeenCalled()
  })

  it('sets show=false for stations belonging to other airports', () => {
    const airport2Entity = createMockEntity('station-layer-station-old', true, {
      properties: {
        stationId: { getValue: () => 'station-old' },
        airportId: { getValue: () => 'airport-2' },
      },
    })

    const add = vi.fn((entity: { id: string; show?: boolean; label?: { text?: string } }) => entity)
    const remove = vi.fn()

    const viewer = {
      entities: {
        values: [airport2Entity],
        add,
        remove,
      },
    }

    const nextStation = createStation('station-next', {
      airportId: 'airport-1',
      name: '机场一台站',
      longitude: 104.45,
      latitude: 30.31,
      altitude: 600,
    })

    const result = syncStationLayer(viewer as never, [nextStation], 'airport-1')

    expect(airport2Entity.show).toBe(false)
    expect(remove).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][0].id).toBe('station-layer-station-next')
    expect(add.mock.calls[0][0].label?.text).toBe('机场一台站')
    expect(add.mock.calls[0][0].show).toBe(true)
    expect(result.removedEntityIds).toEqual([])
    expect(result.addedEntityIds).toEqual(['station-layer-station-next'])
  })

  it('sets show=true when switching back to a previously hidden airport', () => {
    const hiddenEntity = createMockEntity('station-layer-station-1', false, {
      properties: {
        stationId: { getValue: () => 'station-1' },
        airportId: { getValue: () => 'airport-1' },
      },
    })

    const add = vi.fn()
    const remove = vi.fn()

    const viewer = {
      entities: {
        values: [hiddenEntity],
        add,
        remove,
      },
    }

    const result = syncStationLayer(viewer as never, [createStation('station-1')], 'airport-1')

    expect(hiddenEntity.show).toBe(true)
    expect(remove).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
    expect(result.addedEntityIds).toEqual([])
    expect(result.removedEntityIds).toEqual([])
  })

  it('sets show=false for station entities not in current station list', () => {
    const keptEntity = createMockEntity('station-layer-station-1', true, {
      properties: {
        stationId: { getValue: () => 'station-1' },
        airportId: { getValue: () => 'airport-1' },
      },
    })
    const removedEntity = createMockEntity('station-layer-station-2', true, {
      properties: {
        stationId: { getValue: () => 'station-2' },
        airportId: { getValue: () => 'airport-1' },
      },
    })

    const add = vi.fn()
    const remove = vi.fn()

    const viewer = {
      entities: {
        values: [keptEntity, removedEntity],
        add,
        remove,
      },
    }

    const result = syncStationLayer(viewer as never, [createStation('station-1')], 'airport-1')

    expect(keptEntity.show).toBe(true)
    expect(removedEntity.show).toBe(false)
    expect(remove).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
    expect(result.addedEntityIds).toEqual([])
    expect(result.removedEntityIds).toEqual([])
  })

  it('updates existing station entity when station data changes', () => {
    const existingEntity = createMockEntity('station-layer-station-1', true, {
      name: '旧台站',
      position: { kind: 'old-position' },
      point: {
        pixelSize: 10,
        outlineWidth: 1,
      },
      properties: {
        stationId: { getValue: () => 'station-1' },
        airportId: { getValue: () => 'airport-1' },
        altitude: 491.1,
      },
      label: {
        text: '旧台站',
        font: '14px sans-serif',
        outlineWidth: 2,
        pixelOffset: { kind: 'old-offset' },
      },
    })

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
      'airport-1',
    )

    expect(add).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(existingEntity.show).toBe(true)
    expect(existingEntity.name).toBe('更新后台站')
    expect(existingEntity.label.text).toBe('更新后台站')
    expect(existingEntity.point.pixelSize).toBe(8)
    expect(existingEntity.label.font).toBe('bold 18px sans-serif')
    expect(existingEntity.label.outlineWidth).toBe(3)
    expect(existingEntity.label.pixelOffset).not.toEqual({ kind: 'old-offset' })
    expect(existingEntity.position).not.toEqual({ kind: 'old-position' })
    expect(existingEntity.properties.altitude).toBe(600)
    expect(result.addedEntityIds).toEqual([])
    expect(result.removedEntityIds).toEqual([])
  })
})
