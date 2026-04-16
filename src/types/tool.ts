export type ToolbarToolKey = 'polygon-obstacle-analysis' | 'reset'

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

export type PositionCoordinate = [number, number]

export type LinearRingCoordinates = PositionCoordinate[]

export type PolygonCoordinates = LinearRingCoordinates[]

export type MultiPolygonCoordinates = PolygonCoordinates[]

export interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: MultiPolygonCoordinates
}

export interface RenderedObstacle {
  id: string
  name: string
  obstacleType: string
  topElevation: number
  geometry: MultiPolygonGeometry
}

export interface InitialCameraTarget {
  longitude: number
  latitude: number
  height: number
  heading?: number
  pitch: number
  roll?: number
}

export interface ImportFormValue {
  projectName: string
  obstacleType: string
  fileName: string
  file: File | null
}

export interface PolygonObstacleAnalysisState {
  isOpen: boolean
  stage: WizardStage
  bootstrapStatus: BootstrapStatus
  bootstrapMessage: string
  initialCameraTarget: InitialCameraTarget | null
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
  statusMessage: string
  exportTaskId: string
  exportStatus: ExportStatus
  exportProgressPercent: number
  exportMessage: string
  exportFileName: string
  downloadUrl: string
  exportErrorMessage: string
  renderedObstacles: RenderedObstacle[]
}

export const toolbarItems: ToolbarItem[] = [
  { key: 'polygon-obstacle-analysis', label: '多边形障碍物分析', opensModal: true },
  { key: 'reset', label: '地图复位', opensModal: false },
]

export const obstacleTypeOptions = ["建筑物/构建物",
  "高压架空输电线路",
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
  "中波和长波发射台",
  "短波发射台",
  "工、科、医射频设备",
  "调频广播",
  "高压变电站",
  "高频热合机",
  "高频炉",
  "工业电焊",
  "超高频理疗机",
  "农用电力设备",
  "有无线电辐射的工业设施",
  "气象雷达站"]
