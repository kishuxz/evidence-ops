from evidenceops.contracts.canonical import canonical_json
from evidenceops.contracts.catalog import (
    SCHEMA_ID,
    SCHEMA_VERSION,
    catalog_path,
    load_catalog,
    node_type_def,
)
from evidenceops.contracts.ids import content_hash, stable_id


def proposition_admissible_in_memo(verdict: str, reviewer_state: str) -> bool:
    catalog = load_catalog()
    if verdict not in catalog["verdicts"]:
        return False
    if reviewer_state != "accepted":
        return False
    return verdict not in {"UNRESOLVED", "NO_SUPPORT"}


__all__ = [
    "SCHEMA_ID",
    "SCHEMA_VERSION",
    "canonical_json",
    "catalog_path",
    "content_hash",
    "load_catalog",
    "node_type_def",
    "proposition_admissible_in_memo",
    "stable_id",
]
