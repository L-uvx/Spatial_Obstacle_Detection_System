export type ToolbarToolKey = 'polygon-obstacle-analysis' | 'point-obstacle-analysis' | 'data-management' | 'reset' | 'top-down'

export type ObstacleAnalysisMode = 'polygon' | 'point'

export type WizardStage =
  | 'idle'
  | 'import-form'
  | 'importing'
  | 'target-selection'
  | 'analyzing'
  | 'analysis-result'
  | 'error'

export type ExportStatus = 'idle' | 'pending' | 'running' | 'succeeded' | 'failed'

export type BootstrapStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ToolbarItem {
  key: ToolbarToolKey
  label: string
  action: 'open-analysis' | 'open-data-management' | 'reset' | 'top-down-view'
  mode?: ObstacleAnalysisMode
}

export interface TargetOption {
  id: string
  name: string
  category: '机场' | '空管局'
  distance: string
}

export interface AnalysisSelectedTarget {
  id: string
  name: string
  category: '机场' | '空管局'
}

export interface AnalysisRuleMetrics {
  /** Maps from backend `enteredProtectionZone`; always `false` if absent */
  isInProtectionZone: boolean
  actualDistanceMeters?: number
  requiredDistanceMeters?: number
  actualElevationAngleDegrees?: number
  baseHeightMeters?: number
  elevationAngleDegrees?: number
  allowedHeightMeters?: number
  topElevationMeters?: number
  innerRadiusMeters?: number
  outerRadiusMeters?: number
  rectangleLengthMeters?: number
  heightLimitMeters?: number
  worstAllowedHeightMeters?: number
  areaType?: string
  limitHeightMeters?: number
  centerDirectionDegrees?: number | null
  effectiveForwardDistanceMeters?: number | null
  isCable?: boolean
  forwardDistanceMeters?: number | null
  isAirportRingRoad?: boolean
  requiresClearanceEvaluation?: boolean
  clearanceLimitHeightMeters?: number
  overHeightMeters?: number | null
  stationSubType?: string
  isRoadOrRail?: boolean
  minDistanceMeters?: number
  verticalAngleDegrees?: number | null
  limitAngleDegrees?: number
  radiusMeters?: number
  minimumDistanceMeters?: number
  coverageRadiusMeters?: number
  relativeHeightMeters?: number
  verticalMaskAngleDegrees?: number
  horizontalMaskAngleDegrees?: number
  verticalLimitAngleDegrees?: number
  horizontalLimitAngleDegrees?: number
  isInRunwayTriangle?: boolean
  runwayNumber?: string
  runwayLengthMeters?: number
  runwayDirectionDegrees?: number
  triangleGateApplied?: boolean
  gatedByRunwayTriangle?: boolean
  boundaryMode?: string
  maxDistanceMeters?: number
  clampedDistanceMeters?: number
  shadowRadiusMeters?: number
  benchmarkHeightMeters?: number
  heightDiffMeters?: number
  horizontalAngularWidthDegrees?: number
  delegatedRule?: string
}

export interface AnalysisRuleStandardResult {
  code: string
  text: string
  isCompliant: boolean
}

export interface AnalysisRuleResult {
  stationId: string
  stationName: string
  stationType: string
  obstacleId: string
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
  metrics: AnalysisRuleMetrics | null
  standards: {
    gb: AnalysisRuleStandardResult[]
    mh: AnalysisRuleStandardResult[]
  }
  overDistanceMeters: number
  azimuthDegrees: number
  maxHorizontalAngleDegrees: number
  minHorizontalAngleDegrees: number
  relativeHeightMeters: number
  isInRadius: boolean
  isInZone: boolean
  details: string
}

export type PositionCoordinate = [number, number]

export type LinearRingCoordinates = PositionCoordinate[]

export type PolygonCoordinates = LinearRingCoordinates[]

export type MultiPolygonCoordinates = PolygonCoordinates[]

export interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: MultiPolygonCoordinates
}

export interface PointGeometry {
  type: 'Point'
  coordinates: PositionCoordinate
}

export type ImportedObstacleGeometry = PointGeometry | MultiPolygonGeometry

