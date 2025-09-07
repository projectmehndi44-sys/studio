
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Artist, Booking, Review } from '@/types';

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
        body: bookings.map(b => [b.customerName, b.date.toLocaleDateString(), b.service, `₹${b.amount}`, b.status]),
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

    data.forEach((artistData, index) => {
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
                    Date: b.date.toLocaleDateString(),
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
        const empty_ws = XLSX.utils.json_to_sheet([{ Message: "No artists selected to export." }]);
        XLSX.utils.book_append_sheet(wb, empty_ws, 'Export');
    }

    XLSX.writeFile(wb, filename);
};
