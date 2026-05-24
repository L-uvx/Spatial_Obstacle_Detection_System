// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ObstacleTable from './ObstacleTable.vue'
import type { ObstacleListItem } from '../../types/dataManagement'

function createObstacle(overrides: Partial<ObstacleListItem> = {}): ObstacleListItem {
  return {
    id: 'obstacle-1',
    projectId: 'proj-1',
    projectName: '测试项目',
    name: '测试障碍物',
    obstacleType: '建筑物/构建物',
    topElevation: 100.5,
    sourceBatchId: 'batch-1',
    sourceRowNo: 1,
    geometry: {
      type: 'Point',
      coordinates: [114.2, 30.7],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ObstacleTable', () => {
  it('renders rows from items prop', () => {
    const item = createObstacle()
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('测试障碍物')
    expect(wrapper.text()).toContain('测试项目')
    expect(wrapper.text()).toContain('建筑物/构建物')
    expect(wrapper.text()).toContain('100.5')
    expect(wrapper.text()).toContain('114.2, 30.7')
  })

  it('shows loading state', () => {
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: true,
      },
    })

    expect(wrapper.text()).toContain('加载中...')
  })

  it('shows empty state when not loading and no items', () => {
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('暂无障碍物数据')
  })

  it('emits update:projectName on input', async () => {
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    await wrapper.get('[data-testid="obstacle-project-name-input"]').setValue('proj-x')
    expect(wrapper.emitted('update:projectName')).toEqual([['proj-x']])
  })

  it('emits update:keyword on input', async () => {
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    await wrapper.get('[data-testid="obstacle-keyword-input"]').setValue('测试')
    expect(wrapper.emitted('update:keyword')).toEqual([['测试']])
  })

  it('emits update:obstacleType on select change', async () => {
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    await wrapper.get('[data-testid="obstacle-type-select"]').setValue('铁塔/高塔')
    expect(wrapper.emitted('update:obstacleType')).toEqual([['铁塔/高塔']])
  })

  it('emits detail with item', async () => {
    const item = createObstacle()
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    await wrapper.get('[data-action="detail-obstacle"]').trigger('click')
    expect(wrapper.emitted('detail')).toEqual([[item]])
  })

  it('emits delete with item', async () => {
    const item = createObstacle()
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    await wrapper.get('[data-action="delete-obstacle"]').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([[item]])
  })

  it('emits locate with item (with geometry)', async () => {
    const item = createObstacle()
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    await wrapper.get('[data-action="locate-obstacle"]').trigger('click')
    expect(wrapper.emitted('locate')).toEqual([[item]])
  })

  it('locate button disabled when geometry is null', () => {
    const item = createObstacle({ geometry: null })
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    const locateBtn = wrapper.get('[data-action="locate-obstacle"]')
    expect((locateBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('formats Point coordinate as "lon, lat"', () => {
    const item = createObstacle({
      geometry: { type: 'Point', coordinates: [120.5, 31.2] },
    })
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('120.5, 31.2')
  })

  it('formats MultiPolygon coordinate as "多边形"', () => {
    const item = createObstacle({
      geometry: { type: 'MultiPolygon', coordinates: [[[[114, 30]]]] },
    })
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('多边形')
  })

  it('formats null coordinate as "-"', () => {
    const item = createObstacle({ geometry: null })
    const wrapper = mount(ObstacleTable, {
      props: {
        items: [item],
        projectName: '',
        keyword: '',
        obstacleType: '',
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('-')
  })
})
