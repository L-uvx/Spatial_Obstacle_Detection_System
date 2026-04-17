import { reactive } from 'vue'
import { mapConfig } from '../config/map'
import type {
  ImportFormValue,
  InitialCameraTarget,
  PolygonObstacleAnalysisState,
  RenderedAirport,
  RenderedObstacle,
} from '../types/tool'
import {
  flattenVisibleProtectionZones,
  mergeProtectionZones,
  toggleAirportVisibility,
  toggleStationVisibility,
  toggleZoneVisibility,
} from '../map/layers/analysis/protectionZoneTree'
import { getBootstrapData } from '../services/bootstrap'
import { runAnalyzeWorkflow } from '../workflows/analyzeWorkflow'
import { runExportWorkflow } from '../workflows/exportWorkflow'
import { runImportWorkflow } from '../workflows/importWorkflow'

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function appendRenderedObstacles(
  existingObstacles: RenderedObstacle[],
  nextObstacles: RenderedObstacle[],
) {
  const obstacleById = new Map(existingObstacles.map((item) => [item.id, item]))

  for (const obstacle of nextObstacles) {
    if (!obstacleById.has(obstacle.id)) {
      obstacleById.set(obstacle.id, obstacle)
    }
  }

  return [...obstacleById.values()]
}

function buildAirportCameraTarget(airport: RenderedAirport): InitialCameraTarget {
  return {
    longitude: airport.longitude,
    latitude: airport.latitude,
    height: mapConfig.initialView.height,
    pitch: -90,
  }
}

function resolveVisibleStations(airports: RenderedAirport[], selectedAirportId: string) {
  const selectedAirport = airports.find((airport) => airport.id === selectedAirportId)
  return selectedAirport ? [...selectedAirport.stations] : []
}

function triggerDownload(downloadUrl: string) {
  if (typeof document === 'undefined') {
    return
  }

  const isAllowedDownloadUrl = /^https?:\/\//.test(downloadUrl) || /^\/(?!\/)/.test(downloadUrl)

  if (!isAllowedDownloadUrl) {
    return
  }

  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = ''
  link.rel = 'noopener'
  link.click()
}

function getAllowedDownloadUrl(downloadUrl: string) {
  const isAllowedDownloadUrl = /^https?:\/\//.test(downloadUrl) || /^\/(?!\/)/.test(downloadUrl)
  return isAllowedDownloadUrl ? downloadUrl : ''
}

function createInitialState(renderedObstacles: RenderedObstacle[] = []): PolygonObstacleAnalysisState {
  return {
    isOpen: false,
    protectionZonePanelOpen: false,
    stationPanelOpen: false,
    stage: 'idle',
    bootstrapStatus: 'idle',
    bootstrapMessage: '等待系统初始化。',
    initialCameraTarget: null,
    airports: [],
    selectedAirportId: '',
    visibleStations: [],
    projectName: '',
    obstacleType: '',
    fileName: '',
    importTaskId: '',
    importStatus: 'idle',
    importProgressPercent: 0,
    projectId: '',
    obstacleBatchId: '',
    targetOptions: [],
    selectedTargetIds: [],
    analysisTaskId: '',
    analysisSummary: '',
    analysisSelectedTargets: [],
    analysisObstacleCount: 0,
    statusMessage: '等待打开多边形障碍物分析流程。',
    exportTaskId: '',
    exportStatus: 'idle',
    exportProgressPercent: 0,
    exportMessage: '分析完成后可导出 Word 结论。',
    exportFileName: '',
    downloadUrl: '',
    exportErrorMessage: '',
    renderedObstacles,
    protectionZoneTree: [],
    visibleProtectionZones: [],
    protectionZoneSampling: {
      circleAngleStepDegrees: 5,
      sectorAngleStepDegrees: 5,
    },
  }
}

