<script setup lang="ts">
import AirportFormDialog from '../data-management/AirportFormDialog.vue'
import AirportTable from '../data-management/AirportTable.vue'
import RunwayFormDialog from '../data-management/RunwayFormDialog.vue'
import StationFormDialog from '../data-management/StationFormDialog.vue'
import RunwayTable from '../data-management/RunwayTable.vue'
import StationTable from '../data-management/StationTable.vue'
import type { DataManagementState } from '../../composables/useDataManagement'

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
  saveRunwayDraft: []
  closeRunwayDeleteConfirm: []
  confirmRunwayDelete: []
  openStationCreateDialog: []
  openStationEditDialog: [stationId: string]
  openStationDeleteConfirm: [stationId: string]
  closeStationFormDialog: []
  saveStationDraft: []
  closeStationDeleteConfirm: []
  confirmStationDelete: []
  openAirportCreateDialog: []
  openAirportEditDialog: [airportId: string]
  closeAirportFormDialog: []
  saveAirportDraft: []
  openAirportDeleteConfirm: [airportId: string]
  closeAirportDeleteConfirm: []
  confirmAirportDelete: []
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
            :total="state.airports.total"
            :page="state.airports.page"
            :page-size="state.airports.pageSize"
            :keyword="state.airports.filters.keyword"
            :has-coordinates="state.airports.filters.hasCoordinates"
            :loading="state.airports.loading"
            @update:keyword="emit('setAirportKeyword', $event)"
            @update:has-coordinates="emit('setAirportHasCoordinates', $event)"
            @change:page="emit('changeAirportPage', $event)"
            @change:page-size="emit('changeAirportPageSize', $event)"
            @create="emit('openAirportCreateDialog')"
            @edit="emit('openAirportEditDialog', $event.id)"
            @delete="emit('openAirportDeleteConfirm', $event.id)"
          />
          <p v-if="state.airports.errorMessage" class="data-management-modal__placeholder">{{ state.airports.errorMessage }}</p>
          <AirportFormDialog
            :open="state.airports.formOpen"
            :model-value="state.airports.draft"
            @close="emit('closeAirportFormDialog')"
            @save="emit('saveAirportDraft')"
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
            :total="state.runways.total"
            :page="state.runways.page"
            :page-size="state.runways.pageSize"
            :airport-id="state.runways.filters.airportId"
            :keyword="state.runways.filters.keyword"
            :run-number="state.runways.filters.runNumber"
            :loading="state.runways.loading"
            @update:airport-id="emit('setRunwayAirportId', $event)"
            @update:keyword="emit('setRunwayKeyword', $event)"
            @update:run-number="emit('setRunwayRunNumber', $event)"
            @change:page="emit('changeRunwayPage', $event)"
            @change:page-size="emit('changeRunwayPageSize', $event)"
            @create="emit('openRunwayCreateDialog')"
            @edit="emit('openRunwayEditDialog', $event.id)"
            @delete="emit('openRunwayDeleteConfirm', $event.id)"
          />
          <p v-if="state.runways.errorMessage" class="data-management-modal__placeholder">{{ state.runways.errorMessage }}</p>
          <RunwayFormDialog
            :open="state.runways.formOpen"
            :airport-options="state.airportOptions"
            :model-value="state.runways.draft"
            @close="emit('closeRunwayFormDialog')"
            @save="emit('saveRunwayDraft')"
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
            :total="state.stations.total"
            :page="state.stations.page"
            :page-size="state.stations.pageSize"
            :airport-id="state.stations.filters.airportId"
            :station-type="state.stations.filters.stationType"
            :keyword="state.stations.filters.keyword"
            :runway-no="state.stations.filters.runwayNo"
            :loading="state.stations.loading"
            @update:airport-id="emit('setStationAirportId', $event)"
            @update:station-type="emit('setStationType', $event)"
            @update:keyword="emit('setStationKeyword', $event)"
            @update:runway-no="emit('setStationRunwayNo', $event)"
            @change:page="emit('changeStationPage', $event)"
            @change:page-size="emit('changeStationPageSize', $event)"
            @create="emit('openStationCreateDialog')"
            @edit="emit('openStationEditDialog', $event.id)"
            @delete="emit('openStationDeleteConfirm', $event.id)"
          />
          <p v-if="state.stations.errorMessage" class="data-management-modal__placeholder">{{ state.stations.errorMessage }}</p>
          <StationFormDialog
            :open="state.stations.formOpen"
            :airport-options="state.airportOptions"
            :station-type-options="state.stationTypeOptions"
            :model-value="state.stations.draft"
            @close="emit('closeStationFormDialog')"
            @save="emit('saveStationDraft')"
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
    </div>
  </section>
</template>
