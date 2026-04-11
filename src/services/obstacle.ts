export interface ImportObstacleResult {
  projectId: string
  obstacleBatchId: string
  message: string
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
    projectId: result.projectId,
    obstacleBatchId: result.obstacleBatchId,
    message: result.message,
  }
}
