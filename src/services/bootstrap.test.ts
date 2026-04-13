// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapConfig } from '../config/map'
import { getBootstrapData } from './bootstrap'

function stubFetchOnce(response: Partial<Response>) {
  vi.stubGlobal('fetch', vi.fn(async () => response) as unknown as typeof fetch)
}

describe('getBootstrapData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes airport coordinates and historical obstacles', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airport: {
          id: 1,
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
        },
        historicalObstacles: [
          {
            id: 17,
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
      }),
    })

    const result = await getBootstrapData()

    expect(result.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: mapConfig.initialView.height,
      pitch: -90,
    })
    expect(result.historicalObstacles).toHaveLength(1)
    expect(result.historicalObstacles[0].id).toBe('17')
  })

  it('treats missing historicalObstacles as an empty list', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airport: {
          id: 1,
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
        },
      }),
    })

    const result = await getBootstrapData()

    expect(result.historicalObstacles).toEqual([])
  })

  it('filters invalid historical obstacles instead of failing the whole request', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airport: {
          id: 1,
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
        },
        historicalObstacles: [
          {
            id: 17,
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
          {
            id: 18,
            name: '坏数据',
            obstacleType: '建筑物/构建物',
            topElevation: 549.9,
            geometry: null,
          },
        ],
      }),
    })

    const result = await getBootstrapData()

    expect(result.historicalObstacles.map((item) => item.id)).toEqual(['17'])
  })

  it('treats malformed but present historicalObstacles as an empty list', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airport: {
          id: 1,
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
        },
        historicalObstacles: {
          id: 17,
        },
      }),
    })

    const result = await getBootstrapData()

    expect(result.historicalObstacles).toEqual([])
  })

  it('throws when the response is not ok', async () => {
    stubFetchOnce({
      ok: false,
      status: 500,
    })

    await expect(getBootstrapData()).rejects.toThrow('初始化接口请求失败：500')
  })

  it('throws when airport longitude or latitude is invalid', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airport: {
          id: 1,
          name: '双流机场',
          longitude: null,
          latitude: 30.57972,
        },
        historicalObstacles: [],
      }),
    })

    await expect(getBootstrapData()).rejects.toThrow('初始化机场坐标无效。')
  })
})
