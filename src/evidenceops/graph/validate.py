from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from evidenceops.contracts import load_catalog


def _present(values: list[Any]) -> list[str]:
    return [str(value) for value in values if value is not None]


def validate_graph(graph: Mapping[str, Any]) -> dict[str, Any]:
    """Validate isolation, endpoints, SUPPORTS, and citation verification.

    `@evidenceops/graph` is the complete G1 validator. Python workers must still
    refuse cross-tenant edges and implicit citation verification.
    """
    issues: list[dict[str, str]] = []
    catalog = load_catalog()
    if graph.get("schemaVersion") != catalog["schemaVersion"]:
        return {
            "ok": False,
            "issues": [{"code": "schema_version", "message": "unsupported graph schemaVersion"}],
        }

    by_id: dict[str, Mapping[str, Any]] = {}
    for node in graph.get("nodes", []):
        node_id = str(node.get("id"))
        by_id[node_id] = node
        attributes = node.get("attributes") or {}
        if node.get("type") == "Citation" and attributes.get("verified") is True:
            checks = ("identityCheck", "passageCheck", "propositionCheck")
            if any(attributes.get(field) != "complete" for field in checks):
                issues.append({"code": "citation_unverified", "message": node_id})

    for edge in graph.get("edges", []):
        source = by_id.get(str(edge.get("fromId")))
        target = by_id.get(str(edge.get("toId")))
        if source is None or target is None:
            issues.append({"code": "missing_endpoint", "message": str(edge.get("id"))})
            continue
        tenants = _present([source.get("tenantId"), target.get("tenantId"), edge.get("tenantId")])
        if tenants and any(value != tenants[0] for value in tenants):
            issues.append({"code": "isolation_mismatch", "message": str(edge.get("id"))})
        if edge.get("type") == "SUPPORTS" and target.get("type") != "Passage":
            issues.append({"code": "supports_not_passage", "message": str(edge.get("id"))})

    return {"ok": len(issues) == 0, "issues": issues}
