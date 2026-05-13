import { afterEach, describe, expect, it, vi } from 'vitest'
import { runAnalyzeWorkflow } from './analyzeWorkflow'
import * as analysisService from '../services/analysis'

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
      ruleResults: [
        {
          stationId: '4',
          stationName: '西南近无方向信标台',
          stationType: 'NDB',
          obstacleId: '67',
          obstacleName: '障碍物2',
          rawObstacleType: '建筑物/构建物',
          globalObstacleCategory: 'building_general',
          ruleCode: 'ndb_minimum_distance_50m',
          ruleName: 'ndb_minimum_distance_50m',
          zoneCode: 'ndb_minimum_distance_50m',
          zoneName: 'NDB 50m minimum distance zone',
          regionCode: 'default',
          regionName: 'default',
          isApplicable: true,
          isCompliant: true,
          message: 'distance meets minimum threshold',
          metrics: {
            isInProtectionZone: true,
            actualDistanceMeters: 150.5,
            actualElevationAngleDegrees: 1.2,
            baseHeightMeters: 30,
            elevationAngleDegrees: 3,
            allowedHeightMeters: 200,
            topElevationMeters: 80,
            innerRadiusMeters: 50,
            outerRadiusMeters: 37040,
          },
          standards: {
            gb: [{ code: 'gb-code', text: '国标内容', isCompliant: true }],
            mh: [{ code: 'mh-code', text: '行标内容', isCompliant: true }],
          },
          overDistanceMeters: 0,
          azimuthDegrees: 90,
          maxHorizontalAngleDegrees: 95,
          minHorizontalAngleDegrees: 85,
          relativeHeightMeters: 50,
          isInRadius: true,
          isInZone: true,
          details: '',
        },
      ],
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
      ruleResults: [
        {
          stationId: '4',
          stationName: '西南近无方向信标台',
          stationType: 'NDB',
          obstacleId: '67',
          obstacleName: '障碍物2',
          rawObstacleType: '建筑物/构建物',
          globalObstacleCategory: 'building_general',
          ruleCode: 'ndb_minimum_distance_50m',
          ruleName: 'ndb_minimum_distance_50m',
          zoneCode: 'ndb_minimum_distance_50m',
          zoneName: 'NDB 50m minimum distance zone',
          regionCode: 'default',
          regionName: 'default',
          isApplicable: true,
          isCompliant: true,
          message: 'distance meets minimum threshold',
          metrics: {
            isInProtectionZone: true,
            actualDistanceMeters: 150.5,
            actualElevationAngleDegrees: 1.2,
            baseHeightMeters: 30,
            elevationAngleDegrees: 3,
            allowedHeightMeters: 200,
            topElevationMeters: 80,
            innerRadiusMeters: 50,
            outerRadiusMeters: 37040,
          },
          standards: {
            gb: [{ code: 'gb-code', text: '国标内容', isCompliant: true }],
            mh: [{ code: 'mh-code', text: '行标内容', isCompliant: true }],
          },
          overDistanceMeters: 0,
          azimuthDegrees: 90,
          maxHorizontalAngleDegrees: 95,
          minHorizontalAngleDegrees: 85,
          relativeHeightMeters: 50,
          isInRadius: true,
          isInZone: true,
          details: '',
        },
      ],
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
      ruleResults: [
        {
          stationId: '4',
          stationName: '西南近无方向信标台',
          stationType: 'NDB',
          obstacleId: '67',
          obstacleName: '障碍物2',
          rawObstacleType: '建筑物/构建物',
          globalObstacleCategory: 'building_general',
          ruleCode: 'ndb_minimum_distance_50m',
          ruleName: 'ndb_minimum_distance_50m',
          zoneCode: 'ndb_minimum_distance_50m',
          zoneName: 'NDB 50m minimum distance zone',
          regionCode: 'default',
          regionName: 'default',
          isApplicable: true,
          isCompliant: true,
          message: 'distance meets minimum threshold',
          metrics: {
            isInProtectionZone: true,
            actualDistanceMeters: 150.5,
            actualElevationAngleDegrees: 1.2,
            baseHeightMeters: 30,
            elevationAngleDegrees: 3,
            allowedHeightMeters: 200,
            topElevationMeters: 80,
            innerRadiusMeters: 50,
            outerRadiusMeters: 37040,
          },
          standards: {
            gb: [{ code: 'gb-code', text: '国标内容', isCompliant: true }],
            mh: [{ code: 'mh-code', text: '行标内容', isCompliant: true }],
          },
          overDistanceMeters: 0,
          azimuthDegrees: 90,
          maxHorizontalAngleDegrees: 95,
          minHorizontalAngleDegrees: 85,
          relativeHeightMeters: 50,
          isInRadius: true,
          isInZone: true,
          details: '',
        },
      ],
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
      ruleResults: [
        {
          stationId: '4',
          stationName: '西南近无方向信标台',
          stationType: 'NDB',
          obstacleId: '67',
          obstacleName: '障碍物2',
          rawObstacleType: '建筑物/构建物',
          globalObstacleCategory: 'building_general',
          ruleCode: 'ndb_minimum_distance_50m',
          ruleName: 'ndb_minimum_distance_50m',
          zoneCode: 'ndb_minimum_distance_50m',
          zoneName: 'NDB 50m minimum distance zone',
          regionCode: 'default',
          regionName: 'default',
          isApplicable: true,
          isCompliant: true,
          message: 'distance meets minimum threshold',
          metrics: {
            isInProtectionZone: true,
            actualDistanceMeters: 150.5,
            actualElevationAngleDegrees: 1.2,
            baseHeightMeters: 30,
            elevationAngleDegrees: 3,
            allowedHeightMeters: 200,
            topElevationMeters: 80,
            innerRadiusMeters: 50,
            outerRadiusMeters: 37040,
          },
          standards: {
            gb: [{ code: 'gb-code', text: '国标内容', isCompliant: true }],
            mh: [{ code: 'mh-code', text: '行标内容', isCompliant: true }],
          },
          overDistanceMeters: 0,
          azimuthDegrees: 90,
          maxHorizontalAngleDegrees: 95,
          minHorizontalAngleDegrees: 85,
          relativeHeightMeters: 50,
          isInRadius: true,
          isInZone: true,
          details: '',
        },
      ],
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
