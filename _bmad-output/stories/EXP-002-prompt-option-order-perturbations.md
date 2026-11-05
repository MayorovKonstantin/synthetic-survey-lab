---
id: EXP-002
slug: prompt-option-order-perturbations
status: done
type: experiment-story
hypothesis: H-001
owner: product-owner
---

# EXP-002 — Prompt and answer-option perturbations

## Intent

Measure how much a controlled change to question wording or answer-option order changes synthetic responses. The result is diagnostic; it does not define a universal acceptable threshold.

## Scope

### In scope

- baseline and perturbed questionnaire fixtures;
- same personas, question ID, seed and generation method;
- one controlled perturbation per comparison;
- answer distributions and option-level changes;
- provenance for both runs;
- serializable evaluation result;
- regression test.

### Out of scope

- changing the B0 default method;
- claiming that robustness equals human-like behavior;
- testing all linguistic perturbations;
- model optimization;
- population representativeness.

## Initial fixture

Compare the same approved study twice:

- baseline: original `q2` wording and options;
- perturbed: same `q2` with answer options reordered;
- same personas, questionnaire version, sample size, seed and method.

A second wording-paraphrase fixture may be added after the option-order comparison is working.

## Acceptance criteria

1. Baseline and perturbed runs use the same declared seed, personas, sample size and method.
2. The comparison identifies the controlled perturbation.
3. Every compared answer retains persona, segment, question, questionnaire version and run provenance.
4. The result reports counts and shares for both runs.
5. The result reports option-level distribution deltas.
6. The result distinguishes unchanged, changed and invalid comparisons.
7. A changed distribution is recorded as a diagnostic signal, not automatically as a product failure.
8. Existing B0 tests and Golden Path remain green.
9. The result explicitly states that robustness testing does not establish human fidelity.

## Proposed result shape

```json
{
  "experimentId": "EXP-002",
  "perturbation": { "type": "option-order", "questionId": "q2" },
  "baseline": { "runId": "run-1", "seed": "exp-002-fixed", "counts": {}, "shares": {} },
  "perturbed": { "runId": "run-1", "seed": "exp-002-fixed", "counts": {}, "shares": {} },
  "distributionDelta": {},
  "changed": true,
  "status": "diagnostic",
  "limitations": []
}
```

## Implementation notes

Implement a pure comparison function over two completed studies/runs. Do not hide the comparison inside the generation method. This keeps the experiment reusable for future LLM adapters and wording perturbations.

Suggested files:

- `domain.mjs` — comparison function and validation;
- `tests/workflow.test.mjs` — fixed option-order fixture;
- `docs/validation/results/EXP-002.md` — observed result;
- `docs/decisions/decision-log.md` — interpretation and follow-up.

## Verification

```bash
npm test
```
