# Product landscape

## Scope

Products and reusable components relevant to Synthetic Survey Lab: survey/form rendering, JSON schema validation, synthetic respondent generation, persona-grounded simulation, and evaluation datasets.

## Survey/form infrastructure

### SurveyJS Form Library

- Open-source JavaScript form library for React, Angular, Vue and plain JavaScript.[13]
- Forms are defined as JSON and rendered in the client; the definition is separate from rendering, storage and backend integration.[13]
- Supports validation, conditional logic, navigation, multi-page surveys and integration with an arbitrary backend.[13]
- SurveyJS documents separate schema/model validation, response validation and linting for broken references, dead conditions and cycles.[14]

**Assessment:** `ADAPT` candidate. The current project already has a narrow custom survey model; SurveyJS could replace or complement rendering and structural validation if the form scope grows. It should not replace the domain-level task-to-question traceability checks.

## Synthetic respondent implementations

### SurveyResponder

A Python package and CLI for generating survey responses with LLMs. The repository exposes persona and question inputs and a test directory.[15]

**Assessment:** `REFERENCE` / `EXTRACT` candidate. Useful for comparing input contracts and provenance requirements; not sufficient evidence of response validity by itself.

### PersonaVerse

An LLM-powered persona-based synthetic survey project with separate configuration, data, questionnaire, utility and web/template areas.[16]

**Assessment:** `REFERENCE`. Useful for studying a persona/questionnaire pipeline and UI separation. Audit license, model dependency and evaluation before reuse.

### AudienceKit

A project for synthetic audience studies grounded in real survey microdata. Its public examples show a panel-loading and sampling workflow with persona templates, and the repository has support for multiple model backends.[17]

**Assessment:** `REFERENCE` / possible `ADAPT` candidate for a later population-grounded mode. It is more relevant to grounded panel simulation than to the current B0 workflow.

## Evaluation resources

### Stanford AI Measurement Science survey-simulation database

Publishes item-level synthetic responses from eight LLMs over EEDI and OpinionQA questions, with response matrices and model-specific measurements.[18]

**Assessment:** `REFERENCE` for benchmark design and regression fixtures, subject to upstream licensing and dataset terms.

## Product conclusions

1. Keep the current custom domain model for B0 approval gates, provenance and versioned runs.
2. Consider SurveyJS only at the rendering/validation boundary, not as the entire research workflow.
3. Treat SurveyResponder, PersonaVerse and AudienceKit as implementation references and candidates for controlled extraction, not as validated production foundations.
4. Add an evaluation adapter capable of importing public item-level datasets where licensing permits.
