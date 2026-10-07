export type IndicatorHealth = 'exceeded' | 'on_track' | 'warning' | 'off_track';

export function calculateIndicatorProgress(actualValue: number, targetValue: number): number {
  if (targetValue <= 0) return 0;
  const progress = (actualValue / targetValue) * 100;
  return Math.min(Math.round(progress * 10) / 10, 1000); // round to 1 decimal place
}

export function calculateIndicatorVariance(
  actualValue: number,
  targetValue: number
): { varianceValue: number; variancePct: number } {
  const varianceValue = Math.round((actualValue - targetValue) * 100) / 100;
  if (targetValue <= 0) return { varianceValue, variancePct: 0 };
  const variancePct = Math.round(((actualValue - targetValue) / targetValue) * 1000) / 10;
  return { varianceValue, variancePct };
}

export function calculateIndicatorHealth(actualValue: number, targetValue: number): IndicatorHealth {
  if (targetValue <= 0) return 'off_track';
  const ratio = actualValue / targetValue;
  if (ratio > 1.1) return 'exceeded';
  if (ratio >= 0.9) return 'on_track';
  if (ratio >= 0.7) return 'warning';
  return 'off_track';
}

export function countUniqueParties(...sources: (string | null | undefined)[][]): number {
  const uniqueSet = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    for (const id of source) {
      if (id) {
        uniqueSet.add(id);
      }
    }
  }
  return uniqueSet.size;
}

export function aggregateDisaggregations(
  observations: { disaggregationData?: Record<string, Record<string, number>> | null }[]
): Record<string, Record<string, number>> {
  const aggregated: Record<string, Record<string, number>> = {
    gender: {},
    ageGroup: {},
    immigrationStatus: {},
    region: {},
  };

  for (const obs of observations) {
    if (!obs.disaggregationData) continue;
    for (const [dimKey, dimValues] of Object.entries(obs.disaggregationData)) {
      if (!dimValues || typeof dimValues !== 'object') continue;
      if (!aggregated[dimKey]) {
        aggregated[dimKey] = {};
      }
      for (const [subKey, count] of Object.entries(dimValues)) {
        const num = typeof count === 'number' ? count : Number(count) || 0;
        aggregated[dimKey][subKey] = (aggregated[dimKey][subKey] || 0) + num;
      }
    }
  }

  return aggregated;
}

export function generateDonorLogframeCsv(
  projectName: string,
  logframeRows: {
    level: string;
    objectiveTitle: string;
    indicatorCode: string;
    indicatorName: string;
    baseline: number | string;
    target: number | string;
    actual: number | string;
    variancePct: number | string;
    health: string;
    meansOfVerification: string;
    unit: string;
  }[]
): string {
  const headers = [
    'Niveau',
    'Objectif / Résultat',
    'Code Indicateur',
    'Intitulé Indicateur',
    'Unité',
    'Valeur de base (Baseline)',
    'Cible (Target)',
    'Réalisé (Actual)',
    'Écart (%)',
    'Statut Santé',
    'Moyens de Vérification',
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [
    `"RAPPORT DU CADRE LOGIQUE / RÉSULTATS (LOGFRAME) - ${escapeCsv(projectName)}"`,
    headers.map(escapeCsv).join(','),
  ];

  for (const row of logframeRows) {
    lines.push(
      [
        row.level,
        row.objectiveTitle,
        row.indicatorCode,
        row.indicatorName,
        row.unit,
        row.baseline,
        row.target,
        row.actual,
        `${row.variancePct}%`,
        row.health,
        row.meansOfVerification,
      ]
        .map(escapeCsv)
        .join(',')
    );
  }

  return lines.join('\n');
}
