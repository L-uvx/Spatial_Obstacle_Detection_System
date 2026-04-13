import { describe, expect, it, vi } from 'vitest'
import { useWorkflowActions } from './useWorkflowActions'
import { getBootstrapData } from '../services/bootstrap'
import { runImportWorkflow } from '../workflows/importWorkflow'

vi.mock('../services/bootstrap', () => ({
  getBootstrapData: vi.fn(),
}))

vi.mock('../workflows/importWorkflow', () => ({
  runImportWorkflow: vi.fn(async () => ({
    importTaskId: 'import-batch-3',
    importStatus: 'succeeded',
    importProgressPercent: 100,
    projectId: 'project-1',
    obstacleBatchId: 'batch-1',
    targetOptions: [
      { id: 'airport-1', name: '天河机场', category: '机场', distance: '12.4 km' },
      { id: 'airport-2', name: '荆州机场', category: '机场', distance: '48.9 km' },
      { id: 'atc-1', name: '武汉空管局', category: '空管局', distance: '6.2 km' },
    ],
    obstacles: [
      {
        id: 'obstacle-1',
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
    message: '导入任务已完成，候选对象已准备就绪。',
  })),
}))

vi.mock('../workflows/analyzeWorkflow', () => ({
  runAnalyzeWorkflow: vi.fn(async () => ({
    analysisTaskId: 'analysis-1',
    summary: '超高分析结论：存在重点影响对象。',
    message: '分析占位 workflow 已执行。',
  })),
}))

vi.mock('../workflows/exportWorkflow', () => ({
  runExportWorkflow: vi.fn(async () => ({
    downloadUrl: '/mock/report.docx',
    message: '导出占位 workflow 已执行。',
  })),
}))

describe('useWorkflowActions', () => {
  it('stores bootstrap airport target and historical obstacles without changing wizard stage', async () => {
    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: {
        longitude: 103.95056,
        latitude: 30.57972,
        height: 10000,
        pitch: -90,
      },
      historicalObstacles: [
        {
          id: 'history-17',
          name: '历史障碍物1',
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
    })

    const { state, bootstrap } = useWorkflowActions()

    await bootstrap()

    expect(state.bootstrapStatus).toBe('success')
    expect(state.stage).toBe('idle')
    expect(state.initialCameraTarget?.longitude).toBe(103.95056)
    expect(state.renderedObstacles.map((item) => item.id)).toEqual(['history-17'])
  })

  it('keeps the app usable when bootstrap fails', async () => {
    vi.mocked(getBootstrapData).mockRejectedValueOnce(new Error('初始化接口请求失败：500'))

    const { state, bootstrap } = useWorkflowActions()

    await bootstrap()

    expect(state.bootstrapStatus).toBe('error')
    expect(state.stage).toBe('idle')
    expect(state.initialCameraTarget).toBeNull()
    expect(state.renderedObstacles).toEqual([])
    expect(state.bootstrapMessage).toContain('初始化')
  })

  it('preserves bootstrap state when closing the modal', async () => {
    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: {
        longitude: 103.95056,
        latitude: 30.57972,
        height: 10000,
        pitch: -90,
      },
      historicalObstacles: [],
    })

    const { state, bootstrap, openModal, closeModal } = useWorkflowActions()

    await bootstrap()
    openModal()
    closeModal()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')
    expect(state.bootstrapStatus).toBe('success')
    expect(state.bootstrapMessage).toBe('系统初始化完成。')
    expect(state.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: 10000,
      pitch: -90,
    })
  })

  it('drives the single polygon obstacle analysis wizard lifecycle', async () => {
    vi.useFakeTimers()

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, submitImport, toggleTarget, startAnalysis, exportReport, closeModal, openModal } =
      useWorkflowActions()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')

    openModal()

    expect(state.isOpen).toBe(true)
    expect(state.stage).toBe('import-form')

    const importPromise = submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.stage).toBe('importing')
    expect(state.statusMessage).toContain('导入')

    await vi.runAllTimersAsync()
    await importPromise

    expect(runImportWorkflow).toHaveBeenCalledWith({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.stage).toBe('target-selection')
    expect(state.projectName).toBe('武汉净空项目')
    expect(state.importTaskId).toBe('import-batch-3')
    expect(state.importStatus).toBe('succeeded')
    expect(state.importProgressPercent).toBe(100)
    expect(state.targetOptions).toHaveLength(3)
    expect(state.targetOptions[0].name).toBe('天河机场')
    expect(state.renderedObstacles).toEqual([
      {
        id: 'obstacle-1',
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
    ])

    toggleTarget('airport-1')
    toggleTarget('atc-1')

    expect(state.selectedTargetIds).toEqual(['airport-1', 'atc-1'])

    const analyzePromise = startAnalysis()

    expect(state.stage).toBe('analyzing')
    expect(state.statusMessage).toContain('分析')

    await vi.runAllTimersAsync()
    await analyzePromise

    expect(state.stage).toBe('analysis-result')
    expect(state.analysisSummary).toContain('超高分析结论')

    const exportPromise = exportReport()

    expect(state.exportStatus).toBe('running')

    await vi.runAllTimersAsync()
    await exportPromise

    expect(state.exportStatus).toBe('success')
    expect(state.exportMessage).toContain('导出占位 workflow 已执行')
    expect(state.downloadUrl).toBe('/mock/report.docx')

    closeModal()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')
    expect(state.renderedObstacles).toHaveLength(1)

    vi.useRealTimers()
  })

  it('appends imported obstacles instead of overwriting existing map obstacles', async () => {
    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport } = useWorkflowActions([
      {
        id: 'history-1',
        name: '历史障碍物',
        obstacleType: '建筑物/构建物',
        topElevation: 520,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [114.1, 30.6],
                [114.2, 30.6],
                [114.2, 30.5],
                [114.1, 30.5],
                [114.1, 30.6],
              ],
            ],
          ],
        },
      },
    ])

    openModal()
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.renderedObstacles.map((item) => item.id)).toEqual(['history-1', 'obstacle-1'])
  })

  it('keeps only one obstacle when an imported obstacle id already exists in map state', async () => {
    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport } = useWorkflowActions([
      {
        id: 'obstacle-1',
        name: '历史障碍物1',
        obstacleType: '建筑物/构建物',
        topElevation: 500,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [114.1, 30.6],
                [114.2, 30.6],
                [114.2, 30.5],
                [114.1, 30.5],
                [114.1, 30.6],
              ],
            ],
          ],
        },
      },
    ])

    openModal()
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.renderedObstacles).toHaveLength(1)
    expect(state.renderedObstacles[0].name).toBe('历史障碍物1')
  })
})
