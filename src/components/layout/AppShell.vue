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
  openStationPanel: []
  closeStationPanel: []
  selectAirport: [airportId: string]
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

function getCurrentAirportLabel() {
  const selectedAirport = props.analysisState.airports.find(
    (airport) => airport.id === props.analysisState.selectedAirportId,
  )

  return selectedAirport?.name ?? '暂无数据'
}

function handleStationPanelToggle() {
  if (props.analysisState.stationPanelOpen) {
    emit('closeStationPanel')
    return
  }

  emit('openStationPanel')
}

function handleSelectAirport(event: Event) {
  const target = event.target as HTMLSelectElement | null

  if (!target) {
    return
  }

  emit('selectAirport', target.value)
}
</script>

<template>
  <div class="app-shell">
    <TopToolbar @open-analysis="emit('openAnalysis')" @reset="emit('reset')" />
    <div class="app-shell__top-right-controls">
      <div class="app-shell__station-selector">
        <button
          type="button"
          class="app-shell__station-toggle"
          data-testid="station-panel-toggle"
          @click="handleStationPanelToggle"
        >
          当前机场：{{ getCurrentAirportLabel() }}
        </button>

        <div
          v-if="analysisState.stationPanelOpen"
          class="app-shell__station-popover"
          data-testid="station-panel-popover"
        >
          <label
            v-if="analysisState.airports.length > 0"
            class="app-shell__station-field"
          >
            <span>切换机场</span>
            <select
              class="app-shell__station-select"
              data-testid="station-airport-select"
              :value="analysisState.selectedAirportId"
              @change="handleSelectAirport"
            >
              <option
                v-for="airport in analysisState.airports"
                :key="airport.id"
                :value="airport.id"
              >
                {{ airport.name }}
              </option>
            </select>
          </label>
          <p v-else class="app-shell__station-empty">暂无可选机场</p>
        </div>
      </div>
      <button
        type="button"
        class="app-shell__panel-toggle"
        data-testid="protection-zone-panel-toggle"
        @click="handleProtectionZonePanelToggle"
      >
        {{ analysisState.protectionZonePanelOpen ? '隐藏保护区面板' : '打开保护区面板' }}
      </button>
    </div>

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
        :visible-stations="analysisState.visibleStations"
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
