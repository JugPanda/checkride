import type { MissionScenario, ScenarioEvent } from '../types'

export class ScenarioEngine {
  private triggeredEvents = new Set<string>()

  constructor(private readonly mission: MissionScenario) {}

  getMission(): MissionScenario {
    return this.mission
  }

  getPreflightPrompts(): ScenarioEvent[] {
    return this.mission.events.filter((event) => event.phase === 'preflight')
  }

  getFlightEvents(): ScenarioEvent[] {
    const order = {
      elapsedMinutes: 0,
      waypointIndex: 1,
      preflight: 2,
    } as const

    return this.mission.events
      .filter((event) => event.phase === 'flight')
      .sort((a, b) => {
        if (a.trigger.type === b.trigger.type) {
          return a.trigger.value - b.trigger.value
        }
        return order[a.trigger.type] - order[b.trigger.type]
      })
  }

  getNextFlightEvent(elapsedMinutes: number, waypointIndex: number): ScenarioEvent | null {
    return this.getFlightEvents().find((event) => {
      if (this.triggeredEvents.has(event.id)) {
        return false
      }
      if (event.trigger.type === 'elapsedMinutes') {
        return elapsedMinutes >= event.trigger.value
      }
      if (event.trigger.type === 'waypointIndex') {
        return waypointIndex >= event.trigger.value
      }
      return false
    }) ?? null
  }

  markTriggered(id: string): void {
    this.triggeredEvents.add(id)
  }
}
