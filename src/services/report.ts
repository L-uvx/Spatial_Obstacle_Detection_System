export interface ExportTaskStatusResult {
  exportTaskId: string
  analysisTaskId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  message: string
  progressPercent: number
}

export interface ExportTaskResult {
  exportTaskId: string
  analysisTaskId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  fileName: string | null
  downloadUrl: string | null
  errorMessage: string | null
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

export async function createExportTask(analysisTaskId: string): Promise<ExportTaskStatusResult> {
  const response = await fetch(`/polygon-obstacle/analysis/${analysisTaskId}/export`, {
    method: 'POST',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `导出任务创建失败：${response.status}`))
  }

  const result = (await response.json()) as ExportTaskStatusResult

  return {
    exportTaskId: result.exportTaskId,
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
  }
}

export async function getExportTaskStatus(
  analysisTaskId: string,
  exportTaskId: string,
): Promise<ExportTaskStatusResult> {
  const response = await fetch(
    `/polygon-obstacle/analysis/${analysisTaskId}/export/${exportTaskId}/status`,
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `导出状态查询失败：${response.status}`))
  }

  const result = (await response.json()) as ExportTaskStatusResult

  return {
    exportTaskId: result.exportTaskId,
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
  }
}

export async function getExportTaskResult(
  analysisTaskId: string,
  exportTaskId: string,
): Promise<ExportTaskResult> {
  const response = await fetch(
    `/polygon-obstacle/analysis/${analysisTaskId}/export/${exportTaskId}/result`,
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null
    throw new Error(parseErrorDetail(payload?.detail, `导出结果查询失败：${response.status}`))
  }

  const result = (await response.json()) as ExportTaskResult

  return {
    exportTaskId: result.exportTaskId,
    analysisTaskId: result.analysisTaskId,
    status: result.status,
    fileName: result.fileName,
    downloadUrl: result.downloadUrl,
    errorMessage: result.errorMessage,
  }
}

export function resolveDownloadUrl(downloadUrl: string) {
  if (/^https?:\/\//.test(downloadUrl)) {
    return downloadUrl
  }

  const baseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/`
      : 'http://127.0.0.1:8000/'

  return new URL(downloadUrl, baseUrl).toString()
}
