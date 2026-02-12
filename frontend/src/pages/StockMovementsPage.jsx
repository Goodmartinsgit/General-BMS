import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Calendar, User, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const StockMovementsPage = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5000/api/inventory/movements';

    useEffect(() => {
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);
            setMovements(response.data);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMovementIcon = (type) => {
        switch (type) {
            case 'sale': return <ShoppingCart size={16} className="text-red-500" />;
            case 'receipt': return <RefreshCw size={16} className="text-green-500" />;
            default: return <AlertCircle size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Inventory Audit Trail</h2>
                <button
                    onClick={fetchMovements}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                    title="Refresh"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Product / Branch</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Qty Change</th>
                            <th className="px-6 py-4">Final Qty</th>
                            <th className="px-6 py-4">Performed By / Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading audit trail...</td>
                            </tr>
                        ) : movements.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">No movements recorded yet</td>
                            </tr>
                        ) : (
                            movements.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-500 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-900 font-medium">
                                            <Calendar size={14} className="text-gray-400" />
                                            {format(new Date(m.created_at), 'dd MMM yyyy')}
                                        </div>
                                        <div className="text-[10px] text-gray-500 ml-5">
                                            {format(new Date(m.created_at), 'HH:mm:ss')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{m.product_name}</div>
                                        <div className="text-xs text-gray-500">{m.branch_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 capitalize">
                                            {getMovementIcon(m.movement_type)}
                                            {m.movement_type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${parseInt(m.quantity) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {parseInt(m.quantity) > 0 ? '+' : ''}{m.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-gray-600">
                                        {m.quantity_after}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-700">
                                            <User size={14} className="text-gray-400" />
                                            {m.user_name || 'System'}
                                        </div>
                                        <div className="text-xs text-gray-400 italic">
                                            {m.notes || 'No notes'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockMovementsPage;
