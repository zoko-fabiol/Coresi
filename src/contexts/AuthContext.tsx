import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser } from '../types/auth';
import { AuthService } from '../services/auth/authService';
import { DataService } from '../services/dataService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  loginEmail: (email: string, pass: string) => Promise<AppUser>;
  loginGoogle: () => Promise<AppUser | null>;
  registerUser: (email: string, pass: string, name: string, role?: UserRole, dept?: string, phone?: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    AuthService.init();
    const unsub = AuthService.subscribe((u) => {
      setCurrentUser(u);
      setIsLoading(false);

      if (u) {
        // Sync DataService current active user
        const prof: UserProfile = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          department: u.department,
        };
        DataService.setCurrentUser(prof);
      }
    });

    return () => unsub();
  }, []);

  const loginEmail = async (email: string, pass: string) => {
    return await AuthService.loginEmail(email, pass);
  };

  const loginGoogle = async () => {
    return await AuthService.loginGoogle();
  };

  const registerUser = async (email: string, pass: string, name: string, role?: UserRole, dept?: string, phone?: string) => {
    return await AuthService.registerUser(email, pass, name, role, dept, phone);
  };

  const logout = async () => {
    await AuthService.logout();
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const changePassword = async (newPass: string) => {
    await AuthService.changePassword(newPass);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        loginEmail,
        loginGoogle,
        registerUser,
        logout,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
