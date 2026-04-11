export type ToolbarToolKey = 'polygon-obstacle-analysis' | 'reset'

export type WizardStage =
  | 'idle'
  | 'import-form'
  | 'importing'
  | 'target-selection'
  | 'analyzing'
  | 'analysis-result'
  | 'error'

export type ExportStatus = 'idle' | 'running' | 'success' | 'error'

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

export interface ImportFormValue {
  projectName: string
  obstacleType: string
  fileName: string
  file: File | null
}

export interface PolygonObstacleAnalysisState {
  isOpen: boolean
  stage: WizardStage
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
  statusMessage: string
  exportStatus: ExportStatus
  exportMessage: string
  downloadUrl: string
}

export const toolbarItems: ToolbarItem[] = [
  { key: 'polygon-obstacle-analysis', label: '多边形障碍物分析', opensModal: true },
  { key: 'reset', label: '地图复位', opensModal: false },
]

export const obstacleTypeOptions = ['铁塔', '烟囱', '建筑物', '山体']
