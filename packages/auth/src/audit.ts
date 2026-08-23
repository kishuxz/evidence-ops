import { AuthError, type AuditEvent } from "./types.js";

export class AuditLog {
  private readonly events: AuditEvent[] = [];
  private sequence = 0;

  append(event: Omit<AuditEvent, "id">): AuditEvent {
    this.sequence += 1;
    const recorded: AuditEvent = { ...event, id: `aud_${String(this.sequence).padStart(8, "0")}` };
    this.events.push(recorded);
    return recorded;
  }

  list(tenantId: string): AuditEvent[] {
    return this.events.filter((event) => event.tenantId === tenantId);
  }

  delete(_id: string): never {
    throw new AuthError("audit log is append-only");
  }
}
