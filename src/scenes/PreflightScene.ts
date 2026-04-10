import Phaser from '../lib/phaser'
import { getActiveSession } from '../state/session'
import type { LoadingInput, ScenarioEvent } from '../types'
import { playUiTone } from '../ui/audio'
import { createButton } from '../ui/uiHelpers'

export class PreflightScene extends Phaser.Scene {
  private eventIndex = 0
  private promptText?: Phaser.GameObjects.Text
  private feedbackText?: Phaser.GameObjects.Text
  private summaryText?: Phaser.GameObjects.Text
  private verdictText?: Phaser.GameObjects.Text
  private optionObjects: Phaser.GameObjects.GameObject[] = []
  private controlObjects: Phaser.GameObjects.GameObject[] = []
  private loading: LoadingInput = {
    pilotWeight: 170,
    passengerWeight: 150,
    baggageWeight: 20,
    fuelGallons: 56,
  }

  constructor() {
    super('PreflightScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#08121f')
    const session = getActiveSession()
    this.loading = session.aircraft.getLoading()

    this.add.text(40, 24, 'Preflight Planning', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#f8fafc',
      fontStyle: 'bold',
    })

    this.add.text(40, 78, 'Adjust loading, verify reserves, review weather risk, then answer the ADM prompts.', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#93c5fd',
    })

    this.add.rectangle(235, 198, 410, 210, 0x0f172a, 0.96).setStrokeStyle(1, 0x475569, 0.8)
    this.add.rectangle(990, 214, 470, 242, 0x0f172a, 0.96).setStrokeStyle(1, 0x475569, 0.8)
    this.add.rectangle(this.scale.width / 2, 495, this.scale.width - 80, 260, 0x07111f, 0.98).setStrokeStyle(2, 0x334155, 0.75)
    this.add.rectangle(this.scale.width / 2, 700, this.scale.width - 80, 140, 0x07111f, 0.98).setStrokeStyle(2, 0x334155, 0.75)

    this.promptText = this.add.text(60, 390, '', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#e2e8f0',
      wordWrap: { width: 1160 },
      lineSpacing: 10,
    })

    this.feedbackText = this.add.text(60, 646, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#86efac',
      wordWrap: { width: 1160 },
      lineSpacing: 8,
    })

    this.verdictText = this.add.text(this.scale.width - 120, 28, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#86efac',
    }).setOrigin(1, 0)

    this.buildLoadingControls()
    this.renderMissionInfo()
    this.renderPrompt()
  }

  private buildLoadingControls(): void {
    const session = getActiveSession()
    const labels: Array<[keyof LoadingInput, string]> = [
      ['pilotWeight', 'Pilot (lb)'],
      ['passengerWeight', 'Passenger (lb)'],
      ['baggageWeight', 'Baggage (lb)'],
      ['fuelGallons', 'Fuel (gal)'],
    ]

    labels.forEach(([key, label], index) => {
      const y = 126 + index * 38
      this.add.text(60, y, label, { fontFamily: 'Arial', fontSize: '18px', color: '#dbeafe' })
      const valueText = this.add.text(250, y, String(this.loading[key]), { fontFamily: 'Courier New', fontSize: '20px', color: '#f8fafc' })
      this.createAdjustButton(342, y + 12, '-', () => {
        this.loading[key] = Math.max(0, this.loading[key] - (key === 'fuelGallons' ? 5 : 10))
        session.aircraft.setLoading(this.loading)
        valueText.setText(String(this.loading[key]))
        this.refreshSummary()
      })
      this.createAdjustButton(396, y + 12, '+', () => {
        this.loading[key] += key === 'fuelGallons' ? 5 : 10
        session.aircraft.setLoading(this.loading)
        valueText.setText(String(this.loading[key]))
        this.refreshSummary()
      })
    })

    this.refreshSummary()
  }

  private renderMissionInfo(): void {
    this.refreshSummary()
  }

  private refreshSummary(): void {
    const session = getActiveSession()
    const snapshot = session.aircraft.getSnapshot()
    if (!this.summaryText) {
      this.add.text(760, 108, 'Aircraft / Mission Snapshot', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#93c5fd',
        fontStyle: 'bold',
      })
      this.summaryText = this.add.text(760, 138, '', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#f8fafc',
        lineSpacing: 8,
        wordWrap: { width: 410 },
      })
    }

    const reserveStatus = session.aircraft.canCompleteLegWithReserve(session.scenario.route.distanceNm / snapshot.speedKts, 0.75)
    this.summaryText.setText([
      `Takeoff weight: ${snapshot.grossWeight.toFixed(0)} lb`,
      `Within gross: ${snapshot.withinGross ? 'YES' : 'NO'}`,
      `Fuel endurance: ${snapshot.enduranceHours.toFixed(1)} hr`,
      `Reserve after planned leg: ${reserveStatus ? 'HEALTHY' : 'MARGINAL'}`,
      `Cruise setup: ${snapshot.altitudeFt.toFixed(0)} ft / ${snapshot.speedKts.toFixed(0)} KTAS`,
      '',
      `Departure: ${session.scenario.route.departure}`,
      `Destination: ${session.scenario.route.destination}`,
      `Route distance: ${session.scenario.route.distanceNm} NM`,
      `Weather risk: ${session.weather.getWeather().riskLevel.toUpperCase()}`,
      `Winds aloft: ${session.scenario.weather.windsAloft}`,
    ].join('\n'))
  }

  private createAdjustButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 38, 30, 0x1c7ed6, 0.95).setStrokeStyle(1, 0xffffff, 0.16)
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#f8fbff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x1971c2, 1))
      .on('pointerout', () => bg.setFillStyle(0x1c7ed6, 0.95))
      .on('pointerdown', () => {
        playUiTone(this, 'click')
        onClick()
      })

    this.controlObjects.push(bg, text)
  }

  private renderPrompt(): void {
    const session = getActiveSession()
    const prompts = session.scenarioEngine.getPreflightPrompts()
    const event = prompts[this.eventIndex]

    this.optionObjects.forEach((obj) => obj.destroy())
    this.optionObjects = []

    if (!event) {
      const launch = createButton(this, this.scale.width / 2, this.scale.height - 60, 'Launch Flight', () => this.scene.start('FlightScene'))
      this.optionObjects.push(launch.bg, launch.text)
      this.promptText?.setText('Preflight complete. The aircraft is configured, the risks are identified, and your planning choices are locked in. Continue to the flight phase.')
      return
    }

    this.promptText?.setText(`${event.title}\n\n${event.prompt}\n\nACS: ${event.acsTag}`)
    event.options.forEach((option, index) => {
      const btn = createButton(this, this.scale.width / 2, 560 + index * 52, option.label, () => this.answerPrompt(event, option.id))
      this.optionObjects.push(btn.bg, btn.text)
    })
  }

  private answerPrompt(event: ScenarioEvent, optionId: string): void {
    const session = getActiveSession()
    const option = event.options.find((candidate) => candidate.id === optionId)
    if (!option) return

    session.aircraft.setLoading(this.loading)
    session.answerEvent(event, option)
    this.feedbackText?.setText(option.consequence.feedback)
    if (option.consequence.points >= 7) {
      this.feedbackText?.setColor('#86efac')
      this.verdictText?.setColor('#86efac').setText('GOOD CALL')
      playUiTone(this, 'success')
    } else if (option.consequence.points <= 2) {
      this.feedbackText?.setColor('#fca5a5')
      this.verdictText?.setColor('#fca5a5').setText('POOR ADM')
      playUiTone(this, 'failure')
    } else {
      this.feedbackText?.setColor('#fde68a')
      this.verdictText?.setColor('#fde68a').setText('MARGINAL')
      playUiTone(this, 'warning')
    }
    this.eventIndex += 1
    this.time.delayedCall(450, () => this.renderPrompt())
  }
}
