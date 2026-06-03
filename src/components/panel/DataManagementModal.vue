<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AirportFormDialog from '../data-management/AirportFormDialog.vue'
import { importAirports } from '../../services/dataManagement'
import type { ImportAirportItem } from '../../types/dataManagement'
import AirportTable from '../data-management/AirportTable.vue'
import RunwayFormDialog from '../data-management/RunwayFormDialog.vue'
import StationFormDialog from '../data-management/StationFormDialog.vue'
import RunwayTable from '../data-management/RunwayTable.vue'
import StationTable from '../data-management/StationTable.vue'
import ObstacleTable from '../data-management/ObstacleTable.vue'
import ObstacleDetailDialog from '../data-management/ObstacleDetailDialog.vue'
import ProjectTable from '../data-management/ProjectTable.vue'
import type { AirportFormValue, DataManagementState } from '../../composables/useDataManagement'
import type { AirportListItem, ObstacleListItem, RunwayListItem, RunwayPayload, StationListItem, StationPayload } from '../../types/dataManagement'

const props = defineProps<{
  state: DataManagementState
}>()

function getActiveWarnings() {
  if (props.state.activeTab === 'airports') {
    return props.state.airports.warnings
  }

  if (props.state.activeTab === 'runways') {
    return props.state.runways.warnings
  }

  if (props.state.activeTab === 'stations') {
    return props.state.stations.warnings
  }

  return props.state.obstacles.warnings
}

function getActivePager() {
  if (props.state.activeTab === 'airports') {
    return props.state.airports
  }

  if (props.state.activeTab === 'runways') {
    return props.state.runways
  }

  if (props.state.activeTab === 'stations') {
    return props.state.stations
  }

  if (props.state.activeTab === 'projects') {
    return props.state.projects
  }

  return props.state.obstacles
}

function getPagerSummary() {
  const p = getActivePager()

  if (p.total === 0) {
    return '共 0 条'
  }

  const start = (p.page - 1) * p.pageSize + 1
  const end = Math.min(p.page * p.pageSize, p.total)
  return `第 ${start}-${end} 条，共 ${p.total} 条`
}

function getTotalPages() {
  const p = getActivePager()

  if (p.total === 0) {
    return 0
  }

  return Math.ceil(p.total / p.pageSize)
}

function handlePreviousPage() {
  const p = getActivePager()

  if (p.page <= 1) {
    return
  }

  const nextPage = p.page - 1

  if (props.state.activeTab === 'airports') {
    emit('changeAirportPage', nextPage)
  } else if (props.state.activeTab === 'runways') {
    emit('changeRunwayPage', nextPage)
  } else if (props.state.activeTab === 'stations') {
    emit('changeStationPage', nextPage)
  } else if (props.state.activeTab === 'projects') {
    emit('changeProjectPage', nextPage)
  } else {
    emit('changeObstaclePage', nextPage)
  }
}

function handleNextPage() {
  const p = getActivePager()
  const totalPages = getTotalPages()

  if (totalPages === 0 || p.page >= totalPages) {
    return
  }

  const nextPage = p.page + 1

  if (props.state.activeTab === 'airports') {
    emit('changeAirportPage', nextPage)
  } else if (props.state.activeTab === 'runways') {
    emit('changeRunwayPage', nextPage)
  } else if (props.state.activeTab === 'stations') {
    emit('changeStationPage', nextPage)
  } else if (props.state.activeTab === 'projects') {
    emit('changeProjectPage', nextPage)
  } else {
    emit('changeObstaclePage', nextPage)
  }
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement | null

  if (!target) {
    return
  }

  if (props.state.activeTab === 'airports') {
    emit('changeAirportPageSize', Number(target.value))
  } else if (props.state.activeTab === 'runways') {
    emit('changeRunwayPageSize', Number(target.value))
  } else if (props.state.activeTab === 'stations') {
    emit('changeStationPageSize', Number(target.value))
  } else if (props.state.activeTab === 'projects') {
    emit('changeProjectPageSize', Number(target.value))
  } else {
    emit('changeObstaclePageSize', Number(target.value))
  }
}

