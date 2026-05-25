import type { MapConfig } from '../types/map'

function getRuntimeConfig(key: string, fallback: string): string {
  if (typeof window !== 'undefined' && (window as any).__SODS_CONFIG__) {
    const val = (window as any).__SODS_CONFIG__[key]
    if (val !== undefined && val !== null && val !== '') {
      return String(val)
    }
  }
  return fallback
}

const tdtKey = getRuntimeConfig('tdtKey', import.meta.env.VITE_TDT_KEY ?? '')
const ionToken = getRuntimeConfig('cesiumIonToken', import.meta.env.VITE_CESIUM_ION_TOKEN ?? '')

export const mapConfig: MapConfig = {
  tdtKey,
  imageryStyle: 'img',
  terrain: {
    enabled: true,
    type: 'cesium-world-terrain',
    // type: 'tianditu-terrain',
    ionToken,
  },
  showAnimation: false,
  showTimeline: false,
  showBaseLayerPicker: false,
  showGeocoder: false,
  showSceneModePicker: false,
  showNavigationHelpButton: false,
  showFullscreenButton: false,
  initialView: {
    longitude: 114.21246022823736,
    latitude: 30.776607831015887,
    height: 20000,
    pitch: -90,
  },
}
