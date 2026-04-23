import type {
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneFlatVertical,
} from '../../../types/tool'

export interface SampledFootprintPoint {
  longitude: number
  latitude: number
  radialDistanceMeters: number
}

export interface FlatVerticalProfile {
  mode: 'flat'
  points: Array<SampledFootprintPoint & { heightMeters: number }>
}

export interface AnalyticVerticalProfilePoint extends SampledFootprintPoint {
  heightMeters: number
}

export interface AnalyticVerticalProfile {
  mode: 'analytic_surface'
  points: AnalyticVerticalProfilePoint[]
}

type VerticalProfile = FlatVerticalProfile | AnalyticVerticalProfile

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function resolveMetersPerDegreeLongitude(latitude: number) {
  return 111320 * Math.cos(toRadians(latitude))
}

function computeRadialDistanceMeters(
  from: { longitude: number; latitude: number },
  to: { longitude: number; latitude: number },
) {
  // Use a small-area lon/lat approximation around the average latitude of the segment.
  const averageLatitude = (from.latitude + to.latitude) / 2
  const deltaLatitudeMeters = (to.latitude - from.latitude) * 111320
  const metersPerDegreeLongitude = resolveMetersPerDegreeLongitude(averageLatitude)
  const deltaLongitudeMeters = (to.longitude - from.longitude) * metersPerDegreeLongitude

  return Math.sqrt(deltaLatitudeMeters ** 2 + deltaLongitudeMeters ** 2)
}

function clampRadialDistance(radialDistanceMeters: number, startDistanceMeters: number, endDistanceMeters: number) {
  return Math.min(Math.max(radialDistanceMeters, startDistanceMeters), endDistanceMeters)
}

function buildAnalyticSurfaceDistance(
  vertical: ProtectionZoneAnalyticSurfaceVertical,
  point: Pick<SampledFootprintPoint, 'longitude' | 'latitude'>,
) {
  const [sourceLongitude, sourceLatitude] = vertical.surface.distanceSource.point

  return computeRadialDistanceMeters(
    { longitude: sourceLongitude, latitude: sourceLatitude },
    point,
  )
}

function buildSafeAnalyticHeight(vertical: ProtectionZoneAnalyticSurfaceVertical, radialDistanceMeters: number) {
  const angleRadians = (vertical.surface.heightModel.angleDegrees * Math.PI) / 180
  const cosine = Math.cos(angleRadians)
  const tangent = Math.tan(angleRadians)

  if (Math.abs(cosine) < Number.EPSILON || !Number.isFinite(tangent)) {
    return vertical.baseHeightMeters
  }

  const boundedDistance = clampRadialDistance(
    radialDistanceMeters,
    vertical.surface.clampRange.startMeters,
    vertical.surface.clampRange.endMeters,
  )
  const distanceOffsetMeters = vertical.surface.heightModel.distanceOffsetMeters
  const relativeDistance = Math.max(boundedDistance - distanceOffsetMeters, 0)
  const heightMeters = vertical.baseHeightMeters + tangent * relativeDistance

  return Number.isFinite(heightMeters) ? heightMeters : vertical.baseHeightMeters
}

export function buildVerticalProfile(
  vertical: ProtectionZoneFlatVertical | ProtectionZoneAnalyticSurfaceVertical,
  footprint: SampledFootprintPoint[],
): VerticalProfile {
  if (vertical.mode === 'flat') {
    return {
      mode: 'flat',
      points: footprint.map((point) => ({
        ...point,
        heightMeters: vertical.baseHeightMeters,
      })),
    }
  }

  if (vertical.mode === 'analytic_surface') {
    return {
      mode: 'analytic_surface',
      points: footprint.map((point) => {
        const radialDistanceMeters = buildAnalyticSurfaceDistance(vertical, point)

        return {
          ...point,
          radialDistanceMeters,
          heightMeters: buildSafeAnalyticHeight(vertical, radialDistanceMeters),
        }
      }),
    }
  }

  throw new Error(`Unsupported protection zone vertical mode: ${(vertical as { mode?: string }).mode ?? 'unknown'}`)
}
