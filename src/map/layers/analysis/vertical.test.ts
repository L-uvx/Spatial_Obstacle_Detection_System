import { describe, expect, it } from 'vitest'
import type {
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneFlatVertical,
} from '../../../types/tool'
import { buildVerticalProfile } from './vertical'

describe('vertical helpers', () => {
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

  it('computes analytic surface heights from radial distance', () => {
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 100,
      heightFunction: {
        type: 'elevation_angle',
        distanceMetric: 'radial',
        elevationAngleDegrees: 45,
        startDistanceMeters: 0,
        endDistanceMeters: 1000,
      },
    }
    const footprint = [
      { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0 },
      { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 10 },
      { longitude: 114.22, latitude: 30.72, radialDistanceMeters: 20 },
    ]

    const profile = buildVerticalProfile(vertical, footprint)

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toEqual([
      { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0, heightMeters: 100 },
      { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 10, heightMeters: 110 },
      { longitude: 114.22, latitude: 30.72, radialDistanceMeters: 20, heightMeters: 120 },
    ])
  })

  it('clamps analytic surface heights to the declared radial interval', () => {
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 100,
      heightFunction: {
        type: 'elevation_angle',
        distanceMetric: 'radial',
        elevationAngleDegrees: 45,
        startDistanceMeters: 10,
        endDistanceMeters: 20,
      },
    }
    const footprint = [
      { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0 },
      { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 15 },
      { longitude: 114.22, latitude: 30.72, radialDistanceMeters: 30 },
    ]

    const profile = buildVerticalProfile(vertical, footprint)

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0, heightMeters: 100 },
        { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 15, heightMeters: 105 },
        { longitude: 114.22, latitude: 30.72, radialDistanceMeters: 30, heightMeters: 110 },
      ],
    })
  })

  it('keeps the analytic surface aligned with the base height at startDistanceMeters', () => {
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 491.1,
      heightFunction: {
        type: 'elevation_angle',
        distanceMetric: 'radial',
        elevationAngleDegrees: 3,
        startDistanceMeters: 50,
        endDistanceMeters: 37040,
      },
    }
    const footprint = [
      { longitude: 103.935861, latitude: 30.554611, radialDistanceMeters: 50 },
      { longitude: 103.936, latitude: 30.555, radialDistanceMeters: 60 },
    ]

    const profile = buildVerticalProfile(vertical, footprint)

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 103.935861, latitude: 30.554611, radialDistanceMeters: 50, heightMeters: 491.1 },
        { longitude: 103.936, latitude: 30.555, radialDistanceMeters: 60, heightMeters: 491.62407779283046 },
      ],
    })
  })

  it('falls back to base height when the elevation angle produces a non-finite tangent', () => {
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      mode: 'analytic_surface',
      baseReference: 'station',
      baseHeightMeters: 250,
      heightFunction: {
        type: 'elevation_angle',
        distanceMetric: 'radial',
        elevationAngleDegrees: 90,
        startDistanceMeters: 0,
        endDistanceMeters: 1000,
      },
    }
    const footprint = [
      { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0 },
      { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 100 },
    ]

    const profile = buildVerticalProfile(vertical, footprint)

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 114.2, latitude: 30.7, radialDistanceMeters: 0, heightMeters: 250 },
        { longitude: 114.21, latitude: 30.71, radialDistanceMeters: 100, heightMeters: 250 },
      ],
    })
  })
})
