import {
  getImportTargets,
  getImportTaskResult,
  getImportTaskStatus,
  importObstacles,
} from '../services/obstacle'
import type { RenderedObstacle, TargetOption } from '../types/tool'

export interface ImportWorkflowResult {
  importTaskId: string
  importStatus: string
  importProgressPercent: number
  projectId: string
  obstacleBatchId: string
  targetOptions: TargetOption[]
  obstacles: RenderedObstacle[]
  message: string
}

// 为轮询流程提供统一的等待间隔。
function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

// 轮询导入任务，直到后端返回成功、失败或超时。
async function waitForImportCompletion(taskId: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const statusResult = await getImportTaskStatus(taskId)

    if (statusResult.status === 'succeeded') {
      return statusResult
    }

    if (statusResult.status === 'failed') {
      throw new Error(statusResult.message || '导入任务失败，请检查后端处理结果。')
    }

    await delay(1000)
  }

  throw new Error('导入任务超时，请稍后重试。')
}

// 串联导入创建、轮询、结果获取和候选对象查询。
export async function runImportWorkflow(input: {
  projectName: string
  obstacleType: string
  fileName: string
  file: File
}): Promise<ImportWorkflowResult> {
  const createResult = await importObstacles(input)
  const statusResult = await waitForImportCompletion(createResult.taskId)
  const importResult = await getImportTaskResult(createResult.taskId)
  const targetOptions = await getImportTargets(createResult.taskId)
  const obstacleMessage =
    importResult.obstacles.length > 0 ? '障碍物已准备渲染到地图图层。' : '未返回可渲染的障碍物。'

  return {
    importTaskId: createResult.taskId,
    importStatus: statusResult.status,
    importProgressPercent: statusResult.progressPercent,
    projectId: String(importResult.projectId),
    obstacleBatchId: importResult.obstacleBatchId,
    targetOptions,
    obstacles: importResult.obstacles,
    message: `${statusResult.message}${obstacleMessage}`,
  }
}
