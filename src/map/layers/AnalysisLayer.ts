import * as Cesium from 'cesium'
import type {
  PolygonObstacleAnalysisState,
  ProtectionZoneSamplingConfig,
} from '../../types/tool'
import { buildCircleRing, buildSectorRing } from './analysis/sampling'
import { buildVerticalProfile } from './analysis/vertical'

const ENTITY_ID_PREFIX = 'analysis-zone-'

interface SyncedRegionSnapshot {
  fingerprint: string
  entityId: string
}

interface AnalysisLayerCache {
  regionsByKey: Map<string, SyncedRegionSnapshot>
}

export interface AnalysisLayerSyncResult {
  message: string
  addedKeys: string[]
  updatedKeys: string[]
  removedKeys: string[]
}

const cacheByViewer = new WeakMap<object, AnalysisLayerCache>()

function getLayerCache(viewer: Cesium.Viewer) {
  const existing = cacheByViewer.get(viewer)

  if (existing) {
    return existing
  }

  const next: AnalysisLayerCache = {
    regionsByKey: new Map(),
  }
  cacheByViewer.set(viewer, next)

  return next
}

function createEntityId(regionKey: string) {
  return `${ENTITY_ID_PREFIX}${regionKey}`
}

function createRegionFingerprint(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  sampling: ProtectionZoneSamplingConfig,
) {
  return JSON.stringify({
    key: region.key,
    geometry: region.geometry,
    vertical: region.vertical,
    sampling,
  })
}

function toCartesianPosition(longitude: number, latitude: number, heightMeters: number) {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, heightMeters)
}

function createPolygonHierarchy(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  sampling: ProtectionZoneSamplingConfig,
) {
  const footprint = region.geometry.shapeType === 'circle'
    ? buildCircleRing(region.geometry, sampling)
    : buildSectorRing(region.geometry, sampling)
  const profile = buildVerticalProfile(region.vertical, footprint)

  if (profile.mode === 'flat') {
    return {
      hierarchy: new Cesium.PolygonHierarchy(
        profile.points.map((point) => toCartesianPosition(point.longitude, point.latitude, point.heightMeters)),
      ),
      perPositionHeight: false,
      height: profile.points[0]?.heightMeters,
      extrudedHeight: undefined,
    }
  }

  return {
    hierarchy: new Cesium.PolygonHierarchy(
      profile.points.map((point) => toCartesianPosition(point.longitude, point.latitude, point.heightMeters)),
    ),
    perPositionHeight: true,
    height: undefined,
    extrudedHeight: undefined,
  }
}

function createEntity(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  sampling: ProtectionZoneSamplingConfig,
) {
  const polygon = createPolygonHierarchy(region, sampling)

  return {
    id: createEntityId(region.key),
    name: region.properties.label || region.regionName || region.zoneName,
    properties: {
      airportId: region.airportId,
      stationId: region.stationId,
      zoneCode: region.zoneCode,
      ruleCode: region.ruleCode,
      regionCode: region.regionCode,
      regionId: region.id,
    },
    polygon: {
      hierarchy: polygon.hierarchy,
      perPositionHeight: polygon.perPositionHeight,
      height: polygon.height,
      extrudedHeight: polygon.extrudedHeight,
      material: Cesium.Color.fromCssColorString('#4db3ff').withAlpha(0.28),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#7cc7ff'),
    },
  }
}

export function syncAnalysisLayer(
  viewer: Cesium.Viewer | null | undefined,
  zones: PolygonObstacleAnalysisState['visibleProtectionZones'] = [],
  sampling: ProtectionZoneSamplingConfig,
): AnalysisLayerSyncResult {
  if (!viewer) {
    return {
      message: '未返回可渲染的分析保护区。',
      addedKeys: [],
      updatedKeys: [],
      removedKeys: [],
    }
  }

  const cache = getLayerCache(viewer)
  const nextKeys = new Set(zones.map((zone) => zone.key))
  const addedKeys: string[] = []
  const updatedKeys: string[] = []
  const removedKeys: string[] = []

  for (const [cachedKey, cachedRegion] of cache.regionsByKey.entries()) {
    if (nextKeys.has(cachedKey)) {
      continue
    }

    viewer.entities.removeById(cachedRegion.entityId)
    cache.regionsByKey.delete(cachedKey)
    removedKeys.push(cachedKey)
  }

  for (const region of zones) {
    const entityId = createEntityId(region.key)
    const fingerprint = createRegionFingerprint(region, sampling)
    const cached = cache.regionsByKey.get(region.key)

    if (cached && cached.fingerprint === fingerprint) {
      continue
    }

    if (cached) {
      viewer.entities.removeById(cached.entityId)
      updatedKeys.push(region.key)
    } else {
      addedKeys.push(region.key)
    }

    viewer.entities.add(createEntity(region, sampling))
    cache.regionsByKey.set(region.key, {
      fingerprint,
      entityId,
    })
  }

  const changedCount = addedKeys.length + updatedKeys.length + removedKeys.length

  return {
    message: changedCount > 0 ? '分析保护区已同步到地图图层。' : '分析保护区无增量变化。',
    addedKeys,
    updatedKeys,
    removedKeys,
  }
}
