<script setup lang="ts">
import { ref } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import type { PanelToolKey } from './types/tool'

const activeTool = ref<PanelToolKey | null>(null)
const resetTick = ref(0)

function handleToolToggle(tool: PanelToolKey) {
  activeTool.value = activeTool.value === tool ? null : tool
}

function handleReset() {
  resetTick.value += 1
}

function closePanel() {
  activeTool.value = null
}
</script>

<template>
  <AppShell
    :active-tool="activeTool"
    :reset-tick="resetTick"
    @toggle-tool="handleToolToggle"
    @reset="handleReset"
    @close-panel="closePanel"
  />
</template>
