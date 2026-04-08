export interface ImportObstacleResult {
  message: string
}

export async function importObstacles(): Promise<ImportObstacleResult> {
  return {
    message: '导入服务占位已执行，后续可接入文件上传和导入接口。',
  }
}
