import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Search, Filter, Clock, CheckCircle, Package, Truck, ChevronRight, Eye } from 'lucide-react';
import WholesaleOrderFormModal from '../components/WholesaleOrderFormModal';
import InvoicePrintModal from '../components/InvoicePrintModal';

const WholesaleOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/wholesale-orders`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`${API_URL}/wholesale-orders/${id}/status`, { status });
            fetchOrders();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const viewInvoice = async (id) => {
        try {
            const response = await axios.get(`${API_URL}/wholesale-orders/${id}`);
            setSelectedOrder(response.data);
            setIsInvoiceOpen(true);
        } catch (error) {
            alert('Failed to load invoice details');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-600';
            case 'Approved': return 'bg-blue-100 text-blue-600';
            case 'Packed': return 'bg-purple-100 text-purple-600';
            case 'Dispatched': return 'bg-indigo-100 text-indigo-600';
            case 'Completed': return 'bg-green-100 text-green-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Wholesale Order Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                    <ShoppingBag size={20} /> Create Wholesale Order
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order number or customer..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 italic">Syncing wholesale orders...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 italic bg-white rounded-xl border border-dashed">No wholesale orders recorded.</div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden">
                            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <div className="font-mono text-xs text-blue-500 font-bold">{order.order_number}</div>
                                        <div className="font-black text-gray-900 uppercase">{order.customer_name}</div>
                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Clock size={10} /> {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Order Value</div>
                                        <div className="text-lg font-black text-gray-900">₦{parseFloat(order.total_amount).toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-gray-400 mb-1">Workflow Status</div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 border-l pl-4">
                                    {order.status === 'Pending' && (
                                        <button onClick={() => updateStatus(order.id, 'Approved')} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition" title="Approve Order">
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    {order.status === 'Approved' && (
                                        <button onClick={() => updateStatus(order.id, 'Packed')} className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition" title="Mark as Packed">
                                            <Package size={18} />
                                        </button>
                                    )}
                                    {order.status === 'Packed' && (
                                        <button onClick={() => updateStatus(order.id, 'Dispatched')} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition" title="Dispatch Order">
                                            <Truck size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => viewInvoice(order.id)}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition"
                                    >
                                        <Eye size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <WholesaleOrderFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOrders}
            />

            <InvoicePrintModal 
                isOpen={isInvoiceOpen}
                onClose={() => setIsInvoiceOpen(false)}
                data={selectedOrder}
            />
        </div>
    );
};

export default WholesaleOrdersPage;
