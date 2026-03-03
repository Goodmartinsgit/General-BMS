import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShoppingBag, Search, Filter, Clock, CheckCircle, Package, Truck, ChevronRight, Eye, RefreshCw } from 'lucide-react';
import WholesaleOrderFormModal from '../components/WholesaleOrderFormModal';
import InvoicePrintModal from '../components/InvoicePrintModal';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';

const WholesaleOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/wholesale-orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load wholesale orders');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/wholesale-orders/${id}/status`, { status });
            toast.success('Order status updated successfully');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const viewInvoice = async (id) => {
        try {
            const response = await api.get(`/wholesale-orders/${id}`);
            setSelectedOrder(response.data);
            setIsInvoiceOpen(true);
        } catch (error) {
            toast.error('Failed to load invoice details');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return {
                bg: 'bg-orange-50 dark:bg-orange-900/30',
                text: 'text-orange-600 dark:text-orange-400',
                border: 'border-orange-100 dark:border-orange-800'
            };
            case 'Approved': return {
                bg: 'bg-blue-50 dark:bg-blue-900/30',
                text: 'text-blue-600 dark:text-blue-400',
                border: 'border-blue-100 dark:border-blue-800'
            };
            case 'Packed': return {
                bg: 'bg-purple-50 dark:bg-purple-900/30',
                text: 'text-purple-600 dark:text-purple-400',
                border: 'border-purple-100 dark:border-purple-800'
            };
            case 'Dispatched': return {
                bg: 'bg-indigo-50 dark:bg-indigo-900/30',
                text: 'text-indigo-600 dark:text-indigo-400',
                border: 'border-indigo-100 dark:border-indigo-800'
            };
            case 'Completed': return {
                bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                text: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-100 dark:border-emerald-800'
            };
            default: return {
                bg: 'bg-gray-50 dark:bg-gray-900/30',
                text: 'text-gray-600 dark:text-gray-400',
                border: 'border-gray-100 dark:border-gray-800'
            };
        }
    };

    const actions = (
        <>
            <button
                onClick={fetchOrders}
                className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <ShoppingBag className="w-4 h-4" /> Create Order
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Wholesale Orders"
                subtitle="Manage bulk orders and B2B transactions"
                badge={`${orders.length} Orders`}
                icon={ShoppingBag}
                actions={actions}
            />

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by order number or customer..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border border-theme">
                    <div className="w-12 h-12 border-4 border-theme-muted border-t-accent-gold rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-theme-muted text-sm">Loading wholesale orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-theme-secondary p-20 text-center rounded-lg shadow-theme-sm border-2 border-dashed border-theme">
                    <ShoppingBag className="mx-auto text-theme-muted mb-4" size={48} />
                    <p className="font-bold text-theme-primary text-lg">No Wholesale Orders</p>
                    <p className="text-theme-muted text-sm mt-1">Create your first wholesale order to get started</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                    >
                        <ShoppingBag className="w-4 h-4" /> Create Order
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => {
                        const statusConfig = getStatusStyle(order.status);
                        return (
                            <div key={order.id} className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm hover:shadow-theme-md transition overflow-hidden">
                                <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-mono text-xs text-accent-gold font-bold mb-0.5">{order.order_number}</div>
                                            <div className="font-bold text-theme-primary">{order.customer_name}</div>
                                            <div className="text-[10px] text-theme-muted flex items-center gap-1.5 mt-1">
                                                <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase font-bold text-theme-muted mb-1">Order Value</div>
                                            <div className="text-xl font-bold text-accent-gold">&#8358;{parseFloat(order.total_amount).toLocaleString()}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] uppercase font-bold text-theme-muted mb-2">Status</div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-l border-theme pl-4">
                                        {order.status === 'Pending' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'Approved')}
                                                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                                                title="Approve Order"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {order.status === 'Approved' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'Packed')}
                                                className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition-colors"
                                                title="Mark as Packed"
                                            >
                                                <Package size={18} />
                                            </button>
                                        )}
                                        {order.status === 'Packed' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'Dispatched')}
                                                className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors"
                                                title="Dispatch Order"
                                            >
                                                <Truck size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => viewInvoice(order.id)}
                                            className="p-2 text-theme-muted hover:text-accent-gold transition-colors rounded-lg hover:bg-theme-primary"
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
