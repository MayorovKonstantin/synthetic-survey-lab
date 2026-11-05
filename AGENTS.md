# Synthetic Survey Lab — project rules

## Purpose

This repository is the implementation project for Synthetic Survey Lab. It is a working product repository, not a claim that synthetic respondents reproduce real people.

## Source of truth

- `PRD.md` is the current product input unless a newer approved BMAD artifact supersedes a section.
- `docs/research/` contains research, sources, claims and technical evidence.
- `docs/product/` contains hypotheses, MVP decisions and product assumptions.
- `docs/decisions/decision-log.md` contains strategic and scope decisions.
- `docs/validation/` contains evaluation results and learnings.
- Existing implementation files and tests remain canonical for the current B0 behavior.
- Do not create duplicate PRD, architecture or story documents outside the BMAD artifact layout once BMAD artifacts are installed.

## Evidence rules

- Separate facts, interpretations, hypotheses and decisions.
- Cite external claims and preserve source provenance.
- Classify technical approaches as ESTABLISHED, CANDIDATE, CONFLICT or UNKNOWN.
- Do not describe synthetic observations as observations from real people.
- Do not claim human fidelity without an approved human-grounded evaluation set.

## Change rules

- Preserve the B0 Golden Path and its evaluation contract unless an explicit decision changes it.
- Version questionnaire changes and never overwrite historical runs.
- Keep implementation-changing experiments isolated and measurable.
- Do not edit a file while another agent is actively editing it.
- Run the relevant tests before declaring a change complete.
- Record important scope, architecture and evaluation changes in `docs/decisions/decision-log.md`.

## Handoffs

- Hermes prepares research, evidence, hypotheses, decisions and review findings.
- BMAD owns Product Brief, PRD, UX, architecture, epics, stories and implementation specs.
- Codex implements and tests approved BMAD stories.
- Human approval is required for scope changes, external outreach and changes to evaluation claims.
