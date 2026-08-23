from evidenceops.graph import validate_graph


def test_missing_endpoint_is_not_ok() -> None:
    result = validate_graph(
        {
            "schemaVersion": 1,
            "nodes": [],
            "edges": [
                {
                    "id": "edg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "type": "SUPPORTS",
                    "fromId": "prp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "toId": "psg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "tenantId": None,
                    "matterId": None,
                    "impactKind": None,
                }
            ],
        }
    )
    assert result["ok"] is False
    assert any(issue["code"] == "missing_endpoint" for issue in result["issues"])
