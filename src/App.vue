<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import { useDataManagement } from './composables/useDataManagement'
import { useWorkflowActions } from './composables/useWorkflowActions'
import type { ImportFormValue, ObstacleAnalysisMode, ProtectionZoneNode } from './types/tool'
import type { AirportFormValue } from './composables/useDataManagement'
import type { AirportListItem, ObstacleListItem, RunwayListItem, RunwayPayload, StationListItem, StationPayload } from './types/dataManagement'

const resetTick = ref(0)
const topDownTick = ref(0)
const {
  state,
  bootstrap,
  openModal,
  closeModal,
  openStationPanel,
  closeStationPanel,
  selectAirport,
  submitImport,
  toggleTarget,
  startAnalysis,
  exportReport,
  openProtectionZonePanel,
  closeProtectionZonePanel,
  toggleProtectionZoneAirportVisibility,
  toggleProtectionZoneStationVisibility,
  toggleProtectionZoneVisibility,
  flyToProtectionZone,
} = useWorkflowActions()
const {
  state: dataManagementState,
  loadAirportPage,
  loadRunwayPage,
  loadStationPage,
  openDataManagement,
  closeDataManagement,
  setAirportKeyword,
  setAirportHasCoordinates,
  changeAirportPage,
  changeAirportPageSize,
  setRunwayAirportId,
  setRunwayKeyword,
  setRunwayRunNumber,
  changeRunwayPage,
  changeRunwayPageSize,
  setStationAirportId,
  setStationType,
  setStationKeyword,
  setStationRunwayNo,
  changeStationPage,
  changeStationPageSize,
  openRunwayCreateDialog,
  openRunwayEditDialog,
  closeRunwayFormDialog,
  saveRunwayDraft,
  openRunwayDeleteConfirm,
  closeRunwayDeleteConfirm,
  confirmRunwayDelete,
  openStationCreateDialog,
  openStationEditDialog,
  closeStationFormDialog,
  saveStationDraft,
  openStationDeleteConfirm,
  closeStationDeleteConfirm,
  confirmStationDelete,
  openAirportCreateDialog,
  openAirportEditDialog,
  openAirportDetailDialog,
  closeAirportFormDialog,
  saveAirportDraft,
  openAirportDeleteConfirm,
  closeAirportDeleteConfirm,
  confirmAirportDelete,
  openRunwayDetailDialog,
  openStationDetailDialog,
  setActiveTab,
  setObstacleProjectId,
  setObstacleKeyword,
  setObstacleType,
  changeObstaclePage,
  changeObstaclePageSize,
  openObstacleDeleteConfirm,
  closeObstacleDeleteConfirm,
  confirmObstacleDelete,
  openObstacleDetailDialog,
  closeObstacleDetailDialog,
} = useDataManagement({
  onRefreshBootstrap: async () => {
    await bootstrap()
  },
})

onMounted(() => {
  void bootstrap()
})

// 打开单入口分析弹窗。
function handleOpenAnalysis(mode: ObstacleAnalysisMode) {
  openModal(mode)
}

// 递增复位计数，通知地图执行一次复位飞行。
function handleReset() {
  resetTick.value += 1
}

function handleTopDown() {
  topDownTick.value += 1
}

// 关闭单入口分析弹窗。
function handleCloseAnalysis() {
  closeModal()
}

// 打开数据管理弹窗。
function handleOpenDataManagement() {
  openDataManagement()
}

// 关闭数据管理弹窗。
function handleCloseDataManagement() {
  closeDataManagement()
}

// 切换数据管理标签页。
function handleSwitchDataManagementTab(tab: 'airports' | 'runways' | 'stations' | 'obstacles') {
  setActiveTab(tab)
}

function handleSetAirportKeyword(keyword: string) {
  void setAirportKeyword(keyword)
}

function handleSetAirportHasCoordinates(hasCoordinates: boolean) {
  void setAirportHasCoordinates(hasCoordinates)
}

function handleChangeAirportPage(page: number) {
  void changeAirportPage(page)
}

function handleChangeAirportPageSize(pageSize: number) {
  void changeAirportPageSize(pageSize)
}

function handleSetRunwayAirportId(airportId: string) {
  void setRunwayAirportId(airportId)
}

