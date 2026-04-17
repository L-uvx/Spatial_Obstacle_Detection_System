<script setup lang="ts">
import CesiumViewer from '../map/CesiumViewer.vue'
import SidePanel from '../panel/SidePanel.vue'
import PolygonObstacleAnalysisModal from '../panel/PolygonObstacleAnalysisModal.vue'
import TopToolbar from '../toolbar/TopToolbar.vue'
import type {
  ImportFormValue,
  InitialCameraTarget,
  PolygonObstacleAnalysisState,
  RenderedObstacle,
} from '../../types/tool'

const props = defineProps<{
  analysisState: PolygonObstacleAnalysisState
  resetTick: number
  renderedObstacles: RenderedObstacle[]
  initialCameraTarget: InitialCameraTarget | null
}>()

const emit = defineEmits<{
  openAnalysis: []
  reset: []
  closeAnalysis: []
  submitImport: [formValue: ImportFormValue]
  toggleTarget: [targetId: string]
  setAirportProtectionZoneVisibility: [airportId: string, visible: boolean]
  setStationProtectionZoneVisibility: [airportId: string, stationId: string, visible: boolean]
  setZoneProtectionZoneVisibility: [airportId: string, stationId: string, zoneCode: string, visible: boolean]
  openProtectionZonePanel: []
  closeProtectionZonePanel: []
  startAnalysis: []
  exportReport: []
}>()

function handleToggleProtectionZoneAirport(airportId: string, visible: boolean) {
  emit('setAirportProtectionZoneVisibility', airportId, visible)
}

function handleToggleProtectionZoneStation(airportId: string, stationId: string, visible: boolean) {
  emit('setStationProtectionZoneVisibility', airportId, stationId, visible)
}

function handleToggleProtectionZone(
  airportId: string,
  stationId: string,
  zoneCode: string,
  visible: boolean,
) {
  emit('setZoneProtectionZoneVisibility', airportId, stationId, zoneCode, visible)
}

function handleProtectionZonePanelToggle() {
  if (props.analysisState.protectionZonePanelOpen) {
    emit('closeProtectionZonePanel')
    return
  }

  emit('openProtectionZonePanel')
}
</script>

<template>
  <div class="app-shell">
    <TopToolbar @open-analysis="emit('openAnalysis')" @reset="emit('reset')" />
    <button
      type="button"
      class="app-shell__panel-toggle"
      data-testid="protection-zone-panel-toggle"
      @click="handleProtectionZonePanelToggle"
    >
      {{ analysisState.protectionZonePanelOpen ? '隐藏保护区面板' : '打开保护区面板' }}
    </button>

    <div class="app-shell__body">
      <PolygonObstacleAnalysisModal
        :state="analysisState"
        @close="emit('closeAnalysis')"
        @submit-import="emit('submitImport', $event)"
        @toggle-target="emit('toggleTarget', $event)"
        @set-airport-protection-zone-visibility="handleToggleProtectionZoneAirport"
        @set-station-protection-zone-visibility="handleToggleProtectionZoneStation"
        @set-zone-protection-zone-visibility="handleToggleProtectionZone"
        @start-analysis="emit('startAnalysis')"
        @export-report="emit('exportReport')"
      />
      <CesiumViewer
        :reset-tick="resetTick"
        :obstacles="renderedObstacles"
        :initial-camera-target="initialCameraTarget"
        :visible-protection-zones="analysisState.visibleProtectionZones"
        :protection-zone-sampling="analysisState.protectionZoneSampling"
        class="app-shell__map"
      />
      <SidePanel
        :state="analysisState"
        :is-open="analysisState.protectionZonePanelOpen"
        @close="emit('closeProtectionZonePanel')"
        @set-airport-protection-zone-visibility="handleToggleProtectionZoneAirport"
        @set-station-protection-zone-visibility="handleToggleProtectionZoneStation"
        @set-zone-protection-zone-visibility="handleToggleProtectionZone"
      />
    </div>
  </div>
</template>
