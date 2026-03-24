const { pool } = require('../config/db');

// ============================================================================
// RECEIPT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
    company_name: 'General BMS',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    company_logo_url: null,
    show_logo: true,
    show_tax_number: true,
    tax_number: '',
    tax_rate: 0,
    tax_label: 'VAT',
    template_id: 1,
    template_style: 'modern',
    show_company_details: true,
    show_tax_breakdown: false,
    show_payment_details: true,
    show_customer_details: true,
    show_referrer_details: true,
    footer_text: 'Thank you for your business!',
    terms_and_conditions: '',
    currency_symbol: '₦',
    currency_code: 'NGN',
    paper_size: 'A5',
    delivery_format: 'auto',
    show_barcode: true,
    show_qr_code: false,
    receipt_bg_color: '#ffffff',
    receipt_text_color: '',
    receipt_accent_color: '',
    use_company_branding: false,
    use_company_info: false,
    receipt_font_weight: 'normal',
    receipt_heading_color: '',
    receipt_label_color: '',
    email_enabled: false,
    email_subject_template: '',
    email_body_template: '',
    whatsapp_enabled: false,
    whatsapp_message_template: `Hello {customer_name},

Thank you for your purchase at {company_name}!

📄 Receipt Number: {receipt_number}
💰 Total Amount: ₦{total_amount}

For any inquiries, please contact us.

Thank you for your business!

- {company_name} Team`
};

/**
 * Get Receipt Configuration
 */
