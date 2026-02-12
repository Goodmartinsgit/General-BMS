import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Search, Plus, Phone, Mail, MapPin, Edit, Trash2, Tag } from 'lucide-react';
import SupplierFormModal from '../components/SupplierFormModal';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = 'http://localhost:5000/api/suppliers';

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);
            setSuppliers(response.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchSuppliers();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Supply Chain Partners</h2>
                <button
                    onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-md"
                >
                    <Plus size={20} /> Add New Supplier
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search vendors by name or industry..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-400 italic">Finding vendors...</div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400 italic bg-white rounded-xl border border-dashed">No suppliers found.</div>
                ) : (
                    filteredSuppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group">
                            <div className="p-5 border-b bg-slate-50/50 group-hover:bg-slate-50 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{supplier.supplier_name}</h3>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold uppercase">
                                        {supplier.category || 'General'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                    <Edit size={14} className="text-gray-300" /> {supplier.contact_person || 'No contact person'}
                                </div>
                            </div>
                            <div className="p-5 space-y-3 flex-1">
                                <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition">
                                    <Phone size={14} className="text-slate-400" /> {supplier.phone_number || '---'}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition">
                                    <Mail size={14} className="text-slate-400" /> {supplier.email || '---'}
                                </div>
                                <div className="flex items-start gap-3 text-sm text-gray-600">
                                    <MapPin size={14} className="text-slate-400 mt-1 flex-shrink-0" /> 
                                    <span className="line-clamp-2">{supplier.address || 'No address specified'}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                                <button 
                                    onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded shadow-sm transition"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(supplier.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded shadow-sm transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <SupplierFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchSuppliers}
                supplier={editingSupplier}
            />
        </div>
    );
};

export default SuppliersPage;
