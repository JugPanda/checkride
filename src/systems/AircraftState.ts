import type { AircraftData, LoadingInput, OptionConsequence, SessionSnapshot } from '../types'

const DEFAULT_LOADING: LoadingInput = {
  pilotWeight: 170,
  passengerWeight: 150,
  baggageWeight: 20,
  fuelGallons: 56,
}

type RestorableAircraftSnapshot = SessionSnapshot['aircraft']

export class AircraftState {
  private loading: LoadingInput = { ...DEFAULT_LOADING }
  private cruiseBurnGph: number
  private fuelGallons: number
  private heading = 245
  private altitudeFt = 5500
  private speedKts: number
  private commFrequency = '121.00'
  private alternatorOnline = true
  private oilPressurePct = 100
  private ammeterPct = 100

  constructor(private readonly aircraft: AircraftData) {
    this.cruiseBurnGph = aircraft.cruiseFuelBurnGph
    this.speedKts = aircraft.cruiseSpeedKts
    this.fuelGallons = DEFAULT_LOADING.fuelGallons
  }

  setFuelGallons(gallons: number): void {
    this.fuelGallons = gallons
    this.loading.fuelGallons = gallons
  }

  setCruiseBurnGph(gph: number): void {
    this.cruiseBurnGph = gph
  }

  setLoading(input: LoadingInput): void {
    this.loading = { ...input }
    this.fuelGallons = input.fuelGallons
  }

  getLoading(): LoadingInput {
    return { ...this.loading }
  }

  getEnduranceHours(): number {
    return this.fuelGallons / this.cruiseBurnGph
  }

  canCompleteLegWithReserve(legHours: number, reserveHours: number): boolean {
    return this.getEnduranceHours() >= legHours + reserveHours
  }

  getTakeoffWeight(): number {
    return this.aircraft.emptyWeightLbs
      + this.loading.pilotWeight
      + this.loading.passengerWeight
      + this.loading.baggageWeight
      + (this.loading.fuelGallons * this.aircraft.fuelWeightPerGallonLbs)
  }

  isWithinGrossWeight(): boolean {
    return this.getTakeoffWeight() <= this.aircraft.maxGrossWeightLbs
  }

  consumeFuel(hours: number): void {
    const burned = hours * this.cruiseBurnGph
    this.setFuelGallons(Math.max(0, this.fuelGallons - burned))
  }

  changeHeading(delta: number): void {
    this.heading = (this.heading + delta + 360) % 360
  }

  setHeading(heading: number): void {
    this.heading = (heading + 360) % 360
  }

  changeAltitude(delta: number): void {
    this.altitudeFt = Math.max(1000, this.altitudeFt + delta)
  }

  setAltitude(altitudeFt: number): void {
    this.altitudeFt = Math.max(1000, altitudeFt)
  }

  changeSpeed(delta: number): void {
    this.speedKts = Math.max(80, Math.min(160, this.speedKts + delta))
  }

  setSpeed(speedKts: number): void {
    this.speedKts = Math.max(80, Math.min(160, speedKts))
  }

  setCommFrequency(frequency: string): void {
    this.commFrequency = frequency
  }

  applyConsequence(consequence: OptionConsequence): void {
    if (consequence.aircraftChanges?.fuelGallons !== undefined) {
      this.setFuelGallons(consequence.aircraftChanges.fuelGallons)
    }
    if (consequence.aircraftChanges?.alternatorOnline !== undefined) {
      this.alternatorOnline = consequence.aircraftChanges.alternatorOnline
    }
    if (consequence.aircraftChanges?.oilPressurePct !== undefined) {
      this.oilPressurePct = consequence.aircraftChanges.oilPressurePct
    }
    if (consequence.aircraftChanges?.ammeterPct !== undefined) {
      this.ammeterPct = consequence.aircraftChanges.ammeterPct
    }
    if (consequence.aircraftChanges?.heading !== undefined) {
      this.setHeading(consequence.aircraftChanges.heading)
    }
    if (consequence.aircraftChanges?.altitudeFt !== undefined) {
      this.setAltitude(consequence.aircraftChanges.altitudeFt)
    }
    if (consequence.aircraftChanges?.speedKts !== undefined) {
      this.setSpeed(consequence.aircraftChanges.speedKts)
    }
    if (consequence.commFrequency) {
      this.setCommFrequency(consequence.commFrequency)
    }
  }

  restoreSnapshot(snapshot: RestorableAircraftSnapshot): void {
    this.setFuelGallons(snapshot.fuelGallons)
    this.setHeading(snapshot.heading)
    this.setAltitude(snapshot.altitudeFt)
    this.setSpeed(snapshot.speedKts)
    this.setCommFrequency(snapshot.commFrequency)
    this.alternatorOnline = snapshot.alternatorOnline
    this.oilPressurePct = snapshot.oilPressurePct
    this.ammeterPct = snapshot.ammeterPct
  }

  getSnapshot() {
    return {
      fuelGallons: this.fuelGallons,
      enduranceHours: this.getEnduranceHours(),
      heading: this.heading,
      altitudeFt: this.altitudeFt,
      speedKts: this.speedKts,
      commFrequency: this.commFrequency,
      alternatorOnline: this.alternatorOnline,
      oilPressurePct: this.oilPressurePct,
      ammeterPct: this.ammeterPct,
      grossWeight: this.getTakeoffWeight(),
      withinGross: this.isWithinGrossWeight(),
    }
  }
}
