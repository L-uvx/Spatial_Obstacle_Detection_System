import type {
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneDistanceParameterizedSurface,
  ProtectionZoneFrontReferenceLineDistanceParameterizedSurface,
  ProtectionZoneFlatVertical,
  ProtectionZonePointDistanceParameterizedSurface,
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
type DistanceParameterizedVertical<TSurface extends ProtectionZoneDistanceParameterizedSurface = ProtectionZoneDistanceParameterizedSurface> =
  ProtectionZoneAnalyticSurfaceVertical & {
    surface: TSurface
  }

type PointRadialVertical = DistanceParameterizedVertical<ProtectionZonePointDistanceParameterizedSurface>
type FrontReferenceLineVertical = DistanceParameterizedVertical<ProtectionZoneFrontReferenceLineDistanceParameterizedSurface>

interface EvaluatedAnalyticPoint {
  radialDistanceMeters: number
  heightMeters: number
}

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

function buildPointRadialHeight(
  vertical: DistanceParameterizedVertical,
  radialDistanceMeters: number,
) {
  const angleRadians = (vertical.surface.heightModel.angleDegrees * Math.PI) / 180
  const cosine = Math.cos(angleRadians)
  const tangent = Math.tan(angleRadians)

  if (Math.abs(cosine) < MIN_SAFE_COSINE || !Number.isFinite(tangent)) {
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

function evaluatePointRadialSurface(
  vertical: PointRadialVertical,
  point: Pick<SampledFootprintPoint, 'longitude' | 'latitude'>,
) : EvaluatedAnalyticPoint {
  const [sourceLongitude, sourceLatitude] = vertical.surface.distanceSource.point
  const radialDistanceMeters = computeRadialDistanceMeters(
    { longitude: sourceLongitude, latitude: sourceLatitude },
    point,
  )

  return {
    radialDistanceMeters,
    heightMeters: buildPointRadialHeight(vertical, radialDistanceMeters),
  }
}

function evaluateFrontReferenceLineSurface(
  vertical: FrontReferenceLineVertical,
  point: Pick<SampledFootprintPoint, 'longitude' | 'latitude'>,
): EvaluatedAnalyticPoint {
  const [stationLongitude, stationLatitude] = vertical.surface.distanceSource.stationPoint
  const radialDistanceMeters = computeRadialDistanceMeters(
    { longitude: stationLongitude, latitude: stationLatitude },
    point,
  )
  const angleRadians = (vertical.surface.heightModel.angleDegrees * Math.PI) / 180
  const cosine = Math.cos(angleRadians)
  const tangent = Math.tan(angleRadians)

  if (Math.abs(cosine) < MIN_SAFE_COSINE || !Number.isFinite(tangent)) {
    return {
      radialDistanceMeters,
      heightMeters: vertical.baseHeightMeters,
    }
  }

  const [centerLongitude, centerLatitude] = vertical.surface.distanceSource.centerPoint
  const axis = computeFrontReferenceAxis(
    { longitude: stationLongitude, latitude: stationLatitude },
    { longitude: centerLongitude, latitude: centerLatitude },
  )

  if (!axis) {
    return {
      radialDistanceMeters,
      heightMeters: vertical.baseHeightMeters,
    }
  }

  const targetVector = toLocalMeters(
    { longitude: stationLongitude, latitude: stationLatitude },
    point,
  )
  const targetDistance = Math.sqrt((targetVector.x ** 2) + (targetVector.y ** 2))

  if (targetDistance < MIN_REFERENCE_LINE_LENGTH_METERS) {
    return {
      radialDistanceMeters,
      heightMeters: vertical.baseHeightMeters,
    }
  }

  const targetUnitX = targetVector.x / targetDistance
  const targetUnitY = targetVector.y / targetDistance
  const angleCosine = (axis.unitX * targetUnitX) + (axis.unitY * targetUnitY)

  if (angleCosine <= MIN_SAFE_COSINE) {
    return {
      radialDistanceMeters,
      heightMeters: vertical.baseHeightMeters,
    }
  }

  const boundedDistance = clampRadialDistance(
    radialDistanceMeters,
    vertical.surface.clampRange.startMeters,
    vertical.surface.clampRange.endMeters,
  )
  const runwayProjection = vertical.surface.planarControl.frontOffsetMeters / angleCosine
  const effectiveDistance = Math.max(0, boundedDistance - runwayProjection)
  const heightMeters = vertical.baseHeightMeters + (effectiveDistance * tangent)

  return {
    radialDistanceMeters,
    heightMeters: Number.isFinite(heightMeters) ? heightMeters : vertical.baseHeightMeters,
  }
}

function evaluateDistanceParameterizedPoint(
  vertical: DistanceParameterizedVertical,
  point: Pick<SampledFootprintPoint, 'longitude' | 'latitude'>,
): EvaluatedAnalyticPoint {
  if (
    vertical.surface.distanceSource.kind === 'point'
    && vertical.surface.distanceMetric === 'radial'
  ) {
    return evaluatePointRadialSurface(vertical as PointRadialVertical, point)
  }

  if (
    vertical.surface.distanceSource.kind === 'front_reference_line'
    && vertical.surface.distanceMetric === 'axial_from_reference_line'
  ) {
    return evaluateFrontReferenceLineSurface(vertical as FrontReferenceLineVertical, point)
  }

  throw new Error(
    `Unsupported analytic surface distance model: ${vertical.surface.distanceSource.kind}/${vertical.surface.distanceMetric}`,
  )
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
    if (vertical.surface.type !== 'distance_parameterized') {
      throw new Error(`Unsupported analytic surface type: ${vertical.surface.type}`)
    }

    const distanceParameterizedVertical = vertical as DistanceParameterizedVertical

    return {
      mode: 'analytic_surface',
      points: footprint.map((point) => {
        const evaluatedPoint = evaluateDistanceParameterizedPoint(distanceParameterizedVertical, point)

        return {
          ...point,
          radialDistanceMeters: evaluatedPoint.radialDistanceMeters,
          heightMeters: evaluatedPoint.heightMeters,
        }
      }),
    }
  }

  throw new Error(`Unsupported protection zone vertical mode: ${(vertical as { mode?: string }).mode ?? 'unknown'}`)
}
