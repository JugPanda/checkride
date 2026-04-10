import type { WeatherSnapshot } from '../types'

export class WeatherSystem {
  private summary: string

  constructor(private readonly baseWeather: WeatherSnapshot) {
    this.summary = baseWeather.summary
  }

  setSummary(summary: string): void {
    this.summary = summary
  }

  getWeather() {
    return {
      ...this.baseWeather,
      summary: this.summary,
    }
  }
}