function handleSetRunwayKeyword(keyword: string) {
  void setRunwayKeyword(keyword)
}

function handleSetRunwayRunNumber(runNumber: string) {
  void setRunwayRunNumber(runNumber)
}

function handleChangeRunwayPage(page: number) {
  void changeRunwayPage(page)
}

function handleChangeRunwayPageSize(pageSize: number) {
  void changeRunwayPageSize(pageSize)
}

function handleSetStationAirportId(airportId: string) {
  void setStationAirportId(airportId)
}

function handleSetStationType(stationType: string) {
  void setStationType(stationType)
}

function handleSetStationKeyword(keyword: string) {
  void setStationKeyword(keyword)
}

function handleSetStationRunwayNo(runwayNo: string) {
  void setStationRunwayNo(runwayNo)
}

function handleChangeStationPage(page: number) {
  void changeStationPage(page)
}

function handleChangeStationPageSize(pageSize: number) {
  void changeStationPageSize(pageSize)
}

function handleOpenRunwayCreateDialog() {
  openRunwayCreateDialog()
}

function handleOpenRunwayEditDialog(runwayId: string) {
  void openRunwayEditDialog(runwayId)
}

function handleCloseRunwayFormDialog() {
  closeRunwayFormDialog()
}

function handleSaveRunwayDraft(value: RunwayPayload) {
  void saveRunwayDraft(value)
}

function handleOpenRunwayDeleteConfirm(runwayId: string) {
  const runway = dataManagementState.runways.items.find((item) => item.id === runwayId)

  if (!runway) {
    return
  }

  openRunwayDeleteConfirm(runway)
}

function handleCloseRunwayDeleteConfirm() {
  closeRunwayDeleteConfirm()
}

function handleConfirmRunwayDelete() {
  void confirmRunwayDelete()
}

function handleOpenStationCreateDialog() {
  openStationCreateDialog()
}

function handleOpenStationEditDialog(stationId: string) {
  void openStationEditDialog(stationId)
}

function handleCloseStationFormDialog() {
  closeStationFormDialog()
}

function handleSaveStationDraft(value: StationPayload) {
  void saveStationDraft(value)
}

function handleOpenStationDeleteConfirm(stationId: string) {
  const station = dataManagementState.stations.items.find((item) => item.id === stationId)

  if (!station) {
    return
  }

  openStationDeleteConfirm(station)
}

function handleCloseStationDeleteConfirm() {
  closeStationDeleteConfirm()
}

function handleConfirmStationDelete() {
  void confirmStationDelete()
}

function handleOpenAirportCreateDialog() {
  openAirportCreateDialog()
}

function handleOpenAirportEditDialog(airportId: string) {
  void openAirportEditDialog(airportId)
}

function handleOpenAirportDetailDialog(airport: AirportListItem) {
  openAirportDetailDialog(airport)
}

function handleOpenRunwayDetailDialog(runway: RunwayListItem) {
  openRunwayDetailDialog(runway)
}

function handleOpenStationDetailDialog(station: StationListItem) {
  openStationDetailDialog(station)
}

function handleCloseAirportFormDialog() {
  closeAirportFormDialog()
}

function handleSaveAirportDraft(value: AirportFormValue) {
  saveAirportDraft(value)
}

function handleOpenAirportDeleteConfirm(airportId: string) {
  const airport = dataManagementState.airports.items.find((item) => item.id === airportId)

  if (!airport) {
    return
  }

  openAirportDeleteConfirm(airport)
}

function handleCloseAirportDeleteConfirm() {
  closeAirportDeleteConfirm()
}

function handleConfirmAirportDelete() {
  void confirmAirportDelete()
}

async function handleImportAirports() {
  if (dataManagementState.activeTab === 'airports') {
    await loadAirportPage()
  } else if (dataManagementState.activeTab === 'runways') {
    await loadRunwayPage()
  } else {
    await loadStationPage()
  }
  await bootstrap()
}

// 打开当前机场选择面板。
function handleOpenStationPanel() {
  openStationPanel()
}

// 关闭当前机场选择面板。
function handleCloseStationPanel() {
  closeStationPanel()
}

// 切换当前选中的机场，并同步地图上下文。
function handleSelectAirport(airportId: string) {
  selectAirport(airportId)
}

