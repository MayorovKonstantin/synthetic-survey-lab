# Technical domain research plan

## Decision to support

Select a defensible, implementable method for the next Synthetic Survey Lab increment without claiming that synthetic respondents reproduce real people.

## Research questions

1. Which open-source survey/form libraries can be reused or adapted?
2. Which synthetic-respondent implementations expose reproducible methods and provenance?
3. Which persona-generation and persona-conditioning approaches are supported by evidence?
4. Which questionnaire-generation and formal-validation techniques are established?
5. Which cognitive-probing approaches can be adapted without mislabeling synthetic probes as human interviews?
6. Which methods detect stereotyped, caricatured or overly homogeneous responses?
7. Which evaluation metrics and benchmarks are available for synthetic respondents?
8. Which frontend/backend/persistence components fit the current local Node + SQLite baseline?
9. What are the licensing, privacy, cost, latency and reproducibility constraints?

## Search scope

- Primary sources: papers, official documentation, repositories, standards and benchmarks.
- Secondary sources: reviews and engineering analyses used to discover primary sources.
- Product evidence: official product documentation, public technical posts, APIs, repositories and patents.
- Every material claim must be registered with provenance.

## Evidence labels

- `ESTABLISHED` — supported by authoritative or repeated evidence and applicable to the claim.
- `CANDIDATE` — promising approach requiring a project experiment.
- `CONFLICT` — credible sources disagree or results are context-dependent.
- `UNKNOWN` — insufficient evidence.

## Required outputs

- product landscape;
- architecture patterns;
- algorithm and method catalog;
- evidence matrix;
- open-source reuse assessment;
- research gaps;
- BMAD technical handoff;
- experiment backlog for candidate methods.

## Research boundary

The research must support a product or engineering decision. It is not a general literature survey. Do not recommend a method for production solely because it is popular, plausible or present in one paper.
