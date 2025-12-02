// @ts-ignore - pdfkit types
import PDFDocument from 'pdfkit';
import { IPayment } from '../modules/payments/payments.model';

/**
 * PDF Generator Utility
 * Generates invoice PDFs for payments
 */

interface InvoiceData {
  payment: IPayment;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  orders?: Array<{
    orderId: string;
    title: string;
    earnings: number;
  }>;
}

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#3F207F')
        .text('Publisher Authority', 50, 50)
        .fontSize(12)
        .font('Helvetica')
        .fillColor('black')
        .text('Invoice', 50, 85);

      // Invoice Details
      doc
        .fontSize(10)
        .text(`Invoice #: ${data.payment.invoiceNumber}`, 400, 50, { align: 'right' })
        .text(`Invoice Date: ${new Date(data.payment.invoiceDate).toLocaleDateString()}`, 400, 65, { align: 'right' })
        .text(`Due Date: ${new Date(data.payment.dueDate).toLocaleDateString()}`, 400, 80, { align: 'right' })
        .text(`Status: ${data.payment.status.toUpperCase()}`, 400, 95, { align: 'right' });

      // Bill To Section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, 130)
        .fontSize(10)
        .font('Helvetica')
        .text(`${data.user.firstName} ${data.user.lastName}`, 50, 150)
        .text(data.user.email, 50, 165);

      // Payment Method
      if (data.payment.paypalEmail) {
        doc
          .fontSize(10)
          .text(`PayPal Email: ${data.payment.paypalEmail}`, 50, 185);
      }

      // Items Table Header
      let yPosition = 230;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, yPosition)
        .text('Amount', 450, yPosition, { align: 'right' });

      // Line
      doc
        .moveTo(50, yPosition + 15)
        .lineTo(550, yPosition + 15)
        .stroke();

      // Items
      yPosition += 30;
      if (data.orders && data.orders.length > 0) {
        data.orders.forEach((order) => {
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(order.title || `Order ${order.orderId}`, 50, yPosition)
            .text(`$${order.earnings.toFixed(2)}`, 450, yPosition, { align: 'right' });
          yPosition += 20;
        });
      } else {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(data.payment.description || 'Payment for completed orders', 50, yPosition)
          .text(`$${data.payment.amount.toFixed(2)}`, 450, yPosition, { align: 'right' });
        yPosition += 20;
      }

      // Total Line
      yPosition += 10;
      doc
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 20;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total:', 400, yPosition)
        .text(`$${data.payment.amount.toFixed(2)}`, 450, yPosition, { align: 'right' });

      // Footer
      yPosition += 50;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('gray')
        .text('Thank you for your business!', 50, yPosition, { align: 'center' })
        .text('Payments are processed on the 1st and 15th of each month.', 50, yPosition + 15, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

