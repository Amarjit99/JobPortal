import { Invoice } from "../models/invoice.model.js";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Get user invoices
export const getUserInvoices = async (req, res) => {
    try {
        const userId = req.id;
        const { page = 1, limit = 10 } = req.query;

        const invoices = await Invoice.find({ userId })
            .populate('paymentId', 'orderId amount currency status')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Invoice.countDocuments({ userId });

        return res.status(200).json({
            success: true,
            invoices,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Generate PDF invoice
export const generateInvoicePDF = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.id;

        const invoice = await Invoice.findById(invoiceId)
            .populate('userId', 'fullname email phoneNumber')
            .populate('paymentId');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        // Verify ownership (or admin)
        if (invoice.userId._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('INVOICE', 50, 50);
        doc.fontSize(10).text('JobPortal Inc.', 50, 80);
        doc.text('123 Business Street', 50, 95);
        doc.text('City, State 12345', 50, 110);
        doc.text('contact@jobportal.com', 50, 125);

        // Invoice details
        doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 50);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 65);
        doc.text(`Status: ${invoice.status.toUpperCase()}`, 400, 80);

        // Customer details
        doc.fontSize(12).text('Bill To:', 50, 160);
        doc.fontSize(10).text(invoice.userId.fullname, 50, 180);
        doc.text(invoice.userId.email, 50, 195);
        if (invoice.userId.phoneNumber) {
            doc.text(invoice.userId.phoneNumber, 50, 210);
        }

        // Line separator
        doc.moveTo(50, 240).lineTo(550, 240).stroke();

        // Table header
        let yPos = 260;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 50, yPos);
        doc.text('Qty', 300, yPos);
        doc.text('Unit Price', 350, yPos);
        doc.text('Amount', 450, yPos);

        doc.moveTo(50, yPos + 15).lineTo(550, yPos + 15).stroke();

        // Items
        doc.font('Helvetica');
        yPos += 25;

        invoice.items.forEach(item => {
            doc.text(item.description, 50, yPos, { width: 240 });
            doc.text(item.quantity.toString(), 300, yPos);
            doc.text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 350, yPos);
            doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 450, yPos);
            yPos += 20;
        });

        // Summary
        yPos += 20;
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
        yPos += 15;

        doc.text('Subtotal:', 350, yPos);
        doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 450, yPos);
        yPos += 20;

        if (invoice.tax.amount > 0) {
            doc.text(`Tax (${invoice.tax.rate}%):`, 350, yPos);
            doc.text(`${invoice.currency} ${invoice.tax.amount.toFixed(2)}`, 450, yPos);
            yPos += 20;
        }

        if (invoice.discount && invoice.discount.amount > 0) {
            doc.text(`Discount:`, 350, yPos);
            doc.text(`-${invoice.currency} ${invoice.discount.amount.toFixed(2)}`, 450, yPos);
            yPos += 20;
        }

        doc.font('Helvetica-Bold');
        doc.fontSize(12);
        doc.text('Total:', 350, yPos);
        doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, 450, yPos);

        // Footer
        doc.fontSize(8).font('Helvetica');
        doc.text('Thank you for your business!', 50, 700, { align: 'center' });
        doc.text('For any queries, contact us at support@jobportal.com', 50, 715, { align: 'center' });

        // Finalize PDF
        doc.end();

        console.log(`Invoice PDF generated: ${invoice.invoiceNumber} for user ${userId}`);
    } catch (error) {
        console.error('Generate invoice PDF error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.id;

        const invoice = await Invoice.findById(invoiceId)
            .populate('userId', 'fullname email')
            .populate('paymentId');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        // Verify ownership
        if (invoice.userId._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        return res.status(200).json({
            success: true,
            invoice
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
