import { Injectable } from '@angular/core';
import { GradingList } from '../models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportCSV(list: GradingList): void {
    const criteria = list.criteria || [];
    const items = list.items || [];

    // Header row
    const headers = [
      'Nume',
      ...criteria.map(c => `${c.name} (${c.weight}%)`),
      'Overall Score'
    ];

    // Data rows
    const rows = items
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((item, index) => {
        const scores = criteria.map(c => {
          const s = (item.scores || []).find(s => s.criterionId === c.id);
          return s?.score ?? 0;
        });
        return [item.name, ...scores, item.overallScore.toFixed(2)];
      });

    // Build CSV string
    const csvContent = [
      // Metadata
      [`Lista: ${list.title}`],
      [`Exportat: ${new Date().toLocaleDateString('ro-RO')}`],
      [], // linie goală
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${list.title.replace(/[^a-z0-9]/gi, '_')}_gradeit.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
