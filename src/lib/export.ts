
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Artist, Booking, Review, Payout, PayoutHistory, Transaction } from '@/types';

type ArtistExportData = {
    artist: Artist;
    bookings: Booking[];
    reviews: Review[];
};

/**
 * Generates a PDF report for a single artist.
 * @param data - The artist's data including bookings and reviews.
 */
export const exportToPdf = (data: ArtistExportData) => {
    const { artist, bookings, reviews } = data;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text(`Artist Report: ${artist.name}`, 14, 20);

    // Profile Details
    doc.setFontSize(16);
    doc.text('Profile Details', 14, 35);
    autoTable(doc, {
        startY: 40,
        body: [
            ['ID', artist.id],
            ['Name', artist.name],
            ['Email', artist.email || 'N/A'],
            ['Location', artist.location],
            ['Services', artist.services.join(', ')],
            ['Base Charge', `₹${artist.charge}`],
            ['Rating', `${artist.rating} / 5`],
        ],
        theme: 'striped',
    });

    const finalYAfterProfile = (doc as any).lastAutoTable.finalY;

    // Financials (mocked for this example)
    const totalRevenue = bookings.reduce((acc, b) => acc + b.amount, 0);
    const platformFee = totalRevenue * 0.1;
    const netPayout = totalRevenue - platformFee;

    doc.setFontSize(16);
    doc.text('Financial Summary', 14, finalYAfterProfile + 15);
    autoTable(doc, {
        startY: finalYAfterProfile + 20,
        body: [
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Platform Fees (10%)', `₹${platformFee.toLocaleString()}`],
            ['Net Payout', `₹${netPayout.toLocaleString()}`],
        ],
        theme: 'striped',
    });

    const finalYAfterFinancials = (doc as any).lastAutoTable.finalY;

    // Bookings
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Recent Bookings', 14, 20);
    autoTable(doc, {
        startY: 25,
        head: [['Customer', 'Date', 'Service', 'Amount', 'Status']],
        body: bookings.map(b => [b.customerName, new Date(b.date).toLocaleDateString(), b.service, `₹${b.amount}`, b.status]),
        theme: 'grid',
    });

    // Reviews
    const finalYAfterBookings = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(16);
    doc.text('Customer Reviews', 14, finalYAfterBookings + 15);
    autoTable(doc, {
        startY: finalYAfterBookings + 20,
        head: [['Customer', 'Rating', 'Comment']],
        body: reviews.map(r => [r.customerName, r.rating, r.comment]),
        theme: 'grid',
    });

    doc.save(`artist-report-${artist.id}.pdf`);
};


/**
 * Generates an Excel workbook from artist data.
 * @param data - An array of artist data.
 * @param filename - The name of the output file.
 */
export const exportToExcel = (data: ArtistExportData[], filename = 'artists-export.xlsx') => {
    const wb = XLSX.utils.book_new();

    data.forEach((artistData) => {
        const { artist, bookings, reviews } = artistData;

        // Artist Profile Sheet
        const profile_ws = XLSX.utils.json_to_sheet([
            {
                ID: artist.id,
                Name: artist.name,
                Email: artist.email || 'N/A',
                Location: artist.location,
                Services: artist.services.join(', '),
                Charge: artist.charge,
                Rating: artist.rating,
                StyleTags: artist.styleTags.join(', '),
            }
        ]);
        XLSX.utils.book_append_sheet(wb, profile_ws, `Profile_${artist.id.substring(0, 8)}`);

        // Bookings Sheet
        if (bookings.length > 0) {
            const bookings_ws = XLSX.utils.json_to_sheet(
                bookings.map(b => ({
                    Customer: b.customerName,
                    Date: new Date(b.date).toLocaleDateString(),
                    Service: b.service,
                    Amount: b.amount,
                    Status: b.status,
                }))
            );
            XLSX.utils.book_append_sheet(wb, bookings_ws, `Bookings_${artist.id.substring(0, 8)}`);
        }
        
        // Reviews Sheet
        if (reviews.length > 0) {
            const reviews_ws = XLSX.utils.json_to_sheet(
                 reviews.map(r => ({
                    Customer: r.customerName,
                    Rating: r.rating,
                    Comment: r.comment,
                }))
            );
            XLSX.utils.book_append_sheet(wb, reviews_ws, `Reviews_${artist.id.substring(0, 8)}`);
        }
    });

    if (data.length === 0) {
        const empty_ws = XLSX.utils.json_to_sheet([{ Message: "No artists were selected to export." }]);
        XLSX.utils.book_append_sheet(wb, empty_ws, 'Export');
    }

    XLSX.writeFile(wb, filename);
};


/**
 * Generates a PDF summary of a payout transaction.
 * @param payout - The payout data object.
 */
