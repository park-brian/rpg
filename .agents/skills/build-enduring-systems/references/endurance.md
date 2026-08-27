# Design for Endurance

Use this reference only when the current change crosses durable or public information, mixed versions, concurrency, retries, irreversible effects, operational recovery, or another boundary with a demonstrated lifetime beyond one coordinated local change. Do not load it merely because software should be maintainable, may live for years, or uses a framework. Apply only the sections matching the observed boundary.

## Contents

- [Preserve the layers that outlive code](#preserve-the-layers-that-outlive-code)
- [Choose the preservation horizon](#choose-the-preservation-horizon)
- [Apply the century-scale replacement test](#apply-the-century-scale-replacement-test)
- [Design durable information](#design-durable-information)
- [Design replaceable dependencies](#design-replaceable-dependencies)
- [Make concurrency semantics explicit](#make-concurrency-semantics-explicit)
- [Make operations part of correctness](#make-operations-part-of-correctness)
- [Make performance a contract](#make-performance-a-contract)
- [Keep security and authority structural](#keep-security-and-authority-structural)
- [Leave an inheritance a stranger can use](#leave-an-inheritance-a-stranger-can-use)

## Preserve the layers that outlive code

Preserve these independently of the current implementation:

1. **Meaning:** domain vocabulary, invariants, algorithms, authority, units, time, identity, ordering, and failure semantics.
2. **Information:** schemas, encodings, identifiers, canonical forms, validation rules, and representative fixtures.
3. **Interaction:** commands, events, protocols, idempotency, negotiation, retries, backpressure, and completion semantics.
4. **Evolution:** versions, compatibility windows, migration direction, deprecation, interruption behavior, rollback or forward recovery.
5. **Reproduction:** deterministic build, run, test, seed, backup, restore, and conformance paths.

Keep these commitments in types, schemas, executable tables, conformance suites, and promise-named tests where possible. Add a short decision record when a costly choice, external constraint, non-obvious safeguard, rejected alternative, or revisit trigger cannot be recovered from those artifacts.

Preserve important **negative semantics** as well as examples: which states, transitions, writers, dependencies, effects, reorderings, and partial outcomes must remain impossible. Connect each exclusion to its current enforcement scope and a technology-independent conformance case. A successor implementation may replace a type system, transaction mechanism, permission model, or protocol engine, but it must inherit the forbidden behaviors those mechanisms ruled out.

## Choose the preservation horizon

Classify each boundary before buying compatibility: one operation, one process lifetime, one coordinated release, a rolling mixed-version window, retained data, an independently released client or provider, or an open-ended historical archive. Preserve only what must cross that horizon.

Keep private implementation details easy to change. Support mixed versions only for the real rollout window. Preserve durable semantics for the required retention period. Treat public protocols and archival formats as long-lived only when other owners or unacceptable data loss make them so. A century is a diagnostic horizon, not a default compatibility requirement.

## Apply the century-scale replacement test

For meaning, data, and contracts that genuinely need an open-ended horizon, imagine removing the current language, framework, database, vendor, deployment platform, and original team. Ask whether a competent successor could reconstruct correct behavior from the retained domain model, formats, protocols, examples, tests, and operational procedures.

If not, identify where meaning is trapped:

- Framework callbacks contain domain policy.
- Database tables are treated as the domain without an explicit semantic schema.
- Vendor events or error codes leak through every layer.
- A test suite asserts current call structure instead of behavior.
- A migration depends on an undocumented deployment sequence.
- Recovery depends on tacit operator knowledge.

Move only the trapped meaning. Do not wrap stable, well-specified technology merely to appear portable.

## Design durable information

- Use explicit schemas and version markers at durable and public boundaries.
- Define identity, canonicalization, units, precision, timezone, locale, ordering, absence, and unknown values.
- Make readers validate syntax, cross-field and cross-record invariants, persisted command and result shapes, and semantic compatibility before publishing loaded state. Preserve or quarantine unrecognized data according to the contract.
- Make migrations restartable, observable, bounded, and backed by real old-version fixtures.
- Prefer additive evolution when compatibility matters. Remove compatibility paths deliberately when their window closes.
- Spend compatibility only at boundaries that truly outlive one coordinated change. Keep private representations fluid enough to repair a mistaken model.
- Separate the decision to migrate from the authority to commit migrated state.
- Test interrupted migration, retry, mixed versions, duplicate delivery, rollback when possible, and forward recovery when rollback is unsafe.

Assume durable data will expose every ambiguous semantic choice eventually.

## Design replaceable dependencies

- Depend on the smallest capability the policy needs; do not mirror an entire vendor SDK in an internal interface.
- Translate at the edge and retain the original external evidence needed for diagnosis when appropriate.
- Pin and inventory dependencies, but isolate only those with meaningful volatility, operational risk, or semantic leakage.
- Prefer standards and formats that have multiple independent implementations when longevity matters.
- Keep conformance fixtures or contract tests owned by the stable side of the boundary. Include adversarial implementations that violate uniqueness, atomicity, lifecycle, or error postconditions.
- Practice replacement for the few dependencies whose loss would threaten the system; do not build speculative adapters for every library.

## Make concurrency semantics explicit

- State the consistency and isolation required for each decision, not for the system in the abstract.
- Separate safety (what must never happen) from liveness (what must eventually happen) and state which one wins under partition or overload.
- Distinguish command intent, admission, operation identity, durable commit authority, external-effect authority, and hydrated or derived projections. A newer projection does not become the authority merely because it is visible.
- Linearize admission before the first suspension. If validation must suspend, represent pending admission explicitly; do not leave the old operation apparently authoritative while another command has been presented as accepted.
- Snapshot semantic identity, ordering context, configuration, and effect capabilities into an immutable operation context before `await`, streaming, callback registration, scheduling, or retry. Do not use mutable ambient selection, current-user, current-tenant, current-thread, or current-branch state to decide later writes.
- Fence durable writes, external effects, publications, and cleanup with the admitted operation identity, authority generation, transaction token, lease epoch, or idempotency identity appropriate to the boundary. A stale operation may compute, but it must not commit as current.
- Treat cancellation as a liveness and resource-control mechanism, not a safety proof. Work can ignore, outrun, or become uncancellable after an external effect begins; check authority before starting the effect and fence or reconcile completion afterward.
- Let `finally`, timeout, disconnect, and cleanup release only the operation or generation they acquired. Never let stale completion clear a newer operation's busy state, lock, lease, projection, or failure signal.
- State the competing-command policy explicitly: reject, queue, coalesce, cancel-and-replace, or continue against an immutable older context. Give switches, retries, edits, disposal, and child work deliberate semantics rather than letting scheduling decide them.
- Before a consequential external mutation, durably record the authorized request plus stable operation or idempotency identity when recovery, audit, retry, or reconciliation matters. Persist its receipt or outcome afterward and define how ambiguous completion is resolved; never assume a missing result means the effect did not happen.
- Give deadlines, cancellation, retry budgets, and retry ownership one end-to-end policy. Do not let every layer retry independently.
- Define delivery and deduplication semantics, idempotency scope, ordering scope, and the identity that survives redelivery.
- State the serialization, happens-before, or merge rule for shared state. Define child-task ownership, cancellation propagation, structured shutdown, and leak policy.
- For leases and locks, define clock assumptions, expiry, fencing, renewal failure, and what stale holders may still do.
- Define admission control, queue bounds, backpressure, load shedding, and partial-progress visibility before overload chooses them accidentally.
- Test ambiguous commit, duplicate and reordered work, delayed messages, stale reads, split brain, clock movement, process loss, and restart in proportion to risk.

## Make operations part of correctness

Specify startup, readiness, degradation, shutdown, retry, capacity, backup, restore, and disaster recovery as system behavior. Expose domain-relevant outcomes and failure states, not only infrastructure metrics.

Keep operator actions authorized, idempotent where possible, auditable, and safe to resume. Test recovery from partial completion and loss of a dependency. Make clocks, randomness, schedulers, queues, and concurrency controllable at verification seams without pretending their production behavior is deterministic.

## Make performance a contract

Define the workload envelope, data growth, concurrency, throughput, tail latency, memory and storage budgets, burst behavior, and overload policy that matter. Measure representative data and adverse cases before and after consequential changes; do not let a microbenchmark or asymptotic label stand in for the real workload.

Prefer the simpler design while it meets the envelope. When optimization adds caching, batching, parallelism, indexing, denormalization, or native code, record the evidence, semantic risks, invalidation or backpressure policy, and condition for revisiting it.

## Keep security and authority structural

Model assets, actors, trust boundaries, subject-action-resource authorization, confidentiality, retention and deletion, secrets, tenant isolation, untrusted-input limits, and abuse or denial-of-service paths in proportion to risk.

Centralize shared authorization policy where that prevents drift, but enforce it before access at every relevant resource and trust boundary. Record consequential outcomes. Across processes or replicas, state who may decide and commit, how duplicate or reordered work is recognized, and who reconciles; a network boundary is not automatically an ownership boundary.

## Leave an inheritance a stranger can use

- Keep the bootstrap path short and verified on a clean environment.
- Keep representative data and protocol fixtures small, valid, and versioned.
- Make names searchable and logs use the same vocabulary as commands and tests.
- Make compatibility commitments and support windows explicit.
- Remove dead branches, obsolete modes, stale documentation, and dependencies once their contracts permit it.
- Prefer a few complete paths over a wide surface of partially specified extension points.

The goal is not frozen code. Build a system whose meaning survives replacement and whose changes remain safe, local, and explainable.
