<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PolygonObstacleAnalysisState, ProtectionZoneNode } from '../../types/tool'

const props = defineProps<{
  state: PolygonObstacleAnalysisState
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  setAirportProtectionZoneVisibility: [airportId: string, visible: boolean]
  setStationProtectionZoneVisibility: [airportId: string, stationId: string, visible: boolean]
  setZoneProtectionZoneVisibility: [airportId: string, stationId: string, zoneCode: string, visible: boolean]
  flyToZone: [zone: ProtectionZoneNode]
}>()

const expandedAirportIds = ref(new Set<string>())
const expandedStationKeys = ref(new Set<string>())

function toggleAirport(airportId: string) {
  const next = new Set(expandedAirportIds.value)

  if (next.has(airportId)) {
    next.delete(airportId)
  } else {
    next.add(airportId)
  }

  expandedAirportIds.value = next
}

function toggleStation(airportId: string, stationId: string) {
  const stationKey = `${airportId}:${stationId}`
  const next = new Set(expandedStationKeys.value)

  if (next.has(stationKey)) {
    next.delete(stationKey)
  } else {
    next.add(stationKey)
  }

  expandedStationKeys.value = next
}

function isAirportExpanded(airportId: string) {
  return expandedAirportIds.value.has(airportId)
}

function isStationExpanded(airportId: string, stationId: string) {
  return expandedStationKeys.value.has(`${airportId}:${stationId}`)
}

function getAirportToggleLabel(airportName: string, expanded: boolean) {
  return `${expanded ? '收起' : '展开'}机场 ${airportName} 下的台站列表`
}

function getStationToggleLabel(stationName: string, expanded: boolean) {
  return `${expanded ? '收起' : '展开'}台站 ${stationName} 下的保护区列表`
}

function getLocateZoneLabel(zoneName: string) {
  return `定位到保护区 ${zoneName}`
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      return
    }

    expandedAirportIds.value = new Set()
    expandedStationKeys.value = new Set()
  },
)

// 该面板只负责展示保护区树，并将勾选变化透传给上层状态管理；展开状态仅保存在本地 UI。
</script>

<template>
  <aside v-if="isOpen" class="side-panel is-open" aria-hidden="false">
    <div class="side-panel__header">
      <h2>保护区显示管理</h2>
      <button type="button" class="side-panel__close" @click="emit('close')">关闭</button>
    </div>
    <div class="side-panel__content shell-scrollbar">
      <p v-if="state.protectionZoneTree.length === 0" class="side-panel__status">分析成功后将在此显示保护区树。</p>
      <ul v-else class="side-panel__tree">
        <li v-for="airport in state.protectionZoneTree" :key="airport.airportId">
          <div class="side-panel__tree-row">
            <button
              :data-airport-toggle="airport.airportId"
              :aria-expanded="isAirportExpanded(airport.airportId)"
              :aria-label="getAirportToggleLabel(airport.airportName, isAirportExpanded(airport.airportId))"
              type="button"
              class="side-panel__fold"
              @click="toggleAirport(airport.airportId)"
            >
              {{ isAirportExpanded(airport.airportId) ? '-' : '+' }}
            </button>
            <label class="side-panel__tree-label">
              <input
                :checked="airport.visible"
                type="checkbox"
                @change="emit('setAirportProtectionZoneVisibility', airport.airportId, ($event.target as HTMLInputElement).checked)"
              />
              {{ airport.airportName }}
            </label>
          </div>
          <ul v-if="isAirportExpanded(airport.airportId)">
            <li v-for="station in airport.stations" :key="`${airport.airportId}:${station.stationId}`">
              <div class="side-panel__tree-row">
                <button
                  :data-station-toggle="`${airport.airportId}:${station.stationId}`"
                  :aria-expanded="isStationExpanded(airport.airportId, station.stationId)"
                  :aria-label="getStationToggleLabel(station.stationName, isStationExpanded(airport.airportId, station.stationId))"
                  type="button"
                  class="side-panel__fold"
                  @click="toggleStation(airport.airportId, station.stationId)"
                >
                  {{ isStationExpanded(airport.airportId, station.stationId) ? '-' : '+' }}
                </button>
                <label class="side-panel__tree-label">
                  <input
                    :checked="station.visible"
                    type="checkbox"
                    @change="emit('setStationProtectionZoneVisibility', airport.airportId, station.stationId, ($event.target as HTMLInputElement).checked)"
                  />
                  {{ station.stationName }}
                </label>
              </div>
              <ul v-if="isStationExpanded(airport.airportId, station.stationId)">
                <li v-for="zone in station.zones" :key="zone.key">
                  <div class="side-panel__tree-row">
                    <label class="side-panel__tree-label">
                      <input
                        :data-zone-key="zone.key"
                        :checked="zone.visible"
                        type="checkbox"
                        @change="emit('setZoneProtectionZoneVisibility', airport.airportId, station.stationId, zone.zoneCode, ($event.target as HTMLInputElement).checked)"
                      />
                      {{ zone.zoneName }}
                    </label>
                    <button
                      type="button"
                      class="side-panel__locate"
                      :aria-label="getLocateZoneLabel(zone.zoneName)"
                      title="定位到此保护区"
                      @click="emit('flyToZone', zone)"
                    >
                      📍
                    </button>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </aside>
</template>
