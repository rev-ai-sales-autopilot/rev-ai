export type OrgRole = 'OWNER' | 'ADMIN' | 'SALES' | 'MEMBER';

export type Permission =
  | 'org.read'
  | 'org.manage'
  | 'team.read'
  | 'team.manage'
  | 'team.invite'
  | 'workflow.read'
  | 'workflow.create'
  | 'workflow.update'
  | 'workflow.delete'
  | 'workflow.execute'
  | 'knowledge.read'
  | 'knowledge.manage'
  | 'integrations.manage'
  | 'billing.manage';

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  OWNER: [
    'org.read',
    'org.manage',
    'team.read',
    'team.manage',
    'team.invite',
    'workflow.read',
    'workflow.create',
    'workflow.update',
    'workflow.delete',
    'workflow.execute',
    'knowledge.read',
    'knowledge.manage',
    'integrations.manage',
    'billing.manage',
  ],
  ADMIN: [
    'org.read',
    'org.manage',
    'team.read',
    'team.manage',
    'team.invite',
    'workflow.read',
    'workflow.create',
    'workflow.update',
    'workflow.delete',
    'workflow.execute',
    'knowledge.read',
    'knowledge.manage',
    'integrations.manage',
  ],
  SALES: [
    'org.read',
    'team.read',
    'workflow.read',
    'workflow.execute',
    'knowledge.read',
  ],
  MEMBER: [
    'org.read',
    'workflow.read',
    'knowledge.read',
  ],
};

export function hasPermission(role: string | OrgRole, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role as OrgRole];
  if (!allowed) return false;
  return allowed.includes(permission);
}
