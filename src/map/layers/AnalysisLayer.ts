import * as Cesium from 'cesium'
import type {
  PolygonObstacleAnalysisState,
} from '../../types/tool'
import { buildVerticalProfile } from './analysis/vertical'

const ENTITY_ID_PREFIX = 'analysis-zone-'

interface SyncedRegionSnapshot {
  fingerprint: string
  entityIds: string[]
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

// 获取当前 Viewer 对应的保护区同步缓存。
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

// 为保护区实体生成稳定 id。
function createEntityId(regionKey: string, polygonIndex: number) {
  return `${ENTITY_ID_PREFIX}${regionKey}-${polygonIndex}`
}

// 为保护区生成指纹，用于判断是否需要重建实体。
function createRegionFingerprint(region: PolygonObstacleAnalysisState['visibleProtectionZones'][number]) {
  return JSON.stringify({
    key: region.key,
    geometry: region.geometry,
    vertical: region.vertical,
  })
}

// 将经纬度和高程转换为 Cesium 笛卡尔坐标。
function toCartesianPosition(longitude: number, latitude: number, heightMeters: number) {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, heightMeters)
}

// 将单个 flat polygon 坐标转换为 Cesium PolygonHierarchy，保留外环与孔洞结构。
function createFlatPolygonHierarchy(
  polygon: PolygonObstacleAnalysisState['visibleProtectionZones'][number]['geometry']['coordinates'][number],
  heightMeters: number,
) {
  const [outerRing, ...holeRings] = polygon

  if (!outerRing) {
    throw new Error('Unsupported protection zone multipolygon: missing outer ring')
  }

  return new Cesium.PolygonHierarchy(
    outerRing.map(([longitude, latitude]) => toCartesianPosition(longitude, latitude, heightMeters)),
    holeRings.map((ring) => new Cesium.PolygonHierarchy(
      ring.map(([longitude, latitude]) => toCartesianPosition(longitude, latitude, heightMeters)),
    )),
  )
}

// 为 analytic_surface ring 生成逐点高程坐标。
function createAnalyticRingPositions(
  vertical: PolygonObstacleAnalysisState['visibleProtectionZones'][number]['vertical'],
  ring: PolygonObstacleAnalysisState['visibleProtectionZones'][number]['geometry']['coordinates'][number][number],
) {
  const profile = buildVerticalProfile(
    vertical,
    ring.map(([longitude, latitude]) => ({
      longitude,
      latitude,
      radialDistanceMeters: 0,
    })),
  )

  if (profile.mode !== 'analytic_surface') {
    throw new Error(`Expected analytic_surface profile but received ${profile.mode}`)
  }

  return profile.points.map((point) =>
    toCartesianPosition(point.longitude, point.latitude, point.heightMeters),
  )
}

// 将单个 analytic_surface polygon 坐标转换为 Cesium PolygonHierarchy，保留外环与孔洞结构。
function createAnalyticPolygonHierarchy(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  polygon: PolygonObstacleAnalysisState['visibleProtectionZones'][number]['geometry']['coordinates'][number],
) {
  const [outerRing, ...holeRings] = polygon

  if (!outerRing) {
    throw new Error('Unsupported protection zone multipolygon: missing outer ring')
  }

  return new Cesium.PolygonHierarchy(
    createAnalyticRingPositions(region.vertical, outerRing),
    holeRings.map((ring) => new Cesium.PolygonHierarchy(createAnalyticRingPositions(region.vertical, ring))),
  )
}

// 将单个保护区区域构造成 Cesium 实体定义。
function createEntity(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  polygon: PolygonObstacleAnalysisState['visibleProtectionZones'][number]['geometry']['coordinates'][number],
  polygonIndex: number,
) {
  let polygonGraphics: {
    hierarchy: Cesium.PolygonHierarchy
    perPositionHeight: boolean
    height: number | undefined
    extrudedHeight: number | undefined
  }

  switch (region.vertical.mode) {
    case 'flat':
      polygonGraphics = {
        hierarchy: createFlatPolygonHierarchy(polygon, region.vertical.baseHeightMeters),
        perPositionHeight: false,
        height: region.vertical.baseHeightMeters,
        extrudedHeight: undefined,
      }
      break
    case 'analytic_surface':
      polygonGraphics = {
        hierarchy: createAnalyticPolygonHierarchy(region, polygon),
        perPositionHeight: true,
        height: undefined,
        extrudedHeight: undefined,
      }
      break
    default:
      throw new Error(`Unsupported protection zone vertical mode: ${(region.vertical as { mode?: string }).mode ?? 'unknown'}`)
  }

  return {
    id: createEntityId(region.key, polygonIndex),
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
      ...polygonGraphics,
      material: Cesium.Color.fromCssColorString('#4db3ff').withAlpha(0.28),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#7cc7ff'),
    },
  }
}

// 将可见保护区增量同步到地图，并复用缓存避免无效重建。
export function syncAnalysisLayer(
  viewer: Cesium.Viewer | null | undefined,
  zones: PolygonObstacleAnalysisState['visibleProtectionZones'] = [],
): AnalysisLayerSyncResult {
  if (!viewer) {
    return {
      message: '未返回可渲染的分析保护区。',
      addedKeys: [],
      updatedKeys: [],
      removedKeys: [],
    }
  }

  const renderableZones = zones
  const cache = getLayerCache(viewer)
  const nextKeys = new Set(renderableZones.map((zone) => zone.key))
  const addedKeys: string[] = []
  const updatedKeys: string[] = []
  const removedKeys: string[] = []

  for (const [cachedKey, cachedRegion] of cache.regionsByKey.entries()) {
    if (nextKeys.has(cachedKey)) {
      continue
    }

    for (const entityId of cachedRegion.entityIds) {
      viewer.entities.removeById(entityId)
    }

    cache.regionsByKey.delete(cachedKey)
    removedKeys.push(cachedKey)
  }

  for (const region of renderableZones) {
    const fingerprint = createRegionFingerprint(region)
    const cached = cache.regionsByKey.get(region.key)

    if (cached && cached.fingerprint === fingerprint) {
      continue
    }

    if (cached) {
      for (const entityId of cached.entityIds) {
        viewer.entities.removeById(entityId)
      }

      updatedKeys.push(region.key)
    } else {
      addedKeys.push(region.key)
    }

    const entityIds = region.geometry.coordinates.map((polygon, polygonIndex) => {
      const entity = createEntity(region, polygon, polygonIndex)
      viewer.entities.add(entity)
      return entity.id
    })

    cache.regionsByKey.set(region.key, {
      fingerprint,
      entityIds,
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
