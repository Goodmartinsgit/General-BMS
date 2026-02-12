import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Tag, Percent, Info } from 'lucide-react';
import PriceTierFormModal from '../components/PriceTierFormModal';

const PriceTiersPage = () => {
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState(null);

    const API_URL = 'http://localhost:5000/api/price-tiers';

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);
            setTiers(response.data);
        } catch (error) {
            console.error('Error fetching tiers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTier = () => {
        setSelectedTier(null);
        setIsModalOpen(true);
    };

    const handleEditTier = (tier) => {
        setSelectedTier(tier);
        setIsModalOpen(true);
    };

    const handleDeleteTier = async (id) => {
        if (window.confirm('Are you sure? This cannot be undone if the tier is used.')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchTiers();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete tier');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedTier) {
                await axios.put(`${API_URL}/${selectedTier.id}`, formData);
            } else {
                await axios.post(API_URL, formData);
            }
            setIsModalOpen(false);
            fetchTiers();
        } catch (error) {
            alert('Failed to save tier');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Price Hierarchy</h2>
                <button
                    onClick={handleAddTier}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Add Tier
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading tiers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <div key={tier.id} className="bg-white rounded-xl shadow border p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                            <Tag size={20} />
                                        </div>
                                        <h3 className="text-lg font-bold">{tier.tier_name}</h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEditTier(tier)} className="p-1 text-gray-400 hover:text-blue-600">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteTier(tier.id)} className="p-1 text-gray-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-2xl font-black text-gray-900 my-4">
                                    <Percent size={24} className="text-blue-500" />
                                    {tier.discount_percentage}% <span className="text-sm font-normal text-gray-400 ml-1">OFF</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 italic mb-4">
                                    {tier.notes || 'No description provided'}
                                </p>
                            </div>
                            <div className="pt-4 border-t flex justify-between items-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${tier.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {tier.is_active ? 'Active Strategy' : 'Paused'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Info size={12} /> Applies to assigned customers
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PriceTierFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                tier={selectedTier}
            />
        </div>
    );
};

export default PriceTiersPage;
