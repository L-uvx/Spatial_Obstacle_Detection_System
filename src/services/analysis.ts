import type {
  AnalysisRuleResult,
  AnalysisRuleStandardResult,
  AnalysisSelectedTarget,
  PositionCoordinate,
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneFlatVertical,
  ProtectionZoneMultipolygonGeometry,
  ProtectionZoneRegion,
  ProtectionZoneRegionProperties,
  MultiPolygonCoordinates,
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
  ruleResults: AnalysisRuleResult[]
}

interface AnalysisRuleStandardResponse {
  code?: string
  text?: string
  isCompliant?: boolean
}

interface AnalysisRuleResultResponse {
  stationId: number | string
  stationName: string
  stationType: string
  obstacleId: number | string
  obstacleName: string
  rawObstacleType: string
  globalObstacleCategory: string
  ruleName: string
  zoneCode: string
  zoneName: string
  regionCode: string
  regionName: string
  isApplicable: boolean
  isCompliant: boolean
  message: string
  standards?: {
    gb?: AnalysisRuleStandardResponse
    mh?: AnalysisRuleStandardResponse
  }
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
  ruleResults?: AnalysisRuleResultResponse[]
}

function normalizeAnalysisRuleStandard(
  standard: AnalysisRuleStandardResponse | undefined,
): AnalysisRuleStandardResult | null {
  if (!standard || typeof standard.code !== 'string' || typeof standard.text !== 'string') {
    return null
  }

  return {
    code: standard.code,
    text: standard.text,
    isCompliant: standard.isCompliant === true,
  }
}