// 提交导入表单并启动导入工作流。
function handleSubmitImport(formValue: ImportFormValue) {
  void submitImport(formValue)
}

// 切换候选分析对象的勾选状态。
function handleToggleTarget(targetId: string) {
  toggleTarget(targetId)
}

// 切换指定机场下全部保护区的显示状态。
function handleToggleProtectionZoneAirport(airportId: string, visible: boolean) {
  toggleProtectionZoneAirportVisibility(airportId, visible)
}

// 切换指定台站下全部保护区的显示状态。
function handleToggleProtectionZoneStation(airportId: string, stationId: string, visible: boolean) {
  toggleProtectionZoneStationVisibility(airportId, stationId, visible)
}

// 切换单个保护区节点的显示状态。
function handleToggleProtectionZone(
  airportId: string,
  stationId: string,
  zoneCode: string,
  visible: boolean,
) {
  toggleProtectionZoneVisibility(airportId, stationId, zoneCode, visible)
}

// 启动分析任务并等待结果回写到状态。
function handleStartAnalysis() {
  void startAnalysis()
}

// 触发当前分析结果的 Word 导出。
function handleExportReport(targetId: number) {
  void exportReport(targetId)
}

// 飞行到指定保护区的几何中心。
function handleFlyToProtectionZone(zone: ProtectionZoneNode) {
  flyToProtectionZone(zone)
}

function handleSetObstacleProjectId(projectId: string) {
  void setObstacleProjectId(projectId)
}

function handleSetObstacleKeyword(keyword: string) {
  void setObstacleKeyword(keyword)
}

function handleSetObstacleType(obstacleType: string) {
  void setObstacleType(obstacleType)
}

function handleChangeObstaclePage(page: number) {
  void changeObstaclePage(page)
}

function handleChangeObstaclePageSize(pageSize: number) {
  void changeObstaclePageSize(pageSize)
}

function handleOpenObstacleDetailDialog(item: ObstacleListItem) {
  openObstacleDetailDialog(item)
}

function handleCloseObstacleDetailDialog() {
  closeObstacleDetailDialog()
}

function handleOpenObstacleDeleteConfirm(item: ObstacleListItem) {
  openObstacleDeleteConfirm(item)
}

function handleCloseObstacleDeleteConfirm() {
  closeObstacleDeleteConfirm()
}

function handleConfirmObstacleDelete() {
  void confirmObstacleDelete()
}

function handleLocateObstacle(item: ObstacleListItem) {
  if (!item.geometry) return

  let longitude: number
  let latitude: number

  if (item.geometry.type === 'Point') {
    longitude = item.geometry.coordinates[0]
    latitude = item.geometry.coordinates[1]
  } else if (item.geometry.type === 'MultiPolygon') {
    const ring = item.geometry.coordinates[0]?.[0]
    if (!ring || ring.length === 0) return
    let sumLon = 0
    let sumLat = 0
    for (const [lon, lat] of ring) {
      sumLon += lon
      sumLat += lat
    }
    longitude = sumLon / ring.length
    latitude = sumLat / ring.length
  } else {
    return
  }

  state.flyToTargetPayload = {
    longitude,
    latitude,
    height: (item.topElevation ?? 0) + 500,
    pitch: -90,
  }
  state.flyToTargetTick += 1
}

function handleLocateStation(station: StationListItem) {
  if (station.longitude === null || station.latitude === null) return

  state.flyToTargetPayload = {
    longitude: station.longitude,
    latitude: station.latitude,
    height: (station.altitude ?? 0) + 500,
    pitch: -90,
  }
  state.flyToTargetTick += 1
}
</script>

