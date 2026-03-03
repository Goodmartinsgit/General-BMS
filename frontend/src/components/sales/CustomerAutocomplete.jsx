import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { customerAPI } from '../../api/customers';
import { useCart } from '../../context/CartContext';

const selectStyles = {
    control: (base, state) => ({
        ...base,
        background: 'var(--color-bg-primary)',
        borderColor: state.isFocused ? 'var(--color-accent)' : 'var(--color-border)',
        borderRadius: '0.5rem',
        minHeight: '36px',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(212,175,55,0.2)' : 'none',
        '&:hover': { borderColor: 'var(--color-accent)' }
    }),
    menu: (base) => ({
        ...base,
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.5rem',
        zIndex: 9999
    }),
    option: (base, state) => ({
        ...base,
        background: state.isSelected
            ? 'var(--color-accent)'
            : state.isFocused ? 'var(--color-bg-tertiary)' : 'transparent',
        color: state.isSelected ? '#fff' : 'var(--color-text-primary)',
        fontSize: '0.8125rem'
    }),
    singleValue: (base) => ({ ...base, color: 'var(--color-text-primary)', fontSize: '0.8125rem' }),
    placeholder: (base) => ({ ...base, color: 'var(--color-text-muted)', fontSize: '0.8125rem' }),
    input: (base) => ({ ...base, color: 'var(--color-text-primary)', fontSize: '0.8125rem' }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    clearIndicator: (base) => ({ ...base, color: 'var(--color-text-muted)', padding: '4px' }),
    dropdownIndicator: (base) => ({ ...base, color: 'var(--color-text-muted)', padding: '4px' }),
    indicatorSeparator: () => ({ display: 'none' })
};

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
            setOptions(data.map(c => ({
                value: c.id,
                label: `${c.customer_name} (${c.phone_number || 'No phone'})`,
                customer: c
            })));
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Select
            isClearable
            isLoading={loading}
            options={options}
            value={customer ? { value: customer.id, label: `${customer.customer_name} (${customer.phone_number || 'No phone'})` } : null}
            onChange={(opt) => setCustomer(opt ? opt.customer : null)}
            placeholder="Search customers..."
            styles={selectStyles}
        />
    );
};

export default CustomerAutocomplete;
