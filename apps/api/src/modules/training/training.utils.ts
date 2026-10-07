export interface OccurrenceTimeSlot {
  trainerPartyId?: string | null;
  startTime: Date;
  endTime: Date;
}

export function hasScheduleConflict(
  existingOccurrences: OccurrenceTimeSlot[],
  trainerPartyId: string,
  newStart: Date,
  newEnd: Date
): boolean {
  for (const occ of existingOccurrences) {
    if (occ.trainerPartyId === trainerPartyId) {
      // Overlap condition: max(start1, start2) < min(end1, end2)
      const maxStart = new Date(Math.max(occ.startTime.getTime(), newStart.getTime()));
      const minEnd = new Date(Math.min(occ.endTime.getTime(), newEnd.getTime()));

      if (maxStart < minEnd) {
        return true; // Overlap detected
      }
    }
  }
  return false;
}

export function isEligibleForCertificate(presentCount: number, totalOccurrences: number): boolean {
  if (totalOccurrences <= 0) return false;
  const attendanceRate = (presentCount / totalOccurrences) * 100;
  return attendanceRate >= 80;
}
