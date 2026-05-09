// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StationFormDialog from './StationFormDialog.vue'

const fullModelValue = {
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
}

describe('StationFormDialog', () => {
  it('requires airportId, name and stationType before save', async () => {
    const wrapper = mount(StationFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [],
        stationTypeOptions: [],
        modelValue: { ...fullModelValue },
      },
    })

    await wrapper.get('[data-action="save-station"]').trigger('click')

    expect(wrapper.text()).toContain('所属机场不能为空')
  })

  it('normalizes cleared numeric input to null before save', async () => {
    const wrapper = mount(StationFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        stationTypeOptions: [{ value: 'ILS', label: 'ILS' }],
        modelValue: {
          ...fullModelValue,
          airportId: 'airport-1',
          name: '近台',
          stationType: 'ILS',
          runwayNo: '18L',
          longitude: 114.2,
          latitude: 30.7,
          altitude: 100,
        },
      },
    })

    const altitudeInput = wrapper.get('[data-testid="station-altitude-input"]')
    await altitudeInput.setValue('')
    await wrapper.get('[data-action="save-station"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      altitude: null,
    })
  })

  it('renders airport and station type options in select controls', () => {
    const wrapper = mount(StationFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        stationTypeOptions: [{ value: 'ILS', label: 'ILS' }],
        modelValue: {
          ...fullModelValue,
          airportId: 'airport-1',
          name: '近台',
          stationType: 'ILS',
          runwayNo: '18L',
        },
      },
    })

    expect(wrapper.get('[data-testid="station-airport-select"]').text()).toContain('天河机场')
    expect(wrapper.get('[data-testid="station-type-select"]').text()).toContain('ILS')
  })

  it('renders all station fields as independent labels', () => {
    const wrapper = mount(StationFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [],
        stationTypeOptions: [],
        modelValue: { ...fullModelValue },
      },
    })

    const labels = [
      '所属机场',
      '台站名称',
      '台站类型',
      '台站组（选填）',
      '频率(MHz)',
      '经度',
      '纬度',
      '地势标高(国家85高程)(米)',
      '覆盖范围(默认20海里)(米)',
      '天线离地高(若下滑信标，填写上天线离地高)(米)',
      '关联跑道(LOC、GP、VOR、场监必填)',
      '反射网离地高(米)(VOR)',
      '中心天线高度(VOR)',
      '边带天线到反射网高度(米)(VOR)',
      '边带天线到中心天线距离(米)(VOR)',
      '反射网直径(米)(VOR)',
      '下滑角(°)(GP)',
      '后撤距离(米)(GP)',
      '距离跑道中线的距离(在进近方向左侧为负，右侧为正)(米)(GP)',
      '前方360米地势标高(米)（选填）(GP)',
      '与跑道末端距离(米)(LOC)',
      '天线单元个数(LOC)',
    ]

    for (const label of labels) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('normalizes cleared new numeric fields to null before save', async () => {
    const wrapper = mount(StationFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        stationTypeOptions: [{ value: 'ILS', label: 'ILS' }],
        modelValue: {
          ...fullModelValue,
          airportId: 'airport-1',
          name: '近台',
          stationType: 'ILS',
          runwayNo: '18L',
          frequency: 120.5,
        },
      },
    })

    const frequencyInput = wrapper.findAll('input[type="number"]')[0]
    await frequencyInput.setValue('')
    await wrapper.get('[data-action="save-station"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      frequency: null,
    })
  })
})
