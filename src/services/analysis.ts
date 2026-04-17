import type {
  AnalysisSelectedTarget,
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneRadialBandGeometry,
  ProtectionZoneCircleGeometry,
  ProtectionZoneFlatVertical,
  ProtectionZoneRegion,
  ProtectionZoneRegionProperties,
  ProtectionZoneSectorGeometry,
} from '../types/tool'

export interface AnalysisTaskStatusResult {
  analysisTaskId: string
  status: string
  message: string
  progressPercent: number
  importTaskId: string
  targetIds: number[]
}

export interface AnalysisTaskResult {
  analysisTaskId: string
  status: string
  importTaskId: string
  targetIds: number[]
  selectedTargets: AnalysisSelectedTarget[]
  obstacleCount: number
  summary: string
  protectionZones: ProtectionZoneRegion[]
}

interface ProtectionZoneResponse {
  id: number | string
  airportId: number | string
  airportName: string
  stationId: number | string
  stationName: string
  stationType: string
  ruleCode: string
  ruleName: string
  zoneCode: string
  zoneName: string
  regionCode: string
  regionName: string
  geometry: unknown
  vertical: unknown
  properties?: ProtectionZoneRegionProperties
}

interface AnalysisTaskResultResponse {
  analysisTaskId: string
  status: string
  importTaskId: string
  targetIds: number[]
  selectedTargets?: Array<{
    id: number | string
    name: string
    category: '机场' | '空管局'
  }>
  obstacleCount: number
  summary: string
  protectionZones?: ProtectionZoneResponse[]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeProtectionZoneGeometry(
  geometry: unknown,
): ProtectionZoneCircleGeometry | ProtectionZoneSectorGeometry | ProtectionZoneRadialBandGeometry | null {
  if (!geometry || typeof geometry !== 'object') {
    return null
  }

  const candidate = geometry as Record<string, unknown>

  if (candidate.shapeType === 'circle') {
    const center = candidate.center as Record<string, unknown> | undefined

    if (
      !isFiniteNumber(center?.longitude)
      || !isFiniteNumber(center?.latitude)
      || !isFiniteNumber(candidate.radiusMeters)
    ) {
      return null
    }

    return {
      shapeType: 'circle',
      center: {
        longitude: center.longitude,
        latitude: center.latitude,
      },
      radiusMeters: candidate.radiusMeters,
    }
  }

  if (candidate.shapeType === 'sector') {
    const center = candidate.center as Record<string, unknown> | undefined

    if (
      !isFiniteNumber(center?.longitude)
      || !isFiniteNumber(center?.latitude)
      || !isFiniteNumber(candidate.innerRadiusMeters)
      || !isFiniteNumber(candidate.outerRadiusMeters)
      || !isFiniteNumber(candidate.startAzimuthDegrees)
      || !isFiniteNumber(candidate.endAzimuthDegrees)
    ) {
      return null
    }

    return {
      shapeType: 'sector',
      center: {
        longitude: center.longitude,
        latitude: center.latitude,
      },
      innerRadiusMeters: candidate.innerRadiusMeters,
      outerRadiusMeters: candidate.outerRadiusMeters,
      startAzimuthDegrees: candidate.startAzimuthDegrees,
      endAzimuthDegrees: candidate.endAzimuthDegrees,
    }
  }

  if (candidate.shapeType === 'radial_band') {
    const center = candidate.center as Record<string, unknown> | undefined

    if (
      !isFiniteNumber(center?.longitude)
      || !isFiniteNumber(center?.latitude)
      || !isFiniteNumber(candidate.innerRadiusMeters)
      || !isFiniteNumber(candidate.outerRadiusMeters)
    ) {
      return null
    }

    return {
      shapeType: 'radial_band',
      center: {
        longitude: center.longitude,
        latitude: center.latitude,
      },
      innerRadiusMeters: candidate.innerRadiusMeters,
      outerRadiusMeters: candidate.outerRadiusMeters,
    }
  }

  return null
}

function normalizeProtectionZoneVertical(
  vertical: unknown,
): ProtectionZoneFlatVertical | ProtectionZoneAnalyticSurfaceVertical | null {
  if (!vertical || typeof vertical !== 'object') {
    return null
  }

  const candidate = vertical as Record<string, unknown>

  if (candidate.mode === 'flat') {
    if (candidate.baseReference !== 'station' || !isFiniteNumber(candidate.baseHeightMeters)) {
      return null
    }

    return {
      mode: 'flat',
      baseReference: 'station',
      baseHeightMeters: candidate.baseHeightMeters,
    }
  }

  if (candidate.mode === 'analytic_surface') {
    const heightFunction = candidate.heightFunction as Record<string, unknown> | undefined

    if (!heightFunction || typeof heightFunction !== 'object') {
      return null
    }

    if (
      candidate.baseReference !== 'station'
      || !isFiniteNumber(candidate.baseHeightMeters)
      || heightFunction?.type !== 'elevation_angle'
      || heightFunction.distanceMetric !== 'radial'
      || !isFiniteNumber(heightFunction.elevationAngleDegrees)
      || !isFiniteNumber(heightFunction.startDistanceMeters)
      || !isFiniteNumber(heightFunction.endDistanceMeters)
    ) {
      return null
    }

    return {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: candidate.baseHeightMeters,
      heightFunction: {
        type: 'elevation_angle',
        distanceMetric: 'radial',
        elevationAngleDegrees: heightFunction.elevationAngleDegrees,
        startDistanceMeters: heightFunction.startDistanceMeters,
        endDistanceMeters: heightFunction.endDistanceMeters,
      },
    }
  }

  return null
}

function normalizeProtectionZone(zone: ProtectionZoneResponse): ProtectionZoneRegion | null {
  const geometry = normalizeProtectionZoneGeometry(zone.geometry)
  const vertical = normalizeProtectionZoneVertical(zone.vertical)

  if (!geometry || !vertical) {
    return null
  }

  if (geometry.shapeType === 'circle' && vertical.mode !== 'flat') {
    return null
  }

  if (geometry.shapeType === 'sector' && vertical.mode !== 'analytic_surface') {
    return null
  }

  if (geometry.shapeType === 'radial_band' && vertical.mode !== 'analytic_surface') {
    return null
  }

  return {
    id: String(zone.id),
    airportId: String(zone.airportId),
    airportName: zone.airportName,
    stationId: String(zone.stationId),
    stationName: zone.stationName,
    stationType: zone.stationType,
    ruleCode: zone.ruleCode,
    ruleName: zone.ruleName,
    zoneCode: zone.zoneCode,
    zoneName: zone.zoneName,
    regionCode: zone.regionCode,
    regionName: zone.regionName,
    geometry,
    vertical,
    properties: zone.properties ?? {},
  }
}

function normalizeProtectionZones(zones: ProtectionZoneResponse[]): ProtectionZoneRegion[] {
  return zones.flatMap((zone) => {
    const normalizedZone = normalizeProtectionZone(zone)

    return normalizedZone ? [normalizedZone] : []
  })
}

function parseErrorDetail(detail: unknown, fallbackMessage: string) {
  if (typeof detail === 'string' && detail) {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstItem = detail[0] as { msg?: string } | undefined

    if (firstItem?.msg) {
      return firstItem.msg
    }
  }

  return fallbackMessage
}

export async function createAnalysisTask(input: {
  importTaskId: string
  targetIds: Array<string | number>
}): Promise<AnalysisTaskStatusResult> {
  if (input.targetIds.some((item) => typeof item === 'string' && item.trim().length === 0)) {
    throw new Error('分析目标 id 无效')
  }

  const targetIds = input.targetIds.map((item) => Number(item))

  if (targetIds.some((item) => !Number.isFinite(item))) {
    throw new Error('分析目标 id 无效')
  }

  const response = await fetch('/polygon-obstacle/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      importTaskId: input.importTaskId,
      targetIds,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `分析任务创建失败：${response.status}`))
  }

  const result = (await response.json()) as AnalysisTaskStatusResult

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
  }
}

export async function getAnalysisTaskStatus(taskId: string): Promise<AnalysisTaskStatusResult> {
  const response = await fetch(`/polygon-obstacle/analysis/${taskId}/status`)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `分析状态查询失败：${response.status}`))
  }

  const result = (await response.json()) as AnalysisTaskStatusResult

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
  }
}

export async function getAnalysisTaskResult(taskId: string): Promise<AnalysisTaskResult> {
  const response = await fetch(`/polygon-obstacle/analysis/${taskId}/result`)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `分析结果查询失败：${response.status}`))
  }

  const result = (await response.json()) as AnalysisTaskResultResponse

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
    selectedTargets: (result.selectedTargets ?? []).map((item) => ({
      id: String(item.id),
      name: item.name,
      category: item.category,
    })),
    obstacleCount: result.obstacleCount,
    summary: result.summary,
    protectionZones: normalizeProtectionZones(result.protectionZones ?? []),
  }
}
