import { describe, expect, it } from 'vitest'
import viteConfig from '../../vite.config'

describe('vite proxy config', () => {
  it('proxies both polygon and point obstacle api prefixes to local backend', () => {
    const proxy = viteConfig.server?.proxy

    expect(proxy?.['/polygon-obstacle']).toMatchObject({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    })

    expect(proxy?.['/point-obstacle']).toMatchObject({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    })
  })
})
