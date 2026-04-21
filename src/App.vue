<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import { useWorkflowActions } from './composables/useWorkflowActions'
import type { ImportFormValue } from './types/tool'

const resetTick = ref(0)
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
} = useWorkflowActions()

onMounted(() => {
  void bootstrap()
})

// 打开单入口分析弹窗。
function handleOpenAnalysis() {
  openModal()
}

// 递增复位计数，通知地图执行一次复位飞行。
function handleReset() {
  resetTick.value += 1
}

// 关闭单入口分析弹窗。
function handleCloseAnalysis() {
  closeModal()
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
function handleExportReport() {
  void exportReport()
}
</script>

<template>
  <AppShell
    :analysis-state="state"
    :reset-tick="resetTick"
    :rendered-obstacles="state.renderedObstacles"
    :initial-camera-target="state.initialCameraTarget"
    @open-analysis="handleOpenAnalysis"
    @reset="handleReset"
    @close-analysis="handleCloseAnalysis"
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
  />
</template>
