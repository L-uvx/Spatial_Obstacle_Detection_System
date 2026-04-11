// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PolygonObstacleAnalysisModal from './PolygonObstacleAnalysisModal.vue'

describe('PolygonObstacleAnalysisModal', () => {
  it('uses a modal-styled button to trigger excel file selection', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          isOpen: true,
          stage: 'import-form',
          projectName: '',
          obstacleType: '',
          fileName: '',
          importTaskId: '',
          importStatus: 'idle',
          importProgressPercent: 0,
          projectId: '',
          obstacleBatchId: '',
          targetOptions: [],
          selectedTargetIds: [],
          analysisTaskId: '',
          analysisSummary: '',
          statusMessage: '请填写项目名称、障碍物类型并上传 Excel。',
          exportStatus: 'idle',
          exportMessage: '分析完成后可导出 Word 结论。',
          downloadUrl: '',
        },
      },
    })

    await wrapper.get('button.analysis-modal__file-trigger').trigger('click')

    expect(wrapper.get('button.analysis-modal__file-trigger').text()).toContain('选择 Excel 文件')
    expect(clickSpy).toHaveBeenCalledTimes(1)

    clickSpy.mockRestore()
  })

  it('submits selected excel file name through browser file picker flow', async () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          isOpen: true,
          stage: 'import-form',
          projectName: '',
          obstacleType: '',
          fileName: '',
          importTaskId: '',
          importStatus: 'idle',
          importProgressPercent: 0,
          projectId: '',
          obstacleBatchId: '',
          targetOptions: [],
          selectedTargetIds: [],
          analysisTaskId: '',
          analysisSummary: '',
          statusMessage: '请填写项目名称、障碍物类型并上传 Excel。',
          exportStatus: 'idle',
          exportMessage: '分析完成后可导出 Word 结论。',
          downloadUrl: '',
        },
      },
    })

    await wrapper.get('input[type="text"]').setValue('武汉净空项目')
    await wrapper.get('select').setValue('铁塔')

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.get('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    })

    await wrapper.get('input[type="file"]').trigger('change')
    await wrapper.get('button.analysis-modal__primary').trigger('click')

    expect(wrapper.emitted('submitImport')).toEqual([
      [
        {
          projectName: '武汉净空项目',
          obstacleType: '铁塔',
          fileName: 'obstacles.xlsx',
          file,
        },
      ],
    ])
  })
})
