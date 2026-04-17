import type {
  ProtectionZoneAnalyticSurfaceVertical,
  ProtectionZoneFlatVertical,
} from '../../../types/tool'
import type { SampledFootprintPoint } from './sampling'

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

function clampRadialDistance(radialDistanceMeters: number, startDistanceMeters: number, endDistanceMeters: number) {
  return Math.min(Math.max(radialDistanceMeters, startDistanceMeters), endDistanceMeters)
}

function buildSafeAnalyticHeight(vertical: ProtectionZoneAnalyticSurfaceVertical, radialDistanceMeters: number) {
  const angleRadians = (vertical.heightFunction.elevationAngleDegrees * Math.PI) / 180
  const cosine = Math.cos(angleRadians)
  const tangent = Math.tan(angleRadians)

  if (Math.abs(cosine) < Number.EPSILON || !Number.isFinite(tangent)) {
    return vertical.baseHeightMeters
  }

  const boundedDistance = clampRadialDistance(
    radialDistanceMeters,
    vertical.heightFunction.startDistanceMeters,
    vertical.heightFunction.endDistanceMeters,
  )
  const relativeDistance = boundedDistance - vertical.heightFunction.startDistanceMeters
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
      points: footprint.map((point) => ({
        ...point,
        heightMeters: buildSafeAnalyticHeight(vertical, point.radialDistanceMeters),
      })),
    }
  }

  throw new Error(`Unsupported protection zone vertical mode: ${(vertical as { mode?: string }).mode ?? 'unknown'}`)
}
