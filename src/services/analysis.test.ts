// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAnalysisTask,
  getAirportProtectionZones,
  getAnalysisTaskResult,
  getAnalysisTaskStatus,
} from './analysis'

describe('analysis service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an analysis task from import task id and numeric target ids', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      }),
    } as unknown as Response)

    const result = await createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('/polygon-obstacle/analysis')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({
      'Content-Type': 'application/json',
    })
    expect(init?.body).toBe(JSON.stringify({
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    }))

    expect(result).toEqual({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task created',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
  })

  it('throws when createAnalysisTask receives a malformed success payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: '100',
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      }),
    } as unknown as Response)

    await expect(createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '2'],
    })).rejects.toThrow('分析任务创建响应格式无效')
  })

  it('accepts numeric target ids without throwing before the request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      }),
    } as unknown as Response)

    const result = await createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: [1, 2] as never,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.targetIds).toEqual([1, 2])
  })

  it('rejects invalid target ids before issuing the analysis request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1],
      }),
    } as unknown as Response)

    await expect(createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1', 'oops'],
    })).rejects.toThrow('分析目标 id 无效')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects blank target ids before issuing the analysis request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1],
      }),
    } as unknown as Response)

    await expect(createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '   '],
    })).rejects.toThrow('分析目标 id 无效')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces backend string detail when createAnalysisTask receives a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: 'targetIds is required',
      }),
    } as unknown as Response)

    await expect(createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1'],
    })).rejects.toThrow('targetIds is required')
  })

  it('falls back to the default createAnalysisTask error message when the error payload is unreadable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json')
      },
    } as unknown as Response)

    await expect(createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1'],
    })).rejects.toThrow('分析任务创建失败：500')
  })

  it('loads analysis task status by task id', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
      }),
    } as Response)

    const result = await getAnalysisTaskStatus('analysis-task-1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/analysis/analysis-task-1/status')
    expect(result).toEqual({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      message: 'analysis task created',
      progressPercent: 100,
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
    })
  })

  it('throws when getAnalysisTaskStatus receives a malformed success payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        message: 'analysis task created',
        progressPercent: 100,
        importTaskId: 'import-batch-1',
        targetIds: ['1', '2'],
      }),
    } as Response)

    await expect(getAnalysisTaskStatus('analysis-task-1')).rejects.toThrow('分析状态响应格式无效')
  })

  it('surfaces backend validation detail when getAnalysisTaskStatus receives a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        detail: [{ msg: 'analysis task not found' }],
      }),
    } as Response)

    await expect(getAnalysisTaskStatus('analysis-task-1')).rejects.toThrow('analysis task not found')
  })

  it('falls back to the default getAnalysisTaskStatus error message when detail is unusable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        detail: { message: 'unexpected shape' },
      }),
    } as Response)

    await expect(getAnalysisTaskStatus('analysis-task-1')).rejects.toThrow('分析状态查询失败：503')
  })

  it('loads minimal analysis result after the task succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
        selectedTargets: [
          {
            id: 1,
            name: 'Airport Near',
            category: '机场',
          },
          {
            id: 2,
            name: 'Airport Far',
            category: '机场',
          },
        ],
        obstacleCount: 2,
        summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
        targetResults: [
          {
            targetId: 1,
            targetName: 'Airport Near',
            ruleResults: [
              {
                stationId: 4,
                stationName: '西南近无方向信标台',
                stationType: 'NDB',
                obstacleId: 67,
                obstacleName: '障碍物2',
                rawObstacleType: '建筑物/构建物',
                globalObstacleCategory: 'building_general',
                ruleCode: 'ndb_minimum_distance_50m',
                ruleName: 'ndb_minimum_distance_50m',
                zoneCode: 'ndb_minimum_distance_50m',
                zoneName: 'NDB 50m minimum distance zone',
                regionCode: 'default',
                regionName: 'default',
                isApplicable: true,
                isCompliant: true,
                message: 'distance meets minimum threshold',
                metrics: {
                  enteredProtectionZone: true,
                  actualDistanceMeters: 150.5,
                  actualElevationAngleDegrees: 1.2,
                  baseHeightMeters: 30,
                  elevationAngleDegrees: 3,
                  allowedHeightMeters: 200,
                  topElevationMeters: 80,
                  innerRadiusMeters: 50,
                  outerRadiusMeters: 37040,
                },
                standards: {
                  gb: [
                    { code: 'GB_NDB_50m最小间距区域_50', text: '国标内容', isCompliant: true },
                  ],
                  mh: [
                    { code: 'MH_NDB_50m最小间距区域_50', text: '行标内容', isCompliant: true },
                  ],
                },
                overDistanceMeters: 0,
                azimuthDegrees: 90,
                maxHorizontalAngleDegrees: 95,
                minHorizontalAngleDegrees: 85,
                relativeHeightMeters: 50,
                isInRadius: true,
                isInZone: true,
                details: '',
              },
            ],
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/analysis/analysis-task-1/result')
    expect(result).toMatchObject({
      analysisTaskId: 'analysis-task-1',
      status: 'succeeded',
      importTaskId: 'import-batch-1',
      targetIds: [1, 2],
      selectedTargets: [
        {
          id: '1',
          name: 'Airport Near',
          category: '机场',
        },
        {
          id: '2',
          name: 'Airport Far',
          category: '机场',
        },
      ],
      obstacleCount: 2,
      summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
      targetResults: [
        {
          targetId: 1,
          targetName: 'Airport Near',
          ruleResults: [
            {
              stationId: '4',
              stationName: '西南近无方向信标台',
              stationType: 'NDB',
              obstacleId: '67',
              obstacleName: '障碍物2',
              rawObstacleType: '建筑物/构建物',
              globalObstacleCategory: 'building_general',
              ruleCode: 'ndb_minimum_distance_50m',
              ruleName: 'ndb_minimum_distance_50m',
              zoneCode: 'ndb_minimum_distance_50m',
              zoneName: 'NDB 50m minimum distance zone',
              regionCode: 'default',
              regionName: 'default',
              isApplicable: true,
              isCompliant: true,
              message: 'distance meets minimum threshold',
              metrics: {
                isInProtectionZone: true,
                actualDistanceMeters: 150.5,
                actualElevationAngleDegrees: 1.2,
                baseHeightMeters: 30,
                elevationAngleDegrees: 3,
                allowedHeightMeters: 200,
                topElevationMeters: 80,
                innerRadiusMeters: 50,
                outerRadiusMeters: 37040,
              },
              standards: {
                gb: [
                  { code: 'GB_NDB_50m最小间距区域_50', text: '国标内容', isCompliant: true },
                ],
                mh: [
                  { code: 'MH_NDB_50m最小间距区域_50', text: '行标内容', isCompliant: true },
                ],
              },
              overDistanceMeters: 0,
              azimuthDegrees: 90,
              maxHorizontalAngleDegrees: 95,
              minHorizontalAngleDegrees: 85,
              relativeHeightMeters: 50,
              isInRadius: true,
              isInZone: true,
              details: '',
            },
          ],
        },
      ],
    })
  })

  it('filters malformed selectedTargets items instead of blindly normalizing them', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
        selectedTargets: [
          {
            id: 1,
            name: 'Airport Near',
            category: '机场',
          },
          {
            id: 2,
            category: '机场',
          },
        ],
        obstacleCount: 2,
        summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
        targetResults: [],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.selectedTargets).toEqual([
      {
        id: '1',
        name: 'Airport Near',
        category: '机场',
      },
    ])
  })

  it('throws when getAnalysisTaskResult receives a malformed success payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-batch-1',
        targetIds: [1, 2],
        selectedTargets: [],
        obstacleCount: '2',
        summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
        targetResults: [],
      }),
    } as Response)

    await expect(getAnalysisTaskResult('analysis-task-1')).rejects.toThrow('分析结果响应格式无效')
  })

  it('surfaces backend validation detail when getAnalysisTaskResult receives a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        detail: 'analysis result unavailable',
      }),
    } as Response)

    await expect(getAnalysisTaskResult('analysis-task-1')).rejects.toThrow('analysis result unavailable')
  })

  it('falls back to the default getAnalysisTaskResult error message when detail is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    } as Response)

    await expect(getAnalysisTaskResult('analysis-task-1')).rejects.toThrow('分析结果查询失败：502')
  })

  it('normalizes multipolygon geometry and preserves the formal analytic surface structure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-1',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_conical_clearance_3deg',
            ruleName: 'ndb_conical_clearance_3deg',
            zoneCode: 'ndb_conical_clearance_3deg',
            zoneName: 'NDB 3 degree conical clearance zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                  [
                    [103.944, 30.557],
                    [103.946, 30.557],
                    [103.946, 30.553],
                    [103.944, 30.553],
                    [103.944, 30.557],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 491.1,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'point',
                  point: [0, 0],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 50,
                  endMeters: 37040,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 3,
                  distanceOffsetMeters: 50,
                },
              },
            },
            properties: { label: 'NDB 3 degree conical clearance zone' },
          },
        ],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0].geometry).toEqual({
      shapeType: 'multipolygon',
      coordinates: [
        [
          [
            [103.94, 30.56],
            [103.95, 30.56],
            [103.95, 30.55],
            [103.94, 30.55],
            [103.94, 30.56],
          ],
          [
            [103.944, 30.557],
            [103.946, 30.557],
            [103.946, 30.553],
            [103.944, 30.553],
            [103.944, 30.557],
          ],
        ],
      ],
    })
    expect(result[0].vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 491.1,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'point',
          point: [0, 0],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 50,
          endMeters: 37040,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 3,
          distanceOffsetMeters: 50,
        },
      },
    })
  })

  it('filters malformed ruleResults items instead of blindly normalizing them', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-batch-1',
        targetIds: [1],
        selectedTargets: [
          {
            id: 1,
            name: 'Airport Near',
            category: '机场',
          },
        ],
        obstacleCount: 1,
        summary: 'summary',
        targetResults: [
          {
            targetId: 1,
            targetName: 'Airport Near',
            ruleResults: [
              {
                stationId: 4,
                stationName: '西南近无方向信标台',
                stationType: 'NDB',
                obstacleId: 67,
                obstacleName: '障碍物2',
                rawObstacleType: '建筑物/构建物',
                globalObstacleCategory: 'building_general',
                ruleCode: 'ndb_minimum_distance_50m',
                ruleName: 'ndb_minimum_distance_50m',
                zoneCode: 'ndb_minimum_distance_50m',
                zoneName: 'NDB 50m minimum distance zone',
                regionCode: 'default',
                regionName: 'default',
                isApplicable: true,
                isCompliant: true,
                message: 'distance meets minimum threshold',
              },
              {
                stationId: 5,
                stationType: 'NDB',
                obstacleId: 68,
                obstacleName: '坏数据',
                rawObstacleType: '建筑物/构建物',
                globalObstacleCategory: 'building_general',
                ruleName: 'ndb_minimum_distance_50m',
                zoneCode: 'ndb_minimum_distance_50m',
                zoneName: 'NDB 50m minimum distance zone',
                regionCode: 'default',
                regionName: 'default',
                isApplicable: true,
                isCompliant: true,
                message: 'missing stationName',
              },
            ],
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.targetResults).toEqual([
      {
        targetId: 1,
        targetName: 'Airport Near',
        ruleResults: [
          {
            stationId: '4',
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            obstacleId: '67',
            obstacleName: '障碍物2',
            rawObstacleType: '建筑物/构建物',
            globalObstacleCategory: 'building_general',
            ruleCode: 'ndb_minimum_distance_50m',
            ruleName: 'ndb_minimum_distance_50m',
            zoneCode: 'ndb_minimum_distance_50m',
            zoneName: 'NDB 50m minimum distance zone',
            regionCode: 'default',
            regionName: 'default',
            isApplicable: true,
            isCompliant: true,
            message: 'distance meets minimum threshold',
            metrics: null,
            standards: {
              gb: [],
              mh: [],
            },
            overDistanceMeters: 0,
            azimuthDegrees: 0,
            maxHorizontalAngleDegrees: 0,
            minHorizontalAngleDegrees: 0,
            relativeHeightMeters: 0,
            isInRadius: false,
            isInZone: false,
            details: '',
          },
        ],
      },
    ])
  })

  it('falls back to empty properties when a protection zone properties payload is invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-invalid-properties',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_conical_clearance_3deg',
            ruleName: 'ndb_conical_clearance_3deg',
            zoneCode: 'ndb_conical_clearance_3deg',
            zoneName: 'NDB 3 degree conical clearance zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'flat',
              baseReference: 'station',
              baseHeightMeters: 491.1,
            },
            properties: 'bad properties payload',
          },
        ],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result[0]?.properties).toEqual({})
  })

  it('accepts formal analytic_surface payloads when coordinateSystem is omitted', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-2',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_conical_clearance_3deg',
            ruleName: 'ndb_conical_clearance_3deg',
            zoneCode: 'ndb_conical_clearance_3deg',
            zoneName: 'NDB 3 degree conical clearance zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 491.1,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'point',
                  point: [103.935861, 30.554611],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 50,
                  endMeters: 37040,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 3,
                  distanceOffsetMeters: 50,
                },
              },
            },
            properties: { label: 'NDB 3 degree conical clearance zone' },
          },
        ],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0].vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 491.1,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'point',
          point: [103.935861, 30.554611],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 50,
          endMeters: 37040,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 3,
          distanceOffsetMeters: 50,
        },
      },
    })
  })

  it('normalizes front_reference_line analytic surfaces and preserves stationPoint and planarControl', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-front-reference-line',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_front_reference_line',
            ruleName: 'ndb_front_reference_line',
            zoneCode: 'ndb_front_reference_line',
            zoneName: 'NDB front reference line zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'front_reference_line',
                  stationPoint: [103.938972, 30.561306],
                  centerPoint: [103.952962, 30.594308],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'axial_from_reference_line',
                planarControl: {
                  frontOffsetMeters: 360,
                  halfAngleDegrees: 8,
                  radiusMeters: 18520,
                },
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                },
              },
            },
            properties: { label: 'NDB front reference line zone' },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result[0]?.vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'gp360_altitude',
      baseHeightMeters: 493.8,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [103.938972, 30.561306],
          centerPoint: [103.952962, 30.594308],
          leftPoint: [103.952492, 30.594308],
          rightPoint: [103.953432, 30.594308],
        },
        distanceMetric: 'axial_from_reference_line',
        planarControl: {
          frontOffsetMeters: 360,
          halfAngleDegrees: 8,
          radiusMeters: 18520,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 18160,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 1,
          distanceOffsetMeters: 0,
        },
      },
    })
  })

  it('drops front_reference_line analytic surfaces when paired with radial distanceMetric', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-front-reference-line-invalid',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_front_reference_line',
            ruleName: 'ndb_front_reference_line',
            zoneCode: 'ndb_front_reference_line',
            zoneName: 'NDB front reference line zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'front_reference_line',
                  centerPoint: [103.952962, 30.594308],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '4',
        zoneCode: 'ndb_front_reference_line',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('drops front_reference_line analytic surfaces when centerPoint is not a valid coordinate pair', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-front-reference-line-invalid-center',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_front_reference_line',
            ruleName: 'ndb_front_reference_line',
            zoneCode: 'ndb_front_reference_line',
            zoneName: 'NDB front reference line zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'front_reference_line',
                  centerPoint: [103.952962, Number.NaN],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'axial_from_reference_line',
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '4',
        zoneCode: 'ndb_front_reference_line',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('drops front_reference_line analytic surfaces when stationPoint is not a valid coordinate pair', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-front-reference-line-invalid-station',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_front_reference_line',
            ruleName: 'ndb_front_reference_line',
            zoneCode: 'ndb_front_reference_line',
            zoneName: 'NDB front reference line zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'front_reference_line',
                  stationPoint: [103.938972],
                  centerPoint: [103.952962, 30.594308],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'axial_from_reference_line',
                planarControl: {
                  frontOffsetMeters: 360,
                  halfAngleDegrees: 8,
                  radiusMeters: 18520,
                },
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '4',
        zoneCode: 'ndb_front_reference_line',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('drops front_reference_line analytic surfaces when planarControl.frontOffsetMeters is missing or invalid', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-front-reference-line-missing-front-offset',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_front_reference_line',
            ruleName: 'ndb_front_reference_line',
            zoneCode: 'ndb_front_reference_line',
            zoneName: 'NDB front reference line zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'front_reference_line',
                  stationPoint: [103.938972, 30.561306],
                  centerPoint: [103.952962, 30.594308],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'axial_from_reference_line',
                planarControl: {
                  halfAngleDegrees: 8,
                  radiusMeters: 18520,
                },
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
          {
            id: 'zone-front-reference-line-invalid-front-offset',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_front_reference_line',
            ruleName: 'ndb_front_reference_line',
            zoneCode: 'ndb_front_reference_line',
            zoneName: 'NDB front reference line zone',
            regionCode: 'secondary',
            regionName: 'secondary',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'front_reference_line',
                  stationPoint: [103.938972, 30.561306],
                  centerPoint: [103.952962, 30.594308],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'axial_from_reference_line',
                planarControl: {
                  frontOffsetMeters: '360',
                  halfAngleDegrees: 8,
                  radiusMeters: 18520,
                },
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '4',
        zoneCode: 'ndb_front_reference_line',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('normalizes loc_building_restriction_zone_region_3 analytic surfaces', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-r3',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: 'LOC台',
            stationType: 'LOC',
            ruleCode: 'loc_building_restriction',
            ruleName: 'loc_building_restriction',
            zoneCode: 'loc_region_3',
            zoneName: 'LOC region 3',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [[[
                [103.95, 30.59],
                [103.96, 30.59],
                [103.96, 30.60],
                [103.95, 30.60],
                [103.95, 30.59],
              ]]],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 492,
              surface: {
                type: 'loc_building_restriction_zone_region_3',
                arcHeightMeters: 562,
                alphaDegrees: 15.04,
                stationPoint: [103.938972, 30.561306],
                apexPoint: [103.95397513931144, 30.593665083709087],
                rootLeftPoint: [103.949136618227, 30.59534448405252],
                rootRightPoint: [103.95881349354343, 30.591985503088146],
                arcRadiusMeters: 9865.303478328966,
                arcPoints: [
                  [103.95117724149101, 30.649664183802024],
                  [103.95562327488403, 30.64911929778665],
                  [103.96003752578038, 30.64840710649382],
                ],
              },
            },
            properties: { label: 'LOC区域3' },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result[0]?.vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 492,
      surface: {
        type: 'loc_building_restriction_zone_region_3',
        arcHeightMeters: 562,
        alphaDegrees: 15.04,
        stationPoint: [103.938972, 30.561306],
        apexPoint: [103.95397513931144, 30.593665083709087],
        rootLeftPoint: [103.949136618227, 30.59534448405252],
        rootRightPoint: [103.95881349354343, 30.591985503088146],
        arcRadiusMeters: 9865.303478328966,
        arcPoints: [
          [103.95117724149101, 30.649664183802024],
          [103.95562327488403, 30.64911929778665],
          [103.96003752578038, 30.64840710649382],
        ],
      },
    })
  })

  it('drops loc_building_restriction_zone_region_3 when arcPoints has fewer than two points', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-r3-invalid',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: 'LOC台',
            stationType: 'LOC',
            ruleCode: 'loc_building_restriction',
            ruleName: 'loc_building_restriction',
            zoneCode: 'loc_region_3',
            zoneName: 'LOC region 3',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [[[
                [103.95, 30.59],
                [103.96, 30.59],
                [103.96, 30.60],
                [103.95, 30.60],
                [103.95, 30.59],
              ]]],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 492,
              surface: {
                type: 'loc_building_restriction_zone_region_3',
                arcHeightMeters: 562,
                alphaDegrees: 15.04,
                stationPoint: [103.938972, 30.561306],
                apexPoint: [103.95397513931144, 30.593665083709087],
                rootLeftPoint: [103.949136618227, 30.59534448405252],
                rootRightPoint: [103.95881349354343, 30.591985503088146],
                arcRadiusMeters: 9865.303478328966,
                arcPoints: [
                  [103.95117724149101, 30.649664183802024],
                ],
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '4',
        zoneCode: 'loc_region_3',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('drops loc_building_restriction_zone_region_3 when numeric surface fields are not finite', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-r3-invalid-numeric',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: 'LOC台',
            stationType: 'LOC',
            ruleCode: 'loc_building_restriction',
            ruleName: 'loc_building_restriction',
            zoneCode: 'loc_region_3',
            zoneName: 'LOC region 3',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [[[
                [103.95, 30.59],
                [103.96, 30.59],
                [103.96, 30.60],
                [103.95, 30.60],
                [103.95, 30.59],
              ]]],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 492,
              surface: {
                type: 'loc_building_restriction_zone_region_3',
                arcHeightMeters: Number.POSITIVE_INFINITY,
                alphaDegrees: 15.04,
                stationPoint: [103.938972, 30.561306],
                apexPoint: [103.95397513931144, 30.593665083709087],
                rootLeftPoint: [103.949136618227, 30.59534448405252],
                rootRightPoint: [103.95881349354343, 30.591985503088146],
                arcRadiusMeters: 9865.303478328966,
                arcPoints: [
                  [103.95117724149101, 30.649664183802024],
                  [103.95562327488403, 30.64911929778665],
                ],
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '4',
        zoneCode: 'loc_region_3',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('filters deprecated protection zone shapes and warns with region identity', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'legacy-zone',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'legacy',
            ruleName: 'legacy',
            zoneCode: 'legacy-zone',
            zoneName: 'Legacy Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'circle',
              center: { longitude: 104.1, latitude: 30.1 },
              radiusMeters: 50,
            },
            vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
         airportId: '1',
         stationId: '101',
         zoneCode: 'legacy-zone',
         regionCode: 'default',
         reason: 'geometry is not a valid multipolygon',
      }),
    )
  })

  it('drops invalid vertical payloads and warns with region identity', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'invalid-vertical-zone',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 500,
              heightFunction: {
                type: 'elevation_angle',
                distanceMetric: 'radial',
                elevationAngleDegrees: 3,
                startDistanceMeters: 50,
                endDistanceMeters: 37040,
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
         airportId: '1',
         stationId: '101',
         zoneCode: 'ring-zone',
         regionCode: 'default',
         reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('ignores malformed top-level protectionZones entries without throwing and still warns for valid objects with invalid nested geometry', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          null,
          {
            id: 'legacy-zone',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'legacy',
            ruleName: 'legacy',
            zoneCode: 'legacy-zone',
            zoneName: 'Legacy Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'circle',
              center: { longitude: 104.1, latitude: 30.1 },
              radiusMeters: 50,
            },
            vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
         airportId: '1',
         stationId: '101',
         zoneCode: 'legacy-zone',
         regionCode: 'default',
         reason: 'geometry is not a valid multipolygon',
      }),
    )
  })

  it('keeps a multipolygon ring hole structure intact during normalization', async () => {
    const coordinates = [
      [
        [
          [103.94, 30.56],
          [103.95, 30.56],
          [103.95, 30.55],
          [103.94, 30.55],
          [103.94, 30.56],
        ],
        [
          [103.944, 30.557],
          [103.946, 30.557],
          [103.946, 30.553],
          [103.944, 30.553],
          [103.944, 30.557],
        ],
      ],
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'ring-zone',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates,
            },
            vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result[0].geometry.coordinates).toEqual(coordinates)
  })

  it('drops multipolygon geometry when a linear ring is not closed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'open-ring-zone',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                  ],
                ],
              ],
            },
            vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '101',
        zoneCode: 'ring-zone',
        regionCode: 'default',
        reason: 'geometry is not a valid multipolygon',
      }),
    )
  })

  it('drops analytic surfaces when distance source point is not exactly a coordinate pair', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'invalid-point-zone',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 500,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'point',
                  point: [0, 0, 100],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 50,
                  endMeters: 37040,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 3,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '101',
        zoneCode: 'ring-zone',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('normalizes radar_site_protection_mask_angle analytic surfaces for point radial regions', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-radar-mask-angle',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'radar-mask-angle',
            ruleName: 'radar-mask-angle',
            zoneCode: 'radar-mask-angle',
            zoneName: 'Radar Mask Angle Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 525,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'point',
                  point: [103.935511, 30.542172],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 30000,
                },
                heightModel: {
                  type: 'radar_site_protection_mask_angle',
                  angleDegrees: null,
                  distanceOffsetMeters: 0,
                  maskAngleDegrees: 0.25,
                  distanceKilometersCorrectionDivisor: 16970,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0]?.vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 525,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'point',
          point: [103.935511, 30.542172],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 0,
          endMeters: 30000,
        },
        heightModel: {
          type: 'radar_site_protection_mask_angle',
          angleDegrees: null,
          distanceOffsetMeters: 0,
          maskAngleDegrees: 0.25,
          distanceKilometersCorrectionDivisor: 16970,
        },
      },
    })
  })

  it('normalizes radial_cone_surface analytic surfaces with angle_linear_rise', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-radial-cone-angle',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'ndb_radial_cone',
            ruleName: 'ndb_radial_cone',
            zoneCode: 'ndb_radial_cone',
            zoneName: 'NDB radial cone zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 530,
              surface: {
                type: 'radial_cone_surface',
                distanceSource: {
                  kind: 'point',
                  point: [103.991621, 30.587841],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 29999,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 15,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0]?.vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 530,
      surface: {
        type: 'radial_cone_surface',
        distanceSource: {
          kind: 'point',
          point: [103.991621, 30.587841],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 0,
          endMeters: 29999,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 15,
          distanceOffsetMeters: 0,
        },
      },
    })
  })

  it('normalizes radial_cone_surface analytic surfaces with radar_site_protection_mask_angle', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-radial-cone-radar',
            airportId: 1,
            airportName: '双流机场',
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            ruleCode: 'radar-mask-angle-radial-cone',
            ruleName: 'radar-mask-angle-radial-cone',
            zoneCode: 'radar-mask-angle-radial-cone',
            zoneName: 'Radar Mask Angle Radial Cone Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 530,
              surface: {
                type: 'radial_cone_surface',
                distanceSource: {
                  kind: 'point',
                  point: [103.991621, 30.587841],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 29999,
                },
                heightModel: {
                  type: 'radar_site_protection_mask_angle',
                  angleDegrees: null,
                  distanceOffsetMeters: 0,
                  maskAngleDegrees: 0.25,
                  distanceKilometersCorrectionDivisor: 16970,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0]?.vertical).toEqual({
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 530,
      surface: {
        type: 'radial_cone_surface',
        distanceSource: {
          kind: 'point',
          point: [103.991621, 30.587841],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 0,
          endMeters: 29999,
        },
        heightModel: {
          type: 'radar_site_protection_mask_angle',
          angleDegrees: null,
          distanceOffsetMeters: 0,
          maskAngleDegrees: 0.25,
          distanceKilometersCorrectionDivisor: 16970,
        },
      },
    })
  })

  it('drops radial_cone_surface analytic surfaces when geometry contains holes', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-radial-cone-hole',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                  [
                    [103.944, 30.557],
                    [103.946, 30.557],
                    [103.946, 30.553],
                    [103.944, 30.553],
                    [103.944, 30.557],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 530,
              surface: {
                type: 'radial_cone_surface',
                distanceSource: {
                  kind: 'point',
                  point: [103.991621, 30.587841],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 29999,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 15,
                  distanceOffsetMeters: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '101',
        zoneCode: 'ring-zone',
        regionCode: 'default',
      }),
    )
  })

  it('drops radar_site_protection_mask_angle analytic surfaces when distanceKilometersCorrectionDivisor is not greater than zero', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-radar-mask-angle-invalid-divisor',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 525,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'point',
                  point: [103.935511, 30.542172],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 30000,
                },
                heightModel: {
                  type: 'radar_site_protection_mask_angle',
                  angleDegrees: null,
                  distanceOffsetMeters: 0,
                  maskAngleDegrees: 0.25,
                  distanceKilometersCorrectionDivisor: 0,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '101',
        zoneCode: 'ring-zone',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('drops radial_cone_surface analytic surfaces when distanceSource.kind is front_reference_line', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-invalid-radial-cone-front-reference-line',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'ILS',
            ruleCode: 'cone',
            ruleName: 'cone',
            zoneCode: 'cone-zone',
            zoneName: 'Cone Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'gp360_altitude',
              baseHeightMeters: 493.8,
              surface: {
                type: 'radial_cone_surface',
                distanceSource: {
                  kind: 'front_reference_line',
                  stationPoint: [103.942962, 30.594308],
                  centerPoint: [103.952962, 30.594308],
                  leftPoint: [103.952492, 30.594308],
                  rightPoint: [103.953432, 30.594308],
                },
                distanceMetric: 'axial_from_reference_line',
                planarControl: {
                  frontOffsetMeters: 350,
                  halfAngleDegrees: 15,
                  radiusMeters: 18160,
                },
                clampRange: {
                  startMeters: 0,
                  endMeters: 18160,
                },
                heightModel: {
                  type: 'angle_linear_rise',
                  angleDegrees: 1,
                  distanceOffsetMeters: 120,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '101',
        zoneCode: 'cone-zone',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('drops radar_site_protection_mask_angle analytic surfaces when angleDegrees is not null', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'zone-radar-mask-angle-invalid-angle',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'Station A',
            stationType: 'NDB',
            ruleCode: 'ring',
            ruleName: 'ring',
            zoneCode: 'ring-zone',
            zoneName: 'Ring Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.94, 30.56],
                    [103.95, 30.56],
                    [103.95, 30.55],
                    [103.94, 30.55],
                    [103.94, 30.56],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 525,
              surface: {
                type: 'distance_parameterized',
                distanceSource: {
                  kind: 'point',
                  point: [103.935511, 30.542172],
                },
                distanceMetric: 'radial',
                clampRange: {
                  startMeters: 0,
                  endMeters: 30000,
                },
                heightModel: {
                  type: 'radar_site_protection_mask_angle',
                  angleDegrees: 1,
                  distanceOffsetMeters: 0,
                  maskAngleDegrees: 0.25,
                  distanceKilometersCorrectionDivisor: 16970,
                },
              },
            },
          },
        ],
        ruleResults: [],
      }),
    } as unknown as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      '[analysis] Ignored invalid protection zone region.',
      expect.objectContaining({
        airportId: '1',
        stationId: '101',
        zoneCode: 'ring-zone',
        regionCode: 'default',
        reason: 'vertical is not a supported formal model',
      }),
    )
  })

  it('normalizes multipolygon flat protection zones', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 'airport-1-station-7-zone-loc_site_protection-region-default',
            airportId: 1,
            airportName: '双流机场',
            stationId: 7,
            stationName: 'LOC20R',
            stationType: 'LOC',
            ruleCode: 'loc_site_protection',
            ruleName: 'loc_site_protection',
            zoneCode: 'loc_site_protection',
            zoneName: 'LOC site protection zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [
                  [
                    [103.93973520258326, 30.56145249078754],
                    [103.93974185985782, 30.561423542206647],
                    [103.95464580645513, 30.593430648117337],
                    [103.9397275266271, 30.561479625857245],
                    [103.93973520258326, 30.56145249078754],
                  ],
                ],
              ],
            },
            vertical: {
              mode: 'flat',
              baseReference: 'station',
              baseHeightMeters: 492,
            },
            properties: { label: 'LOC20R LOC site protection zone default' },
          },
        ],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toEqual([
      {
        id: 'airport-1-station-7-zone-loc_site_protection-region-default',
        airportId: '1',
        airportName: '双流机场',
        stationId: '7',
        stationName: 'LOC20R',
        stationType: 'LOC',
        ruleCode: 'loc_site_protection',
        ruleName: 'loc_site_protection',
        zoneCode: 'loc_site_protection',
        zoneName: 'LOC site protection zone',
        regionCode: 'default',
        regionName: 'default',
        geometry: {
          shapeType: 'multipolygon',
          coordinates: [
            [
              [
                [103.93973520258326, 30.56145249078754],
                [103.93974185985782, 30.561423542206647],
                [103.95464580645513, 30.593430648117337],
                [103.9397275266271, 30.561479625857245],
                [103.93973520258326, 30.56145249078754],
              ],
            ],
          ],
        },
        vertical: {
          mode: 'flat',
          baseReference: 'station',
          baseHeightMeters: 492,
        },
        properties: { label: 'LOC20R LOC site protection zone default' },
      },
    ])
  })

  it('normalizes protection zone style fill when provided by backend', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 1,
            airportId: 1,
            airportName: '天河机场',
            stationId: 10,
            stationName: '导航台A',
            stationType: 'VOR',
            ruleCode: 'rule-a',
            ruleName: '规则A',
            zoneCode: 'zone-a',
            zoneName: 'A区',
            regionCode: 'region-north',
            regionName: '北侧区域',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [[[114.2, 30.7], [114.21, 30.7], [114.21, 30.69], [114.2, 30.69], [114.2, 30.7]]],
              ],
            },
            vertical: {
              mode: 'flat',
              baseReference: 'station',
              baseHeightMeters: 500,
            },
            style: {
              fill: 'rgba(255, 165, 0, 0.25)',
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/airport/1/protection-zones')
    expect(result[0]?.style).toEqual({
      fill: 'rgba(255, 165, 0, 0.25)',
    })
  })

  it('keeps a protection zone when style fill is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 1,
            airportId: 1,
            airportName: '天河机场',
            stationId: 10,
            stationName: '导航台A',
            stationType: 'VOR',
            ruleCode: 'rule-a',
            ruleName: '规则A',
            zoneCode: 'zone-a',
            zoneName: 'A区',
            regionCode: 'region-north',
            regionName: '北侧区域',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [[[114.2, 30.7], [114.21, 30.7], [114.21, 30.69], [114.2, 30.69], [114.2, 30.7]]],
              ],
            },
            vertical: {
              mode: 'flat',
              baseReference: 'station',
              baseHeightMeters: 500,
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0]?.style).toBeUndefined()
  })

  it('keeps a protection zone when style fill is blank', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        airportId: 1,
        airportName: '双流机场',
        protectionZones: [
          {
            id: 1,
            airportId: 1,
            airportName: '天河机场',
            stationId: 10,
            stationName: '导航台A',
            stationType: 'VOR',
            ruleCode: 'rule-a',
            ruleName: '规则A',
            zoneCode: 'zone-a',
            zoneName: 'A区',
            regionCode: 'region-north',
            regionName: '北侧区域',
            geometry: {
              shapeType: 'multipolygon',
              coordinates: [
                [[[114.2, 30.7], [114.21, 30.7], [114.21, 30.69], [114.2, 30.69], [114.2, 30.7]]],
              ],
            },
            vertical: {
              mode: 'flat',
              baseReference: 'station',
              baseHeightMeters: 500,
            },
            style: {
              fill: '   ',
            },
          },
        ],
        ruleResults: [],
      }),
    } as Response)

    const result = await getAirportProtectionZones('1')

    expect(result).toHaveLength(1)
    expect(result[0]?.style).toBeUndefined()
  })

  describe('getAirportProtectionZones', () => {
    it('fetches and normalizes protection zones for an airport', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          airportId: 1,
          airportName: '双流机场',
          protectionZones: [
            {
              id: 'zone-1',
              airportId: 1,
              airportName: '双流机场',
              stationId: 4,
              stationName: '西南近无方向信标台',
              stationType: 'NDB',
              ruleCode: 'ndb_conical_clearance_3deg',
              ruleName: 'ndb_conical_clearance_3deg',
              zoneCode: 'ndb_conical_clearance_3deg',
              zoneName: 'NDB 3 degree conical clearance zone',
              regionCode: 'default',
              regionName: 'default',
              geometry: {
                shapeType: 'multipolygon',
                coordinates: [
                  [
                    [
                      [103.94, 30.56],
                      [103.95, 30.56],
                      [103.95, 30.55],
                      [103.94, 30.55],
                      [103.94, 30.56],
                    ],
                  ],
                ],
              },
              vertical: {
                mode: 'analytic_surface',
                baseReference: 'station',
                baseHeightMeters: 491.1,
                surface: {
                  type: 'distance_parameterized',
                  distanceSource: {
                    kind: 'point',
                    point: [0, 0],
                  },
                  distanceMetric: 'radial',
                  clampRange: {
                    startMeters: 50,
                    endMeters: 37040,
                  },
                  heightModel: {
                    type: 'angle_linear_rise',
                    angleDegrees: 3,
                    distanceOffsetMeters: 50,
                  },
                },
              },
              properties: { label: 'NDB 3 degree conical clearance zone' },
            },
          ],
        }),
      } as unknown as Response)

      const result = await getAirportProtectionZones('1')

      expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/airport/1/protection-zones')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('zone-1')
      expect(result[0].geometry).toEqual({
        shapeType: 'multipolygon',
        coordinates: [
          [
            [
              [103.94, 30.56],
              [103.95, 30.56],
              [103.95, 30.55],
              [103.94, 30.55],
              [103.94, 30.56],
            ],
          ],
        ],
      })
    })

    it('surfaces backend detail when the response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          detail: 'airport not found',
        }),
      } as unknown as Response)

      await expect(getAirportProtectionZones('999')).rejects.toThrow('airport not found')
    })

    it('falls back to default error message when detail is unreadable', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('invalid json')
        },
      } as unknown as Response)

      await expect(getAirportProtectionZones('1')).rejects.toThrow('获取机场保护区失败：500')
    })

    it('throws shape mismatch error when response is missing protectionZones', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          airportId: 1,
          airportName: '双流机场',
        }),
      } as unknown as Response)

      await expect(getAirportProtectionZones('1')).rejects.toThrow('保护区响应格式无效')
    })

    it('throws shape mismatch error when response is not an object', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => 'unexpected string',
      } as unknown as Response)

      await expect(getAirportProtectionZones('1')).rejects.toThrow('保护区响应格式无效')
    })
  })

})
