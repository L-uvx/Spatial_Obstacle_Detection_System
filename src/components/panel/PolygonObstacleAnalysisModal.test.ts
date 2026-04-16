// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PolygonObstacleAnalysisModal from './PolygonObstacleAnalysisModal.vue'
import { obstacleTypeOptions } from '../../types/tool'
import type { PolygonObstacleAnalysisState } from '../../types/tool'

function createImportFormState(): PolygonObstacleAnalysisState {
  return {
    isOpen: true,
    stage: 'import-form',
    bootstrapStatus: 'idle',
    bootstrapMessage: '',
    initialCameraTarget: null,
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
    analysisSelectedTargets: [],
    analysisObstacleCount: 0,
    statusMessage: '请填写项目名称、障碍物类型并上传 Excel。',
    exportTaskId: '',
    exportStatus: 'idle',
    exportProgressPercent: 0,
    exportMessage: '分析完成后可导出 Word 结论。',
    exportFileName: '',
    downloadUrl: '',
    exportErrorMessage: '',
    renderedObstacles: [],
  }
}

describe('PolygonObstacleAnalysisModal', () => {
  it('uses a modal-styled button to trigger excel file selection', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: createImportFormState(),
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
        state: createImportFormState(),
      },
    })

    await wrapper.get('.analysis-modal__project-input').setValue('武汉净空项目')
    await wrapper.get('.analysis-modal__obstacle-type-select').setValue('铁塔/高塔')

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
          obstacleType: '铁塔/高塔',
          fileName: 'obstacles.xlsx',
          file,
        },
      ],
    ])
  })

  it('resets import form state when modal closes and reopens', async () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: createImportFormState(),
      },
    })

    await wrapper.get('.analysis-modal__project-input').setValue('武汉净空项目')
    await wrapper.get('.analysis-modal__obstacle-type-select').setValue('铁塔/高塔')

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const fileInput = wrapper.get('.analysis-modal__file-input').element as HTMLInputElement
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    })

    await wrapper.get('.analysis-modal__file-input').trigger('change')

    await wrapper.setProps({
      state: {
        ...createImportFormState(),
        isOpen: false,
      },
    })

    await wrapper.setProps({
      state: createImportFormState(),
    })

    expect((wrapper.get('.analysis-modal__project-input').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('.analysis-modal__obstacle-type-select').element as HTMLSelectElement).value).toBe(obstacleTypeOptions[0])
    expect(wrapper.find('.analysis-modal__file-name').exists()).toBe(false)
    expect(wrapper.get('.analysis-modal__primary').attributes('disabled')).toBeDefined()
  })

  it('renders minimal text analysis result details from backend', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: 'analysis-task-1',
          analysisSummary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
          analysisSelectedTargets: [
            { id: '1', name: 'Airport Near', category: '机场' },
            { id: '2', name: 'Airport Far', category: '机场' },
          ],
          analysisObstacleCount: 2,
        },
      },
    })

    expect(wrapper.text()).toContain('已基于当前导入障碍物和所选机场生成最小分析结果。')
    expect(wrapper.text()).toContain('Airport Near')
    expect(wrapper.text()).toContain('Airport Far')
    expect(wrapper.text()).toContain('2')
  })

  it('renders export running progress in analysis result view', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: 'analysis-task-1',
          exportTaskId: 'export-task-1',
          exportStatus: 'running',
          exportProgressPercent: 50,
          exportMessage: 'export task running',
        },
      },
    })

    expect(wrapper.text()).toContain('50%')
    expect(wrapper.text()).toContain('export task running')
    expect(wrapper.get('button.analysis-modal__primary').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button.analysis-modal__primary').text()).toContain('导出中...')
  })

  it('renders pending export state in analysis result view', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: 'analysis-task-1',
          exportTaskId: 'export-task-1',
          exportStatus: 'pending',
          exportProgressPercent: 0,
          exportMessage: 'export task pending',
        },
      },
    })

    expect(wrapper.get('button.analysis-modal__primary').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button.analysis-modal__primary').text()).toContain('导出中...')
    expect(wrapper.text()).toContain('当前进度：0%')
  })

  it('disables export button when analysis task id is empty in analysis result view', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: '',
          exportStatus: 'idle',
        },
      },
    })

    expect(wrapper.get('button.analysis-modal__primary').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button.analysis-modal__primary').text()).toContain('导出结论')
  })

  it('renders export success file name and redownload link', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: 'analysis-task-1',
          exportTaskId: 'export-task-1',
          exportStatus: 'succeeded',
          exportProgressPercent: 100,
          exportMessage: '报告已生成，开始下载。',
          exportFileName: 'polygon-obstacle-analysis-analysis-task-1.docx',
          downloadUrl: 'http://127.0.0.1:8000/polygon-obstacle/exports/export-task-1/download',
        },
      },
    })

    expect(wrapper.text()).toContain('polygon-obstacle-analysis-analysis-task-1.docx')
    expect(wrapper.get('button.analysis-modal__primary').text()).toContain('重新导出')
    expect(wrapper.get('a.analysis-modal__download').attributes('href')).toBe(
      'http://127.0.0.1:8000/polygon-obstacle/exports/export-task-1/download',
    )
    expect(wrapper.get('a.analysis-modal__download').attributes('download')).toBeDefined()
    expect(wrapper.get('a.analysis-modal__download').text()).toContain('重新下载')
  })

  it('renders export error message when present', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: 'analysis-task-1',
          exportTaskId: 'export-task-1',
          exportStatus: 'failed',
          exportMessage: '导出失败，请重试。',
          exportErrorMessage: 'report generation failed',
        },
      },
    })

    expect(wrapper.text()).toContain('导出失败，请重试。')
    expect(wrapper.text()).toContain('report generation failed')
  })
})
