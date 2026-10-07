export function isNoteEditable(createdAt: Date, now: Date = new Date(), maxEditDays: number = 7): boolean {
  const diffTime = now.getTime() - createdAt.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= maxEditDays;
}

export interface CaseAccessCheckParams {
  confidentialityLevel: 'standard' | 'restricted' | 'highly_confidential';
  primaryWorkerUserId: string;
  assignedUserIds: string[];
  userId: string;
  userRole?: string;
  hasActiveBreakGlass?: boolean;
}

export function canUserAccessCase(params: CaseAccessCheckParams): boolean {
  const { confidentialityLevel, primaryWorkerUserId, assignedUserIds, userId, hasActiveBreakGlass } = params;

  // Standard case: readable by assigned team or anyone with standard access
  if (confidentialityLevel === 'standard') {
    return true;
  }

  // Primary worker or team member always has access
  if (primaryWorkerUserId === userId || assignedUserIds.includes(userId)) {
    return true;
  }

  // Active break glass grant gives temporary emergency access
  if (hasActiveBreakGlass) {
    return true;
  }

  return false;
}
