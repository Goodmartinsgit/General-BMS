import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { referrerAPI } from '../../api/referrers';
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

const ReferrerAutocomplete = () => {
    const { referrer, setReferrer } = useCart();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReferrers();
    }, []);

    const loadReferrers = async () => {
        setLoading(true);
        try {
            const data = await referrerAPI.getReferrers();
            setOptions(data.map(r => ({
                value: r.id,
                label: `${r.full_name} (${r.referrer_code})`,
                referrer: r
            })));
        } catch (error) {
            console.error('Error loading referrers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Select
            isClearable
            isLoading={loading}
            options={options}
            value={referrer ? { value: referrer.id, label: `${referrer.full_name} (${referrer.referrer_code})` } : null}
            onChange={(opt) => setReferrer(opt ? opt.referrer : null)}
            placeholder="Search referrers..."
            styles={selectStyles}
        />
    );
};

export default ReferrerAutocomplete;
