import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { login, signup, verify } from '@/lib/api';
import type { AuthUser, SignUpPayload } from '@/lib/types';

const TOKEN_STORAGE_KEY = 'navya.auth.token';

export interface AuthContextValue {
    token: string | null;
    user: AuthUser | null;
    loading: boolean;
    authenticating: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (payload: SignUpPayload) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [authenticating, setAuthenticating] = useState(false);

    const initializeAuth = useCallback(async () => {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
            if (!storedToken) {
                setToken(null);
                setUser(null);
                return;
            }

            const verifiedUser = await verify(storedToken);
            setToken(storedToken);
            setUser(verifiedUser);
        } catch {
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void initializeAuth();
    }, [initializeAuth]);

    const signIn = useCallback(async (email: string, password: string) => {
        setAuthenticating(true);
        try {
            const tokenResponse = await login(email.trim(), password);
            const verifiedUser = await verify(tokenResponse.access_token);

            await AsyncStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);
            setToken(tokenResponse.access_token);
            setUser(verifiedUser);
        } finally {
            setAuthenticating(false);
        }
    }, []);

    const signUp = useCallback(
        async (payload: SignUpPayload) => {
            setAuthenticating(true);
            try {
                await signup(payload);
                await signIn(payload.email, payload.password);
            } finally {
                setAuthenticating(false);
            }
        },
        [signIn],
    );

    const signOut = useCallback(async () => {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        if (!token) {
            return;
        }

        const verifiedUser = await verify(token);
        setUser(verifiedUser);
    }, [token]);

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            user,
            loading,
            authenticating,
            signIn,
            signUp,
            signOut,
            refreshUser,
        }),
        [token, user, loading, authenticating, signIn, signUp, signOut, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
