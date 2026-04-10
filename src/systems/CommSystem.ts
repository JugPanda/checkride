import type { MissionScenario } from '../types'

export class CommSystem {
  private currentFrequency = '121.00'
  private history: string[] = []
  private milestoneIndexes = new Set<number>()

  seedForMission(mission: MissionScenario): void {
    this.currentFrequency = mission.route.departure === 'KLEX' ? '121.00' : '122.80'
    this.history = [
      `GROUND ${this.currentFrequency}: ${mission.route.departure} clearance available, advise ready to taxi.`,
      `ATIS: ${mission.weather.departureMetar}`,
    ]
    this.milestoneIndexes.clear()
  }

  setFrequency(frequency: string): void {
    this.currentFrequency = frequency
  }

  getFrequency(): string {
    return this.currentFrequency
  }

  logPilotResponse(message: string): void {
    this.history.unshift(`YOU ${this.currentFrequency}: ${message}`)
    this.history = this.history.slice(0, 8)
  }

  pushAtcMessage(message: string, frequency = this.currentFrequency): void {
    this.currentFrequency = frequency
    this.history.unshift(`ATC ${frequency}: ${message}`)
    this.history = this.history.slice(0, 8)
  }

  updateForProgress(mission: MissionScenario, elapsedMinutes: number, waypointIndex: number): void {
    if (elapsedMinutes >= 1 && !this.milestoneIndexes.has(1001)) {
      this.pushAtcMessage(`Checkride scenario active. Proceed on course to ${mission.route.destination}, maintain VFR.`, '120.15')
      this.milestoneIndexes.add(1001)
    }

    if (waypointIndex >= 1 && !this.milestoneIndexes.has(1)) {
      this.pushAtcMessage(`Traffic advisory near ${mission.route.waypoints[1].name}; remain outside clouds and continue as requested.`, '120.15')
      this.milestoneIndexes.add(1)
    }

    if (waypointIndex >= 2 && !this.milestoneIndexes.has(2)) {
      this.pushAtcMessage(`Approach reminder: verify altitude selection and plan for ${mission.route.destination} arrival briefing.`, '119.90')
      this.milestoneIndexes.add(2)
    }

    if (waypointIndex >= 3 && !this.milestoneIndexes.has(3)) {
      this.pushAtcMessage(`Field in sight report expected shortly. Continue to monitor fuel, weather, and landing configuration.`, '118.30')
      this.milestoneIndexes.add(3)
    }
  }

  restore(frequency: string, history: string[]): void {
    this.currentFrequency = frequency
    this.history = [...history]
  }

  getLastCall(): string {
    return this.history[0] ?? 'Clear of runway, monitor ground.'
  }

  getHistory(): string[] {
    return [...this.history]
  }
}
