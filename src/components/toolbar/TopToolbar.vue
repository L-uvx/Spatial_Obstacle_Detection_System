<script setup lang="ts">
import { toolbarItems } from '../../types/tool'
import type { PanelToolKey, ToolbarItem } from '../../types/tool'

defineProps<{
  activeTool: PanelToolKey | null
}>()

const emit = defineEmits<{
  toggleTool: [tool: PanelToolKey]
  reset: []
}>()

function handleClick(item: ToolbarItem) {
  if (item.opensPanel) {
    emit('toggleTool', item.key as PanelToolKey)
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
      type="button"
      class="toolbar-button"
      :class="{ 'is-active': activeTool === item.key }"
      @click="handleClick(item)"
    >
      {{ item.label }}
    </button>
  </header>
</template>
