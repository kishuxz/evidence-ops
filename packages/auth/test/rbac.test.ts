import { describe, expect, it } from "vitest";
import { AccessControl, MemoryAuthenticator } from "../src/access.js";
import { ApprovalPolicy } from "../src/approvals.js";
import { AuditLog } from "../src/audit.js";
import { AuthError, type Principal } from "../src/types.js";

const tenantA = "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const tenantB = "ten_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const matter1 = "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const matter2 = "mat_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const alice: Principal = { userId: "usr_alice", tenantId: tenantA, roles: ["researcher"] };
const bob: Principal = { userId: "usr_bob", tenantId: tenantB, roles: ["matter_owner"] };

describe("RBAC", () => {
  it("denies missing tokens and cross-tenant access", () => {
    const access = new AccessControl(
      new MemoryAuthenticator(new Map([["alice", alice], ["bob", bob]])),
      [{ userId: alice.userId, tenantId: tenantA, matterId: matter1, role: "researcher" }],
    );
    expect(() => access.authorize("missing", "matter.read", { tenantId: tenantA, matterId: matter1 })).toThrow(
      AuthError,
    );
    expect(() => access.authorize("alice", "matter.read", { tenantId: tenantB, matterId: matter1 })).toThrow(
      /cross-tenant/,
    );
  });

  it("does not grant a second matter in the same tenant without a binding", () => {
    const access = new AccessControl(new MemoryAuthenticator(new Map([["alice", alice]])), [
      { userId: alice.userId, tenantId: tenantA, matterId: matter1, role: "researcher" },
    ]);
    expect(access.authorize("alice", "matter.read", { tenantId: tenantA, matterId: matter1 }).userId).toBe("usr_alice");
    expect(() => access.authorize("alice", "matter.read", { tenantId: tenantA, matterId: matter2 })).toThrow(
      /matter access denied/,
    );
    expect(() => access.authorize("alice", "review.decide", { tenantId: tenantA, matterId: matter1 })).toThrow(
      /permission denied/,
    );
  });

  it("requires recorded approval for external actions and keeps audit append-only", () => {
    const policy = new ApprovalPolicy();
    expect(() => policy.require(tenantA, matter1, "publish")).toThrow(/human approval/);
    policy.record(alice, matter1, "publish", "2026-08-22T00:00:00Z");
    expect(policy.require(tenantA, matter1, "publish").action).toBe("publish");
    const audit = new AuditLog();
    audit.append({
      tenantId: tenantA,
      matterId: matter1,
      actorId: alice.userId,
      action: "publish.approved",
      resource: matter1,
      at: "2026-08-22T00:00:00Z",
    });
    expect(audit.list(tenantB)).toEqual([]);
    expect(() => audit.delete("aud_00000001")).toThrow(/append-only/);
  });
});
