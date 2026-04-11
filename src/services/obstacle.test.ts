// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getImportTaskResult,
  getImportTaskStatus,
  getImportTargets,
  importObstacles,
} from './obstacle'

describe('importObstacles', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uploads excel using FormData field excelFile to the polygon obstacle import endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        taskId: 'import-batch-3',
        status: 'running',
        message: 'import task created',
        progressPercent: 5,
        projectId: 3,
        obstacleBatchId: 'import-batch-3',
      }),
    } as Response)

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await importObstacles({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('/polygon-obstacle/import')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)

    const body = init?.body as FormData

    expect(body.get('projectName')).toBe('武汉净空项目')
    expect(body.get('obstacleType')).toBe('铁塔')
    expect(body.get('excelFile')).toBe(file)

    expect(result).toEqual({
      taskId: 'import-batch-3',
      status: 'running',
      message: 'import task created',
      progressPercent: 5,
      projectId: 3,
      obstacleBatchId: 'import-batch-3',
    })
  })

  it('requests import task status using the task id returned by import creation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        taskId: 'import-batch-3',
        status: 'succeeded',
        message: 'import completed',
        progressPercent: 100,
      }),
    } as Response)

    const result = await getImportTaskStatus('import-batch-3')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/import/import-batch-3/status')
    expect(result).toEqual({
      taskId: 'import-batch-3',
      status: 'succeeded',
      message: 'import completed',
      progressPercent: 100,
    })
  })

  it('requests import task result only after the import task succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        taskId: 'import-batch-3',
        projectId: 3,
        obstacleBatchId: 'import-batch-3',
        importedCount: 12,
        failedCount: 0,
      }),
    } as Response)

    const result = await getImportTaskResult('import-batch-3')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/import/import-batch-3/result')
    expect(result).toEqual({
      taskId: 'import-batch-3',
      projectId: 3,
      obstacleBatchId: 'import-batch-3',
      importedCount: 12,
      failedCount: 0,
    })
  })

  it('loads target options from the import targets endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 'airport-1',
          name: '天河机场',
          category: '机场',
          distance: 12.4,
          distanceUnit: 'km',
        },
        {
          id: 'atc-1',
          name: '武汉空管局',
          category: '空管局',
          distance: 6.2,
          distanceUnit: 'km',
        },
      ]),
    } as Response)

    const result = await getImportTargets('import-batch-3')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/import/import-batch-3/targets')
    expect(result).toEqual([
      { id: 'airport-1', name: '天河机场', category: '机场', distance: '12.4 km' },
      { id: 'atc-1', name: '武汉空管局', category: '空管局', distance: '6.2 km' },
    ])
  })
})