export interface RenderedObstacle {
  id: string
  name: string
  obstacleType: string
  topElevation: number
  geometry: ImportedObstacleGeometry
}

export interface RenderedStation {
  id: string
  airportId: string
  name: string
  stationType: string
  longitude: number
  latitude: number
  altitude: number
}

export interface RenderedAirport {
  id: string
  name: string
  longitude: number
  latitude: number
  stations: RenderedStation[]
}

export interface InitialCameraTarget {
  longitude: number
  latitude: number
  height: number
  heading?: number
  pitch: number
  roll?: number
}

export interface ProtectionZoneRegionProperties {
  label?: string
}

export interface ProtectionZoneStyle {
  fill?: string
}

export interface ProtectionZoneMultipolygonGeometry {
  shapeType: 'multipolygon'
  coordinates: MultiPolygonCoordinates
}

export interface ProtectionZoneFlatVertical {
  mode: 'flat'
  baseReference: 'station' | 'runway'
  baseHeightMeters: number
}

export interface ProtectionZonePointDistanceSource {
  kind: 'point'
  point: [number, number]
}

export interface ProtectionZoneFrontReferenceLineDistanceSource {
  kind: 'front_reference_line'
  stationPoint: [number, number]
  centerPoint: [number, number]
  leftPoint: [number, number]
  rightPoint: [number, number]
}

export interface ProtectionZoneFrontReferenceLinePlanarControl {
  frontOffsetMeters: number
  halfAngleDegrees: number
  radiusMeters: number
}

export interface ProtectionZoneAngleLinearRiseHeightModel {
  type: 'angle_linear_rise'
  angleDegrees: number
  distanceOffsetMeters: number
}

export interface ProtectionZoneRadarSiteProtectionMaskAngleHeightModel {
  type: 'radar_site_protection_mask_angle'
  angleDegrees: null
  distanceOffsetMeters: number
  maskAngleDegrees: number
  distanceKilometersCorrectionDivisor: number
}

interface ProtectionZoneDistanceParameterizedSurfaceBase {
  type: 'distance_parameterized'
  clampRange: {
    startMeters: number
    endMeters: number
  }
}

export interface ProtectionZonePointDistanceParameterizedSurface
  extends ProtectionZoneDistanceParameterizedSurfaceBase {
  distanceSource: ProtectionZonePointDistanceSource
  distanceMetric: 'radial'
  heightModel:
  | ProtectionZoneAngleLinearRiseHeightModel
  | ProtectionZoneRadarSiteProtectionMaskAngleHeightModel
}

export interface ProtectionZoneFrontReferenceLineDistanceParameterizedSurface
  extends ProtectionZoneDistanceParameterizedSurfaceBase {
  distanceSource: ProtectionZoneFrontReferenceLineDistanceSource
  distanceMetric: 'axial_from_reference_line'
  planarControl: ProtectionZoneFrontReferenceLinePlanarControl
  heightModel: ProtectionZoneAngleLinearRiseHeightModel
}

export type ProtectionZoneDistanceParameterizedSurface =
  | ProtectionZonePointDistanceParameterizedSurface
  | ProtectionZoneFrontReferenceLineDistanceParameterizedSurface

export interface ProtectionZoneRadialConeSurface {
  type: 'radial_cone_surface'
  distanceSource: ProtectionZonePointDistanceSource
  distanceMetric: 'radial'
  clampRange: {
    startMeters: number
    endMeters: number
  }
  heightModel:
  | ProtectionZoneAngleLinearRiseHeightModel
  | ProtectionZoneRadarSiteProtectionMaskAngleHeightModel
}

export interface ProtectionZoneLocBuildingRestrictionZoneRegion3Surface {
  type: 'loc_building_restriction_zone_region_3'
  stationPoint: [number, number]
  apexPoint: [number, number]
  rootLeftPoint: [number, number]
  rootRightPoint: [number, number]
  arcRadiusMeters: number
  arcPoints: Array<[number, number]>
  arcHeightMeters: number
  alphaDegrees: number
}

export interface ProtectionZoneAnalyticSurfaceVertical {
  mode: 'analytic_surface'
  baseReference: 'station' | 'gp360_altitude'
  baseHeightMeters: number
  surface:
  | ProtectionZoneDistanceParameterizedSurface
  | ProtectionZoneRadialConeSurface
  | ProtectionZoneLocBuildingRestrictionZoneRegion3Surface
}

