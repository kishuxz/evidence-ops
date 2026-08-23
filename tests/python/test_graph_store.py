from evidenceops.graph import InMemoryGraphStore, graph_from_jsonl, graph_to_jsonl


def test_store_isolates_tenants() -> None:
    store = InMemoryGraphStore()
    graph = {
        "schemaVersion": 1,
        "nodes": [
            {
                "schemaVersion": 1,
                "type": "Jurisdiction",
                "id": "jur_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "tenantId": None,
                "matterId": None,
                "sourceLocator": None,
                "retrievedAt": None,
                "contentHash": None,
                "redaction": "public",
                "attributes": {},
            }
        ],
        "edges": [],
    }
    tenant_a = "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    tenant_b = "ten_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    matter = "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    assert store.import_graph(tenant_a, matter, graph)["ok"] is True
    assert store.get_node(tenant_a, matter, "jur_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") is not None
    assert store.get_node(tenant_b, matter, "jur_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") is None


def test_jsonl_round_trip() -> None:
    graph = {"schemaVersion": 1, "nodes": [], "edges": []}
    encoded = graph_to_jsonl(graph)
    assert graph_from_jsonl(encoded)["schemaVersion"] == 1
    assert graph_to_jsonl(graph_from_jsonl(encoded)) == encoded
