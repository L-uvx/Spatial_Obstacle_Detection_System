<script setup lang="ts">
import CesiumViewer from '../map/CesiumViewer.vue'
import DataManagementModal from '../panel/DataManagementModal.vue'
import SidePanel from '../panel/SidePanel.vue'
import PolygonObstacleAnalysisModal from '../panel/PolygonObstacleAnalysisModal.vue'
import TopToolbar from '../toolbar/TopToolbar.vue'
import type {
  ImportFormValue,
  InitialCameraTarget,
  ObstacleAnalysisMode,
  PolygonObstacleAnalysisState,
  ProtectionZoneNode,
  RenderedObstacle,
} from '../../types/tool'
import AirportSearchSelect from '../common/AirportSearchSelect.vue'
import type { AirportFormValue, DataManagementState } from '../../composables/useDataManagement'
import type { AirportListItem, ObstacleListItem, RunwayListItem, RunwayPayload, StationListItem, StationPayload } from '../../types/dataManagement'

const props = defineProps<{
  analysisState: PolygonObstacleAnalysisState
  dataManagementState: DataManagementState
  resetTick: number
  topDownTick?: number
  renderedObstacles: RenderedObstacle[]
  initialCameraTarget: InitialCameraTarget | null
}>()

const emit = defineEmits<{
  openAnalysis: [mode: ObstacleAnalysisMode]
  openDataManagement: []
  switchDataManagementTab: [tab: DataManagementState['activeTab']]
  reset: []
  topDown: []
  closeAnalysis: []
  closeDataManagement: []
  setAirportKeyword: [keyword: string]
  setAirportHasCoordinates: [hasCoordinates: boolean]
  changeAirportPage: [page: number]
  changeAirportPageSize: [pageSize: number]
  setRunwayAirportName: [airportName: string]
  setRunwayKeyword: [keyword: string]
  setRunwayRunNumber: [runNumber: string]
  changeRunwayPage: [page: number]
  changeRunwayPageSize: [pageSize: number]
  setStationAirportName: [airportName: string]
  setStationType: [stationType: string]
  setStationKeyword: [keyword: string]
  setStationRunwayNo: [runwayNo: string]
  changeStationPage: [page: number]
  changeStationPageSize: [pageSize: number]
  setObstacleProjectName: [projectName: string]
  setObstacleKeyword: [keyword: string]
  setObstacleType: [obstacleType: string]
  changeObstaclePage: [page: number]
  changeObstaclePageSize: [pageSize: number]
  openObstacleDetailDialog: [obstacle: ObstacleListItem]
  openObstacleDeleteConfirm: [obstacle: ObstacleListItem]
  closeObstacleDetailDialog: []
  closeObstacleDeleteConfirm: []
  confirmObstacleDelete: []
  locateObstacle: [obstacle: ObstacleListItem]
  setProjectName: [projectName: string]
  setProjectObstacleType: [obstacleType: string]
  setProjectStatus: [status: string]
  changeProjectPage: [page: number]
  changeProjectPageSize: [pageSize: number]
  toggleProjectExpand: [projectId: string]
  exportProjectTarget: [payload: { analysisTaskId: string; targetId: number }]
  openAirportCreateDialog: []
  openAirportEditDialog: [airportId: string]
  openAirportDetailDialog: [airport: AirportListItem]
  openRunwayCreateDialog: []
  openRunwayEditDialog: [runwayId: string]
  openRunwayDetailDialog: [runway: RunwayListItem]
  openStationDetailDialog: [station: StationListItem]
  locateStation: [station: StationListItem]
  openRunwayDeleteConfirm: [runwayId: string]
  closeRunwayFormDialog: []
  saveRunwayDraft: [value: RunwayPayload]
  closeRunwayDeleteConfirm: []
  confirmRunwayDelete: []
  openStationCreateDialog: []
  openStationEditDialog: [stationId: string]
  openStationDeleteConfirm: [stationId: string]
  closeStationFormDialog: []
  saveStationDraft: [value: StationPayload]
  closeStationDeleteConfirm: []
  confirmStationDelete: []
  closeAirportFormDialog: []
  saveAirportDraft: [value: AirportFormValue]
  openAirportDeleteConfirm: [airportId: string]
  closeAirportDeleteConfirm: []
  confirmAirportDelete: []
  importAirports: []
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
  exportReport: [targetId: number]
  flyToProtectionZone: [zone: ProtectionZoneNode]
}>()

