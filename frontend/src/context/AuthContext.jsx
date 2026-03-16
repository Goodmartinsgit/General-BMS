import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api, { setAccessTokenGetter, setSessionExpiredHandler } from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);

    const refreshAccessToken = useCallback(async () => {
        try {
            const response = await api.post('/auth/refresh', {}, { withCredentials: true });
            const { accessToken, user } = response.data;
            setAccessTokenGetter(() => accessToken);
            setAuth({ accessToken, user });
            return accessToken;
        } catch {
            setAccessTokenGetter(() => null);
            setAuth({});
            return null;
        }
    }, []);

    // Register the session-expired handler so the axios interceptor can
    // trigger a full React-level logout when the refresh token is dead.
    useEffect(() => {
        setSessionExpiredHandler(() => {
            setAccessTokenGetter(() => null);
            setAuth({});
        });
        return () => setSessionExpiredHandler(null);
    }, []);

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
                const { accessToken, user } = response.data;
                // Update getter synchronously BEFORE setLoading(false) so child
                // component useEffect fetches (which fire before parent effects)
                // already see the valid token.
                setAccessTokenGetter(() => accessToken);
                setAuth({ accessToken, user });
            } catch {
                if (!mountedRef.current) return;
                // Not authenticated
                setAccessTokenGetter(() => null);
            }
            if (mountedRef.current) setLoading(false);
        };
        initAuth();

        return () => {
            mountedRef.current = false;
            controller.abort();
        };
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password }, { withCredentials: true });
        const { accessToken, user } = response.data;
        setAccessTokenGetter(() => accessToken);
        setAuth({ accessToken, user });
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout', {}, { withCredentials: true });
        } catch {
            // Logout even if the server call fails
        }
        setAccessTokenGetter(() => null);
        setAuth({});
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, login, logout, loading, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
