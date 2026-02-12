import React, { useState, useEffect } from 'react';
import { X, Truck, User, Mail, Phone, MapPin, Tag } from 'lucide-react';
import axios from 'axios';

const SupplierFormModal = ({ isOpen, onClose, onSuccess, supplier }) => {
    const [formData, setFormData] = useState({
        supplier_name: '',
        contact_person: '',
        email: '',
        phone_number: '',
        address: '',
        category: 'Wholesale'
    });

    const API_URL = 'http://localhost:5000/api/suppliers';

    useEffect(() => {
        if (supplier) {
            setFormData({
                supplier_name: supplier.supplier_name,
                contact_person: supplier.contact_person || '',
                email: supplier.email || '',
                phone_number: supplier.phone_number || '',
                address: supplier.address || '',
                category: supplier.category || 'Wholesale'
            });
        } else {
            setFormData({
                supplier_name: '',
                contact_person: '',
                email: '',
                phone_number: '',
                address: '',
                category: 'Wholesale'
            });
        }
    }, [supplier, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (supplier) {
                await axios.put(`${API_URL}/${supplier.id}`, formData);
            } else {
                await axios.post(API_URL, formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            alert('Failed to save supplier data');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Truck />
                        <h2 className="text-xl font-black">{supplier ? 'Edit Partner' : 'New Supply Partner'}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Name</label>
                            <input
                                type="text"
                                value={formData.supplier_name}
                                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                            >
                                <option value="Wholesale">Wholesale Vendor</option>
                                <option value="Manufacturer">Manufacturer</option>
                                <option value="Service Provider">Service Provider</option>
                                <option value="Individual">Individual Vendor</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</label>
                            <input
                                type="text"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Business Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                            rows="2"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition active:scale-95 mt-4 flex items-center justify-center gap-2"
                    >
                        {supplier ? 'SAVE MODIFICATIONS' : 'REGISTER SUPPLIER'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SupplierFormModal;