<template>
  <AppShell
    :analysis-state="state"
    :data-management-state="dataManagementState"
    :reset-tick="resetTick"
    :top-down-tick="topDownTick"
    :rendered-obstacles="state.renderedObstacles"
    :initial-camera-target="state.initialCameraTarget"
    @open-analysis="handleOpenAnalysis"
    @open-data-management="handleOpenDataManagement"
    @switch-data-management-tab="handleSwitchDataManagementTab"
    @set-airport-keyword="handleSetAirportKeyword"
    @set-airport-has-coordinates="handleSetAirportHasCoordinates"
    @change-airport-page="handleChangeAirportPage"
    @change-airport-page-size="handleChangeAirportPageSize"
    @set-runway-airport-id="handleSetRunwayAirportId"
    @set-runway-keyword="handleSetRunwayKeyword"
    @set-runway-run-number="handleSetRunwayRunNumber"
    @change-runway-page="handleChangeRunwayPage"
    @change-runway-page-size="handleChangeRunwayPageSize"
    @set-station-airport-id="handleSetStationAirportId"
    @set-station-type="handleSetStationType"
    @set-station-keyword="handleSetStationKeyword"
    @set-station-runway-no="handleSetStationRunwayNo"
    @change-station-page="handleChangeStationPage"
    @change-station-page-size="handleChangeStationPageSize"
    @open-runway-create-dialog="handleOpenRunwayCreateDialog"
    @open-runway-edit-dialog="handleOpenRunwayEditDialog"
    @close-runway-form-dialog="handleCloseRunwayFormDialog"
    @save-runway-draft="handleSaveRunwayDraft"
    @open-runway-delete-confirm="handleOpenRunwayDeleteConfirm"
    @close-runway-delete-confirm="handleCloseRunwayDeleteConfirm"
    @confirm-runway-delete="handleConfirmRunwayDelete"
    @open-station-create-dialog="handleOpenStationCreateDialog"
    @open-station-edit-dialog="handleOpenStationEditDialog"
    @close-station-form-dialog="handleCloseStationFormDialog"
    @save-station-draft="handleSaveStationDraft"
    @open-station-delete-confirm="handleOpenStationDeleteConfirm"
    @close-station-delete-confirm="handleCloseStationDeleteConfirm"
    @confirm-station-delete="handleConfirmStationDelete"
    @set-obstacle-project-id="handleSetObstacleProjectId"
    @set-obstacle-keyword="handleSetObstacleKeyword"
    @set-obstacle-type="handleSetObstacleType"
    @change-obstacle-page="handleChangeObstaclePage"
    @change-obstacle-page-size="handleChangeObstaclePageSize"
    @open-obstacle-detail-dialog="handleOpenObstacleDetailDialog"
    @open-obstacle-delete-confirm="handleOpenObstacleDeleteConfirm"
    @close-obstacle-detail-dialog="handleCloseObstacleDetailDialog"
    @close-obstacle-delete-confirm="handleCloseObstacleDeleteConfirm"
    @confirm-obstacle-delete="handleConfirmObstacleDelete"
    @locate-obstacle="handleLocateObstacle"
    @open-airport-create-dialog="handleOpenAirportCreateDialog"
    @open-airport-edit-dialog="handleOpenAirportEditDialog"
    @open-airport-detail-dialog="handleOpenAirportDetailDialog"
    @open-runway-detail-dialog="handleOpenRunwayDetailDialog"
    @open-station-detail-dialog="handleOpenStationDetailDialog"
    @locate-station="handleLocateStation"
    @close-airport-form-dialog="handleCloseAirportFormDialog"
    @save-airport-draft="handleSaveAirportDraft"
    @open-airport-delete-confirm="handleOpenAirportDeleteConfirm"
    @close-airport-delete-confirm="handleCloseAirportDeleteConfirm"
    @confirm-airport-delete="handleConfirmAirportDelete"
    @import-airports="handleImportAirports"
    @reset="handleReset"
    @top-down="handleTopDown"
    @close-analysis="handleCloseAnalysis"
    @close-data-management="handleCloseDataManagement"
    @open-station-panel="handleOpenStationPanel"
    @close-station-panel="handleCloseStationPanel"
    @select-airport="handleSelectAirport"
    @submit-import="handleSubmitImport"
    @toggle-target="handleToggleTarget"
    @set-airport-protection-zone-visibility="handleToggleProtectionZoneAirport"
    @set-station-protection-zone-visibility="handleToggleProtectionZoneStation"
    @set-zone-protection-zone-visibility="handleToggleProtectionZone"
    @open-protection-zone-panel="openProtectionZonePanel"
    @close-protection-zone-panel="closeProtectionZonePanel"
    @start-analysis="handleStartAnalysis"
    @export-report="handleExportReport"
    @fly-to-protection-zone="handleFlyToProtectionZone"
  />
</template>
