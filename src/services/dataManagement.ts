import type {
  AirportOptionResponse,
  AirportFilters,
  AirportListItem,
  DataManagementConflict,
  PaginatedResult,
  PaginationParams,
  RunwayFilters,
  RunwayListItem,
  RunwayPayload,
  SelectOption,
  StationFilters,
  StationPayload,
  StationListItem,
  StationTypeOptionResponse,
  ImportAirportsResult,
} from '../types/dataManagement'

export interface AirportPayload {
  name: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
}

export interface AirportMutationResult {
  id: string
  warnings: string[]
}

export interface RunwayMutationResult {
  id: string
  warnings: string[]
}

export interface DataManagementConflictError extends Error {
  status: number
  code: string
  detailMessage: string
}

interface PaginatedResultResponse<T> {
  items?: T[]
  total?: number
  page?: number
  pageSize?: number
}

interface AirportListItemResponse {
  id: string | number
  name: string
  longitude?: number | null
  latitude?: number | null
  altitude?: number | null
  runwayCount?: number
  stationCount?: number
  createdAt?: string
  updatedAt?: string
}

interface RunwayListItemResponse {
  id: string | number
  airportId?: string | number
  airportName?: string
  name?: string
  runwayName?: string
  runNumber?: string
  longitude?: number | null
  latitude?: number | null
  headingDegrees?: number | null
  lengthMeters?: number | null
  width?: number | null
  altitude?: number | null
  enterHeight?: number | null
  maximumAirworthiness?: number | null
  stationSubType?: string
  runwayCodeA?: string
  runwayType?: string
  runwayCodeB?: string
  createdAt?: string
  updatedAt?: string
}

interface StationListItemResponse {
  id: string | number
  airportId?: string | number
  airportName?: string
  name?: string
  stationName?: string
  stationType?: string
  stationGroup?: string | null
  frequency?: number | null
  runwayNo?: string
  longitude?: number | null
  latitude?: number | null
  altitude?: number | null
  coverageRadius?: number | null
  flyHeight?: number | null
  antennaHag?: number | null
  reflectionNetHag?: number | null
  centerAntennaH?: number | null
  bAntennaH?: number | null
  bToCenterDistance?: number | null
  reflectionDiameter?: number | null
  downwardAngle?: number | null
  antennaTag?: string | null
  distanceToRunway?: number | null
  distanceVToRunway?: number | null
  distanceEndoRunway?: number | null
  unitNumber?: number | null
  aircraft?: string
  antennaHeight?: number | null
  stationSubType?: string | null
  combineId?: number | null
  createdAt?: string
  updatedAt?: string
}

interface ConflictResponseBody {
  detail?: DataManagementConflict | string
}

interface AirportMutationResponse {
  id?: string | number
  warnings?: unknown
}

function buildQuery(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === '' || value === null || value === undefined) {
      continue
    }

    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function normalizeAirportListItem(item: AirportListItemResponse): AirportListItem {
  return {
    id: String(item.id),
    name: item.name,
    longitude: typeof item.longitude === 'number' ? item.longitude : null,
    latitude: typeof item.latitude === 'number' ? item.latitude : null,
    altitude: typeof item.altitude === 'number' ? item.altitude : null,
    runwayCount: typeof item.runwayCount === 'number' ? item.runwayCount : 0,
    stationCount: typeof item.stationCount === 'number' ? item.stationCount : 0,
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
  }
}

function normalizeRunwayListItem(item: RunwayListItemResponse): RunwayListItem {
  return {
    id: String(item.id),
    airportId: String(item.airportId ?? ''),
    airportName: item.airportName ?? '',
    name: item.name ?? item.runwayName ?? '',
    runNumber: item.runNumber ?? '',
    longitude: typeof item.longitude === 'number' ? item.longitude : null,
    latitude: typeof item.latitude === 'number' ? item.latitude : null,
    headingDegrees: typeof item.headingDegrees === 'number' ? item.headingDegrees : null,
    lengthMeters: typeof item.lengthMeters === 'number' ? item.lengthMeters : null,
    width: typeof item.width === 'number' ? item.width : null,
    altitude: typeof item.altitude === 'number' ? item.altitude : null,
    enterHeight: typeof item.enterHeight === 'number' ? item.enterHeight : null,
    maximumAirworthiness: typeof item.maximumAirworthiness === 'number' ? item.maximumAirworthiness : null,
    stationSubType: item.stationSubType ?? '',
    runwayCodeA: item.runwayCodeA ?? '',
    runwayType: item.runwayType ?? '',
    runwayCodeB: item.runwayCodeB ?? '',
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
  }
}

