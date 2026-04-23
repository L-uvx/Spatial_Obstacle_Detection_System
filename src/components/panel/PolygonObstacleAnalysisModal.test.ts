// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import PolygonObstacleAnalysisModal from './PolygonObstacleAnalysisModal.vue'
import { obstacleTypeOptions } from '../../types/tool'
import type { PolygonObstacleAnalysisState, ProtectionZoneAirportNode } from '../../types/tool'

function createVisibleProtectionZoneRegion(): PolygonObstacleAnalysisState['visibleProtectionZones'][number] {
  return {
    key: 'airport-1:station-1:zone-a:rule-a:region-north',
    id: 'airport-1-station-1-zone-a-rule-a-region-north',
    airportId: 'airport-1',
    airportName: '天河机场',
    stationId: 'station-1',
    stationName: '导航台A',
    stationType: 'VOR',
    zoneCode: 'zone-a',
    zoneName: 'A区',
    ruleCode: 'rule-a',
    ruleName: '规则A',
    regionCode: 'region-north',
    regionName: '北侧区域',
    geometry: {
      shapeType: 'multipolygon',
      coordinates: [
        [
          [
            [114.2, 30.7],
            [114.205, 30.7],
            [114.205, 30.695],
            [114.2, 30.695],
            [114.2, 30.7],
          ],
        ],
      ],
    },
    vertical: {
      mode: 'flat',
      baseReference: 'station',
      baseHeightMeters: 500,
    },
    properties: {
      label: '北侧区域',
    },
  }
}

function createImportFormState(): PolygonObstacleAnalysisState {
  return {
    isOpen: true,
    protectionZonePanelOpen: false,
    stationPanelOpen: false,
    stage: 'import-form',
    bootstrapStatus: 'idle',
    bootstrapMessage: '',
    initialCameraTarget: null,
    airports: [],
    selectedAirportId: '',
    visibleStations: [],
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
    analysisRuleResults: [],
    statusMessage: '请填写项目名称、障碍物类型并上传 Excel。',
    exportTaskId: '',
    exportStatus: 'idle',
    exportProgressPercent: 0,
    exportMessage: '分析完成后可导出 Word 结论。',
    exportFileName: '',
    downloadUrl: '',
    exportErrorMessage: '',
    renderedObstacles: [],
    protectionZoneTree: [],
    visibleProtectionZones: [createVisibleProtectionZoneRegion()],
  }
}

