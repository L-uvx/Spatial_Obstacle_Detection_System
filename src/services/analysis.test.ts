// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAnalysisTask,
  getAnalysisTaskResult,
  getAnalysisTaskStatus,
} from './analysis'

describe('analysis service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an analysis task from import task id and numeric target ids', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      }),
    } as Response)

    const result = await createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('/polygon-obstacle/analysis')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({
      'Content-Type': 'application/json',
    })
    expect(init?.body).toBe(JSON.stringify({
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    }))

    expect(result).toEqual({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task created',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
  })

  it('loads analysis task status by task id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      }),
    } as Response)

    const result = await getAnalysisTaskStatus('analysis-task-1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/analysis/analysis-task-1/status')
    expect(result).toEqual({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task created',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
  })

  it('loads minimal analysis result after the task succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
        selectedTargets: [
          {
            id: 1,
            name: 'Airport Near',
            category: '机场',
          },
          {
            id: 2,
            name: 'Airport Far',
            category: '机场',
          },
        ],
        obstacleCount: 2,
        summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/analysis/analysis-task-1/result')
    expect(result).toEqual({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
      selectedTargets: [
        {
          id: '1',
          name: 'Airport Near',
          category: '机场',
        },
        {
          id: '2',
          name: 'Airport Far',
          category: '机场',
        },
      ],
      obstacleCount: 2,
      summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
    })
  })
})
