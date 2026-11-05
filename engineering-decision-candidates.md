# Engineering Decision Candidates (generated)

**Historical pre-build status: RECOMMENDATION, NOT APPROVED.** This generated candidate assessment preceded implementation. The B0 implementation decision is in `../../openspec/changes/archive/2026-10-02-synthetic-survey-b0/design.md`, and the measured record is in `../../baselines/synthetic-survey-lab-B0.md`. Flask was not selected because the current environment has no Python runtime; Node built-ins provided a local dependency-free path.

## Recommended simplest reasonable application shell

One local Python/Flask web application with server-rendered pages and limited browser interaction, plus SQLite for durable state. Store the business problem; proposed and confirmed tasks, segments and personas; questionnaire versions and validation results; separate survey runs and persona-conditioned answers; post-run probe findings; caricature flags; and a report whose claims refer back to source runs. Three explicit confirmation gates stop progression. The UI exposes each proposal for user review and revision. [Flask testing](https://github.com/pallets/flask/blob/main/docs/testing.rst), [Flask SQLite tutorial](https://flask.palletsprojects.com/en/stable/tutorial/database/), [Python sqlite3](https://docs.python.org/3/library/sqlite3.html).

This shell keeps frontend, backend and persistence small despite the larger workflow. Questionnaire rendering can begin with simple HTML controls and closed choices. [SurveyJS Form Library](https://github.com/surveyjs/survey-library) becomes more attractive if the accepted form scope grows.

## Generation and validation method candidates

| Stage | Simplest plausible B0 candidate | Boundary |
| --- | --- | --- |
| Problem → tasks → segments → personas → questions | One model-assisted generation interface with structured output, stage-specific prompts, visible rationale and human confirmation. | General prose makes fixed keyword rules brittle. Exact model/provider is **not selected**; local and hosted choices require feasibility, cost and reproducibility review. |
| Personas → survey answers | The same configured model may condition each answer on an approved persona and exact questionnaire version; validate answers against allowed options. | Record model/prompt/configuration and per-answer persona linkage. This demonstrates conditioning, not fidelity to humans. [SurveyResponder](https://github.com/adamrossnelson/SurveyResponder), [PersonaVerse](https://github.com/aryashah2k/PersonaVerse). |
| Formal questionnaire validation | Deterministic checks for completeness, question IDs/options, supported form shape, and task-to-question coverage; flag wording risks for review. | Structural pass cannot prove comprehension or construct validity. [Census standards](https://www.census.gov/about/policies/quality/standards/standarda2.html). |
| Post-run cognitive probe and revision | Ask a small approved persona set how they interpreted questions and chose answers; display issues, allow user-reviewed edit/addition, then rerun against a new questionnaire version. | This is a **synthetic post-run probe**, not a human cognitive interview. [CDC](https://cdc.gov/nchs/ccqder/question-evaluation/cognitive-interviewing.html), [Census methods](https://www.census.gov/about/policies/quality/standards/appendixa2.html). |
| Caricature check | Explicit reviewable heuristics and/or a model critique with examples: essentializing language, implausible within-segment uniformity, brittle answers for incongruous personas. | Treat findings as flags, not proof of absence. Accuracy needs labeled cases. [CoMPosT](https://arxiv.org/abs/2310.11501). |
| Decision report | Assemble structured sections from approved inputs, versioned runs and quality flags; if prose is generated, require citations to stored records and mark uncertainty. | The report supports a human decision and must not present synthetic output as measured customer behavior. |

The model-assisted path is a **recommendation for feasibility testing**, not an approved model dependency. A fully local bounded-rule approach remains an alternative only if it can handle the agreed example business problems, generate meaningful segments/personas/questions and produce demonstrably conditioned answers without superficial keyword matching.

## Decisions required before OpenSpec/product building

1. Freeze one realistic business-problem fixture, short form type and sample-size bound for GP-B0.
2. Select a generation/answer method and operating mode (local or hosted), with structured-output validation, cost and failure behavior.
3. Define what users can edit at each confirmation gate and how changes invalidate downstream proposals.
4. Define the synthetic-persona interview's minimum probes, evidence and revision rule; keep its distinction from human interviewing explicit.
5. Define a small caricature flag taxonomy and report sections, without inventing a fidelity threshold.
6. Approve or reject the Flask + SQLite shell and choose the local start/restart acceptance environment.

After these choices, record the approved architecture in the implementation change. Establish product B0 only after the updated Golden Path works and is measured.
