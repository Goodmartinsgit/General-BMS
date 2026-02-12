import React, { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { salesAPI } from '../../api/sales';
import { Button, Input } from '../ui';
import { toast } from 'react-toastify';
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

    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [completedSale, setCompletedSale] = useState(null);

    const subtotal = getCartSubtotal();
    const total = getCartTotal();
    const tax = 0; // Tax logic can be added later

    const handleCompleteSale = async () => {
        if (cartItems.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        setProcessing(true);
        try {
            const saleData = {
                branch_id: auth.user.current_branch_id,
                customer_id: customer?.id || null,
                referrer_id: referrer?.id || null,
                items: cartItems.map(item => ({
                    product_id: item.product.id,
                    variant_id: item.variant?.id || null,
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

            // Prepare receipt data
            const receiptData = {
                sale_number: result.saleNumber || result.sale_number,
                created_at: new Date().toISOString(),
                items: cartItems.map(item => ({
                    product_name: item.product.product_name,
                    variant_name: item.variant?.variant_name,
                    quantity: item.quantity,
                    unit_price: item.price
                })),
                subtotal: subtotal,
                discount: discount,
                tax: tax,
                total: total,
                payment_method: paymentMethod,
                amount_paid: total,
                customer_name: customer?.customer_name || customer?.name,
                served_by: auth.user?.full_name,
                branch_name: auth.user?.branch_name
            };

            setCompletedSale(receiptData);
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
        setCompletedSale(null);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Checkout Terminal
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">Finalizing Transaction</p>
                </div>
                <button 
                    onClick={() => clearCart()}
                    className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
                {/* Customer & Referrer */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Affiliated Identity</label>
                        <CustomerAutocomplete />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Attribution Source</label>
                        <ReferrerAutocomplete />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Settlement Method</label>
                    <PaymentMethodSelector 
                        selectedMethod={paymentMethod} 
                        onSelect={setPaymentMethod} 
                    />
                </div>

                {/* Discounts & Notes */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Value Adjustments</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₦</div>
                            <input 
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all text-sm font-black"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Memo</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none text-sm font-medium min-h-[100px] transition-all resize-none"
                            placeholder="Type internal notes here..."
                        />
                    </div>
                </div>
            </div>

            {/* Summary & Terminal Execution */}
            <div className="p-8 bg-gray-950 text-white relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative space-y-3 mb-8">
                    <div className="flex justify-between items-center text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px]">
                        <span>Gross Subtotal</span>
                        <span className="text-gray-300">₦{subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between items-center text-rose-500 font-bold uppercase tracking-[0.2em] text-[9px]">
                            <span>Relief Applied</span>
                            <span>-₦{discount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="h-px bg-gray-800 my-4"></div>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Net Payable</div>
                            <div className="text-3xl font-black text-white tracking-tighter">₦{total.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Currency</div>
                             <div className="text-xs font-bold text-gray-400">NGN / NIRA</div>
                        </div>
                    </div>
                </div>

                <button
                    disabled={processing || cartItems.length === 0}
                    onClick={handleCompleteSale}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                    {processing ? (
                        <>
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <span className="uppercase tracking-widest text-sm">Processing...</span>
                        </>
                    ) : (
                        <>
                            <span className="uppercase tracking-widest text-sm">Authorize Settlement</span>
                            <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </>
                    )}
                </button>
            </div>

            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal
                isOpen={showReceipt}
                onClose={handleCloseReceipt}
                sale={completedSale}
                company={{
                    company_name: 'General BMS Store',
                    company_address: '',
                    company_phone: '',
                    company_email: ''
                }}
                settings={{
                    show_logo: true,
                    header_text: '',
                    footer_text: 'Thank you for your business!',
                    show_tax_breakdown: true
                }}
            />
        </div>
    );
};

export default POSCheckout;
