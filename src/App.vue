<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import { useWorkflowActions } from './composables/useWorkflowActions'
import type { ImportFormValue } from './types/tool'

const resetTick = ref(0)
const { state, bootstrap, openModal, closeModal, submitImport, toggleTarget, startAnalysis, exportReport } =
  useWorkflowActions()

onMounted(() => {
  void bootstrap()
})

function handleOpenAnalysis() {
  openModal()
}

function handleReset() {
  resetTick.value += 1
}

function handleCloseAnalysis() {
  closeModal()
}

function handleSubmitImport(formValue: ImportFormValue) {
  void submitImport(formValue)
}

function handleToggleTarget(targetId: string) {
  toggleTarget(targetId)
}

function handleStartAnalysis() {
  void startAnalysis()
}

function handleExportReport() {
  void exportReport()
}
</script>

<template>
  <AppShell
    :analysis-state="state"
    :reset-tick="resetTick"
    :rendered-obstacles="state.renderedObstacles"
    :initial-camera-target="state.initialCameraTarget"
    @open-analysis="handleOpenAnalysis"
    @reset="handleReset"
    @close-analysis="handleCloseAnalysis"
    @submit-import="handleSubmitImport"
    @toggle-target="handleToggleTarget"
    @start-analysis="handleStartAnalysis"
    @export-report="handleExportReport"
  />
</template>
