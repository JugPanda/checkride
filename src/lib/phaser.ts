import type PhaserModule from 'phaser'

type PhaserNamespace = typeof import('phaser')

declare global {
  interface Window {
    Phaser?: PhaserNamespace
  }
}

const Phaser = window.Phaser

if (!Phaser) {
  throw new Error('Phaser runtime not loaded. Expected /vendor/phaser.min.js before app bootstrap.')
}

export default Phaser as PhaserNamespace
export type { PhaserModule }
