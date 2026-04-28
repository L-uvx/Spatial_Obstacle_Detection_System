import { describe, expect, it, vi } from 'vitest'
import { runImportWorkflow } from './importWorkflow'
import { getImportTaskResult, getImportTaskStatus, importObstacles } from '../services/obstacle'

vi.mock('../services/obstacle', () => ({
  importObstacles: vi.fn(async () => ({
    taskId: 'import-batch-15',
    status: 'running',
    message: '任务已创建',
    progressPercent: 0,
    projectId: 15,
    obstacleBatchId: 'import-batch-15',
  })),
  getImportTaskStatus: vi.fn(async () => ({
    taskId: 'import-batch-15',
    status: 'succeeded',
    message: '导入完成',
    progressPercent: 100,
  })),
  getImportTaskResult: vi.fn(async () => ({
    taskId: 'import-batch-15',
    projectId: 15,
    obstacleBatchId: 'import-batch-15',
    importedCount: 2,
    failedCount: 0,
    obstacles: [
      {
        id: '7',
        name: '障碍物1',
        obstacleType: '建筑物/构建物',
        topElevation: 549.9,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [103.9758638888889, 30.506880555555554],
                [103.97811111111112, 30.50565],
                [103.97690833333334, 30.50386388888889],
                [103.97425, 30.50510277777778],
                [103.97421944444444, 30.505241666666667],
                [103.9758638888889, 30.506880555555554],
              ],
            ],
          ],
        },
      },
    ],
  })),
  getImportTargets: vi.fn(async () => [
    { id: 'airport-1', name: '天河机场', category: '机场', distance: '12.4 km' },
  ]),
}))

vi.mock('../map/layers/ObstacleLayer', () => ({
  syncObstacleLayer: vi.fn(() => ({
    message: '障碍物已同步到地图图层。',
    addedEntityIds: ['polygon-obstacle-7-0'],
  })),
}))

describe('runImportWorkflow', () => {
  it('returns imported obstacles for downstream map rendering', async () => {
    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await runImportWorkflow({
      mode: 'polygon',
      projectName: '武汉净空项目',
      obstacleType: '建筑物/构建物',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(result.projectId).toBe('15')
    expect(result.obstacleBatchId).toBe('import-batch-15')
    expect(result.obstacles).toHaveLength(1)
    expect(result.obstacles[0].topElevation).toBe(549.9)
    expect(result.message).toContain('障碍物已准备渲染到地图图层')
  })

  it('passes point mode through the shared import workflow', async () => {
    const file = new File(['demo'], 'point-obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await runImportWorkflow({
      mode: 'point',
      projectName: '点障碍物项目',
      obstacleType: '树木/树林',
      fileName: 'point-obstacles.xlsx',
      file,
    })

    expect(result.importTaskId).toBe('import-batch-15')
    expect(importObstacles).toHaveBeenCalledWith(expect.objectContaining({ mode: 'point' }))
    expect(getImportTaskStatus).toHaveBeenCalledWith('point', 'import-batch-15')
    expect(getImportTaskResult).toHaveBeenCalledWith('point', 'import-batch-15')
  })
})
