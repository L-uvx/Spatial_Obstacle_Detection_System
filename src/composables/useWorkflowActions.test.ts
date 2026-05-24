import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWorkflowActions } from './useWorkflowActions'
import { getBootstrapData } from '../services/bootstrap'
import { getAirportProtectionZones } from '../services/analysis'
import { runAnalyzeWorkflow } from '../workflows/analyzeWorkflow'
import { runImportWorkflow } from '../workflows/importWorkflow'
import { runExportWorkflow } from '../workflows/exportWorkflow'
import type { PolygonObstacleAnalysisState, ProtectionZoneRegion } from '../types/tool'

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

function createProtectionZones(): ProtectionZoneRegion[] {
  return [
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
    {
      id: 'airport-1-station-1-zone-a-rule-b-region-south',
      airportId: 'airport-1',
      airportName: '天河机场',
      stationId: 'station-1',
      stationName: '导航台A',
      stationType: 'VOR',
      ruleCode: 'rule-b',
      ruleName: '规则B',
      zoneCode: 'zone-a',
      zoneName: 'A区-特殊规则',
      regionCode: 'region-south',
      regionName: '南侧区域',
      geometry: {
        shapeType: 'multipolygon',
        coordinates: [
          [
            [
              [114.21, 30.69],
              [114.218, 30.69],
              [114.218, 30.682],
              [114.21, 30.682],
              [114.21, 30.69],
            ],
            [
              [114.212, 30.688],
              [114.216, 30.688],
              [114.216, 30.684],
              [114.212, 30.684],
              [114.212, 30.688],
            ],
          ],
        ],
      },
      vertical: {
        mode: 'analytic_surface',
        baseReference: 'station',
        baseHeightMeters: 48,
        surface: {
          type: 'distance_parameterized',
          distanceSource: {
            kind: 'point',
            point: [0, 0],
          },
          distanceMetric: 'radial',
          clampRange: {
            startMeters: 100,
            endMeters: 1000,
          },
          heightModel: {
            type: 'angle_linear_rise',
            angleDegrees: 3,
            distanceOffsetMeters: 100,
          },
        },
      },
      properties: {
        label: '南侧区域',
      },
    },
  ]
}

vi.mock('../services/bootstrap', () => ({
  getBootstrapData: vi.fn(),
}))

vi.mock('../services/analysis', () => ({
  getAirportProtectionZones: vi.fn().mockResolvedValue([]),
}))

vi.mock('../workflows/importWorkflow', () => ({
  runImportWorkflow: vi.fn(async () => ({
    importTaskId: 'import-batch-3',
    importStatus: 'succeeded',
    importProgressPercent: 100,
    projectId: 'project-1',
    obstacleBatchId: 'batch-1',
    targetOptions: [
      { id: 'airport-1', name: '天河机场', category: '机场', distance: '12.4 km' },
      { id: 'airport-2', name: '荆州机场', category: '机场', distance: '48.9 km' },
      { id: 'atc-1', name: '武汉空管局', category: '空管局', distance: '6.2 km' },
    ],
    obstacles: [
      {
        id: 'obstacle-1',
        name: '障碍物1',
        obstacleType: '建筑物/构建物',
        topElevation: 549.9,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [103.9758638888889, 30.506880555555554],
                [103.97811111111112, 30.50565],
                [103.97690833333334, 30.50386388888889],
                [103.97425, 30.50510277777778],
                [103.97421944444444, 30.505241666666667],
                [103.9758638888889, 30.506880555555554],
              ],
            ],
          ],
        },
      },
    ],
    message: '导入任务已完成，候选对象已准备就绪。',
  })),
}))

vi.mock('../workflows/analyzeWorkflow', () => ({
  runAnalyzeWorkflow: vi.fn(async () => ({
    analysisTaskId: 'analysis-task-1',
    summary: '已基于当前导入障碍物和所选机场生成最小分析结果。',
    message: '分析任务已完成。',
    selectedTargets: [
      { id: '1', name: 'Airport Near', category: '机场' },
      { id: '2', name: 'Airport Far', category: '机场' },
    ],
    obstacleCount: 2,
    targetResults: [
      {
        targetId: 1,
        targetName: 'Airport Near',
        ruleResults: [
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
              gb: { code: 'gb-code', text: '国标内容', isCompliant: true },
              mh: { code: 'mh-code', text: '行标内容', isCompliant: true },
            },
          },
        ],
      },
      {
        targetId: 2,
        targetName: 'Airport Far',
        ruleResults: [
          {
            stationId: '5',
            stationName: '其他台站',
            stationType: 'VOR',
            obstacleId: '68',
            obstacleName: '障碍物3',
            rawObstacleType: '其他',
            globalObstacleCategory: 'other',
            ruleName: 'vor_minimum_distance_100m',
            zoneCode: 'vor_minimum_distance_100m',
            zoneName: 'VOR 100m minimum distance zone',
            regionCode: 'default',
            regionName: 'default',
            isApplicable: true,
            isCompliant: false,
            message: 'distance below minimum threshold',
            standards: {
              gb: { code: 'gb-code-2', text: '国标内容2', isCompliant: false },
              mh: { code: 'mh-code-2', text: '行标内容2', isCompliant: false },
            },
          },
        ],
      },
    ],
  })),
}))

