// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RunwayTable from './RunwayTable.vue'
import type { RunwayListItem } from '../../types/dataManagement'

function createRunway(overrides: Partial<RunwayListItem> = {}): RunwayListItem {
  return {
    id: 'runway-1',
    airportId: 'airport-1',
    airportName: '天河机场',
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
    stationSubType: '',
    runwayCodeA: '',
    runwayType: '',
    runwayCodeB: '',
    maximumTypeAircraft: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('RunwayTable', () => {
  it('emits filter and row action events', async () => {
    const runway = createRunway()
    const wrapper = mount(RunwayTable, {
      props: {
        items: [runway],
        airportName: '',
        keyword: '',
        runNumber: '',
        loading: false,
      },
    })

    await wrapper.get('[data-testid="runway-airport-name-input"]').setValue('airport-1')
    await wrapper.get('[data-testid="runway-keyword-input"]').setValue('东')
    await wrapper.get('[data-testid="runway-run-number-input"]').setValue('01')
    await wrapper.get('[data-action="create-runway"]').trigger('click')
    await wrapper.get('[data-action="edit-runway"]').trigger('click')
    await wrapper.get('[data-action="delete-runway"]').trigger('click')

    expect(wrapper.emitted('update:airportName')).toEqual([['airport-1']])
    expect(wrapper.emitted('update:keyword')).toEqual([['东']])
    expect(wrapper.emitted('update:runNumber')).toEqual([['01']])
    expect(wrapper.emitted('create')).toEqual([[]])
    expect(wrapper.emitted('edit')).toEqual([[runway]])
    expect(wrapper.emitted('delete')).toEqual([[runway]])
  })
})
