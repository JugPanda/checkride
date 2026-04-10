import { describe, expect, it } from 'vitest'
import aircraftData from '../src/data/aircraft/t182t.json'
import scenarioData from '../src/data/scenarios/mission-01-standard.json'
import weatherMission from '../src/data/scenarios/mission-02-weather.json'
import { AircraftState } from '../src/systems/AircraftState'
import { ScenarioEngine } from '../src/systems/ScenarioEngine'
import { ScoringEngine } from '../src/systems/ScoringEngine'
import type { MissionScenario } from '../src/types'

describe('AircraftState', () => {
  it('computes fuel endurance and reserve status for the T182T', () => {
    const state = new AircraftState(aircraftData)

    state.setFuelGallons(56)
    state.setCruiseBurnGph(14)

    expect(state.getEnduranceHours()).toBeCloseTo(4, 5)
    expect(state.canCompleteLegWithReserve(2.8, 0.75)).toBe(true)
    expect(state.canCompleteLegWithReserve(3.5, 0.75)).toBe(false)
  })

  it('computes payload and overweight detection', () => {
    const state = new AircraftState(aircraftData)

    state.setLoading({
      pilotWeight: 170,
      passengerWeight: 150,
      baggageWeight: 20,
      fuelGallons: 60,
    })

    expect(state.getTakeoffWeight()).toBe(2670)
    expect(state.isWithinGrossWeight()).toBe(true)

    state.setLoading({
      pilotWeight: 220,
      passengerWeight: 220,
      baggageWeight: 320,
      fuelGallons: 87,
    })

    expect(state.isWithinGrossWeight()).toBe(false)
  })
})

describe('ScenarioEngine', () => {
  it('returns ordered briefing and flight events for mission 01', () => {
    const engine = new ScenarioEngine(scenarioData as MissionScenario)

    expect(engine.getMission().id).toBe('mission-01-standard')
    expect(engine.getPreflightPrompts().length).toBeGreaterThanOrEqual(3)
    expect(engine.getFlightEvents().map((event) => event.id)).toEqual([
      'departure-frequency',
      'class-c-transition',
      'fuel-check',
    ])
  })

  it('ships the phase-two weather mission with a complete event set', () => {
    const engine = new ScenarioEngine(weatherMission as MissionScenario)

    expect(engine.getPreflightPrompts()).toHaveLength(3)
    expect(engine.getFlightEvents()).toHaveLength(3)
    expect(engine.getMission().weather.riskLevel).toBe('moderate')
  })
})

describe('ScoringEngine', () => {
  it('tracks category totals and computes a letter grade', () => {
    const scoring = new ScoringEngine()

    scoring.applyDecision({ category: 'preflight', points: 18, maxPoints: 25 })
    scoring.applyDecision({ category: 'airspace', points: 22, maxPoints: 25 })
    scoring.applyDecision({ category: 'adm', points: 24, maxPoints: 25 })
    scoring.applyDecision({ category: 'emergencies', points: 20, maxPoints: 25 })

    const report = scoring.getReport()

    expect(report.totalScore).toBe(84)
    expect(report.letterGrade).toBe('B')
    expect(report.categories.preflight.score).toBe(18)
    expect(report.categories.airspace.score).toBe(22)
  })
})
