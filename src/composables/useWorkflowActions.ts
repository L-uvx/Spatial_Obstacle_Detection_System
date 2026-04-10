import { reactive } from 'vue'
import type { ImportFormValue, PolygonObstacleAnalysisState } from '../types/tool'
import { listAnalysisTargets } from '../services/analysis'
import { runAnalyzeWorkflow } from '../workflows/analyzeWorkflow'
import { runExportWorkflow } from '../workflows/exportWorkflow'
import { runImportWorkflow } from '../workflows/importWorkflow'

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function createInitialState(): PolygonObstacleAnalysisState {
  return {
    isOpen: false,
    stage: 'idle',
    projectName: '',
    obstacleType: '',
    fileName: '',
    projectId: '',
    obstacleBatchId: '',
    targetOptions: [],
    selectedTargetIds: [],
    analysisTaskId: '',
    analysisSummary: '',
    statusMessage: '等待打开多边形障碍物分析流程。',
    exportStatus: 'idle',
    exportMessage: '分析完成后可导出 Word 结论。',
    downloadUrl: '',
  }
}

export function useWorkflowActions() {
  const state = reactive(createInitialState())

  function openModal() {
    state.isOpen = true
    state.stage = 'import-form'
    state.statusMessage = '请填写项目名称、障碍物类型并上传 Excel。'
  }

  function closeModal() {
    Object.assign(state, createInitialState())
  }

  async function submitImport(formValue: ImportFormValue) {
    if (!formValue.file) {
      state.stage = 'error'
      state.statusMessage = '请先选择 Excel 文件后再开始导入。'
      return
    }

    state.projectName = formValue.projectName
    state.obstacleType = formValue.obstacleType
    state.fileName = formValue.fileName
    state.stage = 'importing'
    state.statusMessage = '导入任务执行中，正在等待后端解析和入库。'

    await delay(400)
    const workflowResult = await runImportWorkflow({
      ...formValue,
      file: formValue.file,
    })

    state.projectId = workflowResult.projectId
    state.obstacleBatchId = workflowResult.obstacleBatchId
    state.targetOptions = listAnalysisTargets()
    state.selectedTargetIds = []
    state.stage = 'target-selection'
    state.statusMessage = workflowResult.message
  }

  function toggleTarget(targetId: string) {
    const index = state.selectedTargetIds.indexOf(targetId)

    if (index >= 0) {
      state.selectedTargetIds.splice(index, 1)
      return
    }

    state.selectedTargetIds.push(targetId)
  }

  async function startAnalysis() {
    if (state.selectedTargetIds.length === 0) {
      state.statusMessage = '请至少选择一个机场/空管局后再开始分析。'
      return
    }

    state.stage = 'analyzing'
    state.statusMessage = '分析任务执行中，正在等待后端返回基础分析结论。'

    await delay(400)
    const workflowResult = await runAnalyzeWorkflow({
      projectId: state.projectId,
      obstacleBatchId: state.obstacleBatchId,
      targetIds: [...state.selectedTargetIds],
    })

    state.analysisTaskId = workflowResult.analysisTaskId
    state.analysisSummary = workflowResult.summary
    state.stage = 'analysis-result'
    state.statusMessage = workflowResult.message
  }

  async function exportReport() {
    state.exportStatus = 'running'
    state.exportMessage = '正在导出 Word 结论报告。'

    await delay(200)
    const workflowResult = await runExportWorkflow({
      analysisTaskId: state.analysisTaskId,
    })

    state.downloadUrl = workflowResult.downloadUrl
    state.exportStatus = 'success'
    state.exportMessage = workflowResult.message
  }

  return {
    state,
    openModal,
    closeModal,
    submitImport,
    toggleTarget,
    startAnalysis,
    exportReport,
  }
}
