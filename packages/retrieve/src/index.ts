export type IndexedDocument = {
  id: string;
  text: string;
  caption: string;
  jurisdiction: string;
  date: string;
  versionLocator: string;
};

export type RetrieveQuery = {
  text: string;
  jurisdiction?: string;
  asOf?: string;
  versionLocator?: string;
  citedDocumentId?: string;
};

export type RetrieveHit = {
  id: string;
  lexical: number;
  vector: number;
  hybrid: number;
  wrongDocumentRisk: boolean;
  caption: string;
  snippet: string;
  versionLocator: string;
  jurisdiction: string;
  date: string;
};

export type RetrieveDiagnostics = {
  retrieverVersion: "hybrid.offline.v1";
  embedding: "hashed-trigram";
  filtered: number;
  candidateCount: number;
  tieBreak: "hybrid-desc-then-id-asc";
  filtersApplied: {
    jurisdiction: boolean;
    asOf: boolean;
    versionLocator: boolean;
  };
  network: false;
  liveCourtListener: false;
};

export type RetrieveResult = {
  hits: RetrieveHit[];
  diagnostics: RetrieveDiagnostics;
};

const DIM = 64;
const SNIPPET = 160;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function snippet(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= SNIPPET ? compact : `${compact.slice(0, SNIPPET)}…`;
}

function hashEmbed(text: string): number[] {
  const vec = new Array<number>(DIM).fill(0);
  const t = text.toLowerCase();
  for (let i = 0; i < t.length - 2; i += 1) {
    const gram = t.slice(i, i + 3);
    let h = 2166136261;
    for (const ch of gram) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % DIM;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, n) => sum + n * n, 0)) || 1;
  return vec.map((n) => n / norm);
}

function cosine(left: number[], right: number[]): number {
  let sum = 0;
  for (let i = 0; i < DIM; i += 1) {
    sum += (left[i] ?? 0) * (right[i] ?? 0);
  }
  return sum;
}

function lexicalScore(query: string, doc: string): number {
  const q = new Set(tokens(query));
  const d = tokens(doc);
  if (q.size === 0 || d.length === 0) {
    return 0;
  }
  let hit = 0;
  for (const token of d) {
    if (q.has(token)) {
      hit += 1;
    }
  }
  return hit / Math.sqrt(q.size * d.length);
}

function compareHits(left: RetrieveHit, right: RetrieveHit, citedDocumentId?: string): number {
  if (citedDocumentId) {
    const leftMatch = left.id === citedDocumentId ? 1 : 0;
    const rightMatch = right.id === citedDocumentId ? 1 : 0;
    if (leftMatch !== rightMatch) {
      return rightMatch - leftMatch;
    }
  }
  if (right.hybrid !== left.hybrid) {
    return right.hybrid - left.hybrid;
  }
  return left.id.localeCompare(right.id);
}

export class OfflineIndex {
  private readonly docs: IndexedDocument[] = [];

  add(doc: IndexedDocument): void {
    this.docs.push(doc);
  }

  retrieve(query: RetrieveQuery, limit = 5): RetrieveResult {
    const candidates = this.docs.filter((doc) => {
      if (query.jurisdiction && doc.jurisdiction !== query.jurisdiction) {
        return false;
      }
      if (query.versionLocator && doc.versionLocator !== query.versionLocator) {
        return false;
      }
      if (query.asOf && doc.date > query.asOf) {
        return false;
      }
      return true;
    });
    const qVec = hashEmbed(query.text);
    const scored: RetrieveHit[] = candidates.map((doc) => {
      const combined = `${doc.caption} ${doc.text}`;
      const lexical = lexicalScore(query.text, combined);
      const vector = cosine(qVec, hashEmbed(combined));
      const hybrid = 0.5 * lexical + 0.5 * vector;
      return {
        id: doc.id,
        lexical,
        vector,
        hybrid,
        wrongDocumentRisk: Boolean(query.citedDocumentId && query.citedDocumentId !== doc.id && hybrid > 0.2),
        caption: doc.caption,
        snippet: snippet(doc.text),
        versionLocator: doc.versionLocator,
        jurisdiction: doc.jurisdiction,
        date: doc.date,
      };
    });
    scored.sort((left, right) => compareHits(left, right, query.citedDocumentId));
    return {
      hits: scored.slice(0, limit),
      diagnostics: {
        retrieverVersion: "hybrid.offline.v1",
        embedding: "hashed-trigram",
        filtered: this.docs.length - candidates.length,
        candidateCount: candidates.length,
        tieBreak: "hybrid-desc-then-id-asc",
        filtersApplied: {
          jurisdiction: Boolean(query.jurisdiction),
          asOf: Boolean(query.asOf),
          versionLocator: Boolean(query.versionLocator),
        },
        network: false,
        liveCourtListener: false,
      },
    };
  }
}
