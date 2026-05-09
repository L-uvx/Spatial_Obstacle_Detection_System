import type { AnalysisRuleMetrics } from '../types/tool'

export interface MetricsDisplayEntry {
  label: string
  displayValue: string
}

const METRICS_DISPLAY: [string, string][] = [
  ['isInProtectionZone', '是否进入保护区'],

  ['actualDistanceMeters', '实际距离（米）'],
  ['requiredDistanceMeters', '所需最小间距（米）'],
  ['minimumDistanceMeters', '最小防护间距（米）'],
  ['minDistanceMeters', '最小距离（米）'],
  ['maxDistanceMeters', '最大距离（米）'],
  ['clampedDistanceMeters', '钳位后距离（米）'],
  ['forwardDistanceMeters', '前向距离（米）'],
  ['effectiveForwardDistanceMeters', '有效前向距离（米）'],
  ['coverageRadiusMeters', '覆盖半径（米）'],
  ['radiusMeters', '保护区半径（米）'],
  ['innerRadiusMeters', '环带内半径（米）'],
  ['outerRadiusMeters', '环带外半径（米）'],
  ['shadowRadiusMeters', '阴影区外缘半径（米）'],
  ['rectangleLengthMeters', '矩形长度（米）'],
  ['runwayLengthMeters', '跑道长度（米）'],

  ['baseHeightMeters', '基准面高程（米）'],
  ['benchmarkHeightMeters', '基准面高程（米）'],
  ['topElevationMeters', '障碍物顶部高程（米）'],
  ['allowedHeightMeters', '允许高度（米）'],
  ['heightLimitMeters', '限高（米）'],
  ['limitHeightMeters', '限制高度（米）'],
  ['clearanceLimitHeightMeters', '净空限制高度（米）'],
  ['worstAllowedHeightMeters', '最不利点允许高度（米）'],
  ['overHeightMeters', '高度超出量（米）'],
  ['heightDiffMeters', '与基准面高差（米）'],


  ['actualElevationAngleDegrees', '实际仰角（度）'],
  ['elevationAngleDegrees', '限制仰角（度）'],
  ['verticalAngleDegrees', '实际仰角（度）'],
  ['limitAngleDegrees', '限制仰角（度）'],
  ['verticalMaskAngleDegrees', '垂直遮蔽角（度）'],
  ['horizontalMaskAngleDegrees', '水平遮蔽角（度）'],
  ['verticalLimitAngleDegrees', '垂直遮蔽角限值（度）'],
  ['horizontalLimitAngleDegrees', '水平遮蔽角限值（度）'],
  ['horizontalAngularWidthDegrees', '水平角宽度（度）'],
  ['centerDirectionDegrees', '障碍物中心方向（度）'],
  ['runwayDirectionDegrees', '跑道方向（度）'],

  ['areaType', '区域类型'],
  ['runwayNumber', '跑道编号'],
  ['boundaryMode', '边界模式'],
  ['stationSubType', '台站子类型'],
  ['delegatedRule', '委派规则代码'],

  ['isCable', '是否线缆类障碍物'],
  ['isAirportRingRoad', '是否环场路'],
  ['isRoadOrRail', '是否道路或铁路类'],
  ['isInRunwayTriangle', '是否在跑道三角区内'],
  ['requiresClearanceEvaluation', '是否需净空限高评估'],
  ['triangleGateApplied', '是否已应用三角区门控'],
  ['gatedByRunwayTriangle', '是否被三角区门控拦截'],
]

export function getMetricsEntries(metrics: AnalysisRuleMetrics | null): MetricsDisplayEntry[] {
  if (!metrics) {
    return []
  }

  const entries: MetricsDisplayEntry[] = []
  const m = metrics as unknown as Record<string, unknown>

  for (const [key, label] of METRICS_DISPLAY) {
    const value = m[key]
    if (value === undefined || value === null) {
      continue
    }
    const displayValue = typeof value === 'boolean' ? (value ? '是' : '否') : String(value)
    entries.push({ label, displayValue })
  }

  return entries
}
