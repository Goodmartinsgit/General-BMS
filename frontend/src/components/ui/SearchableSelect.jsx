import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

/**
 * SearchableSelect — filterable dropdown for long option lists.
 *
 * Props:
 *   value        – currently selected value
 *   onChange(val) – callback when selection changes
 *   options       – flat: [{ value, label }]  or grouped: [{ group, items: [{ value, label }] }]
 *   placeholder   – placeholder when nothing is selected
 *   searchPlaceholder – placeholder inside the search box
 *   className     – extra wrapper classes
 */
const SearchableSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    className = '',
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);

    // Detect grouped vs flat
    const isGrouped = options.length > 0 && 'group' in options[0];

    // Flatten for lookup
    const flatOptions = useMemo(() => {
        if (isGrouped) return options.flatMap(g => g.items);
        return options;
    }, [options, isGrouped]);

    // Current display label
    const selectedOption = flatOptions.find(o => o.value === value);
    const displayLabel = selectedOption?.label || placeholder;

    // Filtered options
    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return options;
        if (isGrouped) {
            return options
                .map(g => ({
                    ...g,
                    items: g.items.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)),
                }))
                .filter(g => g.items.length > 0);
        }
        return options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
    }, [options, query, isGrouped]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search when opening
    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    // Scroll selected into view when opening
    useEffect(() => {
        if (open && listRef.current && value) {
            const el = listRef.current.querySelector(`[data-value="${CSS.escape(value)}"]`);
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [open, value]);

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
        setQuery('');
    };

    const renderOption = (opt) => {
        const isActive = opt.value === value;
        return (
            <button
                key={opt.value}
                type="button"
                data-value={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    isActive
                        ? 'bg-accent-gold/10 text-accent-gold font-medium'
                        : 'text-theme-primary hover:bg-theme-tertiary'
                }`}
            >
                <span className="flex-1 truncate">{opt.label}</span>
                {isActive && <Check size={14} className="flex-shrink-0 text-accent-gold" />}
            </button>
        );
    };

    const hasResults = isGrouped ? filtered.length > 0 : filtered.length > 0;

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all cursor-pointer"
            >
                <span className="flex-1 text-left truncate">{displayLabel}</span>
                <ChevronDown size={15} className={`flex-shrink-0 text-theme-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-theme-secondary border border-theme rounded-xl shadow-lg overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-theme">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-8 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all"
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                        {!hasResults && (
                            <p className="text-sm text-theme-muted text-center py-4">No results found</p>
                        )}
                        {isGrouped
                            ? filtered.map(g => (
                                <div key={g.group}>
                                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-theme-muted uppercase tracking-wider">{g.group}</p>
                                    {g.items.map(renderOption)}
                                </div>
                            ))
                            : filtered.map(renderOption)
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
