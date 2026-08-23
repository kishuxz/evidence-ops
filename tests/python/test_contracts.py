from __future__ import annotations

from evidenceops.contracts import canonical_json, content_hash, load_catalog, stable_id


def test_canonical_json_sorts_keys() -> None:
    assert canonical_json({"b": 1, "a": 2}) == '{"a":2,"b":1}'


def test_stable_id_is_deterministic() -> None:
    assert stable_id("Tenant", {"slug": "acme"}) == stable_id("Tenant", {"slug": "acme"})
    assert stable_id("Tenant", {"slug": "acme"}).startswith("ten_")


def test_content_hash_sha256() -> None:
    expected = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    assert content_hash("hello") == expected


def test_catalog_has_seven_verdicts() -> None:
    catalog = load_catalog()
    assert catalog["verdicts"] == [
        "FULL_SUPPORT",
        "PARTIAL_SUPPORT",
        "NO_SUPPORT",
        "CONTRADICTED",
        "WRONG_JURISDICTION",
        "STALE_AUTHORITY",
        "UNRESOLVED",
    ]
    assert "missing_connector_data" in catalog["dataAvailability"]


def test_unresolved_is_not_memo_admissible() -> None:
    from evidenceops.contracts import proposition_admissible_in_memo

    assert proposition_admissible_in_memo("FULL_SUPPORT", "accepted") is True
    assert proposition_admissible_in_memo("UNRESOLVED", "accepted") is False
