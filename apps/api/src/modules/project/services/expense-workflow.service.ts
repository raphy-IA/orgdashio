import { ForbiddenException, BadRequestException } from '@nestjs/common';

export interface ExpenseRecord {
  id: string;
  submittedBy: string;
  status: string;
}

/**
 * Validates Separation of Duties rule FIN-04 for expense approval.
 * Prevents submitters from approving their own expenses.
 */
export function validateExpenseApproval(
  expense: ExpenseRecord,
  approverUserId: string
): void {
  if (expense.status !== 'submitted') {
    throw new BadRequestException('Seule une dépense soumise peut être approuvée');
  }

  if (expense.submittedBy === approverUserId) {
    throw new ForbiddenException(
      'Séparation des tâches : vous ne pouvez pas approuver votre propre dépense'
    );
  }
}
