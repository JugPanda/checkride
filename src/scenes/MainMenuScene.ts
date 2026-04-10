import Phaser from '../lib/phaser'
import { getCampaignSummary, resetProgressState } from '../state/progress'
import { getMissionCatalog, getMissionOrder, restoreMissionFromStorage, startMission } from '../state/session'
import { createButton } from '../ui/uiHelpers'

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene')
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor('#020617')

    this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 1)
    this.add.rectangle(width / 2, 94, width - 60, 132, 0x07111f, 0.98).setStrokeStyle(2, 0x3b82f6, 0.45)

    this.add.text(width / 2, 72, 'CHECKRIDE', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#f8fafc',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 118, 'ADM-focused PPL cross-country training with mission progression, briefing, execution, and debrief.', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#93c5fd',
      align: 'center',
      wordWrap: { width: 980 },
    }).setOrigin(0.5)

    const missionOrder = getMissionOrder()
    const campaign = getCampaignSummary(missionOrder)
    const resumeSession = restoreMissionFromStorage()

    this.add.text(60, 180, `Campaign progress: ${campaign.completedCount}/${campaign.totalCount} complete • ${campaign.unlockedCount} unlocked`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cbd5e1',
    })

    if (resumeSession) {
      createButton(this, width - 200, 184, `Resume ${resumeSession.scenario.title}`, () => {
        this.scene.start('MissionBriefingScene')
      })
    }

    const missions = getMissionCatalog()
    missions.forEach((mission, index) => {
      const progress = campaign.state.missions[mission.id]
      const y = 260 + index * 106
      const unlocked = progress?.unlocked ?? index === 0
      const cardHeight = 90

      this.add.rectangle(width / 2, y + 12, width - 120, cardHeight, unlocked ? 0x07111f : 0x0b1220, 0.98)
        .setStrokeStyle(1, unlocked ? 0x475569 : 0x1e293b, 0.7)

      if (unlocked) {
        createButton(this, 220, y, mission.title, () => {
          startMission(mission.id)
          this.scene.start('MissionBriefingScene')
        })
      } else {
        this.add.rectangle(220, y, 220, 40, 0x1e293b, 0.95).setStrokeStyle(1, 0x475569, 0.45)
        this.add.text(220, y, `${mission.title} • Locked`, {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#94a3b8',
          wordWrap: { width: 198 },
          align: 'center',
        }).setOrigin(0.5)
      }

      this.add.text(390, y - 16, mission.summary, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: unlocked ? '#cbd5e1' : '#64748b',
        wordWrap: { width: 760 },
      })

      this.add.text(390, y + 26, [
        `Route ${mission.route.departure} → ${mission.route.destination}`,
        `Best ${progress?.bestScore ?? 0}/100 ${progress?.bestGrade ? `(${progress.bestGrade})` : ''}`,
        `Attempts ${progress?.attempts ?? 0}`,
      ].join('   •   '), {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#93c5fd',
      })
    })

    createButton(this, width - 150, height - 40, 'Reset Progress', () => {
      resetProgressState(missionOrder)
      this.scene.restart()
    })
  }
}
