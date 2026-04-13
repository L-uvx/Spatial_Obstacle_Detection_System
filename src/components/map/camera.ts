import * as Cesium from 'cesium'
import { mapConfig } from '../../config/map'
import type { InitialCameraTarget } from '../../types/tool'

export function buildCameraFlyToOptions(target: InitialCameraTarget) {
  const { longitude, latitude, height, heading = 0, pitch, roll = 0 } = target

  return {
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: Cesium.Math.toRadians(roll),
    },
    duration: 1.5,
  }
}

export function getInitialCameraKey(target: InitialCameraTarget | null) {
  if (!target) {
    return null
  }

  return `${target.longitude}:${target.latitude}:${target.height}:${target.heading ?? 0}:${target.pitch}:${target.roll ?? 0}`
}

export function resolveResetCameraTarget(initialCameraTarget: InitialCameraTarget | null): InitialCameraTarget {
  return (
    initialCameraTarget ?? {
      longitude: mapConfig.initialView.longitude,
      latitude: mapConfig.initialView.latitude,
      height: mapConfig.initialView.height,
      heading: mapConfig.initialView.heading,
      pitch: mapConfig.initialView.pitch ?? -90,
      roll: mapConfig.initialView.roll,
    }
  )
}
