import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * ReceiptTemplate Component
 * Printable receipt template for sales transactions
 */
const ReceiptTemplate = forwardRef(({
    sale,
    company = {},
    settings = {},
    showQR = true,
    size = 'standard' // 'standard', 'thermal', 'a4'
}, ref) => {
    const {
        sale_number,
        created_at,
        items = [],
        subtotal = 0,
        discount = 0,
        tax = 0,
        total = 0,
        amount_paid = 0,
        change = 0,
        payment_method = 'cash',
        customer_name,
        customer_phone,
        served_by,
        branch_name
    } = sale || {};

    const {
        company_name = 'General BMS Store',
        company_address = '',
        company_phone = '',
        company_email = '',
        tax_number = ''
    } = company;

    const {
        show_logo = true,
        header_text = '',
        footer_text = 'Thank you for your business!',
        show_tax_breakdown = true
    } = settings;

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount || 0).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const sizeClasses = {
        thermal: 'w-[80mm] text-xs',
        standard: 'w-[300px] text-sm',
        a4: 'w-full max-w-[600px] text-base'
    };

    return (
        <div
            ref={ref}
            className={`bg-white p-4 font-mono ${sizeClasses[size] || sizeClasses.standard}`}
            style={{ fontFamily: 'monospace' }}
        >
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                {show_logo && (
                    <div className="text-2xl font-bold mb-1">{company_name}</div>
                )}
                {company_address && (
                    <div className="text-xs text-gray-600">{company_address}</div>
                )}
                {company_phone && (
                    <div className="text-xs text-gray-600">Tel: {company_phone}</div>
                )}
                {company_email && (
                    <div className="text-xs text-gray-600">{company_email}</div>
                )}
                {tax_number && (
                    <div className="text-xs text-gray-600">Tax ID: {tax_number}</div>
                )}
                {header_text && (
                    <div className="text-xs mt-2 italic">{header_text}</div>
                )}
            </div>

            {/* Receipt Info */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span className="font-bold">{sale_number}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formatDate(created_at)}</span>
                </div>
                {branch_name && (
                    <div className="flex justify-between">
                        <span>Branch:</span>
                        <span>{branch_name}</span>
                    </div>
                )}
                {served_by && (
                    <div className="flex justify-between">
                        <span>Cashier:</span>
                        <span>{served_by}</span>
                    </div>
                )}
                {customer_name && (
                    <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{customer_name}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                <div className="font-bold mb-2">Items</div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-300">
                            <th className="text-left py-1">Item</th>
                            <th className="text-center py-1">Qty</th>
                            <th className="text-right py-1">Price</th>
                            <th className="text-right py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="py-1 pr-2">
                                    <div className="truncate max-w-[120px]">
                                        {item.product_name}
                                    </div>
                                    {item.variant_name && (
                                        <div className="text-xs text-gray-500">
                                            {item.variant_name}
                                        </div>
                                    )}
                                </td>
                                <td className="py-1 text-center">{item.quantity}</td>
                                <td className="py-1 text-right">{formatCurrency(item.unit_price)}</td>
                                <td className="py-1 text-right">{formatCurrency(item.quantity * item.unit_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(discount)}</span>
                    </div>
                )}
                {show_tax_breakdown && tax > 0 && (
                    <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(total)}</span>
                </div>
            </div>

            {/* Payment Info */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{payment_method?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(amount_paid || total)}</span>
                </div>
                {change > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Change:</span>
                        <span>{formatCurrency(change)}</span>
                    </div>
                )}
            </div>

            {/* QR Code */}
            {showQR && sale_number && (
                <div className="flex justify-center py-3 border-b border-dashed border-gray-400 mb-3">
                    <QRCodeSVG
                        value={`RECEIPT:${sale_number}`}
                        size={80}
                        level="M"
                    />
                </div>
            )}

            {/* Footer */}
            <div className="text-center">
                {footer_text && (
                    <div className="text-sm mb-2">{footer_text}</div>
                )}
                <div className="text-xs text-gray-500">
                    Powered by General BMS
                </div>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
