export type PanelToolKey = 'import' | 'analyze' | 'export'

export type ToolKey = PanelToolKey | 'reset'

export type ActionToolKey = Extract<PanelToolKey, 'import' | 'analyze' | 'export'>

export interface ActionToolState {
  status: 'idle' | 'running' | 'success'
  message: string
  lastTriggeredAt?: number
}

export interface ToolbarItem {
  key: ToolKey
  label: string
  opensPanel: boolean
}

export const toolbarItems: ToolbarItem[] = [
  { key: 'import', label: '一键导入', opensPanel: true },
  { key: 'analyze', label: '一键分析', opensPanel: true },
  { key: 'export', label: '一键导出', opensPanel: true },
  { key: 'reset', label: '地图复位', opensPanel: false },
]

export const panelContentByTool: Record<PanelToolKey, { title: string; description: string }> = {
  import: {
    title: '一键导入',
    description: '用于上传障碍物数据并触发导入流程，当前已接入前端按钮和回调闭环。',
  },
  analyze: {
    title: '一键分析',
    description: '用于发起障碍物分析任务，当前已接入前端按钮和回调闭环。',
  },
  export: {
    title: '一键导出',
    description: '用于发起报告导出流程，当前已接入前端按钮和回调闭环。',
  },
}
