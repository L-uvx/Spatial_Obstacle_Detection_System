<script setup lang="ts">
import { toolbarItems } from '../../types/tool'
import type { ToolbarItem } from '../../types/tool'

const emit = defineEmits<{
  openAnalysis: []
  reset: []
}>()

function handleClick(item: ToolbarItem) {
  if (item.opensModal) {
    emit('openAnalysis')
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
      @click="handleClick(item)"
    >
      {{ item.label }}
    </button>
  </header>
</template>
