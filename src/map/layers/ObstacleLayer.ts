import * as Cesium from 'cesium'
import type {
  ImportedObstacleGeometry,
  LinearRingCoordinates,
  PolygonCoordinates,
  PositionCoordinate,
  RenderedObstacle,
} from '../../types/tool'

const OBSTACLE_DATASOURCE_NAME = 'obstacles'
const POLYGON_ENTITY_ID_PREFIX = 'polygon-obstacle'
const POINT_ENTITY_ID_PREFIX = 'obstacle'
const OBSTACLE_LABEL_EYE_OFFSET = new Cesium.Cartesian3(0, 0, -30)

const dataSourceByViewer = new WeakMap<object, Cesium.CustomDataSource>()

interface CreateObstacleEntitiesOptions {
  showLabel: boolean
}

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

// 创建点障碍物与标签共享的 Cesium 世界坐标。
function createPointCartesian([longitude, latitude]: PositionCoordinate, height: number) {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
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

function createRegularPolygonRing([longitude, latitude]: PositionCoordinate, radiusMeters: number): LinearRingCoordinates {
  const sides = 8
  const ring: LinearRingCoordinates = []
  const latRad = Cesium.Math.toRadians(latitude)
  const metersPerDegLat = 111320
  const metersPerDegLon = 111320 * Math.cos(latRad)

  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides
    const dx = radiusMeters * Math.cos(angle)
    const dy = radiusMeters * Math.sin(angle)
    ring.push([longitude + dx / metersPerDegLon, latitude + dy / metersPerDegLat])
  }
  ring.push(ring[0])

  return ring
}

// 为障碍物的每个面片生成稳定实体 id。
function createEntityId(obstacleId: string, polygonIndex: number) {
  return `${POLYGON_ENTITY_ID_PREFIX}-${obstacleId}-${polygonIndex}`
}

// 为点障碍物生成稳定实体 id。
function createPointEntityId(obstacleId: string) {
  return `${POINT_ENTITY_ID_PREFIX}-${obstacleId}-point`
}

// 为标签生成稳定实体 id。
function createLabelEntityId(obstacleId: string, geometryType: ImportedObstacleGeometry['type'], polygonIndex = 0) {
  return geometryType === 'Point'
    ? `${POINT_ENTITY_ID_PREFIX}-${obstacleId}-label`
    : `${POLYGON_ENTITY_ID_PREFIX}-${obstacleId}-${polygonIndex}-label`
}

// 基于多边形包围球中心放置名称标签。
function createPolygonLabelPosition(obstacle: RenderedObstacle) {
  if (obstacle.geometry.type !== 'MultiPolygon') {
    return undefined
  }

  const boundingSphere = createBoundingSphere([obstacle])

  if (!boundingSphere) {
    return undefined
  }

  return Cesium.Cartesian3.fromDegrees(
    Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(boundingSphere.center).longitude),
    Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(boundingSphere.center).latitude),
    obstacle.topElevation,
  )
}

// 统一构造障碍物名称标签样式。
function createObstacleLabel(text: string) {
  return {
    text,
    font: 'bold 15px sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.fromCssColorString('#1c2733'),
    outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    pixelOffset: new Cesium.Cartesian2(0, -12),
    eyeOffset: OBSTACLE_LABEL_EYE_OFFSET,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  }
}

// 汇总一批障碍物的空间范围，供相机飞行使用。
function createBoundingSphere(obstacles: RenderedObstacle[]) {
  const points = obstacles.flatMap((obstacle) => {
    if (obstacle.geometry.type === 'Point') {
      return [createPointCartesian(obstacle.geometry.coordinates, obstacle.topElevation)]
    }

    return obstacle.geometry.coordinates.flatMap((polygon) =>
      polygon.flatMap((ring) =>
        ring.map(([longitude, latitude]) =>
          Cesium.Cartesian3.fromDegrees(longitude, latitude, obstacle.topElevation),
        ),
      ),
    )
  })

  if (points.length === 0) {
    return undefined
  }

  return Cesium.BoundingSphere.fromPoints(points)
}

function getOrCreateDataSource(viewer: Cesium.Viewer): Cesium.CustomDataSource {
  let ds = dataSourceByViewer.get(viewer)
  if (!ds) {
    ds = new Cesium.CustomDataSource(OBSTACLE_DATASOURCE_NAME)
    viewer.dataSources.add(ds)
    dataSourceByViewer.set(viewer, ds)
  }
  return ds
}

