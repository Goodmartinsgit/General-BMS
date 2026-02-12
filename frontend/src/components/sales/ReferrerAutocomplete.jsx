import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Users } from 'lucide-react';
import { referrerAPI } from '../../api/referrers';
import { useCart } from '../../context/CartContext';

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
            const formattedOptions = data.map(r => ({
                value: r.id,
                label: `${r.full_name} (${r.referrer_code})`,
                referrer: r
            }));
            setOptions(formattedOptions);
        } catch (error) {
            console.error('Error loading referrers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (selectedOption) => {
        setReferrer(selectedOption ? selectedOption.referrer : null);
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
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Referrer (Optional)
            </label>
            <Select
                isClearable
                isLoading={loading}
                options={options}
                value={referrer ? { value: referrer.id, label: `${referrer.full_name} (${referrer.referrer_code})` } : null}
                onChange={handleChange}
                placeholder="Search referrers..."
                styles={customStyles}
                className="text-sm"
            />
        </div>
    );
};

export default ReferrerAutocomplete;
