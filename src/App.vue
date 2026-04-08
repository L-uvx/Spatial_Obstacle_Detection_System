<script setup lang="ts">
import { ref } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import { useWorkflowActions } from './composables/useWorkflowActions'
import type { ActionToolKey, PanelToolKey } from './types/tool'

const activeTool = ref<PanelToolKey | null>(null)
const resetTick = ref(0)
const { actionStateByTool, executeToolAction } = useWorkflowActions()

function handleToolToggle(tool: PanelToolKey) {
  activeTool.value = activeTool.value === tool ? null : tool
}

function handleReset() {
  resetTick.value += 1
}

function closePanel() {
  activeTool.value = null
}

function handleWorkflowAction(tool: ActionToolKey) {
  void executeToolAction(tool)
}
</script>

<template>
  <AppShell
    :active-tool="activeTool"
    :action-state-by-tool="actionStateByTool"
    :reset-tick="resetTick"
    @toggle-tool="handleToolToggle"
    @workflow-action="handleWorkflowAction"
    @reset="handleReset"
    @close-panel="closePanel"
  />
</template>
