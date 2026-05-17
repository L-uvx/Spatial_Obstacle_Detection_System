// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
vi.mock('../../services/dataManagement')

import DataManagementModal from './DataManagementModal.vue'
import type { DataManagementState } from '../../composables/useDataManagement'

function createState(overrides: Partial<DataManagementState> = {}): DataManagementState {
  return {
    isOpen: true,
    activeTab: 'airports',
    airportOptions: [{ value: 'airport-1', label: '天河机场' }],
    stationTypeOptions: [{ value: 'ILS', label: 'ILS' }],
    airports: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      filters: {
        keyword: '',
        hasCoordinates: false,
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: {
        name: '',
        longitude: null,
        latitude: null,
        altitude: null,
      },
      deleteTarget: null,
    },
    runways: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      filters: {
        airportId: '',
        keyword: '',
        runNumber: '',
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: {
        airportId: '',
        name: '',
        runNumber: '',
        longitude: null,
        latitude: null,
        headingDegrees: null,
        lengthMeters: null,
        width: null,
        altitude: null,
        enterHeight: null,
        maximumAirworthiness: null,
        maximumTypeAircraft: null,
        stationSubType: '',
        runwayCodeA: '',
        runwayType: '',
        runwayCodeB: '',
      },
      deleteTarget: null,
    },
    stations: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      filters: {
        airportId: '',
        stationType: '',
        keyword: '',
        runwayNo: '',
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: {
        airportId: '',
        name: '',
        stationType: '',
        stationGroup: null,
        frequency: null,
        runwayNo: '',
        longitude: null,
        latitude: null,
        altitude: null,
        coverageRadius: null,
        flyHeight: null,
        antennaHag: null,
        reflectionNetHag: null,
        centerAntennaH: null,
        bAntennaH: null,
        bToCenterDistance: null,
        reflectionDiameter: null,
        downwardAngle: null,
        antennaTag: null,
        distanceToRunway: null,
        distanceVToRunway: null,
        distanceEndoRunway: null,
        unitNumber: null,
        aircraft: '',
        antennaHeight: null,
        stationSubType: null,
        combineId: null,
      },
      deleteTarget: null,
    },
    obstacles: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      filters: {
        projectId: '',
        keyword: '',
        obstacleType: '',
      },
      loading: false,
      errorMessage: '',
      warnings: [],
      formOpen: false,
      readonly: false,
      draft: {},
      deleteTarget: null,
    },
    ...overrides,
  }
}

