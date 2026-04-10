import Phaser from 'phaser'
import type { RunSession } from '../state/session'

function toneForValue(value: number): string {
  if (value >= 75) return '#86efac'
  if (value >= 45) return '#fde68a'
  return '#fca5a5'
}

export class InstrumentPanel {
  private topLine: Phaser.GameObjects.Text
  private secondLine: Phaser.GameObjects.Text
  private thirdLine: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale
    scene.add.rectangle(width / 2, height - 86, width - 32, 156, 0x06101b, 0.98).setStrokeStyle(2, 0x355070, 0.8)
    scene.add.rectangle(210, height - 86, 340, 118, 0x0b1626, 0.98).setStrokeStyle(1, 0x5b7aa3, 0.7)
    scene.add.rectangle(width / 2, height - 86, 380, 118, 0x0b1626, 0.98).setStrokeStyle(1, 0x5b7aa3, 0.7)
    scene.add.rectangle(width - 210, height - 86, 340, 118, 0x0b1626, 0.98).setStrokeStyle(1, 0x5b7aa3, 0.7)

    this.topLine = scene.add.text(52, height - 135, '', {
      fontFamily: 'Courier New',
      fontSize: '28px',
      color: '#e0f2fe',
    })

    this.secondLine = scene.add.text(52, height - 96, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cbd5e1',
    })

    this.thirdLine = scene.add.text(52, height - 64, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#93c5fd',
      wordWrap: { width: width - 120 },
    })
  }

  update(session: RunSession): void {
    const snapshot = session.aircraft.getSnapshot()
    const weather = session.weather.getWeather()

    this.topLine.setText(
      `ALT ${snapshot.altitudeFt.toFixed(0).padStart(5, ' ')}   SPD ${snapshot.speedKts
        .toFixed(0)
        .padStart(3, ' ')} KTAS   HDG ${snapshot.heading.toFixed(0).padStart(3, '0')}°   FUEL ${snapshot.fuelGallons
        .toFixed(1)
        .padStart(4, ' ')} gal`,
    )

    this.secondLine.setText([
      `Endurance ${snapshot.enduranceHours.toFixed(1)} hr`,
      `Electrical ${snapshot.alternatorOnline ? 'ONLINE' : 'OFFLINE'}`,
      `Oil ${snapshot.oilPressurePct.toFixed(0)}%`,
      `Ammeter ${snapshot.ammeterPct.toFixed(0)}%`,
      `Risk ${weather.riskLevel.toUpperCase()}`,
    ].join('   •   '))

    this.secondLine.setColor(toneForValue(Math.min(snapshot.oilPressurePct, snapshot.ammeterPct)))
    this.thirdLine.setText(`Weather: ${weather.summary}`)
  }
}