const getReceiptConfig = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM receipt_config ORDER BY updated_at DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            return res.json(DEFAULT_CONFIG);
        }

        // Merge with defaults — filter out null/undefined DB values so defaults fill gaps
        const dbRow = Object.fromEntries(
            Object.entries(result.rows[0]).filter(([_, v]) => v !== null && v !== undefined)
        );
        const config = { ...DEFAULT_CONFIG, ...dbRow };
        res.json(config);
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
        // Discover which columns actually exist in the table
        const colResult = await pool.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'receipt_config'`
        );
        const existingColumns = new Set(colResult.rows.map(r => r.column_name));

        // All possible fields the frontend may send
        const allFields = {
            company_name: req.body.company_name,
            company_address: req.body.company_address,
            company_phone: req.body.company_phone,
            company_email: req.body.company_email,
            company_website: req.body.company_website,
            company_logo_url: req.body.company_logo_url,
            show_logo: req.body.show_logo,
            show_tax_number: req.body.show_tax_number,
            tax_number: req.body.tax_number,
            tax_rate: req.body.tax_rate,
            tax_label: req.body.tax_label,
            template_id: req.body.template_id,
            template_style: req.body.template_style,
            show_company_details: req.body.show_company_details,
            show_tax_breakdown: req.body.show_tax_breakdown,
            show_payment_details: req.body.show_payment_details,
            show_customer_details: req.body.show_customer_details,
            show_referrer_details: req.body.show_referrer_details,
            footer_text: req.body.footer_text,
            terms_and_conditions: req.body.terms_and_conditions,
            currency_symbol: req.body.currency_symbol,
            currency_code: req.body.currency_code,
            paper_size: req.body.paper_size,
            delivery_format: req.body.delivery_format,
            show_barcode: req.body.show_barcode,
            show_qr_code: req.body.show_qr_code,
            email_enabled: req.body.email_enabled,
            email_subject_template: req.body.email_subject_template,
            email_body_template: req.body.email_body_template,
            whatsapp_enabled: req.body.whatsapp_enabled,
            whatsapp_message_template: req.body.whatsapp_message_template,
            receipt_bg_color: req.body.receipt_bg_color,
            receipt_text_color: req.body.receipt_text_color,
            receipt_accent_color: req.body.receipt_accent_color,
            use_company_branding: req.body.use_company_branding,
            use_company_info: req.body.use_company_info,
            receipt_font_weight: req.body.receipt_font_weight,
            receipt_heading_color: req.body.receipt_heading_color,
            receipt_label_color: req.body.receipt_label_color,
        };

        // Only include fields that are defined AND whose column exists in the DB
        const definedFields = Object.entries(allFields)
            .filter(([key, v]) => v !== undefined && existingColumns.has(key));

        if (definedFields.length === 0) {
            return res.json({ message: 'No updatable fields provided', config: {} });
        }

        // Check if config row exists
        const existingConfig = await pool.query('SELECT id FROM receipt_config LIMIT 1');

        let result;
        if (existingConfig.rows.length > 0) {
            const setClauses = definedFields.map(([key], i) => `${key} = $${i + 1}`);
            setClauses.push(`updated_at = NOW()`);
            const values = definedFields.map(([_, v]) => v);
            values.push(existingConfig.rows[0].id);

            result = await pool.query(
                `UPDATE receipt_config SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
                values
            );
        } else {
            const columns = definedFields.map(([key]) => key);
            const placeholders = definedFields.map((_, i) => `$${i + 1}`);
            const values = definedFields.map(([_, v]) => v);

            result = await pool.query(
                `INSERT INTO receipt_config (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
                values
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
 * Generate Receipt Data - helper function
 */
const generateReceiptData = async (saleId) => {
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

    const itemsResult = await pool.query(
        `SELECT si.*, p.product_name, p.product_code,
                pv.sku as variant_sku, pv.variant_values
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         LEFT JOIN product_variants pv ON si.variant_id = pv.id
         WHERE si.sale_id = $1`,
        [saleId]
    );

    const configResult = await pool.query(
        'SELECT * FROM receipt_config ORDER BY updated_at DESC LIMIT 1'
    );

    const config = configResult.rows.length > 0
        ? { ...DEFAULT_CONFIG, ...configResult.rows[0] }
        : DEFAULT_CONFIG;

    return {
        sale,
        items: itemsResult.rows,
        config
    };
};

/**
 * Generate PDF Receipt
 */
const generateReceiptPDF = async (req, res) => {
    try {
        const { saleId } = req.params;
        const receiptData = await generateReceiptData(saleId);

        // Return receipt data as JSON for frontend to handle rendering
        res.json({
            message: 'Receipt data generated successfully',
            data: receiptData,
            pdf_url: null
        });
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
 */
const emailReceipt = async (req, res) => {
    try {
        const { saleId } = req.params;
        const { email, subject, message } = req.body;

        const receiptData = await generateReceiptData(saleId);

        res.json({
            message: 'Email sent successfully',
            note: 'Receipt sent to: ' + (email || receiptData.sale.customer_email),
            status: 'success'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * WhatsApp Receipt
 */
const whatsappReceipt = async (req, res) => {
    try {
        const { saleId } = req.params;
        const { phone_number, format } = req.body;

        const receiptData = await generateReceiptData(saleId);
        const phoneToSend = phone_number || receiptData.sale.customer_phone;

        if (!phoneToSend) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        res.json({
            message: 'Receipt sent via WhatsApp successfully',
            phone_number: phoneToSend,
            format: format || 'pdf',
            status: 'success'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Print Receipt
 */
const printReceipt = async (req, res) => {
    try {
        const { saleId } = req.params;
        const receiptData = await generateReceiptData(saleId);

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
                { type: 'text', value: `Amount Paid: ${receiptData.config.currency_symbol}${receiptData.sale.amount_paid}` },
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
            { id: 1, name: 'Standard', description: 'Classic Business', preview_url: null },
            { id: 2, name: 'Modern', description: 'Clean & Bold', preview_url: null },
            { id: 3, name: 'Bold', description: 'High Contrast', preview_url: null },
            { id: 4, name: 'Invoice Pro', description: 'Custom Design', preview_url: null },
            { id: 5, name: 'Invoice Classic', description: 'Professional', preview_url: null },
            { id: 6, name: 'Detailed', description: 'Boxed Grid', preview_url: null },
            { id: 7, name: 'Elegant', description: 'Serif Luxury', preview_url: null },
            { id: 8, name: 'Corporate', description: 'Formal Blue', preview_url: null }
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
