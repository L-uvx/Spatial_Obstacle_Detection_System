<script setup lang="ts">
import type { RunwayListItem } from '../../types/dataManagement'

const props = defineProps<{
  items: RunwayListItem[]
  total: number
  page: number
  pageSize: number
  airportId: string
  keyword: string
  runNumber: string
  loading: boolean
}>()

const emit = defineEmits<{
  'update:airportId': [airportId: string]
  'update:keyword': [keyword: string]
  'update:runNumber': [runNumber: string]
  'change:page': [page: number]
  'change:pageSize': [pageSize: number]
  create: []
  edit: [runway: RunwayListItem]
  delete: [runway: RunwayListItem]
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
  <section class="runway-table" aria-label="跑道列表">
    <div class="runway-table__toolbar">
      <label>
        <span>机场 ID</span>
        <input
          data-testid="runway-airport-id-input"
          type="text"
          :value="airportId"
          @input="emit('update:airportId', ($event.target as HTMLInputElement).value)"
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
            <button type="button" data-action="edit-runway" @click="emit('edit', runway)">编辑</button>
            <button type="button" data-action="delete-runway" @click="emit('delete', runway)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="runway-table__pager">
      <p>{{ getPagerSummary() }}</p>
      <div class="runway-table__pager-controls">
        <button
          type="button"
          data-testid="runway-prev-page"
          :disabled="page <= 1"
          @click="handlePreviousPage"
        >
          上一页
        </button>
        <span data-testid="runway-current-page">{{ page }} / {{ getTotalPages() }}</span>
        <button
          type="button"
          data-testid="runway-next-page"
          :disabled="total === 0 || page >= getTotalPages()"
          @click="handleNextPage"
        >
          下一页
        </button>
        <label>
          <span>每页</span>
          <select
            data-testid="runway-page-size"
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
