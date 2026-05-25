<script setup lang="ts">
import type { ObstacleListItem } from '../../types/dataManagement'
import { polygonObstacleTypeOptions, pointObstacleTypeOptions } from '../../types/tool'

const props = defineProps<{
  items: ObstacleListItem[]
  projectName: string
  keyword: string
  obstacleType: string
  loading: boolean
}>()

const emit = defineEmits<{
  'update:projectName': [projectName: string]
  'update:keyword': [keyword: string]
  'update:obstacleType': [obstacleType: string]
  detail: [obstacle: ObstacleListItem]
  delete: [obstacle: ObstacleListItem]
  locate: [obstacle: ObstacleListItem]
}>()

const typeOptions = [...new Set([...polygonObstacleTypeOptions, ...pointObstacleTypeOptions])]
</script>

<template>
  <section class="obstacle-table" aria-label="障碍物列表">
    <div class="obstacle-table__toolbar">
      <label>
        <span>项目名称</span>
        <input
          data-testid="obstacle-project-name-input"
          type="text"
          :value="projectName"
          @input="emit('update:projectName', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>障碍物类型</span>
        <select
          data-testid="obstacle-type-select"
          :value="obstacleType"
          @change="emit('update:obstacleType', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">全部类型</option>
          <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
      <label>
        <span>障碍物名称</span>
        <input
          data-testid="obstacle-keyword-input"
          type="text"
          :value="keyword"
          @input="emit('update:keyword', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <table class="obstacle-table__table">
      <thead>
        <tr>
          <th>障碍物名称</th>
          <th>所属项目</th>
          <th>障碍物类型</th>
          <th>顶部高程 (m)</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5">加载中...</td>
        </tr>
        <tr v-else-if="items.length === 0">
          <td colspan="5">暂无障碍物数据</td>
        </tr>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.name || '-' }}</td>
          <td>{{ item.projectName || '-' }}</td>
          <td>{{ item.obstacleType || '-' }}</td>
          <td>{{ item.topElevation?.toFixed(1) ?? '-' }}</td>
          <td>
            <button type="button" data-action="detail-obstacle" @click="emit('detail', item)">详情</button>
            <button type="button" data-action="delete-obstacle" @click="emit('delete', item)">删除</button>
            <button
              type="button"
              data-action="locate-obstacle"
              :disabled="item.geometry === null"
              @click="emit('locate', item)"
            >
              定位
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