const emit = defineEmits<{
  close: []
  switchTab: [tab: DataManagementState['activeTab']]
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
  openRunwayCreateDialog: []
  openRunwayEditDialog: [runwayId: string]
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
  openAirportCreateDialog: []
  openAirportEditDialog: [airportId: string]
  openAirportDetailDialog: [airport: AirportListItem]
  closeAirportFormDialog: []
  saveAirportDraft: [value: AirportFormValue]
  openAirportDeleteConfirm: [airportId: string]
  closeAirportDeleteConfirm: []
  confirmAirportDelete: []
  openRunwayDetailDialog: [runway: RunwayListItem]
  openStationDetailDialog: [station: StationListItem]
  locateStation: [station: StationListItem]
  importAirports: []
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
}>()

const importFileInput = ref<HTMLInputElement | null>(null)
const fileImportInput = ref<HTMLInputElement | null>(null)
const showImportDropdown = ref(false)
const importing = ref(false)
const importResultItems = ref<ImportAirportItem[]>([])
const importResultTotalFiles = ref(0)
const importResultImportedCount = ref(0)
const importResultSkippedCount = ref(0)
const showImportResultDialog = ref(false)

function handleImportBtnClick() {
  showImportDropdown.value = !showImportDropdown.value
}

function handleSelectFolder() {
  showImportDropdown.value = false
  importFileInput.value?.click()
}

function handleSelectFile() {
  showImportDropdown.value = false
  fileImportInput.value?.click()
}

function handleImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  if (!input?.files || input.files.length === 0) {
    return
  }

  const files = Array.from(input.files)
  importing.value = true

  importAirports(files)
    .then((result) => {
      importResultItems.value = result.items
      importResultTotalFiles.value = result.totalFiles
      importResultImportedCount.value = result.importedCount
      importResultSkippedCount.value = result.skippedCount
      showImportResultDialog.value = true

      if (result.importedCount > 0) {
        emit('importAirports')
      }
    })
    .catch((error) => {
      importResultTotalFiles.value = 1
      importResultImportedCount.value = 0
      importResultSkippedCount.value = 0
      importResultItems.value = [{
        fileName: '',
        status: 'error',
        airportId: null,
        airportName: null,
        runwayCount: 0,
        stationCount: 0,
        errorMessage: error instanceof Error ? error.message : '导入失败',
      }]
      showImportResultDialog.value = true
    })
    .finally(() => {
      importing.value = false
      input.value = ''
    })
}

function handleCloseImportResult() {
  showImportResultDialog.value = false
  importResultItems.value = []
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const trigger = target.closest('.data-management-modal__import-btn-wrapper')
  const dropdown = target.closest('.data-management-modal__import-dropdown')
  if (!trigger && !dropdown) {
    showImportDropdown.value = false
  }
}

function hasActiveDeleteTarget(): boolean {
  if (props.state.activeTab === 'airports') return !!props.state.airports.deleteTarget
  if (props.state.activeTab === 'runways') return !!props.state.runways.deleteTarget
  if (props.state.activeTab === 'stations') return !!props.state.stations.deleteTarget
  return !!props.state.obstacles.deleteTarget
}

function getActiveDeleteLabel(): string {
  const labels: Record<string, string> = {
    airports: '机场',
    runways: '跑道',
    stations: '台站',
    obstacles: '障碍物',
  }
  return labels[props.state.activeTab] || ''
}

function getActiveDeleteTargetName(): string {
  if (props.state.activeTab === 'airports' && props.state.airports.deleteTarget) {
    return props.state.airports.deleteTarget.name
  }
  if (props.state.activeTab === 'runways' && props.state.runways.deleteTarget) {
    return props.state.runways.deleteTarget.name
  }
  if (props.state.activeTab === 'stations' && props.state.stations.deleteTarget) {
    return props.state.stations.deleteTarget.name
  }
  if (props.state.obstacles.deleteTarget) {
    return props.state.obstacles.deleteTarget.name
  }
  return ''
}

function getActiveDeleteError(): string {
  if (props.state.activeTab === 'airports') return props.state.airports.errorMessage
  if (props.state.activeTab === 'runways') return props.state.runways.errorMessage
  if (props.state.activeTab === 'stations') return props.state.stations.errorMessage
  return props.state.obstacles.errorMessage
}

function handleCancelDelete() {
  if (props.state.activeTab === 'airports') emit('closeAirportDeleteConfirm')
  else if (props.state.activeTab === 'runways') emit('closeRunwayDeleteConfirm')
  else if (props.state.activeTab === 'stations') emit('closeStationDeleteConfirm')
  else emit('closeObstacleDeleteConfirm')
}

