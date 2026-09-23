# Jev: a brief for Propellr

Researched September 23, 2026. Public documentation and source review, not an executed model evaluation. Companion: [Propellr recommendations](propellr-jev-recommendations.md).

## Bottom line

**Jev is a fast, text-only decision model, not a chatbot or autonomous agent.** Software supplies relevant state and a bounded answer space; Jev returns choices, scores and probabilities. Its most interesting property is answering many independent questions against shared context in one request, without generating a long response token by token.

This could make semantic routing, candidate selection and evidence review economical inside frequent software workflows. It does not replace exact computation, browser observation, complex reasoning or human accessibility judgment. “Cannot hallucinate” is an overly broad description of a narrower guarantee: outputs stay within the supplied types and options. A valid option can still be wrong. [S1–S4]

## What it does

TypeSafe calls this model category **System One**, drawing on fast, intuitive judgment rather than slow deliberation. The company describes a new architecture, parallel sampler and **Reinforcement Learning for Calibrated Decisions (RLCD)** training method. RLCD targets probabilities that track observed outcomes, rather than preferred prose or verifiable reasoning answers. These are vendor descriptions; reviewed materials do not establish an independently reproduced training or architecture result. [S1, S2]

Every request contains `model`, `state` and a map of `questions`. State can be text or structured JSON. Questions use three primitives:

| Primitive  | Meaning                                                           | Returned information                                               | Useful example                                                  |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| **Choice** | Pick from a supplied set, up to 255 options                       | Selected option, all option probabilities, confidence              | Which approved playbook best fits this state, including `none`? |
| **Score**  | Judge against an ordered rubric, normally 2–10 descriptive levels | Probability-weighted level index, distribution, legend, confidence | How clearly does this error message explain recovery?           |
| **Noul**   | Estimate probability of a yes/no proposition                      | One number from 0 to 1; **no separate confidence field**           | Does this observation contradict the agent's claim?             |

Score is not an exact measurement. A score of 1 can mean certainty about level 1 or a split between levels 0 and 2. Noul 0.5 means uncertainty about a proposition, not “medium severity.” Choice probabilities are relative to the supplied candidates: something wins even if every candidate is unsuitable. Include `none`/`insufficient evidence`, and separately test suitability where useful. [S3, S4]

### The programming model matters more than the brand

1. Code collects and filters evidence.
2. Jev answers narrow semantic questions in parallel.
3. Code combines answers, enforces invariants and decides whether to act, gather evidence or escalate.
4. A generative model writes text/code only when generation is needed.

Questions in one request cannot use each other's answers. A genuine dependency needs another request; speculative independent questions can share the first. Question IDs are correlation keys and **are not visible to the model**, so instructions must explicitly identify the relevant state and target. [S3, S5]

“No generated strings” does not prevent returning a supplied string label. Extraction works by finding candidate spans in code, asking Jev to select one, then copying the original value. Jev cannot recover a candidate that the collector omitted. [S6]

## Current service constraints

Snapshot of published documentation, not contractual guarantees: [S7, S8]

| Item             | Documented position                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Current version  | `jev-1.13.0`; both `jev-latest` and `jev-preview` currently resolve to it                    |
| Input            | Text only; no image, audio or video input                                                    |
| Context          | 64k tokens total; state plus the longest individual question must fit 32k                    |
| Price            | $0.042 per million input tokens; output tokens free                                          |
| Published limits | 250,000 tokens/second and 1,200 requests/minute; explicitly subject to change without notice |
| Access           | Hosted HTTP API; announcement describes early access                                         |
| Integration      | `POST /v1/systemone`; Python and inferred-type JavaScript/TypeScript SDKs                    |
| Adaptation       | Instructions, criteria and supplied state; no customer fine-tuning or LoRA                   |
| Languages        | English strongest; weaker non-English accuracy, including CJK                                |

Pin a version, not a moving alias, when evaluating thresholds. No self-hosted Jev deployment or downloadable weights were established by this review.

The JS docs link SDK v0.6.0. Its source declares a 10-second **per-attempt** timeout, two retries by default and no total retry budget. Successful response JSON is cast to the requested TypeScript type, not fully runtime-validated. Its debug logger can log request/response bodies. Integrators still need schema checks, redacted logging, cancellation and an end-to-end deadline. [S9]

## How convincing are the claims?

### Speed and cost: promising, workload-specific

The announcement reports 70–500 ms end-to-end latency and headline gains of 193.6× faster and 444.6× cheaper. It explicitly says those ratios are toward the high end of expected real-world gains, short inputs favor its demo, and measurements generally originate on the US West Coast near the service. These are not p95/p99 service guarantees. [S1]

The published workflow overview averages four tasks equally. Its displayed Jev point is **67.8% agreement with model-consensus labels, about $0.0004 and 0.4 seconds per case**. Jev is not the most accurate model on every task: invoice processing shows 61.8% versus 79.1% for the displayed `sol` workflow. “Accuracy” here is agreement with a reference formed from GPT-6 Astra and Claude Fable 5.1, not independently adjudicated human truth. Workflows were authored by TypeSafe's capabilities team. [S1, S10]

Competitors run through a System One adapter and are asked for probabilities, which can cost more than asking for a single constrained decision. A fair Propellr evaluation must include native structured-output LLMs, non-reasoning classifiers and deterministic heuristics, not only expensive reasoning models. [S1, S11]

### Parallel decisions: a useful, concrete mechanism

