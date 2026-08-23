export type Role = "tenant_admin" | "matter_owner" | "researcher" | "reviewer" | "auditor";

export type Permission =
  | "matter.read"
  | "matter.write"
  | "research.run"
  | "review.decide"
  | "action.approve"
  | "audit.read"
  | "tenant.admin";

export type Principal = {
  userId: string;
  tenantId: string;
  roles: Role[];
};

export type MatterBinding = {
  userId: string;
  tenantId: string;
  matterId: string;
  role: Role;
};

export type Resource = {
  tenantId: string;
  matterId?: string;
};

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  tenant_admin: [
    "tenant.admin",
    "matter.read",
    "matter.write",
    "research.run",
    "review.decide",
    "action.approve",
    "audit.read",
  ],
  matter_owner: ["matter.read", "matter.write", "research.run", "review.decide", "action.approve", "audit.read"],
  researcher: ["matter.read", "research.run"],
  reviewer: ["matter.read", "review.decide", "action.approve"],
  auditor: ["matter.read", "audit.read"],
};

export type ApprovalAction = "external_write" | "notify" | "publish" | "release";

export type AuditEvent = {
  id: string;
  tenantId: string;
  matterId: string | null;
  actorId: string;
  action: string;
  resource: string;
  at: string;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
