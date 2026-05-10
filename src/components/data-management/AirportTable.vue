<script setup lang="ts">
import type { AirportListItem } from '../../types/dataManagement'

const props = defineProps<{
  items: AirportListItem[]
  keyword: string
  hasCoordinates: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:keyword': [keyword: string]
  'update:hasCoordinates': [hasCoordinates: boolean]
  create: []
  detail: [airport: AirportListItem]
  edit: [airport: AirportListItem]
  delete: [airport: AirportListItem]
}>()
</script>

<template>
  <section class="airport-table" aria-label="机场列表">
    <div class="airport-table__toolbar">
      <label>
        <span>关键字</span>
        <input
          data-testid="airport-keyword-input"
          type="text"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="airport-table__toolbar-checkbox">
        <input
          data-testid="airport-has-coordinates"
          type="checkbox"
          :checked="hasCoordinates"
          @change="emit('update:hasCoordinates', ($event.target as HTMLInputElement).checked)"
        />
        <span>仅看有坐标机场</span>
      </label>
      <button type="button" data-action="create-airport" @click="emit('create')">新建机场</button>
    </div>

    <table class="airport-table__table">
      <thead>
        <tr>
          <th>机场名称</th>
          <th>经纬度</th>
          <th>跑道数</th>
          <th>台站数</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5">加载中...</td>
        </tr>
        <tr v-else-if="items.length === 0">
          <td colspan="5">暂无机场数据</td>
        </tr>
        <tr v-for="airport in items" :key="airport.id">
          <td>{{ airport.name }}</td>
          <td>{{ airport.longitude ?? '-' }}, {{ airport.latitude ?? '-' }}</td>
          <td>{{ airport.runwayCount }}</td>
          <td>{{ airport.stationCount }}</td>
          <td>
            <button type="button" data-action="detail-airport" @click="emit('detail', airport)">详情</button>
            <button type="button" data-action="edit-airport" @click="emit('edit', airport)">编辑</button>
            <button type="button" data-action="delete-airport" @click="emit('delete', airport)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
