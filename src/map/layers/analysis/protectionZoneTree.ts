import type {
  ProtectionZoneAirportNode,
  ProtectionZoneNode,
  ProtectionZoneRegion,
  ProtectionZoneStationNode,
  VisibleProtectionZoneRegion,
} from '../../../types/tool'

function createZoneKey(
  region: Pick<ProtectionZoneRegion, 'airportId' | 'stationId' | 'zoneCode'>,
) {
  return `${region.airportId}:${region.stationId}:${region.zoneCode}`
}

function createRegionRuleKey(
  region: Pick<ProtectionZoneRegion, 'airportId' | 'stationId' | 'zoneCode' | 'ruleCode'>,
) {
  return `${createZoneKey(region)}:${region.ruleCode}`
}

export function createProtectionZoneKey(region: ProtectionZoneRegion) {
  return `${createRegionRuleKey(region)}:${region.regionCode}`
}

function createZoneNode(region: ProtectionZoneRegion, regions: ProtectionZoneRegion[]): ProtectionZoneNode {
  return {
    key: createZoneKey(region),
    airportId: region.airportId,
    airportName: region.airportName,
    stationId: region.stationId,
    stationName: region.stationName,
    stationType: region.stationType,
    zoneCode: region.zoneCode,
    zoneName: region.zoneName,
    ruleCode: region.ruleCode,
    ruleName: region.ruleName,
    visible: false,
    regions,
  }
}

function dedupeRegionsByKey(regions: ProtectionZoneRegion[]) {
  return [...new Map(regions.map((region) => [createProtectionZoneKey(region), region])).values()]
}

function createAirportNode(region: ProtectionZoneRegion, zone: ProtectionZoneNode): ProtectionZoneAirportNode {
  return {
    airportId: region.airportId,
    airportName: region.airportName,
    visible: false,
    stations: [
      {
        stationId: region.stationId,
        stationName: region.stationName,
        stationType: region.stationType,
        visible: false,
        zones: [zone],
      },
    ],
  }
}

function mergeZoneRegions(existingZone: ProtectionZoneNode, nextRegions: ProtectionZoneRegion[]): ProtectionZoneNode {
  const dedupedNextRegions = dedupeRegionsByKey(nextRegions)
  const nextRegionMap = new Map(dedupedNextRegions.map((region) => [createProtectionZoneKey(region), region]))
  const mergedRegions: ProtectionZoneRegion[] = []
  const firstRegion = dedupedNextRegions[0]

  for (const region of existingZone.regions) {
    const key = createProtectionZoneKey(region)
    if (nextRegionMap.has(key)) {
      mergedRegions.push(nextRegionMap.get(key) as ProtectionZoneRegion)
      nextRegionMap.delete(key)
      continue
    }

    mergedRegions.push(region)
  }

  for (const region of nextRegionMap.values()) {
    mergedRegions.push(region)
  }

  return {
    ...existingZone,
    airportId: firstRegion.airportId,
    airportName: firstRegion.airportName,
    stationId: firstRegion.stationId,
    stationName: firstRegion.stationName,
    stationType: firstRegion.stationType,
    zoneCode: firstRegion.zoneCode,
    zoneName: firstRegion.zoneName,
    ruleCode: firstRegion.ruleCode,
    ruleName: firstRegion.ruleName,
    regions: mergedRegions,
  }
}

function groupRegionsByZone(nextRegions: ProtectionZoneRegion[]) {
  const grouped = new Map<string, ProtectionZoneRegion[]>()

  for (const region of nextRegions) {
    const key = createZoneKey(region)
    const entry = grouped.get(key)

    if (entry) {
      const existingIndex = entry.findIndex((item) => createProtectionZoneKey(item) === createProtectionZoneKey(region))

      if (existingIndex >= 0) {
        entry[existingIndex] = region
      } else {
        entry.push(region)
      }

      continue
    }

    grouped.set(key, [region])
  }

  return grouped
}

function findUpdatedZone(
  existingZones: ProtectionZoneNode[],
  nextZones: ProtectionZoneNode[],
  stationId?: string,
) {
  for (let index = 0; index < nextZones.length; index += 1) {
    const nextZone = nextZones[index]
    const existingZone = existingZones[index]

    if (existingZone !== nextZone && (!stationId || nextZone.stationId === stationId)) {
      return nextZone
    }
  }

  return null
}

