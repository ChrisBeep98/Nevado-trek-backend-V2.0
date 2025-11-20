import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, endpoints } from '../lib/api';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    adminKey: string | null;
    login: (key: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [adminKey, setAdminKey] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = localStorage.getItem('adminKey');
        if (storedKey) {
            validateKey(storedKey);
        } else {
            setIsLoading(false);
        }
    }, []);

    const validateKey = async (key: string) => {
        try {
            // Temporarily set header for validation
            api.defaults.headers.common['X-Admin-Secret-Key'] = key;
            await api.get(endpoints.admin.stats);

            setAdminKey(key);
            setIsAuthenticated(true);
            localStorage.setItem('adminKey', key);
        } catch (error) {
            console.error('Invalid key', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (key: string) => {
        setIsLoading(true);
        await validateKey(key);
    };

    const logout = () => {
        setAdminKey(null);
        setIsAuthenticated(false);
        localStorage.removeItem('adminKey');
        delete api.defaults.headers.common['X-Admin-Secret-Key'];
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, adminKey, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
