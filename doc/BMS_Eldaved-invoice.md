Edited architecture_report.md
Edited README.md
Edited README.md
Edited README.md
Searched for "pdf"
Listed directory utils
Listed directory services
Listed directory services
Viewed receiptTemplates.js:1-100
Searched for "function renderTemplate"
Searched for "Template"
Viewed receiptTemplates.js:1850-1931
Viewed payslipTemplates.js:1580-1650
Viewed payslipTemplates.js:1650-1735
Viewed WholesaleDocumentService.ts:1-100
Viewed wholesaleDocumentTemplates.ts:1-100
Viewed wholesaleDocumentTemplates.ts:1500-1569
Viewed DocumentSettingsService.ts:1-80
Viewed ReceiptSettings.jsx:1-60
Viewed WholesaleDocumentSettings.jsx:1-60

# Comprehensive Architecture & Technical Report: Invoice & Document Generator System

The **Eldaved BMS** application features an enterprise-grade, dual-module PDF & Document Generator designed using **PDFKit** on Node.js. It operates across both the **Retail Module** and the **Wholesale Module**, supporting live real-time PDF previews (powered by PDF.js), modular multi-template engines, customizable typography/color tokens, and multi-format delivery options (PDF download, image preview, WhatsApp, and Email).

---

## 1. System Overview & Core Architecture

```
                                  +---------------------------------------+
                                  |           Document Engine             |
                                  |         (Node.js + PDFKit)            |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
          +------------------------------+                          +------------------------------+
          |    Retail Document Engine    |                          |  Wholesale Document Engine   |
          +--------------+---------------+                          +--------------+---------------+
                         |                                                         |
       +-----------------+-----------------+                     +-----------------+-----------------+
       |                 |                 |                     |                 |                 |
       v                 v                 v                     v                 v                 v
  POS Receipts      Sales Invoices      Payslips             Proforma Invoices    Final Invoices      Waybills & Receipts
 (8 Templates)     & Quotations       (5 Templates)         (8 Templates)       (8 Templates)       (Loading Sheets, etc.)
```

### Core Architecture Highlights:
1. **Streaming PDFKit Engine**: Documents are constructed in-memory using PDFKit stream buffers and returned directly to the browser as `application/pdf` streams or converted to previews.
2. **Hybrid Naira Symbol (₦) Renderer**: To eliminate font missing glyph crashes in PDFKit (which uses standard Type1 fonts like Helvetica), a custom vector drawing engine (`drawPrice`) draws standard text `'N'` combined with dual vector horizontal bar strokes (`doc.lineNo()`).
3. **Live PDF.js Frontend Preview**: Both settings pages (`ReceiptSettings.jsx` and `WholesaleDocumentSettings.jsx`) feature a side-by-side live document preview. When settings are tweaked, a debounced preview request calls the backend (`/api/receipts/preview-render` or `/api/wholesale/settings/documents/preview`), which executes full template rendering with dummy mock data and returns binary PDF blobs rendered on HTML5 canvas via PDF.js.
4. **Dynamic Company Branding Synchronization**: Documents can either dynamically inherit global branding tokens from `branding_config` (company logo, brand colors, company address, phone, email) or maintain isolated module-specific overrides via `use_company_info` toggles.

---

## 2. Retail Module Document & Invoice Generator

The Retail Document Generator handles all point-of-sale customer interactions, sales receipts, retail quotes, customer account statements, and employee payslips.

### A. Supported Retail Document Types
1. **Retail POS Sales Receipt & Invoice**: Standard thermal receipt (80mm) or paper invoice (A4 / A5 / A6) generated upon sale creation or sale lookup.
2. **Retail Quotation / Estimate**: Formal price quote for retail customers before purchasing.
3. **Retail Employee Payslip**: Monthly or periodic payroll document for employees (5 design choices).
4. **Customer Statement of Account**: Financial activity summary showing invoice transactions, payments, and outstanding balances over a date range.

---

### B. The 8 Signature Receipt & Invoice Templates (`receiptTemplates.js`)

The backend service `backend/src/services/receiptTemplates.js` provides 8 distinct visual templates:

