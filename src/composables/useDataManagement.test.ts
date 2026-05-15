import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDataManagement } from './useDataManagement'
import {
  createAirport,
  createRunway,
  createStation,
  deleteAirport,
  deleteObstacle,
  deleteRunway,
  deleteStation,
  getAirports,
  getAirportDetail,
  getAirportOptions,
  getObstacleDetail,
  getObstacles,
  getRunwayDetail,
  getRunways,
  getStationDetail,
  getStationTypeOptions,
  getStations,
  updateAirport,
  updateRunway,
  updateStation,
} from '../services/dataManagement'
import type { ObstacleListItem } from '../types/dataManagement'

vi.mock('../services/dataManagement', () => ({
  getAirports: vi.fn(async () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  })),
  createAirport: vi.fn(async () => ({
    id: 'created-airport',
    warnings: [],
  })),
  createRunway: vi.fn(async () => ({
    id: 'created-runway',
    warnings: [],
  })),
  createStation: vi.fn(async () => ({
    id: 'created-station',
    warnings: [],
  })),
  getAirportDetail: vi.fn(async () => ({
    id: 'airport-1',
    name: '天河机场',
    longitude: 114.2,
    latitude: 30.7,
    altitude: 34,
  })),
  getRunwayDetail: vi.fn(async () => ({
    id: 'runway-1',
    airportId: 'airport-1',
    name: '东跑道',
    runNumber: '01/19',
    longitude: 114.2,
    latitude: 30.7,
    headingDegrees: 12,
    lengthMeters: 3400,
  })),
  getStationDetail: vi.fn(async () => ({
    id: 'station-1',
    airportId: 'airport-1',
    name: '近台',
    stationType: 'ILS',
    runwayNo: '18L',
    longitude: 114.2,
    latitude: 30.7,
    altitude: 45,
  })),
  getRunways: vi.fn(async () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  })),
  getStations: vi.fn(async () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  })),
  getAirportOptions: vi.fn(async () => []),
  getStationTypeOptions: vi.fn(async () => []),
  updateAirport: vi.fn(async () => ({
    id: 'updated-airport',
    warnings: [],
  })),
  updateRunway: vi.fn(async () => ({
    id: 'updated-runway',
    warnings: [],
  })),
  updateStation: vi.fn(async () => ({
    id: 'updated-station',
    warnings: [],
  })),
  deleteAirport: vi.fn(async () => undefined),
  deleteRunway: vi.fn(async () => undefined),
  deleteStation: vi.fn(async () => undefined),
  getObstacles: vi.fn(async () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  })),
  deleteObstacle: vi.fn(async () => undefined),
  getObstacleDetail: vi.fn(async () => ({
    id: 'obstacle-1',
    projectId: 'project-1',
    projectName: '项目1',
    name: '障碍物1',
    obstacleType: 'building',
    topElevation: null,
    sourceBatchId: 'batch-1',
    sourceRowNo: 1,
    geometry: null,
    createdAt: '',
    updatedAt: '',
  })),
}))

