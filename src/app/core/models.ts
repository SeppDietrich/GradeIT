// ─── GradeIt – Core Models ───────────────────────────────────────────────────

export interface Criterion {
  id: string;
  name: string;
  weight: number; // 0–100, suma tuturor = 100
}

export interface ItemScore {
  criterionId: string;
  score: number; // 1–10
}

export interface GradeItem {
  id: string;
  name: string;
  scores: ItemScore[];
  overallScore: number; // calculat automat
  notes?: string;
}

export interface GradingList {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  description?: string;
  emoji?: string;
  criteria: Criterion[];
  items: GradeItem[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Utilitare ────────────────────────────────────────────────────────────────

export function calculateOverallScore(
  scores: ItemScore[],
  criteria: Criterion[]
): number {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const weighted = scores.reduce((sum, s) => {
    const criterion = criteria.find(c => c.id === s.criterionId);
    if (!criterion) return sum;
    return sum + (s.score * criterion.weight) / totalWeight;
  }, 0);

  return Math.round(weighted * 100) / 100;
}
