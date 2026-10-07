export function calculateIndicatorProgress(actualValue: number, targetValue: number): number {
  if (targetValue <= 0) return 0;
  const progress = (actualValue / targetValue) * 100;
  return Math.min(Math.round(progress * 10) / 10, 1000); // round to 1 decimal place
}

export function countUniqueParties(...sources: (string | null | undefined)[][]): number {
  const uniqueSet = new Set<string>();
  for (const source of sources) {
    for (const id of source) {
      if (id) {
        uniqueSet.add(id);
      }
    }
  }
  return uniqueSet.size;
}
