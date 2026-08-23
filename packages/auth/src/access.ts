import { AuthError, ROLE_PERMISSIONS, type MatterBinding, type Permission, type Principal, type Resource, type Role } from "./types.js";

export interface Authenticator {
  authenticate(token: string): Principal;
}

export class MemoryAuthenticator implements Authenticator {
  constructor(private readonly principals: Map<string, Principal>) {}

  authenticate(token: string): Principal {
    const principal = this.principals.get(token);
    if (!principal) {
      throw new AuthError("unauthenticated");
    }
    return principal;
  }
}

export class AccessControl {
  constructor(
    private readonly authenticator: Authenticator,
    private readonly bindings: MatterBinding[],
  ) {}

  authorize(token: string, permission: Permission, resource: Resource): Principal {
    const principal = this.authenticator.authenticate(token);
    if (principal.tenantId !== resource.tenantId) {
      throw new AuthError("cross-tenant access denied");
    }
    if (principal.roles.includes("tenant_admin") && ROLE_PERMISSIONS.tenant_admin.includes(permission)) {
      return principal;
    }
    if (!resource.matterId) {
      if (!principal.roles.some((role) => ROLE_PERMISSIONS[role].includes(permission))) {
        throw new AuthError("permission denied");
      }
      return principal;
    }
    const binding = this.bindings.find(
      (item) =>
        item.userId === principal.userId &&
        item.tenantId === resource.tenantId &&
        item.matterId === resource.matterId,
    );
    if (!binding) {
      throw new AuthError("matter access denied");
    }
    if (!ROLE_PERMISSIONS[binding.role].includes(permission)) {
      throw new AuthError("permission denied");
    }
    return principal;
  }

  bind(binding: MatterBinding): void {
    this.bindings.push(binding);
  }
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
