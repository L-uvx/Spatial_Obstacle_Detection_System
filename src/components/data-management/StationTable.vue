<script setup lang="ts">
import type { StationListItem } from '../../types/dataManagement'

const props = defineProps<{
  items: StationListItem[]
  airportName: string
  stationType: string
  keyword: string
  runwayNo: string
  loading: boolean
}>()

const emit = defineEmits<{
  'update:airportName': [airportName: string]
  'update:stationType': [stationType: string]
  'update:keyword': [keyword: string]
  'update:runwayNo': [runwayNo: string]
  create: []
  detail: [station: StationListItem]
  edit: [station: StationListItem]
  delete: [station: StationListItem]
  locate: [station: StationListItem]
}>()
</script>

<template>
  <section class="station-table" aria-label="台站列表">
    <div class="station-table__toolbar">
      <label>
        <span>机场名称</span>
        <input
          data-testid="station-airport-name-input"
          type="text"
          :value="airportName"
          placeholder="机场筛选待接入下拉"
          @input="emit('update:airportName', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>台站类型</span>
        <input
          data-testid="station-type-input"
          type="text"
          :value="stationType"
          placeholder="台站类型筛选待接入下拉"
          @input="emit('update:stationType', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>关联跑道</span>
        <input
          data-testid="station-runway-no-input"
          type="text"
          :value="runwayNo"
          @input="emit('update:runwayNo', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>台站名称</span>
        <input
          data-testid="station-keyword-input"
          type="text"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <button type="button" data-action="create-station" @click="emit('create')">新建台站</button>
    </div>

    <table class="station-table__table">
      <thead>
        <tr>
          <th>所属机场</th>
          <th>台站名称</th>
          <th>台站类型</th>
          <th>关联跑道</th>
          <th>坐标</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="6">加载中...</td>
        </tr>
        <tr v-else-if="items.length === 0">
          <td colspan="6">暂无台站数据</td>
        </tr>
        <tr v-for="station in items" :key="station.id">
          <td>{{ station.airportName || station.airportId || '-' }}</td>
          <td>{{ station.name || '-' }}</td>
          <td>{{ station.stationType || '-' }}</td>
          <td>{{ station.runwayNo || '-' }}</td>
          <td>{{ station.longitude ?? '-' }}, {{ station.latitude ?? '-' }}</td>
          <td>
            <button type="button" data-action="detail-station" @click="emit('detail', station)">详情</button>
            <button type="button" data-action="edit-station" @click="emit('edit', station)">编辑</button>
            <button type="button" data-action="delete-station" @click="emit('delete', station)">删除</button>
            <button
              type="button"
              data-action="locate-station"
              :disabled="station.longitude === null || station.latitude === null"
              @click="emit('locate', station)"
            >
              定位
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
