// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { importObstacles } from './obstacle'

describe('importObstacles', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uploads excel using FormData field excelFile to the polygon obstacle import endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        projectId: 'project-1',
        obstacleBatchId: 'batch-1',
        message: '导入任务已创建。',
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
      projectId: 'project-1',
      obstacleBatchId: 'batch-1',
      message: '导入任务已创建。',
    })
  })
})
