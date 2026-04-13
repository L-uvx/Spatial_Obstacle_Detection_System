import type { MultiPolygonCoordinates, RenderedObstacle, TargetOption } from '../types/tool'

export interface ImportObstacleResult {
  taskId: string
  status: string
  message: string
  progressPercent: number
  projectId: number | string
  obstacleBatchId: string
}

export interface ImportTaskStatusResult {
  taskId: string
  status: string
  message: string
  progressPercent: number
}

export interface ImportTaskResult {
  taskId: string
  projectId: number | string
  obstacleBatchId: string
  importedCount?: number
  failedCount?: number
  obstacles: RenderedObstacle[]
}

interface ImportObstacleResponseItem {
  id: number | string
  name: string
  obstacleType: string
  topElevation: number
  geometry: {
    type: 'MultiPolygon'
    coordinates: MultiPolygonCoordinates
  }
}

interface ImportTaskResultResponse {
  taskId: string
  projectId: number | string
  obstacleBatchId: string
  importedCount?: number
  failedCount?: number
  obstacles?: ImportObstacleResponseItem[]
}

interface ImportTargetResponseItem {
  id: string
  name: string
  category: '机场' | '空管局'
  distance: number | string
  distanceUnit?: string
}

export async function importObstacles(input: {
  projectName: string
  obstacleType: string
  fileName: string
  file: File
}): Promise<ImportObstacleResult> {
  const formData = new FormData()
  formData.append('projectName', input.projectName)
  formData.append('obstacleType', input.obstacleType)
  formData.append('excelFile', input.file)

  const response = await fetch('/polygon-obstacle/import', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`导入接口请求失败：${response.status}`)
  }

  const result = (await response.json()) as ImportObstacleResult

  return {
    taskId: result.taskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
    projectId: result.projectId,
    obstacleBatchId: result.obstacleBatchId,
  }
}

export async function getImportTaskStatus(taskId: string): Promise<ImportTaskStatusResult> {
  const response = await fetch(`/polygon-obstacle/import/${taskId}/status`)

  if (!response.ok) {
    throw new Error(`导入状态查询失败：${response.status}`)
  }

  const result = (await response.json()) as ImportTaskStatusResult

  return {
    taskId: result.taskId,
    status: result.status,
    message: result.message,
    progressPercent: result.progressPercent,
  }
}

export async function getImportTaskResult(taskId: string): Promise<ImportTaskResult> {
  const response = await fetch(`/polygon-obstacle/import/${taskId}/result`)

  if (!response.ok) {
    throw new Error(`导入结果查询失败：${response.status}`)
  }

  const result = (await response.json()) as ImportTaskResultResponse

  return {
    taskId: result.taskId,
    projectId: result.projectId,
    obstacleBatchId: result.obstacleBatchId,
    importedCount: result.importedCount,
    failedCount: result.failedCount,
    obstacles: (result.obstacles ?? []).map((item) => ({
      id: String(item.id),
      name: item.name,
      obstacleType: item.obstacleType,
      topElevation: item.topElevation,
      geometry: {
        type: item.geometry.type,
        coordinates: item.geometry.coordinates,
      },
    })),
  }
}

export async function getImportTargets(taskId: string): Promise<TargetOption[]> {
  const response = await fetch(`/polygon-obstacle/import/${taskId}/targets`)

  if (!response.ok) {
    throw new Error(`候选对象查询失败：${response.status}`)
  }

  const result = (await response.json()) as ImportTargetResponseItem[]

  return result.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    distance: `${item.distance} ${item.distanceUnit ?? ''}`.trim(),
  }))
}
