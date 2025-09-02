
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  currentUser: string | null;
  login: (username: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure allowed usernames here
const ALLOWED_USERNAMES = [
  'admin',
  'manager',
  'worker1',
  'worker2',
  'chef',
  'cashier'
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('burger_app_current_user');
    if (savedUser && ALLOWED_USERNAMES.includes(savedUser)) {
      setCurrentUser(savedUser);
    }
  }, []);

  const login = (username: string): boolean => {
    if (ALLOWED_USERNAMES.includes(username.toLowerCase())) {
      const user = username.toLowerCase();
      setCurrentUser(user);
      localStorage.setItem('burger_app_current_user', user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('burger_app_current_user');
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