export function useWorkflowActions(initialObstacles: RenderedObstacle[] = []) {
  const state = reactive(createInitialState(initialObstacles))
  let exportRunId = 0

  async function bootstrap() {
    state.bootstrapStatus = 'loading'
    state.bootstrapMessage = '正在加载机场基线和历史障碍物。'

    try {
      const result = await getBootstrapData()
      const defaultAirport = result.airports[0] ?? null

      state.airports = result.airports
      state.selectedAirportId = defaultAirport?.id ?? ''
      state.visibleStations = defaultAirport ? [...defaultAirport.stations] : []
      state.initialCameraTarget = defaultAirport ? buildAirportCameraTarget(defaultAirport) : null
      state.renderedObstacles = appendRenderedObstacles(state.renderedObstacles, result.historicalObstacles)
      state.bootstrapStatus = 'success'
      state.bootstrapMessage = '系统初始化完成。'
    } catch (error) {
      state.airports = []
      state.selectedAirportId = ''
      state.visibleStations = []
      state.bootstrapStatus = 'error'
      state.bootstrapMessage =
        error instanceof Error ? `${error.message} 已降级到默认视角。` : '系统初始化失败，已降级到默认视角。'
      state.initialCameraTarget = null
    }
  }

  function openModal() {
    state.isOpen = true
    state.stage = 'import-form'
    state.statusMessage = '请填写项目名称、障碍物类型并上传 Excel。'
  }

  function closeModal() {
    const preservedObstacles = [...state.renderedObstacles]
    const preservedBootstrapStatus = state.bootstrapStatus
    const preservedBootstrapMessage = state.bootstrapMessage
    const preservedInitialCameraTarget = state.initialCameraTarget
    const preservedAirports = [...state.airports]
    const preservedSelectedAirportId = state.selectedAirportId
    const preservedVisibleStations = [...state.visibleStations]
    const preservedStationPanelOpen = state.stationPanelOpen
    const preservedProtectionZoneTree = state.protectionZoneTree
    const preservedProtectionZonePanelOpen = state.protectionZonePanelOpen
    const nextVisibleProtectionZones = flattenVisibleProtectionZones(preservedProtectionZoneTree)

    Object.assign(state, {
      ...createInitialState(preservedObstacles),
      bootstrapStatus: preservedBootstrapStatus,
      bootstrapMessage: preservedBootstrapMessage,
      initialCameraTarget: preservedInitialCameraTarget,
      airports: preservedAirports,
      selectedAirportId: preservedSelectedAirportId,
      visibleStations: preservedVisibleStations,
      stationPanelOpen: preservedStationPanelOpen,
      protectionZonePanelOpen: preservedProtectionZonePanelOpen,
      protectionZoneTree: preservedProtectionZoneTree,
      visibleProtectionZones: nextVisibleProtectionZones,
    })
  }

  function selectAirport(airportId: string) {
    const selectedAirport = state.airports.find((airport) => airport.id === airportId)

    if (!selectedAirport) {
      return
    }

    state.selectedAirportId = airportId
    state.visibleStations = resolveVisibleStations(state.airports, airportId)
    state.initialCameraTarget = buildAirportCameraTarget(selectedAirport)
  }

  async function submitImport(formValue: ImportFormValue) {
    if (!formValue.file) {
      state.stage = 'error'
      state.statusMessage = '请先选择 Excel 文件后再开始导入。'
      return
    }

    state.projectName = formValue.projectName
    state.obstacleType = formValue.obstacleType
    state.fileName = formValue.fileName
    state.importTaskId = ''
    state.importStatus = 'running'
    state.importProgressPercent = 0
    state.stage = 'importing'
    state.statusMessage = '导入任务已创建，正在等待后端解析 Excel 并入库。'

    try {
      const workflowResult = await runImportWorkflow({
        ...formValue,
        file: formValue.file,
      })

      state.importTaskId = workflowResult.importTaskId
      state.importStatus = workflowResult.importStatus
      state.importProgressPercent = workflowResult.importProgressPercent
      state.projectId = workflowResult.projectId
      state.obstacleBatchId = workflowResult.obstacleBatchId
      state.targetOptions = workflowResult.targetOptions
      state.renderedObstacles = appendRenderedObstacles(state.renderedObstacles, workflowResult.obstacles)
      state.selectedTargetIds = []
      state.stage = 'target-selection'
      state.statusMessage = workflowResult.message
    } catch (error) {
      state.importStatus = 'failed'
      state.stage = 'error'
      state.statusMessage = error instanceof Error ? error.message : '导入失败，请稍后重试。'
    }
  }

  function toggleTarget(targetId: string) {
    const index = state.selectedTargetIds.indexOf(targetId)

    if (index >= 0) {
      state.selectedTargetIds.splice(index, 1)
      return
    }

    state.selectedTargetIds.push(targetId)
  }

  async function startAnalysis() {
    if (state.selectedTargetIds.length === 0) {
      state.statusMessage = '请至少选择一个机场/空管局后再开始分析。'
      return
    }

    state.stage = 'analyzing'
    state.statusMessage = '分析任务执行中，正在等待后端返回基础分析结论。'

    try {
      await delay(400)
      const workflowResult = await runAnalyzeWorkflow({
        importTaskId: state.importTaskId,
        targetIds: [...state.selectedTargetIds],
      })

      state.analysisTaskId = workflowResult.analysisTaskId
      state.analysisSummary = workflowResult.summary
      state.analysisSelectedTargets = workflowResult.selectedTargets
      state.analysisObstacleCount = workflowResult.obstacleCount
      state.protectionZoneTree = mergeProtectionZones(state.protectionZoneTree, workflowResult.protectionZones)
      state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
      state.protectionZonePanelOpen = state.protectionZoneTree.length > 0
      state.stage = 'analysis-result'
      state.statusMessage = workflowResult.message
    } catch (error) {
      state.stage = 'error'
      state.statusMessage = error instanceof Error ? error.message : '分析失败，请稍后重试。'
    }
  }

  async function exportReport() {
    if (state.stage !== 'analysis-result' || !state.analysisTaskId) {
      return
    }

    exportRunId += 1
    const currentExportRunId = exportRunId

    state.exportTaskId = ''
    state.exportStatus = 'idle'
    state.exportProgressPercent = 0
    state.exportMessage = '分析完成后可导出 Word 结论。'
    state.exportFileName = ''
    state.downloadUrl = ''
    state.exportErrorMessage = ''

    try {
      const workflowResult = await runExportWorkflow({
        analysisTaskId: state.analysisTaskId,
        onProgress(progress) {
          if (currentExportRunId !== exportRunId) {
            return
          }

          state.exportTaskId = progress.exportTaskId
          state.exportStatus = progress.exportStatus
          state.exportProgressPercent = progress.exportProgressPercent
          state.exportMessage = progress.exportMessage
          state.exportErrorMessage = ''
        },
        triggerDownload,
      })

      if (currentExportRunId !== exportRunId) {
        return
      }

      state.exportTaskId = workflowResult.exportTaskId
      state.exportStatus = workflowResult.exportStatus
      state.exportProgressPercent = workflowResult.exportProgressPercent
      state.exportMessage = workflowResult.exportMessage
      state.exportFileName = workflowResult.exportFileName
      state.downloadUrl = getAllowedDownloadUrl(workflowResult.downloadUrl)
      state.exportErrorMessage = workflowResult.exportErrorMessage
    } catch (error) {
      if (currentExportRunId !== exportRunId) {
        return
      }

      state.exportStatus = 'failed'
      state.exportErrorMessage = error instanceof Error ? error.message : '导出失败，请稍后重试。'
      state.exportMessage = state.exportErrorMessage
    }
  }

  function toggleProtectionZoneAirportVisibility(airportId: string, visible: boolean) {
    state.protectionZoneTree = toggleAirportVisibility(state.protectionZoneTree, airportId, visible)
    state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
  }

  function toggleProtectionZoneStationVisibility(airportId: string, stationId: string, visible: boolean) {
    state.protectionZoneTree = toggleStationVisibility(state.protectionZoneTree, airportId, stationId, visible)
    state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
  }

  function toggleProtectionZoneVisibility(
    airportId: string,
    stationId: string,
    zoneCode: string,
    visible: boolean,
  ) {
    state.protectionZoneTree = toggleZoneVisibility(
      state.protectionZoneTree,
      airportId,
      stationId,
      zoneCode,
      visible,
    )
    state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
  }

  function openProtectionZonePanel() {
    state.protectionZonePanelOpen = true
  }

  function closeProtectionZonePanel() {
    state.protectionZonePanelOpen = false
  }

  function openStationPanel() {
    state.stationPanelOpen = true
  }

  function closeStationPanel() {
    state.stationPanelOpen = false
  }

  return {
    state,
    bootstrap,
    openModal,
    closeModal,
    submitImport,
    toggleTarget,
    startAnalysis,
    exportReport,
    openProtectionZonePanel,
    closeProtectionZonePanel,
    openStationPanel,
    closeStationPanel,
    selectAirport,
    toggleProtectionZoneAirportVisibility,
    toggleProtectionZoneStationVisibility,
    toggleProtectionZoneVisibility,
  }
}
