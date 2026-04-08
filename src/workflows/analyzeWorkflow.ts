import { syncAnalysisLayer } from '../map/layers/AnalysisLayer'
import { syncStationLayer } from '../map/layers/StationLayer'
import { createAnalysisTask } from '../services/analysis'
import type { WorkflowResult } from './importWorkflow'

export async function runAnalyzeWorkflow(): Promise<WorkflowResult> {
  const serviceResult = await createAnalysisTask()
  const stationLayerResult = syncStationLayer()
  const analysisLayerResult = syncAnalysisLayer()

  return {
    message: `分析占位 workflow 已执行。${serviceResult.message}${stationLayerResult.message}${analysisLayerResult.message}`,
  }
}
