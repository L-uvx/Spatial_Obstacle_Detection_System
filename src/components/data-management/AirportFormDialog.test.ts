// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AirportFormDialog from './AirportFormDialog.vue'

describe('AirportFormDialog', () => {
  it('requires airport name before save', async () => {
    const wrapper = mount(AirportFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: {
          name: '',
          longitude: null,
          latitude: null,
          altitude: null,
        },
      },
    })

    await wrapper.get('[data-action="save-airport"]').trigger('click')

    expect(wrapper.text()).toContain('机场名称不能为空')
  })

  it('rejects invalid latitude', async () => {
    const wrapper = mount(AirportFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: {
          name: '天河机场',
          longitude: 114.2,
          latitude: 99,
          altitude: null,
        },
      },
    })

    await wrapper.get('[data-action="save-airport"]').trigger('click')

    expect(wrapper.text()).toContain('纬度必须在 -90 到 90 之间')
  })

  it('normalizes cleared numeric input to null before save', async () => {
    const wrapper = mount(AirportFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: {
          name: '天河机场',
          longitude: 114.2,
          latitude: 30.7,
          altitude: 100,
        },
      },
    })

    const longitudeInput = wrapper.get('input[type="number"]')
    await longitudeInput.setValue('')
    await wrapper.get('[data-action="save-airport"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      longitude: null,
    })
  })

  it('renders all airport fields with independent labels', () => {
    const wrapper = mount(AirportFormDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: {
          name: '',
          longitude: null,
          latitude: null,
          altitude: null,
        },
      },
    })

    const text = wrapper.text()
    const labels = ['机场名称', '经度', '纬度', '海拔']
    for (const label of labels) {
      expect(text).toContain(label)
    }
  })
})
