import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { getTiandituTileUrl, parseTiandituTerrainData, createTiandituTerrainProvider, TiandituTerrainProvider } from './tiandituTerrain'
import * as Cesium from 'cesium'
import pako from 'pako'

function createMockTerrainData(): Uint8Array {
  const raw = new Int16Array(150 * 150)
  for (let i = 0; i < raw.length; i++) {
    raw[i] = i
  }
  const bytes = new Uint8Array(raw.length * 2)
  for (let i = 0; i < raw.length; i++) {
    bytes[i * 2] = raw[i] & 0xff
    bytes[i * 2 + 1] = (raw[i] >> 8) & 0xff
  }
  return pako.deflate(bytes)
}

describe('getTiandituTileUrl', () => {
  it('generates correct URL with all parameters', () => {
    const url = getTiandituTileUrl(1, 2, 3, 'mykey')
    expect(url).toContain('x=1')
    expect(url).toContain('y=2')
    expect(url).toContain('l=4')
    expect(url).toContain('tk=mykey')
    expect(url).toContain('T=elv_c')
    expect(url).toMatch(/https:\/\/t[0-7]\.tianditu\.gov\.cn\/mapservice\/swdx/)
  })
})

describe('parseTiandituTerrainData', () => {
  it('parses compressed data into Uint8Array of 16384 RGBA bytes', () => {
    const compressed = createMockTerrainData()
    const result = parseTiandituTerrainData(compressed)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(64 * 64 * 4)
  })

  it('encodes height 0 as RGBA correctly', () => {
    const compressed = createMockTerrainData()
    const result = parseTiandituTerrainData(compressed)
    // raw[0] = 0 → (0 - 15 + 1000) / 0.001 = 985000 → R = floor(985000/65536) = 15
    expect(result[0]).toBe(15)
  })
})

describe('createTiandituTerrainProvider', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(createMockTerrainData() as BodyInit, {
        status: 200,
        statusText: 'OK',
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a TiandituTerrainProvider with GeographicTilingScheme', () => {
    const provider = createTiandituTerrainProvider('test-key')
    expect(provider).toBeInstanceOf(TiandituTerrainProvider)
    expect(provider.tilingScheme).toBeInstanceOf(Cesium.GeographicTilingScheme)
  })
})
