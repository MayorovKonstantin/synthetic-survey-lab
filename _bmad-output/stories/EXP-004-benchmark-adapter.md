---
id: EXP-004
slug: benchmark-adapter
status: implemented-blocked
type: experiment-story
hypothesis: H-001
owner: product-owner
---

# EXP-004 — Benchmark adapter

## Intent

Create a common, provenance-preserving format for comparing synthetic survey outputs with an approved item-level reference dataset without treating the reference as automatically representative.

## Scope

### In scope

- import validation for item-level categorical responses;
- explicit source, license and access metadata;
- mapping source items to questionnaire IDs;
- reproducible category distributions;
- total variation distance per question;
- aggregate benchmark summary;
- regression test using a local non-human demo fixture.

### Out of scope

- importing a public dataset before legal/license review;
- population inference;
- causal claims;
- automatic model selection;
- storing personal data beyond the approved fixture contract.

## Acceptance criteria

1. An imported reference requires source ID and license metadata.
2. Each item retains source ID, source question ID, mapped question ID, respondent ID and value.
3. The evaluator reports synthetic and reference counts/shares per question.
4. The evaluator reports total variation distance per question and aggregate mean distance.
5. The output retains source and run provenance.
6. Invalid items, unsupported values and missing mappings are rejected.
7. The test uses a clearly labeled local demo fixture and is not presented as human evidence.
8. Existing B0 tests and Golden Path remain green.

## Proposed result shape

```json
{
  "experimentId": "EXP-004",
  "source": { "id": "demo-reference-001", "license": "internal-demo" },
  "run": { "runId": "run-1", "seed": "fixture" },
  "questions": [{ "questionId": "q2", "totalVariationDistance": 0.12 }],
  "meanTotalVariationDistance": 0.12,
  "status": "computed",
  "limitations": []
}
```

## Implementation notes

Use two pure functions:

- `importBenchmarkReference` validates and normalizes source items;
- `evaluateSyntheticAgainstBenchmark` computes distributions and divergence.

The external dataset remains blocked until terms and data review are complete.

## Verification

```bash
npm test
```
