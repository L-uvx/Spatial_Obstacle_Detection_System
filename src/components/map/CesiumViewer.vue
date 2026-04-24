<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import { mapConfig } from '../../config/map'
import { syncAnalysisLayer } from '../../map/layers/AnalysisLayer'
import { getObstacleFlyToOptions, syncObstacleLayer } from '../../map/layers/ObstacleLayer'
import { syncStationLayer } from '../../map/layers/StationLayer'
import type {
  InitialCameraTarget,
  PolygonObstacleAnalysisState,
  RenderedObstacle,
  RenderedStation,
} from '../../types/tool'
import { buildCameraFlyToOptions, getInitialCameraKey, resolveResetCameraTarget } from './camera'

const props = defineProps<{
  resetTick: number
  obstacles: RenderedObstacle[]
  visibleStations: RenderedStation[]
  initialCameraTarget: InitialCameraTarget | null
  visibleProtectionZones: PolygonObstacleAnalysisState['visibleProtectionZones']
  flyToTargetTick: number
  flyToTargetPayload: InitialCameraTarget | null
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const viewerRef = ref<Cesium.Viewer | null>(null)
const errorMessage = ref('')
const appliedInitialCameraKeyRef = ref<string | null>(null)
const hasSyncedInitialObstaclesRef = ref(false)

// 判断本轮障碍物同步后是否应该按新增范围自动飞行。
function shouldFlyToObstacleExtents() {
  if (appliedInitialCameraKeyRef.value !== null) {
    return true
  }

  if (props.initialCameraTarget !== null) {
    return false
  }

  return hasSyncedInitialObstaclesRef.value
}

// 同步障碍物图层，并在需要时飞到本次新增障碍物范围。
function syncObstacles(obstacles: RenderedObstacle[], flyToNewlyAdded: boolean) {
  const result = syncObstacleLayer(viewerRef.value, obstacles, { flyToNewlyAdded })
  const flyToOptions = getObstacleFlyToOptions(result)

  if (props.initialCameraTarget === null && obstacles.length > 0) {
    hasSyncedInitialObstaclesRef.value = true
  }

  if (result.flyToBoundingSphere && viewerRef.value && flyToOptions) {
    viewerRef.value.camera.flyToBoundingSphere(result.flyToBoundingSphere, flyToOptions)
  }
}

// 同步当前可见的保护区图层。
function syncAnalysisZones(zones: PolygonObstacleAnalysisState['visibleProtectionZones']) {
  syncAnalysisLayer(viewerRef.value, zones)
}

// 同步当前机场的台站点位与标签。
function syncStations(stations: RenderedStation[]) {
  syncStationLayer(viewerRef.value, stations)
}

// 生成天地图影像或注记图层的模板地址。
function buildTiandituUrl(layerType: string) {
  return `https://t{s}.tianditu.gov.cn/DataServer?T=${layerType}_w&x={x}&y={y}&l={z}&tk=${mapConfig.tdtKey}`
}

// 创建指定类型的天地图影像提供器。
function createTiandituImageryProvider(layerType: 'img' | 'cia') {
  return new Cesium.UrlTemplateImageryProvider({
    url: buildTiandituUrl(layerType),
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
  })
}

// 为天地图瓦片请求挂载有限次自动重试策略。
function attachRetryOnError(provider: Cesium.UrlTemplateImageryProvider) {
  provider.errorEvent.addEventListener((error) => {
    if (error.timesRetried < 2) {
      error.retry = true
    }
  })
}

// 将相机飞到当前目标位置。
function flyToTarget(target: InitialCameraTarget | null) {
  if (!viewerRef.value || !target) {
    return
  }

  viewerRef.value.camera.flyTo(buildCameraFlyToOptions(target))
}

// 按配置初始化 terrain，并在缺少 token 时降级为纯影像模式。
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

// 使用基础影像和可选地形创建 Cesium Viewer 实例。
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

// 安全销毁已有的 Viewer 实例。
function destroyViewer(viewer?: Cesium.Viewer | null) {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy()
  }
}

// 初始化 Viewer、底图、图层同步和首屏相机位置。
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
    syncObstacles(props.obstacles, false)
    syncStations(props.visibleStations)
    syncAnalysisZones(props.visibleProtectionZones)

    if (props.initialCameraTarget) {
      flyToTarget(props.initialCameraTarget)
      appliedInitialCameraKeyRef.value = getInitialCameraKey(props.initialCameraTarget)
    } else if (props.obstacles.length === 0) {
      flyToTarget(resolveResetCameraTarget(props.initialCameraTarget))
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
    flyToTarget(resolveResetCameraTarget(props.initialCameraTarget))
  },
)

watch(
  () => props.obstacles,
  (obstacles) => {
    syncObstacles(obstacles, shouldFlyToObstacleExtents())
  },
  { deep: true },
)

watch(
  () => props.visibleStations,
  (stations) => {
    syncStations(stations)
  },
  { deep: true },
)

watch(
  () => props.visibleProtectionZones,
  (zones) => {
    syncAnalysisZones(zones)
  },
  { deep: true },
)

watch(
  () => props.initialCameraTarget,
  (target) => {
    const nextKey = getInitialCameraKey(target)

    if (!target || !nextKey || nextKey === appliedInitialCameraKeyRef.value) {
      return
    }

    syncObstacles(props.obstacles, false)
    flyToTarget(target)
    appliedInitialCameraKeyRef.value = nextKey
  },
  { deep: true },
)

watch(
  () => props.flyToTargetTick,
  () => {
    if (props.flyToTargetPayload) {
      flyToTarget(props.flyToTargetPayload)
    }
  },
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
