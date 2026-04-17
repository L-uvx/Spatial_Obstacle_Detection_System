import type {
  ProtectionZoneCircleGeometry,
  ProtectionZoneSamplingConfig,
  ProtectionZoneSectorGeometry,
} from '../../../types/tool'

const METERS_PER_DEGREE_LATITUDE = 111320

export interface SampledFootprintPoint {
  longitude: number
  latitude: number
  radialDistanceMeters: number
}

function normalizeAngleDegrees(angleDegrees: number) {
  const normalized = angleDegrees % 360

  return normalized < 0 ? normalized + 360 : normalized
}

function resolvePositiveStep(stepDegrees: number) {
  return stepDegrees > 0 ? stepDegrees : 5
}

function resolveSweepEndDegrees(startDegrees: number, endDegrees: number) {
  let normalizedEnd = normalizeAngleDegrees(endDegrees)

  if (normalizedEnd <= startDegrees) {
    normalizedEnd += 360
  }

  return normalizedEnd
}

function buildAngleSequence(startDegrees: number, endDegrees: number, stepDegrees: number) {
  const angles: number[] = []
  let currentDegrees = startDegrees

  while (currentDegrees < endDegrees) {
    angles.push(currentDegrees)
    currentDegrees += stepDegrees
  }

  angles.push(endDegrees)

  return angles
}

function samplePoint(
  center: { longitude: number; latitude: number },
  azimuthDegrees: number,
  radialDistanceMeters: number,
): SampledFootprintPoint {
  const azimuthRadians = (azimuthDegrees * Math.PI) / 180
  const latitudeRadians = (center.latitude * Math.PI) / 180
  const deltaLatitudeDegrees = (Math.cos(azimuthRadians) * radialDistanceMeters) / METERS_PER_DEGREE_LATITUDE
  const metersPerDegreeLongitude = METERS_PER_DEGREE_LATITUDE * Math.cos(latitudeRadians)
  const deltaLongitudeDegrees = metersPerDegreeLongitude === 0
    ? 0
    : (Math.sin(azimuthRadians) * radialDistanceMeters) / metersPerDegreeLongitude

  return {
    longitude: center.longitude + deltaLongitudeDegrees,
    latitude: center.latitude + deltaLatitudeDegrees,
    radialDistanceMeters,
  }
}

function closeRing(points: SampledFootprintPoint[]) {
  if (points.length === 0) {
    return points
  }

  return [...points, { ...points[0] }]
}

export function buildCircleRing(
  geometry: ProtectionZoneCircleGeometry,
  sampling: ProtectionZoneSamplingConfig,
): SampledFootprintPoint[] {
  const stepDegrees = resolvePositiveStep(sampling.circleAngleStepDegrees)
  const angles = buildAngleSequence(0, 360, stepDegrees)
  const ring = angles.slice(0, -1).map((angleDegrees) => samplePoint(geometry.center, angleDegrees, geometry.radiusMeters))

  return closeRing(ring)
}

export function buildSectorRing(
  geometry: ProtectionZoneSectorGeometry,
  sampling: ProtectionZoneSamplingConfig,
): SampledFootprintPoint[] {
  const stepDegrees = resolvePositiveStep(sampling.sectorAngleStepDegrees)
  const startDegrees = normalizeAngleDegrees(geometry.startAzimuthDegrees)
  const endDegrees = resolveSweepEndDegrees(startDegrees, geometry.endAzimuthDegrees)
  const outerAngles = buildAngleSequence(startDegrees, endDegrees, stepDegrees)
  const innerAngles = [...outerAngles].reverse()
  const outerArc = outerAngles.map((angleDegrees) => samplePoint(geometry.center, angleDegrees, geometry.outerRadiusMeters))
  const innerArc = geometry.innerRadiusMeters > 0
    ? innerAngles.map((angleDegrees) => samplePoint(geometry.center, angleDegrees, geometry.innerRadiusMeters))
    : [{ ...geometry.center, radialDistanceMeters: 0 }]

  return closeRing([...outerArc, ...innerArc])
}
