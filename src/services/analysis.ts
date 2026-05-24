import type {
  AnalysisRuleMetrics,
  AnalysisRuleResult,
  AnalysisRuleStandardResult,
  AnalysisSelectedTarget,
  PositionCoordinate,
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneFlatVertical,
  ProtectionZoneMultipolygonGeometry,
  ProtectionZoneRegion,
  ProtectionZoneRegionProperties,
  ProtectionZoneStyle,
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
  targetResults: { targetId: number; targetName: string; ruleResults: AnalysisRuleResult[] }[]
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
  ruleCode: string
  ruleName: string
  zoneCode: string
  zoneName: string
  regionCode: string
  regionName: string
  isApplicable: boolean
  isCompliant: boolean
  message: string
  metrics?: Record<string, unknown>
  standards?: {
    gb?: AnalysisRuleStandardResponse[]
    mh?: AnalysisRuleStandardResponse[]
  }
  overDistanceMeters?: number
  azimuthDegrees?: number
  maxHorizontalAngleDegrees?: number
  minHorizontalAngleDegrees?: number
  relativeHeightMeters?: number
  isInRadius?: boolean
  isInZone?: boolean
  details?: string
}

interface AnalysisTargetResultResponse {
  targetId: number
  targetName: string
  ruleResults: AnalysisRuleResultResponse[]
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
  style?: {
    fill?: unknown
  }
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
  targetResults?: AnalysisTargetResultResponse[]
}

function isFiniteNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item))
}

function isValidAnalysisTaskStatusResult(value: unknown): value is AnalysisTaskStatusResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.analysisTaskId === 'string'
    && typeof candidate.status === 'string'
    && typeof candidate.message === 'string'
    && typeof candidate.progressPercent === 'number'
    && Number.isFinite(candidate.progressPercent)
    && typeof candidate.importTaskId === 'string'
    && isFiniteNumberArray(candidate.targetIds)
  )
}

function isValidAnalysisSelectedTargetResponse(
  value: unknown,
): value is NonNullable<AnalysisTaskResultResponse['selectedTargets']>[number] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    (typeof candidate.id === 'string' || typeof candidate.id === 'number')
    && typeof candidate.name === 'string'
    && (candidate.category === '机场' || candidate.category === '空管局')
  )
}

function normalizeAnalysisSelectedTargets(
  selectedTargets: AnalysisTaskResultResponse['selectedTargets'] = [],
): AnalysisSelectedTarget[] {
  return selectedTargets.flatMap((item) => {
    if (!isValidAnalysisSelectedTargetResponse(item)) {
      return []
    }

    return [{
      id: String(item.id),
      name: item.name,
      category: item.category,
    }]
  })
}

function isValidAnalysisTaskResultResponse(value: unknown): value is AnalysisTaskResultResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.analysisTaskId === 'string'
    && typeof candidate.status === 'string'
    && typeof candidate.importTaskId === 'string'
    && isFiniteNumberArray(candidate.targetIds)
    && typeof candidate.obstacleCount === 'number'
    && Number.isFinite(candidate.obstacleCount)
    && typeof candidate.summary === 'string'
    && (candidate.selectedTargets === undefined || Array.isArray(candidate.selectedTargets))
    && (candidate.protectionZones === undefined || Array.isArray(candidate.protectionZones))
    && (candidate.targetResults === undefined || Array.isArray(candidate.targetResults))
  )
}

function asNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

function asStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function normalizeAnalysisRuleMetrics(
  raw: unknown,
): AnalysisRuleMetrics | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const m = raw as Record<string, unknown>

  return {
    isInProtectionZone: m.enteredProtectionZone === true,
    actualDistanceMeters: asNum(m.actualDistanceMeters),
    requiredDistanceMeters: asNum(m.requiredDistanceMeters),
    actualElevationAngleDegrees: asNum(m.actualElevationAngleDegrees),
    baseHeightMeters: asNum(m.baseHeightMeters),
    elevationAngleDegrees: asNum(m.elevationAngleDegrees),
    allowedHeightMeters: asNum(m.allowedHeightMeters),
    topElevationMeters: asNum(m.topElevationMeters),
    innerRadiusMeters: asNum(m.innerRadiusMeters),
    outerRadiusMeters: asNum(m.outerRadiusMeters),
    rectangleLengthMeters: asNum(m.rectangleLengthMeters),
    heightLimitMeters: asNum(m.heightLimitMeters),
    worstAllowedHeightMeters: asNum(m.worstAllowedHeightMeters),
    areaType: asStr(m.areaType),
    limitHeightMeters: asNum(m.limitHeightMeters),
    centerDirectionDegrees: asNum(m.centerDirectionDegrees) ?? null,
    effectiveForwardDistanceMeters: asNum(m.effectiveForwardDistanceMeters) ?? null,
    isCable: asBool(m.isCable),
    forwardDistanceMeters: asNum(m.forwardDistanceMeters) ?? null,
    isAirportRingRoad: asBool(m.isAirportRingRoad),
    requiresClearanceEvaluation: asBool(m.requiresClearanceEvaluation),
    clearanceLimitHeightMeters: asNum(m.clearanceLimitHeightMeters),
    overHeightMeters: asNum(m.overHeightMeters) ?? null,
    stationSubType: asStr(m.stationSubType),
    isRoadOrRail: asBool(m.isRoadOrRail),
    minDistanceMeters: asNum(m.minDistanceMeters),
    verticalAngleDegrees: asNum(m.verticalAngleDegrees) ?? null,
    limitAngleDegrees: asNum(m.limitAngleDegrees),
    radiusMeters: asNum(m.radiusMeters),
    minimumDistanceMeters: asNum(m.minimumDistanceMeters),
    coverageRadiusMeters: asNum(m.coverageRadiusMeters),
    relativeHeightMeters: asNum(m.relativeHeightMeters),
    verticalMaskAngleDegrees: asNum(m.verticalMaskAngleDegrees),
    horizontalMaskAngleDegrees: asNum(m.horizontalMaskAngleDegrees),
    verticalLimitAngleDegrees: asNum(m.verticalLimitAngleDegrees),
    horizontalLimitAngleDegrees: asNum(m.horizontalLimitAngleDegrees),
    isInRunwayTriangle: asBool(m.isInRunwayTriangle),
    runwayNumber: asStr(m.runwayNumber),
    runwayLengthMeters: asNum(m.runwayLengthMeters),
    runwayDirectionDegrees: asNum(m.runwayDirectionDegrees),
    triangleGateApplied: asBool(m.triangleGateApplied),
    gatedByRunwayTriangle: asBool(m.gatedByRunwayTriangle),
    boundaryMode: asStr(m.boundaryMode),
    maxDistanceMeters: asNum(m.maxDistanceMeters),
    clampedDistanceMeters: asNum(m.clampedDistanceMeters),
    shadowRadiusMeters: asNum(m.shadowRadiusMeters),
    benchmarkHeightMeters: asNum(m.benchmarkHeightMeters),
    heightDiffMeters: asNum(m.heightDiffMeters),
    horizontalAngularWidthDegrees: asNum(m.horizontalAngularWidthDegrees),
    delegatedRule: asStr(m.delegatedRule),
  }
}

function normalizeAnalysisRuleStandardList(
  standards: AnalysisRuleStandardResponse[] | undefined,
): AnalysisRuleStandardResult[] {
  if (!Array.isArray(standards)) {
    return []
  }
  return standards
    .filter((s) => typeof s.code === 'string' && typeof s.text === 'string')
    .map((s) => ({
      code: s.code as string,
      text: s.text as string,
      isCompliant: s.isCompliant === true,
    }))
}

function isValidAnalysisRuleResultResponse(item: unknown): item is AnalysisRuleResultResponse {
  if (!item || typeof item !== 'object') {
    return false
  }

  const candidate = item as Record<string, unknown>

  return (
    (typeof candidate.stationId === 'string' || typeof candidate.stationId === 'number')
    && typeof candidate.stationName === 'string'
    && typeof candidate.stationType === 'string'
    && (typeof candidate.obstacleId === 'string' || typeof candidate.obstacleId === 'number')
    && typeof candidate.obstacleName === 'string'
    && typeof candidate.rawObstacleType === 'string'
    && typeof candidate.globalObstacleCategory === 'string'
    && typeof candidate.ruleCode === 'string'
    && typeof candidate.ruleName === 'string'
    && typeof candidate.zoneCode === 'string'
    && typeof candidate.zoneName === 'string'
    && typeof candidate.regionCode === 'string'
    && typeof candidate.regionName === 'string'
    && typeof candidate.isApplicable === 'boolean'
    && typeof candidate.isCompliant === 'boolean'
    && typeof candidate.message === 'string'
  )
}

