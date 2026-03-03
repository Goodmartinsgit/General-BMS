import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { branchesAPI } from '../api/branches';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

export const BranchProvider = ({ children }) => {
    const { auth } = useAuth();

    const [singleBranchMode, setSingleBranchMode] = useState(true);
    const [branchCount, setBranchCount]           = useState(0);
    const [branches, setBranches]                 = useState([]);
    const [mainBranch, setMainBranch]             = useState(null);
    const [modeLoading, setModeLoading]           = useState(true);

    // Persisted selected branch (only meaningful in multi-branch mode)
    const [currentBranchId, setCurrentBranchIdState] = useState(() => {
        const saved = localStorage.getItem('selectedBranchId');
        return saved ? parseInt(saved, 10) : null;
    });

    const refreshMode = useCallback(async () => {
        if (!auth?.accessToken) return;
        try {
            const mode = await branchesAPI.getBranchMode();
            setSingleBranchMode(mode.singleBranchMode);
            setBranchCount(mode.branchCount);
            setBranches(mode.branches || []);
            setMainBranch(mode.mainBranch || null);

            if (mode.singleBranchMode) {
                // Auto-select the single branch
                const single = mode.branches?.[0];
                if (single) {
                    setCurrentBranchIdState(single.id);
                    localStorage.setItem('selectedBranchId', String(single.id));
                }
            } else {
                // Multi-branch: validate saved selection
                const saved = localStorage.getItem('selectedBranchId');
                const savedId = saved ? parseInt(saved, 10) : null;
                const stillValid = savedId && (mode.branches || []).some(b => b.id === savedId);
                if (!stillValid) {
                    // Fall back to first (main) branch
                    const first = (mode.branches || [])[0];
                    if (first) {
                        setCurrentBranchIdState(first.id);
                        localStorage.setItem('selectedBranchId', String(first.id));
                    }
                }
            }
        } catch (err) {
            console.error('[BranchContext] Failed to load branch mode:', err);
        } finally {
            setModeLoading(false);
        }
    }, [auth?.accessToken]);

    useEffect(() => {
        refreshMode();
    }, [refreshMode]);

    const setCurrentBranch = (branchId) => {
        const id = branchId ? parseInt(branchId, 10) : null;
        setCurrentBranchIdState(id);
        if (id) {
            localStorage.setItem('selectedBranchId', String(id));
        } else {
            localStorage.removeItem('selectedBranchId');
        }
    };

    const currentBranch = branches.find(b => b.id === currentBranchId) || null;

    return (
        <BranchContext.Provider value={{
            singleBranchMode,
            branchCount,
            branches,
            mainBranch,
            currentBranchId,
            currentBranch,
            setCurrentBranch,
            refreshMode,
            modeLoading,
        }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => {
    const ctx = useContext(BranchContext);
    if (!ctx) throw new Error('useBranch must be used within BranchProvider');
    return ctx;
};

export default BranchContext;