function createProtectionZoneTree(): ProtectionZoneAirportNode[] {
  return [
    {
      airportId: 'airport-1',
      airportName: '天河机场',
      visible: true,
      stations: [
        {
          stationId: 'station-1',
          stationName: '导航台A',
          stationType: 'VOR',
          visible: true,
          zones: [
            {
              key: 'airport-1:station-1:zone-a:rule-a',
              airportId: 'airport-1',
              airportName: '天河机场',
              stationId: 'station-1',
              stationName: '导航台A',
              stationType: 'VOR',
              zoneCode: 'zone-a',
              zoneName: 'A区',
              ruleCode: 'rule-a',
              ruleName: '规则A',
              visible: true,
              regions: [
                {
                  id: 'airport-1-station-1-zone-a-rule-a-region-north',
                  airportId: 'airport-1',
                  airportName: '天河机场',
                  stationId: 'station-1',
                  stationName: '导航台A',
                  stationType: 'VOR',
                  ruleCode: 'rule-a',
                  ruleName: '规则A',
                  zoneCode: 'zone-a',
                  zoneName: 'A区',
                  regionCode: 'region-north',
                  regionName: '北侧区域',
                  geometry: {
                    shapeType: 'multipolygon',
                    coordinates: [
                      [
                        [
                          [114.2, 30.7],
                          [114.205, 30.7],
                          [114.205, 30.695],
                          [114.2, 30.695],
                          [114.2, 30.7],
                        ],
                      ],
                    ],
                  },
                  vertical: {
                    mode: 'flat',
                    baseReference: 'station',
                    baseHeightMeters: 500,
                  },
                  properties: {
                    label: '北侧区域',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

describe('PolygonObstacleAnalysisModal', () => {
  it('wires protection-zone visibility events from AppShell into workflow actions at the app root', async () => {
    vi.resetModules()

    const toggleProtectionZoneAirportVisibility = vi.fn()
    const toggleProtectionZoneStationVisibility = vi.fn()
    const toggleProtectionZoneVisibility = vi.fn()

    vi.doMock('../../components/layout/AppShell.vue', () => ({
      default: defineComponent({
        name: 'AppShellStub',
        emits: [
          'open-analysis',
          'reset',
          'close-analysis',
          'submit-import',
          'toggle-target',
          'set-airport-protection-zone-visibility',
          'set-station-protection-zone-visibility',
          'set-zone-protection-zone-visibility',
          'start-analysis',
          'export-report',
        ],
        template: '<div class="app-shell-stub"></div>',
      }),
    }))

    vi.doMock('../../composables/useWorkflowActions', () => ({
      useWorkflowActions: () => ({
        state: createImportFormState(),
        bootstrap: vi.fn(async () => undefined),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        submitImport: vi.fn(async () => undefined),
        toggleTarget: vi.fn(),
        startAnalysis: vi.fn(async () => undefined),
        exportReport: vi.fn(async () => undefined),
        toggleProtectionZoneAirportVisibility,
        toggleProtectionZoneStationVisibility,
        toggleProtectionZoneVisibility,
      }),
    }))

    const { default: App } = await import('../../App.vue')
    const wrapper = mount(App)
    const shell = wrapper.getComponent({ name: 'AppShellStub' })

    shell.vm.$emit('set-airport-protection-zone-visibility', 'airport-1', false)
    shell.vm.$emit('set-station-protection-zone-visibility', 'airport-1', 'station-1', false)
    shell.vm.$emit('set-zone-protection-zone-visibility', 'airport-1', 'station-1', 'zone-a', false)

    expect(toggleProtectionZoneAirportVisibility).toHaveBeenCalledWith('airport-1', false)
    expect(toggleProtectionZoneStationVisibility).toHaveBeenCalledWith('airport-1', 'station-1', false)
    expect(toggleProtectionZoneVisibility).toHaveBeenCalledWith('airport-1', 'station-1', 'zone-a', false)

    vi.doUnmock('../../components/layout/AppShell.vue')
    vi.doUnmock('../../composables/useWorkflowActions')
    vi.resetModules()
  })

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
          protectionZoneTree: createProtectionZoneTree(),
        },
      },
    })

    expect(wrapper.text()).toContain('已基于当前导入障碍物和所选机场生成最小分析结果。')
    expect(wrapper.text()).toContain('Airport Near')
    expect(wrapper.text()).toContain('Airport Far')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).not.toContain('保护区显示管理')
    expect(wrapper.text()).not.toContain('天河机场')
    expect(wrapper.text()).not.toContain('导航台A')
  })

  it('renders rule results grouped by station with gb and mh content', () => {
    const wrapper = mount(PolygonObstacleAnalysisModal, {
      props: {
        state: {
          ...createImportFormState(),
          stage: 'analysis-result',
          analysisTaskId: 'analysis-task-1',
          analysisSummary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
          analysisRuleResults: [
            {
              stationId: '4',
              stationName: '西南近无方向信标台',
              stationType: 'NDB',
              obstacleId: '67',
              obstacleName: '障碍物2',
              rawObstacleType: '建筑物/构建物',
              globalObstacleCategory: 'building_general',
              ruleName: 'ndb_minimum_distance_50m',
              zoneCode: 'ndb_minimum_distance_50m',
              zoneName: 'NDB 50m minimum distance zone',
              regionCode: 'default',
              regionName: 'default',
              isApplicable: true,
              isCompliant: true,
              message: 'distance meets minimum threshold',
              standards: {
                gb: {
                  code: 'GB_NDB_50m最小间距区域_50',
                  text: '无方向信标天线与地形地物之间的最小间距国标内容',
                  isCompliant: true,
                },
                mh: {
                  code: 'MH_NDB_50m最小间距区域_50',
                  text: '无方向信标天线与地形地物之间的最小间距行标内容',
                  isCompliant: true,
                },
              },
            },
          ],
        },
      },
    })

    expect(wrapper.text()).toContain('西南近无方向信标台')
    expect(wrapper.text()).toContain('障碍物2')
    expect(wrapper.text()).toContain('ndb_minimum_distance_50m')
    expect(wrapper.text()).toContain('国标内容')
    expect(wrapper.text()).toContain('行标内容')
    expect(wrapper.text()).toContain('GB_NDB_50m最小间距区域_50')
    expect(wrapper.text()).toContain('MH_NDB_50m最小间距区域_50')
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