export function mergeProtectionZones(
  existingTree: ProtectionZoneAirportNode[],
  nextRegions: ProtectionZoneRegion[],
): ProtectionZoneAirportNode[] {
  if (nextRegions.length === 0) {
    return existingTree
  }

  const groupedRegions = groupRegionsByZone(nextRegions)
  let remainingGroups = new Map(groupedRegions)
  const nextTree = existingTree.map((airport) => {
    let airportChanged = false
    const nextStations = airport.stations.map((station) => {
      let stationChanged = false
      const nextZones = station.zones.map((zone) => {
        const key = zone.key || `${airport.airportId}:${station.stationId}:${zone.zoneCode}`
        const incomingRegions = remainingGroups.get(key)

        if (!incomingRegions) {
          return zone
        }

        remainingGroups.delete(key)
        stationChanged = true
        airportChanged = true
        return mergeZoneRegions(zone, incomingRegions)
      })

      if (!stationChanged) {
        return station
      }

      const refreshedStation = findUpdatedZone(station.zones, nextZones, station.stationId)

      return {
        ...station,
        stationName: refreshedStation?.stationName ?? station.stationName,
        stationType: refreshedStation?.stationType ?? station.stationType,
        zones: nextZones,
      }
    })

    if (!airportChanged) {
      return airport
    }

    const refreshedAirport = nextStations.reduce<ProtectionZoneNode | null>((updatedZone, station, index) => {
      if (updatedZone) {
        return updatedZone
      }

      return findUpdatedZone(airport.stations[index].zones, station.zones)
    }, null)

    return {
      ...airport,
      airportName: refreshedAirport?.airportName ?? airport.airportName,
      stations: nextStations,
    }
  })

  let appendedTree = nextTree

  for (const incomingRegions of remainingGroups.values()) {
    const dedupedIncomingRegions = dedupeRegionsByKey(incomingRegions)
    const firstRegion = dedupedIncomingRegions[0]
    const zone = createZoneNode(firstRegion, dedupedIncomingRegions)
    const airportIndex = appendedTree.findIndex((airport) => airport.airportId === firstRegion.airportId)

    if (airportIndex === -1) {
      appendedTree = [...appendedTree, createAirportNode(firstRegion, zone)]
      continue
    }

    const airport = appendedTree[airportIndex]
    const stationIndex = airport.stations.findIndex((station) => station.stationId === firstRegion.stationId)

    if (stationIndex === -1) {
      const nextAirport: ProtectionZoneAirportNode = {
        ...airport,
        airportName: firstRegion.airportName,
        stations: [
          ...airport.stations,
          {
            stationId: firstRegion.stationId,
            stationName: firstRegion.stationName,
            stationType: firstRegion.stationType,
            visible: false,
            zones: [zone],
          },
        ],
      }

      appendedTree = appendedTree.map((item, index) => (index === airportIndex ? nextAirport : item))
      continue
    }

    const station = airport.stations[stationIndex]
    const nextStation: ProtectionZoneStationNode = {
      ...station,
      stationName: firstRegion.stationName,
      stationType: firstRegion.stationType,
      zones: [...station.zones, zone],
    }
    const nextAirport: ProtectionZoneAirportNode = {
      ...airport,
      airportName: firstRegion.airportName,
      stations: airport.stations.map((item, index) => (index === stationIndex ? nextStation : item)),
    }

    appendedTree = appendedTree.map((item, index) => (index === airportIndex ? nextAirport : item))
  }

  return appendedTree
}

function regionToVisibleRegion(region: ProtectionZoneRegion): VisibleProtectionZoneRegion {
  return {
    key: createProtectionZoneKey(region),
    id: region.id,
    airportId: region.airportId,
    airportName: region.airportName,
    stationId: region.stationId,
    stationName: region.stationName,
    stationType: region.stationType,
    zoneCode: region.zoneCode,
    zoneName: region.zoneName,
    ruleCode: region.ruleCode,
    ruleName: region.ruleName,
    regionCode: region.regionCode,
    regionName: region.regionName,
    geometry: region.geometry,
    vertical: region.vertical,
    properties: region.properties,
    style: region.style,
  }
}

export function flattenVisibleProtectionZones(tree: ProtectionZoneAirportNode[]): VisibleProtectionZoneRegion[] {
  const visibleRegions: VisibleProtectionZoneRegion[] = []

  for (const airport of tree) {
    if (!airport.visible) {
      continue
    }

    for (const station of airport.stations) {
      if (!station.visible) {
        continue
      }

      for (const zone of station.zones) {
        if (!zone.visible) {
          continue
        }

        for (const region of zone.regions) {
          visibleRegions.push(regionToVisibleRegion(region))
        }
      }
    }
  }

  return visibleRegions
}

export function flattenAllProtectionZones(tree: ProtectionZoneAirportNode[]): VisibleProtectionZoneRegion[] {
  const allRegions: VisibleProtectionZoneRegion[] = []

  for (const airport of tree) {
    for (const station of airport.stations) {
      for (const zone of station.zones) {
        for (const region of zone.regions) {
          allRegions.push(regionToVisibleRegion(region))
        }
      }
    }
  }

  return allRegions
}

export function toggleAirportVisibility(
  tree: ProtectionZoneAirportNode[],
  airportId: string,
  visible: boolean,
): ProtectionZoneAirportNode[] {
  return tree.map((airport) => {
    if (airport.airportId !== airportId) {
      return airport
    }

    return {
      ...airport,
      visible,
      stations: airport.stations.map((station) => ({
        ...station,
        visible,
        zones: station.zones.map((zone) => ({
          ...zone,
          visible,
        })),
      })),
    }
  })
}

export function toggleStationVisibility(
  tree: ProtectionZoneAirportNode[],
  airportId: string,
  stationId: string,
  visible: boolean,
): ProtectionZoneAirportNode[] {
  return tree.map((airport) => {
    if (airport.airportId !== airportId) {
      return airport
    }

    const nextStations = airport.stations.map((station) => {
      if (station.stationId !== stationId) {
        return station
      }

      return {
        ...station,
        visible,
        zones: station.zones.map((zone) => ({
          ...zone,
          visible,
        })),
      }
    })

    return {
      ...airport,
      visible: visible ? true : nextStations.some((station) => station.visible),
      stations: nextStations,
    }
  })
}

export function toggleZoneVisibility(
  tree: ProtectionZoneAirportNode[],
  airportId: string,
  stationId: string,
  zoneCode: string,
  visible: boolean,
): ProtectionZoneAirportNode[] {
  return tree.map((airport) => {
    if (airport.airportId !== airportId) {
      return airport
    }

    const nextStations = airport.stations.map((station) => {
      if (station.stationId !== stationId) {
        return station
      }

      const nextZones = station.zones.map((zone) => {
        if (zone.zoneCode !== zoneCode) {
          return zone
        }

        return {
          ...zone,
          visible,
        }
      })

      return {
        ...station,
        visible: visible ? true : nextZones.some((zone) => zone.visible),
        zones: nextZones,
      }
    })

    return {
      ...airport,
      visible: visible ? true : nextStations.some((station) => station.visible),
      stations: nextStations,
    }
  })
}
