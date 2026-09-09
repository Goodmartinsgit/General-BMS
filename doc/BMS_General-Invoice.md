Here is an exhaustive, technical, and operational deep-dive into the Invoice Generator & Receipt System of the General-Purpose Business Management System (BMS).

📄 BMS Invoice & Receipt Generator System
The Invoice & Receipt ecosystem in BMS is a multi-tier document engine that covers:

Customer Invoices (AP/AR & B2B Invoicing): Billing, credit sales, partial payments, and general ledger tracking.
Retail Sales Receipt Constructor (POS & Receipt Generator): Highly customizable, template-driven receipt generator for counter sales, thermal printing, digital PDF/image rendering, and multi-channel messaging (WhatsApp/Email).
Wholesale Order Invoices: Automated B2B order billing and dispatch document previews.
Accounting & General Ledger Integration: Automatic posting to Chart of Accounts (COA), Accounts Receivable (AR), and Cash Flow.
🛠️ System Architecture Diagram
mermaid
flowchart TD
    subgraph Sources ["Document Sources"]
        ManualInv["Manual Creation\n(InvoiceFormModal)"]
        SaleConv["Retail Sale Conversion\n(POST /api/invoices/from-sale)"]
        POSReceipt["POS Terminal Checkout\n(ReceiptRenderer)"]
        WholesaleInv["Wholesale Bulk Order\n(WholesaleDocumentService)"]
    end
    subgraph Engines ["Rendering & Processing Engines"]
        InvEngine["Invoice Core Engine\n(invoiceController.js)"]
        ReceiptEngine["Receipt Configurator & Template Renderer\n(receiptController.js & ReceiptRenderer.jsx)"]
    end
    subgraph Distribution ["Outputs & Distribution"]
        PDFPrint["Thermal / PDF / A4 Print\n(InvoicePrintModal / window.print)"]
        ImageGen["PNG / Canvas Render"]
        BackendPreview["Backend Live Preview\n(POST /api/receipts/preview-render)"]
        OmniChannel["Omnichannel Messaging\n(WhatsApp & Email Templates)"]
    end
    subgraph Accounting ["Financial System Integration"]
        ARLedger["Accounts Receivable (AR)"]
        GLAccounts["General Ledger (GL) Accounts"]
        CashFlow["Bank Channels & Cash Flow"]
    end
    ManualInv --> InvEngine
    SaleConv --> InvEngine
    POSReceipt --> ReceiptEngine
    WholesaleInv --> InvEngine
    InvEngine --> PDFPrint
    InvEngine --> ARLedger
    InvEngine --> GLAccounts
    ReceiptEngine --> PDFPrint
    ReceiptEngine --> ImageGen
    ReceiptEngine --> BackendPreview
    ReceiptEngine --> OmniChannel
    ReceiptEngine --> CashFlow
1. Customer Invoices (AP/AR & Billing Module)
Managed through InvoicesPage.jsx, 

invoiceController.js
, and 

InvoiceFormModal.jsx
.

1.1 Key Capabilities & Features
Automated Sequential Numbering: Invoice numbers are formatted dynamically as INV-YYYYMM-XXX (e.g., INV-202608-001), resetting increment counters per month.
Dual Creation Workflow:
Manual Entry: Create standalone invoices with line items, tax rates, custom descriptions, and assigned Chart of Accounts (GL) revenue accounts.
Sale Conversion: Instantly convert existing POS/Retail sales into official B2B customer invoices (POST /api/invoices/from-sale).
Line Item Calculations: Supports quantity, unit price, item subtotal, custom tax rate (VAT), and per-line item tax amounts.
Strict Status Lifecycle: draft $\rightarrow$ sent $\rightarrow$ partially_paid $\rightarrow$ paid (or overdue / cancelled).
Update & Deletion Rules: Safety controls restrict updates (PUT /api/invoices/:id) and deletions (DELETE /api/invoices/:id) strictly to invoices in draft status to preserve financial integrity.
Database Calculated Column Protection: The database table customer_invoices features a generated column for balances:
sql
balance_due GENERATED ALWAYS AS (total_amount - amount_paid) STORED
(Attempts to manually set balance_due in raw updates yield error 428C9; updates are handled cleanly by updating amount_paid and status).
1.2 Invoice Payment Recording Engine
Managed via 