| Template # | Name | Layout & Visual Style | Best Used For |
|---|---|---|---|
| **Template 1** | **Classic Standard** | Clean monochrome header, structured item list, solid totals banner | Thermal 80mm & standard A5 receipts |
| **Template 2** | **Modern Minimalist** | Ample whitespace, subtle divider lines, soft gray accents | Sleek modern boutiques & retail stores |
| **Template 3** | **Bold Accent Header** | Solid primary accent background header with white text, bold category highlights | High-impact branded receipts |
| **Template 4** | **Compact Dual-Column** | Space-efficient two-column layout for items and specifications | Short thermal prints and small paper sizes |
| **Template 5** | **Luxury Serif** | Elegant typography accents, detailed item borders, refined totals box | Premium tile collections & luxury products |
| **Template 6** | **Industrial Grid** | Boxed table grid layout with explicit vertical column dividers | Detailed item breakdowns & technical specs |
| **Template 7** | **Creative Graphic Accents** | Geometric colored corner accents and stylish totals callout box | Designer retail receipts |
| **Template 8** | **Modern Card Banner** | Card-style sections for customer, payment, and items with prominent total badge | Corporate retail receipts & invoices |

---

### C. Retail Configuration Schema (`receipt_config`)

Configured via `ReceiptSettings.jsx` and stored in `receipt_config`:

- **Template & Theme**: `template_id` (1–8), `template_theme` (custom colors vs preset themes like `black-white-gold`, `blue-slate`, etc.).
- **Paper & Format**: `paper_size` (`80mm`, `A4`, `A5`, `A6`), `delivery_format` (`auto`, `pdf`, `image`).
- **Display Toggles**:
  - `show_logo`, `logo_ratio_preset` (`small`, `medium`, `large`).
  - `show_company_details`, `show_customer_details`, `show_referrer_details`.
  - `show_payment_details`, `show_tax_breakdown`, `show_tax_number`.
  - `show_barcode`, `show_qr_code`.
- **Typography & Colors**:
  - Color hex codes: `bg_color`, `text_color`, `accent_color`, `heading_color`, `label_color`.
  - Font sizes: `font_sizes` (company name, details, receipt info, items, totals, total highlight, payment, footer).
  - Font weight: `font_weight` (`normal`, `bold`, `600`).
- **Footer & Messaging Templates**: `footer_text`, `footer_notes`, `terms_and_conditions`, `whatsapp_template`, `email_subject_template`, `email_body_template`.

---

### D. Retail Employee Payslips (`payslipTemplates.js`)

Retail and company-wide employee payslips offer 5 specialized designs (`backend/src/services/payslipTemplates.js`):

1. **Zoho Modern (Zylker Style)**: Split layout with Net Pay badge in a light green callout box on the right, employee summary on the left, and parallel Earnings vs Deductions tables.
2. **Payroll Hero Style**: Industrial dark header banner highlighting Net Pay, stacked details tables (Taxable, Non-Taxable, Contributions, Taxes), and YTD sidebar.
3. **Vertex Clean Style**: Clean grid table with parallel tables for Earnings (Standard, Overtime, Bonus) and Statutory Deductions (NHF, PAYE Tax, Pension).
4. **Zoho Classic Style**: Full-width tables for Earnings and Deductions ending with a highlighted Net Payable sentence.
5. **Bee Creative Style**: Modern designer layout with diagonal primary/secondary accent corner shapes, minimalist table grid, and Payer signature placeholder.

---

## 3. Wholesale Module Document & Invoice Generator

The Wholesale Module handles large-scale B2B commercial transactions, manufacturing company distributions, distributor tier pricing, delivery logistics, crate weights, and multi-step order workflows.

### A. Supported Wholesale Document Types
1. **Proforma Invoice**: Issued during order creation/confirmation (`draft`, `pending`, `confirmed`). Contains estimated weight (kg), price tier calculations, payment terms, and bank details.
2. **Tax Invoice / Commercial Final Invoice**: Issued once stock is assigned/loaded (`loaded`, `invoiced`, `dispatched`, `delivered`, `completed` or when payment is recorded). Contains official VAT breakdown, distributor credit balance, and final itemized total.
3. **Payment Receipt**: Issued upon recording distributor payments or order allocations. Details payment method, bank channel, amount paid, and remaining order/account balance.
4. **Delivery Note / Waybill**: Logistics document accompanying goods in transit. Includes driver details, vehicle registration number, dispatch location, delivery destination, crate counts, and sign-off blocks.
5. **Loading Sheet**: Warehouse picking document detailing total crates, tile pieces, weight per company/size, and warehouse loader signatures.
6. **Credit Note**: Documenting returns, order reversals, or distributor account balance credits.
7. **Wholesale Quotation**: Official price estimate for prospective B2B distributors.
8. **Distributor Statement of Account**: Comprehensive historical ledger of all order invoices, payment allocations, and running account balances.

