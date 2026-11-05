---
id: EXP-001
slug: paired-persona-conditioning
status: draft
type: experiment-story
hypothesis: H-001
owner: product-owner
---

# EXP-001 — Paired-persona conditioning

## Intent

Verify that approved persona differences affect synthetic survey answers when the question, questionnaire version, seed and generation method are held constant. A difference in stored metadata alone does not pass.

## Context

The current B0 rules method already uses persona exposure and priority to produce conditioned answers. The existing tests demonstrate a difference, but the product needs an explicit experiment result with declared fixtures, measures and provenance before treating this as a maintained guardrail.

## Scope

### In scope

- a fixed paired-persona fixture in one confirmed segment;
- one or more closed questions with a declared expected distinction;
- same questionnaire version, seed and configuration for both conditions;
- answer/distribution comparison;
- provenance checks for persona, segment, question and run;
- persisted or exportable experiment result;
- regression test for the experiment.

### Out of scope

- claiming alignment with real human respondents;
- model selection or prompt optimization;
- population-level representativeness;
- changing the B0 generation method;
- adding a graph database or external benchmark.

## Fixture

Create two approved personas in the same segment:

- `persona-fast`: priority `speed`;
- `persona-careful`: priority `careful`.

Use the same questionnaire, seed and deterministic rules configuration. The primary question must have an explicit expected distinction, such as the approach question where speed and careful priorities map to different options.

## Acceptance criteria

1. The experiment uses approved personas from the same confirmed segment.
2. The questionnaire version, question ID, seed and generation configuration are recorded.
3. Every answer is linked to exactly one persona, segment, question and questionnaire version.
4. The compared conditions differ only in the declared persona profile.
5. The result reports counts or distributions by persona and question, not only a boolean pass/fail.
6. The result identifies the expected distinguishing question and whether the observed difference passed the declared rule.
7. Repeating the deterministic fixture with the same inputs produces the same result.
8. A changed seed is not accepted as evidence of persona conditioning.
9. The result explicitly states that conditioning is not evidence of human fidelity.
10. Existing B0 tests and Golden Path remain green.

## Proposed result shape

```json
{
  "experimentId": "EXP-001",
  "method": "bounded-persona-rules-v1",
  "fixture": {
    "segmentId": "segment-test",
    "personaIds": ["persona-fast", "persona-careful"],
    "questionId": "q-approach",
    "questionnaireVersion": 1,
    "seed": "exp-001-fixed"
  },
  "comparisons": [
    {
      "personaId": "persona-fast",
      "counts": {},
      "sampleSize": 0
    },
    {
      "personaId": "persona-careful",
      "counts": {},
      "sampleSize": 0
    }
  ],
  "expectedDistinction": "priority changes approach answer distribution",
  "observedDifference": true,
  "status": "pass",
  "limitations": [
    "This verifies implementation conditioning only; it does not establish human fidelity."
  ]
}
```

## Implementation notes for BMAD

Prefer a pure domain-level evaluation function over UI-only assertions. It should consume a completed study or a declared fixture and return a serializable result. Keep it separate from the survey run itself so a future LLM adapter can use the same evaluation contract.

Suggested files:

- `domain.mjs` — evaluation function and validation;
- `tests/workflow.test.mjs` — deterministic regression fixture;
- `docs/validation/results/EXP-001.md` — recorded result;
- `docs/decisions/decision-log.md` — promotion or rejection decision.

## Verification command

```bash
npm test
```
