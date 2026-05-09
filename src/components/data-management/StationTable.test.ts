// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StationTable from './StationTable.vue'
import type { StationListItem } from '../../types/dataManagement'

function createStation(overrides: Partial<StationListItem> = {}): StationListItem {
  return {
    id: 'station-1',
    airportId: 'airport-1',
    airportName: '天河机场',
    name: 'ILS 近台',
    stationType: 'ILS',
    runwayNo: '18L',
    longitude: 114.2,
    latitude: 30.7,
    altitude: 32,
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
    ...overrides,
  }
}

describe('StationTable', () => {
  it('emits filter and row action events', async () => {
    const station = createStation()
    const wrapper = mount(StationTable, {
      props: {
        items: [station],
        airportId: '',
        stationType: '',
        keyword: '',
        runwayNo: '',
        loading: false,
      },
    })

    await wrapper.get('[data-testid="station-airport-id-input"]').setValue('airport-1')
    await wrapper.get('[data-testid="station-type-input"]').setValue('ILS')
    await wrapper.get('[data-testid="station-keyword-input"]').setValue('近台')
    await wrapper.get('[data-testid="station-runway-no-input"]').setValue('18L')
    await wrapper.get('[data-action="create-station"]').trigger('click')
    await wrapper.get('[data-action="edit-station"]').trigger('click')
    await wrapper.get('[data-action="delete-station"]').trigger('click')

    expect(wrapper.emitted('update:airportId')).toEqual([['airport-1']])
    expect(wrapper.emitted('update:stationType')).toEqual([['ILS']])
    expect(wrapper.emitted('update:keyword')).toEqual([['近台']])
    expect(wrapper.emitted('update:runwayNo')).toEqual([['18L']])
    expect(wrapper.emitted('create')).toEqual([[]])
    expect(wrapper.emitted('edit')).toEqual([[station]])
    expect(wrapper.emitted('delete')).toEqual([[station]])
  })
})
