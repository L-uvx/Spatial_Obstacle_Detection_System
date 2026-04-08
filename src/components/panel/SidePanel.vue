<script setup lang="ts">
import { computed } from 'vue'
import { panelContentByTool } from '../../types/tool'
import type { ActionToolKey, ActionToolState, PanelToolKey } from '../../types/tool'

const props = defineProps<{
  activeTool: PanelToolKey | null
  actionStateByTool: Record<ActionToolKey, ActionToolState>
}>()

const emit = defineEmits<{
  action: [tool: ActionToolKey]
  close: []
}>()

const panelTitle = computed(() => {
  return props.activeTool ? panelContentByTool[props.activeTool].title : ''
})

const panelDescription = computed(() => {
  return props.activeTool ? panelContentByTool[props.activeTool].description : ''
})

const actionTool = computed(() => {
  return props.activeTool
})

const actionState = computed(() => {
  return actionTool.value ? props.actionStateByTool[actionTool.value] : null
})

const actionButtonLabel = computed(() => {
  if (!actionTool.value) {
    return ''
  }

  return panelContentByTool[actionTool.value].title
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

        <template v-if="actionTool && actionState">
          <button
            type="button"
            class="side-panel__action"
            :disabled="actionState.status === 'running'"
            @click="emit('action', actionTool)"
          >
            {{ actionState.status === 'running' ? `${actionButtonLabel}中...` : actionButtonLabel }}
          </button>

          <p class="side-panel__status" :data-status="actionState.status">
            {{ actionState.message }}
          </p>
        </template>
      </div>
    </template>
  </aside>
</template>
