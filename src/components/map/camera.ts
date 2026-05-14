import * as Cesium from 'cesium'
import { mapConfig } from '../../config/map'
import type { InitialCameraTarget, MultiPolygonCoordinates } from '../../types/tool'

function normalizeRing(ring: MultiPolygonCoordinates[number][number]) {
  if (ring.length > 1) {
    const [firstLng, firstLat] = ring[0]
    const [lastLng, lastLat] = ring[ring.length - 1]

    if (firstLng === lastLng && firstLat === lastLat) {
      return ring.slice(0, -1)
    }
  }

  return ring
}

function computeRingAverageCenter(ring: MultiPolygonCoordinates[number][number]) {
  const normalizedRing = normalizeRing(ring)

  if (normalizedRing.length === 0) {
    return null
  }

  let sumLongitude = 0
  let sumLatitude = 0

  for (const [longitude, latitude] of normalizedRing) {
    sumLongitude += longitude
    sumLatitude += latitude
  }

  return {
    longitude: sumLongitude / normalizedRing.length,
    latitude: sumLatitude / normalizedRing.length,
  }
}

function computeRingAreaAndCentroid(ring: MultiPolygonCoordinates[number][number]) {
  const normalizedRing = normalizeRing(ring)

  if (normalizedRing.length < 3) {
    return null
  }

  let signedAreaTwice = 0
  let centroidLongitudeFactor = 0
  let centroidLatitudeFactor = 0

  for (let index = 0; index < normalizedRing.length; index += 1) {
    const [currentLongitude, currentLatitude] = normalizedRing[index]
    const [nextLongitude, nextLatitude] = normalizedRing[(index + 1) % normalizedRing.length]
    const cross = currentLongitude * nextLatitude - nextLongitude * currentLatitude

    signedAreaTwice += cross
    centroidLongitudeFactor += (currentLongitude + nextLongitude) * cross
    centroidLatitudeFactor += (currentLatitude + nextLatitude) * cross
  }

  const area = Math.abs(signedAreaTwice) / 2

  if (area === 0) {
    const fallbackCenter = computeRingAverageCenter(normalizedRing)

    if (!fallbackCenter) {
      return null
    }

    return {
      area: 0,
      centroidLongitude: fallbackCenter.longitude,
      centroidLatitude: fallbackCenter.latitude,
    }
  }

  return {
    area,
    centroidLongitude: centroidLongitudeFactor / (3 * signedAreaTwice),
    centroidLatitude: centroidLatitudeFactor / (3 * signedAreaTwice),
  }
}

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

export function buildTopDownView(position: Cesium.Cartographic): InitialCameraTarget {
  return {
    longitude: Cesium.Math.toDegrees(position.longitude),
    latitude: Cesium.Math.toDegrees(position.latitude),
    height: 10000,
    heading: 0,
    pitch: -90,
  }
}

export function computeMultiPolygonFlightTarget(
  coordinates: MultiPolygonCoordinates,
): { target: InitialCameraTarget; area: number } | null {
  const allPositions: Cesium.Cartesian3[] = []
  let weightedLongitudeSum = 0
  let weightedLatitudeSum = 0
  let totalArea = 0
  let fallbackLongitudeSum = 0
  let fallbackLatitudeSum = 0
  let fallbackPointCount = 0

  for (const polygon of coordinates) {
    for (const ring of polygon) {
      for (const [lng, lat] of ring) {
        allPositions.push(Cesium.Cartesian3.fromDegrees(lng, lat, 0))
      }
    }

    const outerRing = polygon[0]

    if (!outerRing) {
      continue
    }

    const centroid = computeRingAreaAndCentroid(outerRing)
    const fallbackCenter = computeRingAverageCenter(outerRing)

    if (!centroid || !fallbackCenter) {
      continue
    }

    if (centroid.area > 0) {
      weightedLongitudeSum += centroid.centroidLongitude * centroid.area
      weightedLatitudeSum += centroid.centroidLatitude * centroid.area
      totalArea += centroid.area
      continue
    }

    fallbackLongitudeSum += fallbackCenter.longitude
    fallbackLatitudeSum += fallbackCenter.latitude
    fallbackPointCount += 1
  }

  if (allPositions.length === 0) {
    return null
  }

  let centerLng = 0
  let centerLat = 0

  if (totalArea > 0) {
    centerLng = weightedLongitudeSum / totalArea
    centerLat = weightedLatitudeSum / totalArea
  } else if (fallbackPointCount > 0) {
    centerLng = fallbackLongitudeSum / fallbackPointCount
    centerLat = fallbackLatitudeSum / fallbackPointCount
  } else {
    return null
  }

  const boundingSphere = Cesium.BoundingSphere.fromPoints(allPositions)
  const height = boundingSphere ? Math.max(boundingSphere.radius * 5, 2500) : 3000

  return {
    target: {
      longitude: centerLng,
      latitude: centerLat,
      height,
      pitch: -90,
    },
    area: totalArea,
  }
}