function normalizeAnalysisRuleResults(results: AnalysisRuleResultResponse[] = []): AnalysisRuleResult[] {
  return results.map((item) => ({
    stationId: String(item.stationId),
    stationName: item.stationName,
    stationType: item.stationType,
    obstacleId: String(item.obstacleId),
    obstacleName: item.obstacleName,
    rawObstacleType: item.rawObstacleType,
    globalObstacleCategory: item.globalObstacleCategory,
    ruleName: item.ruleName,
    zoneCode: item.zoneCode,
    zoneName: item.zoneName,
    regionCode: item.regionCode,
    regionName: item.regionName,
    isApplicable: item.isApplicable,
    isCompliant: item.isCompliant,
    message: item.message,
    standards: {
      gb: normalizeAnalysisRuleStandard(item.standards?.gb),
      mh: normalizeAnalysisRuleStandard(item.standards?.mh),
    },
  }))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeProtectionZoneGeometry(
  geometry: unknown,
): ProtectionZoneMultipolygonGeometry | null {
  if (!geometry || typeof geometry !== 'object') {
    return null
  }

  const candidate = geometry as Record<string, unknown>

  if (candidate.shapeType !== 'multipolygon') {
    return null
  }

  const coordinates = candidate.coordinates

  if (!Array.isArray(coordinates) || !isValidMultiPolygonCoordinates(coordinates)) {
    return null
  }

  return {
    shapeType: 'multipolygon',
    coordinates,
  }
}

function isValidPositionCoordinate(value: unknown): value is PositionCoordinate {
  return Array.isArray(value)
    && value.length === 2
    && isFiniteNumber(value[0])
    && isFiniteNumber(value[1])
}

function isValidPositionCoordinateList(value: unknown, minimumLength = 1): value is PositionCoordinate[] {
  return Array.isArray(value) && value.length >= minimumLength && value.every(isValidPositionCoordinate)
}

function isClosedLinearRing(value: PositionCoordinate[]) {
  const firstPosition = value[0]
  const lastPosition = value[value.length - 1]

  return firstPosition[0] === lastPosition[0] && firstPosition[1] === lastPosition[1]
}

function isValidLinearRingCoordinates(value: unknown): value is MultiPolygonCoordinates[number][number][number] {
  return Array.isArray(value)
    && value.length >= 4
    && value.every(isValidPositionCoordinate)
    && isClosedLinearRing(value)
}

function isValidPolygonCoordinates(value: unknown): value is MultiPolygonCoordinates[number][number] {
  return Array.isArray(value) && value.length > 0 && value.every(isValidLinearRingCoordinates)
}

function isValidMultiPolygonCoordinates(value: unknown): value is MultiPolygonCoordinates {
  return Array.isArray(value) && value.length > 0 && value.every(isValidPolygonCoordinates)
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
    const surface = candidate.surface as Record<string, unknown> | undefined

    if (
      candidate.baseReference !== 'station'
      || !isFiniteNumber(candidate.baseHeightMeters)
      || !surface
    ) {
      return null
    }

    if (surface.type === 'loc_building_restriction_zone_region_3') {
      const stationPoint = surface.stationPoint
      const apexPoint = surface.apexPoint
      const rootLeftPoint = surface.rootLeftPoint
      const rootRightPoint = surface.rootRightPoint
      const arcPoints = surface.arcPoints

      if (
        !isValidPositionCoordinate(stationPoint)
        || !isValidPositionCoordinate(apexPoint)
        || !isValidPositionCoordinate(rootLeftPoint)
        || !isValidPositionCoordinate(rootRightPoint)
        || !isValidPositionCoordinateList(arcPoints, 2)
        || !isFiniteNumber(surface.arcRadiusMeters)
        || !isFiniteNumber(surface.arcHeightMeters)
        || !isFiniteNumber(surface.alphaDegrees)
      ) {
        return null
      }

      return {
        mode: 'analytic_surface',
        baseReference: 'station',
        baseHeightMeters: candidate.baseHeightMeters,
        surface: {
          type: 'loc_building_restriction_zone_region_3',
          stationPoint: [stationPoint[0], stationPoint[1]],
          apexPoint: [apexPoint[0], apexPoint[1]],
          rootLeftPoint: [rootLeftPoint[0], rootLeftPoint[1]],
          rootRightPoint: [rootRightPoint[0], rootRightPoint[1]],
          arcRadiusMeters: surface.arcRadiusMeters,
          arcPoints: arcPoints.map((point) => [point[0], point[1]] as [number, number]),
          arcHeightMeters: surface.arcHeightMeters,
          alphaDegrees: surface.alphaDegrees,
        },
      }
    }

    const distanceSource = surface?.distanceSource as Record<string, unknown> | undefined
    const clampRange = surface?.clampRange as Record<string, unknown> | undefined
    const heightModel = surface?.heightModel as Record<string, unknown> | undefined
    const point = distanceSource?.point

    if (
      surface.type !== 'distance_parameterized'
      || !distanceSource
      || distanceSource.kind !== 'point'
      || !isValidPositionCoordinate(point)
      || surface.distanceMetric !== 'radial'
      || !clampRange
      || !isFiniteNumber(clampRange.startMeters)
      || !isFiniteNumber(clampRange.endMeters)
      || !heightModel
      || heightModel.type !== 'angle_linear_rise'
      || !isFiniteNumber(heightModel.angleDegrees)
    ) {
      return null
    }

    const normalizedPoint: PositionCoordinate = [point[0], point[1]]
    const normalizedDistanceOffsetMeters = heightModel.distanceOffsetMeters as number

    return {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: candidate.baseHeightMeters,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'point',
          point: normalizedPoint,
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: clampRange.startMeters,
          endMeters: clampRange.endMeters,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: heightModel.angleDegrees,
          distanceOffsetMeters: normalizedDistanceOffsetMeters,
        },
      },
    }
  }

  return null
}

function warnInvalidProtectionZone(zone: ProtectionZoneResponse, reason: string) {
  console.warn('[analysis] Ignored invalid protection zone region.', {
    airportId: String(zone.airportId),
    stationId: String(zone.stationId),
    zoneCode: zone.zoneCode,
    regionCode: zone.regionCode,
    reason,
  })
}

function normalizeProtectionZone(zone: ProtectionZoneResponse): ProtectionZoneRegion | null {
  const geometry = normalizeProtectionZoneGeometry(zone.geometry)

  if (!geometry) {
    warnInvalidProtectionZone(zone, 'geometry is not a valid multipolygon')
    return null
  }

  const vertical = normalizeProtectionZoneVertical(zone.vertical)

  if (!vertical) {
    warnInvalidProtectionZone(zone, 'vertical is not a supported formal model')
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
    ruleResults: normalizeAnalysisRuleResults(result.ruleResults ?? []),
  }
}
