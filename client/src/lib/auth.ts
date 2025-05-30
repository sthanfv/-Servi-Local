import { type User } from "@shared/schema";

export interface AuthUser extends User {
  isAuthenticated: boolean;
}

export const isAdmin = (user: User | null | undefined): boolean => {
  return user?.role === 'admin';
};

export const isProvider = (user: User | null | undefined): boolean => {
  return user?.role === 'provider' || user?.role === 'admin';
};

export const canEditService = (user: User | null | undefined, serviceUserId: string): boolean => {
  if (!user) return false;
  return user.id === serviceUserId || user.role === 'admin';
};

export const getDisplayName = (user: User | null | undefined): string => {
  if (!user) return 'Usuario';
  
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.username) return user.username;
  return user.email || 'Usuario';
};

export const getInitials = (user: User | null | undefined): string => {
  if (!user) return 'U';
  
  const displayName = getDisplayName(user);
  const parts = displayName.split(' ');
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return displayName.substring(0, 2).toUpperCase();
};
