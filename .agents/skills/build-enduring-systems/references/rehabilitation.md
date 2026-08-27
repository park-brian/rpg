# Rehabilitate Existing Systems

Use this reference only for an explicitly authorized structural migration or a demonstrated transfer of decision, write, state, traffic, data, or operational authority. Do not load it for an ordinary feature, bug, local refactor, generic maintainability request, unfamiliar repository, or code that is merely long or tangled. Rehabilitation is a reversible transfer from a real old path to a real new one, not a style of routine implementation.

Treat this reference as a risk-indexed menu, not a checklist. Select only the sections demanded by the observed migration. Do not create a named record, matrix, dossier, harness, compatibility path, or ratchet unless it changes a decision, coordinates multi-step work, or controls a present risk. If the requested change remains supportable in the established design, leave the architecture alone.

## Contents

- [Define health operationally](#define-health-operationally)
- [Choose a pressured slice](#choose-a-pressured-slice)
- [Bound the truth-recovery frontier](#bound-the-truth-recovery-frontier)
- [Make evidence collection safe](#make-evidence-collection-safe)
- [Assign evidence to the right question](#assign-evidence-to-the-right-question)
- [Recover truth without fossilizing defects](#recover-truth-without-fossilizing-defects)
- [Plan from claims rather than shape](#plan-from-claims-rather-than-shape)
- [Run the rehabilitation loop](#run-the-rehabilitation-loop)
- [Demand a trustworthy seam](#demand-a-trustworthy-seam)
- [Prove exclusion and closure](#prove-exclusion-and-closure)
- [Transfer authority safely](#transfer-authority-safely)
- [Choose migration mechanics deliberately](#choose-migration-mechanics-deliberately)
- [Protect irreversible surfaces](#protect-irreversible-surfaces)
- [Stop, finish, and ratchet](#stop-finish-and-ratchet)
- [Gate rewrites separately](#gate-rewrites-separately)

## Define health operationally

A healthy system lets a capable maintainer make a representative consequential change with bounded understanding, a predictable connected change surface, explicit consequences, fast trustworthy evidence, and a credible recovery path.

Change cost and risk rise with behavioral uncertainty, fan-out, independent authorities or resolvers, state coordination, feedback delay, and irreversibility. Long methods, cycles, globals, duplication, generic layers, and flaky tests are symptoms. Diagnose whether the cause is dispersed policy authority, hidden resolution or precedence, lossy inference, hidden mutable state, unstable contracts, confused lifetimes, action at a distance, or missing evidence.

Do not reward aesthetic motion. Ask: if this smell vanished, would the next real change involve fewer independent decisions, less state coordination, a shorter trace, or stronger evidence? If not, it is probably not the current leverage point.

## Choose a pressured slice

Start from a requested behavior, recurring defect, incident path, operational burden, or repeated change pattern. Prefer a semantic choke point that affects real delivery over the largest or ugliest file.

For an authorized multi-step migration, record the minimum frame needed to keep cutover coherent. A bounded in-process refactor normally needs only the promise, present pressure, non-goals, and acceptance evidence:

| Item | Required statement |
| --- | --- |
| Promise | What must remain true, and what is deliberately changing? |
| Trace | Which input, candidate rules or commands, resolver, state or effective result, effects, output, adverse case, fallback, and cleanup actually present are in scope? |
| Pressure | What observed cost or risk makes this worth changing now? |
| Boundary | Which authorities, lifetimes, contracts, durable data, deployments, and consumers may be reached? |
| Evidence | What baseline and acceptance signals can distinguish success from regression? |
| Recovery | What is the last reversible checkpoint, kill switch, rollback, or forward-repair path? |
| Completion | Which old path and temporary machinery must disappear? |
| Non-goals | Which adjacent cleanup will be left alone? |

If the system cannot be built, exercised, observed, or recovered reliably enough for the slice, first establish that minimum delivery control. Do not turn this into a general stabilization program.

## Bound the truth-recovery frontier

Do not map the repository. Begin with the selected promise and the trace matching its mechanism:

- Imperative: `trigger -> validation -> decision authority -> state or effect -> observable result`.
- Declarative: `input and context -> applicable candidates -> precedence or resolution -> effective result -> fallback`.
- Data: `external representation -> validation and constraints -> canonical state -> projection or round trip`.
- Protocol: `message -> legal order and state -> acceptance or effect -> terminal or ambiguous outcome`.

Add only the relevant failure, retry, partial-progress, cleanup, security, concurrency, lifecycle, compatibility, and operational branches. At each step record the representation, deciding actor, evidence, and unresolved exits. Stop following a utility once it no longer decides meaning, writes state, performs an effect, owns a lifetime, or changes the promise's failure behavior.

Expand the frontier only when the trace reveals:

- an unknown authority, writer, consumer, or externally callable path;
- a durable-data, public-contract, trust, consistency, deployment, or lifetime boundary;
- a dynamic edge such as configuration, reflection, registry lookup, message routing, cron, migration, callback, trigger, or direct data access;
- material evidence that contradicts the working claim; or
- a failure or recovery path capable of changing the promise.

Generated output, vendored code, dead migrations, examples, mocks, stale documentation, framework layers, filenames, and repeated syntax are possible leads. They enter the semantic model only when connected to the scoped runtime, contract, decision, or historical obligation by evidence.

Keep a frontier log only when several unresolved exits could materially reshape or invalidate the migration. Otherwise retain the one relevant unknown in ordinary task notes and continue.

## Make evidence collection safe

Treat the test harness, fixture loader, migration command, replay utility, benchmark, debugger, and probe as actors inside the authority and capability model. Their names do not make their effects reversible or isolated. Inspect them before execution when they are unfamiliar or when durable, external, privileged, or shared state may be reached.

Before executing a consequential probe, record the claim and refuting result, target environment, exact command or interaction, read/write/external-effect classification, data and load bounds, sensitive-data handling, abort signal, cleanup or recovery, stopping condition, and whether the current request authorizes it. Prefer source inspection, fixtures, snapshots, read-only replicas, passive observation, or no-effect capabilities. Never characterize behavior by causing a real charge, notification, order, deletion, publication, destructive migration, or other irreversible effect.

Keep an evidence-safety record only when the evidence path can reach shared, durable, privileged, destructive, costly, or external state:

| Surface | What the evidence path can read, write, delete, emit, retain, or expose | Isolation or ownership boundary | Cleanup and interrupted-run behavior | Failure signal and proof |
| --- | --- | --- | --- | --- |
| Example: browser storage | Agents, threads, messages, credentials, and cached sessions | Per-run database or disposable browser context, never the production namespace | Reset only the owned namespace; close resources in `finally` | Completion and failure flags exist before bootstrap; a repeated run starts cleanly |

Audit databases and schemas; files and generated artifacts; queues, email, billing, webhooks, and other network effects; local or session storage; process and module globals; clocks and shared ports; credentials and production endpoints; seeded identifiers; cleanup that assumes success; and interference between concurrent runs. Trace destructive setup and teardown targets to an explicitly owned root or namespace.

Prefer an ephemeral environment or a dedicated isolated namespace with deterministic reset. Establish failure and completion signaling before the system under test mounts, so bootstrap failure cannot become a timeout. Make cleanup idempotent and safe after partial setup. Verify isolation with an adversarial probe--for example, place a sentinel in the production namespace and prove a test run cannot read, modify, or delete it--when consequence warrants it.

If safety cannot be established, do not execute the evidence path against live or valuable state. Inspect read-only, clone representative data into an owned environment, interpose a no-effect capability, or first build the minimum safe harness. Evidence obtained by risking unrelated state is not trustworthy delivery control.

## Assign evidence to the right question

Evidence has jurisdiction. Triangulation is not majority voting, and a source that strongly answers one question may be irrelevant to another.

| Claim | Prefer | Never sufficient alone |
| --- | --- | --- |
| What is required? | Current external obligation or accountable owner decision connected to an acceptance example or enforceable contract | Current implementation, a test, or observed behavior |
| What happens now? | Reproducible boundary observation and durable effects, followed to the active accept, commit, or reconcile path | Code reading, a comment, or an isolated mock test |
| What is enforced or impossible? | Types, closed constructors, exhaustive transitions, constraints, permissions, complete registrations, and authority protocols within a stated scope | Convention, caller discipline, or positive examples |
| What do others rely on? | Named consumers plus runtime, data, support, or operational evidence of use | Theoretical reachability or compatibility anxiety |
| Why does a choice exist? | Current accountable confirmation, obligation, or consequence corroborated by decision history and incidents | Naming, layout, pattern inference, or stale rationale |

Record provenance: runtime-reachable, boundary-observed, constraint-enforced, consumer-confirmed, operator-documented, historical-only, generated, test-only, or unknown. Preserve raw observations separately from interpretations and intended decisions.

When conflicting evidence or a negative claim can change the migration, state that claim compactly:

| Claim and scope | Kind | Supporting and conflicting evidence | Observation that would refute it | Cheapest decisive probe | Status and consequence |
| --- | --- | --- | --- | --- | --- |
| Example: within checkout writes, pricing policy X is the sole authority | Authority and exclusion | X is called by the API; a batch job is not yet traced | Any reachable writer commits price without X | Enumerate DB write permissions, jobs, triggers, migrations, and runtime writer tags | Unknown; do not consolidate yet |

Use `established`, `likely`, `unknown`, or `refuted`; do not invent numeric confidence. Search for a counterexample through alternate entrypoints, raw mutators, background work, configuration, callbacks, registrations, direct SQL or ORM access, migrations, admin tooling, deployment variants, and external actors in proportion to risk.

## Recover truth without fossilizing defects

Reproduce the scoped path before restructuring it. Trace ordinary, boundary, failure, retry, timing, authorization, concurrency, partial-progress, and cleanup behavior as relevant. Triangulate source, tests, schemas, production signals, incidents, change history, external consumers, and human decisions; none is automatically the specification.

Classify each material behavior:

| Class | Treatment |
| --- | --- |
| Required and correct | Preserve as an explicit promise with specification evidence. |
| Intended but undocumented | Resolve intent and promote it to a specification. |
| Defective | Specify the desired behavior separately; do not canonize the defect. |
| Accidental but depended upon | Name a temporary compatibility obligation, consumer, horizon, and removal condition. |
| Unknown | Instrument, compare, or narrow the slice; do not guess. |

Characterization evidence records what happens now so accidental changes are visible. Specification evidence states what ought to happen. Label the distinction. Every characterized quirk must eventually be promoted, deliberately deprecated, or removed.

State the invariant of each change. A refactoring preserves selected observable behavior; a redesign deliberately changes meaning, responsibility, or contract. Deliver redesign through behavior-preserving preparation plus separately specified semantic changes. Local cleanup improves representation inside an authority; an architectural migration changes who may decide, write, or own a lifetime and ends by removing the former authority.

Do not resolve conflicting evidence implicitly. First separate different versions, consumers, modes, time periods, scopes, representation roles, and evidence roles. If a real contradiction remains, obtain the accountable decision or preserve it as an explicit unknown with a compatibility, observation, recovery, and stopping boundary.

Never say `all`, `none`, `only`, `unused`, `unreachable`, `dead`, or `safe to delete` without a closure record containing:

- the bounded population being quantified;
- the enumeration mechanism;
- dynamic, external, configuration, permission, data, deployment, and retention blind spots;
- corroborating static and runtime or operational evidence where available; and
- a status of structurally closed, operationally bounded, or unverified.

When closure is unavailable, say `no additional path found within <scope> using <methods>` and retain the uncertainty. Repository search alone cannot close a world containing reflection, plugins, jobs, direct writes, old binaries, external consumers, or retained data.

Discovery is sufficient when every in-scope promise has a named authority or authority protocol; ordinary and relevant failure or cleanup traces reach an observable outcome; material contradictions are decided or safely bounded; exhaustive claims have closure records; acceptance evidence distinguishes required behavior from characterized defects; and no unresolved frontier exit meets the expansion rule. Then stop. Record adjacent findings separately.

## Plan from claims rather than shape

Do not turn the repository inventory into a plan. For a high-consequence, multi-step migration, keep only the rows below that change execution or recovery; do not create a dossier for completeness:

- change-slice frame;
- evidence-safety record for a probe or harness with consequential capabilities;
- claim ledger and contradiction log;
- bounded traces and relevant scenario matrix;
- behavior disposition;
- temporal authority ledger for suspended, streamed, retried, or concurrent work;
- dynamic-edge, writer, and external-interface entries relevant to closure;
- closure records for negative or exhaustive claims;
- acceptance evidence and baseline;
- recovery checkpoint and unresolved frontier exits.

Scale both process and evidence to present risk. A small in-process change needs no dossier. Durable, public, concurrent, security-sensitive, or multi-deployment migration may need explicit records only where coordination, recovery, or accountability would otherwise be lost.

When unresolved claims can reshape a multi-step migration, separate an **evidence plan** from the **change plan**. Order only those unknowns by their power to invalidate the next slice, consequence, and probe cost. Once the decisive claims are resolved or bounded, commit the next independently supportable slice and leave later structure conditional. Do not create a separate evidence phase when ordinary inspection already supports the change.

For each migration step, name only the fields that affect safe execution:

1. The promise it advances and behavior it preserves or deliberately changes.
2. The current authority or resolver and the authority or resolver intended after the step.
3. The first real caller, writer, data cohort, or traffic slice moved.
4. The nearest evidence and recovery boundary.
5. The obsolete path or temporary machinery to delete when cutover completes.
6. The non-goals and evidence that would force re-scoping.

If this information is unavailable, plan a probe, instrumentation change, consumer inventory, data profile, contract decision, or recovery rehearsal first. Do not hide an unresolved semantic question inside an extraction task. Plan only the next closed slice in implementation detail; keep later slices as hypotheses whose shape may change with evidence.

## Run the rehabilitation loop

Keep every step coherent and independently reviewable. Prefer a behavior-preserving structural move before a separately specified semantic change.

| Stage | Work | Exit evidence |
| --- | --- | --- |
| Observe | Reproduce the path; map decisions, writers, dependencies, consumers, state, side effects, and operational envelope. | Relevant behavior and existing failures are repeatable; unknowns are resolved or bounded. |
| Protect | Isolate consequential effects in the evidence path, then add only the nearest characterization, promise test, observation, or recovery control needed for the next step. | The next step can be distinguished from baseline and stopped or repaired without risking unowned state. |
| Separate | Only when the migration needs a new seam, complete the relevant [compression proof](compression.md) and expose the smallest boundary around the present policy, invariant, resolver, effect, lifetime, or volatile mechanism. Otherwise reuse the existing local composition point. | The seam lowers demonstrated reasoning or change cost, adds no ambiguous authority, and remains cheaper than direct migration. |
| Redirect | Route one real caller, writer, or traffic slice through the seam. | The path is attributable, observable, and can return safely to the verified checkpoint. |
| Prove | Compare required semantics and operational behavior, and attempt the recorded bypasses, including adversarial and failure cases proportional to risk. | Intended differences are explained; exclusions have truthful closure; compatibility, integrity, security, and capacity remain inside the accepted envelope. |
| Delete | Remove the old decision path, writes, permissions, flag, adapter, schema, job, tests, configuration, and runbook when their obligations end. | The old path cannot decide or mutate scoped state; transitional complexity is gone. |
| Ratchet | When recurrence is plausible and costly, add the smallest stable guard. Otherwise omit this stage. | The guard rejects or exposes the demonstrated recurrence without creating a new maintenance system. |

After each coherent step, run the closest evidence and inspect the trace and diff. Keep the step only if it clarifies authority or lifetime, removes duplicated policy, shortens a demonstrated path, or strengthens evidence without adding greater translation, coordination, or mode cost.

If a new guard or authority rule breaks existing evidence, pause at the contradiction. Determine whether the failure reveals a required contract, a characterized defect, a test-harness assumption, or a neighboring authority that can race or bypass the new one. Do not weaken the rule merely to restore green output, and do not rewrite the test merely because the new shape is preferred. Resolve the meaning, then change behavior and evidence separately when necessary.

## Demand a trustworthy seam

A trustworthy seam is more than a method shape. It has:

1. **Complete interception or resolution:** all scoped traffic passes through it, or an intentionally open candidate set is governed by one closed applicability, precedence, merge, and fallback protocol; every bypass is known and time-bounded.
2. **A semantic contract:** outputs, errors, side effects, ordering, atomicity, idempotency, identity, lifecycle, and validation duties are explicit where relevant.
3. **Attribution:** telemetry distinguishes old, new, bypassed, retried, and failed paths.
4. **Comparison:** old and new outcomes can be compared without duplicating dangerous effects.
5. **Enforceable direction:** stable policy does not reach around the seam into the mechanism it is meant to isolate.
6. **Reversible routing:** one caller or traffic slice can move without requiring the whole migration.

Prefer an existing composition point or local function seam, then a narrow façade or adapter. A network service is a deployment and failure boundary, not a tidier module. Reject pass-through layers, mirrored types with no semantic translation, one-consumer speculative interfaces, generic manager/service/repository families, and repo-wide dependency injection used as prerequisites.

## Prove exclusion and closure

Keep an exclusion record only when migration success depends on proving a sole authority, closed writer set, or other consequential impossibility:

| Forbidden behavior | Enforcing mechanism | Scope | Bypasses attempted | Evidence and status |
| --- | --- | --- | --- | --- |
| Example: no shipment can be requested before payment | Closed order transitions plus one capability-owning effect interpreter | Order commands in this deployment | Raw state mutation, alternate adapter call, jobs, replay, admin path | Compiler or table exhaustiveness plus dependency closure and adversarial command cases |

Prefer the strongest truthful mechanism: private or validated constructors, closed sums and exhaustive matches, canonical state with explicit projections, database constraints and permissions, capability-scoped APIs, package visibility, dependency rules, transactions or linearization points, fencing, idempotency identities, and complete authority protocols. If the language cannot make the state impossible, reject it at one named authoritative boundary and make bypasses structurally difficult.

Actively try to violate the claim through exported constructors, raw mutators, shared containers, alternate composition roots, callbacks, jobs, migrations, admin paths, reflection, deserialization, direct data writes, test hooks, retries, stale work, partial failure, overlapping rules, wrong-winner precedence, invalid or unknown inputs, and missing fallback. Positive example tests establish observed cases; they do not establish the absence of another writer, constructor, transition, dependency, candidate rule, or effect path.

Use a fresh-reader experiment only when the new boundary is widespread, expensive, difficult to reverse, or explicitly under architecture review. If such a reader must simulate many combinations or call sequences, consider a canonical representation, explicit state and transition vocabulary, narrower capabilities, or a more direct causal path when the domain supports it. Do not introduce a state machine merely for ceremony; use it when the behavior already has a closed set of meaningful states and transitions and the representation materially removes illegal combinations.

## Transfer authority safely

At every intermediate state, name the current semantic authority or distributed authority protocol, including exactly which actors may propose, accept, reconcile, commit, or write. When the invariant requires single-writer semantics, name that one logical writer. The old implementation begins as an empirical oracle, may become an implementation hidden behind the seam, then becomes a compatibility delegate or read-only fallback, and finally disappears.

For each external effect, separately name the semantic authority that decides it should occur and the capability boundary that can perform it. Prove closure over the in-scope effect paths and prove that the capability cannot be reached without an authorized decision. Concentrating a predicate while alternate callers still hold the raw capability is not authority transfer.

Moving code without moving decision rights, write permissions, transaction ownership, consumers, and operational responsibility is relocation, not rehabilitation. Shadow results may compare decisions but must not become a second authority. Compatibility copies must be projections from a named source, not peers synchronized by hope.

Track progress by traffic and authority retired, not code added. The new path working is an intermediate result. Completion means the old path and the coordination needed to keep both paths alive are gone.

## Choose migration mechanics deliberately

| Mechanic | Use and guard | Done when |
| --- | --- | --- |
| Local seam or branch by abstraction | Replace a mechanism behind a stable, semantically honest contract; avoid a permanent pass-through wrapper. | All callers use the surviving implementation and the abstraction still earns its cost. |
| Strangler route | Move a bounded external surface gradually; account for data, sessions, operations, and routing failure. | All traffic, state ownership, and operational duties leave the old component. |
| Shadow or parallel read | Compare pure or effect-isolated outcomes; prevent external mutation and protect sensitive data. | Agreed semantic and operational parity is observed, then the shadow is removed. |
| Expand-contract | Add compatible schema or protocol forms, deploy tolerant readers, migrate producers and data, then contract. | The compatibility and retention windows pass and the old reader or field is removed. |
| Dual write | Avoid when possible. If unavoidable, name one authority protocol and require idempotency, ordering, a reconciliation journal, and visible partial failure. | The new authority protocol is proven, all consumers cut over, state reconciles, and dual writing is removed. |
| Resumable backfill | Make work idempotent, checkpointed, observable, rate-limited, and non-lossy; retain originals through validation. | Every record is classified and reconciled, exceptions are resolved, and temporary tooling is removed. |
| Feature flag or adapter | Use for bounded routing or compatibility, with owner, telemetry, expiry, and deletion trigger. | The choice is no longer needed and both flag states or translation paths do not remain as permanent modes. |

For durable or public evolution, prefer `add compatible form -> deploy tolerant readers -> migrate or backfill idempotently -> transfer authority -> observe -> remove old form`. Define mixed-version, interruption, retry, duplicate, stale-reader, rollback, and forward-recovery behavior before advancing durable state.

When a stronger invariant conflicts with legacy data, do not destroy evidence, silently choose a winner, or weaken the future invariant for everyone. Represent existing exceptions or ambiguity truthfully, prevent new violations at the authoritative write path, resolve old cases under an explicit policy, and make the constraint universal only when reconciliation proves it. Keep historical facts distinct from the current claim or decision when they have different authority.

## Protect irreversible surfaces

Code is usually revertible; data, emitted events, real-world side effects, secrets, and consumer expectations often are not.

- Do not drop, overwrite, or lossily normalize production data without retained originals, verified backups, reconciliation, and restore testing.
- Do not shadow operations that can charge, notify, order, delete, or publish externally.
- Do not change identifier, money, timezone, ordering, null, hashing, encryption, canonicalization, or event meaning in place without versioned compatibility.
- Do not equate code rollback with system rollback when old code cannot read new writes or emitted messages cannot be recalled.
- Do not remove legacy readers, keys, fields, fallbacks, or external contracts before measured absence of use and the required retention window.
- Do not weaken authorization, validation, assertions, safety controls, or observability to make a migration pass.

## Stop, finish, and ratchet

Return to the last verified checkpoint when the baseline cannot distinguish regressions, required meaning is unresolved, unknown consumers make deletion unsafe, the diff crosses an unplanned authority or durable/public boundary, operational or security signals leave the accepted envelope, recovery is unacceptable, or the seam creates more modes and coordination than it removes. Preserve unrelated user changes when undoing a slice.

Finish when acceptance evidence passes; old and new failures are distinguishable; the decision and state authorities are unambiguous; old-path usage is absent by static and runtime evidence; retention and compatibility obligations are satisfied; obsolete code and transitional machinery are deleted; established checks pass; and residual risks are reported. Stop expanding at that point and record adjacent opportunities separately.

Add a focused ratchet only when recurrence is plausible and the stable guard is cheaper than the failure it prevents: a dependency rule, contract test, write permission, schema constraint, ownership check, or flag-expiry check. Do not add an architectural fitness test merely to memorialize the migration. Measure health through representative change radius, authority count, feedback time, recovery confidence, incidents, and delivery lead time; raw line count, abstraction count, or coverage percentage are not health.

For every slice ask: **Can this be deployed independently, observed for semantic correctness, stopped quickly, keep existing state readable, preserve normal delivery, and leave the system coherent if the next slice never happens?**

## Gate rewrites separately

Treat a rewrite as a product and migration decision, not a refactor. Require explicit authorization, evidence that bounded evolutionary slices cannot meet a non-negotiable constraint, an inventory of behavior and consumers, parity evidence, state and traffic cutover, recovery, observability, continued delivery, and deletion of the replaced system. Prove the claim with one bounded reversible pilot before widening it.

Rewrite a component behind a proven boundary when justified; do not rewrite an unknown system in order to discover what it means. A rewrite is complete only after the old authority, data obligations, traffic, and operations are retired.