function normalizeAnalysisRuleResults(results: unknown[] = []): AnalysisRuleResult[] {
  return results.flatMap((item) => {
    if (!isValidAnalysisRuleResultResponse(item)) {
      return []
    }

    return [{
      stationId: String(item.stationId),
      stationName: item.stationName,
      stationType: item.stationType,
      obstacleId: String(item.obstacleId),
      obstacleName: item.obstacleName,
      rawObstacleType: item.rawObstacleType,
      globalObstacleCategory: item.globalObstacleCategory,
      ruleCode: item.ruleCode,
      ruleName: item.ruleName,
      zoneCode: item.zoneCode,
      zoneName: item.zoneName,
      regionCode: item.regionCode,
      regionName: item.regionName,
      isApplicable: item.isApplicable,
      isCompliant: item.isCompliant,
      message: item.message,
      metrics: normalizeAnalysisRuleMetrics(item.metrics),
      standards: {
        gb: normalizeAnalysisRuleStandardList(item.standards?.gb),
        mh: normalizeAnalysisRuleStandardList(item.standards?.mh),
      },
      overDistanceMeters: Number(item.overDistanceMeters) || 0,
      azimuthDegrees: Number(item.azimuthDegrees) || 0,
      maxHorizontalAngleDegrees: Number(item.maxHorizontalAngleDegrees) || 0,
      minHorizontalAngleDegrees: Number(item.minHorizontalAngleDegrees) || 0,
      relativeHeightMeters: Number(item.relativeHeightMeters) || 0,
      isInRadius: item.isInRadius === true,
      isInZone: item.isInZone === true,
      details: String(item.details ?? ''),
    }]
  })
}

function normalizeAnalysisTargetResults(targets: AnalysisTargetResultResponse[] = []): AnalysisTaskResult['targetResults'] {
  return targets.map((t) => ({
    targetId: t.targetId,
    targetName: t.targetName,
    ruleResults: normalizeAnalysisRuleResults(t.ruleResults ?? []),
  }))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeProtectionZoneStyle(style: ProtectionZoneResponse['style']): ProtectionZoneStyle | undefined {
  if (!style || typeof style.fill !== 'string' || style.fill.trim().length === 0) {
    return undefined
  }

  return {
    fill: style.fill,
  }
}

function normalizeProtectionZoneProperties(properties: unknown): ProtectionZoneRegionProperties {
  if (!properties || typeof properties !== 'object') {
    return {}
  }

  const candidate = properties as Record<string, unknown>
  const normalized: ProtectionZoneRegionProperties = {}

  if (typeof candidate.label === 'string') {
    normalized.label = candidate.label
  }

  return normalized
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
    if (
      (candidate.baseReference !== 'station' && candidate.baseReference !== 'runway')
      || !isFiniteNumber(candidate.baseHeightMeters)
    ) {
      return null
    }

    return {
      mode: 'flat',
      baseReference: candidate.baseReference,
      baseHeightMeters: candidate.baseHeightMeters,
    }
  }

  if (candidate.mode === 'analytic_surface') {
    const surface = candidate.surface as Record<string, unknown> | undefined

    if (
      (candidate.baseReference !== 'station' && candidate.baseReference !== 'gp360_altitude')
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
        baseReference: candidate.baseReference,
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
    const isPointRadialSurface = surface.type === 'distance_parameterized' || surface.type === 'radial_cone_surface'

    if (
      !isPointRadialSurface && surface.type !== 'distance_parameterized'
      || !distanceSource
      || !clampRange
      || !isFiniteNumber(clampRange.startMeters)
      || !isFiniteNumber(clampRange.endMeters)
      || !heightModel
    ) {
      return null
    }

    if (distanceSource.kind === 'point') {
      const point = distanceSource.point

      if (!isValidPositionCoordinate(point) || surface.distanceMetric !== 'radial') {
        return null
      }

      const normalizedPoint: PositionCoordinate = [point[0], point[1]]

      if (
        heightModel.type === 'angle_linear_rise'
        && isFiniteNumber(heightModel.angleDegrees)
        && isFiniteNumber(heightModel.distanceOffsetMeters)
      ) {
        const normalizedSurfaceType = surface.type === 'radial_cone_surface'
          ? 'radial_cone_surface'
          : 'distance_parameterized'

        return {
          mode: 'analytic_surface',
          baseReference: candidate.baseReference,
          baseHeightMeters: candidate.baseHeightMeters,
          surface: {
            type: normalizedSurfaceType,
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
              distanceOffsetMeters: heightModel.distanceOffsetMeters,
            },
          },
        }
      }

      if (
        heightModel.type === 'radar_site_protection_mask_angle'
        && heightModel.angleDegrees === null
        && isFiniteNumber(heightModel.distanceOffsetMeters)
        && isFiniteNumber(heightModel.maskAngleDegrees)
        && isFiniteNumber(heightModel.distanceKilometersCorrectionDivisor)
        && heightModel.distanceKilometersCorrectionDivisor > 0
      ) {
        const normalizedSurfaceType = surface.type === 'radial_cone_surface'
          ? 'radial_cone_surface'
          : 'distance_parameterized'

        return {
          mode: 'analytic_surface',
          baseReference: candidate.baseReference,
          baseHeightMeters: candidate.baseHeightMeters,
          surface: {
            type: normalizedSurfaceType,
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
              type: 'radar_site_protection_mask_angle',
              angleDegrees: null,
              distanceOffsetMeters: heightModel.distanceOffsetMeters,
              maskAngleDegrees: heightModel.maskAngleDegrees,
              distanceKilometersCorrectionDivisor: heightModel.distanceKilometersCorrectionDivisor,
            },
          },
        }
      }

      return null
    }

    if (surface.type === 'radial_cone_surface') {
      return null
    }

    if (distanceSource.kind === 'front_reference_line') {
      const stationPoint = distanceSource.stationPoint
      const centerPoint = distanceSource.centerPoint
      const leftPoint = distanceSource.leftPoint
      const rightPoint = distanceSource.rightPoint
      const planarControl = surface.planarControl as Record<string, unknown> | undefined

      if (
        !isValidPositionCoordinate(stationPoint)
        || !isValidPositionCoordinate(centerPoint)
        || !isValidPositionCoordinate(leftPoint)
        || !isValidPositionCoordinate(rightPoint)
        || !planarControl
        || !isFiniteNumber(planarControl.frontOffsetMeters)
        || !isFiniteNumber(planarControl.halfAngleDegrees)
        || !isFiniteNumber(planarControl.radiusMeters)
        || surface.distanceMetric !== 'axial_from_reference_line'
        || heightModel.type !== 'angle_linear_rise'
        || !isFiniteNumber(heightModel.angleDegrees)
        || !isFiniteNumber(heightModel.distanceOffsetMeters)
      ) {
        return null
      }

      return {
        mode: 'analytic_surface',
        baseReference: candidate.baseReference,
        baseHeightMeters: candidate.baseHeightMeters,
        surface: {
          type: 'distance_parameterized',
          distanceSource: {
            kind: 'front_reference_line',
            stationPoint: [stationPoint[0], stationPoint[1]],
            centerPoint: [centerPoint[0], centerPoint[1]],
            leftPoint: [leftPoint[0], leftPoint[1]],
            rightPoint: [rightPoint[0], rightPoint[1]],
          },
          distanceMetric: 'axial_from_reference_line',
          planarControl: {
            frontOffsetMeters: planarControl.frontOffsetMeters,
            halfAngleDegrees: planarControl.halfAngleDegrees,
            radiusMeters: planarControl.radiusMeters,
          },
          clampRange: {
            startMeters: clampRange.startMeters,
            endMeters: clampRange.endMeters,
          },
          heightModel: {
            type: 'angle_linear_rise',
            angleDegrees: heightModel.angleDegrees,
            distanceOffsetMeters: heightModel.distanceOffsetMeters,
          },
        },
      }
    }

    return null
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

  if (
    vertical.mode === 'analytic_surface'
    && vertical.surface.type === 'radial_cone_surface'
    && (geometry.coordinates.length !== 1 || geometry.coordinates[0]?.length !== 1)
  ) {
    warnInvalidProtectionZone(zone, 'radial_cone_surface requires exactly one polygon outer ring')
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
    properties: normalizeProtectionZoneProperties(zone.properties),
    style: normalizeProtectionZoneStyle(zone.style),
  }
}

