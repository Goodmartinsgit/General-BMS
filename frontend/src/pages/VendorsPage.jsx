import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Truck, Search, Plus, Phone, Mail, Edit, Trash2, Download, DollarSign } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import VendorFormModal from '../components/VendorFormModal';
import { useCurrency } from '../context/CurrencyContext';

const VendorsPage = () => {
    const { formatCurrency } = useCurrency();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/vendors');
            setVendors(response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVendor = () => {
        setEditingVendor(null);
        setIsModalOpen(true);
    };

    const handleEditVendor = (vendor) => {
        setEditingVendor(vendor);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                await api.delete(`/vendors/${id}`);
                fetchVendors();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete vendor');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (editingVendor) {
                await api.put(`/vendors/${editingVendor.id}`, formData);
            } else {
                await api.post('/vendors', formData);
            }
            setIsModalOpen(false);
            fetchVendors();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save vendor');
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeBadge = (type) => {
        switch (type) {
            case 'supplier': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
            case 'service_provider': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
            case 'contractor': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
        }
    };

    const formatType = (type) => {
        if (!type) return 'Other';
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const actions = (
        <>
            <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
                <Download size={16} /> Export
            </button>
            <button
                onClick={handleAddVendor}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Vendor
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Vendors"
                subtitle="Manage your vendor and supplier relationships"
                badge={`${vendors.length} Vendors`}
                icon={Truck}
                actions={actions}
            />

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search vendors by name, code, contact person, or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Code</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Contact</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Phone</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Balance</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="8" className="px-6 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-48 h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-32 h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Truck size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No vendors found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your search or add a new vendor.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono text-theme-muted">{vendor.code || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg flex items-center justify-center">
                                                    <Truck size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">{vendor.name}</div>
                                                    {vendor.city && (
                                                        <div className="text-xs text-theme-muted mt-0.5">{vendor.city}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getTypeBadge(vendor.type)}`}>
                                                {formatType(vendor.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-theme-secondary">{vendor.contact_person || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                <Phone size={14} className="text-theme-muted" /> {vendor.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                <Mail size={14} className="text-theme-muted" /> {vendor.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <DollarSign size={14} className="text-theme-muted" />
                                                <span className="text-sm font-semibold text-theme-primary">
                                                    {formatCurrency(vendor.balance || 0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditVendor(vendor)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="Edit Vendor"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vendor.id)}
                                                    className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete Vendor"
                                                >
                                                    <Trash2 size={16} />
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

            <VendorFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                vendor={editingVendor}
            />
        </div>
    );
};

export default VendorsPage;