describe('useDataManagement', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(() => {
    vi.mocked(getAirports).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })
    vi.mocked(createAirport).mockResolvedValue({
      id: 'created-airport',
      warnings: [],
    })
    vi.mocked(getRunways).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })
    vi.mocked(createRunway).mockResolvedValue({
      id: 'created-runway',
      warnings: [],
    })
    vi.mocked(getStations).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })
    vi.mocked(getAirportOptions).mockResolvedValue([
      { value: 'airport-1', label: '天河机场' },
    ])
    vi.mocked(getStationTypeOptions).mockResolvedValue([
      { value: 'ILS', label: 'ILS' },
    ])
    vi.mocked(createStation).mockResolvedValue({
      id: 'created-station',
      warnings: [],
    })
    vi.mocked(updateAirport).mockResolvedValue({
      id: 'updated-airport',
      warnings: [],
    })
    vi.mocked(deleteAirport).mockResolvedValue(undefined)
    vi.mocked(updateRunway).mockResolvedValue({
      id: 'updated-runway',
      warnings: [],
    })
    vi.mocked(deleteRunway).mockResolvedValue(undefined)
    vi.mocked(updateStation).mockResolvedValue({
      id: 'updated-station',
      warnings: [],
    })
    vi.mocked(deleteStation).mockResolvedValue(undefined)
    vi.mocked(getObstacles).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })
    vi.mocked(deleteObstacle).mockResolvedValue(undefined)
    vi.mocked(getObstacleDetail).mockResolvedValue({
      id: 'obstacle-1',
      projectId: 'project-1',
      projectName: '项目1',
      name: '障碍物1',
      obstacleType: 'building',
      topElevation: null,
      sourceBatchId: 'batch-1',
      sourceRowNo: 1,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    })
  })

  it('resets airport page to 1 when keyword filter changes', async () => {
    const { state, setAirportKeyword } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.airports.page = 3

    await setAirportKeyword('武汉')

    expect(state.airports.page).toBe(1)
    expect(state.airports.filters.keyword).toBe('武汉')
  })

  it('opens and closes the modal independently from workflow state', () => {
    const { state, openDataManagement, closeDataManagement } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openDataManagement()
    expect(state.isOpen).toBe(true)

    closeDataManagement()
    expect(state.isOpen).toBe(false)
  })

  it('loads airport and station-type options when opening data management', async () => {
    const { openDataManagement, state } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await openDataManagement()

    expect(getAirportOptions).toHaveBeenCalledTimes(1)
    expect(getStationTypeOptions).toHaveBeenCalledTimes(1)
    expect(state.airportOptions).toEqual([{ value: 'airport-1', label: '天河机场' }])
    expect(state.stationTypeOptions).toEqual([{ value: 'ILS', label: 'ILS' }])
  })

  it('resets airport page to 1 when hasCoordinates filter changes', async () => {
    const { state, setAirportHasCoordinates } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.airports.page = 4

    await setAirportHasCoordinates(true)

    expect(state.airports.page).toBe(1)
    expect(state.airports.filters.hasCoordinates).toBe(true)
  })

  it('reloads airport list with requested page when airport page changes', async () => {
    const { changeAirportPage } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await changeAirportPage(3)

    expect(getAirports).toHaveBeenCalledWith({
      keyword: '',
      hasCoordinates: false,
      page: 3,
      pageSize: 10,
    })
  })

  it('resets airport page to 1 and reloads when airport page size changes', async () => {
    const { state, changeAirportPageSize } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.airports.page = 4

    await changeAirportPageSize(50)

    expect(state.airports.page).toBe(1)
    expect(getAirports).toHaveBeenCalledWith({
      keyword: '',
      hasCoordinates: false,
      page: 1,
      pageSize: 50,
    })
  })

  it('resets runway page to 1 and reloads when runway keyword filter changes', async () => {
    const { state, setRunwayKeyword } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.runways.page = 5

    await setRunwayKeyword('主跑道')

    expect(state.runways.page).toBe(1)
    expect(state.runways.filters.keyword).toBe('主跑道')
    expect(getRunways).toHaveBeenCalledWith({
      airportId: '',
      keyword: '主跑道',
      runNumber: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('loads runway list when switching to runway tab while modal is open', async () => {
    const { openDataManagement, setActiveTab } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openDataManagement()
    vi.mocked(getAirports).mockClear()
    vi.mocked(getRunways).mockClear()

    setActiveTab('runways')

    await Promise.resolve()

    expect(getRunways).toHaveBeenCalledWith({
      airportId: '',
      keyword: '',
      runNumber: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('reloads runway list with requested page when runway page changes', async () => {
    const { changeRunwayPage } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await changeRunwayPage(2)

    expect(getRunways).toHaveBeenCalledWith({
      airportId: '',
      keyword: '',
      runNumber: '',
      page: 2,
      pageSize: 10,
    })
  })

  it('resets runway page to 1 and reloads when runway page size changes', async () => {
    const { state, changeRunwayPageSize } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.runways.page = 5

    await changeRunwayPageSize(10)

    expect(state.runways.page).toBe(1)
    expect(getRunways).toHaveBeenCalledWith({
      airportId: '',
      keyword: '',
      runNumber: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('resets station page to 1 and reloads when station keyword filter changes', async () => {
    const { state, setStationKeyword } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.stations.page = 6

    await setStationKeyword('进近')

    expect(state.stations.page).toBe(1)
    expect(state.stations.filters.keyword).toBe('进近')
    expect(getStations).toHaveBeenCalledWith({
      airportId: '',
      stationType: '',
      keyword: '进近',
      runwayNo: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('loads station list when switching to station tab while modal is open', async () => {
    const { openDataManagement, setActiveTab } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openDataManagement()
    vi.mocked(getAirports).mockClear()
    vi.mocked(getRunways).mockClear()
    vi.mocked(getStations).mockClear()

    setActiveTab('stations')

    await Promise.resolve()

    expect(getStations).toHaveBeenCalledWith({
      airportId: '',
      stationType: '',
      keyword: '',
      runwayNo: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('loads airport detail before opening airport edit dialog', async () => {
    const { state, openAirportEditDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await openAirportEditDialog('airport-1')

    expect(getAirportDetail).toHaveBeenCalledWith('airport-1')
    expect(state.airports.formOpen).toBe(true)
    expect(state.airports.draft).toMatchObject({
      id: 'airport-1',
      name: '天河机场',
    })
  })

  it('loads runway detail before opening runway edit dialog', async () => {
    const { state, openRunwayEditDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await openRunwayEditDialog('runway-1')

    expect(getRunwayDetail).toHaveBeenCalledWith('runway-1')
    expect(state.runways.formOpen).toBe(true)
    expect(state.runways.draft).toMatchObject({
      id: 'runway-1',
      name: '东跑道',
    })
  })

  it('loads station detail before opening station edit dialog', async () => {
    const { state, openStationEditDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await openStationEditDialog('station-1')

    expect(getStationDetail).toHaveBeenCalledWith('station-1')
    expect(state.stations.formOpen).toBe(true)
    expect(state.stations.draft).toMatchObject({
      id: 'station-1',
      name: '近台',
    })
  })

  it('keeps form closed and clears stale airport draft when airport detail load fails', async () => {
    vi.mocked(getAirportDetail).mockRejectedValueOnce(new Error('机场详情加载失败'))

    const { state, openAirportEditDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.airports.draft = {
      id: 'old-airport',
      name: '旧机场',
      longitude: 1,
      latitude: 2,
      altitude: 3,
    }

    await openAirportEditDialog('airport-404')

    expect(state.airports.formOpen).toBe(false)
    expect(state.airports.draft).toEqual({
      name: '',
      longitude: null,
      latitude: null,
      altitude: null,
    })
    expect(state.airports.errorMessage).toBe('机场详情加载失败')
  })

  it('ignores stale runway detail response when a newer edit request finishes later', async () => {
    type RunwayDetail = {
      id: string
      airportId: string
      airportName: string
      name: string
      runNumber: string
      longitude: number | null
      latitude: number | null
      headingDegrees: number | null
      lengthMeters: number | null
      width: number | null
      altitude: number | null
      enterHeight: number | null
      maximumAirworthiness: number | null
      stationSubType: string
      runwayCodeA: string
      runwayType: string
      runwayCodeB: string
      createdAt: string
      updatedAt: string
    }

    let resolveFirst: ((value: RunwayDetail) => void) | null = null
    let resolveSecond: ((value: RunwayDetail) => void) | null = null

    vi.mocked(getRunwayDetail)
      .mockImplementationOnce(() => new Promise<RunwayDetail>((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise<RunwayDetail>((resolve) => { resolveSecond = resolve }))

    const { state, openRunwayEditDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    const firstRequest = openRunwayEditDialog('runway-old')
    const secondRequest = openRunwayEditDialog('runway-new')

    if (!resolveSecond) {
      throw new Error('Second runway detail resolver was not captured')
    }

    const secondResolver: (value: RunwayDetail) => void = resolveSecond

    secondResolver({
      id: 'runway-new',
      airportId: 'airport-1',
      airportName: '天河机场',
      name: '新跑道',
      runNumber: '02/20',
      longitude: 114.3,
      latitude: 30.8,
      headingDegrees: 20,
      lengthMeters: 3600,
      width: null,
      altitude: null,
      enterHeight: null,
      maximumAirworthiness: null,
      stationSubType: '',
      runwayCodeA: '',
      runwayType: '',
      runwayCodeB: '',
      createdAt: '',
      updatedAt: '',
    })
    await secondRequest

    if (!resolveFirst) {
      throw new Error('First runway detail resolver was not captured')
    }

    const firstResolver: (value: RunwayDetail) => void = resolveFirst

    firstResolver({
      id: 'runway-old',
      airportId: 'airport-1',
      airportName: '天河机场',
      name: '旧跑道',
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
      createdAt: '',
      updatedAt: '',
    })
    await firstRequest

    expect(state.runways.draft).toMatchObject({
      id: 'runway-new',
      name: '新跑道',
    })
  })

  it('reloads station list with requested page when station page changes', async () => {
    const { changeStationPage } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await changeStationPage(4)

    expect(getStations).toHaveBeenCalledWith({
      airportId: '',
      stationType: '',
      keyword: '',
      runwayNo: '',
      page: 4,
      pageSize: 10,
    })
  })

  it('creates airport, reloads list, closes form, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, saveAirportDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    state.airports.formOpen = true
    state.airports.draft = {
      name: '武汉天河机场',
      longitude: 114.2081,
      latitude: 30.7748,
      altitude: 34,
    }

    await saveAirportDraft(state.airports.draft)

    expect(createAirport).toHaveBeenCalledWith({
      name: '武汉天河机场',
      longitude: 114.2081,
      latitude: 30.7748,
      altitude: 34,
    })
    expect(state.airports.formOpen).toBe(false)
    expect(getAirports).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('updates airport, reloads list, closes form, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, saveAirportDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    state.airports.formOpen = true
    state.airports.draft = {
      id: 'airport-2',
      name: '武汉天河机场-更新',
      longitude: null,
      latitude: null,
      altitude: null,
    }

    await saveAirportDraft(state.airports.draft)

    expect(updateAirport).toHaveBeenCalledWith('airport-2', {
      name: '武汉天河机场-更新',
      longitude: null,
      latitude: null,
      altitude: null,
    })
    expect(state.airports.formOpen).toBe(false)
    expect(getAirports).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('persists airport save warnings after successful save', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    vi.mocked(createAirport).mockResolvedValue({
      id: 'created-airport',
      warnings: ['机场坐标已按现有规则自动补齐'],
    })

    const { state, openAirportCreateDialog, saveAirportDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    openAirportCreateDialog()

    await saveAirportDraft({
      name: '武汉天河机场',
      longitude: 114.2081,
      latitude: 30.7748,
      altitude: 34,
    })

    expect(state.airports.formOpen).toBe(false)
    expect(state.airports.warnings).toEqual(['机场坐标已按现有规则自动补齐'])
  })

  it('deletes airport, reloads list, clears target, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openAirportDeleteConfirm, confirmAirportDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openAirportDeleteConfirm({
      id: 'airport-3',
      name: '待删除机场',
      longitude: null,
      latitude: null,
      altitude: null,
      runwayCount: 0,
      stationCount: 0,
      createdAt: '',
      updatedAt: '',
    })

    await confirmAirportDelete()

    expect(deleteAirport).toHaveBeenCalledWith('airport-3')
    expect(state.airports.deleteTarget).toBeNull()
    expect(getAirports).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('keeps delete dialog open and surfaces backend message on delete conflict', async () => {
    vi.mocked(deleteAirport).mockRejectedValue(Object.assign(new Error('机场下仍有关联数据'), {
      status: 409,
      code: 'airport_has_children',
      detailMessage: '机场下仍有关联数据',
    }))

    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openAirportDeleteConfirm, confirmAirportDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openAirportDeleteConfirm({
      id: 'airport-4',
      name: '冲突机场',
      longitude: null,
      latitude: null,
      altitude: null,
      runwayCount: 1,
      stationCount: 1,
      createdAt: '',
      updatedAt: '',
    })

    await confirmAirportDelete()

    expect(state.airports.deleteTarget?.id).toBe('airport-4')
    expect(state.airports.errorMessage).toBe('机场下仍有关联数据')
    expect(onRefreshBootstrap).not.toHaveBeenCalled()
  })

  it('creates runway, reloads list, closes form, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, saveRunwayDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    state.runways.formOpen = true
    state.runways.draft = {
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
    }

    await saveRunwayDraft(state.runways.draft)

    expect(createRunway).toHaveBeenCalledWith({
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
    })
    expect(state.runways.formOpen).toBe(false)
    expect(getRunways).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('persists runway save warnings after successful save', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    vi.mocked(createRunway).mockResolvedValue({
      id: 'created-runway',
      warnings: ['跑道航向角已沿用现有值'],
    })

    const { state, openRunwayCreateDialog, saveRunwayDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    openRunwayCreateDialog()

    await saveRunwayDraft({
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
    })

    expect(state.runways.formOpen).toBe(false)
    expect(state.runways.warnings).toEqual(['跑道航向角已沿用现有值'])
  })

  it('deletes runway, reloads list, clears target, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openRunwayDeleteConfirm, confirmRunwayDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openRunwayDeleteConfirm({
      id: 'runway-3',
      airportId: 'airport-1',
      airportName: '天河机场',
      name: '待删除跑道',
      runNumber: '01/19',
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
      createdAt: '',
      updatedAt: '',
    })

    await confirmRunwayDelete()

    expect(deleteRunway).toHaveBeenCalledWith('runway-3')
    expect(state.runways.deleteTarget).toBeNull()
    expect(getRunways).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('keeps runway delete dialog open and surfaces backend message on delete conflict', async () => {
    vi.mocked(deleteRunway).mockRejectedValue(Object.assign(new Error('跑道下仍有关联台站'), {
      status: 409,
      code: 'runway_has_stations',
      detailMessage: '跑道下仍有关联台站',
    }))

    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openRunwayDeleteConfirm, confirmRunwayDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openRunwayDeleteConfirm({
      id: 'runway-4',
      airportId: 'airport-1',
      airportName: '天河机场',
      name: '冲突跑道',
      runNumber: '18L/36R',
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
      createdAt: '',
      updatedAt: '',
    })

    await confirmRunwayDelete()

    expect(state.runways.deleteTarget?.id).toBe('runway-4')
    expect(state.runways.errorMessage).toBe('跑道下仍有关联台站')
    expect(onRefreshBootstrap).not.toHaveBeenCalled()
  })

  it('creates station, reloads list, closes form, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, saveStationDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    state.stations.formOpen = true
    state.stations.draft = {
      airportId: 'airport-1',
      name: '近台',
      stationType: 'ILS',
      stationGroup: null,
      frequency: null,
      runwayNo: '18L',
      longitude: 114.2,
      latitude: 30.7,
      altitude: 45,
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
    }

    await saveStationDraft(state.stations.draft)

    expect(createStation).toHaveBeenCalledWith({
      airportId: 'airport-1',
      name: '近台',
      stationType: 'ILS',
      stationGroup: null,
      frequency: null,
      runwayNo: '18L',
      longitude: 114.2,
      latitude: 30.7,
      altitude: 45,
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
    expect(state.stations.formOpen).toBe(false)
    expect(getStations).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('persists station save warnings after successful save', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    vi.mocked(createStation).mockResolvedValue({
      id: 'created-station',
      warnings: ['台站跑道号已按所属机场默认值补齐'],
    })

    const { state, openStationCreateDialog, saveStationDraft } = useDataManagement({
      onRefreshBootstrap,
    })

    openStationCreateDialog()

    await saveStationDraft({
      airportId: 'airport-1',
      name: '近台',
      stationType: 'ILS',
      stationGroup: null,
      frequency: null,
      runwayNo: '18L',
      longitude: 114.2,
      latitude: 30.7,
      altitude: 45,
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

    expect(state.stations.formOpen).toBe(false)
    expect(state.stations.warnings).toEqual(['台站跑道号已按所属机场默认值补齐'])
  })

  it('deletes station, reloads list, clears target, and refreshes bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openStationDeleteConfirm, confirmStationDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openStationDeleteConfirm({
      id: 'station-3',
      airportId: 'airport-1',
      airportName: '天河机场',
      name: '待删除台站',
      stationType: 'ILS',
      stationGroup: null,
      frequency: null,
      runwayNo: '18L',
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
      createdAt: '',
      updatedAt: '',
    })

    await confirmStationDelete()

    expect(deleteStation).toHaveBeenCalledWith('station-3')
    expect(state.stations.deleteTarget).toBeNull()
    expect(getStations).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).toHaveBeenCalledTimes(1)
  })

  it('initializes runway draft with all extended fields and correct defaults', () => {
    const { state, openRunwayCreateDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openRunwayCreateDialog()

    expect(state.runways.draft).toMatchObject({
      airportId: '',
      name: '',
      runNumber: '',
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
    })
  })

  it('initializes station draft with all extended fields and correct defaults', () => {
    const { state, openStationCreateDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openStationCreateDialog()

    expect(state.stations.draft).toMatchObject({
      airportId: '',
      name: '',
      stationType: '',
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
  })

  it('initializes obstacles sub-state with correct defaults', () => {
    const { state } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    expect(state.obstacles.items).toEqual([])
    expect(state.obstacles.total).toBe(0)
    expect(state.obstacles.page).toBe(1)
    expect(state.obstacles.pageSize).toBe(10)
    expect(state.obstacles.filters).toEqual({
      projectId: '',
      keyword: '',
      obstacleType: '',
    })
    expect(state.obstacles.loading).toBe(false)
    expect(state.obstacles.errorMessage).toBe('')
    expect(state.obstacles.warnings).toEqual([])
    expect(state.obstacles.formOpen).toBe(false)
    expect(state.obstacles.readonly).toBe(false)
    expect(state.obstacles.draft).toEqual({})
    expect(state.obstacles.deleteTarget).toBeNull()
  })

  it('resets obstacle page to 1 when keyword filter changes', async () => {
    const { state, setObstacleKeyword } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.obstacles.page = 3

    await setObstacleKeyword('测试')

    expect(state.obstacles.page).toBe(1)
    expect(state.obstacles.filters.keyword).toBe('测试')
    expect(getObstacles).toHaveBeenCalledWith({
      projectId: '',
      keyword: '测试',
      obstacleType: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('resets obstacle page to 1 when projectId filter changes', async () => {
    const { state, setObstacleProjectId } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.obstacles.page = 5

    await setObstacleProjectId('project-1')

    expect(state.obstacles.page).toBe(1)
    expect(state.obstacles.filters.projectId).toBe('project-1')
  })

  it('resets obstacle page to 1 when obstacleType filter changes', async () => {
    const { state, setObstacleType } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.obstacles.page = 2

    await setObstacleType('building')

    expect(state.obstacles.page).toBe(1)
    expect(state.obstacles.filters.obstacleType).toBe('building')
  })

  it('reloads obstacle list with requested page when obstacle page changes', async () => {
    const { changeObstaclePage } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    await changeObstaclePage(3)

    expect(getObstacles).toHaveBeenCalledWith({
      projectId: '',
      keyword: '',
      obstacleType: '',
      page: 3,
      pageSize: 10,
    })
  })

  it('resets obstacle page to 1 and reloads when obstacle page size changes', async () => {
    const { state, changeObstaclePageSize } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.obstacles.page = 4

    await changeObstaclePageSize(50)

    expect(state.obstacles.page).toBe(1)
    expect(getObstacles).toHaveBeenCalledWith({
      projectId: '',
      keyword: '',
      obstacleType: '',
      page: 1,
      pageSize: 50,
    })
  })

  it('sets deleteTarget when opening obstacle delete confirm', () => {
    const { state, openObstacleDeleteConfirm } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    const item: ObstacleListItem = {
      id: 'obstacle-1',
      projectId: 'project-1',
      projectName: '项目1',
      name: '障碍物1',
      obstacleType: 'building',
      topElevation: null,
      sourceBatchId: 'batch-1',
      sourceRowNo: 1,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    }

    openObstacleDeleteConfirm(item)

    expect(state.obstacles.deleteTarget).toStrictEqual(item)
  })

  it('clears deleteTarget when closing obstacle delete confirm', () => {
    const { state, closeObstacleDeleteConfirm, openObstacleDeleteConfirm } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openObstacleDeleteConfirm({
      id: 'obstacle-1',
      projectId: 'project-1',
      projectName: '项目1',
      name: '障碍物1',
      obstacleType: 'building',
      topElevation: null,
      sourceBatchId: 'batch-1',
      sourceRowNo: 1,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    })

    closeObstacleDeleteConfirm()

    expect(state.obstacles.deleteTarget).toBeNull()
    expect(state.obstacles.errorMessage).toBe('')
  })

  it('deletes obstacle, reloads list, clears target, but does NOT refresh bootstrap', async () => {
    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openObstacleDeleteConfirm, confirmObstacleDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openObstacleDeleteConfirm({
      id: 'obstacle-3',
      projectId: 'project-1',
      projectName: '项目1',
      name: '待删除障碍物',
      obstacleType: 'building',
      topElevation: null,
      sourceBatchId: 'batch-1',
      sourceRowNo: 1,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    })

    await confirmObstacleDelete()

    expect(deleteObstacle).toHaveBeenCalledWith('obstacle-3')
    expect(state.obstacles.deleteTarget).toBeNull()
    expect(getObstacles).toHaveBeenCalledTimes(1)
    expect(onRefreshBootstrap).not.toHaveBeenCalled()
  })

  it('opens obstacle detail dialog with formOpen, readonly, and draft set', () => {
    const { state, openObstacleDetailDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    const item: ObstacleListItem = {
      id: 'obstacle-2',
      projectId: 'project-1',
      projectName: '项目1',
      name: '障碍物2',
      obstacleType: 'tree',
      topElevation: 100,
      sourceBatchId: 'batch-2',
      sourceRowNo: 2,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    }

    openObstacleDetailDialog(item)

    expect(state.obstacles.formOpen).toBe(true)
    expect(state.obstacles.readonly).toBe(true)
    expect(state.obstacles.draft).toStrictEqual(item)
  })

  it('closes obstacle form dialog and resets readonly', () => {
    const { state, closeObstacleDetailDialog, openObstacleDetailDialog } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openObstacleDetailDialog({
      id: 'obstacle-2',
      projectId: 'project-1',
      projectName: '项目1',
      name: '障碍物2',
      obstacleType: 'tree',
      topElevation: 100,
      sourceBatchId: 'batch-2',
      sourceRowNo: 2,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    })

    closeObstacleDetailDialog()

    expect(state.obstacles.formOpen).toBe(false)
    expect(state.obstacles.readonly).toBe(false)
  })

  it('loads obstacle list when switching to obstacles tab while modal is open', async () => {
    const { openDataManagement, setActiveTab } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    openDataManagement()
    vi.mocked(getAirports).mockClear()
    vi.mocked(getRunways).mockClear()
    vi.mocked(getStations).mockClear()
    vi.mocked(getObstacles).mockClear()

    setActiveTab('obstacles')

    await Promise.resolve()

    expect(getObstacles).toHaveBeenCalledWith({
      projectId: '',
      keyword: '',
      obstacleType: '',
      page: 1,
      pageSize: 10,
    })
  })

  it('keeps obstacle delete dialog open and surfaces backend message on delete conflict', async () => {
    vi.mocked(deleteObstacle).mockRejectedValue(Object.assign(new Error('障碍物删除失败'), {
      status: 500,
      code: 'delete_failed',
      detailMessage: '障碍物删除失败',
    }))

    const onRefreshBootstrap = vi.fn(async () => undefined)
    const { state, openObstacleDeleteConfirm, confirmObstacleDelete } = useDataManagement({
      onRefreshBootstrap,
    })

    openObstacleDeleteConfirm({
      id: 'obstacle-4',
      projectId: 'project-1',
      projectName: '项目1',
      name: '冲突障碍物',
      obstacleType: 'building',
      topElevation: null,
      sourceBatchId: 'batch-1',
      sourceRowNo: 1,
      geometry: null,
      createdAt: '',
      updatedAt: '',
    })

    await confirmObstacleDelete()

    expect(state.obstacles.deleteTarget?.id).toBe('obstacle-4')
    expect(state.obstacles.errorMessage).toBe('障碍物删除失败')
    expect(onRefreshBootstrap).not.toHaveBeenCalled()
  })

  it('loads obstacle page when opening data management with obstacles tab active', async () => {
    const { state, openDataManagement } = useDataManagement({
      onRefreshBootstrap: vi.fn(),
    })

    state.activeTab = 'obstacles'
    vi.mocked(getObstacles).mockClear()

    await openDataManagement()

    expect(getObstacles).toHaveBeenCalledTimes(1)
  })
})
