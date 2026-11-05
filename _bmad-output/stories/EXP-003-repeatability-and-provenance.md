---
id: EXP-003
slug: repeatability-and-provenance
status: done
type: experiment-story
hypothesis: H-001
owner: product-owner
---

# EXP-003 — Repeated-run variation and provenance

## Intent

Verify that repeated runs can be replayed or compared with a complete record of the factors that may explain variation.

## Scope

### In scope

- two independently created studies with the same fixture;
- same questionnaire, personas, method, configuration and seed;
- exact answer and summary comparison;
- provenance completeness checks;
- a controlled changed-seed comparison;
- serializable result and regression test.

### Out of scope

- claiming that determinism is a quality guarantee;
- model calibration;
- human-fidelity evaluation;
- distributed execution;
- cost optimization.

## Acceptance criteria

1. A repeated deterministic run with identical inputs produces identical answers and summaries.
2. The result records method, seed, questionnaire version, persona IDs, segment IDs and question IDs.
3. The comparison detects missing or mismatched provenance.
4. A controlled seed change is represented as a changed factor rather than silently treated as a failed replay.
5. The result distinguishes `exact-replay`, `changed-factor` and `invalid-comparison`.
6. Existing B0 tests and Golden Path remain green.
7. The result explicitly states that reproducibility does not establish human fidelity.

## Proposed result shape

```json
{
  "experimentId": "EXP-003",
  "comparison": "exact-replay",
  "baseline": { "runId": "run-1", "seed": "exp-003-fixed" },
  "repeat": { "runId": "run-1", "seed": "exp-003-fixed" },
  "answersEqual": true,
  "summaryEqual": true,
  "provenanceComplete": true,
  "status": "pass",
  "limitations": []
}
```

## Implementation notes

Implement a pure comparison function over two completed studies/runs. Keep provenance validation separate from answer equality so a lucky matching output cannot hide missing metadata.

Suggested files:

- `domain.mjs` — reproducibility comparison;
- `tests/workflow.test.mjs` — exact replay and changed-seed fixtures;
- `docs/validation/results/EXP-003.md` — observed result;
- `docs/decisions/decision-log.md` — interpretation.

## Verification

```bash
npm test
```
