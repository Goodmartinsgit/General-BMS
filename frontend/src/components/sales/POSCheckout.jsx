import React, { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { salesAPI } from '../../api/sales';
import { Button, Input } from '../ui';
import { toast } from 'react-toastify';
import { useCurrency } from '../../context/CurrencyContext';
import CustomerAutocomplete from './CustomerAutocomplete';
import ReferrerAutocomplete from './ReferrerAutocomplete';
import PaymentMethodSelector from './PaymentMethodSelector';
import { ReceiptPreviewModal } from '../receipt';

const POSCheckout = ({ onSaleComplete }) => {
    const {
        cartItems,
        customer,
        referrer,
        discount,
        setDiscount,
        getCartSubtotal,
        getCartTotal,
        clearCart
    } = useCart();
    const { auth } = useAuth();
    const { currentBranchId } = useBranch();
    const { formatCurrency, symbol } = useCurrency();

    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [completedSaleId, setCompletedSaleId] = useState(null);
    const [completedSaleInfo, setCompletedSaleInfo] = useState({});

    const subtotal = getCartSubtotal();
    const total = getCartTotal();
    const tax = 0;

    const handleCompleteSale = async () => {
        if (cartItems.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        setProcessing(true);
        try {
            const saleData = {
                branch_id: currentBranchId,
                customer_id: customer?.id || null,
                referrer_id: referrer?.id || null,
                items: cartItems.map(item => ({
                    product_id: item.product.id,
                    variant_id: item.variant?.id || null,
                    category_id: item.categoryId || null,
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal: subtotal,
                discount_amount: discount,
                tax_amount: tax,
                total_amount: total,
                payment_method: paymentMethod,
                amount_paid: total,
                notes: notes
            };

            const result = await salesAPI.createSale(saleData);
            toast.success(`Sale completed! #${result.saleNumber || result.sale_number}`);

            // Store sale ID and customer info for the receipt modal
            setCompletedSaleId(result.saleId || result.sale_id || result.id);
            setCompletedSaleInfo({
                receiptNumber: result.saleNumber || result.sale_number,
                customerName: customer?.customer_name || customer?.name || '',
                customerPhone: customer?.phone_number || customer?.phone || '',
                customerEmail: customer?.email || '',
                totalAmount: total,
                saleDate: new Date().toISOString(),
            });
            setShowReceipt(true);

            clearCart();
            setNotes('');
            if (onSaleComplete) onSaleComplete(result);
        } catch (error) {
            console.error('Sale error:', error);
            toast.error(error.response?.data?.message || 'Failed to complete sale');
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setCompletedSaleId(null);
        setCompletedSaleInfo({});
    };

    return (
        <div className="flex flex-col h-full bg-theme-secondary overflow-hidden">
            {/* Compact form fields — scrollable if content overflows */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 no-scrollbar">
                {/* Customer & Referrer — side by side */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-theme-muted mb-0.5 sm:mb-1">Customer</label>
                        <CustomerAutocomplete />
                    </div>
                    <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-theme-muted mb-0.5 sm:mb-1">Referrer</label>
                        <ReferrerAutocomplete />
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-theme-muted mb-1 sm:mb-1.5">Payment Method</label>
                    <PaymentMethodSelector
                        selectedMethod={paymentMethod}
                        onSelect={setPaymentMethod}
                    />
                </div>

                {/* Discount */}
                <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-theme-muted mb-0.5 sm:mb-1">Discount</label>
                    <div className="relative">
                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-theme-muted text-xs sm:text-sm">{symbol}</div>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 sm:pl-8 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none transition-all text-xs sm:text-sm text-theme-primary placeholder-theme-muted"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-theme-muted mb-0.5 sm:mb-1">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-xs sm:text-sm text-theme-primary transition-all resize-none placeholder-theme-muted"
                        placeholder="Add notes..."
                    />
                </div>
            </div>

            {/* Summary & Complete — always visible at bottom */}
            <div className="shrink-0 px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 pb-2 sm:pb-3 md:pb-4 bg-theme-primary border-t border-theme">
                <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-theme-muted">
                        <span>Subtotal</span>
                        <span className="text-theme-primary font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between items-center text-[10px] sm:text-xs text-rose-500">
                            <span>Discount</span>
                            <span>-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    <div className="h-px bg-theme"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-theme-secondary">Total</span>
                        <span className="text-lg sm:text-xl font-bold text-theme-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

                <button
                    disabled={processing || cartItems.length === 0}
                    onClick={handleCompleteSale}
                    className="w-full py-2 sm:py-2.5 md:py-3 bg-accent-gold hover:bg-accent-goldDark disabled:bg-theme-tertiary disabled:text-theme-muted text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                    {processing ? (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Complete Sale
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* Receipt Preview Modal — saleId-based */}
            <ReceiptPreviewModal
                isOpen={showReceipt}
                onClose={handleCloseReceipt}
                saleId={completedSaleId}
                receiptNumber={completedSaleInfo.receiptNumber}
                customerName={completedSaleInfo.customerName}
                customerPhone={completedSaleInfo.customerPhone}
                customerEmail={completedSaleInfo.customerEmail}
                totalAmount={completedSaleInfo.totalAmount}
                saleDate={completedSaleInfo.saleDate}
            />
        </div>
    );
};

export default POSCheckout;
