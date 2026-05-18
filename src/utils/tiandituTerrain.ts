import pako from 'pako'
import * as Cesium from 'cesium'

export function getTiandituTileUrl(
  x: number,
  y: number,
  level: number,
  key: string,
): string {
  const subdomain = `t${(x + y + level) % 8}`
  return `https://${subdomain}.tianditu.gov.cn/mapservice/swdx?T=elv_c&x=${x}&y=${y}&l=${level + 1}&tk=${key}`
}

const RAW_TILE_SIZE = 150
const OUTPUT_TILE_SIZE = 64
const MIN_LEVEL = 5
const MAX_LEVEL = 11

const HEIGHT_STRUCTURE = {
  heightScale: 0.001,
  heightOffset: -1000,
  elementsPerHeight: 3,
  stride: 4,
  elementMultiplier: 256,
  isBigEndian: true,
}

function getChildMask(_level: number, _x: number, _y: number): number {
  if (_level >= MAX_LEVEL) return 0
  return 15
}

function encodeTile(raw: Int16Array): Uint8Array {
  const rgba = new Uint8Array(OUTPUT_TILE_SIZE * OUTPUT_TILE_SIZE * 4)
  for (let i = 0; i < OUTPUT_TILE_SIZE; i++) {
    const srcRow = (i * (RAW_TILE_SIZE - 1)) / (OUTPUT_TILE_SIZE - 1)
    for (let j = 0; j < OUTPUT_TILE_SIZE; j++) {
      const srcCol = (j * (RAW_TILE_SIZE - 1)) / (OUTPUT_TILE_SIZE - 1)
      let t = raw[Math.floor(srcRow) * RAW_TILE_SIZE + Math.floor(srcCol)]
      if (t < -2000 || t > 10000) t = 0
      // 1985正高 → WGS84椭球高: h = H + N (N≈-15m for central China)
      // const encoded = (t - 30 + 1000) / 0.001
      const encoded = (t + 1000) / 0.001
      const off = (i * OUTPUT_TILE_SIZE + j) * 4
      rgba[off] = (encoded / 65536) & 0xff
      rgba[off + 1] = (encoded / 256) & 0xff
      rgba[off + 2] = encoded & 0xff
      rgba[off + 3] = 255
    }
  }
  return rgba
}

export function parseTiandituTerrainData(compressed: Uint8Array): Uint8Array {
  let decompressed: Uint8Array | undefined
  try {
    decompressed = pako.inflate(compressed)
  } catch {
    return new Uint8Array(OUTPUT_TILE_SIZE * OUTPUT_TILE_SIZE * 4)
  }
  if (!decompressed || decompressed.length < RAW_TILE_SIZE * RAW_TILE_SIZE * 2) {
    return new Uint8Array(OUTPUT_TILE_SIZE * OUTPUT_TILE_SIZE * 4)
  }
  const raw = new Int16Array(RAW_TILE_SIZE * RAW_TILE_SIZE)
  for (let i = 0; i < raw.length; i++) {
    raw[i] = decompressed[i * 2] + 256 * decompressed[i * 2 + 1]
  }
  return encodeTile(raw)
}

export class TiandituTerrainProvider {
  private _key: string
  private _tilingScheme: Cesium.GeographicTilingScheme
  private _errorEvent: Cesium.Event

  constructor(key: string) {
    this._key = key
    this._tilingScheme = new Cesium.GeographicTilingScheme()
    this._errorEvent = new Cesium.Event()
  }

  get errorEvent(): Cesium.Event { return this._errorEvent }
  get credit(): Cesium.Credit { return new Cesium.Credit('天地图地形') }
  get tilingScheme(): Cesium.GeographicTilingScheme { return this._tilingScheme }
  get hasWaterMask(): boolean { return false }
  get hasVertexNormals(): boolean { return false }
  get availability(): undefined { return undefined }
  get ready(): boolean { return true }
  get readyPromise(): Promise<void> { return Promise.resolve() }

  getLevelMaximumGeometricError(level: number): number {
    return Cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      this._tilingScheme.ellipsoid,
      OUTPUT_TILE_SIZE,
      this._tilingScheme.getNumberOfXTilesAtLevel(0),
    ) / (1 << level)
  }

  getTileDataAvailable(_x: number, _y: number, _level: number): boolean | undefined {
    return undefined
  }

  loadTileDataAvailability(_x: number, _y: number, _level: number): undefined {
    return undefined
  }

  requestTileGeometry(
    x: number,
    y: number,
    level: number,
    _request?: Cesium.Request,
  ): Promise<Cesium.HeightmapTerrainData> | undefined {
    if (level < MIN_LEVEL || level > MAX_LEVEL) {
      return Promise.resolve(new Cesium.HeightmapTerrainData({
        buffer: new Uint8Array(OUTPUT_TILE_SIZE * OUTPUT_TILE_SIZE * 4),
        width: OUTPUT_TILE_SIZE,
        height: OUTPUT_TILE_SIZE,
        childTileMask: 15,
        structure: HEIGHT_STRUCTURE,
      }))
    }

    return fetch(getTiandituTileUrl(x, y, level, this._key))
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch terrain tile: ${response.status}`)
        return response.arrayBuffer()
      })
      .then((buffer) => {
        const rgba = parseTiandituTerrainData(new Uint8Array(buffer))
        return new Cesium.HeightmapTerrainData({
          buffer: rgba,
          width: OUTPUT_TILE_SIZE,
          height: OUTPUT_TILE_SIZE,
          childTileMask: getChildMask(level, x, y),
          structure: HEIGHT_STRUCTURE,
        })
      })
  }
}

export function createTiandituTerrainProvider(key: string): Cesium.TerrainProvider {
  return new TiandituTerrainProvider(key)
}
