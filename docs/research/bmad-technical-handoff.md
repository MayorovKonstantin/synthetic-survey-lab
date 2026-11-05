# BMAD technical handoff

## Product problem

Synthetic Survey Lab needs an inspectable local workflow for turning a business problem into a validated, versioned synthetic-survey decision report. B0 must not claim that synthetic responses represent real people.

## Selected segment

Product managers and product researchers who need fast preliminary hypothesis generation and questionnaire/segment pre-testing before human research.

## Required capabilities

- approval-gated tasks, segments and personas;
- versioned JSON-like questionnaire definition;
- deterministic formal validation before a run;
- pluggable synthetic-respondent method;
- per-answer persona, segment, questionnaire-version and run provenance;
- synthetic post-run probe explicitly labeled as non-human evidence;
- revision and rerun without overwriting historical results;
- caricature/quality flags with supporting examples;
- decision report that separates synthetic observations from human evidence;
- persistence and restart/reopen behavior.

## Candidate architecture patterns

1. Keep the current custom domain workflow and SQLite persistence as the B0 authority.
2. Keep rendering behind a replaceable form adapter.
3. Consider SurveyJS for richer form rendering and structural/linter validation if the form scope grows; it does not replace domain traceability or synthetic-response evaluation.[13][14]
4. Keep model generation behind a structured synthetic-respondent adapter.
5. Add benchmark import/evaluation separately from the user-facing Golden Path.

## Candidate algorithms and methods

- Bounded persona rules: current reproducible champion.
- Structured persona-conditioned LLM: candidate for richer generation; schema and domain checks mandatory.
- Prompt perturbation suite: candidate robustness check for wording and answer-order sensitivity.[21]
- Paired-persona test: candidate check that approved persona differences affect answers rather than only metadata.[19]
- Grounded microdata/panel simulation: later research track, not a B0 dependency.[17][18]
- Specialized distribution simulation: later population-level research track; evidence is promising but context-dependent on unseen settings.[22]

## Evidence level

- Published evidence exists for persona effects, perturbation sensitivity, synthetic survey simulation and specialized distribution simulation.[19][20][21][22]
- Reproducibility and licensing of candidate datasets/code still require verification.
- Human-grounded fidelity for this product remains unestablished.

## Recommended approach

Preserve the current B0 rules method as the champion baseline. Implement candidate model methods behind the existing validation/provenance contract. Compare candidates against the champion on fixed fixtures before changing the default.

## Alternatives rejected for B0

- Replacing the domain model with a generic form library.
- Treating a product's public marketing claims as algorithmic evidence.
- Treating a single paper or benchmark as proof of production applicability.
- Adding a graph/vector database before query needs justify it.
- Making population-level human alignment a B0 acceptance criterion.

## Known limitations

- Synthetic responses are not human observations.
- Persona effects may be modest and context-dependent.[19]
- Prompt wording and answer order can change outputs and produce recency bias.[21]
- Synthetic-human alignment is heterogeneous across items and subgroups.[20]
- Public repositories and datasets require license/terms review before reuse.

## MVP recommendation

Do not change the current B0 implementation yet. First add a measured experiment harness for:

1. paired-persona conditioning;
2. wording and answer-order perturbations;
3. repeated-run variation;
4. model/prompt/configuration provenance;
5. benchmark import where licensing permits.

## Validation and benchmark plan

- Keep the frozen B0 Golden Path regression.
- Add fixed paired-persona fixtures with expected distinguishability.
- Add perturbation fixtures and compare distributions, option-order effects and answer stability.
- Store model, prompt/plan, configuration, seed, source dataset and cost/latency metadata.
- Report synthetic observations, diagnostic quality flags and human-grounded evidence in separate sections.

## BMAD implications

- Product Brief: state that the product supports preliminary synthetic research and decision support.
- PRD: require provenance, versioning, approval gates and explicit limitations.
- Architecture: retain replaceable form and respondent adapters.
- Epics / Stories: create the experiment harness before adding new generation methods.