---

### B. Wholesale Document Workflow & Order Status Rules

The `WholesaleDocumentService.ts` enforces strict lifecycle rules:

```
[Order Created] ---> Proforma Invoice Available
                           |
                     (Payment / Loading)
                           |
                           v
[Order Loaded / Paid] ---> Commercial Tax Invoice & Waybill Available
                           |
                           v
[Payment Recorded] ------> Official Payment Receipt Available
```

- **Proforma Invoice**: Allowed at any order stage (`draft` to `confirmed`).
- **Commercial Tax Invoice**: Guarded by `generateInvoice`. Allowed when:
  - Order status is `loaded`, `invoiced`, `dispatched`, `delivered`, or `completed`.
  - OR when payment status is `paid`, `partial`, or `credit` (payment recorded).

---

### C. The 8 Wholesale Document Templates (`wholesaleDocumentTemplates.ts`)

Wholesale document templates adapt retail designs for B2B multi-page A4 / Letter layouts:

- **Template 1 (Classic Corporate)**: Gold/dark accent header, full distributor details card, structured item table with tile size dimensions, sqft/sqm coverage, crate counts, unit pricing, line subtotals, VAT calculations, and bank transfer block.
- **Template 2 (Minimal B2B)**: Crisp lines, compact layout optimized for multi-item orders exceeding 20+ tile line items.
- **Template 3 (Bold Logistics)**: High-contrast header for quick visual identification by warehouse pickers and logistics drivers.
- **Template 4 (Dual-Column Spec)**: Split view emphasizing item specs (brand, company, size, weight kg) on the left and financial breakdown on the right.
- **Templates 5–8 (Luxury, Industrial Grid, Graphic Accent, Card Banner)**: Enterprise variants providing customized typography and company colors for formal distributor communication.

---

### D. Wholesale Configuration Schema (`wholesale_document_config`)

Managed via `WholesaleDocumentSettings.jsx` and `DocumentSettingsService.ts`:

- **Per-Document Type Template Selection**:
  - `proforma_template_id` (1–8)
  - `invoice_template_id` (1–8)
  - `receipt_template_id` (1–8)
  - `payslip_template_id` (1–5)
- **Per-Document Type Delivery Formats**:
  - `proforma_delivery_format` (`auto`, `pdf`, `image`)
  - `invoice_delivery_format` (`auto`, `pdf`, `image`)
  - `receipt_delivery_format` (`auto`, `pdf`, `image`)
  - `payslip_delivery_format` (`auto`, `pdf`, `image`)
- **Per-Document Type Display Options**:
  - `proforma_show_logo`, `proforma_show_company_details`, `proforma_show_customer_details`, `proforma_show_payment_details`, `proforma_footer_text`, `proforma_terms_and_conditions`.
  - `invoice_show_logo`, `invoice_show_company_details`, `invoice_show_customer_details`, `invoice_show_payment_details`, `invoice_footer_text`, `invoice_terms_and_conditions`.
  - `receipt_show_logo`, `receipt_show_company_details`, `receipt_show_customer_details`, `receipt_show_payment_details`, `receipt_footer_text`, `receipt_terms_and_conditions`.
- **Messaging & Notifications**: Dedicated WhatsApp & Email templates per document type with dynamic placeholders (`{customer_name}`, `{order_number}`, `{total_amount}`, `{balance_due}`, `{due_date}`, `{company_name}`).

---

## 4. Architectural Comparison: Retail vs Wholesale Document Generators

