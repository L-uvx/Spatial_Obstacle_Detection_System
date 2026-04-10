export interface ExportReportResult {
  downloadUrl: string
  message: string
}

export async function createExportTask(input: { analysisTaskId: string }): Promise<ExportReportResult> {
  return {
    downloadUrl: `/reports/${input.analysisTaskId}.docx`,
    message: '导出服务占位已执行，后续可接入报告导出与下载接口。',
  }
}
