export type DataManagementTab = 'airports' | 'runways' | 'stations'

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
  airportId: string
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
}

export interface StationFilters {
  airportId: string
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
  unitNumber: number | null
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
  unitNumber: number | null
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
