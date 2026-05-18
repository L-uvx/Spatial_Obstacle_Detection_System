export interface InitialViewConfig {
  longitude: number
  latitude: number
  height: number
  heading?: number
  pitch?: number
  roll?: number
}

export interface TerrainConfig {
  enabled: boolean
  type: 'cesium-world-terrain' | 'tianditu-terrain'
  ionToken: string
}

export interface MapConfig {
  tdtKey: string
  imageryStyle: 'img'
  terrain: TerrainConfig
  showAnimation: boolean
  showTimeline: boolean
  showBaseLayerPicker: boolean
  showGeocoder: boolean
  showSceneModePicker: boolean
  showNavigationHelpButton: boolean
  showFullscreenButton: boolean
  initialView: InitialViewConfig
}
