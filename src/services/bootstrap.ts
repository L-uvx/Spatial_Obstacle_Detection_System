import { mapConfig } from '../config/map'
import type {
  InitialCameraTarget,
  MultiPolygonCoordinates,
  RenderedAirport,
  RenderedObstacle,
  RenderedStation,
} from '../types/tool'

interface BootstrapAirportResponse {
  id: number | string
  name: string
  longitude: number | null
  latitude: number | null
  stations?: BootstrapStationResponse[] | null
}

interface BootstrapStationResponse {
  id: number | string
  name: string
  stationType: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
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
  airports?: BootstrapAirportResponse[] | null
  historicalObstacles?: BootstrapObstacleResponseItem[] | null
}

export interface BootstrapDataResult {
  initialCameraTarget: InitialCameraTarget | null
  historicalObstacles: RenderedObstacle[]
  airports: RenderedAirport[]
}

// 统一判断后端返回的数值字段是否可用。
function isFiniteNumber(value: number | null): value is number {
  return Number.isFinite(value)
}

// 校验单个二维坐标点是否合法。
function isValidPositionCoordinate(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && isFiniteNumber(value[0] as number | null)
    && isFiniteNumber(value[1] as number | null)
}

// 校验单个线环坐标数组是否合法。
function isValidLinearRingCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.every((coordinate) => isValidPositionCoordinate(coordinate))
}

// 校验单个多边形坐标数组是否合法。
function isValidPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.every((ring) => isValidLinearRingCoordinates(ring))
}

// 校验 MultiPolygon 坐标结构是否合法。
function isValidMultiPolygonCoordinates(value: unknown): value is MultiPolygonCoordinates {
  return Array.isArray(value) && value.every((polygon) => isValidPolygonCoordinates(polygon))
}

// 将后端台站数据规范化为前端长期状态结构。
function normalizeStation(airportId: string, station: BootstrapStationResponse): RenderedStation | null {
  if (!isFiniteNumber(station.longitude) || !isFiniteNumber(station.latitude)) {
    return null
  }

  return {
    id: String(station.id),
    airportId,
    name: station.name,
    stationType: station.stationType,
    longitude: station.longitude,
    latitude: station.latitude,
    altitude: isFiniteNumber(station.altitude) ? station.altitude : 0,
  }
}

// 将后端机场数据规范化，并过滤无效坐标或台站项。
function normalizeAirport(airport: BootstrapAirportResponse): RenderedAirport | null {
  if (!isFiniteNumber(airport.longitude) || !isFiniteNumber(airport.latitude)) {
    return null
  }

  const airportId = String(airport.id)
  const stations = Array.isArray(airport.stations)
    ? airport.stations
      .map((station) => normalizeStation(airportId, station))
      .filter((station): station is RenderedStation => station !== null)
    : []

  return {
    id: airportId,
    name: airport.name,
    longitude: airport.longitude,
    latitude: airport.latitude,
    stations,
  }
}

// 将后端历史障碍物规范化为可直接上图的结构。
function normalizeObstacle(item: BootstrapObstacleResponseItem): RenderedObstacle | null {
  if (
    !item.geometry
    || item.geometry.type !== 'MultiPolygon'
    || !isFiniteNumber(item.topElevation)
    || !isValidMultiPolygonCoordinates(item.geometry.coordinates)
  ) {
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

// 请求系统初始化接口，并返回机场基线和历史障碍物。
export async function getBootstrapData(): Promise<BootstrapDataResult> {
  const response = await fetch('/polygon-obstacle/bootstrap')

  if (!response.ok) {
    throw new Error(`初始化接口请求失败：${response.status}`)
  }

  const result = (await response.json()) as BootstrapResponse
  const airports = Array.isArray(result.airports)
    ? result.airports
      .map((airport) => normalizeAirport(airport))
      .filter((airport): airport is RenderedAirport => airport !== null)
    : []
  const defaultAirport = airports[0] ?? null

  const historicalObstacles = Array.isArray(result.historicalObstacles)
    ? result.historicalObstacles
    : []

  return {
    initialCameraTarget: defaultAirport
      ? {
        longitude: defaultAirport.longitude,
        latitude: defaultAirport.latitude,
        height: mapConfig.initialView.height,
        pitch: -90,
      }
      : null,
    airports,
    historicalObstacles: historicalObstacles
      .map((item) => normalizeObstacle(item))
      .filter((item): item is RenderedObstacle => item !== null),
  }
}
