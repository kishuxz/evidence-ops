import { AuthError, type ApprovalAction, type Principal } from "./types.js";

export type Approval = {
  id: string;
  tenantId: string;
  matterId: string;
  action: ApprovalAction;
  actorId: string;
  at: string;
};

const PROTECTED: ApprovalAction[] = ["external_write", "notify", "publish", "release"];

export class ApprovalPolicy {
  private readonly approvals: Approval[] = [];
  private sequence = 0;

  record(principal: Principal, matterId: string, action: ApprovalAction, at: string): Approval {
    if (!PROTECTED.includes(action)) {
      throw new AuthError(`unknown approval action ${action}`);
    }
    this.sequence += 1;
    const approval: Approval = {
      id: `apr_${String(this.sequence).padStart(8, "0")}`,
      tenantId: principal.tenantId,
      matterId,
      action,
      actorId: principal.userId,
      at,
    };
    this.approvals.push(approval);
    return approval;
  }

  require(tenantId: string, matterId: string, action: ApprovalAction): Approval {
    const found = this.approvals.find(
      (item) => item.tenantId === tenantId && item.matterId === matterId && item.action === action,
    );
    if (!found) {
      throw new AuthError(`${action} requires a recorded human approval`);
    }
    return found;
  }
}

export const PROTECTED_ACTIONS = PROTECTED;
