import { describe, expect, it, vi } from 'vitest'
import { runAnalyzeWorkflow } from './analyzeWorkflow'
import * as analysisService from '../services/analysis'

vi.mock('../services/analysis', () => ({
  createAnalysisTask: vi.fn(),
  getAnalysisTaskStatus: vi.fn(),
  getAnalysisTaskResult: vi.fn(),
}))

vi.mock('../map/layers/AnalysisLayer', () => ({
  syncAnalysisLayer: vi.fn(() => ({ message: '' })),
}))

vi.mock('../map/layers/StationLayer', () => ({
  syncStationLayer: vi.fn(() => ({ message: '' })),
}))

describe('runAnalyzeWorkflow', () => {
  it('always checks analysis task status before requesting analysis result', async () => {
    vi.mocked(analysisService.createAnalysisTask).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task created',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
    vi.mocked(analysisService.getAnalysisTaskStatus).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task finished',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
    vi.mocked(analysisService.getAnalysisTaskResult).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
      selectedTargets: [
        { id: '1', name: 'Airport Near', category: '机场' },
        { id: '2', name: 'Airport Far', category: '机场' },
      ],
      obstacleCount: 2,
      summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
    })

    const result = await runAnalyzeWorkflow({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })

    expect(analysisService.createAnalysisTask).toHaveBeenCalledWith({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })
    expect(analysisService.getAnalysisTaskStatus).toHaveBeenCalledWith('analysis-task-1')
    expect(analysisService.getAnalysisTaskResult).toHaveBeenCalledWith('analysis-task-1')
    expect(result).toEqual({
      analysisTaskId: 'analysis-task-1',
      summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
      message: 'analysis task finished',
      selectedTargets: [
        { id: '1', name: 'Airport Near', category: '机场' },
        { id: '2', name: 'Airport Far', category: '机场' },
      ],
      obstacleCount: 2,
    })
  })
})
