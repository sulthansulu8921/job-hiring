import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/auth/AuthModal";
import type { User } from "../types";
import api from "../services/api";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (access: string, refresh: string, userData: User) => void;
    register: (userData: User) => void;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    loading: boolean;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await api.get('/auth/me/');
                    setUser(res.data);
                } catch (e) {
                    console.error("Auth check failed", e);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    delete api.defaults.headers.common['Authorization'];
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (access: string, refresh: string, userData: User) => {
        localStorage.setItem('token', access);
        localStorage.setItem('refresh_token', refresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        setUser(userData);
        setIsAuthModalOpen(false);
    };

    const register = (userData: User) => {
        // Simplified: in real flow, register might or might not auto-login
        // For now, let's just keep the state update if needed, but usually 
        // the modal will handle the API call and then call login() or open login view.
        setUser(userData);
        setIsAuthModalOpen(false);
    };

    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        navigate("/");
    };

    const updateProfile = (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    const requireAuth = (action: () => void) => {
        if (user) {
            action();
        } else {
            openAuthModal();
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            updateProfile,
            loading,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal,
            requireAuth
        }}>
            {children}
            <AuthModal />
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
