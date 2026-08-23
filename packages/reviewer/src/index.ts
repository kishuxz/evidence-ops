import { AuditLog, type Principal } from "@evidenceops/auth";

export type ReviewerAction = "accept" | "reject" | "request_research";

export type ReviewerView = {
  tenantId: string;
  matterId: string;
  propositionId: string;
  proposition: string;
  passage: string;
  quotation: string;
  verdict: string;
  reasonCodes: string[];
  conflicts: string[];
  unknowns: string[];
  authorityVersions: { locator: string; text: string }[];
  redline: { previous: string; next: string } | null;
};

export function renderReviewer(view: ReviewerView): string {
  const conflicts = view.conflicts.length === 0 ? "none" : view.conflicts.join("; ");
  const unknowns = view.unknowns.length === 0 ? "none" : view.unknowns.join("; ");
  const versions = view.authorityVersions
    .map((item) => `<li>${escapeHtml(item.locator)}: ${escapeHtml(item.text)}</li>`)
    .join("");
  const redline = view.redline
    ? `<section><h2>Redline</h2><pre>${escapeHtml(view.redline.previous)}</pre><pre>${escapeHtml(view.redline.next)}</pre></section>`
    : "";
  return `<!doctype html><html><body>
<main>
  <section><h1>Proposition</h1><p>${escapeHtml(view.proposition)}</p></section>
  <section><h1>Passage</h1><p>${escapeHtml(view.passage)}</p></section>
  <section><h1>Quotation</h1><p>${escapeHtml(view.quotation)}</p></section>
  <section><h1>Verdict</h1><p data-verdict="${escapeHtml(view.verdict)}">${escapeHtml(view.verdict)}</p>
    <p>${escapeHtml(view.reasonCodes.join(", "))}</p></section>
  <section><h1>Conflicts</h1><p>${escapeHtml(conflicts)}</p></section>
  <section><h1>Unknowns</h1><p>${escapeHtml(unknowns)}</p></section>
  <section><h1>Authority versions</h1><ul>${versions}</ul></section>
  ${redline}
  <section>
    <button data-action="accept">Accept</button>
    <button data-action="reject">Reject</button>
    <button data-action="request_research">Request research</button>
  </section>
</main>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function recordDecision(
  log: AuditLog,
  principal: Principal,
  view: ReviewerView,
  action: ReviewerAction,
  at: string,
): void {
  log.append({
    tenantId: view.tenantId,
    matterId: view.matterId,
    actorId: principal.userId,
    action: `review.${action}`,
    resource: view.propositionId,
    at,
  });
}
