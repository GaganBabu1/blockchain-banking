/* 
 * AuthContext.tsx
 * Authentication context for managing user login state.
 * Uses backend API for authentication.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, adminLoginUser, registerUser } from '../services/api';

// Define the shape of our user object
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (accountNumber: string, pin: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, accountNumber: string, pin: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check localStorage on initial load AND when window becomes visible (user returns to tab)
  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = localStorage.getItem('bankingUser');
      const authToken = localStorage.getItem('authToken');
      
      // Only set user if BOTH user and token exist in localStorage
      if (storedUser && authToken) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('bankingUser');
          localStorage.removeItem('authToken');
        }
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    };

    // Initialize on mount
    initializeAuth();

    // Re-initialize when user returns to the tab (tab visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        initializeAuth();
      }
    };

    // Listen for storage changes from OTHER tabs (cross-tab sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bankingUser' || event.key === 'authToken') {
        // Storage changed in another tab - re-sync immediately
        initializeAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Regular user login (calls backend API)
  const login = async (accountNumber: string, pin: string): Promise<boolean> => {
    try {
      const response = await loginUser(accountNumber, pin);
      
      if (response.success && response.token) {
        const newUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.isAdmin ? 'admin' : 'user'
        };
        setUser(newUser);
        localStorage.setItem('bankingUser', JSON.stringify(newUser));
        localStorage.setItem('authToken', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Admin login (calls backend API with email and password)
  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await adminLoginUser(email, password);
      
      if (response.success && response.token && response.user.isAdmin) {
        const adminUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: 'admin'
        };
        setUser(adminUser);
        localStorage.setItem('bankingUser', JSON.stringify(adminUser));
        localStorage.setItem('authToken', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  // User signup (calls backend API)
  const signup = async (name: string, email: string, accountNumber: string, pin: string): Promise<boolean> => {
    try {
      const response = await registerUser(name, email, accountNumber, pin, pin);
      
      if (response.success && response.token) {
        const newUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: 'user'
        };
        setUser(newUser);
        localStorage.setItem('bankingUser', JSON.stringify(newUser));
        localStorage.setItem('authToken', response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('bankingUser');
    localStorage.removeItem('authToken');
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    login,
    adminLogin,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
