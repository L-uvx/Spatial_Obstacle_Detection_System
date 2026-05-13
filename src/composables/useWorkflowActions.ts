import { reactive } from 'vue'
import { mapConfig } from '../config/map'
import { computeMultiPolygonFlightTarget } from '../components/map/camera'
import type {
  ImportFormValue,
  InitialCameraTarget,
  ObstacleAnalysisMode,
  PolygonObstacleAnalysisState,
  ProtectionZoneNode,
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
import { getAirportProtectionZones } from '../services/analysis'
import { getBootstrapData } from '../services/bootstrap'
import { runAnalyzeWorkflow } from '../workflows/analyzeWorkflow'
import { runExportWorkflow } from '../workflows/exportWorkflow'
import { runImportWorkflow } from '../workflows/importWorkflow'

// 提供可测试环境复用的异步等待工具。
function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

// 以 obstacle id 去重追加障碍物，保留已有地图状态。
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

// 将机场中心点转换为统一的相机目标参数。
function buildAirportCameraTarget(airport: RenderedAirport): InitialCameraTarget {
  return {
    longitude: airport.longitude,
    latitude: airport.latitude,
    height: mapConfig.initialView.height,
    pitch: -90,
  }
}

// 根据当前选中机场派生需要显示的台站列表。
function resolveVisibleStations(airports: RenderedAirport[], selectedAirportId: string) {
  const selectedAirport = airports.find((airport) => airport.id === selectedAirportId)
  return selectedAirport ? [...selectedAirport.stations] : []
}

// 通过临时链接触发浏览器下载。
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

// 只允许安全的下载地址回写到页面链接中。
function getAllowedDownloadUrl(downloadUrl: string) {
  const isAllowedDownloadUrl = /^https?:\/\//.test(downloadUrl) || /^\/(?!\/)/.test(downloadUrl)
  return isAllowedDownloadUrl ? downloadUrl : ''
}

// 构造单入口流程的初始状态基线。
function createInitialState(renderedObstacles: RenderedObstacle[] = []): PolygonObstacleAnalysisState {
  return {
    isOpen: false,
    protectionZonePanelOpen: false,
    stationPanelOpen: false,
    analysisMode: 'polygon',
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
    analysisRuleResults: [],
    statusMessage: '等待打开障碍物分析流程。',
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
    flyToTargetTick: 0,
    flyToTargetPayload: null,
  }
}

export function useWorkflowActions(initialObstacles: RenderedObstacle[] = []) {
  const state = reactive(createInitialState(initialObstacles))
  let exportRunId = 0

  // 根据当前机场拉取保护区几何并合并到长期状态中。
  async function loadProtectionZones(airportId: string) {
    try {
      const zones = await getAirportProtectionZones(airportId)
      state.protectionZoneTree = mergeProtectionZones([], zones)
      state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
      state.protectionZonePanelOpen = state.protectionZoneTree.length > 0
    } catch (error) {
      console.warn('加载机场保护区失败:', error)
    }
  }

  // 启动系统初始化，加载机场基线和历史障碍物。
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

      if (defaultAirport?.id) {
        await loadProtectionZones(defaultAirport.id)
      }

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

  // 打开分析弹窗并切回导入起始步骤。
  function openModal(mode: ObstacleAnalysisMode) {
    state.analysisMode = mode
    state.isOpen = true
    state.stage = 'import-form'
    state.statusMessage = mode === 'point' ? '请上传点状障碍物 Excel。' : '请上传多边形障碍物 Excel。'
  }

  // 关闭弹窗时重置会话状态，但保留地图长期状态。
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

  // 切换当前机场，并同步可见台站和复位目标。
  function selectAirport(airportId: string) {
    const selectedAirport = state.airports.find((airport) => airport.id === airportId)

    if (!selectedAirport) {
      return
    }

    state.selectedAirportId = airportId
    state.visibleStations = resolveVisibleStations(state.airports, airportId)
    state.initialCameraTarget = buildAirportCameraTarget(selectedAirport)

    void loadProtectionZones(airportId)
  }

  // 提交导入表单，拉起导入任务并切到对象选择阶段。
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
        mode: state.analysisMode,
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

  // 切换候选分析对象的勾选状态。
  function toggleTarget(targetId: string) {
    const index = state.selectedTargetIds.indexOf(targetId)

    if (index >= 0) {
      state.selectedTargetIds.splice(index, 1)
      return
    }

    state.selectedTargetIds.push(targetId)
  }

  // 提交分析任务并把返回的保护区合并进长期状态。
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
      state.analysisRuleResults = workflowResult.ruleResults
      state.stage = 'analysis-result'
      state.statusMessage = workflowResult.message
    } catch (error) {
      state.stage = 'error'
      state.statusMessage = error instanceof Error ? error.message : '分析失败，请稍后重试。'
    }
  }

  // 发起 Word 导出，并通过运行 id 防止旧请求覆盖新状态。
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

  // 切换机场节点及其子保护区的可见性。
  function toggleProtectionZoneAirportVisibility(airportId: string, visible: boolean) {
    state.protectionZoneTree = toggleAirportVisibility(state.protectionZoneTree, airportId, visible)
    state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
  }

  // 切换台站节点及其子保护区的可见性。
  function toggleProtectionZoneStationVisibility(airportId: string, stationId: string, visible: boolean) {
    state.protectionZoneTree = toggleStationVisibility(state.protectionZoneTree, airportId, stationId, visible)
    state.visibleProtectionZones = flattenVisibleProtectionZones(state.protectionZoneTree)
  }

  // 切换单个保护区节点的可见性。
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

  // 定位到指定保护区时优先选择面积最大的 region，避免分散区域合并后飞到空白位置。
  function flyToProtectionZone(zone: ProtectionZoneNode) {
    let largestRegionTarget: ReturnType<typeof computeMultiPolygonFlightTarget> = null

    for (const region of zone.regions) {
      const nextTarget = computeMultiPolygonFlightTarget(region.geometry.coordinates)

      if (!nextTarget) {
        continue
      }

      if (!largestRegionTarget || nextTarget.area > largestRegionTarget.area) {
        largestRegionTarget = nextTarget
      }
    }

    if (!largestRegionTarget) {
      return
    }

    state.flyToTargetPayload = largestRegionTarget.target
    state.flyToTargetTick += 1
  }

  // 打开保护区侧边栏。
  function openProtectionZonePanel() {
    state.protectionZonePanelOpen = true
  }

  // 关闭保护区侧边栏。
  function closeProtectionZonePanel() {
    state.protectionZonePanelOpen = false
  }

  // 打开机场选择浮层。
  function openStationPanel() {
    state.stationPanelOpen = true
  }

  // 关闭机场选择浮层。
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
    flyToProtectionZone,
  }
}
