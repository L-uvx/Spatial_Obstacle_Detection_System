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
    stationPanelOpen: false,
    analysisMode: 'polygon',
    stage: 'analysis-result',
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
    analysisTaskId: 'analysis-task-1',
    analysisSummary: '',
    analysisSelectedTargets: [],
    analysisObstacleCount: 0,
    analysisRuleResults: [],
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
    flyToTargetTick: 0,
    flyToTargetPayload: null,
    ...overrides,
  }
}

describe('SidePanel', () => {
  it('does not keep protection zone controls in the DOM when closed', () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: false,
      },
    })

    expect(wrapper.find('aside.side-panel').exists()).toBe(false)
    expect(wrapper.find('button.side-panel__close').exists()).toBe(false)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('renders the protection-zone tree collapsed by default when opened', () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    expect(wrapper.get('aside.side-panel').classes()).toContain('is-open')
    expect(wrapper.text()).toContain('保护区显示管理')
    expect(wrapper.text()).toContain('天河机场')
    expect(wrapper.get('[data-airport-toggle="airport-1"]').attributes('aria-label')).toBe('展开机场 天河机场 下的台站列表')
    expect(wrapper.text()).not.toContain('导航台A')
    expect(wrapper.text()).not.toContain('A区')
  })

  it('applies the shared shell scrollbar hook to the side panel scroll container', () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    expect(wrapper.get('.side-panel__content').classes()).toContain('shell-scrollbar')
  })

  it('shows stations after expanding an airport node', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    await wrapper.get('[data-airport-toggle="airport-1"]').trigger('click')

    expect(wrapper.get('[data-airport-toggle="airport-1"]').attributes('aria-label')).toBe('收起机场 天河机场 下的台站列表')
    expect(wrapper.text()).toContain('导航台A')
    expect(wrapper.text()).not.toContain('A区')
  })

  it('shows zones after expanding a station node', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    await wrapper.get('[data-airport-toggle="airport-1"]').trigger('click')
    await wrapper.get('[data-station-toggle="airport-1:station-1"]').trigger('click')

    expect(wrapper.get('[data-station-toggle="airport-1:station-1"]').attributes('aria-label')).toBe('收起台站 导航台A 下的保护区列表')
    expect(wrapper.text()).toContain('A区')
  })

  it('keeps expansion state unchanged when visibility checkboxes are toggled', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    await wrapper.get('[data-airport-toggle="airport-1"]').trigger('click')

    const airportCheckbox = wrapper.get('input[type="checkbox"]')

    await airportCheckbox.setValue(true)

    expect(wrapper.text()).toContain('导航台A')
    expect(wrapper.get('[data-airport-toggle="airport-1"]').attributes('aria-expanded')).toBe('true')
  })

  it('resets all nodes back to collapsed after the panel is reopened', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    await wrapper.get('[data-airport-toggle="airport-1"]').trigger('click')
    await wrapper.get('[data-station-toggle="airport-1:station-1"]').trigger('click')

    expect(wrapper.text()).toContain('A区')

    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })

    expect(wrapper.text()).toContain('天河机场')
    expect(wrapper.text()).not.toContain('导航台A')
    expect(wrapper.text()).not.toContain('A区')
  })

  it('emits zone toggle from the right side panel tree', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    await wrapper.get('[data-airport-toggle="airport-1"]').trigger('click')
    await wrapper.get('[data-station-toggle="airport-1:station-1"]').trigger('click')

    const zoneCheckbox = wrapper.get('[data-zone-key="airport-1:station-1:zone-a:rule-a"]')

    await zoneCheckbox.setValue(true)

    expect(wrapper.emitted('setZoneProtectionZoneVisibility')).toEqual([
      ['airport-1', 'station-1', 'zone-a', true],
    ])
  })

  it('emits flyToZone with the matching zone and exposes an accessible locate label', async () => {
    const wrapper = mount(SidePanel, {
      props: {
        state: createState(),
        isOpen: true,
      },
    })

    await wrapper.get('[data-airport-toggle="airport-1"]').trigger('click')
    await wrapper.get('[data-station-toggle="airport-1:station-1"]').trigger('click')

    const locateButton = wrapper.get('button.side-panel__locate')

    expect(locateButton.attributes('aria-label')).toBe('定位到保护区 A区')

    await locateButton.trigger('click')

    expect(wrapper.emitted('flyToZone')).toBeTruthy()
    expect(wrapper.emitted('flyToZone')?.[0]).toEqual([
      createProtectionZoneTree()[0].stations[0].zones[0],
    ])
  })
})
