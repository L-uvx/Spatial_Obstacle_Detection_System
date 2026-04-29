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

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function computeExpectedNormalDistanceMeters(
  origin: { longitude: number; latitude: number },
  leftPoint: { longitude: number; latitude: number },
  rightPoint: { longitude: number; latitude: number },
  target: { longitude: number; latitude: number },
) {
  const metersPerDegreeLatitude = 111320
  const averageLatitude = (origin.latitude + target.latitude) / 2
  const metersPerDegreeLongitude = 111320 * Math.cos(toRadians(averageLatitude))
  const lineDx = (rightPoint.longitude - leftPoint.longitude) * metersPerDegreeLongitude
  const lineDy = (rightPoint.latitude - leftPoint.latitude) * metersPerDegreeLatitude
  const lineLength = Math.sqrt(lineDx ** 2 + lineDy ** 2)
  const normalX = -lineDy / lineLength
  const normalY = lineDx / lineLength
  const pointDx = (target.longitude - origin.longitude) * metersPerDegreeLongitude
  const pointDy = (target.latitude - origin.latitude) * metersPerDegreeLatitude

  return Math.abs((pointDx * normalX) + (pointDy * normalY))
}

function buildFrontReferenceVertical(
  overrides: Partial<ProtectionZoneAnalyticSurfaceVertical> = {},
): ProtectionZoneAnalyticSurfaceVertical {
  const overrideSurface = overrides.surface

  return {
    mode: 'analytic_surface',
    baseReference: 'gp360_altitude',
    baseHeightMeters: 493.8,
    ...overrides,
    surface: {
      ...frontReferenceBaseSurface,
      ...(overrideSurface ?? {}),
    },
  }
}

const frontReferenceBaseSurface = {
  type: 'distance_parameterized' as const,
  distanceSource: {
    kind: 'front_reference_line' as const,
    centerPoint: [103.952962, 30.594308] as [number, number],
    leftPoint: [103.952492, 30.594308] as [number, number],
    rightPoint: [103.953432, 30.594308] as [number, number],
  },
  distanceMetric: 'axial_from_reference_line' as const,
  clampRange: {
    startMeters: 0,
    endMeters: 100,
  },
  heightModel: {
    type: 'angle_linear_rise' as const,
    angleDegrees: 1,
    distanceOffsetMeters: 0,
  },
}

describe('vertical helpers', () => {
  const metersPerDegreeLatitude = 111320
  const frontReferenceBaseVertical = buildFrontReferenceVertical()
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

  it('returns the base height for a point on the front reference line', () => {
    const profile = buildVerticalProfile(frontReferenceBaseVertical, [
      {
        longitude: 103.952962,
        latitude: 30.594308,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        {
          longitude: 103.952962,
          latitude: 30.594308,
          radialDistanceMeters: 0,
          heightMeters: 493.8,
        },
      ],
    })
  })

  it('produces the same height for equal offsets on both sides of the front reference line', () => {
    const latitudeOffset = 40 / metersPerDegreeLatitude
    const profile = buildVerticalProfile(frontReferenceBaseVertical, [
      {
        longitude: 103.952962,
        latitude: 30.594308 + latitudeOffset,
        radialDistanceMeters: 999999,
      },
      {
        longitude: 103.952962,
        latitude: 30.594308 - latitudeOffset,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(2)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(40, 6)
    expect(profile.points[1]?.radialDistanceMeters).toBeCloseTo(40, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(profile.points[1]?.heightMeters ?? 0, 6)
  })

  it('caps front reference line height growth at clampRange.endMeters', () => {
    const latitudeOffset = 180 / metersPerDegreeLatitude
    const profile = buildVerticalProfile(frontReferenceBaseVertical, [
      {
        longitude: 103.952962,
        latitude: 30.594308 + latitudeOffset,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(180, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8 + Math.tan(Math.PI / 180) * 100, 6)
  })

  it('delays front reference line height growth until distanceOffsetMeters is exceeded', () => {
    const baseSurface = expectDistanceParameterizedSurface(frontReferenceBaseVertical)
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      ...frontReferenceBaseVertical,
      surface: {
        ...baseSurface,
        heightModel: {
          ...baseSurface.heightModel,
          distanceOffsetMeters: 50,
        },
      },
    }
    const latitudeOffset = 40 / metersPerDegreeLatitude

    const profile = buildVerticalProfile(vertical, [
      {
        longitude: 103.952962,
        latitude: 30.594308 + latitudeOffset,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(40, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8, 6)
  })

  it('uses leftPoint to rightPoint as the formal front reference line direction', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        distanceSource: {
          kind: 'front_reference_line',
          centerPoint: [0, 0],
          leftPoint: [-1, 0],
          rightPoint: [0, 1],
        },
      },
    })
    const footprint = [
      {
        longitude: 0,
        latitude: 1,
        radialDistanceMeters: 999999,
      },
    ]
    const expectedDistanceMeters = computeExpectedNormalDistanceMeters(
      { longitude: 0, latitude: 0 },
      { longitude: -1, latitude: 0 },
      { longitude: 0, latitude: 1 },
      { longitude: 0, latitude: 1 },
    )
    const profile = buildVerticalProfile(vertical, footprint)

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(expectedDistanceMeters, 6)
    expect(profile.points[0]?.radialDistanceMeters).not.toBeCloseTo(0, 6)
  })

  it('keeps front reference line distance stable for equal longitude offsets along a north-south line', () => {
    const longitudeOffset = 0.001
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        distanceSource: {
          kind: 'front_reference_line',
          centerPoint: [0, 60],
          leftPoint: [0, 59.5],
          rightPoint: [0, 60.5],
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [
      { longitude: longitudeOffset, latitude: 60, radialDistanceMeters: 999999 },
      { longitude: longitudeOffset, latitude: 60.4, radialDistanceMeters: 999999 },
    ])
    const expectedDistanceMeters = longitudeOffset * 111320 * Math.cos(toRadians(60))

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(2)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(expectedDistanceMeters, 6)
    expect(profile.points[1]?.radialDistanceMeters).toBeCloseTo(expectedDistanceMeters, 6)
  })

  it('falls back to base height for angles extremely close to 90 degrees', () => {
    const baseSurface = expectDistanceParameterizedSurface(analyticVerticalBase)
    const vertical: ProtectionZoneAnalyticSurfaceVertical = {
      ...analyticVerticalBase,
      baseHeightMeters: 250,
      surface: {
        ...baseSurface,
        heightModel: {
          ...baseSurface.heightModel,
          angleDegrees: 89.999999,
        },
      },
    }

    const profile = buildVerticalProfile(vertical, [
      { longitude: 0, latitude: 100 / metersPerDegreeLatitude, radialDistanceMeters: 100 },
    ])

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 0, latitude: 100 / metersPerDegreeLatitude, radialDistanceMeters: 100, heightMeters: 250 },
      ],
    })
  })

  it('treats a near-degenerate front reference line as zero distance', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        distanceSource: {
          kind: 'front_reference_line',
          centerPoint: [0, 0],
          leftPoint: [0, 0],
          rightPoint: [0.000000000001, 0.000000000001],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [
      { longitude: 0.001, latitude: 0.001, radialDistanceMeters: 999999 },
    ])

    expect(profile).toEqual({
      mode: 'analytic_surface',
      points: [
        { longitude: 0.001, latitude: 0.001, radialDistanceMeters: 0, heightMeters: 493.8 },
      ],
    })
  })
})
