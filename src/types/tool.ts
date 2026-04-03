export type PanelToolKey = 'intro' | 'query' | 'measure'

export type ToolKey = PanelToolKey | 'reset'

export interface ToolbarItem {
  key: ToolKey
  label: string
  opensPanel: boolean
}

export const toolbarItems: ToolbarItem[] = [
  { key: 'intro', label: '图层说明', opensPanel: true },
  { key: 'query', label: '查询占位', opensPanel: true },
  { key: 'measure', label: '测量占位', opensPanel: true },
  { key: 'reset', label: '地图复位', opensPanel: false },
]

export const panelContentByTool: Record<PanelToolKey, { title: string; description: string }> = {
  intro: {
    title: '图层说明',
    description: '当前应用默认加载天地图影像底图，后续可在该面板补充图层说明或地图业务说明。',
  },
  query: {
    title: '查询占位',
    description: '这里预留查询工具内容区域，后续可接入表单、条件和结果展示。',
  },
  measure: {
    title: '测量占位',
    description: '这里预留测量工具内容区域，后续可接入距离、面积等测量能力。',
  },
}
