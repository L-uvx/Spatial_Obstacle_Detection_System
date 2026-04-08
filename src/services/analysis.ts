export interface AnalyzeObstacleResult {
  message: string
}

export async function createAnalysisTask(): Promise<AnalyzeObstacleResult> {
  return {
    message: '分析服务占位已执行，后续可接入分析任务创建与轮询接口。',
  }
}
