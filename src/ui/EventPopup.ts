import Phaser from 'phaser'
import type { ScenarioEvent, ScenarioOption } from '../types'
import { createButton } from './uiHelpers'

export class EventPopup {
  private elements: Phaser.GameObjects.GameObject[] = []

  constructor(
    scene: Phaser.Scene,
    event: ScenarioEvent,
    onChoice: (option: ScenarioOption) => void,
  ) {
    const { width, height } = scene.scale
    const backdrop = scene.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.76)
    const panel = scene.add.rectangle(width / 2, height / 2, width * 0.72, height * 0.58, 0x0f172a, 0.98).setStrokeStyle(2, 0x60a5fa, 0.8)
    const title = scene.add.text(width / 2, height / 2 - 180, event.title, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold',
      wordWrap: { width: width * 0.6 },
      align: 'center',
    }).setOrigin(0.5)
    const prompt = scene.add.text(width / 2, height / 2 - 110, `${event.prompt}

ACS: ${event.acsTag}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#cbd5e1',
      wordWrap: { width: width * 0.58 },
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5, 0)

    this.elements.push(backdrop, panel, title, prompt)

    event.options.forEach((option, index) => {
      const button = createButton(scene, width / 2, height / 2 + 70 + index * 56, option.label, () => onChoice(option))
      this.elements.push(button.bg, button.text)
    })
  }

  destroy(): void {
    this.elements.forEach((element) => element.destroy())
  }
}
