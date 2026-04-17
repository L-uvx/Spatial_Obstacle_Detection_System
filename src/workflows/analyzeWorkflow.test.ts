import { afterEach, describe, expect, it, vi } from 'vitest'
import { runAnalyzeWorkflow } from './analyzeWorkflow'
import * as analysisService from '../services/analysis'
import type { ProtectionZoneRegion } from '../types/tool'

function createProtectionZones(): ProtectionZoneRegion[] {
  return [
    {
      id: 'airport-1-station-1-zone-a-rule-a-region-north',
      airportId: 'airport-1',
      airportName: '天河机场',
      stationId: 'station-1',
      stationName: '导航台A',
      stationType: 'VOR',
      ruleCode: 'rule-a',
      ruleName: '规则A',
      zoneCode: 'zone-a',
      zoneName: 'A区',
      regionCode: 'region-north',
      regionName: '北侧区域',
      geometry: {
        shapeType: 'circle',
        center: {
          longitude: 114.2,
          latitude: 30.7,
        },
        radiusMeters: 500,
      },
      vertical: {
        mode: 'flat',
        baseReference: 'station',
        baseHeightMeters: 500,
      },
      properties: {
        label: '北侧区域',
      },
    },
  ]
}

vi.mock('../services/analysis', () => ({
  createAnalysisTask: vi.fn(),
  getAnalysisTaskStatus: vi.fn(),
  getAnalysisTaskResult: vi.fn(),
}))

describe('runAnalyzeWorkflow', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

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
      protectionZones: createProtectionZones(),
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
      protectionZones: createProtectionZones(),
    })
  })

  it('returns only analysis task status messaging without station-layer rendering side effects', async () => {
    vi.mocked(analysisService.createAnalysisTask).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task created',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1],
    })
    vi.mocked(analysisService.getAnalysisTaskStatus).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task finished',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1],
    })
    vi.mocked(analysisService.getAnalysisTaskResult).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      importTaskId: 'import-batch-1',
      targetIds: [1],
      selectedTargets: [{ id: '1', name: 'Airport Near', category: '机场' }],
      obstacleCount: 1,
      summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
      protectionZones: createProtectionZones(),
    })

    const result = await runAnalyzeWorkflow({
      importTaskId: 'import-batch-1',
      targetIds: ['1'],
    })

    expect(result.message).toBe('analysis task finished')
  })

  it('polls once before requesting the analysis result after success', async () => {
    vi.useFakeTimers()

    vi.mocked(analysisService.createAnalysisTask).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'running',
      message: 'analysis task created',
      progressPercent: 0,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
    vi.mocked(analysisService.getAnalysisTaskStatus)
      .mockResolvedValueOnce({
        analysisTaskId: 'analysis-task-1',
        status: 'running',
        message: 'analysis task running',
        progressPercent: 50,
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      })
      .mockResolvedValueOnce({
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
      protectionZones: createProtectionZones(),
    })

    const workflowPromise = runAnalyzeWorkflow({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })

    await vi.advanceTimersByTimeAsync(1000)

    const result = await workflowPromise

    expect(analysisService.getAnalysisTaskStatus).toHaveBeenCalledTimes(2)
    expect(analysisService.getAnalysisTaskResult).toHaveBeenCalledTimes(1)
    expect(analysisService.getAnalysisTaskResult).toHaveBeenCalledWith('analysis-task-1')
    expect(result.message).toBe('analysis task finished')
    expect(result.protectionZones).toEqual(createProtectionZones())
  })

  it('throws on terminal failed status without requesting the analysis result', async () => {
    vi.mocked(analysisService.createAnalysisTask).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'running',
      message: 'analysis task created',
      progressPercent: 0,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
    vi.mocked(analysisService.getAnalysisTaskStatus).mockResolvedValueOnce({
      analysisTaskId: 'analysis-task-1',
      status: 'failed',
      message: 'analysis task failed',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })

    await expect(runAnalyzeWorkflow({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })).rejects.toThrow('analysis task failed')

    expect(analysisService.getAnalysisTaskResult).not.toHaveBeenCalled()
  })
})
