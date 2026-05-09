// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AirportTable from './AirportTable.vue'
import type { AirportListItem } from '../../types/dataManagement'

function createAirport(overrides: Partial<AirportListItem> = {}): AirportListItem {
  return {
    id: 'airport-1',
    name: '天河机场',
    longitude: 114.2,
    latitude: 30.7,
    altitude: 34,
    runwayCount: 2,
    stationCount: 3,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('AirportTable', () => {
  it('emits filter and row action events', async () => {
    const airport = createAirport()
    const wrapper = mount(AirportTable, {
      props: {
        items: [airport],
        keyword: '',
        hasCoordinates: false,
        loading: false,
      },
    })

    await wrapper.get('[data-testid="airport-keyword-input"]').setValue('武汉')
    await wrapper.get('[data-testid="airport-has-coordinates"]').setValue(true)
    await wrapper.get('[data-action="create-airport"]').trigger('click')
    await wrapper.get('[data-action="edit-airport"]').trigger('click')
    await wrapper.get('[data-action="delete-airport"]').trigger('click')

    expect(wrapper.emitted('update:keyword')).toEqual([['武汉']])
    expect(wrapper.emitted('update:hasCoordinates')).toEqual([[true]])
    expect(wrapper.emitted('create')).toEqual([[]])
    expect(wrapper.emitted('edit')).toEqual([[airport]])
    expect(wrapper.emitted('delete')).toEqual([[airport]])
  })
})
