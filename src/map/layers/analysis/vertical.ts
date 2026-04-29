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

const METERS_PER_DEGREE_LATITUDE = 111320
const MIN_REFERENCE_LINE_LENGTH_METERS = 0.01
const MIN_SAFE_COSINE = 1e-6

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
  const deltaLatitudeMeters = (to.latitude - from.latitude) * METERS_PER_DEGREE_LATITUDE
  const metersPerDegreeLongitude = resolveMetersPerDegreeLongitude(averageLatitude)
  const deltaLongitudeMeters = (to.longitude - from.longitude) * metersPerDegreeLongitude

  return Math.sqrt(deltaLatitudeMeters ** 2 + deltaLongitudeMeters ** 2)
}

function toLocalMeters(
  origin: { longitude: number; latitude: number },
  target: { longitude: number; latitude: number },
) {
  const averageLatitude = (origin.latitude + target.latitude) / 2
  const metersPerDegreeLongitude = resolveMetersPerDegreeLongitude(averageLatitude)

  return {
    x: (target.longitude - origin.longitude) * metersPerDegreeLongitude,
    y: (target.latitude - origin.latitude) * METERS_PER_DEGREE_LATITUDE,
  }
}

function computeFrontReferenceAxis(
  station: { longitude: number; latitude: number },
  origin: { longitude: number; latitude: number },
) {
  const axis = toLocalMeters(station, origin)
  const axisLength = Math.sqrt(axis.x ** 2 + axis.y ** 2)

  if (axisLength < MIN_REFERENCE_LINE_LENGTH_METERS) {
    return null
  }

  return {
    unitX: axis.x / axisLength,
    unitY: axis.y / axisLength,
  }
}

function clampRadialDistance(radialDistanceMeters: number, startDistanceMeters: number, endDistanceMeters: number) {
  return Math.min(Math.max(radialDistanceMeters, startDistanceMeters), endDistanceMeters)
}

function buildAnalyticSurfaceDistance(
  vertical: ProtectionZoneAnalyticSurfaceVertical,
  point: Pick<SampledFootprintPoint, 'longitude' | 'latitude'>,
) {
  if (vertical.surface.type !== 'distance_parameterized') {
    throw new Error(`Unsupported analytic surface type: ${vertical.surface.type}`)
  }

  if (
    vertical.surface.distanceSource.kind === 'point'
    && vertical.surface.distanceMetric === 'radial'
  ) {
    const [sourceLongitude, sourceLatitude] = vertical.surface.distanceSource.point

    return computeRadialDistanceMeters(
      { longitude: sourceLongitude, latitude: sourceLatitude },
      point,
    )
  }

  if (
    vertical.surface.distanceSource.kind === 'front_reference_line'
    && vertical.surface.distanceMetric === 'axial_from_reference_line'
  ) {
    const [stationLongitude, stationLatitude] = vertical.surface.distanceSource.stationPoint

    return computeRadialDistanceMeters(
      { longitude: stationLongitude, latitude: stationLatitude },
      point,
    )
  }

  throw new Error(
    `Unsupported analytic surface distance model: ${vertical.surface.distanceSource.kind}/${vertical.surface.distanceMetric}`,
  )
}

function buildSafeAnalyticHeight(
  vertical: ProtectionZoneAnalyticSurfaceVertical,
  radialDistanceMeters: number,
  point?: Pick<SampledFootprintPoint, 'longitude' | 'latitude'>,
) {
  if (vertical.surface.type !== 'distance_parameterized') {
    throw new Error(`Unsupported analytic surface type: ${vertical.surface.type}`)
  }

  const angleRadians = (vertical.surface.heightModel.angleDegrees * Math.PI) / 180
  const cosine = Math.cos(angleRadians)
  const tangent = Math.tan(angleRadians)

  if (Math.abs(cosine) < MIN_SAFE_COSINE || !Number.isFinite(tangent)) {
    return vertical.baseHeightMeters
  }

  if (
    vertical.surface.distanceSource.kind === 'front_reference_line'
    && vertical.surface.distanceMetric === 'axial_from_reference_line'
  ) {
    if (!point) {
      return vertical.baseHeightMeters
    }

    const [stationLongitude, stationLatitude] = vertical.surface.distanceSource.stationPoint
    const [centerLongitude, centerLatitude] = vertical.surface.distanceSource.centerPoint
    const axis = computeFrontReferenceAxis(
      { longitude: stationLongitude, latitude: stationLatitude },
      { longitude: centerLongitude, latitude: centerLatitude },
    )

    if (!axis) {
      return vertical.baseHeightMeters
    }

    const targetVector = toLocalMeters(
      { longitude: stationLongitude, latitude: stationLatitude },
      point,
    )
    const targetDistance = Math.sqrt((targetVector.x ** 2) + (targetVector.y ** 2))

    if (targetDistance < MIN_REFERENCE_LINE_LENGTH_METERS) {
      return vertical.baseHeightMeters
    }

    const targetUnitX = targetVector.x / targetDistance
    const targetUnitY = targetVector.y / targetDistance
    const angleCosine = (axis.unitX * targetUnitX) + (axis.unitY * targetUnitY)

    if (angleCosine <= MIN_SAFE_COSINE) {
      return vertical.baseHeightMeters
    }

    const boundedDistance = clampRadialDistance(
      radialDistanceMeters,
      vertical.surface.clampRange.startMeters,
      vertical.surface.clampRange.endMeters,
    )
    const runwayProjection = vertical.surface.planarControl.frontOffsetMeters / angleCosine
    const effectiveDistance = Math.max(0, boundedDistance - runwayProjection)
    const heightMeters = vertical.baseHeightMeters + (effectiveDistance * tangent)

    return Number.isFinite(heightMeters) ? heightMeters : vertical.baseHeightMeters
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
        const heightMeters = buildSafeAnalyticHeight(vertical, radialDistanceMeters, point)

        return {
          ...point,
          radialDistanceMeters,
          heightMeters,
        }
      }),
    }
  }

  throw new Error(`Unsupported protection zone vertical mode: ${(vertical as { mode?: string }).mode ?? 'unknown'}`)
}
