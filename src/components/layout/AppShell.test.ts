// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppShell from './AppShell.vue'
import type { PolygonObstacleAnalysisState } from '../../types/tool'

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
    protectionZoneTree: [
      {
        airportId: 'airport-1',
        airportName: '天河机场',
        visible: false,
        stations: [],
      },
    ],
    visibleProtectionZones: [],
    protectionZoneSampling: {
      circleAngleStepDegrees: 5,
      sectorAngleStepDegrees: 5,
    },
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
})
