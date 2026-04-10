import { syncAnalysisLayer } from '../map/layers/AnalysisLayer'
import { syncStationLayer } from '../map/layers/StationLayer'
import { createAnalysisTask } from '../services/analysis'

export interface AnalyzeWorkflowResult {
  analysisTaskId: string
  summary: string
  message: string
}

export async function runAnalyzeWorkflow(input: {
  projectId: string
  obstacleBatchId: string
  targetIds: string[]
}): Promise<AnalyzeWorkflowResult> {
  const serviceResult = await createAnalysisTask(input)
  const stationLayerResult = syncStationLayer()
  const analysisLayerResult = syncAnalysisLayer()

  return {
    analysisTaskId: serviceResult.analysisTaskId,
    summary: serviceResult.summary,
    message: `${serviceResult.message}${stationLayerResult.message}${analysisLayerResult.message}`,
  }
}
