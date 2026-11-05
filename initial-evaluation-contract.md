# Initial Evaluation Contract (generated)

**Status:** frozen for B0 on 2026-10-02; concrete fixture and observations are recorded in `../../baselines/synthetic-survey-lab-B0.md`. **Date:** 2026-10-02. Source: amended `PRD.md` §§5–8, 14, 17–18. Objective: verify the entire guided research process and measure its operation without claiming synthetic-human equivalence.

## Frozen evaluation fixture

In the first OpenSpec change, freeze one business problem, expected research tasks, contrasting segment descriptions, a small set of personas per segment, one short closed-question form, an intentional question defect, a post-run probe finding, a corrected/new question, a bounded sample size, and expected report sections. Record application revision, environment, dependency/model versions, prompts or rules, seeds/configuration and costs. Run through the browser from an empty database, restart the process, and reopen the saved research. Use a separate paired fixture for audience/persona conditioning.

## Product outcome and guardrail measures

| Measure | Collection and proposed B0 gate |
| --- | --- |
| Golden Path completion | Boolean: SC-001…SC-008 completed through UI, including approvals, first run, probe, changed questionnaire, rerun, caricature check, report and restart. **Pass required.** |
| Approval-gate integrity | Count bypasses where unconfirmed task/segment/persona influences downstream output. **Zero** in fixture; decisions survive restart. |
| Traceability | Every segment maps to a confirmed task, persona to confirmed segment, question to task, answer to persona and form version, report claim to a run or quality finding. **No orphaned records** in fixture. |
| Formal questionnaire validation | Check required question text, allowed options/scale, stable IDs, task coverage and supported form structure before each run. Record warnings separately from blocking errors. **No run on a blocking error.** |
| Revision integrity | Version 1 and version 2 are distinct; changed/new question appears only in version 2, and original responses remain linked to version 1. **Exact version/run linkage required.** |
| Post-run cognitive probe | Store probe questions, persona answers/explanations, issue findings and user disposition. **At least one actionable finding and one user-reviewed change** in fixture. Treat this as a synthetic probe, not evidence from a human cognitive interview. |
| Persona conditioning | Predeclare contrasting approved profiles and a question expected to distinguish them. Verify stored profile differences, answer attribution and a demonstrable answer/distribution difference at fixed other settings. **Pass required;** a changed seed alone fails. |
| Caricature screening | Record screened responses, rule/model version, flags and supporting examples. **Check runs and is reviewable;** false-positive/negative rates are UNKNOWN until a labeled reference set exists. |
| Result accounting and persistence | Per-option totals equal recorded respondents for each completed run. After restart, approvals, profiles, form versions, runs, flags and report match saved values. **Exact match required.** |
| Run reliability, latency, cost | Report failed valid runs / attempted runs; wall-clock times for generation and full flow; model calls/tokens/currency when applicable. **Measure first;** numeric limits require a fixed environment and approved model choice. |
| Reproducibility | Deterministic method: identical inputs/config/seed yield exact answers. Model method: retain full provenance and measure repeated-run variation. Saved results must reopen exactly in either case. |

## Quality boundary

Human-grounded fidelity remains **UNESTABLISHED**: no aligned human reference population or answers are approved. Diversity, within-segment variation, stereotyped wording, contradictory/incongruous persona handling and answer consistency are diagnostic signals, not proof of realism. The report must label synthetic observations, separate evidence from interpretation and include quality limitations. [CoMPosT](https://arxiv.org/abs/2310.11501) motivates a structured caricature review; [persona-conditioning study](https://arxiv.org/abs/2602.18462) warns that richer personas need not improve human alignment.

## Method note and change control

Survey practice commonly uses cognitive interviews **before** fielding to test question interpretation; post-survey respondent debriefing is also documented. The owner-specified sequence is a **post-run synthetic cognitive probe plus revision/rerun loop**. It must not be described as human pretesting. [CDC cognitive interviewing](https://cdc.gov/nchs/ccqder/question-evaluation/cognitive-interviewing.html), [Census testing methods](https://www.census.gov/about/policies/quality/standards/appendixa2.html), [AAPOR best practices](https://aapor.org/standards-and-ethics/best-practices/).

This contract was frozen with the B0 implementation change. Later comparisons require contract versioning, Golden Path regression, guardrail review and owner approval under the PRD.