export interface ProtectionZoneRegion {
  id: string
  airportId: string
  airportName: string
  stationId: string
  stationName: string
  stationType: string
  ruleCode: string
  ruleName: string
  zoneCode: string
  zoneName: string
  regionCode: string
  regionName: string
  geometry: ProtectionZoneMultipolygonGeometry
  vertical: ProtectionZoneFlatVertical | ProtectionZoneAnalyticSurfaceVertical
  properties: ProtectionZoneRegionProperties
  style?: ProtectionZoneStyle
}

export interface ProtectionZoneNode {
  key: string
  airportId: string
  airportName: string
  stationId: string
  stationName: string
  stationType: string
  zoneCode: string
  zoneName: string
  ruleCode: string
  ruleName: string
  visible: boolean
  regions: ProtectionZoneRegion[]
}

export interface ProtectionZoneStationNode {
  stationId: string
  stationName: string
  stationType: string
  visible: boolean
  zones: ProtectionZoneNode[]
}

export interface ProtectionZoneAirportNode {
  airportId: string
  airportName: string
  visible: boolean
  stations: ProtectionZoneStationNode[]
}

export interface VisibleProtectionZoneRegion {
  key: string
  id: string
  airportId: string
  airportName: string
  stationId: string
  stationName: string
  stationType: string
  zoneCode: string
  zoneName: string
  ruleCode: string
  ruleName: string
  regionCode: string
  regionName: string
  geometry: ProtectionZoneMultipolygonGeometry
  vertical: ProtectionZoneFlatVertical | ProtectionZoneAnalyticSurfaceVertical
  properties: ProtectionZoneRegionProperties
  style?: ProtectionZoneStyle
}

export interface ImportFormValue {
  projectName: string
  obstacleType: string
  fileName: string
  file: File | null
}

export interface PolygonObstacleAnalysisState {
  isOpen: boolean
  protectionZonePanelOpen: boolean
  stationPanelOpen: boolean
  analysisMode: ObstacleAnalysisMode
  stage: WizardStage
  bootstrapStatus: BootstrapStatus
  bootstrapMessage: string
  initialCameraTarget: InitialCameraTarget | null
  airports: RenderedAirport[]
  selectedAirportId: string
  visibleStations: RenderedStation[]
  projectName: string
  obstacleType: string
  fileName: string
  importTaskId: string
  importStatus: string
  importProgressPercent: number
  projectId: string
  obstacleBatchId: string
  targetOptions: TargetOption[]
  selectedTargetIds: string[]
  analysisTaskId: string
  analysisSummary: string
  analysisSelectedTargets: AnalysisSelectedTarget[]
  analysisObstacleCount: number
  analysisRuleResults: AnalysisRuleResult[]
  statusMessage: string
  exportTaskId: string
  exportStatus: ExportStatus
  exportProgressPercent: number
  exportMessage: string
  exportFileName: string
  downloadUrl: string
  exportErrorMessage: string
  renderedObstacles: RenderedObstacle[]
  protectionZoneTree: ProtectionZoneAirportNode[]
  loadedProtectionZones: VisibleProtectionZoneRegion[]
  visibleProtectionZones: VisibleProtectionZoneRegion[]
  flyToTargetTick: number
  flyToTargetPayload: InitialCameraTarget | null
  obstacleRebuildTick: number
}

export const toolbarItems: ToolbarItem[] = [
  { key: 'polygon-obstacle-analysis', label: '多边形障碍物分析', action: 'open-analysis', mode: 'polygon' },
  { key: 'point-obstacle-analysis', label: '点障碍物分析', action: 'open-analysis', mode: 'point' },
  { key: 'data-management', label: '数据管理', action: 'open-data-management' },
  { key: 'reset', label: '地图复位', action: 'reset' },
  { key: 'top-down', label: '俯视视角', action: 'top-down-view' },
]

