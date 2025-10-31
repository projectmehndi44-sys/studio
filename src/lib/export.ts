import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Artist, Booking, Review, Payout, PayoutHistory, Transaction, Customer } from '@/lib/types';
import { getCompanyProfile } from './services';

type ArtistExportData = {
    artist: Artist;
    bookings: Booking[];
    reviews: Review[];
};


const brandColors = {
    primary: '#8B4513', // Rich Henna
    accent: '#CD7F32',  // Golden Bronze
    text: '#333333',
    muted: '#777777',
    background: '#FFFFFF'
};

const addHeader = (doc: jsPDF, title: string) => {
    doc.setFillColor(brandColors.primary);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandColors.background);
    doc.setFontSize(22);
    doc.text('UtsavLook', 14, 18);
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() - 14, 18, { align: 'right' });
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.setTextColor(brandColors.muted);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
};

/**
 * Generates a PDF report for a single artist.
 * @param data - The artist's data including bookings and reviews.
 */
export const exportToPdf = async (data: ArtistExportData) => {
    const { artist, bookings, reviews } = data;
    const doc = new jsPDF();

    addHeader(doc, `Artist Report`);

    // Title
    doc.setFontSize(20);
    doc.setTextColor(brandColors.text);
    doc.text(artist.name, 14, 45);

    // Profile Details
    doc.setFontSize(12);
    autoTable(doc, {
        startY: 55,
        body: [
            [{content: 'Artist ID:', styles: {fontStyle: 'bold'}}, artist.id],
            [{content: 'Email:', styles: {fontStyle: 'bold'}}, artist.email || 'N/A'],
            [{content: 'Location:', styles: {fontStyle: 'bold'}}, artist.location],
            [{content: 'Services:', styles: {fontStyle: 'bold'}}, artist.services.join(', ')],
            [{content: 'Rating:', styles: {fontStyle: 'bold'}}, `${artist.rating} / 5`],
        ],
        theme: 'plain',
        styles: { cellPadding: 2 }
    });

    const finalYAfterProfile = (doc as any).lastAutoTable.finalY;

    // Financials (mocked for this example)
    const totalRevenue = bookings.reduce((acc, b) => acc + b.amount, 0);
    const platformFee = totalRevenue * 0.1;
    const netPayout = totalRevenue - platformFee;

    doc.setFontSize(16);
    doc.setTextColor(brandColors.primary);
    doc.text('Financial Summary', 14, finalYAfterProfile + 15);
    autoTable(doc, {
        startY: finalYAfterProfile + 20,
        body: [
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Platform Fees (10%)', `₹${platformFee.toLocaleString()}`],
            ['Net Payout', `₹${netPayout.toLocaleString()}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: brandColors.accent }
    });

    // Bookings
    if (bookings.length > 0) {
        doc.addPage();
        addHeader(doc, 'Bookings');
        autoTable(doc, {
            startY: 40,
            head: [['Customer', 'Date', 'Service', 'Amount', 'Status']],
            body: bookings.map(b => [b.customerName, (b.eventDate as any).toLocaleDateString(), b.items.map(i => i.servicePackage.name).join(', '), `₹${b.amount}`, b.status]),
            theme: 'grid',
            headStyles: { fillColor: brandColors.accent }
        });
    }

    // Reviews
    if (reviews.length > 0) {
        const finalYAfterBookings = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(16);
        doc.setTextColor(brandColors.primary);
        doc.text('Customer Reviews', 14, finalYAfterBookings + 15);
        autoTable(doc, {
            startY: finalYAfterBookings + 20,
            head: [['Customer', 'Rating', 'Comment']],
            body: reviews.map(r => [r.customerName, r.rating, r.comment]),
            theme: 'grid',
            headStyles: { fillColor: brandColors.accent }
        });
    }

    addFooter(doc);
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
                'Mehndi Base Charge': artist.charges?.mehndi,
                'Makeup Base Charge': artist.charges?.makeup,
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
                    Date: (b.eventDate as any).toLocaleDateString(),
                    Service: b.items.map(i => i.servicePackage.name).join(', '),
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
  const paymentDate = isHistory ? new Date(payout.paymentDate).toLocaleString() : new Date().toLocaleString();

  addHeader(doc, 'Payout Summary');

  doc.setFontSize(12);
  doc.setTextColor(brandColors.text);
  doc.text(`Artist: ${payout.artistName}`, 14, 45);
  doc.text(`Status: ${isHistory ? `Paid` : 'Pending'}`, 14, 51);
  doc.text(`Generated On: ${paymentDate}`, doc.internal.pageSize.getWidth() - 14, 45, { align: 'right' });


  const taxableAmount = payout.grossRevenue / 1.18;

  autoTable(doc, {
    startY: 60,
    head: [['Description', 'Amount']],
    body: [
      ['Gross Revenue from Online Bookings', `₹ ${payout.grossRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
      ['Total Bookings Included', payout.totalBookings.toString()],
      { content: 'Breakdown', styles: { fontStyle: 'bold', fillColor: '#f0f0f0', textColor: brandColors.text } },
      ['Taxable Amount (Pre-GST)', `₹ ${taxableAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
      ['GST on Services (18%)', `₹ ${payout.gst.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
      ['Platform Fees (on taxable amount)', `- ₹ ${payout.platformFees.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
      ['Commission Owed (from Offline Bookings)', `- ₹ ${payout.commissionOwed.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
    ],
    foot: [
        [{ content: 'Net Payout Amount', styles: { fontStyle: 'bold' } }, { content: `₹ ${payout.netPayout.toLocaleString(undefined, {minimumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped',
    styles: { fontSize: 12 },
    headStyles: { fillColor: brandColors.primary },
    footStyles: { fillColor: brandColors.accent, textColor: brandColors.background },
  });

  addFooter(doc);
  doc.save(`payout-summary-${payout.artistName.replace(/\s/g, '-')}.pdf`);
};

/**
 * Generates a GST invoice for the platform fee charged to an artist.
 * @param payout - The payout data object for which to generate the commission invoice.
 */
export const generateGstInvoiceForPlatformFee = async (payout: Payout | PayoutHistory) => {
    const doc = new jsPDF();
    const companyProfile = await getCompanyProfile();
    const platformFee = payout.platformFees;

    const invoiceId = `INV-COMM-${payout.artistId.substring(0,4)}-${Date.now()}`;
    const invoiceDate = 'paymentDate' in payout ? new Date(payout.paymentDate).toLocaleDateString() : new Date().toLocaleDateString();

    addHeader(doc, 'Tax Invoice');

    // Company & Billing Info
    doc.setFontSize(10);
    doc.setTextColor(brandColors.text);
    doc.text(companyProfile.companyName, 14, 45);
    doc.text(companyProfile.address, 14, 50);
    doc.text(`GSTIN: ${companyProfile.gstin}`, 14, 55);

    doc.text(`Bill To: ${payout.artistName}`, 14, 70);

    doc.text(`Invoice #: ${invoiceId}`, 196, 45, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 196, 50, { align: 'right' });

    // Invoice Table for Platform Commission
    const gstOnCommission = platformFee * 0.18; // Assuming 18% GST on commission
    const totalFee = platformFee + gstOnCommission;

    autoTable(doc, {
        startY: 80,
        head: [['#', 'Service Description', 'Taxable Amount', 'GST Rate', 'GST Amount', 'Total']],
        body: [
            ['1', `Platform Commission Fee`, `₹ ${platformFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`, '18%', `₹ ${gstOnCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}`, `₹ ${totalFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
        ],
        foot: [
            ['', '', '', '', 'Total', `₹ ${totalFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: brandColors.primary },
        footStyles: { fillColor: brandColors.primary, textColor: '#ffffff' }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(brandColors.muted);
    doc.text('This is a computer-generated invoice and does not require a signature.', 105, finalY + 20, { align: 'center' });

    addFooter(doc);
    doc.save(`gst-commission-invoice-${invoiceId}.pdf`);
};

/**
 * Generates a final invoice for the artist to give to the customer.
 * @param booking The completed booking object.
 * @param additionalCharges Any extra charges added by the artist.
 */
export const generateArtistInvoice = async (booking: Booking, additionalCharges: { description: string; amount: number }[]) => {
    const doc = new jsPDF();
    const companyProfile = await getCompanyProfile();
    const invoiceId = `INV-FINAL-${booking.id.substring(5)}`;
    const invoiceDate = new Date().toLocaleDateString();

    addHeader(doc, 'Final Invoice');
    
    doc.setFontSize(10);
    doc.setTextColor(brandColors.text);
    doc.text(`From: ${booking.items[0]?.artist?.name || 'UtsavLook Artist'}`, 14, 45);
    doc.text(`Billed To: ${booking.customerName}`, 14, 55);
    doc.text(`Contact: ${booking.customerContact}`, 14, 60);

    doc.text(`Invoice #: ${invoiceId}`, 196, 45, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 196, 50, { align: 'right' });
    doc.text(`Event Date: ${(booking.eventDate as any).toLocaleDateString()}`, 196, 55, { align: 'right' });

    const tableBody = booking.items.map(item => ([
        `${item.servicePackage.name} - ${item.selectedTier.name}`,
        `₹ ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}`
    ]));

    additionalCharges.forEach(charge => {
        tableBody.push([
            `Additional: ${charge.description}`,
            `₹ ${charge.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`
        ]);
    });

    const baseTotal = booking.items.reduce((sum, item) => sum + item.price, 0);
    const additionalTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const finalTotal = baseTotal + additionalTotal;
    
    autoTable(doc, {
        startY: 70,
        head: [['Service Description', 'Amount']],
        body: tableBody,
        foot: [[{content: 'Total Amount Due', styles:{fontStyle: 'bold'}}, {content:`₹ ${finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, styles:{fontStyle: 'bold'}}]],
        theme: 'striped',
        headStyles: { fillColor: brandColors.primary },
        footStyles: { fillColor: brandColors.accent, textColor: brandColors.background },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(brandColors.muted);
    doc.text('This is a computer-generated invoice. Thank you for your business!', 105, finalY + 20, { align: 'center' });

    addFooter(doc);
    doc.save(`utsavlook-invoice-${invoiceId}.pdf`);
};


/**
 * Generates a customer-facing GST invoice for a booking.
 * @param booking The booking object.
 * @param customer The customer object.
 */
export const generateCustomerInvoice = async (booking: Booking, customer: Customer) => {
    const doc = new jsPDF();
    const companyProfile = await getCompanyProfile();
    const totalAmount = booking.amount;
    const taxableAmount = totalAmount / 1.18;
    const gstAmount = totalAmount - taxableAmount;
    
    const invoiceId = `INV-CUST-${booking.id.substring(5)}`;
    const invoiceDate = (booking.eventDate as any).toLocaleDateString();

    addHeader(doc, 'Tax Invoice');

    // Company & Billing Info
    doc.setFontSize(10);
    doc.setTextColor(brandColors.text);
    doc.text(companyProfile.companyName, 14, 45);
    doc.text(companyProfile.address, 14, 50);
    doc.text(`GSTIN: ${companyProfile.gstin}`, 14, 55);

    doc.text(`Bill To: ${customer.name}`, 14, 70);
    doc.text(`Contact: ${customer.phone}`, 14, 75);

    doc.text(`Invoice #: ${invoiceId}`, 196, 45, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 196, 50, { align: 'right' });


    // Invoice Table
    autoTable(doc, {
        startY: 85,
        head: [['#', 'Service Description', 'Amount (incl. GST)']],
        body: [
            ['1', booking.items.map(i => i.servicePackage.name).join(', '), `₹ ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: brandColors.primary },
    });
    
    let finalY = (doc as any).lastAutoTable.finalY;

    // Totals Section
    autoTable(doc, {
        startY: finalY + 5,
        body: [
             [{content: 'Taxable Value:', styles: {halign: 'right'}}, `₹ ${taxableAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
             [{content: 'Included GST (18%):', styles: {halign: 'right'}}, `₹ ${gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
             [{content: 'Total Amount Paid:', styles: {halign: 'right', fontStyle: 'bold'}}, {content: `₹ ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, styles:{fontStyle: 'bold'}}],
        ],
        theme: 'plain',
        styles: { halign: 'right' },
        columnStyles: {0: {cellWidth: 150}},
    });

    finalY = (doc as any).lastAutoTable.finalY;


    // Footer
    doc.setFontSize(10);
    doc.setTextColor(brandColors.muted);
    doc.text('This is a computer-generated invoice and does not require a signature.', 105, finalY + 20, { align: 'center' });
    doc.text('Thank you for choosing UtsavLook!', 105, finalY + 26, { align: 'center' });

    addFooter(doc);
    doc.save(`invoice-${invoiceId}.pdf`);
}

export const exportTransactionsToPdf = (transactions: Transaction[]) => {
    const doc = new jsPDF();
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'Revenue') acc.revenue += t.amount;
        if (t.type === 'Payout') acc.payouts += Math.abs(t.amount);
        return acc;
    }, { revenue: 0, payouts: 0 });
    const net = totals.revenue - totals.payouts;

    addHeader(doc, 'Transaction Report');
    doc.setFontSize(12);
    doc.text(`Total Revenue: ${totals.revenue.toLocaleString()}`, 14, 45);
    doc.text(`Total Payouts: ${totals.payouts.toLocaleString()}`, 14, 51);
    doc.text(`Net: ${net.toLocaleString()}`, 14, 57);

    autoTable(doc, {
        startY: 65,
        head: [['Date', 'Type', 'Description', 'Amount']],
        body: transactions.map(t => [
            t.date.toLocaleDateString(),
            t.type,
            t.description,
            { content: t.amount.toLocaleString(), styles: { halign: 'right' } }
        ]),
        theme: 'grid',
        headStyles: { fillColor: brandColors.accent }
    });

    addFooter(doc);
    doc.save('transaction-report.pdf');
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
    const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
        Date: t.date.toLocaleDateString(),
        Type: t.type,
        Description: t.description,
        Amount: t.amount
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'transaction-report.xlsx');
};
