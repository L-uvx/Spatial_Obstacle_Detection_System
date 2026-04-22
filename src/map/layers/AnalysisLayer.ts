import * as Cesium from 'cesium'
import type {
  MultiPolygonCoordinates,
  PolygonObstacleAnalysisState,
  ProtectionZoneSamplingConfig,
} from '../../types/tool'
import { buildCircleRing, buildRadialBandRing, buildRadialBandRings, buildSectorRing } from './analysis/sampling'
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
function createEntityId(regionKey: string) {
  return `${ENTITY_ID_PREFIX}${regionKey}`
}

// 为保护区生成指纹，用于判断是否需要重建实体。
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

// 将经纬度和高程转换为 Cesium 笛卡尔坐标。
function toCartesianPosition(longitude: number, latitude: number, heightMeters: number) {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, heightMeters)
}

// 将 multipolygon 坐标转换为 Cesium PolygonHierarchy，保留外环与孔洞结构。
function createMultipolygonHierarchy(coordinates: MultiPolygonCoordinates, heightMeters: number) {
  const [firstPolygon] = coordinates

  if (!firstPolygon) {
    throw new Error('Unsupported protection zone multipolygon: empty coordinates')
  }

  const [outerRing, ...holeRings] = firstPolygon

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

// 根据几何类型采样出保护区的平面轮廓。
function resolveFootprint(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  sampling: ProtectionZoneSamplingConfig,
) {
  if (region.geometry.shapeType === 'circle') {
    return buildCircleRing(region.geometry, sampling)
  }

  if (region.geometry.shapeType === 'sector') {
    return buildSectorRing(region.geometry, sampling)
  }

  if (region.geometry.shapeType === 'radial_band') {
    return buildRadialBandRing(region.geometry, sampling)
  }

  throw new Error(`Unsupported protection zone geometry: ${(region.geometry as { shapeType?: string }).shapeType ?? 'unknown'}`)
}

// 为平面型保护区构造贴地多边形参数。
function createFlatPolygonHierarchy(profile: ReturnType<typeof buildVerticalProfile>) {
  if (profile.mode !== 'flat') {
    return null
  }

  return {
    hierarchy: new Cesium.PolygonHierarchy(
      profile.points.map((point) => toCartesianPosition(point.longitude, point.latitude, point.heightMeters)),
    ),
    perPositionHeight: false,
    height: profile.points[0]?.heightMeters,
    extrudedHeight: undefined,
  }
}

// 为 multipolygon 平面保护区直接构造多边形层级，避免圆/扇形采样逻辑介入。
function createMultipolygonFlatHierarchy(region: PolygonObstacleAnalysisState['visibleProtectionZones'][number]) {
  if (region.geometry.shapeType !== 'multipolygon' || region.vertical.mode !== 'flat') {
    return null
  }

  return {
    hierarchy: createMultipolygonHierarchy(region.geometry.coordinates, region.vertical.baseHeightMeters),
    perPositionHeight: false,
    height: region.vertical.baseHeightMeters,
    extrudedHeight: undefined,
  }
}

// 为解析曲面型保护区构造按点高程的多边形参数。
function createAnalyticSurfacePolygonHierarchy(profile: ReturnType<typeof buildVerticalProfile>) {
  if (profile.mode !== 'analytic_surface') {
    return null
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

// 为径向带解析曲面保护区构造带孔的多边形参数。
function createRadialBandAnalyticSurfacePolygonHierarchy(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  sampling: ProtectionZoneSamplingConfig,
) {
  if (region.geometry.shapeType !== 'radial_band' || region.vertical.mode !== 'analytic_surface') {
    return null
  }

  const { outerRing, innerRing } = buildRadialBandRings(region.geometry, sampling)
  const outerProfile = buildVerticalProfile(region.vertical, outerRing)
  const innerProfile = buildVerticalProfile(region.vertical, innerRing)

  if (outerProfile.mode !== 'analytic_surface' || innerProfile.mode !== 'analytic_surface') {
    return null
  }

  return {
    hierarchy: new Cesium.PolygonHierarchy(
      outerProfile.points.map((point) => toCartesianPosition(point.longitude, point.latitude, point.heightMeters)),
      [
        new Cesium.PolygonHierarchy(
          innerProfile.points.map((point) => toCartesianPosition(point.longitude, point.latitude, point.heightMeters)),
        ),
      ],
    ),
    perPositionHeight: true,
    height: undefined,
    extrudedHeight: undefined,
  }
}

// 根据保护区几何和垂向模式组装最终的多边形参数。
function createPolygonHierarchy(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  sampling: ProtectionZoneSamplingConfig,
) {
  const multipolygonFlat = createMultipolygonFlatHierarchy(region)

  if (multipolygonFlat) {
    return multipolygonFlat
  }

  const radialBandPolygon = createRadialBandAnalyticSurfacePolygonHierarchy(region, sampling)

  if (radialBandPolygon) {
    return radialBandPolygon
  }

  const footprint = resolveFootprint(region, sampling)
  const profile = buildVerticalProfile(region.vertical, footprint)
  const flatPolygon = createFlatPolygonHierarchy(profile)

  if (flatPolygon) {
    return flatPolygon
  }

  const analyticSurfacePolygon = createAnalyticSurfacePolygonHierarchy(profile)

  if (analyticSurfacePolygon) {
    return analyticSurfacePolygon
  }

  throw new Error(`Unsupported protection zone vertical mode: ${(profile as { mode?: string }).mode ?? 'unknown'}`)
}

// 将单个保护区区域构造成 Cesium 实体定义。
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

// 将可见保护区增量同步到地图，并复用缓存避免无效重建。
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
