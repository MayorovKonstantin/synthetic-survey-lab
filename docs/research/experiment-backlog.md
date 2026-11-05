# Technical experiment backlog

## EXP-001 — Paired-persona conditioning

**Question:** Do approved persona differences produce answer differences when question, seed and model settings are held constant?

**Fixture:** Two personas in the same segment with intentionally contrasting priorities; one question expected to distinguish them.

**Measure:** answer/distribution difference, persona attribution integrity, repeated-run variation.

**Pass condition:** difference is attributable to persona profile and survives fixed-seed replay; metadata-only differences fail.

**Status:** ready for BMAD story planning.

## EXP-002 — Prompt and option-order perturbations

**Question:** How sensitive are synthetic answers to wording, paraphrasing, typos and answer-option order?

**Fixture:** Same questionnaire with controlled perturbations.

**Measure:** answer stability, last-option preference, distribution divergence and question-level flips.

**Pass condition:** no universal pass threshold yet; produce a diagnostic report and preserve the result as a baseline.

**Status:** proposed.

## EXP-003 — Repeated-run variation and provenance

**Question:** Can the system reproduce a run and explain any variation?

**Fixture:** Same study, questionnaire version, persona set, model/plan, configuration and seed; then controlled changes to one factor.

**Measure:** exact replay rate, changed-factor attribution, latency, token/cost metadata where available.

**Pass condition:** identical deterministic runs replay exactly; model runs retain complete provenance and expose variation.

**Status:** proposed.

## EXP-004 — Benchmark adapter

**Question:** Can licensed public item-level response matrices be imported into a common evaluation format?

**Fixture:** One approved dataset after terms and license review.

**Measure:** import completeness, item/question mapping, model/run provenance and reproducible aggregate calculations.

**Pass condition:** imported data can be traced from source item to stored response and evaluation output.

**Status:** blocked on license and data review.

## Ordering

1. EXP-001 — directly protects the current B0 conditioning claim.
2. EXP-003 — protects reproducibility and provenance.
3. EXP-002 — tests questionnaire/model robustness.
4. EXP-004 — adds external benchmark capability after terms review.
