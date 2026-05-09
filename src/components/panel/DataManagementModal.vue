<script setup lang="ts">
import AirportFormDialog from '../data-management/AirportFormDialog.vue'
import AirportTable from '../data-management/AirportTable.vue'
import RunwayFormDialog from '../data-management/RunwayFormDialog.vue'
import StationFormDialog from '../data-management/StationFormDialog.vue'
import RunwayTable from '../data-management/RunwayTable.vue'
import StationTable from '../data-management/StationTable.vue'
import type { AirportFormValue, DataManagementState } from '../../composables/useDataManagement'
import type { AirportListItem, RunwayListItem, RunwayPayload, StationListItem, StationPayload } from '../../types/dataManagement'

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

  return props.state.stations.warnings
}

function getActivePager() {
  if (props.state.activeTab === 'airports') {
    return props.state.airports
  }

  if (props.state.activeTab === 'runways') {
    return props.state.runways
  }

  return props.state.stations
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
  } else {
    emit('changeStationPage', nextPage)
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
  } else {
    emit('changeStationPage', nextPage)
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
  } else {
    emit('changeStationPageSize', Number(target.value))
  }
}

const emit = defineEmits<{
  close: []
  switchTab: [tab: DataManagementState['activeTab']]
  setAirportKeyword: [keyword: string]
  setAirportHasCoordinates: [hasCoordinates: boolean]
  changeAirportPage: [page: number]
  changeAirportPageSize: [pageSize: number]
  setRunwayAirportId: [airportId: string]
  setRunwayKeyword: [keyword: string]
  setRunwayRunNumber: [runNumber: string]
  changeRunwayPage: [page: number]
  changeRunwayPageSize: [pageSize: number]
  setStationAirportId: [airportId: string]
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
}>()
</script>

<template>
  <section v-if="state.isOpen" class="data-management-modal" aria-label="数据管理">
    <div class="data-management-modal__card">
      <header class="data-management-modal__header">
        <h2>数据管理</h2>
        <button type="button" class="data-management-modal__close" @click="emit('close')">关闭</button>
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
          <section
            v-if="state.airports.deleteTarget"
            class="data-management-modal__delete-confirm"
            aria-label="删除机场确认"
          >
            <p>待删除机场：{{ state.airports.deleteTarget.name }}</p>
            <p v-if="state.airports.errorMessage" class="data-management-modal__delete-error">
              {{ state.airports.errorMessage }}
            </p>
            <button
              type="button"
              data-testid="confirm-airport-delete"
              @click="emit('confirmAirportDelete')"
            >
              确认删除
            </button>
            <button type="button" @click="emit('closeAirportDeleteConfirm')">关闭</button>
          </section>
        </template>
        <template v-else-if="state.activeTab === 'runways'">
          <RunwayTable
            :items="state.runways.items"
            :airport-id="state.runways.filters.airportId"
            :keyword="state.runways.filters.keyword"
            :run-number="state.runways.filters.runNumber"
            :loading="state.runways.loading"
            @update:airport-id="emit('setRunwayAirportId', $event)"
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
          <section
            v-if="state.runways.deleteTarget"
            class="data-management-modal__delete-confirm"
            aria-label="删除跑道确认"
          >
            <p>待删除跑道：{{ state.runways.deleteTarget.name }}</p>
            <p v-if="state.runways.errorMessage" class="data-management-modal__delete-error">
              {{ state.runways.errorMessage }}
            </p>
            <button
              type="button"
              data-testid="confirm-runway-delete"
              @click="emit('confirmRunwayDelete')"
            >
              确认删除
            </button>
            <button type="button" @click="emit('closeRunwayDeleteConfirm')">关闭</button>
          </section>
        </template>
        <template v-else>
          <StationTable
            :items="state.stations.items"
            :airport-id="state.stations.filters.airportId"
            :station-type="state.stations.filters.stationType"
            :keyword="state.stations.filters.keyword"
            :runway-no="state.stations.filters.runwayNo"
            :loading="state.stations.loading"
            @update:airport-id="emit('setStationAirportId', $event)"
            @update:station-type="emit('setStationType', $event)"
            @update:keyword="emit('setStationKeyword', $event)"
            @update:runway-no="emit('setStationRunwayNo', $event)"
            @create="emit('openStationCreateDialog')"
            @detail="emit('openStationDetailDialog', $event)"
            @edit="emit('openStationEditDialog', $event.id)"
            @delete="emit('openStationDeleteConfirm', $event.id)"
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
          <section
            v-if="state.stations.deleteTarget"
            class="data-management-modal__delete-confirm"
            aria-label="删除台站确认"
          >
            <p>待删除台站：{{ state.stations.deleteTarget.name }}</p>
            <p v-if="state.stations.errorMessage" class="data-management-modal__delete-error">
              {{ state.stations.errorMessage }}
            </p>
            <button
              type="button"
              data-testid="confirm-station-delete"
              @click="emit('confirmStationDelete')"
            >
              确认删除
            </button>
            <button type="button" @click="emit('closeStationDeleteConfirm')">关闭</button>
          </section>
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
  </section>
</template>
