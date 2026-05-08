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
      '台站组',
      '频率',
      '经度',
      '纬度',
      '海拔',
      '覆盖范围',
      '飞行高度',
      '天线高度',
      '关联跑道',
      '反射网高度',
      '中心天线高度',
      'B 天线高度',
      'B 到中心距离',
      '反射直径',
      '下倾角',
      '天线标签',
      '到跑道距离',
      '垂直跑道距离',
      '到跑道端距',
      '单元编号',
      '航空器',
      '天线架高',
      '台站子类',
      '组合 ID',
    ]

    for (const label of labels) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('normalizes cleared new numeric fields to null before save', async () => {
    const wrapper = mount(StationFormDialog, {
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
