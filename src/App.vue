<script setup lang="ts">
import { ref } from 'vue'
import AppShell from './components/layout/AppShell.vue'
import { useWorkflowActions } from './composables/useWorkflowActions'
import type { ImportFormValue } from './types/tool'

const resetTick = ref(0)
const { state, openModal, closeModal, submitImport, toggleTarget, startAnalysis, exportReport } =
  useWorkflowActions()

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
    @open-analysis="handleOpenAnalysis"
    @reset="handleReset"
    @close-analysis="handleCloseAnalysis"
    @submit-import="handleSubmitImport"
    @toggle-target="handleToggleTarget"
    @start-analysis="handleStartAnalysis"
    @export-report="handleExportReport"
  />
</template>
