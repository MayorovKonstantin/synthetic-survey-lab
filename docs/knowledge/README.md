# Knowledge layer

The knowledge layer connects evidence to product decisions.

## Initial record types

- `Source` — paper, documentation, repository, product page, standard or news item.
- `Claim` — a bounded, source-backed statement.
- `Concept` — domain term or reusable abstraction.
- `Hypothesis` — testable product or technical assumption.
- `Decision` — approved choice with rationale.

## Provenance rule

Every important claim must point to a source or repository evidence. Use `observed`, `reported`, `inferred`, `hypothesized` and `validated` labels where applicable.

Start with Markdown and frontmatter. Do not introduce a graph database until the project has enough entities and repeated queries to justify it.
