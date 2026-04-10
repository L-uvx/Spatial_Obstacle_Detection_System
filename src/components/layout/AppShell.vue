<script setup lang="ts">
import CesiumViewer from '../map/CesiumViewer.vue'
import PolygonObstacleAnalysisModal from '../panel/PolygonObstacleAnalysisModal.vue'
import TopToolbar from '../toolbar/TopToolbar.vue'
import type { ImportFormValue, PolygonObstacleAnalysisState } from '../../types/tool'

defineProps<{
  analysisState: PolygonObstacleAnalysisState
  resetTick: number
}>()

const emit = defineEmits<{
  openAnalysis: []
  reset: []
  closeAnalysis: []
  submitImport: [formValue: ImportFormValue]
  toggleTarget: [targetId: string]
  startAnalysis: []
  exportReport: []
}>()
</script>

<template>
  <div class="app-shell">
    <TopToolbar @open-analysis="emit('openAnalysis')" @reset="emit('reset')" />

    <div class="app-shell__body">
      <PolygonObstacleAnalysisModal
        :state="analysisState"
        @close="emit('closeAnalysis')"
        @submit-import="emit('submitImport', $event)"
        @toggle-target="emit('toggleTarget', $event)"
        @start-analysis="emit('startAnalysis')"
        @export-report="emit('exportReport')"
      />
      <CesiumViewer :reset-tick="resetTick" class="app-shell__map" />
    </div>
  </div>
</template>
