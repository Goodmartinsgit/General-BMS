const { pool } = require('../config/db');
// NOTE: Install these packages for production: npm install pdfkit nodemailer
// const PDFDocument = require('pdfkit');
// const nodemailer = require('nodemailer');
// const { sendWhatsAppMessage } = require('../services/whatsappService');

// ============================================================================
// RECEIPT CONFIGURATION
// ============================================================================

/**
 * Get Receipt Configuration
 */
const getReceiptConfig = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM receipt_config ORDER BY updated_at DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            // Return default configuration
            return res.json({
                company_name: 'General BMS',
                company_address: '',
                company_phone: '',
                company_email: '',
                company_logo_url: null,
                show_logo: true,
                show_tax_number: true,
                tax_number: '',
                footer_text: 'Thank you for your business!',
                terms_and_conditions: '',
                template_style: 'modern',
                show_barcode: true,
                show_qr_code: false
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update Receipt Configuration
 */
const updateReceiptConfig = async (req, res) => {
    try {
        const {
            company_name,
            company_address,
            company_phone,
            company_email,
            company_logo_url,
            show_logo,
            show_tax_number,
            tax_number,
            footer_text,
            terms_and_conditions,
            template_style,
            show_barcode,
            show_qr_code
        } = req.body;

        // Check if config exists
        const existingConfig = await pool.query('SELECT id FROM receipt_config LIMIT 1');

        let result;
        if (existingConfig.rows.length > 0) {
            // Update existing config
            result = await pool.query(
                `UPDATE receipt_config SET
                    company_name = $1,
                    company_address = $2,
                    company_phone = $3,
                    company_email = $4,
                    company_logo_url = $5,
                    show_logo = $6,
                    show_tax_number = $7,
                    tax_number = $8,
                    footer_text = $9,
                    terms_and_conditions = $10,
                    template_style = $11,
                    show_barcode = $12,
                    show_qr_code = $13,
                    updated_at = NOW()
                 WHERE id = $14
                 RETURNING *`,
                [
                    company_name, company_address, company_phone, company_email, company_logo_url,
                    show_logo, show_tax_number, tax_number, footer_text, terms_and_conditions,
                    template_style, show_barcode, show_qr_code, existingConfig.rows[0].id
                ]
            );
        } else {
            // Create new config
            result = await pool.query(
                `INSERT INTO receipt_config (
                    company_name, company_address, company_phone, company_email, company_logo_url,
                    show_logo, show_tax_number, tax_number, footer_text, terms_and_conditions,
                    template_style, show_barcode, show_qr_code
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 RETURNING *`,
                [
                    company_name, company_address, company_phone, company_email, company_logo_url,
                    show_logo, show_tax_number, tax_number, footer_text, terms_and_conditions,
                    template_style, show_barcode, show_qr_code
                ]
            );
        }

        res.json({
            message: 'Receipt configuration updated successfully',
            config: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// RECEIPT GENERATION
// ============================================================================

/**
 * Generate Receipt Data
 * Helper function to gather all receipt data
 */
const generateReceiptData = async (saleId) => {
    // Get sale details
    const saleResult = await pool.query(
        `SELECT s.*, b.branch_name, b.branch_address, b.branch_phone,
                c.customer_name, c.phone_number as customer_phone, c.email as customer_email,
                u.full_name as salesperson_name
         FROM sales s
         JOIN branches b ON s.branch_id = b.id
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN users u ON s.performed_by = u.id
         WHERE s.id = $1`,
        [saleId]
    );

    if (saleResult.rows.length === 0) {
        throw new Error('Sale not found');
    }

    const sale = saleResult.rows[0];

    // Get sale items
    const itemsResult = await pool.query(
        `SELECT si.*, p.product_name, p.product_code,
                pv.sku as variant_sku, pv.variant_values
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         LEFT JOIN product_variants pv ON si.variant_id = pv.id
         WHERE si.sale_id = $1`,
        [saleId]
    );

    // Get receipt config
    const configResult = await pool.query(
        'SELECT * FROM receipt_config ORDER BY updated_at DESC LIMIT 1'
    );

    const config = configResult.rows.length > 0 ? configResult.rows[0] : {
        company_name: 'General BMS',
        footer_text: 'Thank you for your business!'
    };

    return {
        sale,
        items: itemsResult.rows,
        config
    };
};

/**
 * Generate PDF Receipt
 * NOTE: This is a placeholder. Actual PDF generation requires pdfkit or puppeteer
 */
const generateReceiptPDF = async (req, res) => {
    try {
        const { saleId } = req.params;

        const receiptData = await generateReceiptData(saleId);

        // TODO: Implement actual PDF generation using pdfkit or puppeteer
        // For now, return receipt data as JSON for frontend to handle
        res.json({
            message: 'Receipt data generated successfully',
            note: 'PDF generation requires pdfkit or puppeteer library installation',
            data: receiptData,
            pdf_url: null // Would contain PDF URL after generation
        });

        /*
        // Example implementation with pdfkit (to be implemented):
        const doc = new PDFDocument();
        const filename = `receipt-${receiptData.sale.sale_number}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Add company logo
        if (receiptData.config.show_logo && receiptData.config.company_logo_url) {
            doc.image(receiptData.config.company_logo_url, 50, 50, { width: 100 });
        }

        // Add company details
        doc.fontSize(20).text(receiptData.config.company_name, 50, 150);
        doc.fontSize(10).text(receiptData.config.company_address, 50, 180);

        // Add receipt details
        doc.fontSize(16).text('SALES RECEIPT', 200, 250);
        doc.fontSize(10).text(`Receipt No: ${receiptData.sale.sale_number}`, 50, 280);
        doc.text(`Date: ${new Date(receiptData.sale.created_at).toLocaleDateString()}`, 50, 295);

        // Add items table
        let y = 350;
        doc.fontSize(10).text('Item', 50, y);
        doc.text('Qty', 300, y);
        doc.text('Price', 370, y);
        doc.text('Total', 450, y);

        y += 20;
        receiptData.items.forEach(item => {
            doc.text(item.product_name, 50, y);
            doc.text(item.quantity.toString(), 300, y);
            doc.text(`$${item.unit_price}`, 370, y);
            doc.text(`$${item.subtotal}`, 450, y);
            y += 20;
        });

        // Add totals
        y += 20;
        doc.text(`Subtotal: $${receiptData.sale.subtotal}`, 350, y);
        doc.text(`Tax: $${receiptData.sale.tax_amount}`, 350, y + 15);
        doc.fontSize(12).text(`Total: $${receiptData.sale.total_amount}`, 350, y + 35);

        // Add footer
        doc.fontSize(10).text(receiptData.config.footer_text, 50, doc.page.height - 100, {
            align: 'center',
            width: 500
        });

        doc.end();
        */
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Receipt Data (for preview)
 */
const getReceiptData = async (req, res) => {
    try {
        const { saleId } = req.params;
        const receiptData = await generateReceiptData(saleId);

        res.json(receiptData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// RECEIPT DELIVERY
// ============================================================================

/**
 * Email Receipt
 * NOTE: Requires nodemailer configuration
 */
const emailReceipt = async (req, res) => {
    try {
        const { saleId } = req.params;
        const { email, subject, message } = req.body;

        const receiptData = await generateReceiptData(saleId);

        // TODO: Implement actual email sending using nodemailer
        // For now, return success message
        res.json({
            message: 'Email sending requires nodemailer configuration',
            note: 'Receipt would be sent to: ' + (email || receiptData.sale.customer_email),
            status: 'pending_implementation'
        });

        /*
        // Example implementation with nodemailer (to be implemented):
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Generate PDF attachment first (using above PDF generation)

        const mailOptions = {
            from: receiptData.config.company_email,
            to: email || receiptData.sale.customer_email,
            subject: subject || `Receipt for ${receiptData.sale.sale_number}`,
            html: `
                <h2>${receiptData.config.company_name}</h2>
                <p>${message || 'Thank you for your purchase!'}</p>
                <p>Receipt No: ${receiptData.sale.sale_number}</p>
                <p>Date: ${new Date(receiptData.sale.created_at).toLocaleDateString()}</p>
                <p>Total: $${receiptData.sale.total_amount}</p>
                <p>Please find your receipt attached.</p>
            `,
            attachments: [
                {
                    filename: `receipt-${receiptData.sale.sale_number}.pdf`,
                    content: pdfBuffer
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        res.json({
            message: 'Receipt sent successfully',
            email: email || receiptData.sale.customer_email
        });
        */
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * WhatsApp Receipt
 * NOTE: Requires WhatsApp API configuration (Green API or similar)
 */
const whatsappReceipt = async (req, res) => {
    try {
        const { saleId } = req.params;
        const { phone_number, message } = req.body;

        const receiptData = await generateReceiptData(saleId);

        const phoneToSend = phone_number || receiptData.sale.customer_phone;

        if (!phoneToSend) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // TODO: Implement actual WhatsApp sending
        res.json({
            message: 'WhatsApp sending requires Green API or similar service configuration',
            note: 'Receipt would be sent to: ' + phoneToSend,
            status: 'pending_implementation'
        });

        /*
        // Example implementation with WhatsApp API (to be implemented):
        const whatsappMessage = message || `
            *${receiptData.config.company_name}*

            Receipt No: ${receiptData.sale.sale_number}
            Date: ${new Date(receiptData.sale.created_at).toLocaleDateString()}

            Items:
            ${receiptData.items.map(item =>
                `${item.product_name} x${item.quantity} - $${item.subtotal}`
            ).join('\n')}

            Subtotal: $${receiptData.sale.subtotal}
            Tax: $${receiptData.sale.tax_amount}
            *Total: $${receiptData.sale.total_amount}*

            ${receiptData.config.footer_text}
        `;

        // Send WhatsApp message with PDF attachment
        await sendWhatsAppMessage(phoneToSend, whatsappMessage);

        res.json({
            message: 'Receipt sent via WhatsApp successfully',
            phone_number: phoneToSend
        });
        */
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Print Receipt
 * Returns formatted receipt data for thermal printer or browser print
 */
const printReceipt = async (req, res) => {
    try {
        const { saleId } = req.params;
        const receiptData = await generateReceiptData(saleId);

        // Format receipt for thermal printer (ESC/POS format)
        const thermalReceipt = {
            commands: [
                { type: 'align', value: 'center' },
                { type: 'text', value: receiptData.config.company_name, style: 'bold', size: 'large' },
                { type: 'text', value: receiptData.config.company_address },
                { type: 'text', value: receiptData.config.company_phone },
                { type: 'line' },
                { type: 'align', value: 'left' },
                { type: 'text', value: `Receipt: ${receiptData.sale.sale_number}` },
                { type: 'text', value: `Date: ${new Date(receiptData.sale.created_at).toLocaleString()}` },
                { type: 'text', value: `Cashier: ${receiptData.sale.salesperson_name}` },
                { type: 'line' },
                ...receiptData.items.map(item => ({
                    type: 'item',
                    name: item.product_name + (item.variant_sku ? ` (${item.variant_sku})` : ''),
                    quantity: item.quantity,
                    price: item.unit_price,
                    total: item.subtotal
                })),
                { type: 'line' },
                { type: 'total', label: 'Subtotal', value: receiptData.sale.subtotal },
                { type: 'total', label: 'Discount', value: receiptData.sale.discount_amount },
                { type: 'total', label: 'Tax', value: receiptData.sale.tax_amount },
                { type: 'total', label: 'TOTAL', value: receiptData.sale.total_amount, style: 'bold' },
                { type: 'line' },
                { type: 'text', value: `Payment: ${receiptData.sale.payment_method}` },
                { type: 'text', value: `Amount Paid: $${receiptData.sale.amount_paid}` },
                { type: 'line' },
                { type: 'align', value: 'center' },
                { type: 'text', value: receiptData.config.footer_text },
                { type: 'barcode', value: receiptData.sale.sale_number }
            ]
        };

        res.json({
            message: 'Receipt formatted for printing',
            thermal_receipt: thermalReceipt,
            receipt_data: receiptData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// RECEIPT TEMPLATES
// ============================================================================

/**
 * Get Available Receipt Templates
 */
const getReceiptTemplates = async (req, res) => {
    try {
        const templates = [
            {
                id: 'modern',
                name: 'Modern',
                description: 'Clean and modern design with bold headers',
                preview_url: null
            },
            {
                id: 'classic',
                name: 'Classic',
                description: 'Traditional receipt layout',
                preview_url: null
            },
            {
                id: 'minimal',
                name: 'Minimal',
                description: 'Minimalist design with essential information only',
                preview_url: null
            },
            {
                id: 'detailed',
                name: 'Detailed',
                description: 'Comprehensive receipt with all details',
                preview_url: null
            }
        ];

        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Receipt History for a Customer
 */
const getCustomerReceipts = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT s.id, s.sale_number, s.total_amount, s.payment_method, s.created_at,
                    b.branch_name
             FROM sales s
             JOIN branches b ON s.branch_id = b.id
             WHERE s.customer_id = $1 AND s.reversed_at IS NULL
             ORDER BY s.created_at DESC
             LIMIT $2 OFFSET $3`,
            [customerId, limit, offset]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    // Configuration
    getReceiptConfig,
    updateReceiptConfig,

    // Generation
    generateReceiptPDF,
    getReceiptData,

    // Delivery
    emailReceipt,
    whatsappReceipt,
    printReceipt,

    // Templates & History
    getReceiptTemplates,
    getCustomerReceipts
};
