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

function metersToLatitude(meters: number) {
  return meters / 111320
}

function metersToLongitude(meters: number, latitude: number) {
  return meters / (111320 * Math.cos(toRadians(latitude)))
}

function buildPointFromPolarDistance(
  origin: { longitude: number; latitude: number },
  radialDistanceMeters: number,
  angleDegreesFromNorth: number,
) {
  const angleRadians = toRadians(angleDegreesFromNorth)
  const northMeters = radialDistanceMeters * Math.cos(angleRadians)
  const eastMeters = radialDistanceMeters * Math.sin(angleRadians)

  return {
    longitude: origin.longitude + metersToLongitude(eastMeters, origin.latitude),
    latitude: origin.latitude + metersToLatitude(northMeters),
    radialDistanceMeters: 999999,
  }
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
    stationPoint: [0, 0] as [number, number],
    centerPoint: [103.952962, 30.594308] as [number, number],
    leftPoint: [103.952492, 30.594308] as [number, number],
    rightPoint: [103.953432, 30.594308] as [number, number],
  },
  distanceMetric: 'axial_from_reference_line' as const,
  clampRange: {
    startMeters: 0,
    endMeters: 100,
  },
  planarControl: {
    frontOffsetMeters: 0,
    halfAngleDegrees: 30,
    radiusMeters: 1000,
  },
  heightModel: {
    type: 'angle_linear_rise' as const,
    angleDegrees: 1,
    distanceOffsetMeters: 0,
  },
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

  it('keeps point plus radial semantics unchanged for radial distance and height pairing', () => {
    const profile = buildVerticalProfile(analyticVerticalBase, [
      {
        longitude: 0,
        latitude: 80 / metersPerDegreeLatitude,
        radialDistanceMeters: 999999,
      },
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(180, 6)
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

  it('keeps the base height on the forward axis when radial distance is shorter than runway projection', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        planarControl: {
          ...frontReferenceBaseSurface.planarControl,
          frontOffsetMeters: 50,
        },
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 50,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 30, 0)])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.longitude).toBe(0)
    expect(profile.points[0]?.latitude).toBeCloseTo(metersToLatitude(30), 12)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(30, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8, 6)
  })

  it('rises on the forward axis by r minus runway projection once the target is beyond the front offset', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        planarControl: {
          ...frontReferenceBaseSurface.planarControl,
          frontOffsetMeters: 50,
        },
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 10,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 0)])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8 + Math.tan(toRadians(10)) * 30, 6)
  })

  it('returns radial distance and height together from the same front_reference_line evaluation path', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        planarControl: {
          ...frontReferenceBaseSurface.planarControl,
          frontOffsetMeters: 50,
        },
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 10,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const point = buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 120, 0)
    const profile = buildVerticalProfile(vertical, [point])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]).toMatchObject({
      radialDistanceMeters: expect.any(Number),
      heightMeters: expect.any(Number),
    })
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(120, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8 + Math.tan(toRadians(10)) * 70, 6)
  })

  it('produces different heights for the same radial distance at different forward angles', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        planarControl: {
          ...frontReferenceBaseSurface.planarControl,
          frontOffsetMeters: 50,
        },
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 50,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [
      buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 0),
      buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 60),
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(2)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[1]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8 + Math.tan(toRadians(10)) * 30, 6)
    expect(profile.points[1]?.heightMeters).toBeCloseTo(493.8, 6)
  })

  it('keeps a rear-hemisphere target at base height instead of gaining extra height', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        planarControl: {
          ...frontReferenceBaseSurface.planarControl,
          frontOffsetMeters: 50,
        },
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 10,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 180)])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8, 6)
  })

  it('caps far forward targets at clampRange.endMeters for the effective distance path', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        planarControl: {
          ...frontReferenceBaseSurface.planarControl,
          frontOffsetMeters: 50,
        },
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 10,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 120,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 300, 0)])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(300, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8 + Math.tan(toRadians(10)) * 70, 6)
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

  it('keeps near-sideways targets at a safe base height instead of blowing up runway projection', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        heightModel: {
          ...frontReferenceBaseSurface.heightModel,
          angleDegrees: 10,
          distanceOffsetMeters: 50,
        },
        clampRange: {
          startMeters: 0,
          endMeters: 1000,
        },
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, metersToLatitude(100)],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [
      buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 89.99999),
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 4)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8, 6)
    expect(Number.isFinite(profile.points[0]?.heightMeters ?? Number.NaN)).toBe(true)
  })

  it('treats a near-degenerate station to center axis as a safe base-height fallback', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        distanceSource: {
          kind: 'front_reference_line',
          stationPoint: [0, 0],
          centerPoint: [0, 0],
          leftPoint: [metersToLongitude(-40, metersToLatitude(100)), metersToLatitude(100)],
          rightPoint: [metersToLongitude(40, metersToLatitude(100)), metersToLatitude(100)],
        },
      },
    })

    const profile = buildVerticalProfile(vertical, [
      buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 0),
    ])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.longitude).toBe(0)
    expect(profile.points[0]?.latitude).toBeCloseTo(metersToLatitude(80), 12)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[0]?.heightMeters).toBeCloseTo(493.8, 6)
  })

  it('reports the true station radial distance for front_reference_line points even when height falls back', () => {
    const vertical = buildFrontReferenceVertical({
      surface: {
        ...frontReferenceBaseSurface,
        distanceSource: {
          ...frontReferenceBaseSurface.distanceSource,
          centerPoint: [0, 0],
        },
      },
    })

    const point = buildPointFromPolarDistance({ longitude: 0, latitude: 0 }, 80, 0)
    const profile = buildVerticalProfile(vertical, [point])

    expect(profile.mode).toBe('analytic_surface')
    expect(profile.points).toHaveLength(1)
    expect(profile.points[0]?.radialDistanceMeters).toBeCloseTo(80, 6)
    expect(profile.points[0]?.heightMeters).toBe(vertical.baseHeightMeters)
  })
})
