import { describe, expect, it, vi } from 'vitest'
import { useWorkflowActions } from './useWorkflowActions'
import { runImportWorkflow } from '../workflows/importWorkflow'

vi.mock('../workflows/importWorkflow', () => ({
  runImportWorkflow: vi.fn(async () => ({
    projectId: 'project-1',
    obstacleBatchId: 'batch-1',
    message: '导入占位 workflow 已执行。',
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
    expect(state.targetOptions).toHaveLength(3)
    expect(state.targetOptions[0].category).toBe('机场')

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

    vi.useRealTimers()
  })
})