// 转发机场级保护区显隐切换事件。
function handleToggleProtectionZoneAirport(airportId: string, visible: boolean) {
  emit('setAirportProtectionZoneVisibility', airportId, visible)
}

// 转发台站级保护区显隐切换事件。
function handleToggleProtectionZoneStation(airportId: string, stationId: string, visible: boolean) {
  emit('setStationProtectionZoneVisibility', airportId, stationId, visible)
}

// 转发单个保护区节点的显隐切换事件。
function handleToggleProtectionZone(
  airportId: string,
  stationId: string,
  zoneCode: string,
  visible: boolean,
) {
  emit('setZoneProtectionZoneVisibility', airportId, stationId, zoneCode, visible)
}

// 根据当前状态切换保护区侧边栏的开关。
function handleProtectionZonePanelToggle() {
  if (props.analysisState.protectionZonePanelOpen) {
    emit('closeProtectionZonePanel')
    return
  }

  if (props.analysisState.stationPanelOpen) {
    emit('closeStationPanel')
  }

  emit('openProtectionZonePanel')
}

// 读取当前选中机场的展示名称。
function getCurrentAirportLabel() {
  const selectedAirport = props.analysisState.airports.find(
    (airport) => airport.id === props.analysisState.selectedAirportId,
  )

  return selectedAirport?.name ?? '暂无数据'
}

// 根据当前状态切换机场选择浮层的开关。
function handleStationPanelToggle() {
  if (props.analysisState.stationPanelOpen) {
    emit('closeStationPanel')
    return
  }

  if (props.analysisState.protectionZonePanelOpen) {
    emit('closeProtectionZonePanel')
  }

  emit('openStationPanel')
}

function handleAirportSelected(airportId: string) {
  emit('selectAirport', airportId)
  emit('closeStationPanel')
}
</script>

