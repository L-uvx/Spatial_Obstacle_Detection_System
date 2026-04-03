export interface InitialViewConfig {
  longitude: number
  latitude: number
  height: number
  heading?: number
  pitch?: number
  roll?: number
}

export interface MapConfig {
  tdtKey: string
  imageryStyle: 'img'
  showAnimation: boolean
  showTimeline: boolean
  showBaseLayerPicker: boolean
  showGeocoder: boolean
  showSceneModePicker: boolean
  showNavigationHelpButton: boolean
  showFullscreenButton: boolean
  initialView: InitialViewConfig
}
