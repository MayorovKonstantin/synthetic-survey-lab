# Synthetic Survey Lab

Local full-stack training product for the Baseline-Driven Product Engineering System. The sole owner input is `PRD.md`; the research and OSS assessments are generated context. The implemented B0 is recorded in `../../baselines/synthetic-survey-lab-B0.md`, and its archived OpenSpec change is `../../openspec/changes/archive/2026-10-02-synthetic-survey-b0/`.

Start and verify the app using `RUNNING.md`. The browser takes a business problem and audience description through confirmed research tasks, segments and personas, a validated questionnaire, two synthetic survey runs separated by a synthetic-persona cognitive probe and revision, a caricature screen and a decision report. SQLite retains the full record after restart.

The recorded B0 method is a bounded, inspectable rule set. Audience wording maps to a reviewable persona priority signal; confirmed segment experience and persona priority condition answers. It is a workflow baseline, not evidence of human respondent fidelity. See `initial-evaluation-contract.md` and the B0 record for measured guardrails and limitations. The pre-build `engineering-decision-candidates.md` remains historical research context.

The current experimental branch adds a **ChatGPT subscription candidate** for generated tasks, segments, personas, questionnaire, and synthetic answers. It uses the official Sign in with ChatGPT DevKit and a separate, explicit account consent. It is not part of the approved B0 baseline. Cognitive interviews, caricature screening, report assembly, and formal checks still use local rules. `RUNNING.md` explains the connection, scope, and limitations.
