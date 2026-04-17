import { createAnalysisTask, getAnalysisTaskResult, getAnalysisTaskStatus } from '../services/analysis'
import type { AnalysisSelectedTarget, ProtectionZoneRegion } from '../types/tool'

export interface AnalyzeWorkflowResult {
  analysisTaskId: string
  summary: string
  message: string
  selectedTargets: AnalysisSelectedTarget[]
  obstacleCount: number
  protectionZones: ProtectionZoneRegion[]
}

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

async function waitForAnalysisCompletion(taskId: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const statusResult = await getAnalysisTaskStatus(taskId)

    if (statusResult.status === 'succeeded') {
      return statusResult
    }

    if (statusResult.status === 'failed') {
      throw new Error(statusResult.message || '分析任务失败，请检查后端处理结果。')
    }

    await delay(1000)
  }

  throw new Error('分析任务超时，请稍后重试。')
}

export async function runAnalyzeWorkflow(input: {
  importTaskId: string
  targetIds: string[]
}): Promise<AnalyzeWorkflowResult> {
  const serviceResult = await createAnalysisTask(input)
  const statusResult = await waitForAnalysisCompletion(serviceResult.analysisTaskId)
  const result = await getAnalysisTaskResult(serviceResult.analysisTaskId)

  return {
    analysisTaskId: result.analysisTaskId,
    summary: result.summary,
    message: statusResult.message,
    selectedTargets: result.selectedTargets,
    obstacleCount: result.obstacleCount,
    protectionZones: result.protectionZones,
  }
}
