import { describe, expect, it, vi } from 'vitest'
import { useWorkflowActions } from './useWorkflowActions'

vi.mock('../workflows/importWorkflow', () => ({
  runImportWorkflow: vi.fn(async () => ({ message: '导入占位 workflow 已执行。' })),
}))

vi.mock('../workflows/analyzeWorkflow', () => ({
  runAnalyzeWorkflow: vi.fn(async () => ({ message: '分析占位 workflow 已执行。' })),
}))

vi.mock('../workflows/exportWorkflow', () => ({
  runExportWorkflow: vi.fn(async () => ({ message: '导出占位 workflow 已执行。' })),
}))

describe('useWorkflowActions', () => {
  it('tracks import, analyze, and export action lifecycle', async () => {
    vi.useFakeTimers()

    const { actionStateByTool, executeToolAction } = useWorkflowActions()

    expect(actionStateByTool.import.status).toBe('idle')
    expect(actionStateByTool.analyze.status).toBe('idle')
    expect(actionStateByTool.export.status).toBe('idle')

    const promise = executeToolAction('import')

    expect(actionStateByTool.import.status).toBe('running')
    expect(actionStateByTool.import.message).toContain('执行中')

    await vi.runAllTimersAsync()
    await promise

    expect(actionStateByTool.import.status).toBe('success')
    expect(actionStateByTool.import.message).toContain('workflow 已执行')

    vi.useRealTimers()
  })
})
