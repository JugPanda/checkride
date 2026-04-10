import Phaser from '../lib/phaser'
import { getActiveSession } from '../state/session'
import { createButton } from '../ui/uiHelpers'

export class MissionBriefingScene extends Phaser.Scene {
  constructor() {
    super('MissionBriefingScene')
  }

  create(): void {
    const { width, height } = this.scale
    const session = getActiveSession()
    const mission = session.scenario
    this.cameras.main.setBackgroundColor('#07111f')

    this.add.text(44, 26, mission.title, {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#f8fafc',
      fontStyle: 'bold',
    })

    this.add.rectangle(width / 2, 238, width - 88, 320, 0x0b1626, 0.98).setStrokeStyle(2, 0x334155, 0.72)
    this.add.rectangle(width / 2, 238, 2, 304, 0x334155, 0.65)

    this.add.text(58, 92, [
      'Mission Overview',
      '',
      mission.summary,
      '',
      `Route: ${mission.route.departure} → ${mission.route.destination} (${mission.route.distanceNm} NM)`,
      `Recommended altitude: ${mission.route.recommendedAltitudeFt} ft`,
      `Departure METAR: ${mission.weather.departureMetar}`,
      `Destination METAR: ${mission.weather.destinationMetar}`,
      `Winds aloft: ${mission.weather.windsAloft}`,
      `Risk level: ${mission.weather.riskLevel.toUpperCase()}`,
    ].join('\n'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#dbeafe',
      lineSpacing: 8,
      wordWrap: { width: width / 2 - 110 },
    })

    this.add.text(width / 2 + 42, 92, [
      'Operational Notes',
      '',
      ...mission.notams.map((notam) => `• ${notam}`),
      '',
      'Expected Event Flow',
      `• ${mission.events.filter((event) => event.phase === 'preflight').length} preflight decisions`,
      `• ${mission.events.filter((event) => event.phase === 'flight').length} in-flight decisions`,
      '',
      `Projected takeoff weight: ${session.aircraft.getSnapshot().grossWeight.toFixed(0)} lb`,
      `Fuel endurance at current plan: ${session.aircraft.getSnapshot().enduranceHours.toFixed(1)} hr`,
    ].join('\n'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e2e8f0',
      lineSpacing: 8,
      wordWrap: { width: width / 2 - 110 },
    })

    this.add.rectangle(width / 2, 534, width - 88, 188, 0x08121f, 0.98).setStrokeStyle(2, 0x334155, 0.72)
    this.add.text(58, 448, 'Mission Focus', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })

    this.add.text(58, 486, mission.preflight.personalMinimums.map((minimum) => `• ${minimum}`).join('\n'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#dbeafe',
      lineSpacing: 10,
      wordWrap: { width: width / 2 - 110 },
    })

    this.add.text(width / 2 + 42, 448, 'Instructor Cue', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })

    this.add.text(width / 2 + 42, 486, 'Treat each mission like a DPE scenario. The goal is not perfection — it is to show that you recognize risk early, communicate clearly, and adapt before a small problem becomes a checkride bust.', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cbd5e1',
      wordWrap: { width: width / 2 - 110 },
      lineSpacing: 10,
    })

    createButton(this, 180, height - 58, 'Back to Menu', () => this.scene.start('MainMenuScene'))
    createButton(this, width / 2, height - 58, 'Begin Preflight', () => this.scene.start('PreflightScene'))
  }
}
