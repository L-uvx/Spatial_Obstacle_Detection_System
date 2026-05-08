<script setup lang="ts">
import type { StationListItem } from '../../types/dataManagement'

const props = defineProps<{
  items: StationListItem[]
  total: number
  page: number
  pageSize: number
  airportId: string
  stationType: string
  keyword: string
  runwayNo: string
  loading: boolean
}>()

const emit = defineEmits<{
  'update:airportId': [airportId: string]
  'update:stationType': [stationType: string]
  'update:keyword': [keyword: string]
  'update:runwayNo': [runwayNo: string]
  'change:page': [page: number]
  'change:pageSize': [pageSize: number]
  create: []
  edit: [station: StationListItem]
  delete: [station: StationListItem]
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
  <section class="station-table" aria-label="台站列表">
    <div class="station-table__toolbar">
      <label>
        <span>机场 ID</span>
        <input
          data-testid="station-airport-id-input"
          type="text"
          :value="airportId"
          placeholder="机场筛选待接入下拉"
          @input="emit('update:airportId', ($event.target as HTMLInputElement).value)"
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
        <span>关键字</span>
        <input
          data-testid="station-keyword-input"
          type="text"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
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
            <button type="button" data-action="edit-station" @click="emit('edit', station)">编辑</button>
            <button type="button" data-action="delete-station" @click="emit('delete', station)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="station-table__pager">
      <p>{{ getPagerSummary() }}</p>
      <div class="station-table__pager-controls">
        <button
          type="button"
          data-testid="station-prev-page"
          :disabled="page <= 1"
          @click="handlePreviousPage"
        >
          上一页
        </button>
        <span data-testid="station-current-page">{{ page }} / {{ getTotalPages() }}</span>
        <button
          type="button"
          data-testid="station-next-page"
          :disabled="total === 0 || page >= getTotalPages()"
          @click="handleNextPage"
        >
          下一页
        </button>
        <label>
          <span>每页</span>
          <select
            data-testid="station-page-size"
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
