<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import { mapConfig } from '../../config/map'
import { getObstacleFlyToOptions, syncObstacleLayer } from '../../map/layers/ObstacleLayer'
import type { RenderedObstacle } from '../../types/tool'

const props = defineProps<{
  resetTick: number
  obstacles: RenderedObstacle[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const viewerRef = ref<Cesium.Viewer | null>(null)
const errorMessage = ref('')

function syncObstaclesAndFly(obstacles: RenderedObstacle[]) {
  const result = syncObstacleLayer(viewerRef.value, obstacles)
  const flyToOptions = getObstacleFlyToOptions(result)

  if (result.flyToBoundingSphere && viewerRef.value && flyToOptions) {
    viewerRef.value.camera.flyToBoundingSphere(result.flyToBoundingSphere, flyToOptions)
  }
}

function buildTiandituUrl(layerType: string) {
  return `https://t{s}.tianditu.gov.cn/DataServer?T=${layerType}_w&x={x}&y={y}&l={z}&tk=${mapConfig.tdtKey}`
}

function createTiandituImageryProvider(layerType: 'img' | 'cia') {
  return new Cesium.UrlTemplateImageryProvider({
    url: buildTiandituUrl(layerType),
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
  })
}

function attachRetryOnError(provider: Cesium.UrlTemplateImageryProvider) {
  provider.errorEvent.addEventListener((error) => {
    if (error.timesRetried < 2) {
      error.retry = true
    }
  })
}

function flyToInitialView() {
  if (!viewerRef.value) {
    return
  }

  const { longitude, latitude, height, heading = 0, pitch = -45, roll = 0 } = mapConfig.initialView

  viewerRef.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: Cesium.Math.toRadians(roll),
    },
    duration: 1.5,
  })
}

async function buildTerrainProvider() {
  if (!mapConfig.terrain.enabled) {
    return undefined
  }

  if (mapConfig.terrain.type !== 'cesium-world-terrain') {
    return undefined
  }

  if (!mapConfig.terrain.ionToken) {
    console.warn('Missing VITE_CESIUM_ION_TOKEN, terrain is disabled and imagery-only mode will be used.')
    return undefined
  }

  Cesium.Ion.defaultAccessToken = mapConfig.terrain.ionToken
  return Cesium.createWorldTerrainAsync()
}

function createViewer(
  imageryProvider: Cesium.UrlTemplateImageryProvider,
  terrainProvider?: Cesium.TerrainProvider,
) {
  return new Cesium.Viewer(containerRef.value as HTMLDivElement, {
    animation: mapConfig.showAnimation,
    timeline: mapConfig.showTimeline,
    baseLayerPicker: mapConfig.showBaseLayerPicker,
    geocoder: mapConfig.showGeocoder,
    sceneModePicker: mapConfig.showSceneModePicker,
    navigationHelpButton: mapConfig.showNavigationHelpButton,
    fullscreenButton: mapConfig.showFullscreenButton,
    baseLayer: new Cesium.ImageryLayer(imageryProvider),
    terrainProvider,
    homeButton: false,
    infoBox: false,
    selectionIndicator: false,
    shouldAnimate: false,
  })
}

function destroyViewer(viewer?: Cesium.Viewer | null) {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy()
  }
}

async function initViewer() {
  if (!containerRef.value) {
    return
  }

  if (!mapConfig.tdtKey) {
    console.warn('Missing VITE_TDT_KEY, Tianditu imagery may fail to load.')
  }

  let viewer: Cesium.Viewer | undefined

  try {
    const imageryProvider = createTiandituImageryProvider(mapConfig.imageryStyle)
    const annotationProvider = createTiandituImageryProvider('cia')

    attachRetryOnError(imageryProvider)
    attachRetryOnError(annotationProvider)

    let terrainProvider: Cesium.TerrainProvider | undefined

    try {
      terrainProvider = await buildTerrainProvider()
    } catch (error) {
      console.warn('[CesiumViewer] Failed to initialize terrain, falling back to imagery only.', error)
    }

    viewer = createViewer(imageryProvider, terrainProvider)
    viewer.scene.globe.depthTestAgainstTerrain = true

    viewer.imageryLayers.addImageryProvider(annotationProvider)
    viewerRef.value = viewer
    errorMessage.value = ''
    syncObstaclesAndFly(props.obstacles)

    if (props.obstacles.length === 0) {
      flyToInitialView()
    }
  } catch (error) {
    destroyViewer(viewer)
    console.error('[CesiumViewer] Failed to initialize map.', error)
    errorMessage.value = '地图初始化失败，请检查天地图密钥和 Cesium 配置。'
  }
}

onMounted(() => {
  void initViewer()
})

watch(
  () => props.resetTick,
  () => {
    flyToInitialView()
  },
)

watch(
  () => props.obstacles,
  (obstacles) => {
    syncObstaclesAndFly(obstacles)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  destroyViewer(viewerRef.value)
  viewerRef.value = null
})
</script>

<template>
  <section class="map-view">
    <div v-if="errorMessage" class="map-view__fallback">{{ errorMessage }}</div>
    <div v-else ref="containerRef" class="map-view__container"></div>
  </section>
</template>
