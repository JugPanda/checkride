import Phaser from '../lib/phaser'
import { getCampaignSummary, resetProgressState } from '../state/progress'
import { getMissionCatalog, getMissionOrder, restoreMissionFromStorage, startMission } from '../state/session'
import type { MissionScenario } from '../types'
import { createButton } from '../ui/uiHelpers'

type MissionRow = {
  mission: MissionScenario
  unlocked: boolean
  rowBg: Phaser.GameObjects.Rectangle
  titleBg: Phaser.GameObjects.Rectangle
  titleText: Phaser.GameObjects.Text
  summaryText: Phaser.GameObjects.Text
  metaText: Phaser.GameObjects.Text
}

export class MainMenuScene extends Phaser.Scene {
  private missionRows: MissionRow[] = []
  private selectedMissionIndex = 0
  private controllerCooldownUntil = 0

  constructor() {
    super('MainMenuScene')
  }

  create(): void {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor('#020617')
    this.missionRows = []
    this.selectedMissionIndex = 0

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
      const row = this.createMissionRow(mission, y, unlocked, progress?.bestScore ?? 0, progress?.bestGrade ?? undefined, progress?.attempts ?? 0)
      this.missionRows.push(row)
    })

    this.selectedMissionIndex = this.missionRows.findIndex((row) => row.unlocked)
    if (this.selectedMissionIndex < 0) {
      this.selectedMissionIndex = 0
    }
    this.updateMissionSelection()
    this.bindNavigation()

    this.add.text(60, height - 50, 'Navigation: ↑/↓ to select • Enter/Space to open • Gamepad D-pad/Left Stick + A to launch', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#94a3b8',
    })

    createButton(this, width - 150, height - 40, 'Reset Progress', () => {
      resetProgressState(missionOrder)
      this.scene.restart()
    })
  }

  private createMissionRow(
    mission: MissionScenario,
    y: number,
    unlocked: boolean,
    bestScore: number,
    bestGrade?: string,
    attempts = 0,
  ): MissionRow {
    const { width } = this.scale
    const rowBg = this.add.rectangle(width / 2, y + 12, width - 120, 90, unlocked ? 0x07111f : 0x0b1220, 0.98)
      .setStrokeStyle(1, unlocked ? 0x475569 : 0x1e293b, 0.7)

    const titleBg = this.add.rectangle(220, y, 220, 40, unlocked ? 0x1c7ed6 : 0x1e293b, 0.95)
      .setStrokeStyle(1, unlocked ? 0xffffff : 0x475569, unlocked ? 0.16 : 0.45)

    const titleText = this.add.text(220, y, unlocked ? mission.title : `${mission.title} • Locked`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: unlocked ? '#f8fbff' : '#94a3b8',
      wordWrap: { width: 198 },
      align: 'center',
    }).setOrigin(0.5)

    const summaryText = this.add.text(390, y - 16, mission.summary, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: unlocked ? '#cbd5e1' : '#64748b',
      wordWrap: { width: 760 },
    })

    const metaText = this.add.text(390, y + 26, [
      `Route ${mission.route.departure} → ${mission.route.destination}`,
      `Best ${bestScore}/100 ${bestGrade ? `(${bestGrade})` : ''}`,
      `Attempts ${attempts}`,
    ].join('   •   '), {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: unlocked ? '#93c5fd' : '#64748b',
    })

    if (unlocked) {
      rowBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.selectedMissionIndex = this.missionRows.findIndex((row) => row.mission.id === mission.id)
        this.updateMissionSelection()
        this.launchSelectedMission()
      })

      titleBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.selectedMissionIndex = this.missionRows.findIndex((row) => row.mission.id === mission.id)
        this.updateMissionSelection()
        this.launchSelectedMission()
      })
    }

    return { mission, unlocked, rowBg, titleBg, titleText, summaryText, metaText }
  }

  private bindNavigation(): void {
    this.input.keyboard?.removeAllListeners('keydown-UP')
    this.input.keyboard?.removeAllListeners('keydown-DOWN')
    this.input.keyboard?.removeAllListeners('keydown-W')
    this.input.keyboard?.removeAllListeners('keydown-S')
    this.input.keyboard?.removeAllListeners('keydown-ENTER')
    this.input.keyboard?.removeAllListeners('keydown-SPACE')

    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1))
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1))
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1))
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1))
    this.input.keyboard?.on('keydown-ENTER', () => this.launchSelectedMission())
    this.input.keyboard?.on('keydown-SPACE', () => this.launchSelectedMission())
  }

  update(time: number): void {
    if (time < this.controllerCooldownUntil || typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return
    }

    const pads = navigator.getGamepads()
    const pad = pads.find((candidate) => candidate?.connected)
    if (!pad) {
      return
    }

    const verticalAxis = pad.axes[1] ?? 0
    if (pad.buttons[12]?.pressed || verticalAxis < -0.5) {
      this.moveSelection(-1)
      this.controllerCooldownUntil = time + 180
      return
    }

    if (pad.buttons[13]?.pressed || verticalAxis > 0.5) {
      this.moveSelection(1)
      this.controllerCooldownUntil = time + 180
      return
    }

    if (pad.buttons[0]?.pressed) {
      this.launchSelectedMission()
      this.controllerCooldownUntil = time + 220
    }
  }

  private moveSelection(direction: -1 | 1): void {
    const unlockedIndices = this.missionRows
      .map((row, index) => (row.unlocked ? index : -1))
      .filter((index) => index >= 0)

    if (unlockedIndices.length === 0) {
      return
    }

    const currentUnlockedIndex = unlockedIndices.indexOf(this.selectedMissionIndex)
    const nextUnlockedIndex = Phaser.Math.Wrap(currentUnlockedIndex + direction, 0, unlockedIndices.length)
    this.selectedMissionIndex = unlockedIndices[nextUnlockedIndex]
    this.updateMissionSelection()
  }

  private updateMissionSelection(): void {
    this.missionRows.forEach((row, index) => {
      const isSelected = index === this.selectedMissionIndex
      const selectedStroke = isSelected ? 0x60a5fa : row.unlocked ? 0x475569 : 0x1e293b
      const selectedFill = row.unlocked
        ? (isSelected ? 0x0f1a2d : 0x07111f)
        : 0x0b1220
      row.rowBg.setFillStyle(selectedFill, 0.98)
      row.rowBg.setStrokeStyle(isSelected ? 2 : 1, selectedStroke, isSelected ? 0.95 : 0.7)
      row.titleBg.setFillStyle(row.unlocked ? (isSelected ? 0x228be6 : 0x1c7ed6) : 0x1e293b, 0.95)
      row.titleText.setColor(row.unlocked ? '#f8fbff' : '#94a3b8')
      row.summaryText.setColor(row.unlocked ? (isSelected ? '#e2e8f0' : '#cbd5e1') : '#64748b')
      row.metaText.setColor(row.unlocked ? '#93c5fd' : '#64748b')
    })
  }

  private launchSelectedMission(): void {
    const row = this.missionRows[this.selectedMissionIndex]
    if (!row || !row.unlocked) {
      return
    }

    startMission(row.mission.id)
    this.scene.start('MissionBriefingScene')
  }
}