describe('DataManagementModal', () => {
  it('renders airport tab as active by default and emits close', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    expect(wrapper.get('[data-tab="airports"]').attributes('data-active')).toBe('true')

    await wrapper.get('.data-management-modal__close').trigger('click')

    expect(wrapper.emitted('close')).toEqual([[]])
  })

  it('emits tab changes when runway tab is clicked', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    await wrapper.get('[data-tab="runways"]').trigger('click')

    expect(wrapper.emitted('switchTab')).toEqual([['runways']])
  })

  it('renders airport filter controls on airport tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    expect(wrapper.find('[data-testid="airport-keyword-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="airport-has-coordinates"]').exists()).toBe(true)
  })

  it('renders delete conflict text and emits confirm delete', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              keyword: '',
              hasCoordinates: false,
            },
            loading: false,
            errorMessage: '机场下仍有关联数据，无法删除。',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {
              name: '',
              longitude: null,
              latitude: null,
              altitude: null,
            },
            deleteTarget: {
              id: 'airport-1',
              name: '武汉天河机场',
              longitude: null,
              latitude: null,
              altitude: null,
              runwayCount: 1,
              stationCount: 1,
              createdAt: '',
              updatedAt: '',
            },
          },
        }),
      },
    })

    expect(wrapper.text()).toContain('机场下仍有关联数据，无法删除。')

    await wrapper.get('[data-testid="confirm-airport-delete"]').trigger('click')

    expect(wrapper.emitted('confirmAirportDelete')).toEqual([[]])
  })

  it('renders airport warnings separately from error messages', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              keyword: '',
              hasCoordinates: false,
            },
            loading: false,
            errorMessage: '',
            warnings: ['机场坐标已按现有规则自动补齐'],
            formOpen: false,
            readonly: false,
            draft: {
              name: '',
              longitude: null,
              latitude: null,
              altitude: null,
            },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="data-management-warnings"]').text()).toContain(
      '机场坐标已按现有规则自动补齐',
    )
    expect(wrapper.find('.data-management-modal__placeholder').exists()).toBe(false)
  })

  it('renders runway filter controls on runway tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'runways',
        }),
      },
    })

    expect(wrapper.find('[data-testid="runway-airport-id-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="runway-keyword-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="runway-run-number-input"]').exists()).toBe(true)
  })

  it('renders runway form dialog when runway form state is open', () => {
    mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'runways',
          runways: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              airportId: '',
              keyword: '',
              runNumber: '',
            },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: true,
            readonly: false,
            draft: {
              airportId: 'airport-1',
              name: '东跑道',
              runNumber: '01/19',
              longitude: 114.2,
              latitude: 30.7,
              headingDegrees: 12,
              lengthMeters: 3400,
              width: null,
              altitude: null,
              enterHeight: null,
              maximumAirworthiness: null,
              maximumTypeAircraft: null,
              stationSubType: '',
              runwayCodeA: '',
              runwayType: '',
              runwayCodeB: '',
            },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(document.body.querySelector('[aria-label="跑道表单"]')).toBeTruthy()
  })

  it('renders runway delete conflict text and emits confirm delete', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'runways',
          runways: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              airportId: '',
              keyword: '',
              runNumber: '',
            },
            loading: false,
            errorMessage: '跑道下仍有关联台站，无法删除。',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {
              airportId: '',
              name: '',
              runNumber: '',
              longitude: null,
              latitude: null,
              headingDegrees: null,
              lengthMeters: null,
              width: null,
              altitude: null,
              enterHeight: null,
              maximumAirworthiness: null,
              maximumTypeAircraft: null,
              stationSubType: '',
              runwayCodeA: '',
              runwayType: '',
              runwayCodeB: '',
            },
            deleteTarget: {
              id: 'runway-1',
              airportId: 'airport-1',
              airportName: '武汉天河机场',
              name: '东跑道',
              runNumber: '01/19',
              longitude: null,
              latitude: null,
              headingDegrees: null,
              lengthMeters: null,
              width: null,
              altitude: null,
              enterHeight: null,
              maximumAirworthiness: null,
              maximumTypeAircraft: null,
              stationSubType: '',
              runwayCodeA: '',
              runwayType: '',
              runwayCodeB: '',
              createdAt: '',
              updatedAt: '',
            },
          },
        }),
      },
    })

    expect(wrapper.text()).toContain('跑道下仍有关联台站，无法删除。')

    await wrapper.get('[data-testid="confirm-runway-delete"]').trigger('click')

    expect(wrapper.emitted('confirmRunwayDelete')).toEqual([[]])
  })

  it('renders runway warnings only on runway tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'runways',
          runways: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              airportId: '',
              keyword: '',
              runNumber: '',
            },
            loading: false,
            errorMessage: '',
            warnings: ['跑道航向角已沿用现有值'],
            formOpen: false,
            readonly: false,
            draft: {
              airportId: '',
              name: '',
              runNumber: '',
              longitude: null,
              latitude: null,
              headingDegrees: null,
              lengthMeters: null,
              width: null,
              altitude: null,
              enterHeight: null,
              maximumAirworthiness: null,
              maximumTypeAircraft: null,
              stationSubType: '',
              runwayCodeA: '',
              runwayType: '',
              runwayCodeB: '',
            },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="data-management-warnings"]').text()).toContain(
      '跑道航向角已沿用现有值',
    )
  })

  it('renders station filter controls on station tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'stations',
        }),
      },
    })

    expect(wrapper.find('[data-testid="station-airport-id-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="station-type-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="station-keyword-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="station-runway-no-input"]').exists()).toBe(true)
  })

  it('renders station form dialog and delete confirm when station state requires it', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'stations',
          stations: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              airportId: '',
              stationType: '',
              keyword: '',
              runwayNo: '',
            },
            loading: false,
            errorMessage: '台站下仍有关联分析数据，无法删除。',
            warnings: [],
            formOpen: true,
            readonly: false,
            draft: {
              airportId: 'airport-1',
              name: '近台',
              stationType: 'ILS',
              stationGroup: null,
              frequency: null,
              runwayNo: '18L',
              longitude: 114.2,
              latitude: 30.7,
              altitude: 45,
              coverageRadius: null,
              flyHeight: null,
              antennaHag: null,
              reflectionNetHag: null,
              centerAntennaH: null,
              bAntennaH: null,
              bToCenterDistance: null,
              reflectionDiameter: null,
              downwardAngle: null,
              antennaTag: null,
              distanceToRunway: null,
              distanceVToRunway: null,
              distanceEndoRunway: null,
              unitNumber: null,
              aircraft: '',
              antennaHeight: null,
              stationSubType: null,
              combineId: null,
            },
            deleteTarget: {
              id: 'station-1',
              airportId: 'airport-1',
              airportName: '武汉天河机场',
              name: '近台',
              stationType: 'ILS',
              runwayNo: '18L',
              longitude: null,
              latitude: null,
              altitude: null,
              stationGroup: null,
              frequency: null,
              coverageRadius: null,
              flyHeight: null,
              antennaHag: null,
              reflectionNetHag: null,
              centerAntennaH: null,
              bAntennaH: null,
              bToCenterDistance: null,
              reflectionDiameter: null,
              downwardAngle: null,
              antennaTag: null,
              distanceToRunway: null,
              distanceVToRunway: null,
              distanceEndoRunway: null,
              unitNumber: null,
              aircraft: '',
              antennaHeight: null,
              stationSubType: null,
              combineId: null,
              createdAt: '',
              updatedAt: '',
            },
          },
        }),
      },
    })

    expect(document.body.querySelector('[aria-label="台站表单"]')).toBeTruthy()
    expect(wrapper.text()).toContain('台站下仍有关联分析数据，无法删除。')

    await wrapper.get('[data-testid="confirm-station-delete"]').trigger('click')

    expect(wrapper.emitted('confirmStationDelete')).toEqual([[]])
  })

  it('renders station warnings on station tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'stations',
          stations: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: {
              airportId: '',
              stationType: '',
              keyword: '',
              runwayNo: '',
            },
            loading: false,
            errorMessage: '',
            warnings: ['台站跑道号已按所属机场默认值补齐'],
            formOpen: false,
            readonly: false,
            draft: {
              airportId: '',
              name: '',
              stationType: '',
              stationGroup: null,
              frequency: null,
              runwayNo: '',
              longitude: null,
              latitude: null,
              altitude: null,
              coverageRadius: null,
              flyHeight: null,
              antennaHag: null,
              reflectionNetHag: null,
              centerAntennaH: null,
              bAntennaH: null,
              bToCenterDistance: null,
              reflectionDiameter: null,
              downwardAngle: null,
              antennaTag: null,
              distanceToRunway: null,
              distanceVToRunway: null,
              distanceEndoRunway: null,
              unitNumber: null,
              aircraft: '',
              antennaHeight: null,
              stationSubType: null,
              combineId: null,
            },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="data-management-warnings"]').text()).toContain(
      '台站跑道号已按所属机场默认值补齐',
    )
  })

  it('renders pagination footer on airports tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 45,
            page: 2,
            pageSize: 20,
            filters: { keyword: '', hasCoordinates: false },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: { name: '', longitude: null, latitude: null, altitude: null },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.find('.data-management-modal__footer').exists()).toBe(true)
    expect(wrapper.find('[data-testid="modal-prev-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="modal-next-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="modal-page-size"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="modal-current-page"]').text()).toBe('2 / 3')
    expect(wrapper.find('.data-management-modal__footer').text()).toContain('第 21-40 条')
  })

  it('updates pagination footer when switching tabs', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'runways',
          runways: {
            items: [],
            total: 11,
            page: 1,
            pageSize: 10,
            filters: { airportId: '', keyword: '', runNumber: '' },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {
              airportId: '', name: '', runNumber: '', longitude: null, latitude: null,
              headingDegrees: null, lengthMeters: null, width: null, altitude: null,
              enterHeight: null, maximumAirworthiness: null, maximumTypeAircraft: null, stationSubType: '',
              runwayCodeA: '', runwayType: '', runwayCodeB: '',
            },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="modal-current-page"]').text()).toBe('1 / 2')
  })

  it('disables previous page button on first page', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 45,
            page: 1,
            pageSize: 20,
            filters: { keyword: '', hasCoordinates: false },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: { name: '', longitude: null, latitude: null, altitude: null },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="modal-prev-page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="modal-next-page"]').attributes('disabled')).toBeUndefined()
  })

  it('disables next page button on last page', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 20,
            page: 1,
            pageSize: 20,
            filters: { keyword: '', hasCoordinates: false },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: { name: '', longitude: null, latitude: null, altitude: null },
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="modal-next-page"]').attributes('disabled')).toBeDefined()
  })

  it('disables next and shows no summary when total is zero', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    expect(wrapper.get('[data-testid="modal-prev-page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="modal-next-page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.data-management-modal__footer').text()).toContain('共 0 条')
  })

  it('emits changeAirportPage on prev/next click', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 45,
            page: 2,
            pageSize: 20,
            filters: { keyword: '', hasCoordinates: false },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: { name: '', longitude: null, latitude: null, altitude: null },
            deleteTarget: null,
          },
        }),
      },
    })

    await wrapper.get('[data-testid="modal-prev-page"]').trigger('click')
    expect(wrapper.emitted('changeAirportPage')).toEqual([[1]])

    await wrapper.get('[data-testid="modal-next-page"]').trigger('click')
    expect(wrapper.emitted('changeAirportPage')).toEqual([[1], [3]])
  })

  it('emits changeAirportPageSize on page size change', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          airports: {
            items: [],
            total: 45,
            page: 1,
            pageSize: 20,
            filters: { keyword: '', hasCoordinates: false },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: { name: '', longitude: null, latitude: null, altitude: null },
            deleteTarget: null,
          },
        }),
      },
    })

    await wrapper.get('[data-testid="modal-page-size"]').setValue('50')
    expect(wrapper.emitted('changeAirportPageSize')).toEqual([[50]])
  })

  it('emits correct page event on runways tab', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'runways',
          runways: {
            items: [],
            total: 25,
            page: 1,
            pageSize: 10,
            filters: { airportId: '', keyword: '', runNumber: '' },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {
              airportId: '', name: '', runNumber: '', longitude: null, latitude: null,
              headingDegrees: null, lengthMeters: null, width: null, altitude: null,
              enterHeight: null, maximumAirworthiness: null, maximumTypeAircraft: null, stationSubType: '',
              runwayCodeA: '', runwayType: '', runwayCodeB: '',
            },
            deleteTarget: null,
          },
        }),
      },
    })

    await wrapper.get('[data-testid="modal-next-page"]').trigger('click')
    expect(wrapper.emitted('changeRunwayPage')).toEqual([[2]])
  })

  it('emits correct page event on stations tab', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'stations',
          stations: {
            items: [],
            total: 25,
            page: 1,
            pageSize: 10,
            filters: { airportId: '', stationType: '', keyword: '', runwayNo: '' },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {
              airportId: '', name: '', stationType: '', stationGroup: null, frequency: null,
              runwayNo: '', longitude: null, latitude: null, altitude: null, coverageRadius: null,
              flyHeight: null, antennaHag: null, reflectionNetHag: null, centerAntennaH: null,
              bAntennaH: null, bToCenterDistance: null, reflectionDiameter: null, downwardAngle: null,
              antennaTag: null, distanceToRunway: null, distanceVToRunway: null,
              distanceEndoRunway: null, unitNumber: null, aircraft: '', antennaHeight: null,
              stationSubType: null, combineId: null,
            },
            deleteTarget: null,
          },
        }),
      },
    })

    await wrapper.get('[data-testid="modal-next-page"]').trigger('click')
    expect(wrapper.emitted('changeStationPage')).toEqual([[2]])
  })

  it('renders import button when modal is open', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    expect(wrapper.find('.data-management-modal__import-btn').exists()).toBe(true)
    expect(wrapper.find('.data-management-modal__import-btn').text()).toContain('导入机场')
  })

  it('has hidden file input for import', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    const fileInput = wrapper.find('input[type="file"][hidden]')
    expect(fileInput.exists()).toBe(true)
  })

  it('renders obstacles tab button', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    const tab = wrapper.find('[data-tab="obstacles"]')
    expect(tab.exists()).toBe(true)
    expect(tab.text()).toBe('障碍物管理')
    expect(tab.attributes('data-active')).toBe('false')
  })

  it('emits switchTab with obstacles on tab click', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState(),
      },
    })

    await wrapper.get('[data-tab="obstacles"]').trigger('click')

    expect(wrapper.emitted('switchTab')).toEqual([['obstacles']])
  })

  it('renders ObstacleTable when activeTab is obstacles', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
        }),
      },
    })

    expect(wrapper.find('[aria-label="障碍物列表"]').exists()).toBe(true)
  })

  it('renders obstacle filter controls on obstacles tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
        }),
      },
    })

    expect(wrapper.find('[data-testid="obstacle-project-id-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="obstacle-keyword-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="obstacle-type-select"]').exists()).toBe(true)
  })

  it('renders obstacle delete confirm section when deleteTarget is set', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
          obstacles: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: { projectId: '', keyword: '', obstacleType: '' },
            loading: false,
            errorMessage: '障碍物下仍有关联分析数据，无法删除。',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {},
            deleteTarget: {
              id: 'obstacle-1',
              projectId: 'proj-1',
              projectName: '测试项目',
              name: '测试障碍物',
              obstacleType: '人工障碍物',
              topElevation: 120,
              sourceBatchId: 'batch-1',
              sourceRowNo: 1,
              geometry: null,
              createdAt: '',
              updatedAt: '',
            },
          },
        }),
      },
    })

    expect(wrapper.text()).toContain('障碍物下仍有关联分析数据，无法删除。')

    await wrapper.get('[data-testid="confirm-obstacle-delete"]').trigger('click')

    expect(wrapper.emitted('confirmObstacleDelete')).toEqual([[]])
  })

  it('renders obstacle warnings on obstacles tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
          obstacles: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: { projectId: '', keyword: '', obstacleType: '' },
            loading: false,
            errorMessage: '',
            warnings: ['障碍物坐标已自动补齐'],
            formOpen: false,
            readonly: false,
            draft: {},
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="data-management-warnings"]').text()).toContain(
      '障碍物坐标已自动补齐',
    )
  })

  it('shows pagination for obstacles tab', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
          obstacles: {
            items: [],
            total: 45,
            page: 2,
            pageSize: 20,
            filters: { projectId: '', keyword: '', obstacleType: '' },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {},
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.get('[data-testid="modal-current-page"]').text()).toBe('2 / 3')
  })

  it('emits changeObstaclePage on prev/next click', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
          obstacles: {
            items: [],
            total: 45,
            page: 2,
            pageSize: 20,
            filters: { projectId: '', keyword: '', obstacleType: '' },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {},
            deleteTarget: null,
          },
        }),
      },
    })

    await wrapper.get('[data-testid="modal-prev-page"]').trigger('click')
    expect(wrapper.emitted('changeObstaclePage')).toEqual([[1]])

    await wrapper.get('[data-testid="modal-next-page"]').trigger('click')
    expect(wrapper.emitted('changeObstaclePage')).toEqual([[1], [3]])
  })

  it('emits changeObstaclePageSize on page size change', async () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
          obstacles: {
            items: [],
            total: 45,
            page: 1,
            pageSize: 20,
            filters: { projectId: '', keyword: '', obstacleType: '' },
            loading: false,
            errorMessage: '',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {},
            deleteTarget: null,
          },
        }),
      },
    })

    await wrapper.get('[data-testid="modal-page-size"]').setValue('50')
    expect(wrapper.emitted('changeObstaclePageSize')).toEqual([[50]])
  })

  it('renders obstacle errorMessage when present', () => {
    const wrapper = mount(DataManagementModal, {
      props: {
        state: createState({
          activeTab: 'obstacles',
          obstacles: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            filters: { projectId: '', keyword: '', obstacleType: '' },
            loading: false,
            errorMessage: '加载失败，请重试。',
            warnings: [],
            formOpen: false,
            readonly: false,
            draft: {},
            deleteTarget: null,
          },
        }),
      },
    })

    expect(wrapper.find('.data-management-modal__placeholder').text()).toBe(
      '加载失败，请重试。',
    )
  })
})
