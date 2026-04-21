import * as Cesium from 'cesium'
import type {
  LinearRingCoordinates,
  PolygonCoordinates,
  RenderedObstacle,
} from '../../types/tool'

const ENTITY_ID_PREFIX = 'polygon-obstacle'

export interface ObstacleLayerSyncResult {
  message: string
  addedEntityIds: string[]
  flyToBoundingSphere?: Cesium.BoundingSphere
  flyToOffset?: Cesium.HeadingPitchRange
}

export interface SyncObstacleLayerOptions {
  flyToNewlyAdded?: boolean
}

// 根据同步结果生成统一的 flyTo 配置。
export function getObstacleFlyToOptions(result: ObstacleLayerSyncResult) {
  if (!result.flyToBoundingSphere) {
    return undefined
  }

  return {
    duration: 1.5,
    offset: result.flyToOffset,
  }
}

// 为障碍物范围飞行构造垂直俯视偏移量。
function createFlyToOffset(boundingSphere: Cesium.BoundingSphere) {
  return new Cesium.HeadingPitchRange(
    0,
    Cesium.Math.toRadians(-90),
    Math.max(boundingSphere.radius * 3, 1500),
  )
}

// 将 GeoJSON 风格的线环坐标转换为 Cesium 坐标点数组。
function createCartesianPositions(ring: LinearRingCoordinates) {
  return ring.map(([longitude, latitude]) => Cesium.Cartesian3.fromDegrees(longitude, latitude, 0))
}

// 将单个多边形坐标转换为 Cesium PolygonHierarchy。
function createPolygonHierarchy(polygon: PolygonCoordinates) {
  const [outerRing, ...holeRings] = polygon

  return new Cesium.PolygonHierarchy(
    createCartesianPositions(outerRing),
      holeRings.map((ring) => new Cesium.PolygonHierarchy(createCartesianPositions(ring))),
  )
}

// 为障碍物的每个面片生成稳定实体 id。
function createEntityId(obstacleId: string, polygonIndex: number) {
  return `${ENTITY_ID_PREFIX}-${obstacleId}-${polygonIndex}`
}

// 汇总一批障碍物的空间范围，供相机飞行使用。
function createBoundingSphere(obstacles: RenderedObstacle[]) {
  const points = obstacles.flatMap((obstacle) =>
    obstacle.geometry.coordinates.flatMap((polygon) =>
      polygon.flatMap((ring) =>
        ring.map(([longitude, latitude]) =>
          Cesium.Cartesian3.fromDegrees(longitude, latitude, obstacle.topElevation),
        ),
      ),
    ),
  )

  if (points.length === 0) {
    return undefined
  }

  return Cesium.BoundingSphere.fromPoints(points)
}

// 将障碍物增量同步到 Viewer，并返回新增结果摘要。
export function syncObstacleLayer(
  viewer: Cesium.Viewer | null | undefined,
  obstacles: RenderedObstacle[] = [],
  options: SyncObstacleLayerOptions = {},
): ObstacleLayerSyncResult {
  if (!viewer || obstacles.length === 0) {
    return {
      message: '未返回可渲染的障碍物。',
      addedEntityIds: [],
    }
  }

  const addedObstacles: RenderedObstacle[] = []
  const addedEntityIds: string[] = []
  const flyToNewlyAdded = options.flyToNewlyAdded ?? true

  for (const obstacle of obstacles) {
    let obstacleWasAdded = false

    obstacle.geometry.coordinates.forEach((polygon, polygonIndex) => {
      const entityId = createEntityId(obstacle.id, polygonIndex)

      if (viewer.entities.getById(entityId)) {
        return
      }

      viewer.entities.add({
        id: entityId,
        name: obstacle.name,
        properties: {
          obstacleId: obstacle.id,
          obstacleType: obstacle.obstacleType,
          topElevation: obstacle.topElevation,
        },
        polygon: {
          hierarchy: createPolygonHierarchy(polygon),
          height: 0,
          extrudedHeight: obstacle.topElevation,
          perPositionHeight: false,
          material: Cesium.Color.fromCssColorString('#ff8a3d').withAlpha(0.45),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#ffb26b'),
        },
      })

      obstacleWasAdded = true
      addedEntityIds.push(entityId)
    })

    if (obstacleWasAdded) {
      addedObstacles.push(obstacle)
    }
  }

  const flyToBoundingSphere = flyToNewlyAdded ? createBoundingSphere(addedObstacles) : undefined

  return {
    message: addedEntityIds.length > 0 ? '障碍物已同步到地图图层。' : '未新增障碍物到地图图层。',
    addedEntityIds,
    flyToBoundingSphere,
    flyToOffset: flyToBoundingSphere ? createFlyToOffset(flyToBoundingSphere) : undefined,
  }
}
