import { describe, it, expect } from 'vitest';
import { validateExpenseApproval } from './expense-workflow.service';

describe('Expense Approval Separation of Duties (FIN-04)', () => {
  it('should reject approval if the approver is the same as the submitter', () => {
    const expense = {
      id: 'exp-1',
      submittedBy: 'user-alice',
      status: 'submitted',
    };

    // User Alice trying to approve her own expense
    expect(() => validateExpenseApproval(expense, 'user-alice')).toThrow(
      'Séparation des tâches : vous ne pouvez pas approuver votre propre dépense'
    );
  });

  it('should allow approval if the approver is a different user', () => {
    const expense = {
      id: 'exp-1',
      submittedBy: 'user-alice',
      status: 'submitted',
    };

    // User Bob approving Alice's expense
    expect(() => validateExpenseApproval(expense, 'user-bob')).not.toThrow();
  });

  it('should reject approval if the expense is not in submitted status', () => {
    const expense = {
      id: 'exp-1',
      submittedBy: 'user-alice',
      status: 'draft',
    };

    expect(() => validateExpenseApproval(expense, 'user-bob')).toThrow(
      'Seule une dépense soumise peut être approuvée'
    );
  });
});
