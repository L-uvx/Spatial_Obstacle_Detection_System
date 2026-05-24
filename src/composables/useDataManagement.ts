import { reactive } from 'vue'
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
import type { DataManagementConflictError } from '../services/dataManagement'
import type {
  AirportFilters,
  AirportListItem,
  ObstacleFilters,
  ObstacleListItem,
  RunwayFilters,
  RunwayListItem,
  RunwayPayload,
  SelectOption,
  StationFormValue,
  StationFilters,
  StationListItem,
  StationPayload,
} from '../types/dataManagement'

export interface AirportFormValue {
  name: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
}

export interface AirportDraft extends AirportFormValue {
  id?: string
}

export interface RunwayDraft extends RunwayPayload {
  id?: string
}

export interface StationDraft extends StationFormValue {
  id?: string
}

export interface ObstacleDraft extends Partial<ObstacleListItem> {}

export interface DataManagementState {
  isOpen: boolean
  activeTab: 'airports' | 'runways' | 'stations' | 'obstacles'
  airportOptions: SelectOption[]
  stationTypeOptions: SelectOption[]
  airports: {
    items: AirportListItem[]
    total: number
    page: number
    pageSize: number
    filters: AirportFilters
    loading: boolean
    errorMessage: string
    warnings: string[]
    formOpen: boolean
    readonly: boolean
    draft: AirportDraft
    deleteTarget: AirportListItem | null
  }
  runways: {
    items: RunwayListItem[]
    total: number
    page: number
    pageSize: number
    filters: RunwayFilters
    loading: boolean
    errorMessage: string
    warnings: string[]
    formOpen: boolean
    readonly: boolean
    draft: RunwayDraft
    deleteTarget: RunwayListItem | null
  }
  stations: {
    items: StationListItem[]
    total: number
    page: number
    pageSize: number
    filters: StationFilters
    loading: boolean
    errorMessage: string
    warnings: string[]
    formOpen: boolean
    readonly: boolean
    draft: StationDraft
    deleteTarget: StationListItem | null
  }
  obstacles: {
    items: ObstacleListItem[]
    total: number
    page: number
    pageSize: number
    filters: ObstacleFilters
    loading: boolean
    errorMessage: string
    warnings: string[]
    formOpen: boolean
    readonly: boolean
    draft: ObstacleDraft
    deleteTarget: ObstacleListItem | null
  }
}

function createEmptyAirportDraft(): AirportDraft {
  return {
    name: '',
    longitude: null,
    latitude: null,
    altitude: null,
  }
}

function createEmptyRunwayDraft(): RunwayDraft {
  return {
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
    maximumTypeAircraft: 'D类和D类以上',
    stationSubType: '',
    runwayCodeA: '',
    runwayType: '',
    runwayCodeB: '',
  }
}

function createEmptyStationDraft(): StationDraft {
  return {
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
  }
}

function createEmptyObstacleDraft(): ObstacleDraft {
  return {}
}

function createInitialState(): DataManagementState {
  return {
    isOpen: false,
    activeTab: 'airports',
    airportOptions: [],
    stationTypeOptions: [],
    airports: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      filters: {
        keyword: '',
        hasCoordinates: false,
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: createEmptyAirportDraft(),
      deleteTarget: null,
    },
    runways: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      filters: {
        airportName: '',
        keyword: '',
        runNumber: '',
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: createEmptyRunwayDraft(),
      deleteTarget: null,
    },
    stations: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      filters: {
        airportName: '',
        stationType: '',
        keyword: '',
        runwayNo: '',
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: createEmptyStationDraft(),
      deleteTarget: null,
    },
    obstacles: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      filters: {
        projectName: '',
        keyword: '',
        obstacleType: '',
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: createEmptyObstacleDraft(),
      deleteTarget: null,
    },
  }
}

interface UseDataManagementOptions {
  onRefreshBootstrap: () => void | Promise<void>
}

