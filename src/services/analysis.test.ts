// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAnalysisTask,
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
    } as Response)

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
    } as Response)

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
    } as Response)

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
    } as Response)

    await expect(createAnalysisTask({
      importTaskId: 'import-batch-1',
      targetIds: ['1', '   '],
    })).rejects.toThrow('分析目标 id 无效')

    expect(fetchMock).not.toHaveBeenCalled()
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
        protectionZones: [],
        ruleResults: [
          {
            stationId: 4,
            stationName: '西南近无方向信标台',
            stationType: 'NDB',
            obstacleId: 67,
            obstacleName: '障碍物2',
            rawObstacleType: '建筑物/构建物',
            globalObstacleCategory: 'building_general',
            ruleName: 'ndb_minimum_distance_50m',
            zoneCode: 'ndb_minimum_distance_50m',
            zoneName: 'NDB 50m minimum distance zone',
            regionCode: 'default',
            regionName: 'default',
            isApplicable: true,
            isCompliant: true,
            message: 'distance meets minimum threshold',
            standards: {
              gb: {
                code: 'GB_NDB_50m最小间距区域_50',
                text: '国标内容',
                isCompliant: true,
              },
              mh: {
                code: 'MH_NDB_50m最小间距区域_50',
                text: '行标内容',
                isCompliant: true,
              },
            },
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(fetchMock).toHaveBeenCalledWith('/polygon-obstacle/analysis/analysis-task-1/result')
    expect(result).toEqual({
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
      protectionZones: [],
      ruleResults: [
        {
          stationId: '4',
          stationName: '西南近无方向信标台',
          stationType: 'NDB',
          obstacleId: '67',
          obstacleName: '障碍物2',
          rawObstacleType: '建筑物/构建物',
          globalObstacleCategory: 'building_general',
          ruleName: 'ndb_minimum_distance_50m',
          zoneCode: 'ndb_minimum_distance_50m',
          zoneName: 'NDB 50m minimum distance zone',
          regionCode: 'default',
          regionName: 'default',
          isApplicable: true,
          isCompliant: true,
          message: 'distance meets minimum threshold',
          standards: {
            gb: {
              code: 'GB_NDB_50m最小间距区域_50',
              text: '国标内容',
              isCompliant: true,
            },
            mh: {
              code: 'MH_NDB_50m最小间距区域_50',
              text: '行标内容',
              isCompliant: true,
            },
          },
        },
      ],
    })
  })

  it('normalizes multipolygon geometry and preserves the formal analytic surface structure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 2,
        summary: 'summary',
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
        ruleResults: [],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toHaveLength(1)
    expect(result.protectionZones[0].geometry).toEqual({
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
    expect(result.protectionZones[0].vertical).toEqual({
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

  it('accepts formal analytic_surface payloads when coordinateSystem is omitted', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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
        ruleResults: [],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toHaveLength(1)
    expect(result.protectionZones[0].vertical).toEqual({
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

  it('normalizes loc_building_restriction_zone_region_3 analytic surfaces', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones[0]?.vertical).toEqual({
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones[0].geometry.coordinates).toEqual(coordinates)
  })

  it('drops multipolygon geometry when a linear ring is not closed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 1,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
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
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [{ id: 1, name: 'Airport Near', category: '机场' }],
        obstacleCount: 2,
        summary: 'summary',
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

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([
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

})
