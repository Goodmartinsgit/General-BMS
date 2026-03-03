import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    DollarSign,
    Building2
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const EmployeeSalariesPage = () => {
    const { formatCurrency } = useCurrency();
    const [salaries, setSalaries] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        user_id: '',
        basic_salary: '',
        housing_allowance: '',
        transport_allowance: '',
        other_allowances: '',
        employee_pension_rate: '8',
        employer_pension_rate: '10',
        tax_rate: '0',
        bank_name: '',
        bank_account_number: '',
        payment_method: 'bank_transfer'
    };

    const [form, setForm] = useState(defaultForm);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [salariesRes, usersRes] = await Promise.all([
                api.get('/payroll/salaries'),
                api.get('/users')
            ]);
            setSalaries(salariesRes.data || []);
            setUsers(usersRes.data || []);
        } catch (error) {
            console.error('Error fetching salary data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedSalary(null);
        setForm(defaultForm);
        setIsModalOpen(true);
    };

    const handleEdit = (salary) => {
        setSelectedSalary(salary);
        setForm({
            user_id: salary.user_id || '',
            basic_salary: salary.basic_salary || '',
            housing_allowance: salary.housing_allowance || '',
            transport_allowance: salary.transport_allowance || '',
            other_allowances: salary.other_allowances || '',
            employee_pension_rate: salary.employee_pension_rate || '8',
            employer_pension_rate: salary.employer_pension_rate || '10',
            tax_rate: salary.tax_rate || '0',
            bank_name: salary.bank_name || '',
            bank_account_number: salary.bank_account_number || '',
            payment_method: salary.payment_method || 'bank_transfer'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this salary record?')) {
            try {
                await api.delete(`/payroll/salaries/${id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete salary record');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                basic_salary: parseFloat(form.basic_salary) || 0,
                housing_allowance: parseFloat(form.housing_allowance) || 0,
                transport_allowance: parseFloat(form.transport_allowance) || 0,
                other_allowances: parseFloat(form.other_allowances) || 0,
                employee_pension_rate: parseFloat(form.employee_pension_rate) || 0,
                employer_pension_rate: parseFloat(form.employer_pension_rate) || 0,
                tax_rate: parseFloat(form.tax_rate) || 0
            };

            if (selectedSalary) {
                await api.put(`/payroll/salaries/${selectedSalary.id}`, payload);
            } else {
                await api.post('/payroll/salaries', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save salary record');
        } finally {
            setSaving(false);
        }
    };

    const calculateGross = (salary) => {
        return parseFloat(salary.basic_salary || 0)
            + parseFloat(salary.housing_allowance || 0)
            + parseFloat(salary.transport_allowance || 0)
            + parseFloat(salary.other_allowances || 0);
    };

    const totalGross = salaries.reduce((sum, s) => sum + calculateGross(s), 0);

    const filteredSalaries = salaries.filter(s =>
        s.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const actions = (
        <button
            onClick={handleAdd}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Add Salary
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Employee Salaries"
                subtitle="Manage employee salary structures and payment details"
                badge={`${salaries.length} Employees`}
                icon={Users}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Employees</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{salaries.length}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Monthly Gross</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalGross)}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Avg. Gross Salary</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">
                            {salaries.length > 0 ? formatCurrency(totalGross / salaries.length) : formatCurrency(0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by employee name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Salaries Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Employee Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Basic Salary</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Housing</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Transport</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Other Allowances</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Gross</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Payment</th>
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
                            ) : filteredSalaries.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Users size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No salary records found</p>
                                                <p className="text-theme-muted text-sm mt-1">Add employee salary information to get started.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSalaries.map((salary) => (
                                    <tr key={salary.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">
                                                        {salary.employee_name || salary.user_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-theme-muted mt-0.5">
                                                        {salary.email || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-theme-primary">
                                            {formatCurrency(salary.basic_salary || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {formatCurrency(salary.housing_allowance || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {formatCurrency(salary.transport_allowance || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {formatCurrency(salary.other_allowances || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(calculateGross(salary))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
                                                {(salary.payment_method || 'bank_transfer').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(salary)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="Edit Salary"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(salary.id)}
                                                    className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete Salary"
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">
                                {selectedSalary ? 'Edit Salary Record' : 'Add Salary Record'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Employee Selection */}
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1.5">Employee</label>
                                <select
                                    value={form.user_id}
                                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    required
                                    disabled={!!selectedSalary}
                                >
                                    <option value="">Select Employee</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.full_name || u.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Salary Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Basic Salary</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.basic_salary}
                                        onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Housing Allowance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.housing_allowance}
                                        onChange={(e) => setForm({ ...form, housing_allowance: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Transport Allowance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.transport_allowance}
                                        onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Other Allowances</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.other_allowances}
                                        onChange={(e) => setForm({ ...form, other_allowances: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Rates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Employee Pension Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.employee_pension_rate}
                                        onChange={(e) => setForm({ ...form, employee_pension_rate: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="8"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Employer Pension Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.employer_pension_rate}
                                        onChange={(e) => setForm({ ...form, employer_pension_rate: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.tax_rate}
                                        onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Bank Name</label>
                                    <input
                                        type="text"
                                        value={form.bank_name}
                                        onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="Enter bank name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Account Number</label>
                                    <input
                                        type="text"
                                        value={form.bank_account_number}
                                        onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        placeholder="Enter account number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Payment Method</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    >
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mobile_money">Mobile Money</option>
                                    </select>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-theme text-theme-secondary rounded-lg font-medium text-sm hover:bg-theme-tertiary transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : selectedSalary ? 'Update Salary' : 'Add Salary'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeSalariesPage;
