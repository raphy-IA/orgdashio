import { describe, it, expect } from 'vitest';
import {
  getMondayOfWeek,
  getSundayOfWeek,
  calculateTimesheetTotals,
  validateWeeklyHours,
  calculateTimesheetKPIs,
} from './timesheets.utils';

describe('timesheets.utils', () => {
  describe('getMondayOfWeek & getSundayOfWeek', () => {
    it('calculates correct Monday and Sunday for a Wednesday', () => {
      const wednesday = '2026-10-07';
      const monday = getMondayOfWeek(wednesday);
      expect(monday).toBe('2026-10-05');
      const sunday = getSundayOfWeek(monday);
      expect(sunday).toBe('2026-10-11');
    });

    it('calculates correct Monday for a Sunday', () => {
      const sunday = '2026-10-11';
      const monday = getMondayOfWeek(sunday);
      expect(monday).toBe('2026-10-05');
    });
  });

  describe('calculateTimesheetTotals', () => {
    it('computes total hours and valorized cost accurately', () => {
      const entries = [
        { hours: 7.5, hourlyRate: 40 },
        { hours: 7.5, hourlyRate: 40 },
        { hours: 5.0, hourlyRate: 30 },
      ];
      const result = calculateTimesheetTotals(entries);
      expect(result.totalHours).toBe(20.0);
      expect(result.totalCost).toBe(750.0);
    });

    it('handles zero or null rates gracefully', () => {
      const entries = [{ hours: 4, hourlyRate: null }];
      const result = calculateTimesheetTotals(entries);
      expect(result.totalHours).toBe(4);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('validateWeeklyHours', () => {
    it('validates normal entries under 24h per day', () => {
      const entries = [
        { entryDate: '2026-10-05', hours: 7.5 },
        { entryDate: '2026-10-05', hours: 2.0 },
        { entryDate: '2026-10-06', hours: 8.0 },
      ];
      const result = validateWeeklyHours(entries);
      expect(result.valid).toBe(true);
      expect(result.dailyBreakdown['2026-10-05']).toBe(9.5);
      expect(result.dailyBreakdown['2026-10-06']).toBe(8.0);
    });

    it('flags days where hours exceed 24h', () => {
      const entries = [{ entryDate: '2026-10-05', hours: 25 }];
      const result = validateWeeklyHours(entries);
      expect(result.valid).toBe(false);
      expect(result.maxDailyExceeded).toBe(true);
    });
  });

  describe('calculateTimesheetKPIs', () => {
    it('calculates totals, approved hours and pending count', () => {
      const timesheets = [
        { status: 'approved', totalHours: 35, totalCost: 1050 },
        { status: 'approved', totalHours: 40, totalCost: 1200 },
        { status: 'submitted', totalHours: 35, totalCost: 1050 },
        { status: 'draft', totalHours: 20, totalCost: 600 },
      ];

      const kpis = calculateTimesheetKPIs(timesheets);
      expect(kpis.totalHoursLogged).toBe(130);
      expect(kpis.totalCostValuation).toBe(3900);
      expect(kpis.approvedHours).toBe(75);
      expect(kpis.pendingApprovalCount).toBe(1);
    });
  });
});
