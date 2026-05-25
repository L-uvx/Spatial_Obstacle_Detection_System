// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RunwayFormDialog from './RunwayFormDialog.vue'

describe('RunwayFormDialog', () => {
  it('requires airportId and name before save', async () => {
    const wrapper = mount(RunwayFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [],
        modelValue: {
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
          maximumTypeAircraft: 'D类和D类以上',
          stationSubType: '',
          runwayCodeA: '',
          runwayType: '',
          runwayCodeB: '',
        },
      },
    })

    await wrapper.get('[data-action="save-runway"]').trigger('click')

    expect(wrapper.text()).toContain('所属机场不能为空')
  })

  it('rejects invalid heading degrees', async () => {
    const wrapper = mount(RunwayFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        modelValue: {
          airportId: 'airport-1',
          name: '东跑道',
          runNumber: '01/19',
          longitude: 114.2,
          latitude: 30.7,
          headingDegrees: 360,
          lengthMeters: 3400,
          width: null,
          altitude: null,
          enterHeight: null,
          maximumAirworthiness: null,
          maximumTypeAircraft: 'D类和D类以上',
          stationSubType: '',
          runwayCodeA: '',
          runwayType: '',
          runwayCodeB: '',
        },
      },
    })

    await wrapper.get('[data-action="save-runway"]').trigger('click')

    expect(wrapper.text()).toContain('航向角必须在 0 到 360 之间，且不包含 360')
  })

  it('normalizes cleared numeric input to null before save', async () => {
    const wrapper = mount(RunwayFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        modelValue: {
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
          maximumTypeAircraft: 'D类和D类以上',
          stationSubType: '',
          runwayCodeA: '',
          runwayType: '',
          runwayCodeB: '',
        },
      },
    })

    const headingInput = wrapper.get('[data-testid="runway-heading-degrees-input"]')
    await headingInput.setValue('')
    await wrapper.get('[data-action="save-runway"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      headingDegrees: null,
    })
  })

  it('renders airport options in a select control', () => {
    const wrapper = mount(RunwayFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        modelValue: {
          airportId: 'airport-1',
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
          maximumTypeAircraft: 'D类和D类以上',
          stationSubType: '',
          runwayCodeA: '',
          runwayType: '',
          runwayCodeB: '',
        },
      },
    })

    expect(wrapper.get('[data-testid="runway-airport-select"]').text()).toContain('天河机场')
  })

  it('renders all runway fields as independent label + input controls', () => {
    const wrapper = mount(RunwayFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [],
        modelValue: {
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
          maximumTypeAircraft: 'D类和D类以上',
          stationSubType: '',
          runwayCodeA: '',
          runwayType: '',
          runwayCodeB: '',
        },
      },
    })

    const text = wrapper.text()
    const labels = [
      '所属机场', '跑道名称', '跑道号码',
      '经度', '纬度', '跑道真方位(°)', '跑道长度(米)',
      '跑道宽度(米)', '机场基准点标高(米)', '跑道入口标高(米)', '最大适航机型',
      '仪表着陆系统类别', '跑道类型', '编码A', '编码B',
      '最大可起降航空器类别',
    ]
    for (const label of labels) {
      expect(text).toContain(label)
    }
  })

  it('normalizes cleared new numeric fields to null before save', async () => {
    const wrapper = mount(RunwayFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        airportOptions: [{ value: 'airport-1', label: '天河机场' }],
        modelValue: {
          airportId: 'airport-1',
          name: '东跑道',
          runNumber: '01/19',
          longitude: 114.2,
          latitude: 30.7,
          headingDegrees: 12,
          lengthMeters: 3400,
          width: 60,
          altitude: 50,
          enterHeight: 100,
          maximumAirworthiness: 5,
          maximumTypeAircraft: 'D类和D类以上',
          stationSubType: '',
          runwayCodeA: '',
          runwayType: '',
          runwayCodeB: '',
        },
      },
    })

    const altitudeInput = wrapper.findAll('input[type="number"]').at(5)
    if (altitudeInput) {
      await altitudeInput.setValue('')
    }

    await wrapper.get('[data-action="save-runway"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      altitude: null,
    })
  })
})