InvoicePaymentModal.jsx
 and recordPayment in 

invoiceController.js
:

Supports partial and full customer payments.
Payment Validation: Validates that payment amount $> 0$ and $\le$ balance_due.
Database Updates: Inserts payment record into invoice_payments, increments amount_paid, recalculates balance_due, and updates invoice status (partially_paid or paid).
GL Posting: Links each payment directly to a selected Bank or Asset GL Account (gl_account_id).
1.3 Printable Invoice Layout (InvoicePrintModal.jsx)
Features a high-resolution, print-optimized document preview:

Header & Letterhead: Company name, branch information, corporate branding, and unique invoice barcode/number.
Billed From / Billed To: Displays branch physical address, customer name, contact phone, and email address.
Itemized Table: Detailed list of items, product codes, quantities, unit prices, line subtotals, tax breakdown, and total balance due.
Direct Print/PDF: Native browser print integration configured with CSS print rules (@media print) for clean paper outputs and PDF saving.
2. Retail Sales Receipt Generator (Receipt Constructor)
Driven by 

receiptController.js
, 

ReceiptSettingsPage.jsx
, and 

ReceiptRenderer.jsx
.

┌─────────────────────────────────────────────────────────────┐
│                 RECEIPT CONFIGURATOR PANEL                  │
├─────────────────────────────────────────────────────────────┤
│ • Layout Templates: Standard | Modern | Bold | Corporate    │
│ • Paper Sizes:      80mm Thermal | A4 | A5 | A6             │
│ • Delivery Format:  Auto Print | Manual Preview | PDF | PNG │
│ • Typography:       Font Sizes (Company, Items, Totals)     │
│ • Visual Color:     Bg Color, Accent Color, Auto-Contrast   │
│ • Toggles:          Logo | TIN | Barcode | QR Code | Terms  │
│ • Dynamic Preview:  Live Backend Render (POST /preview)    │
└─────────────────────────────────────────────────────────────┘
2.1 8 Built-In Design Templates
Standard (Classic clean receipt style)
Modern (Cyan accent header #00d4ff with sharp typography)
Bold (High contrast header #ff6b6b for prominent branding)
Invoice Pro (Professional green accent #52b788 for detailed invoicing)
Invoice Classic (Traditional corporate serif style #e07a5f)
Detailed (Detailed matrix breakdown #ffd166)
Elegant (Sleek minimalist style #ef233c)
Corporate (Gold/Dark formal business theme #fcbf49)
2.2 Paper Sizes & Output Delivery Formats
Paper Sizes:
80mm Thermal Roll (Standard Point of Sale receipt printer roll)
A4 Sheet (Standard Full Page Invoice)
A5 Half-Sheet (Medium Statement format)
A6 Compact (Mini slip format)
Delivery Formats (delivery_format):
auto: Automatically triggers the native print dialog upon completing a sale.
manual: Displays receipt on screen for manual review prior to printing.
pdf: Generates PDF documents for downloading or archiving.
image: Renders image files (PNG/JPEG) suitable for mobile messaging.
2.3 Visual Styling & Smart Auto-Contrast Engine
Color Customization: Custom pickers for background color (receipt_bg_color), text color (receipt_text_color), accent color (receipt_accent_color), heading color (receipt_heading_color), and label color (receipt_label_color).
Auto-Contrast Algorithm: Evaluates background hex colors using relative luminance formula to guarantee legibility: $$Y = 0.2126 R + 0.7152 G + 0.0722 B$$ Automatically switches text color between dark #111827 and light #f9fafb depending on background contrast.
Per-Category Font Size Controls: Independent font size overrides (in pixels) for:
company_name (Heading)
company_details (Address, phone, email, TIN)
receipt_info (Date, receipt #, cashier, customer)
items (Product descriptions, quantities, unit prices)
totals (Subtotal, discounts, tax)
total_highlight (Grand Total emphasis line)
payment (Paid amount, change due, payment channel)
footer (Custom notes & terms)
Branding Inheritance: Toggle use_company_branding and use_company_info to automatically import primary brand colors and company profiles from main System Settings.
2.4 Metadata & Component Toggles
Admins can toggle the display of individual receipt elements:

Company Logo & Information: Logo display switch, address, phone, email, website.
Tax Details: Tax Identification Number (TIN), VAT rate, and itemized tax breakdown.
Transaction Metadata: Cashier / Salesperson name, Branch location, Customer details, Referrer code.
Scannable Elements:
Barcode SVG: Renders standard transaction barcode (show_barcode).
QR Code SVG: Generates interactive QR code with receipt metadata or payment links (show_qr_code).
Footer Text & Terms: Configurable custom footer messages (e.g., "Thank you for your business!") and legal Terms & Conditions.
2.5 Live Backend Preview API
Endpoint: POST /api/receipts/preview-render
Renders real-time receipt previews directly from backend configuration settings, allowing live interactive visual testing in the Settings workspace before committing changes.
2.6 Omnichannel Distribution (WhatsApp & Email)
Integrates automated messaging for sending receipts directly to customers:

WhatsApp Messages: Configurable message templates with dynamic variable interpolation:
text
Hello {customer_name},
Thank you for your purchase at {company_name}!
📄 Receipt Number: {receipt_number}
💰 Total Amount: ₦{total_amount}
For any inquiries, please contact us.
Email Statements: Automated email dispatch with customized subjects and HTML body templates.
3. Wholesale Order Invoices
Integrated with the Wholesale Operations module (WholesaleOrdersPage.jsx, wholesaleOrderController.js):

B2B Bulk Invoice Generation: Generates official commercial invoices and delivery notes from loaded wholesale orders.
Lifecycle Synchronization: Transitions order status from loaded to Invoiced upon invoice generation/preview.
Automated Calculations: Calculates tier pricing, discounts, shipping fees, tax breakdowns, and updates customer credit ledgers automatically.
4. Financial & Accounting Ledger Integration
Every invoice generated and receipt issued in BMS updates the underlying financial infrastructure:

Accounts Receivable (AR): Customer credit invoices register entries in Accounts Receivable ledgers and feed into the AR Aging Report (30/60/90+ day overdue tracking).
General Ledger (GL): Invoices automatically log debit/credit entries across Sales Revenue accounts, VAT Tax Payable, and Cash/Bank accounts.
Cash Flow & Bank Channels: Cash sales post to Cash Flow immediately. POS / Bank Transfer sales require selection of a Bank Channel and progress through pending confirmation queues before posting final cash flow entries.
5. API Endpoints Reference Matrix
Method	Endpoint	Description	Permission Required
GET	/api/invoices	List customer invoices (supports filtering by status, customer, date range)	view_invoices
GET	/api/invoices/:id	Fetch detailed single invoice with line items & payment history	view_invoices
POST	/api/invoices	Create new customer invoice	manage_invoices
POST	/api/invoices/from-sale	Convert retail sale into customer invoice	manage_invoices
PUT	/api/invoices/:id	Update draft invoice details	manage_invoices
DELETE	/api/invoices/:id	Delete draft invoice	manage_invoices
POST	/api/invoices/:id/payments	Record payment against customer invoice	manage_invoices
GET	/api/receipts/config	Retrieve current receipt generator configuration	view_receipts
PUT	/api/receipts/config	Update receipt design, colors, templates, and settings	manage_receipts
POST	/api/receipts/preview-render	Render backend receipt preview	manage_receipts
GET	/api/receipts/sales/:saleId	Fetch full receipt rendering data for a specific sale	view_receipts
6. Primary Source Code Architecture
Backend Controllers:


backend/src/controllers/invoiceController.js
 (Invoice CRUD & payment logic)


backend/src/controllers/receiptController.js
 (Receipt configurator, preview API, data formatting)


backend/src/services/orderReceiptService.js
 (Order receipt helper service)
Frontend Pages & Components:


frontend/src/pages/InvoicesPage.jsx
 (Invoice management UI)


frontend/src/pages/ReceiptSettingsPage.jsx
 (Receipt constructor & live customizer)


frontend/src/components/InvoiceFormModal.jsx
 (Invoice creation modal)


frontend/src/components/InvoicePrintModal.jsx
 (Printable invoice preview document)


frontend/src/components/InvoicePaymentModal.jsx
 (Invoice payment recorder)


frontend/src/components/receipt/ReceiptRenderer.jsx
 (Template-aware receipt rendering engine)
9:56 PM, 8/17/2026

