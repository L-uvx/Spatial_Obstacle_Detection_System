import { syncObstacleLayer } from '../map/layers/ObstacleLayer'
import { importObstacles } from '../services/obstacle'

export interface ImportWorkflowResult {
  projectId: string
  obstacleBatchId: string
  message: string
}

export async function runImportWorkflow(input: {
  projectName: string
  obstacleType: string
  fileName: string
}): Promise<ImportWorkflowResult> {
  const serviceResult = await importObstacles(input)
  const layerResult = syncObstacleLayer()

  return {
    projectId: serviceResult.projectId,
    obstacleBatchId: serviceResult.obstacleBatchId,
    message: `${serviceResult.message}${layerResult.message}`,
  }
}
