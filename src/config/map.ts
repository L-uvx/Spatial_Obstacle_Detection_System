import type { MapConfig } from '../types/map'

export const mapConfig: MapConfig = {
  tdtKey: import.meta.env.VITE_TDT_KEY ?? '',
  imageryStyle: 'img',
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
    height: 40000,
    pitch: -90,
  },
}
