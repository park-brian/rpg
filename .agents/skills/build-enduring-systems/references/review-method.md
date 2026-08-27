# Trace and Review Method

Use this reference only for an explicitly requested architecture audit, validation of a consequential proposed architecture, or pressure test of a high-cost completed design. Do not load it for ordinary code review, feature work, bug fixing, or local refactoring. Select only the sections needed to decide the named architecture question; produce evidence and paths, not a compliance dossier or abstract score.

## Contents

- [Establish the claims under review](#establish-the-claims-under-review)
- [Audit evidence safety](#audit-evidence-safety)
- [Build applicable traces](#build-applicable-traces)
- [Construct a compact system map](#construct-a-compact-system-map)
- [Audit exclusions and closure](#audit-exclusions-and-closure)
- [Prove compression against change](#prove-compression-against-change)
- [Run maintainability experiments](#run-maintainability-experiments)
- [Review a diff as architectural evidence](#review-a-diff-as-architectural-evidence)

## Establish the claims under review

Begin with promises and feared counterexamples, not files or pattern names. For each consequential claim record:

`claim and scope -> evidence role -> authority or enforcement -> refuting observation -> closure method -> status -> consequence`

Distinguish:

- **Fact:** a bounded source, runtime, data, or contract observation.
- **Interpretation:** the current explanation connecting facts.
- **Decision:** the behavior the accountable authority requires.
- **Exclusion:** a claim that behavior is impossible within a stated closed scope.

Actively seek one disconfirming path before accepting an interpretation. Record contradictions rather than silently preferring source, tests, runtime, history, or documentation. Treat names, folders, framework layers, and pattern resemblance as navigation clues only.

## Audit evidence safety

Before executing an unfamiliar test, fixture, script, migration, replay, benchmark, or probe that may reach shared, durable, privileged, destructive, costly, or external state, treat it as a capability-bearing program. Identify the consequential surfaces it may touch and establish an owned boundary, safe cleanup, and visible failure. For an established local check with no such capability, run it normally.

Do not assume mock, test, local, dry-run, or sandbox means no effect. If safety is not established, inspect read-only or build an isolated harness first. For consequential evidence collection, use the evidence-safety record in [rehabilitation.md](rehabilitation.md) and attempt an isolation bypass before trusting the baseline.

## Build applicable traces

Choose only traces needed to answer the named architecture question. Start with the actual requested path; add an invariant, resolution, or adverse trace only when the current contract or observed failure makes it relevant. Use the feature, invariant, and failure traces below for imperative systems; adapt them through the declarative trace when applicability and precedence resolve behavior. Do not manufacture absent state, effects, concurrency, resources, or evolution even to complete the review template.

### Feature trace

Follow `entrypoint -> parsing -> policy -> state transition -> external effect -> observable result -> evidence`.

Record each boundary crossed, representation translated, authority invoked, and place where an error changes the path. Flag duplicate policy and surprising detours.

### Invariant trace

Start from a promise such as `balances conserve value` or `selection names an existing item`. Enumerate every authority that can threaten it. Locate the final enforcement gate or distributed authority protocol, atomicity or reconciliation boundary, persisted representation, recovery behavior, and evidence.

Flag invariants enforced only by caller discipline, background repair, or comments. Distinguish deliberate layered validation from duplicated policy that can disagree.

### Failure trace

Start with a timeout, malformed input, partial write, denied permission, process loss, unavailable dependency, or corrupted durable state. Follow detection, containment, cancellation, retry, compensation, user/operator signal, and recovery.

Flag swallowed errors, unbounded retry, ambiguous completion, effects with no idempotency key or durable authorized request, projection effects that write back to their source, and failures that cross an ownership boundary silently.

### Declarative or precedence trace

Follow `input and context -> candidate sources -> applicability -> overlap -> precedence, merge, or conflict resolution -> effective result -> permitted override -> complement or fallback -> observable outcome`.

Record whether the candidate set is intentionally open or closed and whether the resolution protocol itself is closed. Identify incidental source order, specificity, registration order, defaulting, inheritance, partially supported syntax, unknown input, and zero-owner or multiple-owner cases. Distinguish a valid permanent base/enhancement partition from duplicate authorities awaiting migration.

Construct one forbidden configuration: two candidates both claim ownership, the wrong candidate wins, no candidate matches, an invalid value is accepted, a consumer override cannot win as promised, or an unsupported capability destroys the baseline. Assert the computed or canonical result and observable fallback, not merely that each individual rule parses.

### Concurrency trace

Follow `command intent -> admission or linearization -> immutable operation identity -> first suspension -> competing command or supersession -> stale resumption -> commit or effect gate -> publication -> cancellation and release`.

Record which facts are captured before suspension, which mutable values are reread afterward, who may supersede the operation, what cancellation can actually stop, and which token or authority generation fences each durable write, external effect, projection update, and `finally` cleanup. Distinguish safety from liveness: an abort request may save work without preventing a stale completion.

Construct at least one forbidden history such as `A admitted -> A waits -> B becomes current -> A resumes -> A attempts to write, publish, or clear B's state`. Also probe duplicate admission, same-task commands, reverse completion order, retry, disposal, and cancellation that loses the race when relevant. Flag UI-only busy checks, shared booleans with no owner, live ambient identity read after `await`, numeric projection positions retained across replacement, and cleanup that releases whichever operation is current rather than the one it acquired.

Derive the shortest actor-and-event history that would produce each forbidden outcome if the guard were absent. Perturb its suspension and commit points with delay, reorder, timeout followed by late success, retry, revoke, token reuse or ABA, partial commit, crash or disposal, and a nonconforming seam implementation as relevant. Assert terminal in-memory and durable state, emitted effects, user or operator signal, and cleanup--not only the returned error. When cheap and safe, demonstrate test sensitivity with a deliberately broken adapter or temporary mutant, then remove it.

### Lifecycle trace

Follow `detect capability -> acquire -> publish ready state -> use -> replace or supersede -> cancel -> release -> prove disposal`.

Include global listeners, locks, transactions, files, sockets, tasks, workers, processes, caches, leases, and subscriptions. Flag any acquisition without an adjacent owner for failure and cleanup.

### Evolution trace

Follow an old client, record, event, snapshot, configuration, or protocol message into the new system. Locate version detection, validation, migration or negotiation, authority to commit, interruption behavior, observability, rollback or forward recovery, and compatibility evidence.

Flag destructive reads, dual-write ambiguity, silently changed meaning, and migrations that cannot resume safely.

## Construct a compact system map

Construct a system map only when the requested architecture decision spans several real boundaries and the map will change that decision. Record only consequential entries:

| Concern | Question |
| --- | --- |
| Vocabulary | Within each semantic context, are distinct meanings named and representation roles labeled? |
| State | Which data is durable, preference, session, resource, derived, or historical? |
| Authority or resolver | Which users, jobs, services, replicas, callbacks, constraints, precedence relations, grammars, or platform rules decide effective meaning? Which candidates can they consider and how do conflicts resolve? |
| Time | Where are intent, admission, suspension, supersession, commit, publication, cancellation, and release linearized? |
| Enforcement | Where is each decision accepted, rejected, committed, merged, or reconciled? |
| Dependencies | Which volatile mechanisms can stable policy reach directly? |
| Effects | Where do time, I/O, randomness, scheduling, and external mutation occur? |
| Lifetimes | Who acquires, replaces, cancels, and releases each resource? |
| Contracts | Which schemas, protocols, APIs, files, and operational promises outlive an implementation? |
| Evidence | Which constraint, analysis, executable check, experiment, or monitor supports each consequential promise, and what can it not establish? |
| Closure | For every `all`, `none`, `only`, `unused`, or `unreachable` claim, what population was enumerated and which blind spots remain? |

Do not confuse a directory diagram with this map. A useful map lets a maintainer predict a change.

## Audit exclusions and closure

When the architecture claim depends on an important behavior being impossible, inspect this chain:

| Question | Required answer |
| --- | --- |
| What must not happen? | A precise counterexample with semantic and consistency scope. |
| What excludes it? | Type, constructor, exhaustive transition, constraint, permission, capability, dependency rule, transaction, fencing rule, or authority protocol. |
| Is the world closed? | The complete set of constructors, writers, routes, registrations, jobs, migrations, triggers, deployment variants, data paths, and external actors in scope. |
| Which bypasses were attempted? | Public mutation, raw data access, reflection, configuration, callback, stale or duplicate work, direct adapter access, admin or test hook, and partial failure as relevant. |
| What does the evidence prove? | Structural exclusion, runtime defense, operationally bounded absence, or unresolved uncertainty. |

Inspect representation products for accidental states. Independent flags, duplicated status fields, synchronized containers, nullable fields, mode switches, and partially initialized objects multiply combinations. Ask which combinations are meaningful, which are illegal, and what prevents construction or publication of the illegal ones.

Inspect capability closure. From a unit's imports, constructor parameters, globals, registrations, and storage permissions, enumerate what it can mutate, call, schedule, publish, or retain. An absent capability should rule out an effect. A service locator, ambient context, raw database handle, reflection hook, or generic environment bag defeats that reasoning unless tightly scoped and audited.

Inspect transition closure. Find the command vocabulary, state vocabulary, guards, effects, failures, retry ownership, and cleanup. Prefer compiler- or table-checked exhaustive handling for a genuinely closed protocol. When the behavior is open-ended, keep the extension mechanism explicit and make every registered participant conform to a strong host contract.

Do not call a promise proven because all positive examples pass. Match structural exclusions with static, schema, permission, or protocol evidence; state-space laws with generated or model checks; temporal claims with controlled schedules and fault injection; and external-absence claims with consumer and runtime evidence.

## Prove compression against change

Before endorsing an abstraction, shared kernel, inference rule, state machine, service boundary, or source reorganization, use the actual requested change, a nearest existing non-case that must remain distinct, and an adverse or evolution case only when required by the present contract. Do not invent future scenarios to make the preferred design look useful.

Complete the compression proof from [compression.md](compression.md). At minimum require:

- A one-sentence law and deliberate non-responsibility.
- A simpler direct alternative.
- An independence test for facts the candidate relates.
- One forbidden outcome and enforcement mechanism.
- Predicted semantic and mechanical touchpoints for each scenario.
- Added navigation, translation, configuration, lifetime, coordination, and failure costs.
- A disposition of keep direct, name locally, extract, narrow, reject, or investigate.

Compare prediction with a real change or bounded rehearsal. Tied evidence favors direct code. A principle, pattern name, line-count reduction, or hypothetical reuse is not a finding.

## Run maintainability experiments

Use this experiment only when independent evaluation is worth its cost because the architecture is widespread, expensive, difficult to reverse, or explicitly under review. Give a capable reader the artifact and a representative request without your architectural explanation. Select the prompts relevant to the mechanism; do not manufacture stale work, migration, replacement, or cleanup where none exists. Ask them to:

1. Locate the representation roles and authority model for one field, transition, invariant, resource, and public contract; state an important behavior each mechanism makes impossible.
2. Explain a normal path and a failure path in domain language.
3. Predict the semantic, generated, verification, delivery, and migration artifacts plus runtime boundaries the change should touch.
4. Identify how stale work, partial failure, retry, and cleanup are handled.
5. Write one forbidden history and identify the exact gate that rejects its stale write, effect, publication, and cleanup.
6. Replace or fake one volatile dependency without changing domain policy.
7. Delete one obsolete capability and its evidence without leaving mode checks or dead representations.
8. Attempt one forbidden construction, write, transition, dependency, or effect path and explain the structural or authoritative mechanism that rejects it.
9. For declarative or precedence systems, enumerate applicable candidates, predict the winner and fallback, then construct one overlap, wrong-winner, invalid-input, unknown-value, unsupported-capability, or consumer-override case.
10. State the candidate abstraction's law and nearest non-case, then predict the semantic change surface before inspecting tests or implementation details.

Compare their prediction with the actual change. Record search breadth, unexpected boundaries, duplicated rules, unexplained vocabulary, and hidden cleanup. Avoid turning the result into a universal numeric score; the mismatches are more diagnostic than the total.

## Review a diff as architectural evidence

- Group edits by changed promise rather than by filename.
- Check whether every group has an unambiguous policy authority and one coherent evidence path.
- Look for unrelated regions changed only to transport data or repeat a rule.
- Look for a local edit that silently changes a public schema, retry rule, authority boundary, or durable meaning.
- Look for new raw constructors, mutable state exposure, second writers, ambient capabilities, catch-all transitions, unchecked deserialization, dependency exceptions, and synchronized copies that reopen previously excluded behavior.
- Challenge every new `only`, `unused`, `unreachable`, and deletion claim against its closure record.
- Verify that deleted behavior removed its state, branches, compatibility code when allowed, telemetry, and tests.
- Distinguish complexity inherent in the problem from complexity introduced by the solution.

Recommend the smallest boundary correction that improves the observed traces. Do not recommend or begin a full rewrite unless a separate, explicitly authorized migration decision demonstrates that bounded evolutionary paths cannot satisfy a non-negotiable constraint.