function createObstacleEntities(
  ds: Cesium.CustomDataSource,
  obstacles: RenderedObstacle[],
  options: CreateObstacleEntitiesOptions,
) {
  const addedObstacles: RenderedObstacle[] = []
  const addedEntityIds: string[] = []

  for (const obstacle of obstacles) {
    let obstacleWasAdded = false

    if (obstacle.geometry.type === 'Point') {
      const entityId = createPointEntityId(obstacle.id)

      if (!ds.entities.getById(entityId)) {
        ds.entities.add({
          id: entityId,
          name: obstacle.name,
          properties: {
            obstacleId: obstacle.id,
            obstacleType: obstacle.obstacleType,
            topElevation: obstacle.topElevation,
          },
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(
              createCartesianPositions(createRegularPolygonRing(obstacle.geometry.coordinates, 10)),
            ),
            height: 0,
            extrudedHeight: obstacle.topElevation,
            perPositionHeight: false,
            material: Cesium.Color.fromCssColorString('#ff8a3d').withAlpha(1),
            outline: false,
            outlineColor: Cesium.Color.fromCssColorString('#ffb26b'),
          },
        })
        addedEntityIds.push(entityId)
        obstacleWasAdded = true
      }

      if (options.showLabel) {
        const labelEntityId = createLabelEntityId(obstacle.id, 'Point')

        if (!ds.entities.getById(labelEntityId)) {
          ds.entities.add({
            id: labelEntityId,
            name: obstacle.name,
            position: createPointCartesian(obstacle.geometry.coordinates, obstacle.topElevation),
            label: createObstacleLabel(obstacle.name),
          })
        }
      }
    } else if (obstacle.geometry.type === 'MultiPolygon') {
      obstacle.geometry.coordinates.forEach((polygon, polygonIndex) => {
        const entityId = createEntityId(obstacle.id, polygonIndex)

        if (ds.entities.getById(entityId)) {
          return
        }

        const showLabel = options.showLabel && polygonIndex === 0

        ds.entities.add({
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
            material: Cesium.Color.fromCssColorString('#ff8a3d').withAlpha(1),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#ffb26b'),
          },
          label: showLabel ? createObstacleLabel(obstacle.name) : undefined,
          position: showLabel ? createPolygonLabelPosition(obstacle) : undefined,
        })

        obstacleWasAdded = true
        addedEntityIds.push(entityId)
      })
    } else {
      console.warn('[ObstacleLayer] Unsupported obstacle geometry.', obstacle.geometry)
    }

    if (obstacleWasAdded) {
      addedObstacles.push(obstacle)
    }
  }

  return { addedEntityIds, addedObstacles }
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

  const flyToNewlyAdded = options.flyToNewlyAdded ?? true
  const ds = getOrCreateDataSource(viewer)
  const { addedEntityIds, addedObstacles } = createObstacleEntities(ds, obstacles, { showLabel: true })

  const flyToBoundingSphere = flyToNewlyAdded ? createBoundingSphere(addedObstacles) : undefined

  return {
    message: addedEntityIds.length > 0 ? '障碍物已同步到地图图层。' : '未新增障碍物到地图图层。',
    addedEntityIds,
    flyToBoundingSphere,
    flyToOffset: flyToBoundingSphere ? createFlyToOffset(flyToBoundingSphere) : undefined,
  }
}

export function rebuildObstacleLayer(
  viewer: Cesium.Viewer | null | undefined,
  obstacles: RenderedObstacle[] = [],
): void {
  if (!viewer) return

  const oldDs = dataSourceByViewer.get(viewer)
  if (oldDs) {
    viewer.dataSources.remove(oldDs, true)
    dataSourceByViewer.delete(viewer)
  }

  if (obstacles.length === 0) return

  const ds = new Cesium.CustomDataSource(OBSTACLE_DATASOURCE_NAME)
  viewer.dataSources.add(ds)
  dataSourceByViewer.set(viewer, ds)

  createObstacleEntities(ds, obstacles, { showLabel: false })
}

export function _resetDataSourceForTest(viewer: object): void {
  dataSourceByViewer.delete(viewer)
}
