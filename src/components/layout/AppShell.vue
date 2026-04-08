<script setup lang="ts">
import CesiumViewer from '../map/CesiumViewer.vue'
import SidePanel from '../panel/SidePanel.vue'
import TopToolbar from '../toolbar/TopToolbar.vue'
import type { ActionToolKey, ActionToolState, PanelToolKey } from '../../types/tool'

defineProps<{
  activeTool: PanelToolKey | null
  actionStateByTool: Record<ActionToolKey, ActionToolState>
  resetTick: number
}>()

const emit = defineEmits<{
  toggleTool: [tool: PanelToolKey]
  workflowAction: [tool: ActionToolKey]
  reset: []
  closePanel: []
}>()
</script>

<template>
  <div class="app-shell">
    <TopToolbar
      :active-tool="activeTool"
      @toggle-tool="emit('toggleTool', $event)"
      @reset="emit('reset')"
    />

    <div class="app-shell__body">
      <SidePanel
        :active-tool="activeTool"
        :action-state-by-tool="actionStateByTool"
        @action="emit('workflowAction', $event)"
        @close="emit('closePanel')"
      />
      <CesiumViewer :reset-tick="resetTick" class="app-shell__map" />
    </div>
  </div>
</template>