export function useDataManagement(_options: UseDataManagementOptions) {
  const state = reactive(createInitialState())
  let airportEditRequestToken = 0
  let runwayEditRequestToken = 0
  let stationEditRequestToken = 0

  function clearAirportWarnings() {
    state.airports.warnings = []
  }

  function clearRunwayWarnings() {
    state.runways.warnings = []
  }

  function clearStationWarnings() {
    state.stations.warnings = []
  }

  function clearObstacleWarnings() {
    state.obstacles.warnings = []
  }

  function getErrorMessage(error: unknown, fallbackMessage: string) {
    if (typeof error === 'object' && error !== null && 'detailMessage' in error) {
      const detailMessage = (error as DataManagementConflictError).detailMessage

      if (typeof detailMessage === 'string' && detailMessage.length > 0) {
        return detailMessage
      }
    }

    return error instanceof Error ? error.message : fallbackMessage
  }

  async function loadAirportPage() {
    state.airports.loading = true
    state.airports.errorMessage = ''

    try {
      const result = await getAirports({
        keyword: state.airports.filters.keyword,
        hasCoordinates: state.airports.filters.hasCoordinates,
        page: state.airports.page,
        pageSize: state.airports.pageSize,
      })

      state.airports.items = result.items
      state.airports.total = result.total
      state.airports.page = result.page
      state.airports.pageSize = result.pageSize
    } catch (error) {
      state.airports.items = []
      state.airports.total = 0
      state.airports.errorMessage = error instanceof Error ? error.message : '机场列表加载失败'
    } finally {
      state.airports.loading = false
    }
  }

  async function loadOptionSources() {
    const [airportOptions, stationTypeOptions] = await Promise.all([
      getAirportOptions(),
      getStationTypeOptions(),
    ])

    state.airportOptions = airportOptions
    state.stationTypeOptions = stationTypeOptions
  }

  async function loadRunwayPage() {
    state.runways.loading = true
    state.runways.errorMessage = ''

    try {
      const result = await getRunways({
        airportName: state.runways.filters.airportName,
        keyword: state.runways.filters.keyword,
        runNumber: state.runways.filters.runNumber,
        page: state.runways.page,
        pageSize: state.runways.pageSize,
      })

      state.runways.items = result.items
      state.runways.total = result.total
      state.runways.page = result.page
      state.runways.pageSize = result.pageSize
    } catch (error) {
      state.runways.items = []
      state.runways.total = 0
      state.runways.errorMessage = error instanceof Error ? error.message : '跑道列表加载失败'
    } finally {
      state.runways.loading = false
    }
  }

  async function loadStationPage() {
    state.stations.loading = true
    state.stations.errorMessage = ''

    try {
      const result = await getStations({
        airportName: state.stations.filters.airportName,
        stationType: state.stations.filters.stationType,
        keyword: state.stations.filters.keyword,
        runwayNo: state.stations.filters.runwayNo,
        page: state.stations.page,
        pageSize: state.stations.pageSize,
      })

      state.stations.items = result.items
      state.stations.total = result.total
      state.stations.page = result.page
      state.stations.pageSize = result.pageSize
    } catch (error) {
      state.stations.items = []
      state.stations.total = 0
      state.stations.errorMessage = error instanceof Error ? error.message : '台站列表加载失败'
    } finally {
      state.stations.loading = false
    }
  }

  async function loadObstaclePage() {
    state.obstacles.loading = true
    state.obstacles.errorMessage = ''

    try {
      const result = await getObstacles({
        projectName: state.obstacles.filters.projectName,
        keyword: state.obstacles.filters.keyword,
        obstacleType: state.obstacles.filters.obstacleType,
        page: state.obstacles.page,
        pageSize: state.obstacles.pageSize,
      })

      state.obstacles.items = result.items
      state.obstacles.total = result.total
      state.obstacles.page = result.page
      state.obstacles.pageSize = result.pageSize
    } catch (error) {
      state.obstacles.items = []
      state.obstacles.total = 0
      state.obstacles.errorMessage = error instanceof Error ? error.message : '障碍物列表加载失败'
    } finally {
      state.obstacles.loading = false
    }
  }

  async function openDataManagement() {
    state.isOpen = true
    await loadOptionSources()

    if (state.activeTab === 'airports') {
      await loadAirportPage()
      return
    }

    if (state.activeTab === 'runways') {
      await loadRunwayPage()
      return
    }

    if (state.activeTab === 'stations') {
      await loadStationPage()
      return
    }

    if (state.activeTab === 'obstacles') {
      await loadObstaclePage()
    }
  }

  function closeDataManagement() {
    clearAirportWarnings()
    clearRunwayWarnings()
    clearStationWarnings()
    clearObstacleWarnings()
    state.isOpen = false
  }

  async function setAirportKeyword(keyword: string) {
    state.airports.filters.keyword = keyword
    state.airports.page = 1
    await loadAirportPage()
  }

  async function setAirportHasCoordinates(hasCoordinates: boolean) {
    state.airports.filters.hasCoordinates = hasCoordinates
    state.airports.page = 1
    await loadAirportPage()
  }

  async function changeAirportPage(page: number) {
    state.airports.page = page
    await loadAirportPage()
  }

  async function changeAirportPageSize(pageSize: number) {
    state.airports.pageSize = pageSize
    state.airports.page = 1
    await loadAirportPage()
  }

  async function setRunwayAirportName(airportName: string) {
    state.runways.filters.airportName = airportName
    state.runways.page = 1
    await loadRunwayPage()
  }

  async function setRunwayKeyword(keyword: string) {
    state.runways.filters.keyword = keyword
    state.runways.page = 1
    await loadRunwayPage()
  }

  async function setRunwayRunNumber(runNumber: string) {
    state.runways.filters.runNumber = runNumber
    state.runways.page = 1
    await loadRunwayPage()
  }

  async function changeRunwayPage(page: number) {
    state.runways.page = page
    await loadRunwayPage()
  }

  async function changeRunwayPageSize(pageSize: number) {
    state.runways.pageSize = pageSize
    state.runways.page = 1
    await loadRunwayPage()
  }

  async function setStationAirportName(airportName: string) {
    state.stations.filters.airportName = airportName
    state.stations.page = 1
    await loadStationPage()
  }

  async function setStationType(stationType: string) {
    state.stations.filters.stationType = stationType
    state.stations.page = 1
    await loadStationPage()
  }

  async function setStationKeyword(keyword: string) {
    state.stations.filters.keyword = keyword
    state.stations.page = 1
    await loadStationPage()
  }

  async function setStationRunwayNo(runwayNo: string) {
    state.stations.filters.runwayNo = runwayNo
    state.stations.page = 1
    await loadStationPage()
  }

  async function changeStationPage(page: number) {
    state.stations.page = page
    await loadStationPage()
  }

  async function changeStationPageSize(pageSize: number) {
    state.stations.pageSize = pageSize
    state.stations.page = 1
    await loadStationPage()
  }

  async function setObstacleProjectName(projectName: string) {
    state.obstacles.filters.projectName = projectName
    state.obstacles.page = 1
    await loadObstaclePage()
  }

  async function setObstacleKeyword(keyword: string) {
    state.obstacles.filters.keyword = keyword
    state.obstacles.page = 1
    await loadObstaclePage()
  }

  async function setObstacleType(obstacleType: string) {
    state.obstacles.filters.obstacleType = obstacleType
    state.obstacles.page = 1
    await loadObstaclePage()
  }

  async function changeObstaclePage(page: number) {
    state.obstacles.page = page
    await loadObstaclePage()
  }

  async function changeObstaclePageSize(pageSize: number) {
    state.obstacles.pageSize = pageSize
    state.obstacles.page = 1
    await loadObstaclePage()
  }

  function openAirportCreateDialog() {
    clearAirportWarnings()
    state.airports.draft = createEmptyAirportDraft()
    state.airports.formOpen = true
  }

  async function openAirportEditDialog(airportId: string) {
    state.airports.errorMessage = ''
    clearAirportWarnings()
    state.airports.formOpen = false
    state.airports.draft = createEmptyAirportDraft()
    airportEditRequestToken += 1
    const currentToken = airportEditRequestToken

    try {
      const airport = await getAirportDetail(airportId)

      if (currentToken !== airportEditRequestToken) {
        return
      }

      state.airports.draft = {
        id: airport.id,
        name: airport.name,
        longitude: airport.longitude,
        latitude: airport.latitude,
        altitude: airport.altitude,
      }
      state.airports.formOpen = true
    } catch (error) {
      if (currentToken !== airportEditRequestToken) {
        return
      }

      state.airports.formOpen = false
      state.airports.draft = createEmptyAirportDraft()
      state.airports.errorMessage = getErrorMessage(error, '机场详情加载失败')
    }
  }

  function closeAirportFormDialog() {
    clearAirportWarnings()
    state.airports.formOpen = false
    state.airports.readonly = false
  }

  function openAirportDetailDialog(item: AirportListItem) {
    state.airports.errorMessage = ''
    state.airports.readonly = false
    clearAirportWarnings()
    state.airports.draft = {
      id: item.id,
      name: item.name,
      longitude: item.longitude,
      latitude: item.latitude,
      altitude: item.altitude,
    }
    state.airports.readonly = true
    state.airports.formOpen = true
  }

  function openRunwayCreateDialog() {
    state.runways.errorMessage = ''
    clearRunwayWarnings()
    state.runways.draft = createEmptyRunwayDraft()
    state.runways.formOpen = true
  }

  async function openRunwayEditDialog(runwayId: string) {
    state.runways.errorMessage = ''
    clearRunwayWarnings()
    state.runways.formOpen = false
    state.runways.draft = createEmptyRunwayDraft()
    runwayEditRequestToken += 1
    const currentToken = runwayEditRequestToken

    try {
      const runway = await getRunwayDetail(runwayId)

      if (currentToken !== runwayEditRequestToken) {
        return
      }

      state.runways.draft = {
        id: runway.id,
        airportId: runway.airportId,
        name: runway.name,
        runNumber: runway.runNumber,
        longitude: runway.longitude,
        latitude: runway.latitude,
        headingDegrees: runway.headingDegrees,
        lengthMeters: runway.lengthMeters,
        width: runway.width,
        altitude: runway.altitude,
        enterHeight: runway.enterHeight,
        maximumAirworthiness: runway.maximumAirworthiness,
        maximumTypeAircraft: runway.maximumTypeAircraft,
        stationSubType: runway.stationSubType,
        runwayCodeA: runway.runwayCodeA,
        runwayType: runway.runwayType,
        runwayCodeB: runway.runwayCodeB,
      }
      state.runways.formOpen = true
    } catch (error) {
      if (currentToken !== runwayEditRequestToken) {
        return
      }

      state.runways.formOpen = false
      state.runways.draft = createEmptyRunwayDraft()
      state.runways.errorMessage = getErrorMessage(error, '跑道详情加载失败')
    }
  }

  function closeRunwayFormDialog() {
    clearRunwayWarnings()
    state.runways.formOpen = false
    state.runways.readonly = false
  }

  function openRunwayDetailDialog(item: RunwayListItem) {
    state.runways.errorMessage = ''
    state.runways.readonly = false
    clearRunwayWarnings()
    state.runways.draft = {
      id: item.id,
      airportId: item.airportId,
      name: item.name,
      runNumber: item.runNumber,
      longitude: item.longitude,
      latitude: item.latitude,
      headingDegrees: item.headingDegrees,
      lengthMeters: item.lengthMeters,
      width: item.width,
      altitude: item.altitude,
      enterHeight: item.enterHeight,
      maximumAirworthiness: item.maximumAirworthiness,
      maximumTypeAircraft: item.maximumTypeAircraft,
      stationSubType: item.stationSubType,
      runwayCodeA: item.runwayCodeA,
      runwayType: item.runwayType,
      runwayCodeB: item.runwayCodeB,
    }
    state.runways.readonly = true
    state.runways.formOpen = true
  }

  function openStationCreateDialog() {
    state.stations.errorMessage = ''
    clearStationWarnings()
    state.stations.draft = createEmptyStationDraft()
    state.stations.formOpen = true
  }

  async function openStationEditDialog(stationId: string) {
    state.stations.errorMessage = ''
    clearStationWarnings()
    state.stations.formOpen = false
    state.stations.draft = createEmptyStationDraft()
    stationEditRequestToken += 1
    const currentToken = stationEditRequestToken

    try {
      const station = await getStationDetail(stationId)

      if (currentToken !== stationEditRequestToken) {
        return
      }

      state.stations.draft = {
        id: station.id,
        airportId: station.airportId,
        name: station.name,
        stationType: station.stationType,
        stationGroup: station.stationGroup,
        frequency: station.frequency,
        runwayNo: station.runwayNo,
        longitude: station.longitude,
        latitude: station.latitude,
        altitude: station.altitude,
        coverageRadius: station.coverageRadius,
        flyHeight: station.flyHeight,
        antennaHag: station.antennaHag,
        reflectionNetHag: station.reflectionNetHag,
        centerAntennaH: station.centerAntennaH,
        bAntennaH: station.bAntennaH,
        bToCenterDistance: station.bToCenterDistance,
        reflectionDiameter: station.reflectionDiameter,
        downwardAngle: station.downwardAngle,
        antennaTag: station.antennaTag,
        distanceToRunway: station.distanceToRunway,
        distanceVToRunway: station.distanceVToRunway,
        distanceEndoRunway: station.distanceEndoRunway,
        unitNumber: station.unitNumber,
        aircraft: station.aircraft,
        antennaHeight: station.antennaHeight,
        stationSubType: station.stationSubType,
        combineId: station.combineId,
      }
      state.stations.formOpen = true
    } catch (error) {
      if (currentToken !== stationEditRequestToken) {
        return
      }

      state.stations.formOpen = false
      state.stations.draft = createEmptyStationDraft()
      state.stations.errorMessage = getErrorMessage(error, '台站详情加载失败')
    }
  }

  function closeStationFormDialog() {
    clearStationWarnings()
    state.stations.formOpen = false
    state.stations.readonly = false
  }

  function openObstacleDetailDialog(item: ObstacleListItem) {
    state.obstacles.errorMessage = ''
    state.obstacles.readonly = false
    clearObstacleWarnings()
    state.obstacles.draft = item
    state.obstacles.readonly = true
    state.obstacles.formOpen = true
  }

  function closeObstacleDetailDialog() {
    clearObstacleWarnings()
    state.obstacles.formOpen = false
    state.obstacles.readonly = false
  }

  function openStationDetailDialog(item: StationListItem) {
    state.stations.errorMessage = ''
    state.stations.readonly = false
    clearStationWarnings()
    state.stations.draft = {
      id: item.id,
      airportId: item.airportId,
      name: item.name,
      stationType: item.stationType,
      stationGroup: item.stationGroup,
      frequency: item.frequency,
      runwayNo: item.runwayNo,
      longitude: item.longitude,
      latitude: item.latitude,
      altitude: item.altitude,
      coverageRadius: item.coverageRadius,
      flyHeight: item.flyHeight,
      antennaHag: item.antennaHag,
      reflectionNetHag: item.reflectionNetHag,
      centerAntennaH: item.centerAntennaH,
      bAntennaH: item.bAntennaH,
      bToCenterDistance: item.bToCenterDistance,
      reflectionDiameter: item.reflectionDiameter,
      downwardAngle: item.downwardAngle,
      antennaTag: item.antennaTag,
      distanceToRunway: item.distanceToRunway,
      distanceVToRunway: item.distanceVToRunway,
      distanceEndoRunway: item.distanceEndoRunway,
      unitNumber: item.unitNumber,
      aircraft: item.aircraft,
      antennaHeight: item.antennaHeight,
      stationSubType: item.stationSubType,
      combineId: item.combineId,
    }
    state.stations.readonly = true
    state.stations.formOpen = true
  }

  async function saveAirportDraft(value: AirportFormValue) {
    state.airports.errorMessage = ''
    clearAirportWarnings()

    const payload = {
      name: value.name,
      longitude: value.longitude,
      latitude: value.latitude,
      altitude: value.altitude,
    }

    try {
      const result = state.airports.draft.id
        ? await updateAirport(state.airports.draft.id, payload)
        : await createAirport(payload)

      state.airports.warnings = result.warnings

      state.airports.formOpen = false
      await loadAirportPage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.airports.errorMessage = getErrorMessage(error, '机场保存失败')
    }
  }

  async function saveRunwayDraft(value: RunwayPayload) {
    state.runways.errorMessage = ''
    clearRunwayWarnings()

    const payload: RunwayPayload = {
      airportId: value.airportId,
      name: value.name,
      runNumber: value.runNumber,
      longitude: value.longitude,
      latitude: value.latitude,
      headingDegrees: value.headingDegrees,
      lengthMeters: value.lengthMeters,
      width: value.width,
      altitude: value.altitude,
      enterHeight: value.enterHeight,
      maximumAirworthiness: value.maximumAirworthiness,
      maximumTypeAircraft: value.maximumTypeAircraft,
      stationSubType: value.stationSubType,
      runwayCodeA: value.runwayCodeA,
      runwayType: value.runwayType,
      runwayCodeB: value.runwayCodeB,
    }

    try {
      const result = state.runways.draft.id
        ? await updateRunway(state.runways.draft.id, payload)
        : await createRunway(payload)

      state.runways.warnings = result.warnings

      state.runways.formOpen = false
      await loadRunwayPage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.runways.errorMessage = getErrorMessage(error, '跑道保存失败')
    }
  }

  async function saveStationDraft(value: StationPayload) {
    state.stations.errorMessage = ''
    clearStationWarnings()

    const payload: StationPayload = {
      airportId: value.airportId,
      name: value.name,
      stationType: value.stationType,
      stationGroup: value.stationGroup,
      frequency: value.frequency,
      runwayNo: value.runwayNo,
      longitude: value.longitude,
      latitude: value.latitude,
      altitude: value.altitude,
      coverageRadius: value.coverageRadius,
      flyHeight: value.flyHeight,
      antennaHag: value.antennaHag,
      reflectionNetHag: value.reflectionNetHag,
      centerAntennaH: value.centerAntennaH,
      bAntennaH: value.bAntennaH,
      bToCenterDistance: value.bToCenterDistance,
      reflectionDiameter: value.reflectionDiameter,
      downwardAngle: value.downwardAngle,
      antennaTag: value.antennaTag,
      distanceToRunway: value.distanceToRunway,
      distanceVToRunway: value.distanceVToRunway,
      distanceEndoRunway: value.distanceEndoRunway,
      unitNumber: value.unitNumber,
      aircraft: value.aircraft,
      antennaHeight: value.antennaHeight,
      stationSubType: value.stationSubType,
      combineId: value.combineId,
    }

    try {
      const result = state.stations.draft.id
        ? await updateStation(state.stations.draft.id, payload)
        : await createStation(payload)

      state.stations.warnings = result.warnings

      state.stations.formOpen = false
      await loadStationPage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.stations.errorMessage = getErrorMessage(error, '台站保存失败')
    }
  }

  function openAirportDeleteConfirm(airport: AirportListItem) {
    state.airports.errorMessage = ''
    state.airports.deleteTarget = airport
  }

  function closeAirportDeleteConfirm() {
    state.airports.deleteTarget = null
    state.airports.errorMessage = ''
  }

  function openRunwayDeleteConfirm(runway: RunwayListItem) {
    state.runways.errorMessage = ''
    state.runways.deleteTarget = runway
  }

  function closeRunwayDeleteConfirm() {
    state.runways.deleteTarget = null
    state.runways.errorMessage = ''
  }

  function openStationDeleteConfirm(station: StationListItem) {
    state.stations.errorMessage = ''
    state.stations.deleteTarget = station
  }

  function closeStationDeleteConfirm() {
    state.stations.deleteTarget = null
    state.stations.errorMessage = ''
  }

  async function confirmAirportDelete() {
    if (!state.airports.deleteTarget) {
      return
    }

    state.airports.errorMessage = ''

    try {
      await deleteAirport(state.airports.deleteTarget.id)
      state.airports.deleteTarget = null
      await loadAirportPage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.airports.errorMessage = getErrorMessage(error, '机场删除失败')
    }
  }

  async function confirmRunwayDelete() {
    if (!state.runways.deleteTarget) {
      return
    }

    state.runways.errorMessage = ''

    try {
      await deleteRunway(state.runways.deleteTarget.id)
      state.runways.deleteTarget = null
      await loadRunwayPage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.runways.errorMessage = getErrorMessage(error, '跑道删除失败')
    }
  }

  async function confirmStationDelete() {
    if (!state.stations.deleteTarget) {
      return
    }

    state.stations.errorMessage = ''

    try {
      await deleteStation(state.stations.deleteTarget.id)
      state.stations.deleteTarget = null
      await loadStationPage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.stations.errorMessage = getErrorMessage(error, '台站删除失败')
    }
  }

  function openObstacleDeleteConfirm(item: ObstacleListItem) {
    state.obstacles.errorMessage = ''
    state.obstacles.deleteTarget = item
  }

  function closeObstacleDeleteConfirm() {
    state.obstacles.deleteTarget = null
    state.obstacles.errorMessage = ''
  }

  async function confirmObstacleDelete() {
    if (!state.obstacles.deleteTarget) {
      return
    }

    state.obstacles.errorMessage = ''

    try {
      await deleteObstacle(state.obstacles.deleteTarget.id)
      state.obstacles.deleteTarget = null
      await loadObstaclePage()
      await _options.onRefreshBootstrap()
    } catch (error) {
      state.obstacles.errorMessage = getErrorMessage(error, '障碍物删除失败')
    }
  }

  function setActiveTab(tab: DataManagementState['activeTab']) {
    state.activeTab = tab

    if (tab === 'airports' && state.isOpen) {
      void loadAirportPage()
      return
    }

    if (tab === 'runways' && state.isOpen) {
      void loadRunwayPage()
      return
    }

    if (tab === 'stations' && state.isOpen) {
      void loadStationPage()
      return
    }

    if (tab === 'obstacles' && state.isOpen) {
      void loadObstaclePage()
    }
  }

    return {
      state,
      loadOptionSources,
      loadAirportPage,
    openDataManagement,
    closeDataManagement,
    setAirportKeyword,
    setAirportHasCoordinates,
    changeAirportPage,
    changeAirportPageSize,
    setRunwayAirportName,
    setRunwayKeyword,
    setRunwayRunNumber,
    changeRunwayPage,
    changeRunwayPageSize,
    setStationAirportName,
    setStationType,
    setStationKeyword,
    setStationRunwayNo,
    changeStationPage,
    changeStationPageSize,
    setObstacleProjectName,
    setObstacleKeyword,
    setObstacleType,
    changeObstaclePage,
    changeObstaclePageSize,
    openAirportCreateDialog,
    openAirportEditDialog,
    openAirportDetailDialog,
    closeAirportFormDialog,
    saveAirportDraft,
    openRunwayCreateDialog,
    openRunwayEditDialog,
    openRunwayDetailDialog,
    closeRunwayFormDialog,
    saveRunwayDraft,
    openStationCreateDialog,
    openStationEditDialog,
    openStationDetailDialog,
    closeStationFormDialog,
    saveStationDraft,
    openObstacleDetailDialog,
    closeObstacleDetailDialog,
    openAirportDeleteConfirm,
    closeAirportDeleteConfirm,
    confirmAirportDelete,
    openRunwayDeleteConfirm,
    closeRunwayDeleteConfirm,
    confirmRunwayDelete,
    openStationDeleteConfirm,
    closeStationDeleteConfirm,
    confirmStationDelete,
    openObstacleDeleteConfirm,
    closeObstacleDeleteConfirm,
    confirmObstacleDelete,
    setActiveTab,
    loadRunwayPage,
    loadStationPage,
    loadObstaclePage,
  }
}
