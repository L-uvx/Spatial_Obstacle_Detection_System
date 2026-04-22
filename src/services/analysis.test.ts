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
    })
  })

  it('normalizes supported protection zone shapes and ids', async () => {
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
            id: 'airport-1-station-101-zone-flat-region-default',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'flat_rule',
            ruleName: 'flat_rule',
            zoneCode: 'flat_zone',
            zoneName: 'Flat Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'circle',
              center: { longitude: 104.1, latitude: 30.1 },
              radiusMeters: 50,
            },
            vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
            properties: { label: 'Flat Zone' },
          },
          {
            id: 'airport-1-station-101-zone-surface-region-default',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'surface_rule',
            ruleName: 'surface_rule',
            zoneCode: 'surface_zone',
            zoneName: 'Surface Zone',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'sector',
              center: { longitude: 104.1, latitude: 30.1 },
              innerRadiusMeters: 50,
              outerRadiusMeters: 37040,
              startAzimuthDegrees: 0,
              endAzimuthDegrees: 360,
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 500,
              heightFunction: {
                type: 'elevation_angle',
                elevationAngleDegrees: 3,
                distanceMetric: 'radial',
                startDistanceMeters: 50,
                endDistanceMeters: 37040,
              },
            },
            properties: { label: 'Surface Zone' },
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toHaveLength(2)
    expect(result.protectionZones[0]).toEqual({
      id: 'airport-1-station-101-zone-flat-region-default',
      airportId: '1',
      airportName: 'Airport A',
      stationId: '101',
      stationName: 'NDB Station',
      stationType: 'NDB',
      ruleCode: 'flat_rule',
      ruleName: 'flat_rule',
      zoneCode: 'flat_zone',
      zoneName: 'Flat Zone',
      regionCode: 'default',
      regionName: 'default',
      geometry: {
        shapeType: 'circle',
        center: { longitude: 104.1, latitude: 30.1 },
        radiusMeters: 50,
      },
      vertical: { mode: 'flat', baseReference: 'station', baseHeightMeters: 500 },
      properties: { label: 'Flat Zone' },
    })
    expect(result.protectionZones[1].geometry.shapeType).toBe('sector')
    expect(result.protectionZones[1].vertical.mode).toBe('analytic_surface')
    expect(result.protectionZones[1].airportId).toBe('1')
    expect(result.protectionZones[1].stationId).toBe('101')
  })

  it('normalizes radial band analytic surface protection zones', async () => {
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
            id: 'airport-1-station-4-zone-ndb_conical_clearance_3deg-region-default',
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
              shapeType: 'radial_band',
              center: { longitude: 103.935861, latitude: 30.554611 },
              innerRadiusMeters: 50,
              outerRadiusMeters: 37040,
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 491.1,
              heightFunction: {
                type: 'elevation_angle',
                elevationAngleDegrees: 3,
                distanceMetric: 'radial',
                startDistanceMeters: 50,
                endDistanceMeters: 37040,
              },
            },
            properties: { label: '西南近无方向信标台 NDB 3 degree conical clearance zone default' },
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toHaveLength(1)
    expect(result.protectionZones[0]).toEqual({
      id: 'airport-1-station-4-zone-ndb_conical_clearance_3deg-region-default',
      airportId: '1',
      airportName: '双流机场',
      stationId: '4',
      stationName: '西南近无方向信标台',
      stationType: 'NDB',
      ruleCode: 'ndb_conical_clearance_3deg',
      ruleName: 'ndb_conical_clearance_3deg',
      zoneCode: 'ndb_conical_clearance_3deg',
      zoneName: 'NDB 3 degree conical clearance zone',
      regionCode: 'default',
      regionName: 'default',
      geometry: {
        shapeType: 'radial_band',
        center: { longitude: 103.935861, latitude: 30.554611 },
        innerRadiusMeters: 50,
        outerRadiusMeters: 37040,
      },
      vertical: {
        mode: 'analytic_surface',
        baseReference: 'station',
        baseHeightMeters: 491.1,
        heightFunction: {
          type: 'elevation_angle',
          elevationAngleDegrees: 3,
          distanceMetric: 'radial',
          startDistanceMeters: 50,
          endDistanceMeters: 37040,
        },
      },
      properties: { label: '西南近无方向信标台 NDB 3 degree conical clearance zone default' },
    })
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

  it('drops unsupported protection zone combinations instead of crashing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [],
        obstacleCount: 0,
        summary: 'summary',
        protectionZones: [
          {
            id: 'unsupported',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'unsupported',
            ruleName: 'unsupported',
            zoneCode: 'unsupported',
            zoneName: 'unsupported',
            regionCode: 'default',
            regionName: 'default',
            geometry: { shapeType: 'polygon', type: 'Polygon', coordinates: [] },
            vertical: { mode: 'flat' },
            properties: { label: 'unsupported' },
          },
          {
            id: 'unsupported-vertical',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'unsupported-vertical',
            ruleName: 'unsupported-vertical',
            zoneCode: 'unsupported-vertical',
            zoneName: 'unsupported-vertical',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'circle',
              center: { longitude: 104.1, latitude: 30.1 },
              radiusMeters: 50,
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 500,
              heightFunction: {
                type: 'elevation_angle',
                elevationAngleDegrees: 3,
                distanceMetric: 'radial',
                startDistanceMeters: 50,
                endDistanceMeters: 37040,
              },
            },
            properties: { label: 'unsupported vertical' },
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
  })

  it('drops protection zones with non-finite numeric fields instead of normalizing them', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [],
        obstacleCount: 0,
        summary: 'summary',
        protectionZones: [
          {
            id: 'bad-circle',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'bad-circle',
            ruleName: 'bad-circle',
            zoneCode: 'bad-circle',
            zoneName: 'bad-circle',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'circle',
              center: { longitude: Number.NaN, latitude: 30.1 },
              radiusMeters: 50,
            },
            vertical: { mode: 'flat' },
            properties: { label: 'bad-circle' },
          },
          {
            id: 'bad-sector',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'bad-sector',
            ruleName: 'bad-sector',
            zoneCode: 'bad-sector',
            zoneName: 'bad-sector',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'sector',
              center: { longitude: 104.1, latitude: 30.1 },
              innerRadiusMeters: 50,
              outerRadiusMeters: Number.POSITIVE_INFINITY,
              startAzimuthDegrees: 0,
              endAzimuthDegrees: 360,
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 500,
              heightFunction: {
                type: 'elevation_angle',
                elevationAngleDegrees: 3,
                distanceMetric: 'radial',
                startDistanceMeters: 50,
                endDistanceMeters: 37040,
              },
            },
            properties: { label: 'bad-sector' },
          },
          {
            id: 'bad-vertical',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'bad-vertical',
            ruleName: 'bad-vertical',
            zoneCode: 'bad-vertical',
            zoneName: 'bad-vertical',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'sector',
              center: { longitude: 104.1, latitude: 30.1 },
              innerRadiusMeters: 50,
              outerRadiusMeters: 37040,
              startAzimuthDegrees: 0,
              endAzimuthDegrees: 360,
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: Number.NaN,
              heightFunction: {
                type: 'elevation_angle',
                elevationAngleDegrees: 3,
                distanceMetric: 'radial',
                startDistanceMeters: 50,
                endDistanceMeters: 37040,
              },
            },
            properties: { label: 'bad-vertical' },
          },
        ],
      }),
    } as Response)

    const result = await getAnalysisTaskResult('analysis-task-1')

    expect(result.protectionZones).toEqual([])
  })

  it('drops analytic surface protection zones missing heightFunction instead of throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        analysisTaskId: 'analysis-task-1',
        status: 'succeeded',
        importTaskId: 'import-task-1',
        targetIds: [1],
        selectedTargets: [],
        obstacleCount: 0,
        summary: 'summary',
        protectionZones: [
          {
            id: 'missing-height-function',
            airportId: 1,
            airportName: 'Airport A',
            stationId: 101,
            stationName: 'NDB Station',
            stationType: 'NDB',
            ruleCode: 'missing-height-function',
            ruleName: 'missing-height-function',
            zoneCode: 'missing-height-function',
            zoneName: 'missing-height-function',
            regionCode: 'default',
            regionName: 'default',
            geometry: {
              shapeType: 'sector',
              center: { longitude: 104.1, latitude: 30.1 },
              innerRadiusMeters: 50,
              outerRadiusMeters: 37040,
              startAzimuthDegrees: 0,
              endAzimuthDegrees: 360,
            },
            vertical: {
              mode: 'analytic_surface',
              baseReference: 'station',
              baseHeightMeters: 500,
            },
            properties: { label: 'missing-height-function' },
          },
        ],
      }),
    } as Response)

    await expect(getAnalysisTaskResult('analysis-task-1')).resolves.toMatchObject({
      protectionZones: [],
    })
  })
})
