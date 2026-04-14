import type { AnalysisSelectedTarget } from '../types/tool'

export interface AnalysisTaskStatusResult {
  analysisTaskId: string
  status: string
  message: string
  progressPercent: number
  importTaskId: string
  targetIds: number[]
}

export interface AnalysisTaskResult {
  analysisTaskId: string
  status: string
  importTaskId: string
  targetIds: number[]
  selectedTargets: AnalysisSelectedTarget[]
  obstacleCount: number
  summary: string
}

interface AnalysisTaskResultResponse {
  analysisTaskId: string
  status: string
  importTaskId: string
  targetIds: number[]
  selectedTargets?: Array<{
    id: number | string
    name: string
    category: '机场' | '空管局'
  }>
  obstacleCount: number
  summary: string
}

function parseErrorDetail(detail: unknown, fallbackMessage: string) {
  if (typeof detail === 'string' && detail) {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstItem = detail[0] as { msg?: string } | undefined

    if (firstItem?.msg) {
      return firstItem.msg
    }
  }

  return fallbackMessage
}

export async function createAnalysisTask(input: {
  importTaskId: string
  targetIds: string[]
}): Promise<AnalysisTaskStatusResult> {
  const response = await fetch('/polygon-obstacle/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      importTaskId: input.importTaskId,
      targetIds: input.targetIds.map((item) => Number(item)),
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `分析任务创建失败：${response.status}`))
  }

  const result = (await response.json()) as AnalysisTaskStatusResult

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
  }
}

export async function getAnalysisTaskStatus(taskId: string): Promise<AnalysisTaskStatusResult> {
  const response = await fetch(`/polygon-obstacle/analysis/${taskId}/status`)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `分析状态查询失败：${response.status}`))
  }

  const result = (await response.json()) as AnalysisTaskStatusResult

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
  }
}

export async function getAnalysisTaskResult(taskId: string): Promise<AnalysisTaskResult> {
  const response = await fetch(`/polygon-obstacle/analysis/${taskId}/result`)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `分析结果查询失败：${response.status}`))
  }

  const result = (await response.json()) as AnalysisTaskResultResponse

  return {
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    importTaskId: result.importTaskId,
    targetIds: result.targetIds,
    selectedTargets: (result.selectedTargets ?? []).map((item) => ({
      id: String(item.id),
      name: item.name,
      category: item.category,
    })),
    obstacleCount: result.obstacleCount,
    summary: result.summary,
  }
}
