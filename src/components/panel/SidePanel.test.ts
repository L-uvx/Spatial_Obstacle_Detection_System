// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SidePanel from './SidePanel.vue'
import type { PolygonObstacleAnalysisState, ProtectionZoneAirportNode } from '../../types/tool'

function createProtectionZoneTree(): ProtectionZoneAirportNode[] {
  return [
    {
      airportId: 'airport-1',
      airportName: '天河机场',
      visible: false,
      stations: [
        {
          stationId: 'station-1',
          stationName: '导航台A',
          stationType: 'VOR',
          visible: false,
          zones: [
            {
              key: 'airport-1:station-1:zone-a',
              airportId: 'airport-1',
              airportName: '天河机场',
              stationId: 'station-1',
              stationName: '导航台A',
              stationType: 'VOR',
              zoneCode: 'zone-a',
              zoneName: 'A区',
              ruleCode: 'rule-a',
              ruleName: '规则A',
              visible: false,
              regions: [],
            },
          ],
        },
      ],
    },
  ]
}

function createState(overrides: Partial<PolygonObstacleAnalysisState> = {}): PolygonObstacleAnalysisState {
  return {
    isOpen: false,
    protectionZonePanelOpen: false,
    stage: 'analysis-result',
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
    analysisTaskId: 'analysis-task-1',
    analysisSummary: '',
    analysisSelectedTargets: [],
    analysisObstacleCount: 0,
    statusMessage: '',
    exportTaskId: '',
    exportStatus: 'idle',
    exportProgressPercent: 0,
    exportMessage: '',
    exportFileName: '',
    downloadUrl: '',
    exportErrorMessage: '',
    renderedObstacles: [],
    protectionZoneTree: createProtectionZoneTree(),
    visibleProtectionZones: [],
    protectionZoneSampling: {
      circleAngleStepDegrees: 5,
      sectorAngleStepDegrees: 5,
    },
    ...overrides,
  }
}

describe('SidePanel', () => {
  it('renders protection zone controls as a global right-side panel when opened', () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    expect(wrapper.get('aside.side-panel').classes()).toContain('is-open')
    expect(wrapper.text()).toContain('保护区显示管理')
    expect(wrapper.text()).toContain('天河机场')
    expect(wrapper.text()).toContain('导航台A')
    expect(wrapper.text()).toContain('A区')
  })

  it('emits zone toggle from the right side panel tree', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    const zoneCheckbox = wrapper.get('[data-zone-key="airport-1:station-1:zone-a"]')

    await zoneCheckbox.setValue(true)

    expect(wrapper.emitted('setZoneProtectionZoneVisibility')).toEqual([
      ['airport-1', 'station-1', 'zone-a', true],
    ])
  })
})
