import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  AccessControl,
  ApprovalPolicy,
  AuditLog,
  AuthError,
  MemoryAuthenticator,
  type MatterBinding,
  type Permission,
  type Principal,
  type Role,
} from "@evidenceops/auth";
import { resolveCitation } from "@evidenceops/authority";
import { FixtureConnector, type Snapshot } from "@evidenceops/connector";
import { CORPUS, corpusManifest } from "@evidenceops/eval";
import {
  graphFromJson,
  InMemoryGraphStore,
  type EvidenceGraph,
  type StoreScope,
  type Trace,
} from "@evidenceops/graph";
import { affectedFromImpact, classifyChange, redline } from "@evidenceops/monitor";
import { Telemetry } from "@evidenceops/obs";
import { OfflineIndex, type IndexedDocument, type RetrieveQuery, type RetrieveResult } from "@evidenceops/retrieve";
import { recordDecision, renderReviewer, type ReviewerAction, type ReviewerView } from "@evidenceops/reviewer";
import { verifyInputFromEvalCase, verifyProposition, type VerifyOutput } from "@evidenceops/verify";
import { CliError, EXIT } from "./errors.js";

const ROLES: Role[] = ["tenant_admin", "matter_owner", "researcher", "reviewer", "auditor"];
const ACTIONS: ReviewerAction[] = ["accept", "reject", "request_research"];

export type StoredSnapshot = Snapshot & { tenantId: string; matterId: string };
export type StoredDocument = IndexedDocument & { tenantId: string; matterId: string };

type StateFile = {
  schemaVersion: 1;
  principals: { tokenHash: string; userId: string; tenantId: string; roles: Role[] }[];
  bindings: MatterBinding[];
  snapshots: StoredSnapshot[];
  documents: StoredDocument[];
  graphs: { tenantId: string; matterId: string; graph: EvidenceGraph }[];
  views: ReviewerView[];
  approvals: { tenantId: string; matterId: string; action: "publish"; actorId: string; at: string }[];
  audits: { tenantId: string; matterId: string | null; actorId: string; action: string; resource: string; at: string }[];
};

function tokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function scopeKey(scope: StoreScope): string {
  return `${scope.tenantId}\n${scope.matterId}`;
}

function requireText(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") {
    throw new CliError("USAGE", `${name} is required`, EXIT.USAGE);
  }
  return trimmed;
}

function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

function emptyState(): StateFile {
  return {
    schemaVersion: 1,
    principals: [],
    bindings: [],
    snapshots: [],
    documents: [],
    graphs: [],
    views: [],
    approvals: [],
    audits: [],
  };
}

export class Workspace {
  readonly telemetry = new Telemetry();
  private state: StateFile;
  private readonly connector = new FixtureConnector();

  constructor(private readonly dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.state = this.load();
  }

  private path(): string {
    return join(this.dataDir, "state.json");
  }

  private load(): StateFile {
    if (!existsSync(this.path())) {
      return emptyState();
    }
    const parsed: unknown = JSON.parse(readFileSync(this.path(), "utf8"));
    if (typeof parsed !== "object" || parsed === null || (parsed as StateFile).schemaVersion !== 1) {
      throw new CliError("VALIDATION", "workspace state is invalid", EXIT.VALIDATION);
    }
    return parsed as StateFile;
  }

