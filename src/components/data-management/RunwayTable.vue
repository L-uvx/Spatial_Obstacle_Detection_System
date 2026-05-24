<script setup lang="ts">
import type { RunwayListItem } from '../../types/dataManagement'

const props = defineProps<{
  items: RunwayListItem[]
  airportName: string
  keyword: string
  runNumber: string
  loading: boolean
}>()

const emit = defineEmits<{
  'update:airportName': [airportName: string]
  'update:keyword': [keyword: string]
  'update:runNumber': [runNumber: string]
  create: []
  detail: [runway: RunwayListItem]
  edit: [runway: RunwayListItem]
  delete: [runway: RunwayListItem]
}>()
</script>

<template>
  <section class="runway-table" aria-label="跑道列表">
    <div class="runway-table__toolbar">
      <label>
        <span>机场名称</span>
        <input
          data-testid="runway-airport-name-input"
          type="text"
          :value="airportName"
          @input="emit('update:airportName', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>关键字</span>
        <input
          data-testid="runway-keyword-input"
          type="text"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>跑道编号</span>
        <input
          data-testid="runway-run-number-input"
          type="text"
          :value="runNumber"
          @input="emit('update:runNumber', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <button type="button" data-action="create-runway" @click="emit('create')">新建跑道</button>
    </div>

    <table class="runway-table__table">
      <thead>
        <tr>
          <th>所属机场</th>
          <th>跑道名称</th>
          <th>跑道编号</th>
          <th>坐标</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5">加载中...</td>
        </tr>
        <tr v-else-if="items.length === 0">
          <td colspan="5">暂无跑道数据</td>
        </tr>
        <tr v-for="runway in items" :key="runway.id">
          <td>{{ runway.airportName || runway.airportId || '-' }}</td>
          <td>{{ runway.name || '-' }}</td>
          <td>{{ runway.runNumber || '-' }}</td>
          <td>{{ runway.longitude ?? '-' }}, {{ runway.latitude ?? '-' }}</td>
          <td>
            <button type="button" data-action="detail-runway" @click="emit('detail', runway)">详情</button>
            <button type="button" data-action="edit-runway" @click="emit('edit', runway)">编辑</button>
            <button type="button" data-action="delete-runway" @click="emit('delete', runway)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
