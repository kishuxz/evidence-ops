# Five-minute founder demo (local only)

This scripted walkthrough is for a private machine. It is **not** legal advice, not a
citator, not hallucination-free, and not a public product tour.

Requires Node 20.x, pnpm 10.14.0, and `bash scripts/demo.sh start`.

1. Create tenant and matter (seeded).
2. Ingest immutable fixture snapshots (not CourtListener).
3. Retrieve passages in-scope.
4. Extract the material proposition and citation from the seed.
5. Verify support using the seven verdicts.
6. Record reviewer approval, then accept.
7. Update an authority snapshot (new text, change class).
8. Traverse the temporal evidence graph.
9. List affected conclusions and memos.
10. Produce a redlined update with provenance.

Run:

```bash
bash scripts/demo.sh start
bash scripts/demo.sh script
bash scripts/demo.sh stop
```

Do not expose port 8787 on a public interface.
