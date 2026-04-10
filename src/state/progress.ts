import type { MissionProgress, ProgressState, ScoreReport } from '../types'

const STORAGE_KEY = 'checkride-progress-v1'

function createMissionProgress(unlocked = false): MissionProgress {
  return {
    attempts: 0,
    completed: false,
    bestScore: 0,
    bestGrade: null,
    unlocked,
    lastPlayedAt: null,
  }
}

function createDefaultState(missionOrder: string[]): ProgressState {
  const missions = Object.fromEntries(
    missionOrder.map((missionId, index) => [missionId, createMissionProgress(index === 0)]),
  )

  return {
    version: 1,
    currentMissionId: null,
    missionOrder: [...missionOrder],
    missions,
  }
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadProgressState(missionOrder: string[]): ProgressState {
  const fallback = createDefaultState(missionOrder)
  if (!canUseStorage()) {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<ProgressState>
    const merged = createDefaultState(missionOrder)
    merged.currentMissionId = parsed.currentMissionId ?? null

    missionOrder.forEach((missionId, index) => {
      const existing = parsed.missions?.[missionId]
      if (!existing) {
        merged.missions[missionId] = createMissionProgress(index === 0)
        return
      }
      merged.missions[missionId] = {
        attempts: existing.attempts ?? 0,
        completed: existing.completed ?? false,
        bestScore: existing.bestScore ?? 0,
        bestGrade: existing.bestGrade ?? null,
        unlocked: existing.unlocked ?? index === 0,
        lastPlayedAt: existing.lastPlayedAt ?? null,
      }
    })

    return merged
  } catch {
    return fallback
  }
}

export function saveProgressState(state: ProgressState): void {
  if (!canUseStorage()) {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getMissionProgress(missionOrder: string[]): ProgressState {
  return loadProgressState(missionOrder)
}

export function markMissionStarted(missionOrder: string[], missionId: string): ProgressState {
  const state = loadProgressState(missionOrder)
  const mission = state.missions[missionId] ?? createMissionProgress(false)
  mission.attempts += 1
  mission.unlocked = true
  mission.lastPlayedAt = Date.now()
  state.missions[missionId] = mission
  state.currentMissionId = missionId
  saveProgressState(state)
  return state
}

export function recordMissionResult(missionOrder: string[], missionId: string, report: ScoreReport): ProgressState {
  const state = loadProgressState(missionOrder)
  const mission = state.missions[missionId] ?? createMissionProgress(false)
  mission.completed = true
  mission.unlocked = true
  mission.lastPlayedAt = Date.now()
  mission.bestScore = Math.max(mission.bestScore, report.totalScore)
  mission.bestGrade = mission.bestGrade && mission.bestScore > report.totalScore ? mission.bestGrade : report.letterGrade
  state.missions[missionId] = mission
  state.currentMissionId = null

  const missionIndex = missionOrder.indexOf(missionId)
  const nextMissionId = missionOrder[missionIndex + 1]
  if (nextMissionId) {
    state.missions[nextMissionId] = {
      ...(state.missions[nextMissionId] ?? createMissionProgress(false)),
      unlocked: true,
    }
  }

  saveProgressState(state)
  return state
}

export function clearCurrentMission(missionOrder: string[]): ProgressState {
  const state = loadProgressState(missionOrder)
  state.currentMissionId = null
  saveProgressState(state)
  return state
}

export function getCampaignSummary(missionOrder: string[]) {
  const state = loadProgressState(missionOrder)
  const completedCount = missionOrder.filter((missionId) => state.missions[missionId]?.completed).length
  const unlockedCount = missionOrder.filter((missionId) => state.missions[missionId]?.unlocked).length

  return {
    state,
    completedCount,
    unlockedCount,
    totalCount: missionOrder.length,
  }
}

export function resetProgressState(missionOrder: string[]): ProgressState {
  const state = createDefaultState(missionOrder)
  saveProgressState(state)
  return state
}
