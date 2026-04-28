import type {
  ImportedObstacleGeometry,
  MultiPolygonCoordinates,
  ObstacleAnalysisMode,
  PositionCoordinate,
  RenderedObstacle,
  TargetOption,
} from '../types/tool'

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
  geometry: unknown
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

function getImportBasePath(mode: ObstacleAnalysisMode) {
  return mode === 'point' ? '/point-obstacle/import' : '/polygon-obstacle/import'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidPositionCoordinate(value: unknown): value is PositionCoordinate {
  return Array.isArray(value)
    && value.length === 2
    && isFiniteNumber(value[0])
    && isFiniteNumber(value[1])
}

function isValidLinearRingCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.every((coordinate) => isValidPositionCoordinate(coordinate))
}

function isValidPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.every((ring) => isValidLinearRingCoordinates(ring))
}

function isValidMultiPolygonCoordinates(value: unknown): value is MultiPolygonCoordinates {
  return Array.isArray(value) && value.every((polygon) => isValidPolygonCoordinates(polygon))
}

function normalizeObstacleGeometry(geometry: unknown): ImportedObstacleGeometry | null {
  if (!geometry || typeof geometry !== 'object') {
    return null
  }

  const candidate = geometry as { type?: unknown; coordinates?: unknown }

  if (candidate.type === 'Point' && isValidPositionCoordinate(candidate.coordinates)) {
    return {
      type: 'Point',
      coordinates: candidate.coordinates,
    }
  }

  if (candidate.type === 'MultiPolygon' && isValidMultiPolygonCoordinates(candidate.coordinates)) {
    return {
      type: 'MultiPolygon',
      coordinates: candidate.coordinates,
    }
  }

  console.warn('[obstacle] Unsupported obstacle geometry.', geometry)
  return null
}

export async function importObstacles(input: {
  mode: ObstacleAnalysisMode
  projectName: string
  obstacleType: string
  fileName: string
  file: File
}): Promise<ImportObstacleResult> {
  const formData = new FormData()
  formData.append('projectName', input.projectName)
  formData.append('obstacleType', input.obstacleType)
  formData.append('excelFile', input.file)

  const response = await fetch(getImportBasePath(input.mode), {
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

export async function getImportTaskStatus(mode: ObstacleAnalysisMode, taskId: string): Promise<ImportTaskStatusResult> {
  const response = await fetch(`${getImportBasePath(mode)}/${taskId}/status`)

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

export async function getImportTaskResult(mode: ObstacleAnalysisMode, taskId: string): Promise<ImportTaskResult> {
  const response = await fetch(`${getImportBasePath(mode)}/${taskId}/result`)

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
    obstacles: (result.obstacles ?? [])
      .map((item) => {
        const geometry = normalizeObstacleGeometry(item.geometry)

        if (!geometry || !isFiniteNumber(item.topElevation)) {
          return null
        }

        return {
          id: String(item.id),
          name: item.name,
          obstacleType: item.obstacleType,
          topElevation: item.topElevation,
          geometry,
        }
      })
      .filter((item): item is RenderedObstacle => item !== null),
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
