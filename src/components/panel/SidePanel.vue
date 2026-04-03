<script setup lang="ts">
import { computed } from 'vue'
import { panelContentByTool } from '../../types/tool'
import type { PanelToolKey } from '../../types/tool'

const props = defineProps<{
  activeTool: PanelToolKey | null
}>()

const emit = defineEmits<{
  close: []
}>()

const panelTitle = computed(() => {
  return props.activeTool ? panelContentByTool[props.activeTool].title : ''
})

const panelDescription = computed(() => {
  return props.activeTool ? panelContentByTool[props.activeTool].description : ''
})
</script>

<template>
  <aside class="side-panel" :class="{ 'is-open': activeTool }">
    <template v-if="activeTool">
      <div class="side-panel__header">
        <h2>{{ panelTitle }}</h2>
        <button type="button" class="side-panel__close" @click="emit('close')">关闭</button>
      </div>

      <div class="side-panel__content">
        <p>{{ panelDescription }}</p>
      </div>
    </template>
  </aside>
</template>
