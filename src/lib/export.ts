

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Artist, Booking, Review, Payout, PayoutHistory, Transaction, Customer } from '@/types';
import { getCompanyProfile } from './services';

type ArtistExportData = {
    artist: Artist;
    bookings: Booking[];
    reviews: Review[];
};

/**
 * Generates a PDF report for a single artist.
 * @param data - The artist's data including bookings and reviews.
 */
export const exportToPdf = async (data: ArtistExportData) => {
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
            ['Mehndi Base Charge', `₹${artist.charges?.mehndi?.toLocaleString() || 'N/A'}`],
            ['Makeup Base Charge', `₹${artist.charges?.makeup?.toLocaleString() || 'N/A'}`],
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
        body: bookings.map(b => [b.customerName, b.date.toDate().toLocaleDateString(), b.service, `₹${b.amount}`, b.status]),
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
                    Date: b.date.toDate().toLocaleDateString(),
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

  const taxableAmount = payout.grossRevenue / 1.18;

  doc.setFontSize(20);
  doc.text('Payout Summary', 14, 22);
  doc.setFontSize(12);
  doc.text(`Artist: ${payout.artistName}`, 14, 32);
  doc.text(`Status: ${isHistory ? `Paid on ${paymentDate}` : 'Pending'}`, 14, 38);

  autoTable(doc, {
    startY: 45,
    head: [['Description', 'Amount']],
    body: [
      ['Gross Revenue from Bookings (Incl. GST)', `₹${payout.grossRevenue.toLocaleString()}`],
      ['Total Bookings Included', payout.totalBookings.toString()],
      { content: 'Breakdown', styles: { fontStyle: 'bold' } },
      ['Taxable Amount (Pre-GST)', `₹${taxableAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}`],
      ['GST on Services (18%)', `₹${payout.gst.toLocaleString(undefined, {maximumFractionDigits: 2})}`],
      ['Platform Fees (on taxable amount)', `- ₹${payout.platformFees.toLocaleString(undefined, {maximumFractionDigits: 2})}`],
    ],
    foot: [
        [{ content: 'Net Payout Amount', styles: { fontStyle: 'bold' } }, { content: `₹${payout.netPayout.toLocaleString(undefined, {maximumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }],
    ],
    theme: 'striped',
    styles: { fontSize: 12 },
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
  });

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

    // Invoice Header
    doc.setFontSize(24);
    doc.text('Tax Invoice', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(companyProfile.companyName, 14, 30);
    doc.text(companyProfile.address, 14, 36);
    doc.text(`GSTIN: ${companyProfile.gstin}`, 14, 42);

    doc.text(`Bill To: ${payout.artistName}`, 14, 60);

    const invoiceId = `INV-COMM-${payout.artistId.substring(0,4)}-${Date.now()}`;
    const invoiceDate = 'paymentDate' in payout ? new Date(payout.paymentDate).toLocaleDateString() : new Date().toLocaleDateString();

    doc.text(`Invoice #: ${invoiceId}`, 196, 60, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 196, 66, { align: 'right' });

    // Invoice Table for Platform Commission
    const gstOnCommission = platformFee * 0.18; // Assuming 18% GST on commission
    const totalFee = platformFee + gstOnCommission;

    autoTable(doc, {
        startY: 80,
        head: [['#', 'Service Description', 'Taxable Amount', 'GST Rate', 'GST Amount', 'Total']],
        body: [
            ['1', `Platform Commission Fee`, `₹${platformFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`, '18%', `₹${gstOnCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}`, `₹${totalFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
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

    doc.save(`gst-commission-invoice-${invoiceId}.pdf`);
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

    // Invoice Header
    doc.setFontSize(24);
    doc.text('Tax Invoice', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(companyProfile.companyName, 14, 30);
    doc.text(companyProfile.address, 14, 36);
    doc.text(`GSTIN: ${companyProfile.gstin}`, 14, 42);

    doc.text(`Bill To: ${customer.name}`, 14, 60);
    doc.text(`Contact: ${customer.phone}`, 14, 66);
    if(customer.email) doc.text(`Email: ${customer.email}`, 14, 72);

    const invoiceId = `INV-CUST-${booking.id.substring(5)}`;
    const invoiceDate = booking.date.toDate().toLocaleDateString();

    doc.text(`Invoice #: ${invoiceId}`, 196, 60, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 196, 66, { align: 'right' });

    // Invoice Table
    autoTable(doc, {
        startY: 80,
        head: [['#', 'Service Description', 'Amount (incl. GST)']],
        body: [
            ['1', booking.service, `₹${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`]
        ],
        theme: 'striped',
    });
    
    let finalY = (doc as any).lastAutoTable.finalY;

    // Totals Section
    autoTable(doc, {
        startY: finalY + 2,
        body: [
             ['Taxable Value', `₹${taxableAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
             ['Included GST (18%)', `₹${gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`],
        ],
        foot: [
            [{ content: 'Total Amount Paid', styles: { fontStyle: 'bold' } }, { content: `₹${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }]
        ],
        theme: 'plain',
        styles: { halign: 'right' },
        footStyles: { halign: 'right', fillColor: false, fontStyle: 'bold' },
        columnStyles: { 0: { halign: 'right' } },
    });

    finalY = (doc as any).lastAutoTable.finalY;


    // Footer
    doc.setFontSize(10);
    doc.text('This is a computer-generated invoice and does not require a signature.', 105, finalY + 20, { align: 'center' });
    doc.text('Thank you for your business!', 105, finalY + 26, { align: 'center' });

    doc.save(`invoice-${invoiceId}.pdf`);
}
