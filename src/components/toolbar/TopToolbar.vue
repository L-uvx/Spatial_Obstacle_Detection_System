<script setup lang="ts">
import { toolbarItems } from '../../types/tool'
import type { ObstacleAnalysisMode, ToolbarItem } from '../../types/tool'

const emit = defineEmits<{
  openAnalysis: [mode: ObstacleAnalysisMode]
  openDataManagement: []
  reset: []
}>()

// 根据工具项类型派发打开分析或地图复位事件。
function handleClick(item: ToolbarItem) {
  if (item.action === 'open-analysis' && item.mode) {
    emit('openAnalysis', item.mode)
    return
  }

  if (item.action === 'open-data-management') {
    emit('openDataManagement')
    return
  }

  emit('reset')
}
</script>

<template>
  <header class="top-toolbar">
    <button
      v-for="item in toolbarItems"
      :key="item.key"
      :data-toolbar-key="item.key"
      type="button"
      class="toolbar-button"
      @click="handleClick(item)"
    >
      {{ item.label }}
    </button>
  </header>
</template>
