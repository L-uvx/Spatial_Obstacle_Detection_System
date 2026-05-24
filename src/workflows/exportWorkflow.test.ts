import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runExportWorkflow } from './exportWorkflow'
import * as reportService from '../services/report'

vi.mock('../services/report', () => ({
  createExportTask: vi.fn(),
  getExportTaskStatus: vi.fn(),
  getExportTaskResult: vi.fn(),
  resolveDownloadUrl: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('runExportWorkflow', () => {
  it('throws backend message when create export task returns failed immediately', async () => {
    const onProgress = vi.fn()
    const triggerDownload = vi.fn()

    vi.mocked(reportService.createExportTask).mockResolvedValueOnce({
      exportTaskId: 'export-task-0',
      analysisTaskId: 'analysis-task-0',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'failed',
      message: '导出任务创建后立即失败',
      progressPercent: 0,
    })

    await expect(
      runExportWorkflow({
        analysisTaskId: 'analysis-task-0',
        targetId: 1,
        onProgress,
        triggerDownload,
        pollIntervalMs: 0,
      }),
    ).rejects.toThrow('导出任务创建后立即失败')

    expect(onProgress).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith({
      exportTaskId: 'export-task-0',
      exportStatus: 'failed',
      exportProgressPercent: 0,
      exportMessage: '导出任务创建后立即失败',
    })
    expect(reportService.getExportTaskStatus).not.toHaveBeenCalled()
    expect(reportService.getExportTaskResult).not.toHaveBeenCalled()
    expect(triggerDownload).not.toHaveBeenCalled()
  })

  it('creates, polls, resolves download url, and triggers download on success', async () => {
    const onProgress = vi.fn()
    const triggerDownload = vi.fn()

    vi.mocked(reportService.createExportTask).mockResolvedValueOnce({
      exportTaskId: 'export-task-1',
      analysisTaskId: 'analysis-task-1',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'pending',
      message: '导出任务已创建',
      progressPercent: 0,
    })
    vi.mocked(reportService.getExportTaskStatus)
      .mockResolvedValueOnce({
        exportTaskId: 'export-task-1',
        analysisTaskId: 'analysis-task-1',
        targetId: 1,
        targetName: 'Airport Near',
        status: 'running',
        message: '正在生成报告',
        progressPercent: 45,
      })
      .mockResolvedValueOnce({
        exportTaskId: 'export-task-1',
        analysisTaskId: 'analysis-task-1',
        targetId: 1,
        targetName: 'Airport Near',
        status: 'succeeded',
        message: '导出任务已完成',
        progressPercent: 100,
      })
    vi.mocked(reportService.getExportTaskResult).mockResolvedValueOnce({
      exportTaskId: 'export-task-1',
      analysisTaskId: 'analysis-task-1',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'succeeded',
      fileName: 'analysis-report.docx',
      downloadUrl: '/polygon-obstacle/exports/export-task-1/download',
      errorMessage: null,
    })
    vi.mocked(reportService.resolveDownloadUrl).mockReturnValueOnce(
      'http://127.0.0.1:8000/polygon-obstacle/exports/export-task-1/download',
    )

    const result = await runExportWorkflow({
      analysisTaskId: 'analysis-task-1',
      targetId: 1,
      onProgress,
      triggerDownload,
      pollIntervalMs: 0,
    })

    expect(reportService.createExportTask).toHaveBeenCalledWith('analysis-task-1', 1)
    expect(reportService.getExportTaskStatus).toHaveBeenNthCalledWith(
      1,
      'analysis-task-1',
      'export-task-1',
    )
    expect(reportService.getExportTaskStatus).toHaveBeenNthCalledWith(
      2,
      'analysis-task-1',
      'export-task-1',
    )
    expect(reportService.getExportTaskResult).toHaveBeenCalledWith('analysis-task-1', 'export-task-1')
    expect(reportService.resolveDownloadUrl).toHaveBeenCalledWith(
      '/polygon-obstacle/exports/export-task-1/download',
    )
    expect(onProgress).toHaveBeenCalledTimes(3)
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      exportTaskId: 'export-task-1',
      exportStatus: 'pending',
      exportProgressPercent: 0,
      exportMessage: '导出任务已创建',
    })
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      exportTaskId: 'export-task-1',
      exportStatus: 'running',
      exportProgressPercent: 45,
      exportMessage: '正在生成报告',
    })
    expect(onProgress).toHaveBeenNthCalledWith(3, {
      exportTaskId: 'export-task-1',
      exportStatus: 'succeeded',
      exportProgressPercent: 100,
      exportMessage: '导出任务已完成',
    })
    expect(triggerDownload).toHaveBeenCalledTimes(1)
    expect(triggerDownload).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/polygon-obstacle/exports/export-task-1/download',
    )
    expect(result).toEqual({
      exportTaskId: 'export-task-1',
      exportStatus: 'succeeded',
      exportProgressPercent: 100,
      exportMessage: '导出任务已完成',
      exportFileName: 'analysis-report.docx',
      downloadUrl: 'http://127.0.0.1:8000/polygon-obstacle/exports/export-task-1/download',
      exportErrorMessage: '',
    })
  })

  it('throws backend message when export status becomes failed', async () => {
    const onProgress = vi.fn()
    const triggerDownload = vi.fn()

    vi.mocked(reportService.createExportTask).mockResolvedValueOnce({
      exportTaskId: 'export-task-2',
      analysisTaskId: 'analysis-task-2',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'pending',
      message: '导出任务已创建',
      progressPercent: 0,
    })
    vi.mocked(reportService.getExportTaskStatus).mockResolvedValueOnce({
      exportTaskId: 'export-task-2',
      analysisTaskId: 'analysis-task-2',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'failed',
      message: '报告生成失败',
      progressPercent: 75,
    })

    await expect(
      runExportWorkflow({
        analysisTaskId: 'analysis-task-2',
        targetId: 1,
        onProgress,
        triggerDownload,
        pollIntervalMs: 0,
      }),
    ).rejects.toThrow('报告生成失败')

    expect(onProgress).toHaveBeenNthCalledWith(1, {
      exportTaskId: 'export-task-2',
      exportStatus: 'pending',
      exportProgressPercent: 0,
      exportMessage: '导出任务已创建',
    })
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      exportTaskId: 'export-task-2',
      exportStatus: 'failed',
      exportProgressPercent: 75,
      exportMessage: '报告生成失败',
    })
    expect(reportService.getExportTaskResult).not.toHaveBeenCalled()
    expect(triggerDownload).not.toHaveBeenCalled()
  })

  it('throws when export result is not a usable succeeded payload', async () => {
    const onProgress = vi.fn()
    const triggerDownload = vi.fn()

    vi.mocked(reportService.createExportTask).mockResolvedValueOnce({
      exportTaskId: 'export-task-3',
      analysisTaskId: 'analysis-task-3',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'pending',
      message: '导出任务已创建',
      progressPercent: 0,
    })
    vi.mocked(reportService.getExportTaskStatus).mockResolvedValueOnce({
      exportTaskId: 'export-task-3',
      analysisTaskId: 'analysis-task-3',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'succeeded',
      message: '导出任务已完成',
      progressPercent: 100,
    })
    vi.mocked(reportService.getExportTaskResult).mockResolvedValueOnce({
      exportTaskId: 'export-task-3',
      analysisTaskId: 'analysis-task-3',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'failed',
      fileName: null,
      downloadUrl: null,
      errorMessage: '结果文件写入失败',
    })

    await expect(
      runExportWorkflow({
        analysisTaskId: 'analysis-task-3',
        targetId: 1,
        onProgress,
        triggerDownload,
        pollIntervalMs: 0,
      }),
    ).rejects.toThrow('结果文件写入失败')

    expect(triggerDownload).not.toHaveBeenCalled()
  })

  it('throws when succeeded export result is missing file fields', async () => {
    const onProgress = vi.fn()
    const triggerDownload = vi.fn()

    vi.mocked(reportService.createExportTask).mockResolvedValueOnce({
      exportTaskId: 'export-task-4',
      analysisTaskId: 'analysis-task-4',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'pending',
      message: '导出任务已创建',
      progressPercent: 0,
    })
    vi.mocked(reportService.getExportTaskStatus).mockResolvedValueOnce({
      exportTaskId: 'export-task-4',
      analysisTaskId: 'analysis-task-4',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'succeeded',
      message: '导出任务已完成',
      progressPercent: 100,
    })
    vi.mocked(reportService.getExportTaskResult).mockResolvedValueOnce({
      exportTaskId: 'export-task-4',
      analysisTaskId: 'analysis-task-4',
      targetId: 1,
      targetName: 'Airport Near',
      status: 'succeeded',
      fileName: null,
      downloadUrl: null,
      errorMessage: null,
    })

    await expect(
      runExportWorkflow({
        analysisTaskId: 'analysis-task-4',
        targetId: 1,
        onProgress,
        triggerDownload,
        pollIntervalMs: 0,
      }),
    ).rejects.toThrow('导出结果不完整，无法下载报告。')

    expect(triggerDownload).not.toHaveBeenCalled()
  })
})
