/**
 * Utility functions for HR Timesheets, Weekly Cycles, and Analytic Cost Allocations
 */

function parseDateOnly(inputDate: string | Date = new Date()): Date {
  if (typeof inputDate === 'string') {
    const parts = inputDate.substring(0, 10).split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    }
  }
  const d = new Date(inputDate);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

function formatDateOnly(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the YYYY-MM-DD string for Monday of the given date's week.
 */
export function getMondayOfWeek(inputDate: string | Date = new Date()): string {
  const d = parseDateOnly(inputDate);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setUTCDate(diff);
  return formatDateOnly(d);
}

/**
 * Returns the YYYY-MM-DD string for Sunday of the week starting from Monday.
 */
export function getSundayOfWeek(mondayDateStr: string): string {
  const d = parseDateOnly(mondayDateStr);
  d.setUTCDate(d.getUTCDate() + 6);
  return formatDateOnly(d);
}

/**
 * Computes total hours and total valorized cost for a timesheet's entries.
 */
export function calculateTimesheetTotals(
  entries: Array<{
    hours: number | string;
    hourlyRate?: number | string | null;
  }>
): { totalHours: number; totalCost: number } {
  let totalHours = 0;
  let totalCost = 0;

  for (const entry of entries) {
    const h = Number(entry.hours || 0);
    const r = Number(entry.hourlyRate || 0);
    totalHours += h;
    totalCost += Math.round(h * r * 100) / 100;
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Validates daily hours constraints (max 24h per calendar day).
 */
export function validateWeeklyHours(
  entries: Array<{
    entryDate: string;
    hours: number | string;
  }>
): { valid: boolean; dailyBreakdown: Record<string, number>; maxDailyExceeded: boolean } {
  const dailyBreakdown: Record<string, number> = {};
  let maxDailyExceeded = false;

  for (const entry of entries) {
    const dateKey = entry.entryDate.substring(0, 10);
    const h = Number(entry.hours || 0);
    dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + h;
    if (dailyBreakdown[dateKey] > 24) {
      maxDailyExceeded = true;
    }
  }

  return {
    valid: !maxDailyExceeded,
    dailyBreakdown,
    maxDailyExceeded,
  };
}

/**
 * Aggregates dashboard analytics for timesheets.
 */
export function calculateTimesheetKPIs(
  timesheets: Array<{
    status: string;
    totalHours: number | string;
    totalCost: number | string;
  }>
) {
  let totalHoursLogged = 0;
  let totalCostValuation = 0;
  let approvedHours = 0;
  let pendingApprovalCount = 0;

  for (const ts of timesheets) {
    const h = Number(ts.totalHours || 0);
    const c = Number(ts.totalCost || 0);

    totalHoursLogged += h;
    totalCostValuation += c;

    if (ts.status === 'approved') {
      approvedHours += h;
    } else if (ts.status === 'submitted') {
      pendingApprovalCount += 1;
    }
  }

  return {
    totalHoursLogged: Math.round(totalHoursLogged * 100) / 100,
    totalCostValuation: Math.round(totalCostValuation * 100) / 100,
    approvedHours: Math.round(approvedHours * 100) / 100,
    pendingApprovalCount,
  };
}
