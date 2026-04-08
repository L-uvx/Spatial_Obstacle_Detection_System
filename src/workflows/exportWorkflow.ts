import { createExportTask } from '../services/report'
import type { WorkflowResult } from './importWorkflow'

export async function runExportWorkflow(): Promise<WorkflowResult> {
  const serviceResult = await createExportTask()

  return {
    message: `导出占位 workflow 已执行。${serviceResult.message}`,
  }
}
