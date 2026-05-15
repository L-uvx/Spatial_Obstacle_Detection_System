<script setup lang="ts">
import type { ObstacleListItem } from '../../types/dataManagement'

const props = defineProps<{
  open: boolean
  modelValue: ObstacleListItem
}>()

const emit = defineEmits<{
  close: []
}>()

function formatCoordinate(item: ObstacleListItem): string {
  if (!item.geometry) return '-'
  if (item.geometry.type === 'Point') {
    return `${item.geometry.coordinates[0]}, ${item.geometry.coordinates[1]}`
  }
  return '多边形'
}
</script>

<template>
  <Teleport to="body">
    <section v-if="open" class="data-management-form-dialog" aria-label="障碍物详情">
      <div class="data-management-form-dialog__card">
        <header class="data-management-form-dialog__header">
          <h3>查看障碍物</h3>
          <button type="button" @click="emit('close')">关闭</button>
        </header>
        <div class="data-management-form-dialog__body shell-scrollbar">
          <label>
            <span>障碍物名称</span>
            <input :value="modelValue.name" disabled />
          </label>
          <label>
            <span>障碍物类型</span>
            <input :value="modelValue.obstacleType" disabled />
          </label>
          <label>
            <span>项目 ID</span>
            <input :value="modelValue.projectId" disabled />
          </label>
          <label>
            <span>项目名称</span>
            <input :value="modelValue.projectName" disabled />
          </label>
          <label>
            <span>导入批次</span>
            <input :value="modelValue.sourceBatchId" disabled />
          </label>
          <label>
            <span>导入行号</span>
            <input :value="modelValue.sourceRowNo" disabled />
          </label>
          <label>
            <span>顶部高程 (m)</span>
            <input :value="modelValue.topElevation?.toFixed(1) ?? '-'" disabled />
          </label>
          <label>
            <span>几何类型</span>
            <input :value="modelValue.geometry?.type ?? '-'" disabled />
          </label>
          <label>
            <span>坐标</span>
            <input :value="formatCoordinate(modelValue)" disabled />
          </label>
        </div>
        <footer class="data-management-form-dialog__footer">
          <button type="button" @click="emit('close')">关闭</button>
        </footer>
      </div>
    </section>
  </Teleport>
</template>
