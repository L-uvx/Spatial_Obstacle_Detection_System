import { createExportTask } from '../services/report'

export interface ExportWorkflowResult {
  downloadUrl: string
  message: string
}

export async function runExportWorkflow(input: { analysisTaskId: string }): Promise<ExportWorkflowResult> {
  const serviceResult = await createExportTask(input)

  return {
    downloadUrl: serviceResult.downloadUrl,
    message: serviceResult.message,
  }
}
