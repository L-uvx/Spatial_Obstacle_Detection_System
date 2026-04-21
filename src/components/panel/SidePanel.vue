<script setup lang="ts">
import type { PolygonObstacleAnalysisState } from '../../types/tool'

defineProps<{
  state: PolygonObstacleAnalysisState
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  setAirportProtectionZoneVisibility: [airportId: string, visible: boolean]
  setStationProtectionZoneVisibility: [airportId: string, stationId: string, visible: boolean]
  setZoneProtectionZoneVisibility: [airportId: string, stationId: string, zoneCode: string, visible: boolean]
}>()

// 该面板只负责展示保护区树，并将勾选变化透传给上层状态管理。
</script>

<template>
  <aside v-if="isOpen" class="side-panel is-open" aria-hidden="false">
    <div class="side-panel__header">
      <h2>保护区显示管理</h2>
      <button type="button" class="side-panel__close" @click="emit('close')">关闭</button>
    </div>
    <div class="side-panel__content">
      <p v-if="state.protectionZoneTree.length === 0" class="side-panel__status">分析成功后将在此显示保护区树。</p>
      <ul v-else class="side-panel__tree">
        <li v-for="airport in state.protectionZoneTree" :key="airport.airportId">
          <label>
            <input
              :checked="airport.visible"
              type="checkbox"
              @change="emit('setAirportProtectionZoneVisibility', airport.airportId, ($event.target as HTMLInputElement).checked)"
            />
            {{ airport.airportName }}
          </label>
          <ul>
            <li v-for="station in airport.stations" :key="`${airport.airportId}:${station.stationId}`">
              <label>
                <input
                  :checked="station.visible"
                  type="checkbox"
                  @change="emit('setStationProtectionZoneVisibility', airport.airportId, station.stationId, ($event.target as HTMLInputElement).checked)"
                />
                {{ station.stationName }}
              </label>
              <ul>
                <li v-for="zone in station.zones" :key="zone.key">
                  <label>
                    <input
                      :data-zone-key="zone.key"
                      :checked="zone.visible"
                      type="checkbox"
                      @change="emit('setZoneProtectionZoneVisibility', airport.airportId, station.stationId, zone.zoneCode, ($event.target as HTMLInputElement).checked)"
                    />
                    {{ zone.zoneName }}
                  </label>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </aside>
</template>