<template>
  <div class="app-shell">
    <TopToolbar
      @open-analysis="emit('openAnalysis', $event)"
      @open-data-management="emit('openDataManagement')"
      @reset="emit('reset')"
      @top-down="emit('topDown')"
    />
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
          <div
            v-if="analysisState.airports.length > 0"
            class="app-shell__station-field"
          >
            <div class="app-shell__station-popover-header">
              <span class="app-shell__station-popover-title">切换机场</span>
              <button
                type="button"
                class="app-shell__station-popover-close"
                data-testid="station-popover-close"
                aria-label="关闭机场选择"
                @click="emit('closeStationPanel')"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <AirportSearchSelect
              :airports="analysisState.airports"
              :model-value="analysisState.selectedAirportId"
              @update:model-value="handleAirportSelected"
            />
          </div>
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
        @export-report="emit('exportReport', $event)"
      />
      <DataManagementModal
        :state="dataManagementState"
        @close="emit('closeDataManagement')"
        @switch-tab="emit('switchDataManagementTab', $event)"
        @set-airport-keyword="emit('setAirportKeyword', $event)"
        @set-airport-has-coordinates="emit('setAirportHasCoordinates', $event)"
        @change-airport-page="emit('changeAirportPage', $event)"
        @change-airport-page-size="emit('changeAirportPageSize', $event)"
        @set-runway-airport-name="emit('setRunwayAirportName', $event)"
        @set-runway-keyword="emit('setRunwayKeyword', $event)"
        @set-runway-run-number="emit('setRunwayRunNumber', $event)"
        @change-runway-page="emit('changeRunwayPage', $event)"
        @change-runway-page-size="emit('changeRunwayPageSize', $event)"
        @set-station-airport-name="emit('setStationAirportName', $event)"
        @set-station-type="emit('setStationType', $event)"
        @set-station-keyword="emit('setStationKeyword', $event)"
        @set-station-runway-no="emit('setStationRunwayNo', $event)"
        @change-station-page="emit('changeStationPage', $event)"
        @change-station-page-size="emit('changeStationPageSize', $event)"
        @set-obstacle-project-name="emit('setObstacleProjectName', $event)"
        @set-obstacle-keyword="emit('setObstacleKeyword', $event)"
        @set-obstacle-type="emit('setObstacleType', $event)"
        @change-obstacle-page="emit('changeObstaclePage', $event)"
        @change-obstacle-page-size="emit('changeObstaclePageSize', $event)"
        @open-obstacle-detail-dialog="emit('openObstacleDetailDialog', $event)"
        @open-obstacle-delete-confirm="emit('openObstacleDeleteConfirm', $event)"
        @close-obstacle-detail-dialog="emit('closeObstacleDetailDialog')"
        @close-obstacle-delete-confirm="emit('closeObstacleDeleteConfirm')"
        @confirm-obstacle-delete="emit('confirmObstacleDelete')"
        @locate-obstacle="emit('locateObstacle', $event)"
        @set-project-name="emit('setProjectName', $event)"
        @set-project-obstacle-type="emit('setProjectObstacleType', $event)"
        @set-project-status="emit('setProjectStatus', $event)"
        @change-project-page="emit('changeProjectPage', $event)"
        @change-project-page-size="emit('changeProjectPageSize', $event)"
        @toggle-project-expand="emit('toggleProjectExpand', $event)"
        @export-project-target="emit('exportProjectTarget', $event)"
        @open-station-create-dialog="emit('openStationCreateDialog')"
        @open-station-edit-dialog="emit('openStationEditDialog', $event)"
        @open-station-delete-confirm="emit('openStationDeleteConfirm', $event)"
        @close-station-form-dialog="emit('closeStationFormDialog')"
        @save-station-draft="emit('saveStationDraft', $event)"
        @close-station-delete-confirm="emit('closeStationDeleteConfirm')"
        @confirm-station-delete="emit('confirmStationDelete')"
        @open-airport-detail-dialog="emit('openAirportDetailDialog', $event)"
        @open-runway-detail-dialog="emit('openRunwayDetailDialog', $event)"
        @open-station-detail-dialog="emit('openStationDetailDialog', $event)"
        @locate-station="emit('locateStation', $event)"
        @open-runway-create-dialog="emit('openRunwayCreateDialog')"
        @open-runway-edit-dialog="emit('openRunwayEditDialog', $event)"
        @open-runway-delete-confirm="emit('openRunwayDeleteConfirm', $event)"
        @close-runway-form-dialog="emit('closeRunwayFormDialog')"
        @save-runway-draft="emit('saveRunwayDraft', $event)"
        @close-runway-delete-confirm="emit('closeRunwayDeleteConfirm')"
        @confirm-runway-delete="emit('confirmRunwayDelete')"
        @open-airport-create-dialog="emit('openAirportCreateDialog')"
        @open-airport-edit-dialog="emit('openAirportEditDialog', $event)"
        @close-airport-form-dialog="emit('closeAirportFormDialog')"
        @save-airport-draft="emit('saveAirportDraft', $event)"
        @open-airport-delete-confirm="emit('openAirportDeleteConfirm', $event)"
        @close-airport-delete-confirm="emit('closeAirportDeleteConfirm')"
        @confirm-airport-delete="emit('confirmAirportDelete')"
        @import-airports="emit('importAirports')"
      />
      <CesiumViewer
        :reset-tick="resetTick"
        :obstacles="renderedObstacles"
        :visible-stations="analysisState.visibleStations"
        :initial-camera-target="initialCameraTarget"
        :loaded-protection-zones="analysisState.loadedProtectionZones"
        :visible-protection-zones="analysisState.visibleProtectionZones"
        :fly-to-target-tick="analysisState.flyToTargetTick"
        :fly-to-target-payload="analysisState.flyToTargetPayload"
        :selected-airport-id="analysisState.selectedAirportId"
        :obstacle-rebuild-tick="analysisState.obstacleRebuildTick"
        :top-down-tick="topDownTick"
        class="app-shell__map"
      />
      <SidePanel
        :state="analysisState"
        :is-open="analysisState.protectionZonePanelOpen"
        @close="emit('closeProtectionZonePanel')"
        @set-airport-protection-zone-visibility="handleToggleProtectionZoneAirport"
        @set-station-protection-zone-visibility="handleToggleProtectionZoneStation"
        @set-zone-protection-zone-visibility="handleToggleProtectionZone"
        @fly-to-zone="(zone) => emit('flyToProtectionZone', zone)"
      />
    </div>
  </div>
</template>