export const polygonObstacleTypeOptions = [
  "建筑物/构建物",
  "高压架空输电线路（35kV以下）",
  "高压架空输电线路（35kV）",
  "高压架空输电线路（110kV）",
  "高压架空输电线路（220kV）",
  "高压架空输电线路（330kV）",
  "高压架空输电线路（500kV及以上）",
  "风力涡轮发电机等大型旋转反射物体",
  "机库",
  "航站楼",
  "电气化铁路",
  "非电气化铁路",
  "道路/公路",
  "山丘",
  "堤坝",
  "铁塔/高塔",
  "树木/树林",
  "金属围栏/金属栅栏",
  "电力线缆和通信线缆",
  "车辆/航空器/机械",
  "架空低压电力线",
  "机场专用环场路",
  "中波和长波发射台（小于50kW）",
  "中波和长波发射台（100-150kW）",
  "中波和长波发射台（大于200kW）",
  "短波发射台（通信方向1/4功率角 0.5-5kW）",
  "短波发射台（通信方向1/4功率角 5-25kW）",
  "短波发射台（通信方向1/4功率角 25-120kW）",
  "短波发射台（通信方向1/4功率角 >120kW）",
  "短波发射台（通信方向1/4功率角外 0.5-5kW）",
  "短波发射台（通信方向1/4功率角外 5-25kW）",
  "短波发射台（通信方向1/4功率角外 25-120kW）",
  "短波发射台（通信方向1/4功率角外 >120kW）",
  "短波发射台（其他）",
  "工、科、医射频设备",
  "调频广播1kW（含）以下",
  "调频广播1kW以上",
  "高压变电站（110kV）",
  "高压变电站（220-330kV）",
  "高压变电站（500kV及以上）",
  "高压变电站（其他）",
  "高频热合机",
  "高频炉（100kW及以下）",
  "高频炉（100kW以上）",
  "工业电焊（10kW及以下）",
  "工业电焊（10kW以上）",
  "超高频理疗机（1kW及以下）",
  "超高频理疗机（1kW以上）",
  "农用电力设备（1kW及以下）",
  "农用电力设备（1kW以上）",
  "有无线电辐射的工业设施",
  "气象雷达站"
]

export const pointObstacleTypeOptions = [
  "建筑物/构建物",
  "高压架空输电线路（35kV以下）",
  "高压架空输电线路（35kV）",
  "高压架空输电线路（110kV）",
  "高压架空输电线路（220kV）",
  "高压架空输电线路（330kV）",
  "高压架空输电线路（500kV及以上）",
  "风力涡轮发电机等大型旋转反射物体",
  "机库",
  "航站楼",
  "电气化铁路",
  "非电气化铁路",
  "道路/公路",
  "山丘",
  "堤坝",
  "铁塔/高塔",
  "树木/树林",
  "金属围栏/金属栅栏",
  "电力线缆和通信线缆",
  "车辆/航空器/机械",
  "架空低压电力线",
  "机场专用环场路",
  "中波和长波发射台（小于50kW）",
  "中波和长波发射台（100-150kW）",
  "中波和长波发射台（大于200kW）",
  "短波发射台（通信方向1/4功率角 0.5-5kW）",
  "短波发射台（通信方向1/4功率角 5-25kW）",
  "短波发射台（通信方向1/4功率角 25-120kW）",
  "短波发射台（通信方向1/4功率角 >120kW）",
  "短波发射台（通信方向1/4功率角外 0.5-5kW）",
  "短波发射台（通信方向1/4功率角外 5-25kW）",
  "短波发射台（通信方向1/4功率角外 25-120kW）",
  "短波发射台（通信方向1/4功率角外 >120kW）",
  "短波发射台（其他）",
  "工、科、医射频设备",
  "调频广播1kW（含）以下",
  "调频广播1kW以上",
  "高压变电站（110kV）",
  "高压变电站（220-330kV）",
  "高压变电站（500kV及以上）",
  "高压变电站（其他）",
  "高频热合机",
  "高频炉（100kW及以下）",
  "高频炉（100kW以上）",
  "工业电焊（10kW及以下）",
  "工业电焊（10kW以上）",
  "超高频理疗机（1kW及以下）",
  "超高频理疗机（1kW以上）",
  "农用电力设备（1kW及以下）",
  "农用电力设备（1kW以上）",
  "有无线电辐射的工业设施",
  "气象雷达站"
]
