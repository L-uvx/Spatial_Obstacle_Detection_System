// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ObstacleDetailDialog from './ObstacleDetailDialog.vue'
import type { ObstacleListItem } from '../../types/dataManagement'

function makeItem(overrides: Partial<ObstacleListItem> = {}): ObstacleListItem {
  return {
    id: 'obs-001',
    projectId: 'proj-1',
    projectName: '测试项目',
    name: '测试障碍物',
    obstacleType: '烟囱',
    topElevation: 150,
    sourceBatchId: 'batch-001',
    sourceRowNo: 5,
    geometry: { type: 'Point', coordinates: [114.2, 30.6] },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ObstacleDetailDialog', () => {
  it('renders nothing when open is false', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: false,
        modelValue: makeItem(),
      },
    })

    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('renders dialog when open is true', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem(),
      },
    })

    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('shows "查看障碍物" header text', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem(),
      },
    })

    expect(wrapper.text()).toContain('查看障碍物')
  })

  it('emits close when header close button clicked', async () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem(),
      },
    })

    const buttons = wrapper.findAll('button')
    const closeButton = buttons.find((b) => b.text() === '关闭')
    expect(closeButton).toBeTruthy()
    await closeButton!.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)
  })

  it('emits close when footer close button clicked', async () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem(),
      },
    })

    const footer = wrapper.find('footer')
    expect(footer.exists()).toBe(true)
    await footer.find('button').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('displays all field values from modelValue', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem({
          name: '高压线塔',
          obstacleType: '电力塔',
          projectId: 'proj-99',
          projectName: '某机场项目',
          sourceBatchId: 'batch-xyz',
          sourceRowNo: 42,
          topElevation: 200,
        }),
      },
    })

    const text = wrapper.text()
    const labels = [
      '障碍物名称',
      '障碍物类型',
      '项目 ID',
      '项目名称',
      '导入批次',
      '导入行号',
      '顶部高程',
      '几何类型',
      '坐标',
    ]
    for (const label of labels) {
      expect(text).toContain(label)
    }

    // Check field values rendered in inputs
    const inputs = wrapper.findAll('input')
    const inputValues = inputs.map((i) => (i.element as HTMLInputElement).value)
    expect(inputValues).toContain('高压线塔')
    expect(inputValues).toContain('电力塔')
    expect(inputValues).toContain('proj-99')
    expect(inputValues).toContain('某机场项目')
    expect(inputValues).toContain('batch-xyz')
    expect(inputValues).toContain('42')
    expect(inputValues).toContain('200.0')
  })

  it('shows "-" for null topElevation', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem({ topElevation: null }),
      },
    })

    const inputs = wrapper.findAll('input')
    const elevInput = inputs.find((i) => {
      const label = (i.element as HTMLInputElement).closest('label')
      return label?.textContent?.includes('顶部高程')
    })
    expect(elevInput).toBeTruthy()
    expect((elevInput!.element as HTMLInputElement).value).toBe('-')
  })

  it('shows "多边形" for MultiPolygon geometry coordinate', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem({
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[114, 30], [115, 30], [115, 31], [114, 31], [114, 30]]]],
          },
        }),
      },
    })

    const inputs = wrapper.findAll('input')
    const coordInput = inputs.find((i) => {
      const label = (i.element as HTMLInputElement).closest('label')
      return label?.textContent?.includes('坐标')
    })
    expect(coordInput).toBeTruthy()
    expect((coordInput!.element as HTMLInputElement).value).toBe('多边形')
  })

  it('shows "lon, lat" for Point geometry coordinate', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem({
          geometry: { type: 'Point', coordinates: [120.5, 35.2] },
        }),
      },
    })

    const inputs = wrapper.findAll('input')
    const coordInput = inputs.find((i) => {
      const label = (i.element as HTMLInputElement).closest('label')
      return label?.textContent?.includes('坐标')
    })
    expect(coordInput).toBeTruthy()
    expect((coordInput!.element as HTMLInputElement).value).toBe('120.5, 35.2')
  })

  it('shows "-" for null geometry coordinate', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem({ geometry: null }),
      },
    })

    const inputs = wrapper.findAll('input')
    const coordInput = inputs.find((i) => {
      const label = (i.element as HTMLInputElement).closest('label')
      return label?.textContent?.includes('坐标')
    })
    expect(coordInput).toBeTruthy()
    expect((coordInput!.element as HTMLInputElement).value).toBe('-')
  })

  it('shows "-" for null geometry type when geometry is null', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem({ geometry: null }),
      },
    })

    const inputs = wrapper.findAll('input')
    const typeInput = inputs.find((i) => {
      const label = (i.element as HTMLInputElement).closest('label')
      return label?.textContent?.includes('几何类型')
    })
    expect(typeInput).toBeTruthy()
    expect((typeInput!.element as HTMLInputElement).value).toBe('-')
  })

  it('all inputs are disabled', () => {
    const wrapper = mount(ObstacleDetailDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        open: true,
        modelValue: makeItem(),
      },
    })

    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThan(0)
    for (const input of inputs) {
      expect((input.element as HTMLInputElement).disabled).toBe(true)
    }
  })
})
