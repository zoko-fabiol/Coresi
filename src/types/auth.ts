import { UserRole } from './index';

export type UserStatus = 'actif' | 'suspendu' | 'desactive' | 'invite';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  department: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
  assignedProjectIds?: string[];
}

export interface AuthSessionState {
  user: AppUser | null;
  firebaseUser: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDeactivated: boolean;
  token?: string;
  error?: string | null;
}
