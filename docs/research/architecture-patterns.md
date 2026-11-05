# Architecture patterns

## Current B0 architecture

The repository implements a local Node application with a domain module, HTTP server, SQLite persistence and browser UI. The domain state keeps the chain:

```text
business problem → tasks → segments → personas → questionnaire versions → runs → probe → caricature check → report
```

The B0 implementation uses bounded rules for the default mode and an explicit ChatGPT candidate mode. The evaluation contract requires provenance, approval gates, versioned questionnaires, reproducibility and explicit limits on human-fidelity claims.

## Candidate patterns

### A. Custom domain workflow + JSON survey model

```text
UI
  ↓
HTTP API
  ↓
Domain workflow and gates
  ↓
Versioned survey model
  ↓
Synthetic respondent adapter
  ↓
SQLite
```

**Fit:** Best for the current B0 because it preserves domain-specific traceability and requires no new frontend dependency.

### B. SurveyJS rendering + custom domain orchestration

```text
Custom domain workflow
  ↓
SurveyJS JSON definition
  ↓
SurveyJS renderer/linter
  ↓
Custom run and provenance service
```

SurveyJS separates JSON form definitions from rendering, response collection and storage, and provides model validation plus linter/server validation options.[13][14]

**Fit:** Strong candidate when question types, branching and UI complexity exceed the current custom form. It does not provide synthetic respondent validity, persona conditioning or decision-report semantics.

### C. Grounded panel / persona simulation

```text
Reference microdata or panel
  ↓
Sampling and persona template
  ↓
LLM or calibrated response model
  ↓
Survey response matrix
  ↓
Distributional evaluation
```

AudienceKit is a public example of grounding synthetic audience studies in real survey microdata.[17] Stanford's measurement database provides a useful reference for storing item-level model response matrices.[18]

**Fit:** Later research track for population-level simulation; not required for the first product workflow.

### D. Model-assisted structured generation

```text
Approved context
  ↓
Structured model call
  ↓
Schema validation
  ↓
Domain validation
  ↓
Persisted provenance
```

**Fit:** Current ChatGPT candidate mode. The model must not be allowed to bypass IDs, approval gates, answer options, version linkage or persistence checks.

## Architectural decisions

- Preserve the custom domain layer as the authority for workflow gates and traceability.
- Keep survey rendering replaceable behind a JSON/form adapter.
- Keep response generation replaceable behind a synthetic-respondent adapter.
- Persist model, prompt/plan, configuration, seed, questionnaire version, persona and run IDs for every generated answer.
- Add benchmark import and evaluation as a separate module, not as part of the user-facing run path.
- Do not add a vector or graph database for B0; Markdown evidence and SQLite records are sufficient until query volume requires more.
