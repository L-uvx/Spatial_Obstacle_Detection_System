import type { TargetOption } from '../types/tool'

export interface AnalyzeObstacleResult {
  analysisTaskId: string
  summary: string
  message: string
}

export function listAnalysisTargets(): TargetOption[] {
  return [
    { id: 'airport-1', name: '天河机场', category: '机场', distance: '12.4 km' },
    { id: 'airport-2', name: '荆州机场', category: '机场', distance: '48.9 km' },
    { id: 'atc-1', name: '武汉空管局', category: '空管局', distance: '6.2 km' },
  ]
}

export async function createAnalysisTask(input: {
  projectId: string
  obstacleBatchId: string
  targetIds: string[]
}): Promise<AnalyzeObstacleResult> {
  return {
    analysisTaskId: 'analysis-1',
    summary: `超高分析结论：已纳入 ${input.targetIds.length} 个机场/空管局对象，存在重点影响对象。`,
    message: '分析服务占位已执行，后续可接入分析任务创建与轮询接口。',
  }
}
