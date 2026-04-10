import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('runtime bootstrap', () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const indexPath = resolve(repoRoot, 'index.html')
  const vendorPath = resolve(repoRoot, 'public/vendor/phaser.min.js')

  afterEach(() => {
    vi.resetModules()
    Reflect.deleteProperty(window, 'Phaser')
  })

  it('loads the vendored Phaser runtime before the app module', () => {
    const html = readFileSync(indexPath, 'utf8')

    const vendorIndex = html.indexOf('<script src="/vendor/phaser.min.js"></script>')
    const appIndex = html.indexOf('<script type="module" src="/src/main.ts"></script>')

    expect(vendorIndex).toBeGreaterThanOrEqual(0)
    expect(appIndex).toBeGreaterThan(vendorIndex)
  })

  it('ships a non-empty vendored Phaser runtime asset', () => {
    expect(existsSync(vendorPath)).toBe(true)
    expect(statSync(vendorPath).size).toBeGreaterThan(100_000)
  })

  it('fails fast when Phaser is not present on window', async () => {
    Reflect.deleteProperty(window, 'Phaser')

    await expect(import('../src/lib/phaser')).rejects.toThrow(
      'Phaser runtime not loaded. Expected /vendor/phaser.min.js before app bootstrap.',
    )
  })

  it('returns the window Phaser runtime when available', async () => {
    const phaserStub = { AUTO: 42, Game: class Game {} }
    window.Phaser = phaserStub as typeof window.Phaser

    const module = await import('../src/lib/phaser')

    expect(module.default).toBe(phaserStub)
  })
})
