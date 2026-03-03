import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Truck, Search, Plus, Phone, Mail, MapPin, Edit, Trash2, Download } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SupplierFormModal from '../components/SupplierFormModal';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSupplier = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleEditSupplier = (supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
            } catch (error) {
                alert('Failed to delete supplier');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save supplier');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const actions = (
        <>
            <button className="hidden sm:flex bg-theme-secondary border border-theme text-theme-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-theme-tertiary transition items-center gap-1.5 sm:gap-2">
                <Download size={14} className="sm:w-4 sm:h-4" /> Export
            </button>
            <button
                onClick={handleAddSupplier}
                className="bg-accent-gold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-accent-goldDark transition flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
            >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Supplier
            </button>
        </>
    );

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
            <PageHeader
                title="Suppliers"
                subtitle="Manage your supplier relationships"
                badge={`${suppliers.length} Suppliers`}
                icon={Truck}
                actions={actions}
            />

            {/* Search Bar */}
            <div className="bg-theme-secondary p-3 sm:p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-xs sm:text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase">Supplier</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase hidden md:table-cell">Contact</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase hidden lg:table-cell">Phone & Email</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase hidden xl:table-cell">Address</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-3 sm:px-6 py-4 sm:py-8">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-32 sm:w-48 h-3 sm:h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-24 sm:w-32 h-2 sm:h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-3 sm:px-6 py-12 sm:py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Truck size={24} className="sm:w-8 sm:h-8" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-sm sm:text-base md:text-lg">No suppliers found</p>
                                                <p className="text-theme-muted text-xs sm:text-sm mt-1">Try adjusting your search or add a new supplier.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg flex items-center justify-center">
                                                    <Truck size={16} className="sm:w-5 sm:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-theme-primary text-xs sm:text-sm truncate">{supplier.supplier_name}</div>
                                                    {supplier.payment_terms && (
                                                        <div className="text-[10px] sm:text-xs text-theme-muted mt-0.5 truncate">{supplier.payment_terms}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                            <div className="text-xs sm:text-sm text-theme-secondary">
                                                {supplier.contact_person || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-theme-secondary">
                                                    <Phone size={12} className="sm:w-3.5 sm:h-3.5 text-theme-muted" /> {supplier.phone_number || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-theme-muted">
                                                    <Mail size={12} className="sm:w-3.5 sm:h-3.5 text-theme-muted" /> {supplier.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                                            <div className="flex items-start gap-2 text-xs sm:text-sm text-theme-secondary">
                                                <MapPin size={12} className="sm:w-3.5 sm:h-3.5 text-theme-muted mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{supplier.address || 'No address'}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                            <div className="flex justify-end gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditSupplier(supplier)}
                                                    className="p-1.5 sm:p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="Edit Supplier"
                                                >
                                                    <Edit size={14} className="sm:w-4 sm:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-1.5 sm:p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete Supplier"
                                                >
                                                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SupplierFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                supplier={editingSupplier}
            />
        </div>
    );
};

export default SuppliersPage;
