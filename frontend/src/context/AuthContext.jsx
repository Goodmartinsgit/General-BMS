import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api, { setAccessTokenGetter, setSessionExpiredHandler } from '../api/axios';

const AuthContext = createContext({});

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointermove'];
const WARNING_BEFORE_MS = 60_000; // show warning 1 minute before timeout

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});
    const [loading, setLoading] = useState(true);
    const [sessionWarning, setSessionWarning] = useState(false);
    const mountedRef = useRef(true);

    // Session timeout refs (avoid re-renders on every activity event)
    const timeoutMsRef = useRef(null);          // null = no timer active
    const lastActivityRef = useRef(Date.now());
    const logoutTimerRef = useRef(null);
    const warningTimerRef = useRef(null);

    // ── Idle timer helpers ────────────────────────────────────────
    const clearTimers = useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        logoutTimerRef.current = null;
        warningTimerRef.current = null;
        setSessionWarning(false);
    }, []);

    const doIdleLogout = useCallback(async () => {
        clearTimers();
        timeoutMsRef.current = null;
        try {
            await api.post('/auth/logout', {}, { withCredentials: true });
        } catch { /* ignore */ }
        setAccessTokenGetter(() => null);
        setAuth({});
    }, [clearTimers]);

    const resetIdleTimers = useCallback(() => {
        if (!timeoutMsRef.current) return;        // not logged in or no timeout
        lastActivityRef.current = Date.now();
        clearTimers();

        const timeoutMs = timeoutMsRef.current;
        const warningMs = Math.max(timeoutMs - WARNING_BEFORE_MS, 0);

        warningTimerRef.current = setTimeout(() => {
            setSessionWarning(true);
        }, warningMs);

        logoutTimerRef.current = setTimeout(() => {
            doIdleLogout();
        }, timeoutMs);
    }, [clearTimers, doIdleLogout]);

    // Activity listener
    useEffect(() => {
        const onActivity = () => {
            if (!timeoutMsRef.current) return;
            resetIdleTimers();
        };

        ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
        return () => {
            ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
        };
    }, [resetIdleTimers]);

    // Start or stop idle timer when auth changes
    const startIdleTimer = useCallback((sessionTimeout) => {
        if (sessionTimeout && sessionTimeout > 0) {
            timeoutMsRef.current = sessionTimeout * 60_000;
            resetIdleTimers();
        }
    }, [resetIdleTimers]);

    const stopIdleTimer = useCallback(() => {
        timeoutMsRef.current = null;
        clearTimers();
    }, [clearTimers]);

    // ── Refresh ───────────────────────────────────────────────────
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

    // Register the session-expired handler so the axios interceptor can
    // trigger a full React-level logout when the refresh token is dead.
    useEffect(() => {
        setSessionExpiredHandler(() => {
            setAccessTokenGetter(() => null);
            setAuth({});
            stopIdleTimer();
        });
        return () => setSessionExpiredHandler(null);
    }, [stopIdleTimer]);

    useEffect(() => {
        mountedRef.current = true;

        // On mount, try to refresh the token from httpOnly cookie
        const controller = new AbortController();

        const initAuth = async () => {
            try {
                const response = await api.post('/auth/refresh', {}, {
                    withCredentials: true,
                    signal: controller.signal
                });
                if (!mountedRef.current) return;
                const { accessToken, user, sessionTimeout } = response.data;
                setAccessTokenGetter(() => accessToken);
                setAuth({ accessToken, user });
                startIdleTimer(sessionTimeout);
            } catch {
                if (!mountedRef.current) return;
                setAccessTokenGetter(() => null);
            }
            if (mountedRef.current) setLoading(false);
        };
        initAuth();

        return () => {
            mountedRef.current = false;
            controller.abort();
        };
    }, [startIdleTimer]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password }, { withCredentials: true });
        const { accessToken, user, sessionTimeout } = response.data;
        setAccessTokenGetter(() => accessToken);
        setAuth({ accessToken, user });
        startIdleTimer(sessionTimeout);
    };

    const logout = async () => {
        stopIdleTimer();
        try {
            await api.post('/auth/logout', {}, { withCredentials: true });
        } catch {
            // Logout even if the server call fails
        }
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
            sessionWarning, dismissSessionWarning
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