function handleConfirmDelete() {
  if (props.state.activeTab === 'airports') emit('confirmAirportDelete')
  else if (props.state.activeTab === 'runways') emit('confirmRunwayDelete')
  else if (props.state.activeTab === 'stations') emit('confirmStationDelete')
  else emit('confirmObstacleDelete')
}

function getActiveDeleteTestid(): string {
  const keys: Record<string, string> = {
    airports: 'confirm-airport-delete',
    runways: 'confirm-runway-delete',
    stations: 'confirm-station-delete',
    obstacles: 'confirm-obstacle-delete',
  }
  return keys[props.state.activeTab] || ''
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <section v-if="state.isOpen" class="data-management-modal" aria-label="数据管理">
    <div class="data-management-modal__card">
      <header class="data-management-modal__header">
        <h2>数据管理</h2>
        <div class="data-management-modal__header-actions">
          <input
            ref="importFileInput"
            type="file"
            multiple
            webkitdirectory
            accept=".xlsx,.xls"
            hidden
            @change="handleImportFileChange"
          >
          <input
            ref="fileImportInput"
            type="file"
            multiple
            accept=".xlsx,.xls"
            hidden
            @change="handleImportFileChange"
          >
          <div class="data-management-modal__import-btn-wrapper">
            <button
              type="button"
              class="data-management-modal__import-btn"
              :disabled="importing"
              @click="handleImportBtnClick"
            >
              {{ importing ? '导入中...' : '导入机场' }}
              <span class="data-management-modal__import-btn-arrow">&#9662;</span>
            </button>
            <div v-if="showImportDropdown" class="data-management-modal__import-dropdown">
              <button
                type="button"
                class="data-management-modal__import-dropdown-item"
                @click="handleSelectFolder"
              >
                选择文件夹
              </button>
              <button
                type="button"
                class="data-management-modal__import-dropdown-item"
                @click="handleSelectFile"
              >
                选择文件（支持多选）
              </button>
            </div>
          </div>
          <button type="button" class="data-management-modal__close" @click="emit('close')">关闭</button>
        </div>
      </header>
      <nav class="data-management-modal__tabs" aria-label="数据管理标签页">
        <button type="button" class="data-management-modal__tab" data-tab="airports" :data-active="state.activeTab === 'airports'" @click="emit('switchTab', 'airports')">
          机场管理
        </button>
        <button type="button" class="data-management-modal__tab" data-tab="runways" :data-active="state.activeTab === 'runways'" @click="emit('switchTab', 'runways')">
          跑道管理
        </button>
        <button type="button" class="data-management-modal__tab" data-tab="stations" :data-active="state.activeTab === 'stations'" @click="emit('switchTab', 'stations')">
          台站管理
        </button>
        <button type="button" class="data-management-modal__tab" data-tab="obstacles"
          :data-active="state.activeTab === 'obstacles'"
          @click="emit('switchTab', 'obstacles')">
          障碍物管理
        </button>
        <button type="button" class="data-management-modal__tab" data-tab="projects"
          :data-active="state.activeTab === 'projects'"
          @click="emit('switchTab', 'projects')">
          项目管理
        </button>
      </nav>
      <div class="data-management-modal__body shell-scrollbar">
        <section
          v-if="getActiveWarnings().length > 0"
          class="data-management-modal__warnings"
          data-testid="data-management-warnings"
          aria-label="保存提示"
        >
          <p v-for="warning in getActiveWarnings()" :key="warning">{{ warning }}</p>
        </section>
        <template v-if="state.activeTab === 'airports'">
          <AirportTable
            :items="state.airports.items"
            :keyword="state.airports.filters.keyword"
            :has-coordinates="state.airports.filters.hasCoordinates"
            :loading="state.airports.loading"
            @update:keyword="emit('setAirportKeyword', $event)"
            @update:has-coordinates="emit('setAirportHasCoordinates', $event)"
            @create="emit('openAirportCreateDialog')"
            @detail="emit('openAirportDetailDialog', $event)"
            @edit="emit('openAirportEditDialog', $event.id)"
            @delete="emit('openAirportDeleteConfirm', $event.id)"
          />
          <p v-if="state.airports.errorMessage" class="data-management-modal__placeholder">{{ state.airports.errorMessage }}</p>
          <AirportFormDialog
            :open="state.airports.formOpen"
            :readonly="state.airports.readonly"
            :model-value="state.airports.draft"
            @close="emit('closeAirportFormDialog')"
            @save="emit('saveAirportDraft', $event)"
          />

        </template>
        <template v-else-if="state.activeTab === 'runways'">
          <RunwayTable
            :items="state.runways.items"
            :airport-name="state.runways.filters.airportName"
            :keyword="state.runways.filters.keyword"
            :run-number="state.runways.filters.runNumber"
            :loading="state.runways.loading"
            @update:airport-name="emit('setRunwayAirportName', $event)"
            @update:keyword="emit('setRunwayKeyword', $event)"
            @update:run-number="emit('setRunwayRunNumber', $event)"
            @create="emit('openRunwayCreateDialog')"
            @detail="emit('openRunwayDetailDialog', $event)"
            @edit="emit('openRunwayEditDialog', $event.id)"
            @delete="emit('openRunwayDeleteConfirm', $event.id)"
          />
          <p v-if="state.runways.errorMessage" class="data-management-modal__placeholder">{{ state.runways.errorMessage }}</p>
          <RunwayFormDialog
            :open="state.runways.formOpen"
            :readonly="state.runways.readonly"
            :airport-options="state.airportOptions"
            :model-value="state.runways.draft"
            @close="emit('closeRunwayFormDialog')"
            @save="emit('saveRunwayDraft', $event)"
          />

        </template>
        <template v-else-if="state.activeTab === 'stations'">
          <StationTable
            :items="state.stations.items"
            :airport-name="state.stations.filters.airportName"
            :station-type="state.stations.filters.stationType"
            :station-type-options="state.stationTypeOptions"
            :keyword="state.stations.filters.keyword"
            :runway-no="state.stations.filters.runwayNo"
            :loading="state.stations.loading"
            @update:airport-name="emit('setStationAirportName', $event)"
            @update:station-type="emit('setStationType', $event)"
            @update:keyword="emit('setStationKeyword', $event)"
            @update:runway-no="emit('setStationRunwayNo', $event)"
            @create="emit('openStationCreateDialog')"
            @detail="emit('openStationDetailDialog', $event)"
            @edit="emit('openStationEditDialog', $event.id)"
            @delete="emit('openStationDeleteConfirm', $event.id)"
            @locate="emit('locateStation', $event)"
          />
          <p v-if="state.stations.errorMessage" class="data-management-modal__placeholder">{{ state.stations.errorMessage }}</p>
          <StationFormDialog
            :open="state.stations.formOpen"
            :readonly="state.stations.readonly"
            :airport-options="state.airportOptions"
            :station-type-options="state.stationTypeOptions"
            :model-value="state.stations.draft"
          @close="emit('closeStationFormDialog')"
          @save="emit('saveStationDraft', $event)"
        />
        </template>
        <template v-else-if="state.activeTab === 'obstacles'">
          <ObstacleTable
            :items="state.obstacles.items"
            :project-name="state.obstacles.filters.projectName"
            :keyword="state.obstacles.filters.keyword"
            :obstacle-type="state.obstacles.filters.obstacleType"
            :loading="state.obstacles.loading"
            @update:project-name="emit('setObstacleProjectName', $event)"
            @update:keyword="emit('setObstacleKeyword', $event)"
            @update:obstacle-type="emit('setObstacleType', $event)"
            @detail="emit('openObstacleDetailDialog', $event)"
            @delete="emit('openObstacleDeleteConfirm', $event)"
            @locate="emit('locateObstacle', $event)"
          />
          <p v-if="state.obstacles.errorMessage" class="data-management-modal__placeholder">
            {{ state.obstacles.errorMessage }}
          </p>
          <ObstacleDetailDialog
            :open="state.obstacles.formOpen"
            :model-value="(state.obstacles.draft as ObstacleListItem)"
            @close="emit('closeObstacleDetailDialog')"
          />
        </template>
        <template v-else-if="state.activeTab === 'projects'">
          <ProjectTable
            :items="state.projects.items"
            :project-name="state.projects.filters.projectName"
            :obstacle-type="state.projects.filters.obstacleType"
            :status="state.projects.filters.status"
            :loading="state.projects.loading"
            :expanded-project-id="state.projects.expandedProjectId"
            :expanded-targets="state.projects.expandedTargets"
            :targets-loading="state.projects.targetsLoading"
            :targets-error="state.projects.targetsError"
            :target-export-state="state.projects.targetExportState"
            @update:project-name="emit('setProjectName', $event)"
            @update:obstacle-type="emit('setProjectObstacleType', $event)"
            @update:status="emit('setProjectStatus', $event)"
            @toggle-expand="emit('toggleProjectExpand', $event)"
            @export-target="emit('exportProjectTarget', $event)"
          />
          <p v-if="state.projects.errorMessage" class="data-management-modal__placeholder">
            {{ state.projects.errorMessage }}
          </p>
        </template>
      </div>
      <footer class="data-management-modal__footer">
        <p>{{ getPagerSummary() }}</p>
        <div class="data-management-modal__pager-controls">
          <button
            type="button"
            data-testid="modal-prev-page"
            :disabled="getActivePager().page <= 1"
            @click="handlePreviousPage"
          >
            上一页
          </button>
          <span data-testid="modal-current-page">{{ getActivePager().page }} / {{ getTotalPages() }}</span>
          <button
            type="button"
            data-testid="modal-next-page"
            :disabled="getActivePager().total === 0 || getActivePager().page >= getTotalPages()"
            @click="handleNextPage"
          >
            下一页
          </button>
          <label>
            <span>每页</span>
            <select
              data-testid="modal-page-size"
              :value="String(getActivePager().pageSize)"
              @change="handlePageSizeChange"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
        </div>
      </footer>
    </div>
    <Teleport to="body">
      <div v-if="showImportResultDialog" class="data-management-modal__import-result-overlay" @click.self="handleCloseImportResult">
        <div class="data-management-modal__import-result-card">
          <header class="data-management-modal__import-result-header">
            <h3>导入结果</h3>
            <button type="button" class="data-management-modal__import-result-close" @click="handleCloseImportResult">&times;</button>
          </header>
          <div class="data-management-modal__import-result-body shell-scrollbar">
            <div
              v-for="item in importResultItems"
              :key="item.fileName || 'error'"
              class="data-management-modal__import-result-item"
              :data-status="item.status"
            >
              <span class="data-management-modal__import-result-icon">
                <template v-if="item.status === 'imported'">&#10003;</template>
                <template v-else-if="item.status === 'skipped'">&#8855;</template>
                <template v-else>&#10007;</template>
              </span>
              <div class="data-management-modal__import-result-info">
                <p class="data-management-modal__import-result-filename">{{ item.fileName || '未知文件' }}</p>
                <p class="data-management-modal__import-result-detail">
                  <template v-if="item.status === 'imported'">
                    机场: {{ item.airportName }} | 跑道: {{ item.runwayCount }} | 台站: {{ item.stationCount }}
                  </template>
                  <template v-else-if="item.status === 'skipped'">
                     已跳过（非 Excel 文件）
                  </template>
                  <template v-else>
                    {{ item.errorMessage || '解析失败' }}
                  </template>
                </p>
              </div>
            </div>
          </div>
          <footer class="data-management-modal__import-result-footer">
            <span class="data-management-modal__import-result-summary">
              成功 <strong>{{ importResultImportedCount }}</strong>
              &nbsp; 跳过 <strong>{{ importResultSkippedCount }}</strong>
              &nbsp; 失败 <strong>{{ importResultTotalFiles - importResultImportedCount - importResultSkippedCount }}</strong>
            </span>
            <button type="button" class="data-management-modal__import-result-close-btn" @click="handleCloseImportResult">关闭</button>
          </footer>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="hasActiveDeleteTarget()"
        class="data-management-modal__delete-overlay"
        aria-label="删除确认"
        @click.self="handleCancelDelete"
      >
        <div class="data-management-modal__delete-card">
          <header class="data-management-modal__delete-header">
            <h3>确认删除{{ getActiveDeleteLabel() }}</h3>
          </header>
          <div class="data-management-modal__delete-body">
            <p>待删除{{ getActiveDeleteLabel() }}：{{ getActiveDeleteTargetName() }}</p>
            <p v-if="getActiveDeleteError()" class="data-management-modal__delete-error">
              {{ getActiveDeleteError() }}
            </p>
          </div>
          <footer class="data-management-modal__delete-footer">
            <button
              type="button"
              :data-testid="getActiveDeleteTestid()"
              @click="handleConfirmDelete"
            >
              确认删除
            </button>
            <button type="button" @click="handleCancelDelete">关闭</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </section>
  </template>
