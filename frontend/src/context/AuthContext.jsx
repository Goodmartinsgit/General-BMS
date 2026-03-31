import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api, { setAccessTokenGetter, setSessionExpiredHandler } from '../api/axios';

const AuthContext = createContext({});

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointermove'];
const WARNING_BEFORE_MS = 60_000; // show warning 1 minute before timeout

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});
    const [loading, setLoading] = useState(true);
    const [sessionWarning, setSessionWarning] = useState(false);

    // Session timeout refs — all timer logic uses refs to avoid re-render cascades
    const timeoutMsRef = useRef(null);
    const logoutTimerRef = useRef(null);
    const warningTimerRef = useRef(null);

    const clearTimers = useCallback(() => {
        if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
        if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
        setSessionWarning(false);
    }, []);

    const resetIdleTimers = useCallback(() => {
        if (!timeoutMsRef.current) return;
        clearTimers();

        const ms = timeoutMsRef.current;

        warningTimerRef.current = setTimeout(() => setSessionWarning(true), Math.max(ms - WARNING_BEFORE_MS, 0));
        logoutTimerRef.current = setTimeout(async () => {
            clearTimers();
            timeoutMsRef.current = null;
            try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch { /* ignore */ }
            setAccessTokenGetter(() => null);
            setAuth({});
        }, ms);
    }, [clearTimers]);

    // Listen for user activity to reset the idle timer
    useEffect(() => {
        const onActivity = () => { if (timeoutMsRef.current) resetIdleTimers(); };
        ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
        return () => ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
    }, [resetIdleTimers]);

    const startIdleTimer = useCallback((minutes) => {
        if (minutes && minutes > 0) {
            timeoutMsRef.current = minutes * 60_000;
            resetIdleTimers();
        }
    }, [resetIdleTimers]);

    const stopIdleTimer = useCallback(() => {
        timeoutMsRef.current = null;
        clearTimers();
    }, [clearTimers]);

    // Register session-expired handler for the axios interceptor
    useEffect(() => {
        setSessionExpiredHandler(() => {
            setAccessTokenGetter(() => null);
            setAuth({});
            stopIdleTimer();
        });
        return () => setSessionExpiredHandler(null);
    }, [stopIdleTimer]);

    // ── Bootstrap: try to refresh token on mount ──────────────────
    // Uses a mount-id so StrictMode double-mount doesn't race.
    const mountIdRef = useRef(0);

    useEffect(() => {
        const myMountId = ++mountIdRef.current;
        const controller = new AbortController();

        (async () => {
            try {
                const response = await api.post('/auth/refresh', {}, {
                    withCredentials: true,
                    signal: controller.signal,
                });
                if (myMountId !== mountIdRef.current) return; // stale mount
                const { accessToken, user, sessionTimeout } = response.data;
                setAccessTokenGetter(() => accessToken);
                setAuth({ accessToken, user });
                if (sessionTimeout && sessionTimeout > 0) {
                    timeoutMsRef.current = sessionTimeout * 60_000;
                    resetIdleTimers();
                }
            } catch {
                if (myMountId !== mountIdRef.current) return; // stale mount — don't clear auth
                setAccessTokenGetter(() => null);
            }
            if (myMountId === mountIdRef.current) setLoading(false);
        })();

        return () => { controller.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshAccessToken = useCallback(async () => {
        try {
            const response = await api.post('/auth/refresh', {}, { withCredentials: true });
            const { accessToken, user, sessionTimeout } = response.data;
            setAccessTokenGetter(() => accessToken);
            setAuth({ accessToken, user });
            startIdleTimer(sessionTimeout);
            return accessToken;
        } catch {
            setAccessTokenGetter(() => null);
            setAuth({});
            stopIdleTimer();
            return null;
        }
    }, [startIdleTimer, stopIdleTimer]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password }, { withCredentials: true });
        const { accessToken, user, sessionTimeout } = response.data;
        setAccessTokenGetter(() => accessToken);
        setAuth({ accessToken, user });
        startIdleTimer(sessionTimeout);
    };

    const logout = async () => {
        stopIdleTimer();
        try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch { /* ignore */ }
        setAccessTokenGetter(() => null);
        setAuth({});
    };

    const dismissSessionWarning = useCallback(() => {
        setSessionWarning(false);
        resetIdleTimers();
    }, [resetIdleTimers]);

    return (
        <AuthContext.Provider value={{
            auth, setAuth, login, logout, loading, refreshAccessToken,
            sessionWarning, dismissSessionWarning,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
