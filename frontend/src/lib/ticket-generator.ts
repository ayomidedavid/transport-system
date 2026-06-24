import jsPDF from 'jspdf';
import 'jspdf-autotable';

export type TicketData = {
  ref: string;
  date: string;
  time: string;
  passengerName: string;
  route: string;
  company: string;
  vehicleType: string;
  amount: string;
  seat: string;
};

export async function generateTicketPdf(ticket: TicketData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Set up fonts and colors
  doc.setFont('helvetica');
  const primaryColor: [number, number, number] = [0, 0, 0]; // Black (#000000)
  const secondaryColor: [number, number, number] = [31, 41, 55]; // Gray-800 (#1f2937)
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800 (#1f2937)
  const lightGray: [number, number, number] = [107, 114, 128]; // Gray-500 (#6b7280)

  // Draw Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('UNITRANSIT', 20, 22);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Boarding Pass / Receipt', 20, 30);

  // Logo placeholder or image (Optional, we'll just use text for robust generation)
  
  // Ticket Info Block
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Trip Details', 20, 55);

  doc.setLineWidth(0.5);
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.line(20, 60, 190, 60);

  // Start placing details
  let y = 70;
  const col1 = 20;
  const col2 = 110;
  const lineSpacing = 12;

  function addField(label: string, value: string, xPos: number, yPos: number) {
    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), xPos, yPos);
    
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(value, xPos, yPos + 6);
  }

  addField('Passenger Name', ticket.passengerName, col1, y);
  addField('Ticket Reference', ticket.ref, col2, y);
  y += lineSpacing + 8;

  addField('Route', ticket.route, col1, y);
  addField('Transport Company', ticket.company, col2, y);
  y += lineSpacing + 8;

  addField('Date', ticket.date, col1, y);
  addField('Time', ticket.time, col2, y);
  y += lineSpacing + 8;

  addField('Vehicle Type', ticket.vehicleType, col1, y);
  addField('Seat Number', ticket.seat, col2, y);
  y += lineSpacing + 8;

  addField('Amount Paid', ticket.amount, col1, y);
  addField('Payment Status', 'SUCCESSFUL', col2, y);
  
  y += 20;
  
  // Footer / Terms
  doc.setFillColor(243, 244, 246); // Gray-100
  doc.rect(20, y, 170, 40, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT INFORMATION', 25, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text([
    '- Please arrive at the pickup location at least 30 minutes before departure.',
    '- Present this ticket (digital or printed) along with your Student ID.',
    '- Tickets are non-refundable within 24 hours of departure.',
    '- Luggage limits apply based on the vehicle type.'
  ], 25, y + 18);

  // Save the PDF
  doc.save(`UniTransit_Ticket_${ticket.ref}.pdf`);
}