vi.mock('../workflows/exportWorkflow', () => ({
  runExportWorkflow: vi.fn(),
}))

describe('useWorkflowActions', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('stores bootstrap airport target and historical obstacles without changing wizard stage', async () => {
    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: {
        longitude: 103.95056,
        latitude: 30.57972,
        height: 10000,
        pitch: -90,
      },
      airports: [
        {
          id: '1',
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
          stations: [],
        },
      ],
      historicalObstacles: [
        {
          id: 'history-17',
          name: '历史障碍物1',
          obstacleType: '建筑物/构建物',
          topElevation: 549.9,
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [103.9758638888889, 30.506880555555554],
                  [103.97811111111112, 30.50565],
                  [103.97690833333334, 30.50386388888889],
                  [103.97425, 30.50510277777778],
                  [103.97421944444444, 30.505241666666667],
                  [103.9758638888889, 30.506880555555554],
                ],
              ],
            ],
          },
        },
      ],
    })

    const { state, bootstrap } = useWorkflowActions()

    await bootstrap()

    expect(state.bootstrapStatus).toBe('success')
    expect(state.stage).toBe('idle')
    expect(state.initialCameraTarget?.longitude).toBe(103.95056)
    expect(state.renderedObstacles.map((item) => item.id)).toEqual(['history-17'])
    expect(state.protectionZoneTree).toEqual([])
    expect(state.visibleProtectionZones).toEqual([])
    expect(state.loadedProtectionZones).toEqual([])
  })

  it('clears protection zone state when bootstrap returns no airports', async () => {
    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: null,
      airports: [],
      historicalObstacles: [
        {
          id: 'history-1',
          name: '历史障碍物',
          obstacleType: '建筑物/构建物',
          topElevation: 100,
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[103.0, 30.0], [103.1, 30.0], [103.1, 30.1], [103.0, 30.1], [103.0, 30.0]]]],
          },
        },
      ],
    })

    vi.mocked(getAirportProtectionZones).mockResolvedValue([])

    const { state, bootstrap } = useWorkflowActions()

    await bootstrap()

    expect(state.bootstrapStatus).toBe('success')
    expect(state.airports).toEqual([])
    expect(state.selectedAirportId).toBe('')
    expect(state.visibleStations).toEqual([])
    expect(state.initialCameraTarget).toBeNull()
    expect(state.renderedObstacles.map((item) => item.id)).toEqual(['history-1'])
    expect(state.protectionZoneTree).toEqual([])
    expect(state.visibleProtectionZones).toEqual([])
    expect(state.loadedProtectionZones).toEqual([])
    expect(state.protectionZonePanelOpen).toBe(false)
    expect(getAirportProtectionZones).not.toHaveBeenCalled()
  })

  it('keeps the app usable when bootstrap fails', async () => {
    vi.mocked(getBootstrapData).mockRejectedValueOnce(new Error('初始化接口请求失败：500'))

    const { state, bootstrap } = useWorkflowActions()

    await bootstrap()

    expect(state.bootstrapStatus).toBe('error')
    expect(state.stage).toBe('idle')
    expect(state.initialCameraTarget).toBeNull()
    expect(state.renderedObstacles).toEqual([])
    expect(state.bootstrapMessage).toContain('初始化')
    expect(state.protectionZoneTree).toEqual([])
    expect(state.visibleProtectionZones).toEqual([])
    expect(state.loadedProtectionZones).toEqual([])
    expect(state.protectionZonePanelOpen).toBe(false)
  })

  it('preserves bootstrap state when closing the modal', async () => {
    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: {
        longitude: 103.95056,
        latitude: 30.57972,
        height: 10000,
        pitch: -90,
      },
      airports: [
        {
          id: '1',
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
          stations: [],
        },
      ],
      historicalObstacles: [],
    })

    const { state, bootstrap, openModal, closeModal } = useWorkflowActions()

    await bootstrap()
    openModal('polygon')
    closeModal()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')
    expect(state.bootstrapStatus).toBe('success')
    expect(state.bootstrapMessage).toBe('系统初始化完成。')
    expect(state.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: 20000,
      pitch: -90,
    })
    expect(state.protectionZoneTree).toEqual([])
    expect(state.visibleProtectionZones).toEqual([])
  })

  it('stores airports, defaults to the first airport and derives visible stations on bootstrap', async () => {
    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: {
        longitude: 120.123,
        latitude: 31.456,
        height: 99999,
        pitch: -90,
      },
      airports: [
        {
          id: '1',
          name: '双流机场',
          longitude: 103.95056,
          latitude: 30.57972,
          stations: [
            {
              id: '4',
              airportId: '1',
              name: '西南近无方向信标台',
              stationType: 'NDB',
              longitude: 103.935861,
              latitude: 30.554611,
              altitude: 491.1,
            },
          ],
        },
        {
          id: '2',
          name: '天府机场',
          longitude: 104.44194,
          latitude: 30.31252,
          stations: [],
        },
      ],
      historicalObstacles: [],
    })

    const { state, bootstrap } = useWorkflowActions()

    await bootstrap()

    expect(state.airports).toHaveLength(2)
    expect(state.selectedAirportId).toBe('1')
    expect(state.visibleStations.map((item) => item.id)).toEqual(['4'])
    expect(state.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: 20000,
      pitch: -90,
    })
  })

  it('switches airports, updates visible stations and camera target without clearing stored airports', () => {
    const { state, selectAirport } = useWorkflowActions()

    state.airports = [
      {
        id: '1',
        name: '双流机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [],
      },
      {
        id: '2',
        name: '天府机场',
        longitude: 104.44194,
        latitude: 30.31252,
        stations: [
          {
            id: '20',
            airportId: '2',
            name: 'LOC01',
            stationType: 'LOC',
            longitude: 104.45,
            latitude: 30.31,
            altitude: 600,
          },
        ],
      },
    ]

    selectAirport('2')

    expect(state.selectedAirportId).toBe('2')
    expect(state.visibleStations.map((item) => item.id)).toEqual(['20'])
    expect(state.initialCameraTarget).toEqual({
      longitude: 104.44194,
      latitude: 30.31252,
      height: 20000,
      pitch: -90,
    })
    expect(state.airports).toHaveLength(2)
  })

  it('ignores unknown airport ids when switching', () => {
    const { state, selectAirport } = useWorkflowActions()

    state.airports = [
      {
        id: '1',
        name: '双流机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [],
      },
    ]
    state.selectedAirportId = '1'
    state.initialCameraTarget = {
      longitude: 103.95056,
      latitude: 30.57972,
      height: 10000,
      pitch: -90,
    }

    selectAirport('missing')

    expect(state.selectedAirportId).toBe('1')
    expect(state.initialCameraTarget).toEqual({
      longitude: 103.95056,
      latitude: 30.57972,
      height: 10000,
      pitch: -90,
    })
  })

  it('opens and closes the station panel', () => {
    const { state, openStationPanel, closeStationPanel } = useWorkflowActions()

    openStationPanel()
    expect(state.stationPanelOpen).toBe(true)

    closeStationPanel()
    expect(state.stationPanelOpen).toBe(false)
  })

  it('openProtectionZonePanel closes station panel when opening', () => {
    const { state, openStationPanel, openProtectionZonePanel } = useWorkflowActions()

    openStationPanel()
    expect(state.stationPanelOpen).toBe(true)

    openProtectionZonePanel()
    expect(state.stationPanelOpen).toBe(false)
    expect(state.protectionZonePanelOpen).toBe(true)
  })

  it('openStationPanel closes protection zone panel when opening', () => {
    const { state, openProtectionZonePanel, openStationPanel } = useWorkflowActions()

    openProtectionZonePanel()
    expect(state.protectionZonePanelOpen).toBe(true)

    openStationPanel()
    expect(state.protectionZonePanelOpen).toBe(false)
    expect(state.stationPanelOpen).toBe(true)
  })

  it('loadProtectionZones closes station panel when auto-opening', async () => {
    vi.mocked(getAirportProtectionZones).mockResolvedValueOnce(createProtectionZones())

    const { state, openStationPanel, loadProtectionZones } = useWorkflowActions()

    openStationPanel()
    expect(state.stationPanelOpen).toBe(true)

    await loadProtectionZones('airport-1')
    expect(state.stationPanelOpen).toBe(false)
    expect(state.protectionZonePanelOpen).toBe(true)
  })

  it('loadProtectionZones does NOT auto-open when zones are empty', async () => {
    vi.mocked(getAirportProtectionZones).mockResolvedValueOnce([])

    const { state, openStationPanel, loadProtectionZones } = useWorkflowActions()

    openStationPanel()
    expect(state.stationPanelOpen).toBe(true)

    await loadProtectionZones('airport-1')
    expect(state.stationPanelOpen).toBe(true)
    expect(state.protectionZonePanelOpen).toBe(false)
  })

  it('flies to the largest protection zone region instead of merging distant regions', () => {
    const { state, flyToProtectionZone } = useWorkflowActions()

    const zone = {
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
      visible: true,
      regions: [
        {
          id: 'region-small',
          airportId: 'airport-1',
          airportName: '天河机场',
          stationId: 'station-1',
          stationName: '导航台A',
          stationType: 'VOR',
          ruleCode: 'rule-a',
          ruleName: '规则A',
          zoneCode: 'zone-a',
          zoneName: 'A区',
          regionCode: 'region-small',
          regionName: '小区域',
          geometry: {
            shapeType: 'multipolygon',
            coordinates: [
              [
                [
                  [10, 10],
                  [11, 10],
                  [11, 11],
                  [10, 11],
                  [10, 10],
                ],
              ],
            ],
          },
          vertical: {
            mode: 'flat',
            baseReference: 'station',
            baseHeightMeters: 500,
          },
          properties: {},
        },
        {
          id: 'region-large',
          airportId: 'airport-1',
          airportName: '天河机场',
          stationId: 'station-1',
          stationName: '导航台A',
          stationType: 'VOR',
          ruleCode: 'rule-a',
          ruleName: '规则A',
          zoneCode: 'zone-a',
          zoneName: 'A区',
          regionCode: 'region-large',
          regionName: '大区域',
          geometry: {
            shapeType: 'multipolygon',
            coordinates: [
              [
                [
                  [100, 100],
                  [106, 100],
                  [106, 106],
                  [100, 106],
                  [100, 100],
                ],
              ],
            ],
          },
          vertical: {
            mode: 'flat',
            baseReference: 'station',
            baseHeightMeters: 500,
          },
          properties: {},
        },
      ],
    } satisfies Parameters<typeof flyToProtectionZone>[0]

    flyToProtectionZone(zone)

    expect(state.flyToTargetPayload).toMatchObject({
      longitude: 103,
      latitude: 103,
      pitch: -90,
    })
  })

  it('updates fly-to payload and increments fly-to tick when locating a protection zone', () => {
    const { state, flyToProtectionZone } = useWorkflowActions()

    const initialTick = state.flyToTargetTick
    const zone = {
      key: 'airport-1:station-1:zone-b',
      airportId: 'airport-1',
      airportName: '天河机场',
      stationId: 'station-1',
      stationName: '导航台A',
      stationType: 'VOR',
      zoneCode: 'zone-b',
      zoneName: 'B区',
      ruleCode: 'rule-b',
      ruleName: '规则B',
      visible: true,
      regions: [
        {
          id: 'region-only',
          airportId: 'airport-1',
          airportName: '天河机场',
          stationId: 'station-1',
          stationName: '导航台A',
          stationType: 'VOR',
          ruleCode: 'rule-b',
          ruleName: '规则B',
          zoneCode: 'zone-b',
          zoneName: 'B区',
          regionCode: 'region-only',
          regionName: '唯一区域',
          geometry: {
            shapeType: 'multipolygon',
            coordinates: [
              [
                [
                  [114.2, 30.7],
                  [114.204, 30.7],
                  [114.204, 30.696],
                  [114.2, 30.696],
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
          properties: {},
        },
      ],
    } satisfies Parameters<typeof flyToProtectionZone>[0]

    flyToProtectionZone(zone)

    expect(state.flyToTargetPayload?.longitude).toBeCloseTo(114.202, 6)
    expect(state.flyToTargetPayload?.latitude).toBeCloseTo(30.698, 6)
    expect(state.flyToTargetPayload?.height).toBeGreaterThan(2000)
    expect(state.flyToTargetPayload?.pitch).toBe(-90)
    expect(state.flyToTargetTick).toBe(initialTick + 1)
  })

  it('preserves airport state when closing the modal', () => {
    const { state, openModal, closeModal } = useWorkflowActions()

    state.airports = [
      {
        id: '1',
        name: '双流机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [
          {
            id: '4',
            airportId: '1',
            name: '西南近无方向信标台',
            stationType: 'NDB',
            longitude: 103.935861,
            latitude: 30.554611,
            altitude: 491.1,
          },
        ],
      },
    ]
    state.selectedAirportId = '1'
    state.visibleStations = [...state.airports[0].stations]
    state.stationPanelOpen = true

    openModal('polygon')
    closeModal()

    expect(state.isOpen).toBe(false)
    expect(state.airports).toHaveLength(1)
    expect(state.selectedAirportId).toBe('1')
    expect(state.visibleStations.map((item) => item.id)).toEqual(['4'])
    expect(state.stationPanelOpen).toBe(true)
  })

  it('opens workflow in point mode when requested', () => {
    const { state, openModal } = useWorkflowActions()

    openModal('point')

    expect(state.analysisMode).toBe('point')
    expect(state.stage).toBe('import-form')
    expect(state.statusMessage).toBe('请上传点状障碍物 Excel。')
  })

  it('preserves shared workflow stages while switching import mode', () => {
    const { state, openModal } = useWorkflowActions()

    openModal('polygon')
    state.projectName = '项目A'
    openModal('point')

    expect(state.analysisMode).toBe('point')
    expect(state.stage).toBe('import-form')
  })

  it('drives the single polygon obstacle analysis wizard lifecycle', async () => {
    vi.useFakeTimers()

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ onProgress }) => {
      onProgress({
        exportTaskId: 'export-task-1',
        exportStatus: 'pending',
        exportProgressPercent: 0,
        exportMessage: '导出任务已创建。',
      })
      onProgress({
        exportTaskId: 'export-task-1',
        exportStatus: 'running',
        exportProgressPercent: 60,
        exportMessage: '正在生成 Word 结论。',
      })

      return {
        exportTaskId: 'export-task-1',
        exportStatus: 'succeeded',
        exportProgressPercent: 100,
        exportMessage: 'Word 结论已生成。',
        exportFileName: 'analysis-task-1.docx',
        downloadUrl: '/mock/report.docx',
        exportErrorMessage: '',
      }
    })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const {
      state,
      bootstrap,
      submitImport,
      toggleTarget,
      startAnalysis,
      exportReport,
      closeModal,
      openModal,
      toggleProtectionZoneAirportVisibility,
      toggleProtectionZoneVisibility,
    } = useWorkflowActions()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')
    expect(state.protectionZoneTree).toEqual([])
    expect(state.visibleProtectionZones).toEqual([])
    const visibleRegion = createVisibleProtectionZoneRegion()
    expect(visibleRegion.regionCode).toBe('region-north')
    expect(visibleRegion.id).toBe('airport-1-station-1-zone-a-rule-a-region-north')
    expect(visibleRegion.geometry.shapeType).toBe('multipolygon')
    expect(visibleRegion.vertical.mode).toBe('flat')

    vi.mocked(getBootstrapData).mockResolvedValueOnce({
      initialCameraTarget: { longitude: 103.95056, latitude: 30.57972, height: 10000, pitch: -90 },
      airports: [{
        id: 'airport-1',
        name: '天河机场',
        longitude: 103.95056,
        latitude: 30.57972,
        stations: [{
          id: 'station-1',
          airportId: 'airport-1',
          name: '导航台A',
          stationType: 'VOR',
          longitude: 103.95,
          latitude: 30.58,
          altitude: 500,
        }],
      }],
      historicalObstacles: [],
    })

    vi.mocked(getAirportProtectionZones).mockResolvedValueOnce(createProtectionZones())

    await bootstrap()

    expect(state.protectionZonePanelOpen).toBe(true)
    expect(state.protectionZoneTree).toHaveLength(1)
    expect(state.protectionZoneTree[0].airportName).toBe('天河机场')
    expect(state.protectionZoneTree[0].stations[0].zones.map((zone) => zone.key)).toEqual(['airport-1:station-1:zone-a'])
    expect(state.visibleProtectionZones).toEqual([])
    expect(state.protectionZoneTree[0].stations[0].zones.map((zone) => ({
      key: zone.key,
      ruleCode: zone.ruleCode,
      visible: zone.visible,
    }))).toEqual([
      { key: 'airport-1:station-1:zone-a', ruleCode: 'rule-a', visible: false },
    ])
    expect(
      state.protectionZoneTree[0].stations[0].zones[0].regions.map((region) => ({
        key: `${region.airportId}:${region.stationId}:${region.zoneCode}:${region.ruleCode}:${region.regionCode}`,
        ruleCode: region.ruleCode,
      })),
    ).toEqual([
      {
        key: 'airport-1:station-1:zone-a:rule-a:region-north',
        ruleCode: 'rule-a',
      },
      {
        key: 'airport-1:station-1:zone-a:rule-b:region-south',
        ruleCode: 'rule-b',
      },
    ])

    expect(state.loadedProtectionZones).toHaveLength(2)
    expect(state.loadedProtectionZones.map((item) => item.key)).toEqual([
      'airport-1:station-1:zone-a:rule-a:region-north',
      'airport-1:station-1:zone-a:rule-b:region-south',
    ])

    openModal('polygon')

    expect(state.isOpen).toBe(true)
    expect(state.stage).toBe('import-form')

    const importPromise = submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.stage).toBe('importing')
    expect(state.statusMessage).toContain('导入')

    await vi.runAllTimersAsync()
    await importPromise

    expect(runImportWorkflow).toHaveBeenCalledWith({
      mode: 'polygon',
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.stage).toBe('target-selection')
    expect(state.projectName).toBe('武汉净空项目')
    expect(state.importTaskId).toBe('import-batch-3')
    expect(state.importStatus).toBe('succeeded')
    expect(state.importProgressPercent).toBe(100)
    expect(state.targetOptions).toHaveLength(3)
    expect(state.targetOptions[0].name).toBe('天河机场')
    expect(state.renderedObstacles).toEqual([
      {
        id: 'obstacle-1',
        name: '障碍物1',
        obstacleType: '建筑物/构建物',
        topElevation: 549.9,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [103.9758638888889, 30.506880555555554],
                [103.97811111111112, 30.50565],
                [103.97690833333334, 30.50386388888889],
                [103.97425, 30.50510277777778],
                [103.97421944444444, 30.505241666666667],
                [103.9758638888889, 30.506880555555554],
              ],
            ],
          ],
        },
      },
    ])

    toggleTarget('airport-1')
    toggleTarget('atc-1')

    expect(state.selectedTargetIds).toEqual(['airport-1', 'atc-1'])

    const analyzePromise = startAnalysis()

    expect(state.stage).toBe('analyzing')
    expect(state.statusMessage).toContain('分析')

    await vi.runAllTimersAsync()
    await analyzePromise

    expect(state.stage).toBe('analysis-result')
    expect(state.analysisTaskId).toBe('analysis-task-1')
    expect(state.analysisSummary).toBe('已基于当前导入障碍物和所选机场生成最小分析结果。')
    expect(state.analysisSelectedTargets).toEqual([
      { id: '1', name: 'Airport Near', category: '机场' },
      { id: '2', name: 'Airport Far', category: '机场' },
    ])
    expect(state.analysisObstacleCount).toBe(2)
    expect(state.analysisTargetResults).toEqual([
      {
        targetId: 1,
        targetName: 'Airport Near',
        ruleResults: [
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
              gb: { code: 'gb-code', text: '国标内容', isCompliant: true },
              mh: { code: 'mh-code', text: '行标内容', isCompliant: true },
            },
          },
        ],
        exportTaskId: '',
        exportStatus: 'idle',
        exportProgressPercent: 0,
        exportMessage: '分析完成后可导出 Word 结论。',
        exportFileName: '',
        downloadUrl: '',
        exportErrorMessage: '',
      },
      {
        targetId: 2,
        targetName: 'Airport Far',
        ruleResults: [
          {
            stationId: '5',
            stationName: '其他台站',
            stationType: 'VOR',
            obstacleId: '68',
            obstacleName: '障碍物3',
            rawObstacleType: '其他',
            globalObstacleCategory: 'other',
            ruleName: 'vor_minimum_distance_100m',
            zoneCode: 'vor_minimum_distance_100m',
            zoneName: 'VOR 100m minimum distance zone',
            regionCode: 'default',
            regionName: 'default',
            isApplicable: true,
            isCompliant: false,
            message: 'distance below minimum threshold',
            standards: {
              gb: { code: 'gb-code-2', text: '国标内容2', isCompliant: false },
              mh: { code: 'mh-code-2', text: '行标内容2', isCompliant: false },
            },
          },
        ],
        exportTaskId: '',
        exportStatus: 'idle',
        exportProgressPercent: 0,
        exportMessage: '分析完成后可导出 Word 结论。',
        exportFileName: '',
        downloadUrl: '',
        exportErrorMessage: '',
      },
    ])
    expect(state.statusMessage).toBe('分析任务已完成。')
    // Protection zones are loaded during bootstrap, not analysis
    expect(state.protectionZonePanelOpen).toBe(true)
    expect(state.protectionZoneTree).toHaveLength(1)

    toggleProtectionZoneVisibility('airport-1', 'station-1', 'zone-a', true)

    expect(state.protectionZoneTree[0].stations[0].zones.map((zone) => ({
      key: zone.key,
      ruleCode: zone.ruleCode,
      visible: zone.visible,
    }))).toEqual([
      { key: 'airport-1:station-1:zone-a', ruleCode: 'rule-a', visible: true },
    ])
    expect(state.protectionZoneTree[0].visible).toBe(true)
    expect(state.protectionZoneTree[0].stations[0].visible).toBe(true)
    expect(state.visibleProtectionZones.map((item) => ({ key: item.key, ruleCode: item.ruleCode }))).toEqual([
      { key: 'airport-1:station-1:zone-a:rule-a:region-north', ruleCode: 'rule-a' },
      { key: 'airport-1:station-1:zone-a:rule-b:region-south', ruleCode: 'rule-b' },
    ])

    toggleProtectionZoneAirportVisibility('airport-1', false)
    expect(state.visibleProtectionZones).toEqual([])
    expect(state.protectionZoneTree[0].visible).toBe(false)
    expect(state.protectionZoneTree[0].stations[0].visible).toBe(false)
    expect(state.protectionZoneTree[0].stations[0].zones[0].visible).toBe(false)

    toggleProtectionZoneAirportVisibility('airport-1', true)
    toggleProtectionZoneVisibility('airport-1', 'station-1', 'zone-a', true)
    expect(state.visibleProtectionZones.map((item) => ({ key: item.key, ruleCode: item.ruleCode }))).toEqual([
      { key: 'airport-1:station-1:zone-a:rule-a:region-north', ruleCode: 'rule-a' },
      { key: 'airport-1:station-1:zone-a:rule-b:region-south', ruleCode: 'rule-b' },
    ])

    const exportPromise = exportReport(1)

    await vi.runAllTimersAsync()
    await exportPromise

    expect(state.analysisTargetResults[0].exportTaskId).toBe('export-task-1')
    expect(state.analysisTargetResults[0].exportStatus).toBe('succeeded')
    expect(state.analysisTargetResults[0].exportProgressPercent).toBe(100)
    expect(state.analysisTargetResults[0].exportMessage).toBe('Word 结论已生成。')
    expect(state.analysisTargetResults[0].exportFileName).toBe('analysis-task-1.docx')
    expect(state.analysisTargetResults[0].downloadUrl).toBe('/mock/report.docx')
    expect(state.analysisTargetResults[0].exportErrorMessage).toBe('')

    closeModal()

    expect(state.isOpen).toBe(false)
    expect(state.stage).toBe('idle')
    expect(state.renderedObstacles).toHaveLength(1)
    expect(state.protectionZoneTree).toHaveLength(1)
    expect(state.visibleProtectionZones.map((item) => ({ key: item.key, ruleCode: item.ruleCode }))).toEqual([
      { key: 'airport-1:station-1:zone-a:rule-a:region-north', ruleCode: 'rule-a' },
      { key: 'airport-1:station-1:zone-a:rule-b:region-south', ruleCode: 'rule-b' },
    ])
    expect(state.loadedProtectionZones).toHaveLength(2)
    expect(state.loadedProtectionZones.map((item) => item.key)).toEqual([
      'airport-1:station-1:zone-a:rule-a:region-north',
      'airport-1:station-1:zone-a:rule-b:region-south',
    ])

    vi.useRealTimers()
  })

  it('localizes English export progress messages to Chinese', async () => {
    vi.useFakeTimers()

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ onProgress }) => {
      onProgress({
        exportTaskId: 'export-task-en-1',
        exportStatus: 'pending',
        exportProgressPercent: 0,
        exportMessage: 'export task pending',
      })
      onProgress({
        exportTaskId: 'export-task-en-1',
        exportStatus: 'running',
        exportProgressPercent: 50,
        exportMessage: 'export task running',
      })
      return {
        exportTaskId: 'export-task-en-1',
        exportStatus: 'succeeded',
        exportProgressPercent: 100,
        exportMessage: 'export task succeeded',
        exportFileName: 'report.docx',
        downloadUrl: '/mock/report.docx',
        exportErrorMessage: '',
      }
    })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal('polygon')
    await submitImport({
      projectName: '测试项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()
    await vi.runAllTimersAsync()
    await analyzePromise

    // Set analysisTaskId so export can proceed
    state.analysisTaskId = 'analysis-task-1'
    state.stage = 'analysis-result'

    const exportPromise = exportReport(1)
    await vi.runAllTimersAsync()
    await exportPromise

    expect(state.analysisTargetResults[0].exportMessage).toBe('Word 结论已生成。')
    expect(state.analysisTargetResults[0].exportStatus).toBe('succeeded')
    expect(state.analysisTargetResults[0].exportFileName).toBe('report.docx')

    vi.useRealTimers()
  })

  it('keeps analysis result stage and stores export failure details when export workflow fails', async () => {
    vi.useFakeTimers()

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ onProgress }) => {
      onProgress({
        exportTaskId: 'export-task-2',
        exportStatus: 'running',
        exportProgressPercent: 35,
        exportMessage: '正在生成 Word 结论。',
      })

      throw new Error('导出失败，请稍后重试。')
    })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal('polygon')
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()

    await vi.runAllTimersAsync()
    await analyzePromise

    const exportPromise = exportReport(1)

    await vi.runAllTimersAsync()

    await expect(exportPromise).resolves.toBeUndefined()
    expect(state.stage).toBe('analysis-result')
    expect(state.analysisTargetResults[0].exportTaskId).toBe('export-task-2')
    expect(state.analysisTargetResults[0].exportStatus).toBe('failed')
    expect(state.analysisTargetResults[0].exportProgressPercent).toBe(35)
    expect(state.analysisTargetResults[0].exportMessage).toBe('正在生成 Word 结论。')
    expect(state.analysisTargetResults[0].exportErrorMessage).toBe('导出失败，请稍后重试。')
    expect(state.analysisTargetResults[0].exportFileName).toBe('')
    expect(state.analysisTargetResults[0].downloadUrl).toBe('')

    vi.useRealTimers()
  })

  it('moves to error stage and stores a user-facing message when import workflow rejects', async () => {
    vi.mocked(runImportWorkflow).mockRejectedValueOnce(new Error('导入失败，请检查上传文件。'))

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport } = useWorkflowActions()

    openModal('polygon')

    await expect(
      submitImport({
        projectName: '武汉净空项目',
        obstacleType: '铁塔',
        fileName: 'obstacles.xlsx',
        file,
      }),
    ).resolves.toBeUndefined()

    expect(state.stage).toBe('error')
    expect(state.statusMessage).toBe('导入失败，请检查上传文件。')
    expect(state.importStatus).toBe('failed')
    expect(state.importProgressPercent).toBe(0)
  })

  it('moves to error stage and stores a user-facing message when analysis workflow rejects', async () => {
    vi.useFakeTimers()
    vi.mocked(runAnalyzeWorkflow).mockRejectedValueOnce(new Error('分析失败，请稍后重试。'))

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis } = useWorkflowActions()

    openModal('polygon')
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()

    expect(state.stage).toBe('analyzing')

    await vi.runAllTimersAsync()
    await expect(analyzePromise).resolves.toBeUndefined()

    expect(state.stage).toBe('error')
    expect(state.statusMessage).toBe('分析失败，请稍后重试。')

    vi.useRealTimers()
  })

  it('ignores stale export updates from an older export attempt', async () => {
    vi.useFakeTimers()

    const exportResolvers: {
      first: null | (() => void)
      second: null | (() => void)
    } = {
      first: null,
      second: null,
    }

    vi.mocked(runExportWorkflow)
      .mockImplementationOnce(({ onProgress }) => {
        onProgress({
          exportTaskId: 'export-task-old',
          exportStatus: 'running',
          exportProgressPercent: 25,
          exportMessage: '旧导出任务执行中。',
        })

        return new Promise<void>((resolve) => {
          exportResolvers.first = () => resolve()
        }).then(() => ({
          exportTaskId: 'export-task-old',
          exportStatus: 'succeeded',
          exportProgressPercent: 100,
          exportMessage: '旧导出任务已完成。',
          exportFileName: 'old.docx',
          downloadUrl: '/mock/old.docx',
          exportErrorMessage: '',
        }))
      })
      .mockImplementationOnce(({ onProgress }) => {
        onProgress({
          exportTaskId: 'export-task-new',
          exportStatus: 'running',
          exportProgressPercent: 80,
          exportMessage: '新导出任务执行中。',
        })

        return new Promise<void>((resolve) => {
          exportResolvers.second = () => resolve()
        }).then(() => ({
          exportTaskId: 'export-task-new',
          exportStatus: 'succeeded',
          exportProgressPercent: 100,
          exportMessage: '新导出任务已完成。',
          exportFileName: 'new.docx',
          downloadUrl: '/mock/new.docx',
          exportErrorMessage: '',
        }))
      })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal('polygon')
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()
    await vi.runAllTimersAsync()
    await analyzePromise

    const firstExportPromise = exportReport(1)
    const secondExportPromise = exportReport(1)

    const resolveFirstExport = exportResolvers.first

    if (resolveFirstExport) {
      resolveFirstExport()
    }
    await vi.runAllTimersAsync()
    await firstExportPromise

    expect(state.analysisTargetResults[0].exportTaskId).toBe('export-task-new')
    expect(state.analysisTargetResults[0].exportStatus).toBe('running')
    expect(state.analysisTargetResults[0].exportProgressPercent).toBe(80)
    expect(state.analysisTargetResults[0].exportMessage).toBe('新导出任务执行中。')
    expect(state.analysisTargetResults[0].exportFileName).toBe('')
    expect(state.analysisTargetResults[0].downloadUrl).toBe('')

    const resolveSecondExport = exportResolvers.second

    if (resolveSecondExport) {
      resolveSecondExport()
    }
    await vi.runAllTimersAsync()
    await secondExportPromise

    expect(state.analysisTargetResults[0].exportTaskId).toBe('export-task-new')
    expect(state.analysisTargetResults[0].exportStatus).toBe('succeeded')
    expect(state.analysisTargetResults[0].exportProgressPercent).toBe(100)
    expect(state.analysisTargetResults[0].exportMessage).toBe('新导出任务已完成。')
    expect(state.analysisTargetResults[0].exportFileName).toBe('new.docx')
    expect(state.analysisTargetResults[0].downloadUrl).toBe('/mock/new.docx')

    vi.useRealTimers()
  })

  it('clears unsafe download urls returned by export workflow', async () => {
    vi.useFakeTimers()

    vi.mocked(runExportWorkflow).mockImplementationOnce(async ({ triggerDownload }) => {
      triggerDownload('javascript:alert(1)')

      return {
        exportTaskId: 'export-task-3',
        exportStatus: 'succeeded',
        exportProgressPercent: 100,
        exportMessage: 'Word 结论已生成。',
        exportFileName: 'analysis-task-3.docx',
        downloadUrl: 'javascript:alert(1)',
        exportErrorMessage: '',
      }
    })

    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport, toggleTarget, startAnalysis, exportReport } = useWorkflowActions()

    openModal('polygon')
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })
    toggleTarget('airport-1')

    const analyzePromise = startAnalysis()
    await vi.runAllTimersAsync()
    await analyzePromise

    await expect(exportReport(1)).resolves.toBeUndefined()

    expect(state.analysisTargetResults[0].exportStatus).toBe('succeeded')
    expect(state.analysisTargetResults[0].exportFileName).toBe('analysis-task-3.docx')
    expect(state.analysisTargetResults[0].downloadUrl).toBe('')

    vi.useRealTimers()
  })

  it('appends imported obstacles instead of overwriting existing map obstacles', async () => {
    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport } = useWorkflowActions([
      {
        id: 'history-1',
        name: '历史障碍物',
        obstacleType: '建筑物/构建物',
        topElevation: 520,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [114.1, 30.6],
                [114.2, 30.6],
                [114.2, 30.5],
                [114.1, 30.5],
                [114.1, 30.6],
              ],
            ],
          ],
        },
      },
    ])

    openModal('polygon')
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.renderedObstacles.map((item) => item.id)).toEqual(['history-1', 'obstacle-1'])
  })

  it('keeps only one obstacle when an imported obstacle id already exists in map state', async () => {
    const file = new File(['demo'], 'obstacles.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const { state, openModal, submitImport } = useWorkflowActions([
      {
        id: 'obstacle-1',
        name: '历史障碍物1',
        obstacleType: '建筑物/构建物',
        topElevation: 500,
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [114.1, 30.6],
                [114.2, 30.6],
                [114.2, 30.5],
                [114.1, 30.5],
                [114.1, 30.6],
              ],
            ],
          ],
        },
      },
    ])

    openModal('polygon')
    await submitImport({
      projectName: '武汉净空项目',
      obstacleType: '铁塔',
      fileName: 'obstacles.xlsx',
      file,
    })

    expect(state.renderedObstacles).toHaveLength(1)
    expect(state.renderedObstacles[0].name).toBe('历史障碍物1')
  })
})
