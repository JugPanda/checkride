import Phaser from 'phaser'
import { getActiveSession } from '../state/session'
import type { ScenarioOption } from '../types'
import { EventPopup } from '../ui/EventPopup'
import { InstrumentPanel } from '../ui/InstrumentPanel'
import { RadioPanel } from '../ui/RadioPanel'
import { SectionalMap } from '../ui/SectionalMap'
import { createButton } from '../ui/uiHelpers'

export class FlightScene extends Phaser.Scene {
  private panel!: InstrumentPanel
  private radio!: RadioPanel
  private map!: SectionalMap
  private popup: EventPopup | null = null
  private statusText?: Phaser.GameObjects.Text
  private checklistText?: Phaser.GameObjects.Text

  constructor() {
    super('FlightScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1220')
    const session = getActiveSession()
    const mission = session.scenario

    this.add.text(24, 18, `${mission.route.departure} → ${mission.route.destination}`, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#f8fafc',
      fontStyle: 'bold',
    })

    this.add.text(24, 50, mission.summary, {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#93c5fd',
      wordWrap: { width: 900 },
    })

    this.map = new SectionalMap(this, mission, { x: 24, y: 86, width: 900, height: 450 })
    this.panel = new InstrumentPanel(this)
    this.radio = new RadioPanel(this)

    this.add.rectangle(1095, 290, 320, 330, 0x071421, 0.96).setStrokeStyle(2, 0x334155, 0.8)
    this.statusText = this.add.text(950, 120, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cbd5e1',
      wordWrap: { width: 290 },
      lineSpacing: 8,
    })
    this.checklistText = this.add.text(950, 260, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#e2e8f0',
      wordWrap: { width: 290 },
      lineSpacing: 8,
    })

    createButton(this, 890, this.scale.height - 190, 'HDG -15', () => {
      session.aircraft.changeHeading(-15)
      session.persist()
      this.refreshUi()
    })
    createButton(this, 1140, this.scale.height - 190, 'HDG +15', () => {
      session.aircraft.changeHeading(15)
      session.persist()
      this.refreshUi()
    })
    createButton(this, 890, this.scale.height - 138, 'ALT -500', () => {
      session.aircraft.changeAltitude(-500)
      session.persist()
      this.refreshUi()
    })
    createButton(this, 1140, this.scale.height - 138, 'ALT +500', () => {
      session.aircraft.changeAltitude(500)
      session.persist()
      this.refreshUi()
    })
    createButton(this, 890, this.scale.height - 86, 'SPD -10', () => {
      session.aircraft.changeSpeed(-10)
      session.persist()
      this.refreshUi()
    })
    createButton(this, 1140, this.scale.height - 86, 'SPD +10', () => {
      session.aircraft.changeSpeed(10)
      session.persist()
      this.refreshUi()
    })

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.advanceSimulation(),
    })

    this.refreshUi()
  }

  private advanceSimulation(): void {
    const session = getActiveSession()
    if (this.popup) return

    session.advanceFlight(1)
    this.updatePlanePosition()

    const nextEvent = session.scenarioEngine.getNextFlightEvent(session.elapsedMinutes, session.activeWaypointIndex)
    if (nextEvent) {
      this.popup = new EventPopup(this, nextEvent, (option: ScenarioOption) => {
        session.answerEvent(nextEvent, option)
        this.popup?.destroy()
        this.popup = null
        this.refreshUi()
      })
      return
    }

    if (session.isComplete()) {
      this.scene.start('DebriefScene')
      return
    }

    this.refreshUi()
  }

  private updatePlanePosition(): void {
    const session = getActiveSession()
    const points = session.scenario.route.waypoints
    const progress = session.routeProgressNm / session.scenario.route.distanceNm
    const segments = points.length - 1
    const scaled = progress * segments
    const index = Math.min(segments - 1, Math.floor(scaled))
    const segmentProgress = Math.min(1, scaled - index)
    const start = points[index]
    const end = points[Math.min(points.length - 1, index + 1)]
    const x = Phaser.Math.Linear(start.x, end.x, segmentProgress)
    const y = Phaser.Math.Linear(start.y, end.y, segmentProgress)
    this.map.updatePlanePosition(x, y, session.aircraft.getSnapshot().heading)
  }

  private refreshUi(): void {
    const session = getActiveSession()
    this.panel.update(session)
    this.radio.update(session)

    const route = session.scenario.route
    const currentWaypoint = route.waypoints[session.activeWaypointIndex]
    this.statusText?.setText([
      `Elapsed: ${session.elapsedMinutes} min`,
      `Progress: ${session.routeProgressNm.toFixed(0)} / ${route.distanceNm} NM`,
      `Current waypoint: ${currentWaypoint.name}`,
      `Destination ceiling: ${session.weather.getWeather().ceilingFt} ft`,
      `Visibility: ${session.weather.getWeather().visibilitySm} SM`,
    ])

    this.checklistText?.setText([
      'In-flight scan',
      '• Fuel and reserve trend',
      '• Altitude vs terrain / airspace',
      '• Weather trend and outs',
      '• Radio / frequency awareness',
      '• Passenger and systems management',
      '',
      `Latest grading tone: ${session.scoring.getReport().letterGrade}`,
    ])
  }
}