export const exportPayoutToPdf = (payout: Payout | PayoutHistory) => {
  const doc = new jsPDF();
  const isHistory = 'paymentDate' in payout;
  const paymentDate = isHistory ? new Date(payout.paymentDate).toLocaleString() : 'N/A';
  const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10');

  doc.setFontSize(20);
  doc.text('Payout Summary', 14, 22);
  doc.setFontSize(12);
  doc.text(`Artist: ${payout.artistName}`, 14, 32);
  doc.text(`Status: ${isHistory ? `Paid on ${paymentDate}` : 'Pending'}`, 14, 38);

  autoTable(doc, {
    startY: 45,
    head: [['Description', 'Amount']],
    body: [
      ['Gross Revenue from Bookings', `₹${payout.grossRevenue.toLocaleString()}`],
      ['Total Bookings Included', payout.totalBookings.toString()],
      { content: 'Deductions', styles: { fontStyle: 'bold' } },
      [`Platform Fees (${platformFeePercentage}%)`, `- ₹${payout.platformFees.toLocaleString()}`],
      ['GST on Services (18%)', `- ₹${payout.gst.toLocaleString()}`],
    ],
    foot: [
        [{ content: 'Net Payout Amount', styles: { fontStyle: 'bold' } }, { content: `₹${payout.netPayout.toLocaleString()}`, styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped',
    styles: { fontSize: 12 },
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
  });

  doc.save(`payout-summary-${payout.artistName.replace(/\s/g, '-')}.pdf`);
};

/**
 * Generates a GST invoice for the platform fee.
 * @param payout - The payout data object.
 */
export const generateGstInvoice = (payout: Payout | PayoutHistory) => {
    const doc = new jsPDF();
    const gstin = localStorage.getItem('platformGstin') || 'Not Set';
    const platformFeePercentage = parseFloat(localStorage.getItem('platformFeePercentage') || '10');

    // Invoice Header
    doc.setFontSize(24);
    doc.text('Tax Invoice', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('MehendiFy Platform', 14, 30);
    doc.text('123 Glamour Lane, Mumbai, MH, 400001', 14, 36);
    doc.text(`GSTIN: ${gstin}`, 14, 42);

    doc.text(`Bill To: ${payout.artistName}`, 14, 60);
    // Add artist address if available

    const invoiceId = `INV-${payout.artistId.substring(0,4)}-${Date.now()}`;
    const invoiceDate = 'paymentDate' in payout ? new Date(payout.paymentDate).toLocaleDateString() : new Date().toLocaleDateString();

    doc.text(`Invoice #: ${invoiceId}`, 196, 60, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 196, 66, { align: 'right' });

    // Invoice Table
    const commissionFee = payout.platformFees;
    const gstOnCommission = commissionFee * 0.18;
    const totalFee = commissionFee + gstOnCommission;

    autoTable(doc, {
        startY: 80,
        head: [['#', 'Service Description', 'Taxable Amount', 'GST Rate', 'GST Amount', 'Total']],
        body: [
            ['1', `Platform Commission Fee (${platformFeePercentage}%)`, `₹${commissionFee.toLocaleString()}`, '18%', `₹${gstOnCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}`, `₹${totalFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
        ],
        foot: [
            ['', '', '', '', 'Total', `₹${totalFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: '#34495e' },
        footStyles: { fillColor: '#34495e', textColor: '#ffffff' }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Footer
    doc.setFontSize(10);
    doc.text('This is a computer-generated invoice and does not require a signature.', 105, finalY + 20, { align: 'center' });

    doc.save(`gst-invoice-${invoiceId}.pdf`);
};

/**
 * Exports a list of transactions to a PDF file.
 * @param transactions - The array of transactions to export.
 */
export const exportTransactionsToPdf = (transactions: Transaction[]) => {
  const doc = new jsPDF();
  const totalRevenue = transactions.filter(t => t.type === 'Revenue').reduce((sum, t) => sum + t.amount, 0);
  const totalPayouts = transactions.filter(t => t.type === 'Payout').reduce((sum, t) => sum + t.amount, 0);

  doc.setFontSize(22);
  doc.text('Transaction Report', 14, 20);
  doc.setFontSize(12);
  doc.text(`Date Range: ${transactions[transactions.length-1].date.toLocaleDateString()} - ${transactions[0].date.toLocaleDateString()}`, 14, 28);
  doc.text(`Total Revenue: +₹${totalRevenue.toLocaleString()}`, 14, 34);
  doc.text(`Total Payouts: -₹${Math.abs(totalPayouts).toLocaleString()}`, 14, 40);

  autoTable(doc, {
    startY: 50,
    head: [['Date', 'Type', 'Description', 'Amount']],
    body: transactions.map(t => [
      t.date.toLocaleDateString(),
      t.type,
      t.description,
      t.amount > 0 ? `+₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: '#34495e' },
    didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
            const text = data.cell.text[0];
            if (text.startsWith('+')) {
                doc.setTextColor(39, 174, 96); // green
            } else if (text.startsWith('-')) {
                 doc.setTextColor(192, 57, 43); // red
            }
        }
    }
  });

  doc.save('transaction-report.pdf');
};


/**
 * Exports a list of transactions to an Excel file.
 * @param transactions - The array of transactions to export.
 */
export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
    Date: t.date.toLocaleDateString(),
    Type: t.type,
    Description: t.description,
    Amount: t.amount,
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, 'transaction-report.xlsx');
};