function normalizeStationListItem(item: StationListItemResponse): StationListItem {
  return {
    id: String(item.id),
    airportId: String(item.airportId ?? ''),
    airportName: item.airportName ?? '',
    name: item.name ?? item.stationName ?? '',
    stationType: item.stationType ?? '',
    stationGroup: item.stationGroup ?? null,
    frequency: typeof item.frequency === 'number' ? item.frequency : null,
    runwayNo: item.runwayNo ?? '',
    longitude: typeof item.longitude === 'number' ? item.longitude : null,
    latitude: typeof item.latitude === 'number' ? item.latitude : null,
    altitude: typeof item.altitude === 'number' ? item.altitude : null,
    coverageRadius: typeof item.coverageRadius === 'number' ? item.coverageRadius : null,
    flyHeight: typeof item.flyHeight === 'number' ? item.flyHeight : null,
    antennaHag: typeof item.antennaHag === 'number' ? item.antennaHag : null,
    reflectionNetHag: typeof item.reflectionNetHag === 'number' ? item.reflectionNetHag : null,
    centerAntennaH: typeof item.centerAntennaH === 'number' ? item.centerAntennaH : null,
    bAntennaH: typeof item.bAntennaH === 'number' ? item.bAntennaH : null,
    bToCenterDistance: typeof item.bToCenterDistance === 'number' ? item.bToCenterDistance : null,
    reflectionDiameter: typeof item.reflectionDiameter === 'number' ? item.reflectionDiameter : null,
    downwardAngle: typeof item.downwardAngle === 'number' ? item.downwardAngle : null,
    antennaTag: item.antennaTag ?? null,
    distanceToRunway: typeof item.distanceToRunway === 'number' ? item.distanceToRunway : null,
    distanceVToRunway: typeof item.distanceVToRunway === 'number' ? item.distanceVToRunway : null,
    distanceEndoRunway: typeof item.distanceEndoRunway === 'number' ? item.distanceEndoRunway : null,
    unitNumber: typeof item.unitNumber === 'number' ? item.unitNumber : null,
    aircraft: item.aircraft ?? '',
    antennaHeight: typeof item.antennaHeight === 'number' ? item.antennaHeight : null,
    stationSubType: item.stationSubType ?? null,
    combineId: typeof item.combineId === 'number' ? item.combineId : null,
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
  }
}

function createConflictError(status: number, detail: DataManagementConflict | string): DataManagementConflictError {
  const normalized = typeof detail === 'string'
    ? { code: 'request_failed', message: detail }
    : detail

  const error = new Error(normalized.message) as DataManagementConflictError
  error.status = status
  error.code = normalized.code
  error.detailMessage = normalized.message
  return error
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T
}

function normalizeAirportMutationResult(result: AirportMutationResponse): AirportMutationResult {
  return {
    id: String(result.id ?? ''),
    warnings: Array.isArray(result.warnings)
      ? result.warnings.filter((warning): warning is string => typeof warning === 'string')
      : [],
  }
}

function normalizeAirportOption(item: AirportOptionResponse): SelectOption | null {
  if (typeof item.name === 'string' && (typeof item.id === 'string' || typeof item.id === 'number')) {
    return {
      value: String(item.id),
      label: item.name,
    }
  }

  if (typeof item.label === 'string' && (typeof item.value === 'string' || typeof item.value === 'number')) {
    return {
      value: String(item.value),
      label: item.label,
    }
  }

  return null
}

function normalizeStationTypeOption(item: StationTypeOptionResponse): SelectOption | null {
  if (typeof item === 'string') {
    return {
      value: item,
      label: item,
    }
  }

  if (item && typeof item.label === 'string' && typeof item.value === 'string') {
    return {
      value: item.value,
      label: item.label,
    }
  }

  return null
}

async function ensureOk(response: Response) {
  if (response.ok) {
    return
  }

  try {
    const result = await readJson<ConflictResponseBody>(response)
    throw createConflictError(response.status, result.detail ?? `请求失败：${response.status}`)
  } catch (error) {
    if (error instanceof Error && 'detailMessage' in error) {
      throw error
    }

    throw createConflictError(response.status, `请求失败：${response.status}`)
  }
}

export async function getAirports(
  params: AirportFilters & PaginationParams,
): Promise<PaginatedResult<AirportListItem>> {
  const response = await fetch(`/data-management/airports${buildQuery({ ...params })}`)

  await ensureOk(response)

  const result = await readJson<PaginatedResultResponse<AirportListItemResponse>>(response)

  return {
    items: Array.isArray(result.items) ? result.items.map((item) => normalizeAirportListItem(item)) : [],
    total: typeof result.total === 'number' ? result.total : 0,
    page: typeof result.page === 'number' ? result.page : params.page,
    pageSize: typeof result.pageSize === 'number' ? result.pageSize : params.pageSize,
  }
}

export async function getAirportDetail(airportId: string): Promise<AirportListItem> {
  const response = await fetch(`/data-management/airports/${airportId}`)

  await ensureOk(response)

  return normalizeAirportListItem(await readJson<AirportListItemResponse>(response))
}

