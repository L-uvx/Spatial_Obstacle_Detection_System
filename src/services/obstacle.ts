export interface ImportObstacleResult {
  projectId: string
  obstacleBatchId: string
  message: string
}

export async function importObstacles(input: {
  projectName: string
  obstacleType: string
  fileName: string
}): Promise<ImportObstacleResult> {
  return {
    projectId: 'project-1',
    obstacleBatchId: 'batch-1',
    message: `已接收项目“${input.projectName}”的${input.obstacleType}导入请求，文件为 ${input.fileName}。`,
  }
}
