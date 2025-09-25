import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  userType: 'employee' | 'public' | null;
  login: (email: string, password: string, userType: 'employee' | 'public', passkey?: string) => Promise<void>;
  signup: (email: string, password: string, name: string, userType: 'employee' | 'public', passkey?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data
const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'atharva.bakre05@gmail.com',
    password: '1234',
    name: 'Atharva Bakre',
    role: 'admin' as const,
    department: 'Ministry of Tribal Affairs',
    state: 'Odisha' as const,
    district: 'Kalahandi',
    created_at: new Date().toISOString()
  },
  public: [
    {
      id: 'public-1',
      email: 'rajesh.kumar@example.com',
      password: 'public123',
      name: 'Rajesh Kumar',
      role: 'citizen' as const,
      department: 'Citizen',
      state: 'Odisha' as const,
      district: 'Kalahandi',
      created_at: new Date().toISOString()
    },
    {
      id: 'public-2',
      email: 'priya.sharma@example.com',
      password: 'public123',
      name: 'Priya Sharma',
      role: 'citizen' as const,
      department: 'Citizen',
      state: 'Odisha' as const,
      district: 'Kalahandi',
      created_at: new Date().toISOString()
    },
    {
      id: 'public-3',
      email: 'amit.singh@example.com',
      password: 'public123',
      name: 'Amit Singh',
      role: 'citizen' as const,
      department: 'Citizen',
      state: 'Odisha' as const,
      district: 'Kalahandi',
      created_at: new Date().toISOString()
    }
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'employee' | 'public' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkSession = () => {
      try {
        const savedUser = localStorage.getItem('fra-user');
        const savedUserType = localStorage.getItem('fra-user-type');
        
        if (savedUser && savedUserType) {
          setUser(JSON.parse(savedUser));
          setUserType(savedUserType as 'employee' | 'public');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('fra-user');
        localStorage.removeItem('fra-user-type');
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string, userType: 'employee' | 'public', passkey?: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (userType === 'employee') {
        // Validate passkey for employees
        if (passkey !== 'FRA2025') {
          throw new Error('Invalid PassKey');
        }

        // Check admin credentials
        if (mockUsers.admin.email === email && mockUsers.admin.password === password) {
          setUser(mockUsers.admin);
          setUserType('employee');
          localStorage.setItem('fra-user', JSON.stringify(mockUsers.admin));
          localStorage.setItem('fra-user-type', 'employee');
          return;
        }
      } else {
        // Allow any email/password for public login
        // Generate a stable deterministic ID from the email so claims persist across sessions
        const emailKey = email.trim().toLowerCase();
        const stableId = `public-${btoa(unescape(encodeURIComponent(emailKey))).replace(/=+$/, '')}`;
        const publicUser: User = {
          id: stableId,
          email: email,
          name: email.split('@')[0] || 'Public User',
          role: 'citizen',
          department: 'Citizen',
          state: 'Odisha',
          district: 'Kalahandi',
          created_at: new Date().toISOString()
        };

        setUser(publicUser);
        setUserType('public');
        localStorage.setItem('fra-user', JSON.stringify(publicUser));
        localStorage.setItem('fra-user-type', 'public');
        return;
      }

      throw new Error('Invalid credentials');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, userType: 'employee' | 'public', passkey?: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (userType === 'employee') {
        // Validate passkey for employees
        if (passkey !== 'FRA2025') {
          throw new Error('Invalid PassKey');
        }
      }

      // Check if email already exists
      const existingUser = mockUsers.public.find(u => u.email === email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user with stable deterministic ID from email
      const emailKey = email.trim().toLowerCase();
      const stableId = `public-${btoa(unescape(encodeURIComponent(emailKey))).replace(/=+$/, '')}`;
      const newUser: User = {
        id: stableId,
        email,
        name,
        role: 'citizen',
        department: 'Citizen',
        state: 'Odisha',
        district: 'Kalahandi',
        created_at: new Date().toISOString()
      };

      // Add to mock users (in a real app, this would be saved to database)
      mockUsers.public.push(newUser);

      setUser(newUser);
      setUserType('public');
      localStorage.setItem('fra-user', JSON.stringify(newUser));
      localStorage.setItem('fra-user-type', 'public');
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('fra-user');
    localStorage.removeItem('fra-user-type');
  };

  return (
    <AuthContext.Provider value={{ user, userType, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};