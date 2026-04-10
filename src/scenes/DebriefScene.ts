import Phaser from 'phaser'
import { getCampaignSummary, recordMissionResult } from '../state/progress'
import { clearActiveSession, getActiveSession, getMissionOrder } from '../state/session'
import { createButton } from '../ui/uiHelpers'

export class DebriefScene extends Phaser.Scene {
  constructor() {
    super('DebriefScene')
  }

  create(): void {
    const { width, height } = this.scale
    const session = getActiveSession()
    const report = session.scoring.getReport()
    const campaign = recordMissionResult(getMissionOrder(), session.scenario.id, report)
    this.cameras.main.setBackgroundColor('#06111d')

    this.add.text(width / 2, 50, 'Debrief', {
      fontFamily: 'Arial',
      fontSize: '38px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 108, `Score ${report.totalScore}/100   Grade ${report.letterGrade}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#93c5fd',
    }).setOrigin(0.5)

    this.add.text(width / 2, 144, `Campaign ${getCampaignSummary(getMissionOrder()).completedCount}/${campaign.missionOrder.length} complete`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cbd5e1',
    }).setOrigin(0.5)

    const body = [
      `Mission: ${session.scenario.title}`,
      `Preflight Planning: ${report.categories.preflight.score}/25`,
      `Airspace & Regulations: ${report.categories.airspace.score}/25`,
      `Risk Management / ADM: ${report.categories.adm.score}/25`,
      `Emergency Procedures: ${report.categories.emergencies.score}/25`,
      '',
      'Detailed feedback:',
      ...report.feedback.map((entry) => `• ${entry}`),
      '',
      'Instructional note:',
      'Good ADM is about managing risk continuously, not just making a single good call before takeoff. Cross-check fuel, comply with airspace requirements, and keep verifying assumptions during the flight.',
    ]

    this.add.text(60, 180, body.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#e2e8f0',
      wordWrap: { width: width - 120 },
      lineSpacing: 10,
    })

    createButton(this, 250, height - 50, 'Fly Again', () => {
      clearActiveSession()
      this.scene.start('MainMenuScene')
    })

    createButton(this, width / 2, height - 50, 'Next Mission Select', () => {
      clearActiveSession()
      this.scene.start('MainMenuScene')
    })
  }
}
