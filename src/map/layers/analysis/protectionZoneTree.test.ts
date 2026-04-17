import { describe, expect, it } from 'vitest'
import {
  createProtectionZoneKey,
  flattenVisibleProtectionZones,
  mergeProtectionZones,
  toggleAirportVisibility,
  toggleStationVisibility,
  toggleZoneVisibility,
} from './protectionZoneTree'
import type { ProtectionZoneRegion } from '../../../types/tool'

function createRegion(overrides: Partial<ProtectionZoneRegion> = {}): ProtectionZoneRegion {
  return {
    id: 'region-1',
    airportId: '1',
    airportName: 'Airport A',
    stationId: '101',
    stationName: 'NDB Station',
    stationType: 'NDB',
    ruleCode: 'rule-1',
    ruleName: 'Rule 1',
    zoneCode: 'zone-1',
    zoneName: 'Zone 1',
    regionCode: 'default',
    regionName: 'Default',
    geometry: {
      shapeType: 'circle',
      center: { longitude: 104.1, latitude: 30.1 },
      radiusMeters: 50,
    },
    vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
    properties: { label: 'Zone 1' },
    ...overrides,
  }
}

describe('protectionZoneTree', () => {
  it('creates a region-aware protection zone key', () => {
    expect(
      createProtectionZoneKey(
        createRegion({ airportId: '1', stationId: '101', zoneCode: 'zone-1', regionCode: 'outer' }),
      ),
    ).toBe('1:101:zone-1:outer')
  })

  it('applies duplicate incoming region keys deterministically with last incoming region winning', () => {
    const tree = mergeProtectionZones([], [
      createRegion({ id: 'region-default-1', regionCode: 'default', regionName: 'Default' }),
      createRegion({ id: 'region-inner-1', regionCode: 'inner', regionName: 'Inner Original' }),
    ])

    const nextTree = mergeProtectionZones(tree, [
      createRegion({ id: 'region-inner-2', regionCode: 'inner', regionName: 'Inner First Refresh' }),
      createRegion({ id: 'region-inner-3', regionCode: 'inner', regionName: 'Inner Final Refresh' }),
    ])

    expect(nextTree[0].stations[0].zones[0].regions.map((item) => item.id)).toEqual([
      'region-default-1',
      'region-inner-3',
    ])

    const appendedTree = mergeProtectionZones([], [
      createRegion({ id: 'region-inner-a', regionCode: 'inner', regionName: 'Inner First Append' }),
      createRegion({ id: 'region-inner-b', regionCode: 'inner', regionName: 'Inner Final Append' }),
    ])

    expect(appendedTree[0].stations[0].zones[0].regions.map((item) => item.id)).toEqual([
      'region-inner-b',
    ])
  })

  it('replaces only matching regions inside a zone while preserving visibility', () => {
    const firstTree = mergeProtectionZones([], [
      createRegion({ id: 'region-default-1', regionCode: 'default', regionName: 'Default' }),
      createRegion({ id: 'region-inner-1', regionCode: 'inner', regionName: 'Inner' }),
    ])
    const hiddenTree = toggleZoneVisibility(firstTree, '1', '101', 'zone-1', false)

    const nextTree = mergeProtectionZones(hiddenTree, [
      createRegion({
        id: 'region-inner-2',
        airportName: 'Airport A Updated',
        zoneName: 'Zone 1 Updated',
        regionCode: 'inner',
        regionName: 'Inner Updated',
      }),
    ])

    expect(nextTree[0].visible).toBe(true)
    expect(nextTree[0].stations[0].visible).toBe(true)
    expect(nextTree[0].stations[0].zones[0].visible).toBe(false)
    expect(nextTree[0].airportName).toBe('Airport A Updated')
    expect(nextTree[0].stations[0].zones[0].zoneName).toBe('Zone 1 Updated')
    expect(nextTree[0].stations[0].zones[0].regions.map((item) => item.id)).toEqual([
      'region-default-1',
      'region-inner-2',
    ])
    expect(nextTree[0].stations[0].zones[0].regions.map((item) => item.regionCode)).toEqual([
      'default',
      'inner',
    ])
  })

  it('refreshes airport station and zone metadata from incoming data while preserving visibility flags', () => {
    const firstTree = mergeProtectionZones([], [createRegion()])
    const hiddenAirportTree = toggleAirportVisibility(firstTree, '1', false)
    const hiddenStationTree = toggleStationVisibility(hiddenAirportTree, '1', '101', false)
    const hiddenZoneTree = toggleZoneVisibility(hiddenStationTree, '1', '101', 'zone-1', false)

    const nextTree = mergeProtectionZones(hiddenZoneTree, [
      createRegion({
        id: 'region-2',
        airportName: 'Airport A Refreshed',
        stationName: 'NDB Station Refreshed',
        stationType: 'DVOR',
        ruleCode: 'rule-1',
        ruleName: 'Rule 1 Refreshed',
        zoneName: 'Zone 1 Refreshed',
        regionCode: 'default',
      }),
    ])

    expect(nextTree[0].visible).toBe(false)
    expect(nextTree[0].stations[0].visible).toBe(false)
    expect(nextTree[0].stations[0].zones[0].visible).toBe(false)
    expect(nextTree[0].airportName).toBe('Airport A Refreshed')
    expect(nextTree[0].stations[0].stationName).toBe('NDB Station Refreshed')
    expect(nextTree[0].stations[0].stationType).toBe('DVOR')
    expect(nextTree[0].stations[0].zones[0].zoneName).toBe('Zone 1 Refreshed')
    expect(nextTree[0].stations[0].zones[0].ruleCode).toBe('rule-1')
    expect(nextTree[0].stations[0].zones[0].ruleName).toBe('Rule 1 Refreshed')
  })

  it('refreshes station metadata when only a later zone in the station is updated', () => {
    const firstTree = mergeProtectionZones([], [
      createRegion({
        id: 'region-zone-1',
        stationName: 'Station Original',
        stationType: 'NDB',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1',
      }),
      createRegion({
        id: 'region-zone-2',
        stationName: 'Station Original',
        stationType: 'NDB',
        zoneCode: 'zone-2',
        zoneName: 'Zone 2',
      }),
    ])

    const nextTree = mergeProtectionZones(firstTree, [
      createRegion({
        id: 'region-zone-2-updated',
        stationName: 'Station Refreshed',
        stationType: 'DVOR',
        zoneCode: 'zone-2',
        zoneName: 'Zone 2 Refreshed',
      }),
    ])

    expect(nextTree[0].stations[0].stationName).toBe('Station Refreshed')
    expect(nextTree[0].stations[0].stationType).toBe('DVOR')
    expect(nextTree[0].stations[0].zones[0].zoneName).toBe('Zone 1')
    expect(nextTree[0].stations[0].zones[1].zoneName).toBe('Zone 2 Refreshed')
  })

  it('refreshes airport metadata when only a non-first station branch is updated', () => {
    const firstTree = mergeProtectionZones([], [
      createRegion({
        id: 'region-station-101-zone-1',
        airportName: 'Airport Original',
        stationId: '101',
        stationName: 'Station 101',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1',
      }),
      createRegion({
        id: 'region-station-202-zone-1',
        airportName: 'Airport Original',
        stationId: '202',
        stationName: 'Station 202',
        zoneCode: 'zone-1',
        zoneName: 'Zone A',
      }),
    ])

    const nextTree = mergeProtectionZones(firstTree, [
      createRegion({
        id: 'region-station-202-zone-1-updated',
        airportName: 'Airport Refreshed',
        stationId: '202',
        stationName: 'Station 202 Refreshed',
        zoneCode: 'zone-1',
        zoneName: 'Zone A Refreshed',
      }),
    ])

    expect(nextTree[0].airportName).toBe('Airport Refreshed')
    expect(nextTree[0].stations[0].stationName).toBe('Station 101')
    expect(nextTree[0].stations[1].stationName).toBe('Station 202 Refreshed')
    expect(nextTree[0].stations[1].zones[0].zoneName).toBe('Zone A Refreshed')
  })

  it('refreshes airport metadata when appending a new station under an existing airport', () => {
    const firstTree = mergeProtectionZones([], [
      createRegion({
        id: 'region-station-101-zone-1',
        airportName: 'Airport Original',
        stationId: '101',
        stationName: 'Station 101',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1',
      }),
    ])

    const nextTree = mergeProtectionZones(firstTree, [
      createRegion({
        id: 'region-station-202-zone-1',
        airportName: 'Airport Refreshed',
        stationId: '202',
        stationName: 'Station 202',
        zoneCode: 'zone-1',
        zoneName: 'Zone A',
      }),
    ])

    expect(nextTree[0].airportName).toBe('Airport Refreshed')
    expect(nextTree[0].stations.map((item) => item.stationId)).toEqual(['101', '202'])
  })

  it('refreshes station metadata when appending a new zone under an existing station', () => {
    const firstTree = mergeProtectionZones([], [
      createRegion({
        id: 'region-zone-1',
        stationName: 'Station Original',
        stationType: 'NDB',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1',
      }),
    ])

    const nextTree = mergeProtectionZones(firstTree, [
      createRegion({
        id: 'region-zone-2',
        stationName: 'Station Refreshed',
        stationType: 'DVOR',
        zoneCode: 'zone-2',
        zoneName: 'Zone 2',
      }),
    ])

    expect(nextTree[0].stations[0].stationName).toBe('Station Refreshed')
    expect(nextTree[0].stations[0].stationType).toBe('DVOR')
    expect(nextTree[0].stations[0].zones.map((item) => item.zoneCode)).toEqual(['zone-1', 'zone-2'])
  })

  it('merges same-zoneCode regions under the same station even when ruleCode differs', () => {
    const tree = mergeProtectionZones([], [
      createRegion({
        id: 'region-rule-1',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1 Rule 1',
        ruleCode: 'rule-1',
        ruleName: 'Rule 1',
      }),
      createRegion({
        id: 'region-rule-2',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1 Rule 2',
        ruleCode: 'rule-2',
        ruleName: 'Rule 2',
      }),
    ])

    expect(tree[0].stations[0].zones).toHaveLength(1)
    expect(
      tree[0].stations[0].zones.map((item) => ({
        key: item.key,
        zoneCode: item.zoneCode,
        regionIds: item.regions.map((region) => region.id),
      })),
    ).toEqual([
      { key: '1:101:zone-1', zoneCode: 'zone-1', regionIds: ['region-rule-2'] },
    ])
  })

  it('toggles zone visibility by airport station and zoneCode without requiring ruleCode', () => {
    const tree = mergeProtectionZones([], [
      createRegion({
        id: 'region-rule-1',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1 Rule 1',
        ruleCode: 'rule-1',
        ruleName: 'Rule 1',
      }),
      createRegion({
        id: 'region-rule-2',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1 Rule 2',
        ruleCode: 'rule-2',
        ruleName: 'Rule 2',
      }),
    ])

    const nextTree = toggleZoneVisibility(tree, '1', '101', 'zone-1', false)

    expect(
      nextTree[0].stations[0].zones.map((item) => ({
        key: item.key,
        visible: item.visible,
      })),
    ).toEqual([
      { key: '1:101:zone-1', visible: false },
    ])
  })

  it('refreshes airport metadata when appending a new zone under an existing station', () => {
    const firstTree = mergeProtectionZones([], [
      createRegion({
        id: 'region-zone-1',
        airportName: 'Airport Original',
        stationName: 'Station Original',
        stationType: 'NDB',
        zoneCode: 'zone-1',
        zoneName: 'Zone 1',
        ruleCode: 'rule-1',
      }),
    ])

    const nextTree = mergeProtectionZones(firstTree, [
      createRegion({
        id: 'region-zone-2',
        airportName: 'Airport Refreshed',
        stationName: 'Station Refreshed',
        stationType: 'DVOR',
        zoneCode: 'zone-2',
        zoneName: 'Zone 2',
        ruleCode: 'rule-2',
      }),
    ])

    expect(nextTree[0].airportName).toBe('Airport Refreshed')
    expect(nextTree[0].stations[0].stationName).toBe('Station Refreshed')
    expect(nextTree[0].stations[0].zones.map((item) => item.zoneCode)).toEqual(['zone-1', 'zone-2'])
  })

  it('keeps unmatched zones and unmatched regions in place when merging', () => {
    const tree = mergeProtectionZones([], [
      createRegion({ id: 'region-zone-1-default', regionCode: 'default' }),
      createRegion({ id: 'region-zone-1-inner', regionCode: 'inner' }),
      createRegion({ id: 'region-zone-2-default', zoneCode: 'zone-2', zoneName: 'Zone 2' }),
    ])

    const nextTree = mergeProtectionZones(tree, [
      createRegion({ id: 'region-zone-1-inner-next', regionCode: 'inner', regionName: 'Inner Next' }),
    ])

    expect(nextTree[0].stations[0].zones.map((item) => item.zoneCode)).toEqual(['zone-1', 'zone-2'])
    expect(nextTree[0].stations[0].zones[0].regions.map((item) => item.id)).toEqual([
      'region-zone-1-default',
      'region-zone-1-inner-next',
    ])
    expect(nextTree[0].stations[0].zones[1].regions.map((item) => item.id)).toEqual([
      'region-zone-2-default',
    ])
  })

  it('derives visible regions only when airport station and zone are all visible', () => {
    const tree = mergeProtectionZones([], [
      createRegion({ id: 'region-default-1', regionCode: 'default' }),
      createRegion({ id: 'region-inner-1', regionCode: 'inner' }),
    ])
    const hiddenAirportTree = toggleAirportVisibility(tree, '1', false)

    expect(flattenVisibleProtectionZones(hiddenAirportTree)).toEqual([])

    const restoredAirportTree = toggleAirportVisibility(hiddenAirportTree, '1', true)
    const hiddenStationTree = toggleStationVisibility(restoredAirportTree, '1', '101', false)

    expect(flattenVisibleProtectionZones(hiddenStationTree)).toEqual([])
    expect(flattenVisibleProtectionZones(restoredAirportTree).map((item) => item.key)).toEqual([
      '1:101:zone-1:default',
      '1:101:zone-1:inner',
    ])

    const hiddenZoneTree = toggleZoneVisibility(restoredAirportTree, '1', '101', 'zone-1', false)

    expect(flattenVisibleProtectionZones(hiddenZoneTree)).toEqual([])
  })
})
