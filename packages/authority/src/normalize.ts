export type NormalizedCitation = {
  citationKey: string;
  volume: string;
  reporter: string;
  page: string;
  year: string | null;
  pinpoint: string | null;
};

const REPORTER_PATTERN = /(\d+)\s+([A-Za-z][A-Za-z.\s]*?)\s+(\d+)(?:\s+\((\d{4})\))?/;
const PINPOINT_PATTERN = /(?:at|p\.|pp\.)\s*(\d+)/i;

export function normalizeCitation(raw: string): NormalizedCitation | null {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  const match = collapsed.match(REPORTER_PATTERN);
  if (!match) {
    return null;
  }
  const volume = match[1] ?? "";
  const reporter = (match[2] ?? "").replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const page = match[3] ?? "";
  const year = match[4] ?? null;
  const pinpointMatch = collapsed.match(PINPOINT_PATTERN);
  return {
    citationKey: `${volume} ${reporter} ${page}`,
    volume,
    reporter,
    page,
    year,
    pinpoint: pinpointMatch?.[1] ?? null,
  };
}