  private save(): void {
    const tmp = `${this.path()}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
    renameSync(tmp, this.path());
  }

  private access(): { control: AccessControl; principalFor: (token: string) => Principal } {
    const map = new Map<string, Principal>();
    for (const item of this.state.principals) {
      map.set(item.tokenHash, {
        userId: item.userId,
        tenantId: item.tenantId,
        roles: item.roles,
      });
    }
    const authenticator = new MemoryAuthenticator(map);
    const hashed: AuthenticatorAdapter = {
      authenticate: (token: string) => authenticator.authenticate(tokenHash(token)),
    };
    return {
      control: new AccessControl(hashed, this.state.bindings),
      principalFor: (token: string) => hashed.authenticate(token),
    };
  }

  authorize(token: string | undefined, tenant: string, matter: string, permission: Permission): Principal {
    const value = requireText("token", token);
    const { control } = this.access();
    try {
      return control.authorize(value, permission, { tenantId: tenant, matterId: matter });
    } catch (error) {
      const message = error instanceof AuthError ? error.message : String(error);
      if (message === "unauthenticated") {
        throw new CliError("UNAUTHENTICATED", "unknown or missing token", EXIT.UNAUTHENTICATED);
      }
      if (message === "cross-tenant access denied") {
        throw new CliError("FORBIDDEN", "cross-tenant access denied", EXIT.FORBIDDEN);
      }
      throw new CliError("FORBIDDEN", message, EXIT.FORBIDDEN);
    }
  }

  private audit(principal: Principal, tenantId: string, matterId: string, action: string, resource: string): void {
    this.state.audits.push({
      tenantId,
      matterId,
      actorId: principal.userId,
      action,
      resource,
      at: "2026-08-22T00:00:00Z",
    });
    this.save();
  }

  init(input: { tenant: string; matter: string; token: string; user: string; role: string }): {
    tenantId: string;
    matterId: string;
    userId: string;
    role: Role;
  } {
    const tenantId = requireText("tenant", input.tenant);
    const matterId = requireText("matter", input.matter);
    const token = requireText("token", input.token);
    const userId = requireText("user", input.user);
    if (!isRole(input.role)) {
      throw new CliError("USAGE", `unknown role ${input.role}`, EXIT.USAGE);
    }
    const hash = tokenHash(token);
    if (this.state.principals.some((item) => item.tokenHash === hash)) {
      throw new CliError("USAGE", "token already registered", EXIT.USAGE);
    }
    this.state.principals.push({ tokenHash: hash, userId, tenantId, roles: [input.role] });
    this.state.bindings.push({ userId, tenantId, matterId, role: input.role });
    this.save();
    return { tenantId, matterId, userId, role: input.role };
  }

  ingest(tenant: string, matter: string, token: string | undefined, idsRaw: string | undefined): {
    status: string;
    snapshotIds: string[];
    missingIds: string[];
    liveCourtListener: false;
    network: false;
  } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "matter.write");
    const ids = requireText("ids", idsRaw)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (ids.length === 0) {
      throw new CliError("USAGE", "ids is required", EXIT.USAGE);
    }
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
      throw new CliError("USAGE", "duplicate snapshot ids are ambiguous", EXIT.USAGE);
    }
    const result = this.connector.ingest(ids);
    if (result.status === "partial_ingestion") {
      throw new CliError("PARTIAL", "partial ingestion is not success", EXIT.PARTIAL, {
        missingIds: result.missingIds,
        status: result.status,
      });
    }
    if (result.status !== "complete" || !result.snapshot) {
      throw new CliError("NOT_FOUND", "snapshots were not found", EXIT.NOT_FOUND, { missingIds: result.missingIds });
    }
    for (const id of ids) {
      const fetched = this.connector.getSnapshot(id);
      if (fetched.status !== "complete" || !fetched.snapshot) {
        throw new CliError("NOT_FOUND", `snapshot ${id} was not found`, EXIT.NOT_FOUND);
      }
      const snapshot = fetched.snapshot;
      this.state.snapshots = this.state.snapshots.filter(
        (item) => !(item.tenantId === tenantId && item.matterId === matterId && item.id === snapshot.id),
      );
      this.state.snapshots.push({ ...snapshot, tenantId, matterId });
      this.state.documents = this.state.documents.filter(
        (item) => !(item.tenantId === tenantId && item.matterId === matterId && item.id === snapshot.id),
      );
      this.state.documents.push({
        id: snapshot.id,
        text: snapshot.text,
        caption: snapshot.id,
        jurisdiction: "US-FED",
        date: "2020-01-01",
        versionLocator: snapshot.versionLocator,
        tenantId,
        matterId,
      });
    }
    this.audit(principal, tenantId, matterId, "ingest", ids.join(","));
    return {
      status: "complete",
      snapshotIds: ids,
      missingIds: [],
      liveCourtListener: false,
      network: false,
    };
  }

  retrieve(
    tenant: string,
    matter: string,
    token: string | undefined,
    query: {
      text?: string;
      jurisdiction?: string;
      asOf?: string;
      versionLocator?: string;
      citedDocumentId?: string;
    },
  ): RetrieveResult {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "research.run");
    const text = requireText("text", query.text);
    const index = new OfflineIndex();
    for (const doc of this.state.documents) {
      if (doc.tenantId === tenantId && doc.matterId === matterId) {
        index.add(doc);
      }
    }
    const retrieveQuery: RetrieveQuery = { text };
    if (query.jurisdiction) {
      retrieveQuery.jurisdiction = query.jurisdiction;
    }
    if (query.asOf) {
      retrieveQuery.asOf = query.asOf;
    }
    if (query.versionLocator) {
      retrieveQuery.versionLocator = query.versionLocator;
    }
    if (query.citedDocumentId) {
      retrieveQuery.citedDocumentId = query.citedDocumentId;
    }
    const result = index.retrieve(retrieveQuery);
    if (result.hits.length === 0) {
      throw new CliError("NOT_FOUND", "no passages in scope", EXIT.NOT_FOUND);
    }
    const top = result.hits[0];
    const second = result.hits[1];
    if (top && second && top.hybrid === second.hybrid && !query.citedDocumentId) {
      throw new CliError("PARTIAL", "retrieval ranking is tied", EXIT.PARTIAL, {
        ids: [top.id, second.id],
      });
    }
    this.audit(principal, tenantId, matterId, "retrieve", text.slice(0, 80));
    return result;
  }

  verify(
    tenant: string,
    matter: string,
    token: string | undefined,
    input: {
      proposition?: string;
      quotation?: string;
      pinpoint?: string;
      citation?: string;
      citedDocumentId?: string;
      jurisdiction?: string;
    },
  ): VerifyOutput & { proposition: string; propositionId: string } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "research.run");
    const proposition = requireText("proposition", input.proposition);
    const quotation = requireText("quotation", input.quotation);
    const pinpoint = requireText("pinpoint", input.pinpoint);
    const citation = requireText("citation", input.citation);
    const jurisdiction = input.jurisdiction?.trim() || "US-FED";
    const retrieve = this.retrieve(tenantId, matterId, token, {
      text: `${proposition} ${citation}`,
      jurisdiction,
      ...(input.citedDocumentId ? { citedDocumentId: input.citedDocumentId } : {}),
    });
    const resolved = resolveCitation(citation, this.connector);
    const snapshot =
      this.state.snapshots.find(
        (item) =>
          item.tenantId === tenantId &&
          item.matterId === matterId &&
          (input.citedDocumentId ? item.id === input.citedDocumentId : item.id === retrieve.hits[0]?.id),
      ) ?? resolved.snapshot;
    if (!snapshot) {
      throw new CliError("NOT_FOUND", "no snapshot in scope for verification", EXIT.NOT_FOUND);
    }
    const top = retrieve.hits[0];
    const output = verifyProposition({
      proposition,
      quotation,
      pinpoint,
      snapshotText: snapshot.text,
      researchJurisdiction: jurisdiction,
      authorityJurisdiction: jurisdiction,
      authorityResolved: resolved.status === "resolved",
      versionSuperseded: snapshot.text.includes("SUPERSEDED"),
      retrievedDocumentId: top?.id ?? null,
      citedDocumentId: input.citedDocumentId ?? snapshot.id,
    });
    const view: ReviewerView = {
      tenantId,
      matterId,
      propositionId: `prop:${proposition.slice(0, 24)}`,
      proposition,
      passage: snapshot.text,
      quotation,
      verdict: output.verdict,
      reasonCodes: output.reasonCodes,
      conflicts: [],
      unknowns: output.verdict === "UNRESOLVED" ? ["insufficient snapshot text"] : [],
      authorityVersions: [{ locator: snapshot.versionLocator, text: snapshot.text }],
      redline: null,
    };
    this.state.views = this.state.views.filter(
      (item) => !(item.tenantId === tenantId && item.matterId === matterId && item.propositionId === view.propositionId),
    );
    this.state.views.push(view);
    this.audit(principal, tenantId, matterId, "verify", view.propositionId);
    if (output.verdict === "UNRESOLVED") {
      throw new CliError("UNRESOLVED", "verification is UNRESOLVED", EXIT.UNRESOLVED, { ...output, proposition, propositionId: view.propositionId });
    }
    return { ...output, proposition, propositionId: view.propositionId };
  }

  loadGraph(tenant: string, matter: string): { store: InMemoryGraphStore; scope: StoreScope; graph: EvidenceGraph } {
    const scope = { tenantId: tenant, matterId: matter };
    const store = new InMemoryGraphStore();
    const stored = this.state.graphs.find((item) => item.tenantId === tenant && item.matterId === matter);
    if (!stored) {
      throw new CliError("NOT_FOUND", "no graph in workspace; run graph validate --file first", EXIT.NOT_FOUND);
    }
    const validated = store.importGraph(scope, stored.graph);
    if (!validated.ok) {
      throw new CliError("VALIDATION", "stored graph failed validation", EXIT.VALIDATION, {
        issues: validated.issues,
      });
    }
    return { store, scope, graph: stored.graph };
  }

  graphValidate(
    tenant: string,
    matter: string,
    token: string | undefined,
    file: string | undefined,
  ): { ok: true; nodeCount: number; edgeCount: number } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "matter.read");
    const store = new InMemoryGraphStore();
    const scope = { tenantId, matterId };
    let graph: EvidenceGraph;
    if (file) {
      graph = graphFromJson(readFileSync(file, "utf8"));
    } else {
      graph = this.loadGraph(tenantId, matterId).graph;
    }
    const validated = store.importGraph(scope, graph);
    if (!validated.ok) {
      throw new CliError("VALIDATION", "graph validation failed", EXIT.VALIDATION, { issues: validated.issues });
    }
    this.state.graphs = this.state.graphs.filter((item) => !(item.tenantId === tenantId && item.matterId === matterId));
    this.state.graphs.push({ tenantId, matterId, graph: store.exportGraph(scope, { redact: false }) });
    this.save();
    this.audit(principal, tenantId, matterId, "graph.validate", file ?? "workspace");
    const exported = store.exportGraph(scope, { redact: false });
    return { ok: true, nodeCount: exported.nodes.length, edgeCount: exported.edges.length };
  }

  trace(tenant: string, matter: string, token: string | undefined, startId: string | undefined): Trace {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "matter.read");
    const id = requireText("start-id", startId);
    const { store, scope } = this.loadGraph(tenantId, matterId);
    if (!store.getNode(scope, id)) {
      throw new CliError("NOT_FOUND", `node ${id} is not in scope`, EXIT.NOT_FOUND);
    }
    this.audit(principal, tenantId, matterId, "trace", id);
    return store.evidenceTrace(scope, id);
  }

  impact(tenant: string, matter: string, token: string | undefined, versionId: string | undefined): {
    trace: Trace;
    affected: { propositions: string[]; memos: string[] };
  } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "matter.read");
    const id = requireText("version-id", versionId);
    const { store, scope } = this.loadGraph(tenantId, matterId);
    const trace = store.changeImpact(scope, id);
    this.audit(principal, tenantId, matterId, "impact", id);
    return { trace, affected: affectedFromImpact(trace) };
  }

  review(
    tenant: string,
    matter: string,
    token: string | undefined,
    propositionId: string | undefined,
    action: string | undefined,
  ): { html: string; recorded: boolean } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const id = requireText("proposition-id", propositionId);
    this.authorize(token, tenantId, matterId, action ? "review.decide" : "matter.read");
    const view = this.state.views.find(
      (item) => item.tenantId === tenantId && item.matterId === matterId && item.propositionId === id,
    );
    if (!view) {
      throw new CliError("NOT_FOUND", "no reviewer view for proposition", EXIT.NOT_FOUND);
    }
    if (!action) {
      this.authorize(token, tenantId, matterId, "matter.read");
      return { html: renderReviewer(view), recorded: false };
    }
    if (!(ACTIONS as string[]).includes(action)) {
      throw new CliError("USAGE", `unknown review action ${action}`, EXIT.USAGE);
    }
    const principal = this.access().principalFor(requireText("token", token));
    if (action === "accept") {
      const approvals = new ApprovalPolicy();
      for (const item of this.state.approvals) {
        if (item.tenantId === tenantId && item.matterId === matterId) {
          approvals.record({ userId: item.actorId, tenantId, roles: ["reviewer"] }, matterId, "publish", item.at);
        }
      }
      try {
        approvals.require(tenantId, matterId, "publish");
      } catch {
        throw new CliError("APPROVAL", "accept requires a recorded publish approval", EXIT.APPROVAL);
      }
    }
    const log = new AuditLog();
    recordDecision(log, principal, view, action as ReviewerAction, "2026-08-22T00:00:00Z");
    this.audit(principal, tenantId, matterId, `review.${action}`, id);
    return { html: renderReviewer(view), recorded: true };
  }

  approve(tenant: string, matter: string, token: string | undefined): { action: "publish" } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "action.approve");
    this.state.approvals.push({
      tenantId,
      matterId,
      action: "publish",
      actorId: principal.userId,
      at: "2026-08-22T00:00:00Z",
    });
    this.save();
    return { action: "publish" };
  }

  evaluate(tenant: string, matter: string, token: string | undefined): {
    total: number;
    correct: number;
    unresolved: number;
    unresolvedCountedAsCorrect: false;
    provenanceGuard: "unavailable";
    corpus: ReturnType<typeof corpusManifest>;
    notes: string;
  } {
    const tenantId = requireText("tenant", tenant);
    const matterId = requireText("matter", matter);
    const principal = this.authorize(token, tenantId, matterId, "research.run");
    let correct = 0;
    let unresolved = 0;
    for (const item of CORPUS) {
      const output = verifyProposition(verifyInputFromEvalCase(item));
      if (output.verdict === "UNRESOLVED") {
        unresolved += 1;
        continue;
      }
      if (output.verdict === item.expectedVerdict) {
        correct += 1;
      }
    }
    this.audit(principal, tenantId, matterId, "evaluate", corpusManifest().corpusId);
    return {
      total: CORPUS.length,
      correct,
      unresolved,
      unresolvedCountedAsCorrect: false,
      provenanceGuard: "unavailable",
      corpus: corpusManifest(),
      notes:
        "Synthetic engineering fixtures only. Not expert-reviewed. Not legal reliability. Not hallucination-free.",
    };
  }

  changeClass(previous: string, next: string): ReturnType<typeof redline> {
    return redline(previous, next);
  }

  classify(previous: string, next: string): ReturnType<typeof classifyChange> {
    return classifyChange(previous, next);
  }
}

type AuthenticatorAdapter = {
  authenticate: (token: string) => Principal;
};
