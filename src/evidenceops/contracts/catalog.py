from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, TypedDict

SCHEMA_VERSION = 1
SCHEMA_ID = "evidenceops.contracts.v1"


class NodeTypeDef(TypedDict):
    name: str
    prefix: str
    scope: str
    naturalKey: list[str]


class Catalog(TypedDict):
    schemaVersion: int
    schemaId: str
    verdicts: list[str]
    reviewerStates: list[str]
    redactionClassifications: list[str]
    dataAvailability: list[str]
    verdictMethods: list[str]
    impactKinds: list[str]
    reasonCodes: list[str]
    nodeTypes: list[NodeTypeDef]
    edgeTypes: list[str]


def catalog_path() -> Path:
    return (
        Path(__file__).resolve().parents[3]
        / "packages"
        / "contracts"
        / "schemas"
        / "v1"
        / "catalog.json"
    )


@lru_cache(maxsize=1)
def load_catalog() -> Catalog:
    parsed: Any = json.loads(catalog_path().read_text(encoding="utf-8"))
    if parsed.get("schemaVersion") != SCHEMA_VERSION:
        raise ValueError("catalog: unexpected schemaVersion")
    return parsed


def node_type_def(name: str) -> NodeTypeDef:
    for item in load_catalog()["nodeTypes"]:
        if item["name"] == name:
            return item
    raise KeyError(f"unknown node type: {name}")
