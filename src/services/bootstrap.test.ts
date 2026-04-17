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

  it('normalizes airports, stations and default camera target from airports array', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airports: [
          {
            id: 1,
            name: '双流机场',
            longitude: 103.95056,
            latitude: 30.57972,
            stations: [
              {
                id: 4,
                name: '西南近无方向信标台',
                stationType: 'NDB',
                longitude: 103.935861,
                latitude: 30.554611,
                altitude: 491.1,
              },
            ],
          },
        ],
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
    expect(result.airports).toEqual([
      {
        id: '1',
        name: '双流机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [
          {
            id: '4',
            airportId: '1',
            name: '西南近无方向信标台',
            stationType: 'NDB',
            longitude: 103.935861,
            latitude: 30.554611,
            altitude: 491.1,
          },
        ],
      },
    ])
    expect(result.historicalObstacles).toHaveLength(1)
    expect(result.historicalObstacles[0].id).toBe('17')
  })

  it('filters invalid stations and treats malformed airports as empty list', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airports: [
          {
            id: 1,
            name: '双流机场',
            longitude: 103.95056,
            latitude: 30.57972,
            stations: [
              {
                id: 4,
                name: '坏台站',
                stationType: 'NDB',
                longitude: null,
                latitude: 30.554611,
                altitude: 491.1,
              },
              {
                id: 5,
                name: '缺海拔台站',
                stationType: 'NDB',
                longitude: 103.909889,
                latitude: 30.498722,
                altitude: null,
              },
            ],
          },
          {
            id: 2,
            name: '坏机场',
            longitude: null,
            latitude: 30.1,
            stations: [
              {
                id: 99,
                name: '不应保留',
                stationType: 'VOR',
                longitude: 103,
                latitude: 30,
                altitude: 1,
              },
            ],
          },
        ],
      }),
    })

    const result = await getBootstrapData()

    expect(result.airports).toEqual([
      {
        id: '1',
        name: '双流机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [
          {
            id: '5',
            airportId: '1',
            name: '缺海拔台站',
            stationType: 'NDB',
            longitude: 103.909889,
            latitude: 30.498722,
            altitude: 0,
          },
        ],
      },
    ])
    expect(result.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: mapConfig.initialView.height,
      pitch: -90,
    })
    expect(result.historicalObstacles).toEqual([])
  })

  it('drops airports and stations with non-finite coordinates and normalizes non-finite altitude to zero', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airports: [
          {
            id: 1,
            name: '坏机场NaN',
            longitude: Number.NaN,
            latitude: 30.57972,
          },
          {
            id: 2,
            name: '坏机场Infinity',
            longitude: 103.95056,
            latitude: Number.POSITIVE_INFINITY,
          },
          {
            id: 3,
            name: '双流机场',
            longitude: 103.95056,
            latitude: 30.57972,
            stations: [
              {
                id: 10,
                name: '坏台站NaN',
                stationType: 'NDB',
                longitude: Number.NaN,
                latitude: 30.5,
                altitude: 100,
              },
              {
                id: 11,
                name: '坏台站Infinity',
                stationType: 'NDB',
                longitude: 103.9,
                latitude: Number.NEGATIVE_INFINITY,
                altitude: 100,
              },
              {
                id: 12,
                name: '海拔NaN台站',
                stationType: 'NDB',
                longitude: 103.909889,
                latitude: 30.498722,
                altitude: Number.NaN,
              },
              {
                id: 13,
                name: '海拔Infinity台站',
                stationType: 'LOC',
                longitude: 103.919889,
                latitude: 30.508722,
                altitude: Number.POSITIVE_INFINITY,
              },
            ],
          },
        ],
        historicalObstacles: [],
      }),
    })

    const result = await getBootstrapData()

    expect(result.airports).toEqual([
      {
        id: '3',
        name: '双流机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [
          {
            id: '12',
            airportId: '3',
            name: '海拔NaN台站',
            stationType: 'NDB',
            longitude: 103.909889,
            latitude: 30.498722,
            altitude: 0,
          },
          {
            id: '13',
            airportId: '3',
            name: '海拔Infinity台站',
            stationType: 'LOC',
            longitude: 103.919889,
            latitude: 30.508722,
            altitude: 0,
          },
        ],
      },
    ])
    expect(result.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: mapConfig.initialView.height,
      pitch: -90,
    })
  })

  it('filters invalid historical obstacles instead of failing the whole request', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airports: [
          {
            id: 1,
            name: '双流机场',
            longitude: 103.95056,
            latitude: 30.57972,
          },
        ],
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

  it('drops historical obstacles with non-finite topElevation or malformed multipolygon coordinates', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airports: [
          {
            id: 1,
            name: '双流机场',
            longitude: 103.95056,
            latitude: 30.57972,
          },
        ],
        historicalObstacles: [
          {
            id: 17,
            name: '有效障碍物',
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
            name: '高程NaN',
            obstacleType: '建筑物/构建物',
            topElevation: Number.NaN,
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [103.1, 30.1],
                    [103.2, 30.1],
                    [103.1, 30.2],
                    [103.1, 30.1],
                  ],
                ],
              ],
            },
          },
          {
            id: 19,
            name: '坐标Infinity',
            obstacleType: '建筑物/构建物',
            topElevation: 600,
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [Number.POSITIVE_INFINITY, 30.1],
                    [103.2, 30.1],
                    [103.1, 30.2],
                    [Number.POSITIVE_INFINITY, 30.1],
                  ],
                ],
              ],
            },
          },
          {
            id: 20,
            name: '结构错误',
            obstacleType: '建筑物/构建物',
            topElevation: 601,
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  103.1,
                  30.1,
                ],
              ] as unknown,
            } as unknown,
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
        airports: [
          {
            id: 1,
            name: '双流机场',
            longitude: 103.95056,
            latitude: 30.57972,
          },
        ],
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

  it('returns null camera target and empty airports when no valid airport exists', async () => {
    stubFetchOnce({
      ok: true,
      json: async () => ({
        airports: [
          {
            id: 1,
            name: '双流机场',
            longitude: null,
            latitude: 30.57972,
          },
        ],
        historicalObstacles: [],
      }),
    })

    await expect(getBootstrapData()).resolves.toEqual({
      initialCameraTarget: null,
      airports: [],
      historicalObstacles: [],
    })
  })
})
