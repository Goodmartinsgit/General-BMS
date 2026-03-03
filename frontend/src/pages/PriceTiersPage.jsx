import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, Tag, Percent, Info, Layers } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PriceTierFormModal from '../components/PriceTierFormModal';

const PriceTiersPage = () => {
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState(null);

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/price-tiers');
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
                await api.delete(`/price-tiers/${id}`);
                fetchTiers();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete tier');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedTier) {
                await api.put(`/price-tiers/${selectedTier.id}`, formData);
            } else {
                await api.post('/price-tiers', formData);
            }
            setIsModalOpen(false);
            fetchTiers();
        } catch (error) {
            alert('Failed to save tier');
        }
    };

    const activeTiers = tiers.filter(t => t.is_active).length;
    const avgDiscount = tiers.length > 0
        ? (tiers.reduce((sum, t) => sum + parseFloat(t.discount_percentage || 0), 0) / tiers.length).toFixed(1)
        : 0;

    const actions = (
        <button
            onClick={handleAddTier}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Add Tier
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Price Tiers"
                subtitle="Manage discount tiers and pricing strategies for customers"
                badge={`${tiers.length} Tiers`}
                icon={Layers}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <Layers size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Tiers</div>
                        <div className="text-2xl font-semibold text-theme-primary">{tiers.length}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <Tag size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Active Tiers</div>
                        <div className="text-2xl font-semibold text-theme-primary">{activeTiers}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <Percent size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Avg. Discount</div>
                        <div className="text-2xl font-semibold text-theme-primary">{avgDiscount}%</div>
                    </div>
                </div>
            </div>

            {/* Tiers Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                                <div className="h-5 w-32 bg-theme-tertiary rounded"></div>
                            </div>
                            <div className="h-8 w-24 bg-theme-tertiary rounded mb-4"></div>
                            <div className="h-4 w-full bg-theme-tertiary rounded mb-2"></div>
                            <div className="h-4 w-2/3 bg-theme-tertiary rounded"></div>
                        </div>
                    ))}
                </div>
            ) : tiers.length === 0 ? (
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <Layers className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">No Price Tiers Yet</h3>
                    <p className="text-theme-muted mb-6">Create your first pricing tier to offer discounts to customers</p>
                    <button
                        onClick={handleAddTier}
                        className="bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Tier
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <div key={tier.id} className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm hover:shadow-theme-md transition-shadow flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-accent-gold/10 text-accent-gold rounded-lg border border-accent-gold/20">
                                            <Tag size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-theme-primary">{tier.tier_name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditTier(tier)}
                                            className="p-1.5 text-theme-muted hover:text-accent-gold hover:bg-theme-tertiary rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTier(tier.id)}
                                            className="p-1.5 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-1 my-4">
                                    <span className="text-3xl font-bold text-theme-primary">{tier.discount_percentage}%</span>
                                    <span className="text-sm font-medium text-theme-muted ml-1">discount</span>
                                </div>

                                <p className="text-sm text-theme-muted line-clamp-2">
                                    {tier.notes || 'No description provided'}
                                </p>
                            </div>

                            <div className="px-6 py-4 border-t border-theme flex justify-between items-center">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                    tier.is_active
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                }`}>
                                    {tier.is_active ? 'Active' : 'Paused'}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-theme-muted">
                                    <Info size={12} /> Assigned to customers
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
