# Algorithm and method comparison

| Method / pattern | Use in product | Evidence | Strength | Limitation | B0 decision |
|---|---|---|---|---|---|
| Bounded persona rules | Deterministic baseline answers | Existing implementation and tests | Reproducible, inspectable, cheap | Narrow coverage; not evidence of human fidelity | Keep as champion baseline |
| Prompted persona-conditioned LLM | Generate tasks, personas, questions and answers | Aher, Argyle, LLM-Mirror and related literature; project candidate mode | Flexible language and richer domain coverage | Bias, instability, cost, prompt sensitivity | Keep as candidate behind validation |
| Specialized distribution simulation | Predict group-level response distributions | Cao et al. report gains from specialization but continuing difficulty on unseen settings.[5][22] | More direct fit for aggregate results | Requires training data and calibration; not individual fidelity | Research candidate |
| Grounded microdata panel | Sample personas from real survey microdata | AudienceKit and measurement-database pattern.[17][18] | Explicit population grounding | Data access, licensing, privacy and distribution shift | Research candidate |
| JSON schema/form validation | Validate structure, options, conditions and responses | SurveyJS model/linter/server validation.[13][14] | Deterministic guardrail before run | Does not establish comprehension or construct validity | Adopt concept; current custom checks remain |
| Prompt perturbation testing | Robustness evaluation | Large-scale perturbation study finds sensitivity and recency bias across tested models.[21] | Directly tests wording/order sensitivity | Requires a test suite and reference expectations | Add to evaluation backlog |
| Persona-effect evaluation | Test whether persona variables affect outputs | ACL study finds modest, context-dependent persona effects.[19] | Prevents superficial persona conditioning | Effects may be small or dataset-specific | Add paired-persona test |

## Recommendation

Use a two-track implementation:

1. **Champion:** current bounded rules for deterministic Golden Path and regression tests.
2. **Candidate:** structured model adapter for richer generation, accepted only when schema checks, provenance, conditioning tests, perturbation checks and product-level evaluation pass.

Do not select a single model or prompt as a production truth. Treat model choice, prompt structure, persona representation and sampling as experimental factors.
