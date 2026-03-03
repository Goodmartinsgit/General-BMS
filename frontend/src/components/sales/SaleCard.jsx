import React from 'react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CheckCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

const SaleCard = ({ sale, onClick }) => {
    const { formatCurrency } = useCurrency();
    const isReversed = !!sale.reversed_at;

    const getStatusStyles = () => {
        if (isReversed) return 'bg-rose-50 text-rose-700 border-rose-100';
        if (sale.status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        return 'bg-blue-50 text-blue-700 border-blue-100';
    };

    return (
        <div 
            onClick={() => onClick(sale)}
            className="group bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 cursor-pointer relative overflow-hidden active:scale-95"
        >
            {/* Status Indicator Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isReversed ? 'bg-rose-500' : 'bg-blue-600'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            
            <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-mono font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-tighter">
                    {sale.sale_number}
                </span>
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest ${getStatusStyles()}`}>
                    {isReversed ? 'Reversed' : sale.status}
                </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-500 border border-transparent group-hover:border-blue-100">
                    <User className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="min-w-0">
                    <div className="font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate text-sm">
                        {sale.customer_name || 'Anonymous Client'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {format(new Date(sale.created_at), 'MMM dd • HH:mm')}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                    {sale.payment_method}
                </div>
                <div className="text-xl font-black text-gray-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                    {formatCurrency(sale.total_amount)}
                </div>
            </div>
        </div>
    );
};

export default SaleCard;
