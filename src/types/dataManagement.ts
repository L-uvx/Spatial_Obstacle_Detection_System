export type DataManagementTab = 'airports' | 'runways' | 'stations' | 'obstacles' | 'projects'

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface SelectOption {
  value: string
  label: string
}

export interface AirportOptionResponse {
  id?: string | number
  name?: string
  value?: string | number
  label?: string
}

export type StationTypeOptionResponse = string | { value?: string; label?: string }

export interface AirportFilters {
  keyword: string
  hasCoordinates: boolean
}

export interface AirportListItem {
  id: string
  name: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
  runwayCount: number
  stationCount: number
  createdAt: string
  updatedAt: string
}

export interface RunwayFilters {
  airportName: string
  keyword: string
  runNumber: string
}

export interface RunwayListItem {
  id: string
  airportId: string
  airportName: string
  name: string
  runNumber: string
  longitude: number | null
  latitude: number | null
  headingDegrees: number | null
  lengthMeters: number | null
  width: number | null
  altitude: number | null
  enterHeight: number | null
  maximumAirworthiness: number | null
  stationSubType: string
  runwayCodeA: string
  runwayType: string
  runwayCodeB: string
  maximumTypeAircraft: string | null
  createdAt: string
  updatedAt: string
}

export interface RunwayPayload {
  airportId: string
  name: string
  runNumber: string
  longitude: number | null
  latitude: number | null
  headingDegrees: number | null
  lengthMeters: number | null
  width: number | null
  altitude: number | null
  enterHeight: number | null
  maximumAirworthiness: number | null
  stationSubType: string
  runwayCodeA: string
  runwayType: string
  runwayCodeB: string
  maximumTypeAircraft: string | null
}

export interface StationFilters {
  airportName: string
  stationType: string
  keyword: string
  runwayNo: string
}

export interface StationListItem {
  id: string
  airportId: string
  airportName: string
  name: string
  stationType: string
  stationGroup: string | null
  frequency: number | null
  runwayNo: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
  coverageRadius: number | null
  flyHeight: number | null
  antennaHag: number | null
  reflectionNetHag: number | null
  centerAntennaH: number | null
  bAntennaH: number | null
  bToCenterDistance: number | null
  reflectionDiameter: number | null
  downwardAngle: number | null
  antennaTag: string | null
  distanceToRunway: number | null
  distanceVToRunway: number | null
  distanceEndoRunway: number | null
  unitNumber: string | null
  aircraft: string
  antennaHeight: number | null
  stationSubType: string | null
  combineId: number | null
  createdAt: string
  updatedAt: string
}

export interface StationPayload {
  airportId: string
  name: string
  stationType: string
  stationGroup: string | null
  frequency: number | null
  runwayNo: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
  coverageRadius: number | null
  flyHeight: number | null
  antennaHag: number | null
  reflectionNetHag: number | null
  centerAntennaH: number | null
  bAntennaH: number | null
  bToCenterDistance: number | null
  reflectionDiameter: number | null
  downwardAngle: number | null
  antennaTag: string | null
  distanceToRunway: number | null
  distanceVToRunway: number | null
  distanceEndoRunway: number | null
  unitNumber: string | null
  aircraft: string
  antennaHeight: number | null
  stationSubType: string | null
  combineId: number | null
}

export interface StationFormValue extends StationPayload {}

export interface DataManagementConflict {
  code: string
  message: string
}

export interface ImportAirportItem {
  fileName: string
  status: 'imported' | 'skipped' | 'error'
  airportId: number | null
  airportName: string | null
  runwayCount: number
  stationCount: number
  errorMessage: string | null
}

export interface ImportAirportsResult {
  items: ImportAirportItem[]
  totalFiles: number
  importedCount: number
  skippedCount: number
}

export interface ObstacleFilters {
  projectName: string
  keyword: string
  obstacleType: string
}

export interface ObstacleGeometryPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface ObstacleGeometryMultiPolygon {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

export type ObstacleGeometry = ObstacleGeometryPoint | ObstacleGeometryMultiPolygon

export interface ObstacleListItem {
  id: string
  projectId: string
  projectName: string
  name: string
  obstacleType: string
  topElevation: number | null
  sourceBatchId: string
  sourceRowNo: number
  geometry: ObstacleGeometry | null
  createdAt: string
  updatedAt: string
}

export interface ProjectFilters {
  projectName: string
  obstacleType: string
  status: string
}

export interface ProjectListItem {
  id: string
  projectName: string
  obstacleType: string
  analysisTaskId: string
  status: 'not_analyzed' | 'running' | 'succeeded' | 'failed'
  obstacleCount: number
  targetCount: number
  nonCompliantTargetCount: number
  createdAt: string
}

export interface ProjectTargetSummary {
  targetId: number
  targetName: string
  ruleCount: number
  nonCompliantCount: number
}
