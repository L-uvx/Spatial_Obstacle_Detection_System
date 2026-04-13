import { mapConfig } from '../config/map'
import type { InitialCameraTarget, MultiPolygonCoordinates, RenderedObstacle } from '../types/tool'

interface BootstrapAirportResponse {
  id: number | string
  name: string
  longitude: number | null
  latitude: number | null
}

interface BootstrapObstacleResponseItem {
  id: number | string
  name: string
  obstacleType: string
  topElevation: number
  geometry?: {
    type: 'MultiPolygon'
    coordinates: MultiPolygonCoordinates
  } | null
}

interface BootstrapResponse {
  airport?: BootstrapAirportResponse | null
  historicalObstacles?: BootstrapObstacleResponseItem[] | null
}

export interface BootstrapDataResult {
  initialCameraTarget: InitialCameraTarget
  historicalObstacles: RenderedObstacle[]
}

function normalizeObstacle(item: BootstrapObstacleResponseItem): RenderedObstacle | null {
  if (!item.geometry || item.geometry.type !== 'MultiPolygon') {
    return null
  }

  return {
    id: String(item.id),
    name: item.name,
    obstacleType: item.obstacleType,
    topElevation: item.topElevation,
    geometry: {
      type: 'MultiPolygon',
      coordinates: item.geometry.coordinates,
    },
  }
}

export async function getBootstrapData(): Promise<BootstrapDataResult> {
  const response = await fetch('/polygon-obstacle/bootstrap')

  if (!response.ok) {
    throw new Error(`初始化接口请求失败：${response.status}`)
  }

  const result = (await response.json()) as BootstrapResponse
  const airport = result.airport

  if (typeof airport?.longitude !== 'number' || typeof airport.latitude !== 'number') {
    throw new Error('初始化机场坐标无效。')
  }

  const historicalObstacles = Array.isArray(result.historicalObstacles)
    ? result.historicalObstacles
    : []

  return {
    initialCameraTarget: {
      longitude: airport.longitude,
      latitude: airport.latitude,
      height: mapConfig.initialView.height,
      pitch: -90,
    },
    historicalObstacles: historicalObstacles
      .map((item) => normalizeObstacle(item))
      .filter((item): item is RenderedObstacle => item !== null),
  }
}
