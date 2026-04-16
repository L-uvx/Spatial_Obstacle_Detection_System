import {
  createExportTask,
  getExportTaskResult,
  getExportTaskStatus,
  resolveDownloadUrl,
} from '../services/report'
import type { ExportStatus } from '../types/tool'

export interface ExportWorkflowResult {
  exportTaskId: string
  exportStatus: ExportStatus
  exportProgressPercent: number
  exportMessage: string
  exportFileName: string
  downloadUrl: string
  exportErrorMessage: string
}

interface ExportWorkflowProgress {
  exportTaskId: string
  exportStatus: Exclude<ExportStatus, 'idle'>
  exportProgressPercent: number
  exportMessage: string
}

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function emitProgress(
  onProgress: (progress: ExportWorkflowProgress) => void,
  progress: ExportWorkflowProgress,
) {
  onProgress(progress)
}

export async function runExportWorkflow(input: {
  analysisTaskId: string
  onProgress: (progress: ExportWorkflowProgress) => void
  triggerDownload: (downloadUrl: string) => void
  pollIntervalMs?: number
}): Promise<ExportWorkflowResult> {
  const pollIntervalMs = input.pollIntervalMs ?? 1000
  const createResult = await createExportTask(input.analysisTaskId)

  emitProgress(input.onProgress, {
    exportTaskId: createResult.exportTaskId,
    exportStatus: createResult.status,
    exportProgressPercent: createResult.progressPercent,
    exportMessage: createResult.message,
  })

  if (createResult.status === 'failed') {
    throw new Error(createResult.message || '导出任务失败，请检查后端处理结果。')
  }

  let statusResult = createResult

  while (statusResult.status === 'pending' || statusResult.status === 'running') {
    await delay(pollIntervalMs)

    statusResult = await getExportTaskStatus(input.analysisTaskId, createResult.exportTaskId)

    emitProgress(input.onProgress, {
      exportTaskId: statusResult.exportTaskId,
      exportStatus: statusResult.status,
      exportProgressPercent: statusResult.progressPercent,
      exportMessage: statusResult.message,
    })

    if (statusResult.status === 'failed') {
      throw new Error(statusResult.message || '导出任务失败，请检查后端处理结果。')
    }
  }

  const result = await getExportTaskResult(input.analysisTaskId, createResult.exportTaskId)

  if (result.status === 'failed') {
    throw new Error(result.errorMessage || '导出结果生成失败，请稍后重试。')
  }

  if (result.status !== 'succeeded' || !result.fileName || !result.downloadUrl) {
    throw new Error('导出结果不完整，无法下载报告。')
  }

  const fullDownloadUrl = resolveDownloadUrl(result.downloadUrl)

  input.triggerDownload(fullDownloadUrl)

  return {
    exportTaskId: result.exportTaskId,
    exportStatus: 'succeeded',
    exportProgressPercent: 100,
    exportMessage: statusResult.message,
    exportFileName: result.fileName,
    downloadUrl: fullDownloadUrl,
    exportErrorMessage: '',
  }
}
