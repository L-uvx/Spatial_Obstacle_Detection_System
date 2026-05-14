// @vitest-environment jsdom

import * as Cesium from 'cesium'
import { describe, expect, it } from 'vitest'
import { buildTopDownView } from './camera'

describe('buildTopDownView', () => {
  it('returns a top-down target with height=10000, heading=0, pitch=-90 from the current position', () => {
    const position = Cesium.Cartographic.fromDegrees(114.21, 30.77, 5000)

    const result = buildTopDownView(position)

    expect(result.longitude).toBeCloseTo(114.21, 4)
    expect(result.latitude).toBeCloseTo(30.77, 4)
    expect(result.height).toBe(10000)
    expect(result.heading).toBe(0)
    expect(result.pitch).toBe(-90)
  })

  it('preserves longitude and latitude from the current position', () => {
    const position = Cesium.Cartographic.fromDegrees(-73.9857, 40.7484, 8000)

    const result = buildTopDownView(position)

    expect(result.longitude).toBeCloseTo(-73.9857, 4)
    expect(result.latitude).toBeCloseTo(40.7484, 4)
    expect(result.height).toBe(10000)
  })
})
