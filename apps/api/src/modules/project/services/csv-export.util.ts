export interface ExpenseExportRow {
  date: string;
  categoryCode: string;
  vendor: string;
  amount: string;
  taxTps: string;
  taxTvq: string;
  status: string;
  projectCode: string;
  projectName: string;
  notes?: string;
}

/**
 * Generates a normalized CSV string for accounting export (FIN-08).
 */
export function generateAccountingCsv(rows: ExpenseExportRow[]): string {
  const headers = [
    'Date',
    'Poste Budgétaire',
    'Fournisseur',
    'Montant (CAD)',
    'TPS',
    'TVQ',
    'Statut',
    'Code Projet',
    'Nom Projet',
    'Notes',
  ];

  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const values = [
      row.date,
      `"${row.categoryCode}"`,
      `"${row.vendor.replace(/"/g, '""')}"`,
      row.amount,
      row.taxTps || '0',
      row.taxTvq || '0',
      row.status,
      `"${row.projectCode}"`,
      `"${row.projectName.replace(/"/g, '""')}"`,
      `"${(row.notes || '').replace(/"/g, '""')}"`,
    ];
    csvLines.push(values.join(','));
  }

  return csvLines.join('\r\n');
}
