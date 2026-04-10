import type Phaser from 'phaser'
import type { RunSession } from '../state/session'

export class RadioPanel {
  private body: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(170, 110, 300, 150, 0x071421, 0.95).setStrokeStyle(2, 0x60a5fa, 0.7)
    scene.add.text(28, 46, 'ATC / RADIO STACK', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })
    this.body = scene.add.text(28, 76, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#e2e8f0',
      wordWrap: { width: 270 },
      lineSpacing: 6,
    })
  }

  update(session: RunSession): void {
    const history = session.comms.getHistory().slice(0, 4)
    this.body.setText([
      `Active freq ${session.comms.getFrequency()}`,
      '',
      ...history,
    ])
  }
}