export async function getRunways(
  params: RunwayFilters & PaginationParams,
): Promise<PaginatedResult<RunwayListItem>> {
  const response = await fetch(`/data-management/runways${buildQuery({ ...params })}`)

  await ensureOk(response)

  const result = await readJson<PaginatedResultResponse<RunwayListItemResponse>>(response)

  return {
    items: Array.isArray(result.items) ? result.items.map((item) => normalizeRunwayListItem(item)) : [],
    total: typeof result.total === 'number' ? result.total : 0,
    page: typeof result.page === 'number' ? result.page : params.page,
    pageSize: typeof result.pageSize === 'number' ? result.pageSize : params.pageSize,
  }
}

export async function getRunwayDetail(runwayId: string): Promise<RunwayListItem> {
  const response = await fetch(`/data-management/runways/${runwayId}`)

  await ensureOk(response)

  return normalizeRunwayListItem(await readJson<RunwayListItemResponse>(response))
}

export async function getStations(
  params: StationFilters & PaginationParams,
): Promise<PaginatedResult<StationListItem>> {
  const response = await fetch(`/data-management/stations${buildQuery({ ...params })}`)

  await ensureOk(response)

  const result = await readJson<PaginatedResultResponse<StationListItemResponse>>(response)

  return {
    items: Array.isArray(result.items) ? result.items.map((item) => normalizeStationListItem(item)) : [],
    total: typeof result.total === 'number' ? result.total : 0,
    page: typeof result.page === 'number' ? result.page : params.page,
    pageSize: typeof result.pageSize === 'number' ? result.pageSize : params.pageSize,
  }
}

export async function getStationDetail(stationId: string): Promise<StationListItem> {
  const response = await fetch(`/data-management/stations/${stationId}`)

  await ensureOk(response)

  return normalizeStationListItem(await readJson<StationListItemResponse>(response))
}

export async function createAirport(payload: AirportPayload): Promise<AirportMutationResult> {
  const response = await fetch('/data-management/airports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureOk(response)

  return normalizeAirportMutationResult(await readJson<AirportMutationResponse>(response))
}

export async function updateAirport(airportId: string, payload: AirportPayload): Promise<AirportMutationResult> {
  const response = await fetch(`/data-management/airports/${airportId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureOk(response)

  return normalizeAirportMutationResult(await readJson<AirportMutationResponse>(response))
}

export async function deleteAirport(airportId: string) {
  const response = await fetch(`/data-management/airports/${airportId}`, {
    method: 'DELETE',
  })

  await ensureOk(response)
}

export async function createRunway(payload: RunwayPayload): Promise<RunwayMutationResult> {
  const response = await fetch('/data-management/runways', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureOk(response)

  return normalizeAirportMutationResult(await readJson<AirportMutationResponse>(response))
}

export async function updateRunway(runwayId: string, payload: RunwayPayload): Promise<RunwayMutationResult> {
  const response = await fetch(`/data-management/runways/${runwayId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureOk(response)

  return normalizeAirportMutationResult(await readJson<AirportMutationResponse>(response))
}

export async function deleteRunway(runwayId: string) {
  const response = await fetch(`/data-management/runways/${runwayId}`, {
    method: 'DELETE',
  })

  await ensureOk(response)
}

export async function createStation(payload: StationPayload): Promise<RunwayMutationResult> {
  const response = await fetch('/data-management/stations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureOk(response)

  return normalizeAirportMutationResult(await readJson<AirportMutationResponse>(response))
}

export async function updateStation(stationId: string, payload: StationPayload): Promise<RunwayMutationResult> {
  const response = await fetch(`/data-management/stations/${stationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  await ensureOk(response)

  return normalizeAirportMutationResult(await readJson<AirportMutationResponse>(response))
}

export async function deleteStation(stationId: string) {
  const response = await fetch(`/data-management/stations/${stationId}`, {
    method: 'DELETE',
  })

  await ensureOk(response)
}

export async function getAirportOptions(): Promise<SelectOption[]> {
  const response = await fetch('/data-management/options/airports')

  await ensureOk(response)

  const result = await readJson<AirportOptionResponse[]>(response)
  return Array.isArray(result)
    ? result.map((item) => normalizeAirportOption(item)).filter((item): item is SelectOption => item !== null)
    : []
}

export async function getStationTypeOptions(): Promise<SelectOption[]> {
  const response = await fetch('/data-management/options/station-types')

  await ensureOk(response)

  const result = await readJson<StationTypeOptionResponse[]>(response)
  return Array.isArray(result)
    ? result.map((item) => normalizeStationTypeOption(item)).filter((item): item is SelectOption => item !== null)
    : []
}

export async function importAirports(files: File[]): Promise<ImportAirportsResult> {
  const formData = new FormData()
  files.forEach((file) => formData.append('excelFiles', file))

  const response = await fetch('/data-management/import/airports', {
    method: 'POST',
    body: formData,
  })

  await ensureOk(response)
  return readJson<ImportAirportsResult>(response)
}
