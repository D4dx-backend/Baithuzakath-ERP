import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if token exists
      const hasToken = auth.isAuthenticated();
      const currentUser = auth.getCurrentUser();
      
      if (hasToken && currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Verify token is still valid in background
        try {
          const profileResponse = await auth.getProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data.user);
          }
        } catch (error) {
          console.warn('Token verification failed, but keeping user logged in:', error);
          // Don't logout immediately on network errors
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, otp: string) => {
    try {
      const response = await auth.verifyOTP(phone, otp, 'login');
      
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
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