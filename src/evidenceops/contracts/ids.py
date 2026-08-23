from __future__ import annotations

import hashlib
import re
from collections.abc import Mapping

from evidenceops.contracts.canonical import canonical_json
from evidenceops.contracts.catalog import SCHEMA_VERSION, node_type_def

ID_PATTERN = re.compile(r"^[a-z]{2,8}_[a-f0-9]{32}$")

NaturalKey = Mapping[str, str | int]


def content_hash(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def id_payload(type_name: str, key: NaturalKey) -> dict[str, object]:
    definition = node_type_def(type_name)
    ordered: dict[str, str | int] = {}
    for field in definition["naturalKey"]:
        if field not in key:
            raise KeyError(f"natural key missing {definition['name']}.{field}")
        ordered[field] = key[field]
    extra = [field for field in key if field not in definition["naturalKey"]]
    if extra:
        raise ValueError(f"natural key extra fields for {definition['name']}: {','.join(extra)}")
    return {
        "key": ordered,
        "schemaVersion": SCHEMA_VERSION,
        "type": definition["name"],
    }


def stable_id(type_name: str, key: NaturalKey) -> str:
    definition = node_type_def(type_name)
    digest = content_hash(canonical_json(id_payload(type_name, key)))[:32]
    return f"{definition['prefix']}_{digest}"


def assert_stable_id(identifier: str) -> None:
    if not ID_PATTERN.match(identifier):
        raise ValueError(f"invalid stable id: {identifier}")


def parse_prefix(identifier: str) -> str:
    assert_stable_id(identifier)
    return identifier.split("_", 1)[0]
