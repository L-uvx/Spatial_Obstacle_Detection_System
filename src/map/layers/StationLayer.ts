import * as Cesium from 'cesium'
import type { RenderedStation } from '../../types/tool'

const ENTITY_ID_PREFIX = 'station-layer'

const airportEntityIds = new Map<string, Set<string>>()

export interface StationLayerSyncResult {
  message: string
  addedEntityIds: string[]
  removedEntityIds: string[]
}

function createEntityId(stationId: string) {
  return `${ENTITY_ID_PREFIX}-${stationId}`
}

function isStationLayerEntity(entity: Cesium.Entity) {
  return typeof entity.id === 'string' && entity.id.startsWith(`${ENTITY_ID_PREFIX}-`)
}

function createEntityProperties(station: RenderedStation) {
  return {
    stationId: station.id,
    airportId: station.airportId,
    stationType: station.stationType,
    altitude: station.altitude,
  }
}

function createStationPointGraphics() {
  return {
    pixelSize: 8,
    color: Cesium.Color.fromCssColorString('#1d9bf0'),
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
    heightReference: Cesium.HeightReference.NONE,
  }
}

function createStationLabelGraphics(station: RenderedStation) {
  return {
    text: station.name,
    font: 'bold 18px sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.fromCssColorString('#0b1f33'),
    outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    pixelOffset: new Cesium.Cartesian2(0, -22),
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  }
}

function setEntityPosition(entity: Cesium.Entity, station: RenderedStation) {
  ;(entity as unknown as { position: Cesium.Cartesian3 }).position = Cesium.Cartesian3.fromDegrees(
    station.longitude,
    station.latitude,
    station.altitude,
  )
}

function updateStationEntity(entity: Cesium.Entity, station: RenderedStation) {
  ;(entity as unknown as { name: string }).name = station.name
  setEntityPosition(entity, station)
  ;(entity as unknown as { properties: ReturnType<typeof createEntityProperties> }).properties =
    createEntityProperties(station)
  ;(entity as unknown as { point: ReturnType<typeof createStationPointGraphics> }).point =
    createStationPointGraphics()
  ;(entity as unknown as { label: ReturnType<typeof createStationLabelGraphics> }).label =
    createStationLabelGraphics(station)
}

export function syncStationLayer(
  viewer: Cesium.Viewer | null | undefined,
  stations: RenderedStation[] = [],
  airportId: string,
): StationLayerSyncResult {
  if (!viewer) {
    return {
      message: '地图未初始化，无法同步台站图层。',
      addedEntityIds: [],
      removedEntityIds: [],
    }
  }

  let trackedIds = airportEntityIds.get(airportId)
  if (!trackedIds) {
    trackedIds = new Set<string>()
    airportEntityIds.set(airportId, trackedIds)
  }

  const currentStationEntityIds = new Set(stations.map((s) => createEntityId(s.id)))
  const addedEntityIds: string[] = []

  for (const station of stations) {
    const entityId = createEntityId(station.id)
    const existingEntity = viewer.entities.values.find((entity) => entity.id === entityId)

    if (existingEntity) {
      updateStationEntity(existingEntity, station)
      ;(existingEntity as unknown as { show: boolean }).show = true
    } else {
      viewer.entities.add({
        id: entityId,
        name: station.name,
        show: true,
        position: Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, station.altitude),
        properties: createEntityProperties(station),
        point: createStationPointGraphics(),
        label: createStationLabelGraphics(station),
      })

      addedEntityIds.push(entityId)
    }

    trackedIds.add(entityId)
  }

  for (const entityId of trackedIds) {
    if (!currentStationEntityIds.has(entityId)) {
      trackedIds.delete(entityId)
    }
  }

  for (const entity of viewer.entities.values) {
    if (!isStationLayerEntity(entity)) continue
    const entityId = entity.id as string

    const rawAirportId = (entity as unknown as { properties?: { airportId?: unknown } }).properties?.airportId
    const entityAirportId: unknown =
      rawAirportId != null && typeof (rawAirportId as { getValue?: () => unknown }).getValue === 'function'
        ? (rawAirportId as { getValue: () => unknown }).getValue()
        : rawAirportId

    if (entityAirportId !== airportId) {
      ;(entity as unknown as { show: boolean }).show = false
    } else if (!currentStationEntityIds.has(entityId)) {
      ;(entity as unknown as { show: boolean }).show = false
    }
  }

  return {
    message:
      addedEntityIds.length > 0
        ? '台站已同步到地图图层。'
        : '台站图层无增量变化。',
    addedEntityIds,
    removedEntityIds: [],
  }
}
