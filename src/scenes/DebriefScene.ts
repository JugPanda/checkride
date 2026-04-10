import Phaser from '../lib/phaser'
import { getCampaignSummary, recordMissionResult } from '../state/progress'
import { clearActiveSession, getActiveSession, getMissionOrder } from '../state/session'
import { createButton } from '../ui/uiHelpers'

function gradeColor(letterGrade: string): string {
  if (letterGrade === 'A') return '#86efac'
  if (letterGrade === 'B') return '#93c5fd'
  if (letterGrade === 'C') return '#fde68a'
  return '#fca5a5'
}

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

    this.add.text(width / 2, 42, 'Debrief', {
      fontFamily: 'Arial',
      fontSize: '38px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.rectangle(width / 2, 110, width - 100, 96, 0x071421, 0.98).setStrokeStyle(2, 0x334155, 0.8)
    this.add.text(92, 84, session.scenario.title, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    })
    this.add.text(92, 118, `Campaign ${getCampaignSummary(getMissionOrder()).completedCount}/${campaign.missionOrder.length} complete`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#93c5fd',
    })
    this.add.text(width - 92, 92, `Score ${report.totalScore}/100`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(1, 0)
    this.add.text(width - 92, 126, `Grade ${report.letterGrade}`, {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: gradeColor(report.letterGrade),
      fontStyle: 'bold',
    }).setOrigin(1, 0)

    this.add.rectangle(262, 260, 404, 240, 0x071421, 0.98).setStrokeStyle(2, 0x334155, 0.8)
    this.add.text(84, 166, 'Score Breakdown', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })
    this.add.text(84, 206, [
      `Preflight Planning: ${report.categories.preflight.score}/25`,
      `Airspace & Regulations: ${report.categories.airspace.score}/25`,
      `Risk Management / ADM: ${report.categories.adm.score}/25`,
      `Emergency Procedures: ${report.categories.emergencies.score}/25`,
    ].join('\n\n'), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#e2e8f0',
      lineSpacing: 14,
    })

    this.add.rectangle(862, 378, 796, 476, 0x071421, 0.98).setStrokeStyle(2, 0x334155, 0.8)
    this.add.text(472, 166, 'Detailed Feedback', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })
    this.add.text(492, 206, report.feedback.map((entry) => `• ${entry}`).join('\n\n'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e2e8f0',
      wordWrap: { width: 700 },
      lineSpacing: 10,
    })

    this.add.rectangle(width / 2, 666, width - 100, 96, 0x08121f, 0.98).setStrokeStyle(2, 0x334155, 0.75)
    this.add.text(84, 628, 'Instructional Note', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })
    this.add.text(84, 660, 'Good ADM is about managing risk continuously, not just making a single good call before takeoff. Cross-check fuel, comply with airspace requirements, and keep verifying assumptions during the flight.', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cbd5e1',
      wordWrap: { width: width - 170 },
      lineSpacing: 10,
    })

    createButton(this, 250, height - 46, 'Fly Again', () => {
      clearActiveSession()
      this.scene.start('MainMenuScene')
    })

    createButton(this, width / 2, height - 46, 'Next Mission Select', () => {
      clearActiveSession()
      this.scene.start('MainMenuScene')
    })
  }
}
