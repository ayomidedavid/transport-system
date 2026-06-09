export function downloadCSV(data: any[], filename: string, includeTotalsRow: boolean = false) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const keys = Object.keys(data[0]);
  
  // Calculate totals if requested
  const totalsRow: any = {};
  if (includeTotalsRow) {
    keys.forEach(key => {
      // Basic heuristic to identify number fields to sum up
      if (
        key.toLowerCase().includes('amount') || 
        key.toLowerCase().includes('revenue') || 
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('spent') ||
        key.toLowerCase().includes('volume') ||
        key.toLowerCase() === 'total'
      ) {
        const sum = data.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
        totalsRow[key] = sum;
      } else if (key === keys[0]) {
        totalsRow[key] = 'TOTALS';
      } else {
        totalsRow[key] = '';
      }
    });
  }

  const exportData = includeTotalsRow ? [...data, totalsRow] : data;

  const csvRows = [];
  
  // Header
  csvRows.push(keys.map(k => `"${k.replace(/"/g, '""')}"`).join(','));

  // Rows
  for (const row of exportData) {
    const values = keys.map(k => {
      const val = row[k] === null || row[k] === undefined ? '' : String(row[k]);
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
