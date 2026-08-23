from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

from evidenceops.contracts import canonical_json


def _sort_graph(graph: Mapping[str, Any]) -> dict[str, Any]:
    nodes = sorted(list(graph.get("nodes", [])), key=lambda node: str(node.get("id")))
    edges = sorted(list(graph.get("edges", [])), key=lambda edge: str(edge.get("id")))
    return {
        "schemaVersion": graph.get("schemaVersion"),
        "nodes": nodes,
        "edges": edges,
    }


def graph_to_canonical_json(graph: Mapping[str, Any]) -> str:
    return canonical_json(_sort_graph(graph))


def graph_to_jsonl(graph: Mapping[str, Any]) -> str:
    normalized = _sort_graph(graph)
    lines = [canonical_json({"kind": "meta", "schemaVersion": normalized["schemaVersion"]})]
    for node in normalized["nodes"]:
        payload = {"kind": "node", **node}
        lines.append(canonical_json(payload))
    for edge in normalized["edges"]:
        payload = {"kind": "edge", **edge}
        lines.append(canonical_json(payload))
    return "\n".join(lines) + "\n"


def graph_from_jsonl(text: str) -> dict[str, Any]:
    nodes: list[Any] = []
    edges: list[Any] = []
    schema_version = 1
    for line in text.split("\n"):
        if not line.strip():
            continue
        parsed = json.loads(line)
        kind = parsed.pop("kind", None)
        if kind == "meta":
            schema_version = int(parsed.get("schemaVersion", 1))
        elif kind == "node":
            nodes.append(parsed)
        elif kind == "edge":
            edges.append(parsed)
        else:
            raise ValueError(f"unknown jsonl kind {kind}")
    return {"schemaVersion": schema_version, "nodes": nodes, "edges": edges}
