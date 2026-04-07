import type { MapConfig } from '../types/map'

const tdtKey = import.meta.env.VITE_TDT_KEY ?? ''
const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? ''

export const mapConfig: MapConfig = {
  tdtKey,
  imageryStyle: 'img',
  terrain: {
    enabled: true,
    type: 'cesium-world-terrain',
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
    longitude: 114.3055,
    latitude: 30.5928,
    height: 30000,
    pitch: -90,
  },
}
