import type { ScoreCategory, ScoreReport } from '../types'

interface DecisionRecord {
  category: ScoreCategory
  points: number
  maxPoints: number
  feedback?: string
}

const DEFAULT_CATEGORIES: Record<ScoreCategory, { score: number; maxScore: number }> = {
  preflight: { score: 0, maxScore: 25 },
  airspace: { score: 0, maxScore: 25 },
  adm: { score: 0, maxScore: 25 },
  emergencies: { score: 0, maxScore: 25 },
}

export class ScoringEngine {
  private categories = structuredClone(DEFAULT_CATEGORIES)
  private feedback: string[] = []

  applyDecision(decision: DecisionRecord): void {
    const bucket = this.categories[decision.category]
    bucket.score = Math.min(bucket.maxScore, bucket.score + decision.points)
    if (decision.feedback) {
      this.feedback.push(decision.feedback)
    }
  }

  restoreReport(report: ScoreReport): void {
    this.categories = structuredClone(report.categories)
    this.feedback = [...report.feedback]
  }

  getReport(): ScoreReport {
    const totalScore = Object.values(this.categories).reduce((sum, category) => sum + category.score, 0)
    const letterGrade = totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : totalScore >= 60 ? 'D' : 'F'

    return {
      totalScore,
      letterGrade,
      categories: structuredClone(this.categories),
      feedback: [...this.feedback],
    }
  }
}
