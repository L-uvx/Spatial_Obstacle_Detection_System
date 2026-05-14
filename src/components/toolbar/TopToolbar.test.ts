// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TopToolbar from './TopToolbar.vue'

describe('TopToolbar', () => {
  it('emits open-data-management when clicking the data-management button', async () => {
    const wrapper = mount(TopToolbar)

    await wrapper.get('[data-toolbar-key="data-management"]').trigger('click')

    expect(wrapper.emitted('openDataManagement')).toEqual([[]])
    expect(wrapper.emitted('openAnalysis')).toBeUndefined()
  })

  it('emits topDown when clicking the top-down button', async () => {
    const wrapper = mount(TopToolbar)

    await wrapper.get('[data-toolbar-key="top-down"]').trigger('click')

    expect(wrapper.emitted('topDown')).toEqual([[]])
    expect(wrapper.emitted('openAnalysis')).toBeUndefined()
  })
})
