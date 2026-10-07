import { User, SystemRole, Permission, SecurityLevel } from '../types';

export class PermissionEngine {
  private static ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
    ORG_OWNER: [
      'issue:create', 'issue:view', 'issue:update', 'issue:delete', 'issue:assign', 'issue:transition',
      'board:create', 'board:update', 'workflow:create', 'workflow:update', 'automation:create', 'automation:enable',
      'sprint:manage', 'release:manage', 'project:configure', 'member:invite'
    ],
    WORKSPACE_ADMIN: [
      'issue:create', 'issue:view', 'issue:update', 'issue:delete', 'issue:assign', 'issue:transition',
      'board:create', 'board:update', 'workflow:create', 'workflow:update', 'automation:create', 'automation:enable',
      'sprint:manage', 'release:manage', 'project:configure', 'member:invite'
    ],
    PROJECT_ADMIN: [
      'issue:create', 'issue:view', 'issue:update', 'issue:delete', 'issue:assign', 'issue:transition',
      'board:create', 'board:update', 'workflow:create', 'workflow:update', 'automation:create', 'automation:enable',
      'sprint:manage', 'release:manage', 'project:configure'
    ],
    PROJECT_MANAGER: [
      'issue:create', 'issue:view', 'issue:update', 'issue:assign', 'issue:transition',
      'board:create', 'board:update', 'sprint:manage', 'release:manage'
    ],
    DEVELOPER: [
      'issue:create', 'issue:view', 'issue:update', 'issue:assign', 'issue:transition'
    ],
    QA: [
      'issue:create', 'issue:view', 'issue:update', 'issue:assign', 'issue:transition'
    ],
    DESIGNER: [
      'issue:create', 'issue:view', 'issue:update', 'issue:assign', 'issue:transition'
    ],
    VIEWER: [
      'issue:view'
    ],
    GUEST: [
      'issue:view'
    ],
    CUSTOM_ROLE: [
      'issue:create', 'issue:view', 'issue:update'
    ]
  };

  static hasPermission(user: User, permission: Permission): boolean {
    const permissions = this.ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  }

  static canEditField(user: User, fieldName: string): boolean {
    // Admin / Owners can edit all fields
    if (['ORG_OWNER', 'WORKSPACE_ADMIN', 'PROJECT_ADMIN'].includes(user.role)) {
      return true;
    }

    // Restricted fields
    if (['sla', 'securityLevel', 'workflow'].includes(fieldName)) {
      return false; // Only admins can edit SLA/security settings
    }

    if (['priority', 'sprintId', 'releaseId'].includes(fieldName)) {
      return ['PROJECT_MANAGER', 'PROJECT_ADMIN', 'ORG_OWNER'].includes(user.role);
    }

    return true; // General fields (title, description, estimate, labels) editable by devs/qa
  }

  static canAccessSecurityLevel(user: User, securityLevel: SecurityLevel): boolean {
    if (securityLevel === 'PUBLIC' || securityLevel === 'WORKSPACE' || securityLevel === 'PROJECT') {
      return true;
    }
    if (securityLevel === 'RESTRICTED' || securityLevel === 'PRIVATE') {
      return ['ORG_OWNER', 'WORKSPACE_ADMIN', 'PROJECT_ADMIN', 'QA'].includes(user.role);
    }
    return true;
  }
}
