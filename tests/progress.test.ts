import { beforeEach, describe, expect, it } from 'vitest'

import { getCampaignSummary, markMissionStarted, recordMissionResult, resetProgressState } from '../src/state/progress'

const missionOrder = [
  'mission-01-standard',
  'mission-02-weather',
  'mission-03-emergency',
  'mission-04-night-pax',
  'mission-05-density-altitude',
]

describe('campaign progress persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with only the first mission unlocked', () => {
    const summary = getCampaignSummary(missionOrder)

    expect(summary.completedCount).toBe(0)
    expect(summary.unlockedCount).toBe(1)
    expect(summary.state.missions['mission-01-standard'].unlocked).toBe(true)
    expect(summary.state.missions['mission-02-weather'].unlocked).toBe(false)
  })

  it('records mission results and unlocks the next mission', () => {
    markMissionStarted(missionOrder, 'mission-01-standard')
    const updated = recordMissionResult(missionOrder, 'mission-01-standard', {
      totalScore: 88,
      letterGrade: 'B',
      categories: {
        preflight: { score: 22, maxScore: 25 },
        airspace: { score: 21, maxScore: 25 },
        adm: { score: 23, maxScore: 25 },
        emergencies: { score: 22, maxScore: 25 },
      },
      feedback: ['Solid risk management'],
    })

    expect(updated.missions['mission-01-standard'].completed).toBe(true)
    expect(updated.missions['mission-01-standard'].bestScore).toBe(88)
    expect(updated.missions['mission-02-weather'].unlocked).toBe(true)
  })

  it('can reset the campaign state', () => {
    markMissionStarted(missionOrder, 'mission-01-standard')
    recordMissionResult(missionOrder, 'mission-01-standard', {
      totalScore: 95,
      letterGrade: 'A',
      categories: {
        preflight: { score: 25, maxScore: 25 },
        airspace: { score: 25, maxScore: 25 },
        adm: { score: 25, maxScore: 25 },
        emergencies: { score: 20, maxScore: 25 },
      },
      feedback: [],
    })

    const reset = resetProgressState(missionOrder)
    expect(reset.missions['mission-01-standard'].completed).toBe(false)
    expect(reset.missions['mission-02-weather'].unlocked).toBe(false)
  })
})
