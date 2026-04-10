import aircraftData from '../data/aircraft/t182t.json'
import mission01 from '../data/scenarios/mission-01-standard.json'
import mission02 from '../data/scenarios/mission-02-weather.json'
import mission03 from '../data/scenarios/mission-03-emergency.json'
import mission04 from '../data/scenarios/mission-04-night-pax.json'
import mission05 from '../data/scenarios/mission-05-density-alt.json'
import { AircraftState } from '../systems/AircraftState'
import { CommSystem } from '../systems/CommSystem'
import { ScenarioEngine } from '../systems/ScenarioEngine'
import { ScoringEngine } from '../systems/ScoringEngine'
import { WeatherSystem } from '../systems/WeatherSystem'
import type { MissionScenario, ScenarioEvent, ScenarioOption, ScoreReport, SessionSnapshot } from '../types'
import { clearCurrentMission, markMissionStarted } from './progress'

const ACTIVE_SESSION_KEY = 'checkride-active-session-v1'
const missions = [mission01, mission02, mission03, mission04, mission05] as MissionScenario[]

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function saveActiveSessionSnapshot(snapshot: SessionSnapshot | null): void {
  if (!canUseStorage()) {
    return
  }

  if (!snapshot) {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY)
    return
  }

  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(snapshot))
}

export function getMissionCatalog(): MissionScenario[] {
  return missions
}

export function getMissionOrder(): string[] {
  return missions.map((mission) => mission.id)
}

export class RunSession {
  scenario: MissionScenario
  aircraft = new AircraftState(aircraftData)
  scoring = new ScoringEngine()
  scenarioEngine: ScenarioEngine
  weather: WeatherSystem
  comms = new CommSystem()
  selectedOptions: Record<string, string> = {}
  feedbackLog: string[] = []
  routeProgressNm = 0
  elapsedMinutes = 0
  activeWaypointIndex = 0

  constructor(scenario: MissionScenario) {
    this.scenario = scenario
    this.scenarioEngine = new ScenarioEngine(scenario)
    this.weather = new WeatherSystem(scenario.weather)
    this.aircraft.setLoading({
      pilotWeight: 170,
      passengerWeight: 150,
      baggageWeight: scenario.preflight.baggageLbs,
      fuelGallons: scenario.preflight.suggestedFuelGallons,
    })
    this.comms.seedForMission(scenario)
  }

  answerEvent(event: ScenarioEvent, option: ScenarioOption): void {
    this.selectedOptions[event.id] = option.id
    this.scoring.applyDecision({
      category: option.consequence.category,
      points: option.consequence.points,
      maxPoints: 25,
      feedback: `${event.title}: ${option.consequence.feedback}`,
    })
    this.aircraft.applyConsequence(option.consequence)
    if (option.consequence.weatherSummary) {
      this.weather.setSummary(option.consequence.weatherSummary)
    }
    if (option.consequence.commFrequency) {
      this.aircraft.setCommFrequency(option.consequence.commFrequency)
      this.comms.setFrequency(option.consequence.commFrequency)
    }
    if (option.consequence.commMessage) {
      this.comms.logPilotResponse(option.consequence.commMessage)
    } else {
      this.comms.logPilotResponse(option.consequence.feedback)
    }
    this.feedbackLog.push(`${event.acsTag} — ${option.consequence.feedback}`)
    this.scenarioEngine.markTriggered(event.id)
    this.persist()
  }

  advanceFlight(minutes: number): void {
    this.elapsedMinutes += minutes
    const nmPerMinute = this.aircraft.getSnapshot().speedKts / 60
    this.routeProgressNm = Math.min(this.scenario.route.distanceNm, this.routeProgressNm + (nmPerMinute * minutes))
    this.aircraft.consumeFuel(minutes / 60)

    const progressRatio = this.routeProgressNm / this.scenario.route.distanceNm
    const waypointCount = this.scenario.route.waypoints.length - 1
    this.activeWaypointIndex = Math.min(waypointCount, Math.floor(progressRatio * waypointCount))
    this.comms.updateForProgress(this.scenario, this.elapsedMinutes, this.activeWaypointIndex)
    this.persist()
  }

  isComplete(): boolean {
    return this.routeProgressNm >= this.scenario.route.distanceNm
  }

  getSnapshot(): SessionSnapshot {
    const aircraft = this.aircraft.getSnapshot()
    return {
      missionId: this.scenario.id,
      selectedOptions: { ...this.selectedOptions },
      feedbackLog: [...this.feedbackLog],
      routeProgressNm: this.routeProgressNm,
      elapsedMinutes: this.elapsedMinutes,
      activeWaypointIndex: this.activeWaypointIndex,
      loading: this.aircraft.getLoading(),
      aircraft: {
        fuelGallons: aircraft.fuelGallons,
        heading: aircraft.heading,
        altitudeFt: aircraft.altitudeFt,
        speedKts: aircraft.speedKts,
        commFrequency: aircraft.commFrequency,
        alternatorOnline: aircraft.alternatorOnline,
        oilPressurePct: aircraft.oilPressurePct,
        ammeterPct: aircraft.ammeterPct,
      },
      scoring: this.scoring.getReport(),
      weatherSummary: this.weather.getWeather().summary,
      commHistory: this.comms.getHistory(),
      commCurrentFrequency: this.comms.getFrequency(),
    }
  }

  restore(snapshot: SessionSnapshot): void {
    this.selectedOptions = { ...snapshot.selectedOptions }
    this.feedbackLog = [...snapshot.feedbackLog]
    this.routeProgressNm = snapshot.routeProgressNm
    this.elapsedMinutes = snapshot.elapsedMinutes
    this.activeWaypointIndex = snapshot.activeWaypointIndex
    this.aircraft.setLoading(snapshot.loading)
    this.aircraft.restoreSnapshot(snapshot.aircraft)
    this.scoring.restoreReport(snapshot.scoring)
    this.weather.setSummary(snapshot.weatherSummary)
    this.comms.restore(snapshot.commCurrentFrequency, snapshot.commHistory)
    Object.keys(snapshot.selectedOptions).forEach((eventId) => this.scenarioEngine.markTriggered(eventId))
  }

  persist(): void {
    saveActiveSessionSnapshot(this.getSnapshot())
  }
}

let activeSession: RunSession | null = null

function findMission(missionId: string): MissionScenario {
  return missions.find((mission) => mission.id === missionId) ?? missions[0]
}

export function startMission(missionId: string): RunSession {
  const scenario = findMission(missionId)
  activeSession = new RunSession(scenario)
  markMissionStarted(getMissionOrder(), scenario.id)
  activeSession.persist()
  return activeSession
}

export function restoreMissionFromStorage(): RunSession | null {
  if (!canUseStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) {
      return null
    }
    const snapshot = JSON.parse(raw) as SessionSnapshot
    const scenario = findMission(snapshot.missionId)
    const session = new RunSession(scenario)
    session.restore(snapshot)
    activeSession = session
    return session
  } catch {
    return null
  }
}

export function clearActiveSession(): void {
  activeSession = null
  clearCurrentMission(getMissionOrder())
  saveActiveSessionSnapshot(null)
}

export function getActiveSession(): RunSession {
  if (!activeSession) {
    activeSession = restoreMissionFromStorage() ?? new RunSession(missions[0])
  }
  return activeSession
}

export function getActiveSessionReport(): ScoreReport {
  return getActiveSession().scoring.getReport()
}