function normalizeProtectionZones(zones: ProtectionZoneResponse[]): ProtectionZoneRegion[] {
  return zones.flatMap((zone) => {
    if (!zone || typeof zone !== 'object') {
      return []
    }

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

export async function getAirportProtectionZones(airportId: string): Promise<ProtectionZoneRegion[]> {
  const response = await fetch(`/polygon-obstacle/airport/${airportId}/protection-zones`)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `获取机场保护区失败：${response.status}`))
  }

  const result = await response.json()

  if (
    !result
    || typeof result !== 'object'
    || !Array.isArray((result as Record<string, unknown>).protectionZones)
  ) {
    throw new Error('保护区响应格式无效')
  }

  return normalizeProtectionZones(((result as Record<string, unknown>).protectionZones) as ProtectionZoneResponse[])
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

  const result = await response.json()

  if (!isValidAnalysisTaskStatusResult(result)) {
    throw new Error('分析任务创建响应格式无效')
  }

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

  const result = await response.json()

  if (!isValidAnalysisTaskStatusResult(result)) {
    throw new Error('分析状态响应格式无效')
  }

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

  const result = await response.json()

  if (!isValidAnalysisTaskResultResponse(result)) {
    throw new Error('分析结果响应格式无效')
  }

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
    selectedTargets: normalizeAnalysisSelectedTargets(result.selectedTargets),
    obstacleCount: result.obstacleCount,
    summary: result.summary,
    targetResults: normalizeAnalysisTargetResults(result.targetResults ?? []),
  }
}
