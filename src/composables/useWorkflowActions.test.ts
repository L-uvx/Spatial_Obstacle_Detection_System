import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWorkflowActions } from './useWorkflowActions'
import { getBootstrapData } from '../services/bootstrap'
import { runImportWorkflow } from '../workflows/importWorkflow'
import { runExportWorkflow } from '../workflows/exportWorkflow'

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
    analysisTaskId: 'analysis-task-1',
    summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
    message: 'analysis task created',
    selectedTargets: [
      { id: '1', name: 'Airport Near', category: '机场' },
      { id: '2', name: 'Airport Far', category: '机场' },
    ],
    obstacleCount: 2,
  })),
}))

vi.mock('../workflows/exportWorkflow', () => ({
  runExportWorkflow: vi.fn(),
}))

describe('useWorkflowActions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ onProgress }) => {
      onProgress({
        exportTaskId: 'export-task-1',
        exportStatus: 'pending',
        exportProgressPercent: 0,
        exportMessage: '导出任务已创建。',
      })
      onProgress({
        exportTaskId: 'export-task-1',
        exportStatus: 'running',
        exportProgressPercent: 60,
        exportMessage: '正在生成 Word 结论。',
      })

      return {
        exportTaskId: 'export-task-1',
        exportStatus: 'succeeded',
        exportProgressPercent: 100,
        exportMessage: 'Word 结论已生成。',
        exportFileName: 'analysis-task-1.docx',
        downloadUrl: '/mock/report.docx',
        exportErrorMessage: '',
      }
    })

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
    expect(state.analysisTaskId).toBe('analysis-task-1')
    expect(state.analysisSummary).toBe('已基于当前导入障碍物和所选机场生成最小分析结果。')
    expect(state.analysisSelectedTargets).toEqual([
      { id: '1', name: 'Airport Near', category: '机场' },
      { id: '2', name: 'Airport Far', category: '机场' },
    ])
    expect(state.analysisObstacleCount).toBe(2)
    expect(state.statusMessage).toBe('analysis task created')

    const exportPromise = exportReport()

    await vi.runAllTimersAsync()
    await exportPromise

    expect(state.exportTaskId).toBe('export-task-1')
    expect(state.exportStatus).toBe('succeeded')
    expect(state.exportProgressPercent).toBe(100)
    expect(state.exportMessage).toBe('Word 结论已生成。')
    expect(state.exportFileName).toBe('analysis-task-1.docx')
    expect(state.downloadUrl).toBe('/mock/report.docx')
    expect(state.exportErrorMessage).toBe('')

    closeModal()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')
    expect(state.renderedObstacles).toHaveLength(1)

    vi.useRealTimers()
  })

  it('keeps analysis result stage and stores export failure details when export workflow fails', async () => {
    vi.useFakeTimers()

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ onProgress }) => {
      onProgress({
        exportTaskId: 'export-task-2',
        exportStatus: 'running',
        exportProgressPercent: 35,
        exportMessage: '正在生成 Word 结论。',
      })

      throw new Error('导出失败，请稍后重试。')
    })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal()
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()

    await vi.runAllTimersAsync()
    await analyzePromise

    const exportPromise = exportReport()

    await vi.runAllTimersAsync()

    await expect(exportPromise).resolves.toBeUndefined()
    expect(state.stage).toBe('analysis-result')
    expect(state.exportTaskId).toBe('export-task-2')
    expect(state.exportStatus).toBe('failed')
    expect(state.exportProgressPercent).toBe(35)
    expect(state.exportMessage).toBe('导出失败，请稍后重试。')
    expect(state.exportErrorMessage).toBe('导出失败，请稍后重试。')
    expect(state.exportFileName).toBe('')
    expect(state.downloadUrl).toBe('')

    vi.useRealTimers()
  })

  it('ignores stale export updates from an older export attempt', async () => {
    vi.useFakeTimers()

    const exportResolvers: {
      first: null | (() => void)
      second: null | (() => void)
    } = {
      first: null,
      second: null,
    }

    vi.mocked(runExportWorkflow)
      .mockImplementationOnce(({ onProgress }) => {
        onProgress({
          exportTaskId: 'export-task-old',
          exportStatus: 'running',
          exportProgressPercent: 25,
          exportMessage: '旧导出任务执行中。',
        })

        return new Promise<void>((resolve) => {
          exportResolvers.first = () => resolve()
        }).then(() => ({
          exportTaskId: 'export-task-old',
          exportStatus: 'succeeded',
          exportProgressPercent: 100,
          exportMessage: '旧导出任务已完成。',
          exportFileName: 'old.docx',
          downloadUrl: '/mock/old.docx',
          exportErrorMessage: '',
        }))
      })
      .mockImplementationOnce(({ onProgress }) => {
        onProgress({
          exportTaskId: 'export-task-new',
          exportStatus: 'running',
          exportProgressPercent: 80,
          exportMessage: '新导出任务执行中。',
        })

        return new Promise<void>((resolve) => {
          exportResolvers.second = () => resolve()
        }).then(() => ({
          exportTaskId: 'export-task-new',
          exportStatus: 'succeeded',
          exportProgressPercent: 100,
          exportMessage: '新导出任务已完成。',
          exportFileName: 'new.docx',
          downloadUrl: '/mock/new.docx',
          exportErrorMessage: '',
        }))
      })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal()
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()
    await vi.runAllTimersAsync()
    await analyzePromise

    const firstExportPromise = exportReport()
    const secondExportPromise = exportReport()

    const resolveFirstExport = exportResolvers.first

    if (resolveFirstExport) {
      resolveFirstExport()
    }
    await vi.runAllTimersAsync()
    await firstExportPromise

    expect(state.exportTaskId).toBe('export-task-new')
    expect(state.exportStatus).toBe('running')
    expect(state.exportProgressPercent).toBe(80)
    expect(state.exportMessage).toBe('新导出任务执行中。')
    expect(state.exportFileName).toBe('')
    expect(state.downloadUrl).toBe('')

    const resolveSecondExport = exportResolvers.second

    if (resolveSecondExport) {
      resolveSecondExport()
    }
    await vi.runAllTimersAsync()
    await secondExportPromise

    expect(state.exportTaskId).toBe('export-task-new')
    expect(state.exportStatus).toBe('succeeded')
    expect(state.exportProgressPercent).toBe(100)
    expect(state.exportMessage).toBe('新导出任务已完成。')
    expect(state.exportFileName).toBe('new.docx')
    expect(state.downloadUrl).toBe('/mock/new.docx')

    vi.useRealTimers()
  })

  it('does not throw when export workflow triggers download outside browser environment', async () => {
    vi.useFakeTimers()

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ triggerDownload }) => {
      triggerDownload('javascript:alert(1)')

      return {
        exportTaskId: 'export-task-3',
        exportStatus: 'succeeded',
        exportProgressPercent: 100,
        exportMessage: 'Word 结论已生成。',
        exportFileName: 'analysis-task-3.docx',
        downloadUrl: 'javascript:alert(1)',
        exportErrorMessage: '',
      }
    })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal()
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()
    await vi.runAllTimersAsync()
    await analyzePromise

    await expect(exportReport()).resolves.toBeUndefined()

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
