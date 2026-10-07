export function calculateGrantWinRate(
  grants: { status: string }[]
): { winRatePct: number; wonCount: number; rejectedCount: number; totalDecided: number } {
  const wonCount = grants.filter((g) => g.status === 'approved' || g.status === 'closed').length;
  const rejectedCount = grants.filter((g) => g.status === 'rejected').length;
  const totalDecided = wonCount + rejectedCount;

  if (totalDecided === 0) {
    return { winRatePct: 0, wonCount: 0, rejectedCount: 0, totalDecided: 0 };
  }

  const winRatePct = Math.round((wonCount / totalDecided) * 1000) / 10;
  return { winRatePct, wonCount, rejectedCount, totalDecided };
}

export function calculateInstallmentProgress(
  installments: { amount: string | number; status: string; receivedAmount?: string | number | null }[]
): { totalExpected: number; totalReceived: number; collectionRatePct: number } {
  let totalExpected = 0;
  let totalReceived = 0;

  for (const inst of installments) {
    const amt = Number(inst.amount) || 0;
    totalExpected += amt;
    if (inst.status === 'received') {
      const rec = inst.receivedAmount !== undefined && inst.receivedAmount !== null ? Number(inst.receivedAmount) : amt;
      totalReceived += rec;
    }
  }

  const collectionRatePct =
    totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 1000) / 10 : 0;

  return {
    totalExpected: Math.round(totalExpected * 100) / 100,
    totalReceived: Math.round(totalReceived * 100) / 100,
    collectionRatePct,
  };
}

export function evaluateDeliverableUrgency(
  dueDateStr: string,
  status: string,
  now: Date = new Date()
): 'overdue' | 'due_soon' | 'completed' | 'on_track' {
  if (status === 'submitted' || status === 'approved') {
    return 'completed';
  }

  const dueDate = new Date(dueDateStr);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  }
  if (diffDays <= 30) {
    return 'due_soon';
  }
  return 'on_track';
}
