import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api, { setAccessTokenGetter } from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        // On mount, try to refresh the token from httpOnly cookie
        const initAuth = async () => {
            try {
                const response = await api.post('/auth/refresh', {}, { withCredentials: true });
                const { accessToken, user } = response.data;
                // Update getter synchronously BEFORE setLoading(false) so child
                // component useEffect fetches (which fire before parent effects)
                // already see the valid token.
                setAccessTokenGetter(() => accessToken);
                setAuth({ accessToken, user });
            } catch {
                // Not authenticated
                setAccessTokenGetter(() => null);
            }
            setLoading(false);
        };
        initAuth();
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