| Feature / Dimension | Retail Module Generator | Wholesale Module Generator |
|---|---|---|
| **Primary Focus** | POS transactions, fast receipts, walk-in customers | B2B distributor orders, credit terms, multi-page commercial invoices |
| **Document Types** | Receipt, Quotation, Customer Statement, Payslip | Proforma Invoice, Tax Invoice, Payment Receipt, Waybill, Loading Sheet, Credit Note, Payslip, Distributor Statement |
| **Paper Sizes** | Thermal 80mm, A5, A6, A4 | Standard A4, Letter, A5 |
| **Template Options** | 8 Receipt Templates + 5 Payslip Templates | 8 Wholesale Templates (configured independently per doc type) + 5 Payslip Templates |
| **Weight & Logistics Support** | N/A (Standard unit quantities) | Crate counts, sqm/sqft tile conversions, total weight in kg, vehicle & driver info |
| **Taxation Handling** | Single VAT toggle / breakdown | Multi-tier VAT tracking, internal VAT ledgers, tax exemptions |
| **Database Table** | `receipt_config` | `wholesale_document_config` |
| **Service Implementation** | `receiptService.js`, `receiptTemplates.js`, `pdfGenerator.js` | `WholesaleDocumentService.ts`, `wholesaleDocumentTemplates.ts`, `DocumentSettingsService.ts`, `PDFService.ts` |
| **Controller File** | `receiptController.js` | `documentSettingsController.js`, `wholesaleOrderController.js` |
| **Frontend Settings Page** | [ReceiptSettings.jsx](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/frontend/src/pages/receipts/ReceiptSettings.jsx) | [WholesaleDocumentSettings.jsx](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/frontend/src/pages/wholesale/WholesaleDocumentSettings.jsx) |

---

## 5. Complete Code File Map

### Backend (Retail & Shared Core)
- [receiptTemplates.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/services/receiptTemplates.js) — 8 Retail receipt PDFKit template layout functions.
- [receiptService.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/services/receiptService.js) — Retail receipt data formatting and configuration lookup.
- [receiptController.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/controllers/receiptController.js) — Handlers for fetching config, updating settings, and rendering live PDF previews (`/api/receipts/preview-render`).
- [payslipTemplates.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/services/payslipTemplates.js) — 5 Payroll payslip PDFKit layout implementations.
- [payslipPDFGenerator.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/utils/payslipPDFGenerator.js) — PDF execution wrapper for employee payslips.
- [pdfGenerator.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/utils/pdfGenerator.js) — Customer statements, sales reports, and referral transaction PDF generation.

### Backend (Wholesale Module)
- [WholesaleDocumentService.ts](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/modules/wholesale/services/WholesaleDocumentService.ts) — Wholesale PDF generation orchestrator (`generateProformaInvoice`, `generateInvoice`, `generateReceipt`, etc.).
- [wholesaleDocumentTemplates.ts](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/modules/wholesale/services/wholesaleDocumentTemplates.ts) — 8 Wholesale PDFKit document layout functions.
- [DocumentSettingsService.ts](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/modules/wholesale/services/DocumentSettingsService.ts) — Database persistence & dynamic table creation for `wholesale_document_config`.
- [PDFService.ts](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/modules/wholesale/services/PDFService.ts) — Base PDFKit streaming utilities and layout helpers for wholesale documents.
- [documentSettingsController.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/backend/src/controllers/wholesale/documentSettingsController.js) — HTTP controllers for wholesale document settings and live PDF preview endpoints (`/api/wholesale/settings/documents/preview`).

### Frontend (User Interface & Previews)
- [ReceiptSettings.jsx](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/frontend/src/pages/receipts/ReceiptSettings.jsx) — Admin page for retail receipt & retail payslip template selection, color picker, display toggles, and live PDF.js preview canvas.
- [WholesaleDocumentSettings.jsx](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/frontend/src/pages/wholesale/WholesaleDocumentSettings.jsx) — Admin page for wholesale proforma, invoice, receipt, and payslip settings with live preview.
- [receipts.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/frontend/src/api/receipts.js) — Frontend API client for retail receipt endpoints.
- [documentSettings.js](file:///c:/Users/DELL%20XPS/Desktop/BMS/Eldaved-BMS/frontend/src/api/wholesale/documentSettings.js) — Frontend API client for wholesale document configuration endpoints.