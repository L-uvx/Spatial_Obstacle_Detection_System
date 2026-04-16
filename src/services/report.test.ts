// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createExportTask,
  getExportTaskResult,
  getExportTaskStatus,
  resolveDownloadUrl,
} from './report'

const originalWindow = globalThis.window

function setWindowOrigin(origin: string) {
  ;(globalThis as unknown as { window?: Window }).window = {
    location: {
      origin,
    },
  } as unknown as Window
}

function clearWindow() {
  ;(globalThis as unknown as { window?: Window }).window = undefined
}

function stubFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal('fetch', vi.fn(async () => response as Response))
}

afterEach(() => {
  vi.unstubAllGlobals()

  if (originalWindow) {
    ;(globalThis as unknown as { window?: Window }).window = originalWindow
  } else {
    clearWindow()
  }
})

describe('report service', () => {
  it('creates export task with analysis task path', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        exportTaskId: 'export-task-1',
        analysisTaskId: 'analysis-task-1',
        status: 'pending',
        message: 'export task created',
        progressPercent: 0,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await createExportTask('analysis-task-1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/analysis/analysis-task-1/export', {
      method: 'POST',
    })
    expect(result.exportTaskId).toBe('export-task-1')
    expect(result.status).toBe('pending')
  })

  it('maps 409 export creation error detail', async () => {
    stubFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'analysis task is not ready for export' }),
    })

    await expect(createExportTask('analysis-task-1')).rejects.toThrow('analysis task is not ready for export')
  })

  it('requests export status from nested status path', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        exportTaskId: 'export-task-1',
        analysisTaskId: 'analysis-task-1',
        status: 'running',
        message: 'export task running',
        progressPercent: 50,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getExportTaskStatus('analysis-task-1', 'export-task-1')

    expect(fetchMock).toHaveBeenCalledWith(
      '/polygon-obstacle/analysis/analysis-task-1/export/export-task-1/status',
    )
    expect(result.progressPercent).toBe(50)
  })

  it('requests export result and resolves full download url', async () => {
    setWindowOrigin('https://prod.example.com')

    stubFetchOnce({
      ok: true,
      json: async () => ({
        exportTaskId: 'export-task-1',
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        fileName: 'polygon-obstacle-analysis-analysis-task-1.docx',
        downloadUrl: '/polygon-obstacle/exports/export-task-1/download',
        errorMessage: null,
      }),
    })

    const result = await getExportTaskResult('analysis-task-1', 'export-task-1')

    expect(result.downloadUrl).toBe('/polygon-obstacle/exports/export-task-1/download')
    expect(resolveDownloadUrl('/polygon-obstacle/exports/export-task-1/download')).toBe(
      'https://prod.example.com/polygon-obstacle/exports/export-task-1/download',
    )
  })

  it('keeps absolute download urls unchanged', () => {
    expect(resolveDownloadUrl('https://example.com/report.docx')).toBe('https://example.com/report.docx')
  })

  it('resolves protocol-relative download urls against current protocol', () => {
    setWindowOrigin('https://prod.example.com')

    expect(resolveDownloadUrl('//example.com/report.docx')).toBe('https://example.com/report.docx')
  })

  it('falls back to local api base when window is unavailable', () => {
    clearWindow()

    expect(resolveDownloadUrl('/polygon-obstacle/exports/export-task-1/download')).toBe(
      'http://127.0.0.1:8000/polygon-obstacle/exports/export-task-1/download',
    )
  })

  it('maps export status error detail from validation payload', async () => {
    stubFetchOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: [{ msg: 'invalid export task id' }] }),
    })

    await expect(getExportTaskStatus('analysis-task-1', 'bad-task')).rejects.toThrow('invalid export task id')
  })

  it('maps export result error to fallback message when detail is unavailable', async () => {
    stubFetchOnce({
      ok: false,
      status: 500,
      json: async () => ({})
    })

    await expect(getExportTaskResult('analysis-task-1', 'export-task-1')).rejects.toThrow('导出结果查询失败：500')
  })
})
