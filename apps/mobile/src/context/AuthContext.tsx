import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { mobileApiClient, setOnUnauthorized } from '../api/client';
import { SafeUser } from '@ismo/shared';
import { Alert } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthContextType {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: SafeUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = async () => {
    try {
      await mobileApiClient.post('/auth/logout').catch(() => {});
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.error('Error during logout', e);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    // Register unauthorized callback for expired token
    setOnUnauthorized((message: string) => {
      setToken(null);
      setUser(null);
      Alert.alert('Session Expired', message);
    });

    // Load persisted token from Android Keystore / iOS Keychain
    const loadStoredAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token with server in background
          mobileApiClient
            .get('/auth/me')
            .then((res) => {
              if (res.data.success) {
                setUser(res.data.data.user);
                SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.data.data.user));
              }
            })
            .catch(() => {
              // Handled by axios interceptor if 401
            });
        }
      } catch (err) {
        console.error('Failed to load credentials from SecureStore', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (newToken: string, newUser: SafeUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useMobileAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMobileAuth must be used within an AuthProvider');
  }
  return context;
};
