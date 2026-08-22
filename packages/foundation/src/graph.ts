export type WorkNode = {
  id: string;
  work: string;
  dependsOn: string[];
  mode: string;
};

const ID_PATTERN = /^[A-Z]\d+$/;

function splitRow(line: string): string[] | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) {
    return undefined;
  }
  const parts = trimmed
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (parts.length < 3) {
    return undefined;
  }
  const id = parts[0];
  if (!id || !ID_PATTERN.test(id)) {
    return undefined;
  }
  return parts;
}

function parseDependsOn(cell: string): string[] {
  if (cell === "" || cell === "—" || cell === "-" || cell === "–") {
    return [];
  }
  return cell
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function parseExecutionGraph(markdown: string): WorkNode[] {
  const nodes: WorkNode[] = [];
  for (const line of markdown.split("\n")) {
    const parts = splitRow(line);
    if (!parts) {
      continue;
    }
    const id = parts[0];
    const work = parts[1];
    const depends = parts[2];
    const mode = parts[3] ?? "";
    if (!id || work === undefined || depends === undefined) {
      continue;
    }
    nodes.push({
      id,
      work,
      dependsOn: parseDependsOn(depends),
      mode,
    });
  }
  return nodes;
}

export function parseProgressIds(markdown: string): string[] {
  return parseExecutionGraph(markdown).map((node) => node.id);
}
