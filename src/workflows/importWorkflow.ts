import { syncObstacleLayer } from '../map/layers/ObstacleLayer'
import { importObstacles } from '../services/obstacle'

export interface WorkflowResult {
  message: string
}

export async function runImportWorkflow(): Promise<WorkflowResult> {
  const serviceResult = await importObstacles()
  const layerResult = syncObstacleLayer()

  return {
    message: `导入占位 workflow 已执行。${serviceResult.message}${layerResult.message}`,
  }
}
