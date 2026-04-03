<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import { mapConfig } from '../../config/map'

const props = defineProps<{
  resetTick: number
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const viewerRef = ref<Cesium.Viewer | null>(null)
const errorMessage = ref('')

function buildTiandituUrl(layerType: string) {
  return `https://t{s}.tianditu.gov.cn/DataServer?T=${layerType}_w&x={x}&y={y}&l={z}&tk=${mapConfig.tdtKey}`
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

function initViewer() {
  if (!containerRef.value) {
    return
  }

  if (!mapConfig.tdtKey) {
    console.warn('Missing VITE_TDT_KEY, Tianditu imagery may fail to load.')
  }

  try {
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: buildTiandituUrl(mapConfig.imageryStyle),
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      maximumLevel: 18,
    })

    const annotationProvider = new Cesium.UrlTemplateImageryProvider({
      url: buildTiandituUrl('cia'),
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      maximumLevel: 18,
    })

    attachRetryOnError(imageryProvider)
    attachRetryOnError(annotationProvider)

    const viewer = new Cesium.Viewer(containerRef.value, {
      animation: mapConfig.showAnimation,
      timeline: mapConfig.showTimeline,
      baseLayerPicker: mapConfig.showBaseLayerPicker,
      geocoder: mapConfig.showGeocoder,
      sceneModePicker: mapConfig.showSceneModePicker,
      navigationHelpButton: mapConfig.showNavigationHelpButton,
      fullscreenButton: mapConfig.showFullscreenButton,
      baseLayer: new Cesium.ImageryLayer(imageryProvider),
      homeButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: false,
    })

    viewer.imageryLayers.addImageryProvider(annotationProvider)
    viewerRef.value = viewer
    errorMessage.value = ''
    flyToInitialView()
  } catch (error) {
    console.error('[CesiumViewer] Failed to initialize map.', error)
    errorMessage.value = '地图初始化失败，请检查天地图密钥和 Cesium 配置。'
  }
}

onMounted(() => {
  initViewer()
})

watch(
  () => props.resetTick,
  () => {
    flyToInitialView()
  },
)

onBeforeUnmount(() => {
  viewerRef.value?.destroy()
  viewerRef.value = null
})
</script>

<template>
  <section class="map-view">
    <div v-if="errorMessage" class="map-view__fallback">{{ errorMessage }}</div>
    <div v-else ref="containerRef" class="map-view__container"></div>
  </section>
</template>
