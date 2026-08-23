from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from evidenceops.graph.validate import validate_graph


class InMemoryGraphStore:
    def __init__(self) -> None:
        self._graphs: dict[tuple[str, str], dict[str, Any]] = {}

    def import_graph(
        self, tenant_id: str, matter_id: str, graph: Mapping[str, Any]
    ) -> dict[str, Any]:
        result = validate_graph(graph)
        if not result["ok"]:
            return result
        for node in graph.get("nodes", []):
            if node.get("tenantId") and node.get("tenantId") != tenant_id:
                return {
                    "ok": False,
                    "issues": [{"code": "isolation_mismatch", "message": str(node.get("id"))}],
                }
        self._graphs[(tenant_id, matter_id)] = {
            "schemaVersion": graph.get("schemaVersion"),
            "nodes": list(graph.get("nodes", [])),
            "edges": list(graph.get("edges", [])),
        }
        return {"ok": True, "issues": []}

    def get_node(self, tenant_id: str, matter_id: str, node_id: str) -> dict[str, Any] | None:
        graph = self._graphs.get((tenant_id, matter_id))
        if graph is None:
            return None
        for node in graph["nodes"]:
            if node.get("id") == node_id:
                return node
        return None
