import { reactive } from 'vue'
import type { ActionToolKey, ActionToolState } from '../types/tool'
import { runAnalyzeWorkflow } from '../workflows/analyzeWorkflow'
import { runExportWorkflow } from '../workflows/exportWorkflow'
import { runImportWorkflow } from '../workflows/importWorkflow'

const actionLabels: Record<ActionToolKey, string> = {
  import: '一键导入',
  analyze: '一键分析',
  export: '一键导出',
}

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

async function runWorkflow(tool: ActionToolKey) {
  if (tool === 'import') {
    return runImportWorkflow()
  }

  if (tool === 'analyze') {
    return runAnalyzeWorkflow()
  }

  return runExportWorkflow()
}

export function useWorkflowActions() {
  const actionStateByTool = reactive<Record<ActionToolKey, ActionToolState>>({
    import: { status: 'idle', message: '等待触发导入流程。' },
    analyze: { status: 'idle', message: '等待触发分析流程。' },
    export: { status: 'idle', message: '等待触发导出流程。' },
  })

  async function executeToolAction(tool: ActionToolKey) {
    actionStateByTool[tool] = {
      status: 'running',
      message: `${actionLabels[tool]}执行中，当前为前端回调占位闭环。`,
    }

    await delay(400)
    const workflowResult = await runWorkflow(tool)

    actionStateByTool[tool] = {
      status: 'success',
      message: workflowResult.message,
      lastTriggeredAt: Date.now(),
    }
  }

  return {
    actionStateByTool,
    executeToolAction,
  }
}
