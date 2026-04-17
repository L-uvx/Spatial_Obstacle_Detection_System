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

function handleOpenAnalysis() {
  openModal()
}

function handleReset() {
  resetTick.value += 1
}

function handleCloseAnalysis() {
  closeModal()
}

function handleOpenStationPanel() {
  openStationPanel()
}

function handleCloseStationPanel() {
  closeStationPanel()
}

function handleSelectAirport(airportId: string) {
  selectAirport(airportId)
}

function handleSubmitImport(formValue: ImportFormValue) {
  void submitImport(formValue)
}

function handleToggleTarget(targetId: string) {
  toggleTarget(targetId)
}

function handleToggleProtectionZoneAirport(airportId: string, visible: boolean) {
  toggleProtectionZoneAirportVisibility(airportId, visible)
}

function handleToggleProtectionZoneStation(airportId: string, stationId: string, visible: boolean) {
  toggleProtectionZoneStationVisibility(airportId, stationId, visible)
}

function handleToggleProtectionZone(
  airportId: string,
  stationId: string,
  zoneCode: string,
  visible: boolean,
) {
  toggleProtectionZoneVisibility(airportId, stationId, zoneCode, visible)
}

function handleStartAnalysis() {
  void startAnalysis()
}

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