The parallel-questions cookbook compares 13 questions over one GDPR article, with five repeats. It reports roughly 12× lower cost and 10× lower latency than separate calls. The latency comparison **sums sequential calls**; concurrent calls narrow that gap. The transferable benefit is avoiding repeated state ingestion and round trips, not a guaranteed speed multiplier. [S12]

### Calibration: useful signal, not a safety certificate

Calibration concerns groups of predictions. It does not prove an individual answer, transfer automatically to accessibility tasks, or make a 0.9 `confidence` value mean 90% correctness. Choice/Score confidence is derived from distribution shape, not an independent second assessment. Repeated consistent answers can consistently be wrong. [S2, S4]

The jaggedness page shows logically related questions producing incompatible probabilities. Noul thresholds cannot simply transfer to Choice; independently evaluated questions are not statistically independent events whose probabilities can freely be multiplied. [S8]

### Cookbooks demonstrate patterns, not Propellr readiness

Especially relevant examples include skill selection, source-grounded citation checks, extraction verification and entity alignment. The skill cookbook reports wrong loads falling from 16.8% to 7.3%, but also records previously correct decisions made wrong by suggestions. Its requests are synthetic and results use Jev 1.12. The citation demonstration has eight cases; the extraction walkthrough hard-codes one illustrative fabrication and separately reports internal results on 100 prompts. Valuable prototypes, not accessibility assurance. [S13–S15]

## Limits that affect architecture

- **Semantic mistakes remain possible.** Closed-set outputs prevent invented labels, not wrong judgments.
- **Hostile input can steer answers.** TypeSafe explicitly states Jev does not treat state as hostile by default. Typed output is not prompt-injection protection.
- **Weak arithmetic, counting, dates and numeric precision.** Keep contrast, geometry, durations, bounds and counts in code.
- **Literal reading and multi-hop weakness.** Ask atomic, explicit questions; do not hand it an entire standards document and ask for compliance.
- **Large irrelevant context reduces accuracy.** A full DOM dump is usually the wrong interface.
- **No visual perception or generation.** It cannot judge an image's actual content, inspect a screenshot, write a fix or explain its reasoning. Other systems can supply descriptions, but their errors then become input limitations. [S8]

## Privacy and commercial diligence

TypeSafe documents no training on customer requests/responses and offers enterprise zero data retention by arrangement. **No training is not zero retention.** The privacy policy describes US hosting; the DPA gives purpose-based retention rather than a fixed deletion interval. The MCA also grants telemetry and specified fraud/legal processing rights. Confirm applicable order terms, retention, residency, subprocessors and ZDR before customer-data use. The trust center was inaccessible to this review; certifications were not verified. [S7, S16–S18]

MCA §2.3(b) restricts using the service or outputs for model distillation, training a model to imitate it, or developing similar/competing services. This matters to any “use Jev to train our own replacement” proposal. The feature-discovery cookbook does demonstrate downstream supervised learning from Jev features, but that is not blanket permission for distillation. Obtain written clarification for the intended use, and for adversarial evaluation under §2.3(g)'s security-testing restrictions. These are procurement questions, not legal conclusions. [S17, S19]

**Assessment:** credible enough for a bounded evaluation as an optional decision component. Not enough evidence to make it mandatory infrastructure, an accessibility oracle or a security boundary.

## Sources

All accessed September 23, 2026. First-party sources unless noted; their results were not reproduced here.

- **S1:** [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), September 15, 2026.
- **S2:** [System One](https://docs.typesafe.ai/concepts/system-one); [AI primer / RLCD](https://docs.typesafe.ai/introduction/machine-learning-primer).
- **S3:** [Primitives](https://docs.typesafe.ai/primitives); [HTTP API](https://docs.typesafe.ai/api).
- **S4:** [Confidence](https://docs.typesafe.ai/confidence); [Score](https://docs.typesafe.ai/primitives/score).
- **S5:** [State](https://docs.typesafe.ai/concepts/state); [How to build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one); [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out).
- **S6:** [Pre-parsed value extraction](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook).
- **S7:** [Models, pricing, limits and data handling](https://docs.typesafe.ai/models).
- **S8:** [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13), last reviewed September 17, 2026.
- **S9:** [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript); v0.6.0 [client source](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/client.ts) and [types/defaults](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/types.ts).
- **S10:** [Workflow evaluations](https://evals.typesafe.ai/); [Agent trace observability](https://evals.typesafe.ai/agent_trace_observability.html); [Invoice processing](https://evals.typesafe.ai/invoice_processing.html).
- **S11:** [System One LLM adapter](https://github.com/typesafe-ai/system-one-adapter-python).
- **S12:** [Parallel questions cookbook](https://docs.typesafe.ai/cookbooks/parallel_questions).
- **S13:** [Skill suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion).
- **S14:** [Citation checking](https://docs.typesafe.ai/cookbooks/citation_check).
- **S15:** [Extraction cascade](https://docs.typesafe.ai/cookbooks/sde_cascade); [Entity alignment](https://docs.typesafe.ai/cookbooks/entity_alignment).
- **S16:** [Legal and ZDR](https://docs.typesafe.ai/legal); [DPA](https://typesafe.ai/legal/data-processing).
- **S17:** [Master Customer Agreement](https://typesafe.ai/legal/mca), updated September 19, 2026.
- **S18:** [Privacy policy](https://typesafe.ai/legal/privacy-policy).
- **S19:** [Autoresearch feature discovery](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery).
