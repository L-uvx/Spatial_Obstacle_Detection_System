import { describe, expect, it } from 'vitest'
import type {
  ProtectionZoneCircleGeometry,
  ProtectionZoneRadialBandGeometry,
  ProtectionZoneSamplingConfig,
  ProtectionZoneSectorGeometry,
} from '../../../types/tool'
import { buildCircleRing, buildRadialBandRings, buildSectorRing, type SampledFootprintPoint } from './sampling'

const defaultSampling: ProtectionZoneSamplingConfig = {
  circleAngleStepDegrees: 5,
  sectorAngleStepDegrees: 5,
}

describe('sampling helpers', () => {
  it('builds a closed circle ring with default 5 degree sampling', () => {
    const geometry: ProtectionZoneCircleGeometry = {
      shapeType: 'circle',
      center: {
        longitude: 114.21246,
        latitude: 30.7766,
      },
      radiusMeters: 1000,
    }

    const ring = buildCircleRing(geometry, defaultSampling)

    expect(ring.length).toBeGreaterThanOrEqual(73)
    expect(ring[0]).toEqual(ring[ring.length - 1])
    expect(ring.every((point) => point.radialDistanceMeters === geometry.radiusMeters)).toBe(true)
  })

  it('builds a closed sector ring with non-trivial outer and inner arc samples', () => {
    const geometry: ProtectionZoneSectorGeometry = {
      shapeType: 'sector',
      center: {
        longitude: 114.21246,
        latitude: 30.7766,
      },
      innerRadiusMeters: 100,
      outerRadiusMeters: 1000,
      startAzimuthDegrees: 10,
      endAzimuthDegrees: 80,
    }

    const ring = buildSectorRing(geometry, defaultSampling)

    expect(ring.length).toBeGreaterThan(10)
    expect(ring[0]).toEqual(ring[ring.length - 1])
    expect(ring[0].radialDistanceMeters).toBe(geometry.outerRadiusMeters)
    expect(ring.some((point) => point.radialDistanceMeters === geometry.innerRadiusMeters)).toBe(true)
    expect(ring.some((point) => point.radialDistanceMeters === geometry.outerRadiusMeters)).toBe(true)
  })

  it('builds radial band outer and inner rings as separately closed loops', () => {
    const geometry: ProtectionZoneRadialBandGeometry = {
      shapeType: 'radial_band',
      center: {
        longitude: 103.935861,
        latitude: 30.554611,
      },
      innerRadiusMeters: 50,
      outerRadiusMeters: 37040,
    }

    const { outerRing, innerRing } = buildRadialBandRings(geometry, defaultSampling)

    expect(outerRing.length).toBeGreaterThan(10)
    expect(innerRing.length).toBeGreaterThan(10)
    expect(outerRing[0]).toEqual(outerRing[outerRing.length - 1])
    expect(innerRing[0]).toEqual(innerRing[innerRing.length - 1])
    expect(outerRing.every((point: SampledFootprintPoint) => point.radialDistanceMeters === geometry.outerRadiusMeters)).toBe(true)
    expect(innerRing.every((point: SampledFootprintPoint) => point.radialDistanceMeters === geometry.innerRadiusMeters)).toBe(true)
  })
})
