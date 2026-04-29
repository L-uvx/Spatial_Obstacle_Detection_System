export type ToolbarToolKey = 'polygon-obstacle-analysis' | 'point-obstacle-analysis' | 'reset'

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
  opensModal: boolean
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
  ruleName: string
  zoneCode: string
  zoneName: string
  regionCode: string
  regionName: string
  isApplicable: boolean
  isCompliant: boolean
  message: string
  standards: {
    gb: AnalysisRuleStandardResult | null
    mh: AnalysisRuleStandardResult | null
  }
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
  baseReference: 'station'
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

interface ProtectionZoneDistanceParameterizedSurfaceBase {
  type: 'distance_parameterized'
  clampRange: {
    startMeters: number
    endMeters: number
  }
  heightModel: {
    type: 'angle_linear_rise'
    angleDegrees: number
    distanceOffsetMeters: number
  }
}

export interface ProtectionZonePointDistanceParameterizedSurface
  extends ProtectionZoneDistanceParameterizedSurfaceBase {
  distanceSource: ProtectionZonePointDistanceSource
  distanceMetric: 'radial'
}

export interface ProtectionZoneFrontReferenceLineDistanceParameterizedSurface
  extends ProtectionZoneDistanceParameterizedSurfaceBase {
  distanceSource: ProtectionZoneFrontReferenceLineDistanceSource
  distanceMetric: 'axial_from_reference_line'
  planarControl: ProtectionZoneFrontReferenceLinePlanarControl
}

export type ProtectionZoneDistanceParameterizedSurface =
  | ProtectionZonePointDistanceParameterizedSurface
  | ProtectionZoneFrontReferenceLineDistanceParameterizedSurface

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
  visibleProtectionZones: VisibleProtectionZoneRegion[]
  flyToTargetTick: number
  flyToTargetPayload: InitialCameraTarget | null
}

export const toolbarItems: ToolbarItem[] = [
  { key: 'polygon-obstacle-analysis', label: '多边形障碍物分析', opensModal: true, mode: 'polygon' },
  { key: 'point-obstacle-analysis', label: '点障碍物分析', opensModal: true, mode: 'point' },
  { key: 'reset', label: '地图复位', opensModal: false },
]

export const polygonObstacleTypeOptions = [
  "建筑物/构建物",
  "机库",
  "航站楼",
  "电气化铁路",
  "非电气化铁路",
  "道路/公路",
  "山丘",
  "堤坝",
  "金属围栏/金属栅栏",
  "机场专用环场路",
  "高压变电站",
  "气象雷达站"
]

export const pointObstacleTypeOptions = [
  "高压架空输电线路",
  "风力涡轮发电机等大型旋转反射物体",
  "铁塔/高塔",
  "树木/树林",
  "电力线缆和通信线缆",
  "车辆/航空器/机械",
  "架空低压电力线",
  "中波和长波发射台",
  "短波发射台",
  "工、科、医射频设备",
  "调频广播",
  "高频热合机",
  "高频炉",
  "工业电焊",
  "超高频理疗机",
  "农用电力设备",
  "有无线电辐射的工业设施"
]
