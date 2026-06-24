// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AirportSearchSelect from './AirportSearchSelect.vue'
import type { RenderedAirport } from '../../types/tool'

const mockAirports: RenderedAirport[] = [
  { id: '1', name: '武汉天河机场', longitude: 114.209, latitude: 30.783, stations: [] },
  { id: '2', name: '北京大兴机场', longitude: 116.407, latitude: 39.509, stations: [] },
  { id: '3', name: '上海浦东机场', longitude: 121.805, latitude: 31.144, stations: [] },
  { id: '4', name: '广州白云机场', longitude: 113.304, latitude: 23.395, stations: [] },
]

describe('AirportSearchSelect', () => {
  it('renders search input', () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('搜索机场名称...')
  })

  it('shows all airports when search is empty', () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const options = wrapper.findAll('.airport-search-select__option')
    expect(options.length).toBe(mockAirports.length)
    expect(options[0].text()).toBe('武汉天河机场')
    expect(options[3].text()).toBe('广州白云机场')
  })

  it('filters airports by name (fuzzy match)', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.setValue('武汉')
    const options = wrapper.findAll('.airport-search-select__option')
    expect(options.length).toBe(1)
    expect(options[0].text()).toBe('武汉天河机场')
  })

  it('shows "无匹配机场" when no airports match', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.setValue('不存在')
    const options = wrapper.findAll('.airport-search-select__option')
    expect(options.length).toBe(0)
    const empty = wrapper.find('.airport-search-select__empty')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toBe('无匹配机场')
  })

  it('selects airport on click and emits', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const options = wrapper.findAll('.airport-search-select__option')
    await options[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1'])
  })

  it('keyboard navigation: ArrowDown and ArrowUp move highlight', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowDown' })
    let options = wrapper.findAll('.airport-search-select__option')
    expect(options[1].classes()).toContain('is-highlighted')

    await input.trigger('keydown', { key: 'ArrowDown' })
    options = wrapper.findAll('.airport-search-select__option')
    expect(options[2].classes()).toContain('is-highlighted')

    await input.trigger('keydown', { key: 'ArrowUp' })
    options = wrapper.findAll('.airport-search-select__option')
    expect(options[1].classes()).toContain('is-highlighted')
  })

  it('keyboard navigation: Enter selects highlighted', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['3'])
  })

  it('keyboard navigation: Escape clears search', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.setValue('武汉')
    let options = wrapper.findAll('.airport-search-select__option')
    expect(options.length).toBe(1)

    await input.trigger('keydown', { key: 'Escape' })
    const inputEl = wrapper.find('.airport-search-select__input').element as HTMLInputElement
    expect(inputEl.value).toBe('')
    options = wrapper.findAll('.airport-search-select__option')
    expect(options.length).toBe(mockAirports.length)
  })

  it('clears search after selection', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.setValue('武汉')
    const options = wrapper.findAll('.airport-search-select__option')
    await options[0].trigger('click')

    const inputEl = wrapper.find('.airport-search-select__input').element as HTMLInputElement
    expect(inputEl.value).toBe('')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1'])
  })

  it('shows all airports when airports prop is empty array', () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: [], modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    expect(input.exists()).toBe(true)
    const options = wrapper.findAll('.airport-search-select__option')
    expect(options.length).toBe(0)
  })

  it('highlights first item on focus', async () => {
    const wrapper = mount(AirportSearchSelect, {
      props: { airports: mockAirports, modelValue: '' },
    })
    const input = wrapper.find('.airport-search-select__input')
    await input.trigger('focus')
    const options = wrapper.findAll('.airport-search-select__option')
    expect(options[0].classes()).toContain('is-highlighted')
  })
})
