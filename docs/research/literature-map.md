# Literature map

## Core synthetic-sample work

- Argyle et al., *Out of One, Many: Using Language Models to Simulate Human Samples* — conditioning on socio-demographic backstories and comparing synthetic and human distributions.[1]
- Aher, Arriaga and Kalai, *Using Large Language Models to Simulate Multiple Humans and Replicate Human Subject Studies* — Turing Experiments and distortion checks across classic studies.[2]
- Kim et al., *LLM-Mirror: A Generated-Persona Approach for Survey Pre-Testing* — persona-grounded pre-testing and individual-level comparison claims.[3]

## Persona and survey-response evidence

- Hu and Collier, *Quantifying the Persona Effect in LLM Simulations* — persona variables have context-dependent and generally modest effects; persona prompting is not automatically sufficient.[19]
- Yu et al., *An Analysis of Large Language Models for Simulating User Responses in Surveys* — identifies difficulty adapting viewpoints to demographic features and the risk of single-perspective outputs.[4]
- Cao et al., *Specializing Large Language Models to Simulate Survey Response Distributions for Global Populations* — specialized distribution simulation improves over baselines in studied settings, while unseen settings remain difficult.[22]
- *Prompt Perturbations Reveal Human-Like Biases in LLM Survey Responses* — wording and answer-order perturbations reveal sensitivity and recency bias across tested models.[21]
- *Emulating Public Opinion: A Proof-of-Concept of AI-Generated Synthetic Survey Responses for the Chilean Case* — evaluates synthetic-human alignment against a probabilistic survey and reports substantial item-level heterogeneity.[20]

## Evaluation resources

- Stanford AIMS measurement database — item-level synthetic responses from multiple LLMs and surveys, suitable as a reference for response-matrix storage and benchmark adapters.[18]

## Research position for this project

The literature supports synthetic surveys as a tool for pre-testing, scenario analysis and hypothesis generation. It does not justify treating a synthetic sample as an automatic substitute for a representative human sample. B0 must therefore optimize for inspectability, provenance, conditioning tests, questionnaire quality and decision support before attempting population-level fidelity.

## Next literature tasks

1. Verify full metadata and licensing for every candidate dataset.
2. Extract evaluation metrics and baselines into `evidence-matrix.md`.
3. Identify reproducible code for perturbation and persona-conditioning tests.
4. Define the project's paired-persona, wording-perturbation and repeat-run fixtures.
5. Add negative and conflicting evidence, not only supportive papers.
