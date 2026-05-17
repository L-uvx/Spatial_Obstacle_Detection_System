// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAirport,
  getAirportDetail,
  deleteAirport,
  deleteRunway,
  deleteStation,
  getAirportOptions,
  createRunway,
  createStation,
  getAirports,
  getRunwayDetail,
  getRunways,
  getStationDetail,
  getStationTypeOptions,
  getStations,
  importAirports,
  updateAirport,
  updateRunway,
  updateStation,
  getObstacles,
  getObstacleDetail,
  deleteObstacle,
} from './dataManagement'

function stubFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal('fetch', vi.fn(async () => response as Response))
}

describe('dataManagement service', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests airports with page and pageSize query params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 2,
        pageSize: 20,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    await getAirports({
      keyword: '武汉',
      hasCoordinates: true,
      page: 2,
      pageSize: 20,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/data-management/airports?keyword=%E6%AD%A6%E6%B1%89&hasCoordinates=true&page=2&pageSize=20',
    )
  })

  it('requests runways with airportId, keyword, runNumber, page and pageSize query params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 3,
        pageSize: 15,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    await getRunways({
      airportId: 'airport-1',
      keyword: '天河',
      runNumber: '01',
      page: 3,
      pageSize: 15,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/data-management/runways?airportId=airport-1&keyword=%E5%A4%A9%E6%B2%B3&runNumber=01&page=3&pageSize=15',
    )
  })

  it('requests stations with airportId, stationType, keyword, runwayNo, page and pageSize query params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 4,
        pageSize: 12,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    await getStations({
      airportId: 'airport-9',
      stationType: 'ILS',
      keyword: '近台',
      runwayNo: '18L',
      page: 4,
      pageSize: 12,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/data-management/stations?airportId=airport-9&stationType=ILS&keyword=%E8%BF%91%E5%8F%B0&runwayNo=18L&page=4&pageSize=12',
    )
  })

  it('loads airport detail for edit dialogs', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 7,
        name: '天河机场',
        longitude: 114.2,
        latitude: 30.7,
        altitude: 34,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getAirportDetail('7')

    expect(fetchMock).toHaveBeenCalledWith('/data-management/airports/7')
    expect(result).toMatchObject({
      id: '7',
      name: '天河机场',
      longitude: 114.2,
      latitude: 30.7,
      altitude: 34,
    })
  })

  it('loads runway detail for edit dialogs', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 9,
        airportId: 'airport-1',
        name: '东跑道',
        runNumber: '01/19',
        longitude: 114.2,
        latitude: 30.7,
        headingDegrees: 12,
        lengthMeters: 3400,
        maximumTypeAircraft: 'D类和D类以上',
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getRunwayDetail('9')

    expect(fetchMock).toHaveBeenCalledWith('/data-management/runways/9')
    expect(result).toMatchObject({
      id: '9',
      airportId: 'airport-1',
      name: '东跑道',
      runNumber: '01/19',
      longitude: 114.2,
      latitude: 30.7,
      headingDegrees: 12,
      lengthMeters: 3400,
      maximumTypeAircraft: 'D类和D类以上',
    })
  })

  it('loads station detail for edit dialogs', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 11,
        airportId: 'airport-1',
        name: '近台',
        stationType: 'ILS',
        runwayNo: '18L',
        longitude: 114.2,
        latitude: 30.7,
        altitude: 45,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getStationDetail('11')

    expect(fetchMock).toHaveBeenCalledWith('/data-management/stations/11')
    expect(result).toMatchObject({
      id: '11',
      airportId: 'airport-1',
      name: '近台',
      stationType: 'ILS',
      runwayNo: '18L',
      longitude: 114.2,
      latitude: 30.7,
      altitude: 45,
    })
  })

  it('loads airport options and normalizes id-name pairs', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ([
        { id: 1, name: '天河机场' },
        { value: 'airport-2', label: '天府机场' },
      ]),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getAirportOptions()

    expect(fetchMock).toHaveBeenCalledWith('/data-management/options/airports')
    expect(result).toEqual([
      { value: '1', label: '天河机场' },
      { value: 'airport-2', label: '天府机场' },
    ])
  })

  it('loads station type options and normalizes strings and value-label pairs', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ([
        'ILS',
        { value: 'VOR', label: 'VOR' },
      ]),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getStationTypeOptions()

    expect(fetchMock).toHaveBeenCalledWith('/data-management/options/station-types')
    expect(result).toEqual([
      { value: 'ILS', label: 'ILS' },
      { value: 'VOR', label: 'VOR' },
    ])
  })

  it('parses airport delete conflict responses', async () => {
    stubFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({
        detail: {
          code: 'airport_has_children',
          message: 'airport still has related runways or stations',
        },
      }),
    })

    await expect(deleteAirport('1')).rejects.toMatchObject({
      code: 'airport_has_children',
      detailMessage: 'airport still has related runways or stations',
      status: 409,
    })
  })

  it('posts airport create payload and normalizes id with warnings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 101,
        warnings: ['station coordinates were inferred'],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await createAirport({
      name: '武汉天河机场',
      longitude: 114.2081,
      latitude: 30.7748,
      altitude: 34,
    })

    expect(fetchMock).toHaveBeenCalledWith('/data-management/airports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '武汉天河机场',
        longitude: 114.2081,
        latitude: 30.7748,
        altitude: 34,
      }),
    })
    expect(result).toEqual({
      id: '101',
      warnings: ['station coordinates were inferred'],
    })
  })

  it('puts airport update payload and normalizes id with warnings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 202,
        warnings: ['runway heading kept unchanged'],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await updateAirport('202', {
      name: '武汉天河机场-更新',
      longitude: null,
      latitude: null,
      altitude: null,
    })

    expect(fetchMock).toHaveBeenCalledWith('/data-management/airports/202', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '武汉天河机场-更新',
        longitude: null,
        latitude: null,
        altitude: null,
      }),
    })
    expect(result).toEqual({
      id: '202',
      warnings: ['runway heading kept unchanged'],
    })
  })

  it('posts runway create payload and normalizes id with warnings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 301,
        warnings: ['heading was snapped'],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await createRunway({
      airportId: 'airport-1',
      name: '东跑道',
      runNumber: '01/19',
      longitude: 114.2,
      latitude: 30.7,
      headingDegrees: 12,
      lengthMeters: 3400,
      width: null,
      altitude: null,
      enterHeight: null,
      maximumAirworthiness: null,
      stationSubType: '',
      runwayCodeA: '',
      runwayType: '',
      runwayCodeB: '',
      maximumTypeAircraft: null,
    })

    expect(fetchMock).toHaveBeenCalledWith('/data-management/runways', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        airportId: 'airport-1',
        name: '东跑道',
        runNumber: '01/19',
        longitude: 114.2,
        latitude: 30.7,
        headingDegrees: 12,
        lengthMeters: 3400,
        width: null,
        altitude: null,
        enterHeight: null,
        maximumAirworthiness: null,
        stationSubType: '',
        runwayCodeA: '',
        runwayType: '',
        runwayCodeB: '',
        maximumTypeAircraft: null,
      }),
    })
    expect(result).toEqual({
      id: '301',
      warnings: ['heading was snapped'],
    })
  })

  it('puts runway update payload and normalizes id with warnings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 302,
        warnings: ['length kept unchanged'],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await updateRunway('302', {
      airportId: 'airport-1',
      name: '东跑道-更新',
      runNumber: '02/20',
      longitude: null,
      latitude: null,
      headingDegrees: null,
      lengthMeters: null,
      width: null,
      altitude: null,
      enterHeight: null,
      maximumAirworthiness: null,
      stationSubType: '',
      runwayCodeA: '',
      runwayType: '',
      runwayCodeB: '',
      maximumTypeAircraft: null,
    })

    expect(fetchMock).toHaveBeenCalledWith('/data-management/runways/302', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        airportId: 'airport-1',
        name: '东跑道-更新',
        runNumber: '02/20',
        longitude: null,
        latitude: null,
        headingDegrees: null,
        lengthMeters: null,
        width: null,
        altitude: null,
        enterHeight: null,
        maximumAirworthiness: null,
        stationSubType: '',
        runwayCodeA: '',
        runwayType: '',
        runwayCodeB: '',
        maximumTypeAircraft: null,
      }),
    })
    expect(result).toEqual({
      id: '302',
      warnings: ['length kept unchanged'],
    })
  })

  it('parses runway delete conflict responses', async () => {
    stubFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({
        detail: {
          code: 'runway_has_stations',
          message: 'runway still has related stations',
        },
      }),
    })

    await expect(deleteRunway('runway-1')).rejects.toMatchObject({
      code: 'runway_has_stations',
      detailMessage: 'runway still has related stations',
      status: 409,
    })
  })

  it('posts station create payload and normalizes id with warnings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 401,
        warnings: ['altitude was inferred'],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await createStation({
      airportId: 'airport-1',
      name: '近台',
      stationType: 'ILS',
      stationGroup: null,
      frequency: null,
      runwayNo: '18L',
      longitude: 114.21,
      latitude: 30.77,
      altitude: 48,
      coverageRadius: null,
      flyHeight: null,
      antennaHag: null,
      reflectionNetHag: null,
      centerAntennaH: null,
      bAntennaH: null,
      bToCenterDistance: null,
      reflectionDiameter: null,
      downwardAngle: null,
      antennaTag: null,
      distanceToRunway: null,
      distanceVToRunway: null,
      distanceEndoRunway: null,
      unitNumber: null,
      aircraft: '',
      antennaHeight: null,
      stationSubType: null,
      combineId: null,
    })

    expect(fetchMock).toHaveBeenCalledWith('/data-management/stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        airportId: 'airport-1',
        name: '近台',
        stationType: 'ILS',
        stationGroup: null,
        frequency: null,
        runwayNo: '18L',
        longitude: 114.21,
        latitude: 30.77,
        altitude: 48,
        coverageRadius: null,
        flyHeight: null,
        antennaHag: null,
        reflectionNetHag: null,
        centerAntennaH: null,
        bAntennaH: null,
        bToCenterDistance: null,
        reflectionDiameter: null,
        downwardAngle: null,
        antennaTag: null,
        distanceToRunway: null,
        distanceVToRunway: null,
        distanceEndoRunway: null,
        unitNumber: null,
        aircraft: '',
        antennaHeight: null,
        stationSubType: null,
        combineId: null,
      }),
    })
    expect(result).toEqual({
      id: '401',
      warnings: ['altitude was inferred'],
    })
  })

  it('puts station update payload and normalizes id with warnings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 402,
        warnings: ['runwayNo kept unchanged'],
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await updateStation('402', {
      airportId: 'airport-1',
      name: '近台-更新',
      stationType: 'VOR',
      stationGroup: null,
      frequency: null,
      runwayNo: '',
      longitude: null,
      latitude: null,
      altitude: null,
      coverageRadius: null,
      flyHeight: null,
      antennaHag: null,
      reflectionNetHag: null,
      centerAntennaH: null,
      bAntennaH: null,
      bToCenterDistance: null,
      reflectionDiameter: null,
      downwardAngle: null,
      antennaTag: null,
      distanceToRunway: null,
      distanceVToRunway: null,
      distanceEndoRunway: null,
      unitNumber: null,
      aircraft: '',
      antennaHeight: null,
      stationSubType: null,
      combineId: null,
    })

    expect(fetchMock).toHaveBeenCalledWith('/data-management/stations/402', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        airportId: 'airport-1',
        name: '近台-更新',
        stationType: 'VOR',
        stationGroup: null,
        frequency: null,
        runwayNo: '',
        longitude: null,
        latitude: null,
        altitude: null,
        coverageRadius: null,
        flyHeight: null,
        antennaHag: null,
        reflectionNetHag: null,
        centerAntennaH: null,
        bAntennaH: null,
        bToCenterDistance: null,
        reflectionDiameter: null,
        downwardAngle: null,
        antennaTag: null,
        distanceToRunway: null,
        distanceVToRunway: null,
        distanceEndoRunway: null,
        unitNumber: null,
        aircraft: '',
        antennaHeight: null,
        stationSubType: null,
        combineId: null,
      }),
    })
    expect(result).toEqual({
      id: '402',
      warnings: ['runwayNo kept unchanged'],
    })
  })

  it('parses station delete conflict responses', async () => {
    stubFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({
        detail: {
          code: 'station_in_use',
          message: 'station still has related analysis data',
        },
      }),
    })

    await expect(deleteStation('station-1')).rejects.toMatchObject({
      code: 'station_in_use',
      detailMessage: 'station still has related analysis data',
      status: 409,
    })
  })

  it('normalizes runway list items with all extended fields from backend response', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{
          id: 50,
          airportId: 'airport-1',
          airportName: '天河机场',
          name: '西跑道',
          runNumber: '18R/36L',
          longitude: 113.9,
          latitude: 30.5,
          headingDegrees: 178,
          lengthMeters: 3600,
          width: 45,
          altitude: 32,
          enterHeight: 15,
          maximumAirworthiness: 800,
          stationSubType: 'ILS',
          runwayCodeA: 'RC-A',
          runwayType: 'precision',
          runwayCodeB: 'RC-B',
          maximumTypeAircraft: 'D类和D类以上',
          createdAt: '2025-01-01T08:00:00Z',
          updatedAt: '2025-06-01T12:00:00Z',
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getRunways({
      airportId: 'airport-1',
      keyword: '',
      runNumber: '',
      page: 1,
      pageSize: 20,
    })

    expect(result.items[0]).toMatchObject({
      id: '50',
      width: 45,
      altitude: 32,
      enterHeight: 15,
      maximumAirworthiness: 800,
      stationSubType: 'ILS',
      runwayCodeA: 'RC-A',
      runwayType: 'precision',
      runwayCodeB: 'RC-B',
      maximumTypeAircraft: 'D类和D类以上',
    })
  })

  it('normalizes station list items with all extended fields from backend response', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{
          id: 60,
          airportId: 'airport-1',
          airportName: '天河机场',
          name: '远台',
          stationType: 'VOR',
          stationGroup: 'Group-A',
          frequency: 112.5,
          runwayNo: '18L',
          longitude: 113.92,
          latitude: 30.52,
          altitude: 40,
          coverageRadius: 200,
          flyHeight: 6000,
          antennaHag: 10,
          reflectionNetHag: 5,
          centerAntennaH: 35,
          bAntennaH: 28,
          bToCenterDistance: 50,
          reflectionDiameter: 12,
          downwardAngle: 3.5,
          antennaTag: 'TAG-1',
          distanceToRunway: 3000,
          distanceVToRunway: 150,
          distanceEndoRunway: 200,
          unitNumber: 2,
          aircraft: 'B737',
          antennaHeight: 15,
          stationSubType: 'NDB',
          combineId: 100,
          createdAt: '2025-01-01T08:00:00Z',
          updatedAt: '2025-06-01T12:00:00Z',
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getStations({
      airportId: 'airport-1',
      stationType: '',
      keyword: '',
      runwayNo: '',
      page: 1,
      pageSize: 20,
    })

    expect(result.items[0]).toMatchObject({
      id: '60',
      stationGroup: 'Group-A',
      frequency: 112.5,
      coverageRadius: 200,
      flyHeight: 6000,
      antennaHag: 10,
      reflectionNetHag: 5,
      centerAntennaH: 35,
      bAntennaH: 28,
      bToCenterDistance: 50,
      reflectionDiameter: 12,
      downwardAngle: 3.5,
      antennaTag: 'TAG-1',
      distanceToRunway: 3000,
      distanceVToRunway: 150,
      distanceEndoRunway: 200,
      unitNumber: 2,
      aircraft: 'B737',
      antennaHeight: 15,
      stationSubType: 'NDB',
      combineId: 100,
    })
  })

  it('sends excelFiles to the import airports endpoint', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        totalFiles: 1,
        importedCount: 1,
        skippedCount: 0,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['test'], 'test.xlsx')
    const result = await importAirports([file])

    expect(fetchMock).toHaveBeenCalledWith('/data-management/import/airports', {
      method: 'POST',
      body: expect.any(FormData),
    })

    const callArgs = fetchMock.mock.calls[0] as unknown as [string, { body: FormData }]
    const formData = callArgs[1].body
    expect(formData.get('excelFiles')).toBeDefined()

    expect(result).toEqual({
      items: [],
      totalFiles: 1,
      importedCount: 1,
      skippedCount: 0,
    })
  })

  it('handles import with empty files array', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        totalFiles: 0,
        importedCount: 0,
        skippedCount: 0,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await importAirports([])

    expect(fetchMock).toHaveBeenCalledWith('/data-management/import/airports', {
      method: 'POST',
      body: expect.any(FormData),
    })

    expect(result).toEqual({
      items: [],
      totalFiles: 0,
      importedCount: 0,
      skippedCount: 0,
    })
  })

  it('handles import error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          detail: {
            code: 'import_failed',
            message: '文件格式错误',
          },
        }),
      })),
    )

    const file = new File(['bad data'], 'invalid.txt')
    await expect(importAirports([file])).rejects.toMatchObject({
      code: 'import_failed',
      detailMessage: '文件格式错误',
      status: 400,
    })
  })

  it('requests obstacles with page and pageSize query params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 2,
        pageSize: 20,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    await getObstacles({
      projectId: '',
      keyword: '',
      obstacleType: '',
      page: 2,
      pageSize: 20,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/data-management/obstacles?page=2&pageSize=20',
    )
  })

  it('requests obstacles with filters projectId, keyword, obstacleType', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    await getObstacles({
      projectId: 'proj-1',
      keyword: '障碍物A',
      obstacleType: 'building',
      page: 1,
      pageSize: 10,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/data-management/obstacles?projectId=proj-1&keyword=%E9%9A%9C%E7%A2%8D%E7%89%A9A&obstacleType=building&page=1&pageSize=10',
    )
  })

  it('normalizes obstacle list items with all fields from backend response', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{
          id: 'obs-1',
          projectId: 'proj-1',
          projectName: '武汉项目',
          name: '障碍物A',
          obstacleType: 'building',
          topElevation: 120.5,
          sourceBatchId: 'batch-001',
          sourceRowNo: 5,
          geometry: {
            type: 'Point',
            coordinates: [114.2, 30.7],
          },
          createdAt: '2025-01-01T08:00:00Z',
          updatedAt: '2025-06-01T12:00:00Z',
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getObstacles({
      projectId: '',
      keyword: '',
      obstacleType: '',
      page: 1,
      pageSize: 20,
    })

    expect(result.items[0]).toMatchObject({
      id: 'obs-1',
      projectId: 'proj-1',
      projectName: '武汉项目',
      name: '障碍物A',
      obstacleType: 'building',
      topElevation: 120.5,
      sourceBatchId: 'batch-001',
      sourceRowNo: 5,
      geometry: {
        type: 'Point',
        coordinates: [114.2, 30.7],
      },
      createdAt: '2025-01-01T08:00:00Z',
      updatedAt: '2025-06-01T12:00:00Z',
    })
  })

  it('normalizes obstacle list item with missing optional fields', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{
          id: 'obs-2',
          projectId: 'proj-2',
          name: '障碍物B',
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getObstacles({
      projectId: '',
      keyword: '',
      obstacleType: '',
      page: 1,
      pageSize: 20,
    })

    expect(result.items[0]).toMatchObject({
      id: 'obs-2',
      projectId: 'proj-2',
      projectName: '',
      name: '障碍物B',
      obstacleType: '',
      topElevation: null,
      sourceBatchId: '',
      sourceRowNo: 0,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    })
  })

  it('loads obstacle detail', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'obs-3',
        projectId: 'proj-3',
        name: '障碍物C',
        obstacleType: 'antenna',
        topElevation: 200,
        sourceBatchId: 'batch-002',
        sourceRowNo: 10,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[114.0, 30.0], [114.1, 30.0], [114.1, 30.1], [114.0, 30.1], [114.0, 30.0]]]],
        },
      }),
    }))

    vi.stubGlobal('fetch', fetchMock)

    const result = await getObstacleDetail('obs-3')

    expect(fetchMock).toHaveBeenCalledWith('/data-management/obstacles/obs-3')
    expect(result).toMatchObject({
      id: 'obs-3',
      projectId: 'proj-3',
      name: '障碍物C',
      obstacleType: 'antenna',
      topElevation: 200,
      sourceBatchId: 'batch-002',
      sourceRowNo: 10,
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[114.0, 30.0], [114.1, 30.0], [114.1, 30.1], [114.0, 30.1], [114.0, 30.0]]]],
      },
      projectName: '',
      createdAt: '',
      updatedAt: '',
    })
  })

  it('deletes obstacle successfully', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
    }))

    vi.stubGlobal('fetch', fetchMock)

    await deleteObstacle('obs-5')

    expect(fetchMock).toHaveBeenCalledWith('/data-management/obstacles/obs-5', {
      method: 'DELETE',
    })
  })

  it('parses obstacle delete not found response', async () => {
    stubFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({
        detail: {
          code: 'obstacle_not_found',
          message: '障碍物不存在',
        },
      }),
    })

    await expect(deleteObstacle('obs-999')).rejects.toMatchObject({
      code: 'obstacle_not_found',
      detailMessage: '障碍物不存在',
      status: 404,
    })
  })
})
