/**
 * User & Authentication Types
 */

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;

  // Tenant relationship
  tenantId: string;
  role: UserRole;

  // Status
  isActive: boolean;
  emailVerified: boolean;

  // Preferences
  preferences: UserPreferences;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'writer' | 'viewer';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  sidebarCollapsed: boolean;
  defaultContributorId?: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    articlePublished: boolean;
    qualityAlerts: boolean;
  };
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  invitedAt: string;
  acceptedAt?: string;
  invitedBy?: string;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

// Auth context for React
export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}
