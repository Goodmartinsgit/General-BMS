import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { User, Plus } from 'lucide-react';
import { customerAPI } from '../../api/customers';
import { useCart } from '../../context/CartContext';
import { Button } from '../ui';

const CustomerAutocomplete = () => {
    const { customer, setCustomer } = useCart();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await customerAPI.getCustomers();
            const formattedOptions = data.map(c => ({
                value: c.id,
                label: `${c.customer_name} (${c.phone_number || 'No phone'})`,
                customer: c
            }));
            setOptions(formattedOptions);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (selectedOption) => {
        setCustomer(selectedOption ? selectedOption.customer : null);
    };

    const customStyles = {
        control: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            borderColor: '#e5e7eb',
            padding: '2px',
            '&:hover': {
                borderColor: '#3b82f6'
            }
        })
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Customer
                </label>
                <Button size="xs" variant="ghost" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                    <Plus className="w-3 h-3 mr-1" />
                    New
                </Button>
            </div>
            <Select
                isClearable
                isLoading={loading}
                options={options}
                value={customer ? { value: customer.id, label: `${customer.customer_name} (${customer.phone_number || 'No phone'})` } : null}
                onChange={handleChange}
                placeholder="Search customers..."
                styles={customStyles}
                className="text-sm"
            />
        </div>
    );
};

export default CustomerAutocomplete;
