import * as Cesium from 'cesium'
import type {
  PolygonObstacleAnalysisState,
} from '../../types/tool'
import { buildVerticalProfile } from './analysis/vertical'

const ENTITY_ID_PREFIX = 'analysis-zone-'
const DEFAULT_ZONE_MATERIAL = Cesium.Color.fromCssColorString('#4db3ff').withAlpha(0.28)

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

type RegionTriangleDefinition = Array<[number, number, number]>

// 为保护区生成指纹，用于判断是否需要重建实体。
function createRegionFingerprint(region: PolygonObstacleAnalysisState['visibleProtectionZones'][number]) {
  return JSON.stringify({
    key: region.key,
    geometry: region.geometry,
    vertical: region.vertical,
    style: region.style,
  })
}

// 仅在 fill 可被 Cesium 正常解析时使用自定义填充色，否则回退默认蓝色。
function resolveRegionMaterial(region: PolygonObstacleAnalysisState['visibleProtectionZones'][number]) {
  const fill = region.style?.fill

  if (!fill) {
    return DEFAULT_ZONE_MATERIAL
  }

  const parsed = Cesium.Color.fromCssColorString(fill)

  return parsed ?? DEFAULT_ZONE_MATERIAL
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

// 将三角面定义转换为闭合的 Cesium PolygonHierarchy。
function createClosedTriangleHierarchy(points: RegionTriangleDefinition) {
  return new Cesium.PolygonHierarchy(
    points.map(([longitude, latitude, heightMeters]) =>
      toCartesianPosition(longitude, latitude, heightMeters),
    ),
  )
}

// 为 LOC region 3 解析面生成扇形三角片与左右封口三角片。
function createLocRegion3TriangleDefinitions(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
) {
  if (region.vertical.mode !== 'analytic_surface' || region.vertical.surface.type !== 'loc_building_restriction_zone_region_3') {
    return []
  }

  const { apexPoint, rootLeftPoint, rootRightPoint, arcPoints, arcHeightMeters } = region.vertical.surface
  const baseHeightMeters = region.vertical.baseHeightMeters
  const triangles: RegionTriangleDefinition[] = []

  for (let index = 0; index < arcPoints.length - 1; index += 1) {
    triangles.push([
      [apexPoint[0], apexPoint[1], baseHeightMeters],
      [arcPoints[index][0], arcPoints[index][1], arcHeightMeters],
      [arcPoints[index + 1][0], arcPoints[index + 1][1], arcHeightMeters],
      [apexPoint[0], apexPoint[1], baseHeightMeters],
    ])
  }

  triangles.push([
    [apexPoint[0], apexPoint[1], baseHeightMeters],
    [rootLeftPoint[0], rootLeftPoint[1], baseHeightMeters],
    [arcPoints[0][0], arcPoints[0][1], arcHeightMeters],
    [apexPoint[0], apexPoint[1], baseHeightMeters],
  ])

  triangles.push([
    [apexPoint[0], apexPoint[1], baseHeightMeters],
    [rootRightPoint[0], rootRightPoint[1], baseHeightMeters],
    [arcPoints[arcPoints.length - 1][0], arcPoints[arcPoints.length - 1][1], arcHeightMeters],
    [apexPoint[0], apexPoint[1], baseHeightMeters],
  ])

  return triangles
}

// 将单个保护区区域构造成 Cesium 实体定义。
function createEntity(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
  hierarchy: Cesium.PolygonHierarchy,
  polygonIndex: number,
  perPositionHeight: boolean,
  height: number | undefined,
) {
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
      hierarchy,
      perPositionHeight,
      height,
      extrudedHeight: undefined,
      material: resolveRegionMaterial(region),
      outline: false,
      outlineColor: Cesium.Color.fromCssColorString('#7cc7ff'),
    },
  }
}

// 将单个保护区区域展开为一个或多个 Cesium 实体定义。
function createEntities(
  region: PolygonObstacleAnalysisState['visibleProtectionZones'][number],
) {
  switch (region.vertical.mode) {
    case 'flat':
      return region.geometry.coordinates.map((polygon, polygonIndex) =>
        createEntity(
          region,
          createFlatPolygonHierarchy(polygon, region.vertical.baseHeightMeters),
          polygonIndex,
          false,
          region.vertical.baseHeightMeters,
        ),
      )
    case 'analytic_surface':
      if (region.vertical.surface.type === 'loc_building_restriction_zone_region_3') {
        return createLocRegion3TriangleDefinitions(region).map((triangle, polygonIndex) =>
          createEntity(
            region,
            createClosedTriangleHierarchy(triangle),
            polygonIndex,
            true,
            undefined,
          ),
        )
      }

      return region.geometry.coordinates.map((polygon, polygonIndex) =>
        createEntity(
          region,
          createAnalyticPolygonHierarchy(region, polygon),
          polygonIndex,
          true,
          undefined,
        ),
      )
    default:
      throw new Error(`Unsupported protection zone vertical mode: ${(region.vertical as { mode?: string }).mode ?? 'unknown'}`)
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

    const entityIds = createEntities(region).map((entity) => {
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
