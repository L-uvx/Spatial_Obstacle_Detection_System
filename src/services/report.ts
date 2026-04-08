export interface ExportReportResult {
  message: string
}

export async function createExportTask(): Promise<ExportReportResult> {
  return {
    message: '导出服务占位已执行，后续可接入报告导出与下载接口。',
  }
}
