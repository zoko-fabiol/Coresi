import { UserRole } from './index';

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'validate'
  | 'reject'
  | 'export'
  | 'archive'
  | 'restore';

export type PermissionScope = 'global' | 'department' | 'project' | 'user';

export type SystemModuleId =
  | 'dashboard'
  | 'projects'
  | 'finances'
  | 'ged'
  | 'scanner'
  | 'ocr'
  | 'hr'
  | 'materials'
  | 'partners'
  | 'audit'
  | 'admin'
  | 'settings'
  | 'reports'
  | 'purchases';

export interface GranularPermission {
  module: SystemModuleId;
  action: PermissionAction;
  scope: PermissionScope;
  allowed: boolean;
}

export type RolePermissionMatrix = Record<UserRole, Record<SystemModuleId, Record<PermissionAction, boolean>>>;
