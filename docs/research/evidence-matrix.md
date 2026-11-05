# Evidence matrix

| ID | Claim or method | Type | Source(s) | Dataset/context | Baseline | Metric/result | Reproducible? | Applicability | Status | Next action |
|---|---|---|---|---|---|---|---|---|---|---|
| E-001 | SurveyJS JSON-driven rendering and validation | Form infrastructure | [13][14] | JSON forms and response data | Model/linter/server validation | Structural and logic defects are detectable before rendering/storage | yes | High for form layer; not for synthetic validity | CANDIDATE | Compare adapter cost with current form model |
| E-002 | Persona variables can change LLM outputs | Persona conditioning | [19] | Subjective NLP datasets | Ground-truth annotations and non-persona prompting | Effects are modest and context-dependent | paper code/data to verify | Medium; needs paired-persona fixture | CANDIDATE | Add fixed-question paired-persona test |
| E-003 | Prompt/question perturbations affect synthetic responses | Robustness | [21] | World Values Survey questions; multiple models | Original prompts | Recency bias and sensitivity to phrasing/order observed | paper code/data to verify | High for survey QA | CANDIDATE | Add perturbation regression suite |
| E-004 | Specialized distribution simulation can outperform zero-shot baselines | Aggregate simulation | [22] | Global cultural surveys | Zero-shot and alternative methods | Improvement reported, with difficulty on unseen settings | paper code/data to verify | Low for B0; relevant to later population mode | CANDIDATE | Evaluate only after B0 provenance gates |
| E-005 | Public item-level synthetic survey matrices can be benchmark inputs | Evaluation data | [18] | EEDI and OpinionQA | Multiple LLMs | Published response matrices and model-level measurements | repository/license review needed | Medium for benchmark adapter | CANDIDATE | Verify terms and import format |
| E-006 | Synthetic-human alignment varies substantially by item and subgroup | Validity limitation | [20] | Chilean probabilistic public-opinion survey | Human reference responses | Strong results on some items but heterogeneous overall alignment | paper data/method review needed | High as a guardrail | ESTABLISHED | Keep human-fidelity claim unestablished |

## Status definitions

- `ESTABLISHED`
- `CANDIDATE`
- `CONFLICT`
- `UNKNOWN`

## Evidence levels

1. Published evidence.
2. Reproducible implementation or benchmark.
3. Evidence in a context similar to this product.

A method should not become a production recommendation without stating which levels are present.
