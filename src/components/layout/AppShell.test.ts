// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import AppShell from './AppShell.vue'
import type { PolygonObstacleAnalysisState } from '../../types/tool'

function createState(overrides: Partial<PolygonObstacleAnalysisState> = {}): PolygonObstacleAnalysisState {
  return {
    isOpen: false,
    protectionZonePanelOpen: false,
    stationPanelOpen: false,
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
    protectionZoneTree: [
      {
        airportId: 'airport-1',
        airportName: '天河机场',
        visible: false,
        stations: [],
      },
    ],
    visibleProtectionZones: [],
    ...overrides,
  }
}

describe('AppShell', () => {
  it('shows a button that can reopen the protection zone side panel', async () => {
    const wrapper = mount(AppShell, {
      props: {
        analysisState: createState({ protectionZonePanelOpen: false, protectionZoneTree: [] }),
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
    })

    const button = wrapper.get('[data-testid="protection-zone-panel-toggle"]')

    expect(button.text()).toContain('保护区面板')

    await button.trigger('click')

    expect(wrapper.emitted('openProtectionZonePanel')).toEqual([[]])
  })

  it('forwards TopToolbar open-analysis and reset events through AppShell emits', async () => {
    const wrapper = mount(AppShell, {
      props: {
        analysisState: createState({ protectionZoneTree: [] }),
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
    })

    const toolbarButtons = wrapper.findAll('.top-toolbar .toolbar-button')

    await toolbarButtons[0].trigger('click')
    await toolbarButtons[1].trigger('click')

    expect(wrapper.emitted('openAnalysis')).toEqual([[]])
    expect(wrapper.emitted('reset')).toEqual([[]])
  })

  it('emits closeProtectionZonePanel when the protection-zone panel toggle is pressed while open', async () => {
    const wrapper = mount(AppShell, {
      props: {
        analysisState: createState({ protectionZonePanelOpen: true, protectionZoneTree: [] }),
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
    })

    await wrapper.get('[data-testid="protection-zone-panel-toggle"]').trigger('click')

    expect(wrapper.emitted('closeProtectionZonePanel')).toEqual([[]])
  })

  it('shows the current airport name in the top-right toggle button', () => {
    const wrapper = mount(AppShell, {
      props: {
        analysisState: createState({
          selectedAirportId: 'airport-1',
          airports: [
            {
              id: 'airport-1',
              name: '天河机场',
              longitude: 114.2,
              latitude: 30.7,
              stations: [],
            },
          ],
        }),
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
    })

    expect(wrapper.get('[data-testid="station-panel-toggle"]').text()).toBe('当前机场：天河机场')
  })

  it('shows fallback text and emits openStationPanel when no airports exist', async () => {
    const wrapper = mount(AppShell, {
      props: {
        analysisState: createState({ stationPanelOpen: false, airports: [], protectionZoneTree: [] }),
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
    })

    const button = wrapper.get('[data-testid="station-panel-toggle"]')

    expect(button.text()).toBe('当前机场：暂无数据')

    await button.trigger('click')

    expect(wrapper.emitted('openStationPanel')).toEqual([[]])

    await wrapper.setProps({
      analysisState: createState({ stationPanelOpen: true, airports: [], protectionZoneTree: [] }),
    })

    expect(wrapper.text()).toContain('暂无可选机场')
  })

  it('emits closeStationPanel and selectAirport from the floating selector', async () => {
    const wrapper = mount(AppShell, {
      props: {
        analysisState: createState({
          stationPanelOpen: true,
          selectedAirportId: 'airport-1',
          airports: [
            {
              id: 'airport-1',
              name: '天河机场',
              longitude: 114.2,
              latitude: 30.7,
              stations: [],
            },
            {
              id: 'airport-2',
              name: '天府机场',
              longitude: 104.4,
              latitude: 30.3,
              stations: [],
            },
          ],
        }),
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
    })

    await wrapper.get('[data-testid="station-panel-toggle"]').trigger('click')
    expect(wrapper.emitted('closeStationPanel')).toEqual([[]])

    await wrapper.get('[data-testid="station-airport-select"]').setValue('airport-2')

    expect(wrapper.emitted('selectAirport')).toEqual([['airport-2']])
  })

  it('passes visibleProtectionZones into CesiumViewer and does not pass any sampling prop', () => {
    let receivedViewerProps: { visibleProtectionZones: unknown[] } | Record<string, unknown> | null = null
    const analysisState = createState({
      visibleProtectionZones: [
        {
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
            mode: 'analytic_surface',
            baseReference: 'station',
            baseHeightMeters: 500,
            surface: {
              type: 'distance_parameterized',
              distanceSource: {
                kind: 'point',
                point: [0, 0],
              },
              distanceMetric: 'radial',
              clampRange: {
                startMeters: 50,
                endMeters: 5000,
              },
              heightModel: {
                type: 'angle_linear_rise',
                angleDegrees: 3,
                distanceOffsetMeters: 50,
              },
            },
          },
          properties: {
            label: '北侧区域',
          },
        },
      ],
    })

    mount(AppShell, {
      props: {
        analysisState,
        resetTick: 0,
        renderedObstacles: [],
        initialCameraTarget: null,
      },
      global: {
        stubs: {
          CesiumViewer: defineComponent({
            name: 'CesiumViewer',
            props: ['resetTick', 'obstacles', 'visibleStations', 'initialCameraTarget', 'visibleProtectionZones'],
            setup(props) {
              receivedViewerProps = props as unknown as { visibleProtectionZones: unknown[] } & Record<string, unknown>
              return () => null
            },
          }),
          PolygonObstacleAnalysisModal: true,
          SidePanel: true,
          TopToolbar: true,
        },
      },
    })

    expect(receivedViewerProps).not.toBeNull()

    if (receivedViewerProps === null) {
      throw new Error('CesiumViewer props were not captured')
    }

    const viewerProps = receivedViewerProps as { visibleProtectionZones: unknown[] } & Record<string, unknown>

    expect(viewerProps.visibleProtectionZones).toEqual(analysisState.visibleProtectionZones)
    expect(Object.keys(viewerProps)).not.toContain('samplingStepDegrees')
    expect(Object.keys(viewerProps)).not.toContain('samplingStep')
  })
})
