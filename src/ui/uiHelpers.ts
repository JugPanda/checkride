import Phaser from 'phaser'

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  disabled = false,
) {
  const width = Phaser.Math.Clamp(Math.max(220, label.length * 9), 220, 560)
  const bg = scene.add.rectangle(x, y, width, 40, disabled ? 0x344255 : 0x1c7ed6, 0.95).setStrokeStyle(2, 0xffffff, 0.16)
  const text = scene.add.text(x, y, label, {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: disabled ? '#8aa0b8' : '#f8fbff',
    wordWrap: { width: width - 18 },
    align: 'center',
  }).setOrigin(0.5)

  if (!disabled) {
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x1971c2, 1))
      .on('pointerout', () => bg.setFillStyle(0x1c7ed6, 0.95))
      .on('pointerdown', onClick)
  }

  return { bg, text }
}
