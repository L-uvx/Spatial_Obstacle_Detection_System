import { describe, expect, it } from 'vitest'
import type {
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneFlatVertical,
} from '../../../types/tool'
import { buildVerticalProfile } from './vertical'

function expectDistanceParameterizedSurface(vertical: ProtectionZoneAnalyticSurfaceVertical) {
  expect(vertical.surface.type).toBe('distance_parameterized')

  if (vertical.surface.type !== 'distance_parameterized') {
    throw new Error(`Expected distance_parameterized surface but received ${vertical.surface.type}`)
  }

  return vertical.surface
}

describe('vertical helpers', () => {
  const metersPerDegreeLatitude = 111320
  const analyticVerticalBase: ProtectionZoneAnalyticSurfaceVertical = {
    mode: 'analytic_surface',
    baseReference: 'station',
    baseHeightMeters: 100,
    surface: {
      type: 'distance_parameterized',
      distanceSource: {
        kind: 'point',
        point: [0, 0],
      },
      distanceMetric: 'radial',
      clampRange: {
        startMeters: 0,
        endMeters: 1000,
      },
      heightModel: {
        type: 'angle_linear_rise',
        angleDegrees: 45,
        distanceOffsetMeters: 0,
      },
    },
  }

  it('returns flat mode without changing sampled footprint points', () => {
    const vertical: ProtectionZoneFlatVertical = {
      mode: 'flat',
      baseReference: 'station',
      baseHeightMeters: 500,
    }
    const footprint = [
      { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0 },
      { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 100 },
    ]

    const profile = buildVerticalProfile(vertical, footprint)

    expect(profile).toEqual({
      mode: 'flat',
      points: [
        { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0, heightMeters: 500 },
        { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 100, heightMeters: 500 },
      ],
    })
  })

  it('treats distanceSource.point as longitude-latitude and keeps base height at the slope origin', () => {
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 491.1,
      surface: {
        type: 'distance_parameterized',
        distanceSource: {
          kind: 'point',
          point: [103.93586, 30.55461],
        },
        distanceMetric: 'radial',
        clampRange: {
          startMeters: 50,
          endMeters: 37040,
        },
        heightModel: {
          type: 'angle_linear_rise',
          angleDegrees: 3,
          distanceOffsetMeters: 50,
        },
      },
    }

    const profile = buildVerticalProfile(vertical, [
      {
        longitude: 103.93586,
        latitude: 30.55461,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 103.93586, latitude: 30.55461, radialDistanceMeters: 0, heightMeters: 491.1 },
      ],
    })
  })

  it('caps analytic_surface height growth at endMeters when geographic distance is beyond the clamp', () => {
    const baseSurface = expectDistanceParameterizedSurface(analyticVerticalBase)
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      ...analyticVerticalBase,
      surface: {
        ...baseSurface,
        clampRange: {
          startMeters: 10,
          endMeters: 20,
        },
        heightModel: {
          ...baseSurface.heightModel,
          distanceOffsetMeters: 10,
        },
      },
    }

    const profile = buildVerticalProfile(vertical, [
      {
        longitude: 1,
        latitude: 1,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]).toMatchObject({
      longitude: 1,
      latitude: 1,
      heightMeters: 110,
    })
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(157427.2565610698, 6)
  })

  it('uses distanceOffsetMeters to shift height growth for non-zero geographic distances inside clamp range', () => {
    const baseSurface = expectDistanceParameterizedSurface(analyticVerticalBase)
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      ...analyticVerticalBase,
      surface: {
        ...baseSurface,
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        heightModel: {
          ...baseSurface.heightModel,
          distanceOffsetMeters: 50,
        },
      },
    }
    const latitude = 80 / metersPerDegreeLatitude

    const profile = buildVerticalProfile(vertical, [
      {
        longitude: 0,
        latitude,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]).toMatchObject({
      longitude: 0,
      latitude,
      heightMeters: 130,
    })
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
  })

  it('falls back to base height when the elevation angle produces a non-finite tangent', () => {
    const baseSurface = expectDistanceParameterizedSurface(analyticVerticalBase)
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      ...analyticVerticalBase,
      baseHeightMeters: 250,
      surface: {
        ...baseSurface,
        heightModel: {
          ...baseSurface.heightModel,
          angleDegrees: 90,
        },
      },
    }

    const profile = buildVerticalProfile(vertical, [
      { longitude: 0, latitude: 0, radialDistanceMeters: 0 },
      { longitude: 0, latitude: 100 / metersPerDegreeLatitude, radialDistanceMeters: 100 },
    ])

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 0, latitude: 0, radialDistanceMeters: 0, heightMeters: 250 },
        { longitude: 0, latitude: 100 / metersPerDegreeLatitude, radialDistanceMeters: 100, heightMeters: 250 },
      ],
    })
  })
})
