export type ScoreCategory = 'preflight' | 'airspace' | 'adm' | 'emergencies'

export interface LoadingInput {
  pilotWeight: number
  passengerWeight: number
  baggageWeight: number
  fuelGallons: number
}

export interface AircraftData {
  id: string
  name: string
  emptyWeightLbs: number
  maxGrossWeightLbs: number
  usableFuelGallons: number
  fuelWeightPerGallonLbs: number
  cruiseFuelBurnGph: number
  cruiseSpeedKts: number
  bestGlideKias: number
  vxKias: number
  vyKias: number
  horsepower: number
  engine: string
}

export interface WeatherSnapshot {
  departureMetar: string
  destinationMetar: string
  windsAloft: string
  visibilitySm: number
  ceilingFt: number
  riskLevel: 'low' | 'moderate' | 'high'
  summary: string
}

export interface OptionConsequence {
  points: number
  category: ScoreCategory
  feedback: string
  aircraftChanges?: Partial<{
    fuelGallons: number
    alternatorOnline: boolean
    oilPressurePct: number
    ammeterPct: number
    heading: number
    altitudeFt: number
    speedKts: number
  }>
  weatherSummary?: string
  commMessage?: string
  commFrequency?: string
}

export interface ScenarioOption {
  id: string
  label: string
  consequence: OptionConsequence
}

export interface ScenarioEvent {
  id: string
  phase: 'preflight' | 'flight'
  trigger: {
    type: 'preflight' | 'elapsedMinutes' | 'waypointIndex'
    value: number
  }
  title: string
  prompt: string
  acsTag: string
  options: ScenarioOption[]
}

export interface Waypoint {
  id: string
  name: string
  x: number
  y: number
  airport?: boolean
}

export interface MissionScenario {
  id: string
  title: string
  summary: string
  route: {
    departure: string
    destination: string
    distanceNm: number
    recommendedAltitudeFt: number
    waypoints: Waypoint[]
  }
  weather: WeatherSnapshot
  notams: string[]
  preflight: {
    personalMinimums: string[]
    suggestedFuelGallons: number
    suggestedPassengers: number
    baggageLbs: number
  }
  events: ScenarioEvent[]
}

export interface CategoryScore {
  score: number
  maxScore: number
}

export interface ScoreReport {
  totalScore: number
  letterGrade: string
  categories: Record<ScoreCategory, CategoryScore>
  feedback: string[]
}

export interface MissionProgress {
  attempts: number
  completed: boolean
  bestScore: number
  bestGrade: string | null
  unlocked: boolean
  lastPlayedAt: number | null
}

export interface ProgressState {
  version: 1
  currentMissionId: string | null
  missionOrder: string[]
  missions: Record<string, MissionProgress>
}

export interface SessionSnapshot {
  missionId: string
  selectedOptions: Record<string, string>
  feedbackLog: string[]
  routeProgressNm: number
  elapsedMinutes: number
  activeWaypointIndex: number
  loading: LoadingInput
  aircraft: {
    fuelGallons: number
    heading: number
    altitudeFt: number
    speedKts: number
    commFrequency: string
    alternatorOnline: boolean
    oilPressurePct: number
    ammeterPct: number
  }
  scoring: ScoreReport
  weatherSummary: string
  commHistory: string[]
  commCurrentFrequency: string
}
