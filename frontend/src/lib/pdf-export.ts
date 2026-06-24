import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadUsersPDF(data: Record<string, string | number>[], filename: string = 'users.pdf') {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('landscape');
  
  // Custom styling elements
  const primaryColor: [number, number, number] = [0, 0, 0]; // Black
  const textColor: [number, number, number] = [15, 23, 42]; // slate-900
  const mutedColor: [number, number, number] = [100, 116, 139]; // slate-500

  // Header Graphic
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('UNITRANSIT ADMIN REPORT', 14, 11);

  // Subtitle / Date
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Accounts Summary', 14, 25);
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // Extract headers and rows
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(header => item[header]));

  // Add autoTable
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.1,
      textColor: [51, 65, 85], // slate-700
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      6: { halign: 'center', fontStyle: 'bold' }, // Total Bookings
      7: { halign: 'right', fontStyle: 'bold', textColor: primaryColor },  // Total Spent
      8: { halign: 'center' }, // Status
    },
    margin: { top: 35 },
    didDrawPage: (data: any) => {
      // Footer
      const str = `Page ${(doc.internal as any).getNumberOfPages()}`;
      doc.setFontSize(9);
      doc.setTextColor(...mutedColor);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
      
      // Footer branding
      doc.text('UniTransit Transport Management System', pageSize.width - data.settings.margin.right, pageHeight - 10, { align: 'right' });
    }
  });

  doc.save(filename);
}
