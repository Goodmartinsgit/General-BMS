import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Building } from 'lucide-react';
import BranchFormModal from '../components/BranchFormModal';

const BranchesPage = () => {
    const [branches, setBranches] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [branchesRes, orgsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/branches`),
                axios.get(`${API_URL}/branches/organizations`),
                axios.get(`${API_URL}/users`)
            ]);
            setBranches(branchesRes.data);
            setOrganizations(orgsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBranch = () => {
        setSelectedBranch(null);
        setIsModalOpen(true);
    };

    const handleEditBranch = (branch) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    const handleDeleteBranch = async (id) => {
        if (window.confirm('Are you sure you want to delete this branch?')) {
            try {
                await axios.delete(`${API_URL}/branches/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting branch:', error);
                alert('Failed to delete branch');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedBranch) {
                await axios.put(`${API_URL}/branches/${selectedBranch.id}`, formData);
            } else {
                await axios.post(`${API_URL}/branches`, formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving branch:', error);
            alert(error.response?.data?.message || 'Failed to save branch');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-theme-primary">Branch Management</h2>
                    <p className="text-theme-secondary text-sm">Manage your business locations</p>
                </div>
                <button
                    onClick={handleAddBranch}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} /> Add Branch
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-theme-muted">Loading branches...</div>
            ) : branches.length === 0 ? (
                <div className="bg-theme-secondary p-10 text-center rounded-2xl shadow-theme-sm border-2 border-dashed border-theme">
                    <Building className="mx-auto text-theme-muted mb-4" size={48} />
                    <p className="text-theme-muted">No branches found. Add your first location to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <div key={branch.id} className="bg-theme-secondary rounded-2xl shadow-theme-sm overflow-hidden border border-theme hover:shadow-theme-md transition-all group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${branch.is_warehouse ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'}`}>
                                            {branch.is_warehouse ? 'Warehouse' : 'Retail Branch'}
                                        </span>
                                        <h3 className="text-lg font-bold text-theme-primary mt-3">{branch.branch_name}</h3>
                                        <p className="text-sm text-theme-muted font-mono bg-theme-primary px-2 py-0.5 rounded-md inline-block mt-1 border border-theme">{branch.branch_code}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditBranch(branch)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm text-theme-secondary">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-theme-muted mt-0.5 flex-shrink-0" />
                                        <span>{branch.address}, {branch.city}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-theme-muted flex-shrink-0" />
                                        <span>{branch.phone_number || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail size={16} className="text-theme-muted flex-shrink-0" />
                                        <span>{branch.email || 'No email'}</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-theme text-xs flex justify-between items-center">
                                        <span className="text-theme-muted font-medium">Manager: <span className="text-theme-primary">{branch.manager_name || 'Unassigned'}</span></span>
                                        <span className={`flex items-center gap-1.5 font-bold ${branch.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {branch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <BranchFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                branch={selectedBranch}
                organizations={organizations}
                users={users}
            />
        </div>
    );
};

export default BranchesPage;
