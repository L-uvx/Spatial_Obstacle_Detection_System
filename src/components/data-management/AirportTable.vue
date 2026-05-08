<script setup lang="ts">
import type { AirportListItem } from '../../types/dataManagement'

const props = defineProps<{
  items: AirportListItem[]
  total: number
  page: number
  pageSize: number
  keyword: string
  hasCoordinates: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:keyword': [keyword: string]
  'update:hasCoordinates': [hasCoordinates: boolean]
  'change:page': [page: number]
  'change:pageSize': [pageSize: number]
  create: []
  edit: [airport: AirportListItem]
  delete: [airport: AirportListItem]
}>()

function getPagerSummary() {
  if (props.total === 0) {
    return '共 0 条'
  }

  const start = (props.page - 1) * props.pageSize + 1
  const end = Math.min(props.page * props.pageSize, props.total)
  return `第 ${start}-${end} 条，共 ${props.total} 条`
}

function getTotalPages() {
  if (props.total === 0) {
    return 0
  }

  return Math.ceil(props.total / props.pageSize)
}

function handlePreviousPage() {
  if (props.page <= 1) {
    return
  }

  emit('change:page', props.page - 1)
}

function handleNextPage() {
  const totalPages = getTotalPages()

  if (totalPages === 0 || props.page >= totalPages) {
    return
  }

  emit('change:page', props.page + 1)
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement | null

  if (!target) {
    return
  }

  emit('change:pageSize', Number(target.value))
}
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
      <label>
        <input
          data-testid="airport-has-coordinates"
          type="checkbox"
          :checked="hasCoordinates"
          @change="emit('update:hasCoordinates', ($event.target as HTMLInputElement).checked)"
        />
        仅看有坐标机场
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
            <button type="button" data-action="edit-airport" @click="emit('edit', airport)">编辑</button>
            <button type="button" data-action="delete-airport" @click="emit('delete', airport)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="airport-table__pager">
      <p>{{ getPagerSummary() }}</p>
      <div class="airport-table__pager-controls">
        <button
          type="button"
          data-testid="airport-prev-page"
          :disabled="page <= 1"
          @click="handlePreviousPage"
        >
          上一页
        </button>
        <span data-testid="airport-current-page">{{ page }} / {{ getTotalPages() }}</span>
        <button
          type="button"
          data-testid="airport-next-page"
          :disabled="total === 0 || page >= getTotalPages()"
          @click="handleNextPage"
        >
          下一页
        </button>
        <label>
          <span>每页</span>
          <select
            data-testid="airport-page-size"
            :value="String(pageSize)"
            @change="handlePageSizeChange"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>
    </div>
  </section>
</template>
