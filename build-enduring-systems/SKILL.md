---
name: build-enduring-systems
description: Design, review, or rehabilitate architecture when the user explicitly requests architecture work or when a requested change demonstrably crosses competing authorities or writers, durable data or migration, public contracts or protocols, concurrency or stale work, security or trust boundaries, irreversible external effects, independent resource lifetimes, or transfer from an old implementation to a new one. Use to decide whether a consequential abstraction or boundary has earned its cost. Do not use merely because code is unfamiliar, old, tangled, duplicated, long, or described as needing refactoring or maintainability; ordinary features, bugs, and local cleanup should remain in the established design with nearby verification.
---

# Build Enduring Systems

## Default to direct work

Treat **no architecture change** as the successful default.

Unless the user explicitly asks for architecture work or the directly relevant path reveals a concrete escalation trigger below:

1. Inspect the requested behavior, its local implementation, and the nearest useful tests or checks.
2. Make the smallest coherent change in the established design and vocabulary.
3. Verify the changed behavior with the nearest proportionate evidence.
4. Stop.

Do not create an architecture plan, slice record, scenario packet, claim ledger, system map, compression worksheet, migration plan, compatibility path, new abstraction, fresh-reader exercise, or architectural ratchet on this path. Do not investigate merely to prove that escalation is unnecessary.

Uncertainty outside the requested path is not itself a reason to expand scope. Expand only when the unknown could invalidate the change, make it unsafe, or alter a contract the change actually reaches. Leave adjacent defects and cleanup opportunities alone unless the user includes them.

Treat explicit constraints such as keeping one file, avoiding dependencies, preserving an interface, or limiting scope as requirements, not invitations to argue for a preferred architecture. If a demonstrated correctness or safety hazard conflicts with a constraint, explain the conflict and ask rather than silently overriding it.

For a review or planning request, remain read-only. For an implementation request, do not turn architectural curiosity into unauthorized restructuring.

## Require a positive escalation trigger

Escalate from direct work only when at least one of these conditions is already supported by the request or by evidence encountered while following the requested path:

- The user explicitly requests architecture design, system restructuring, migration, replacement, or an architecture audit.
- Competing authorities, writers, or resolution rules can decide the same consequential fact.
- The change crosses durable data, a schema migration, retained history, or a public API, file format, event, or protocol.
- Work can suspend, retry, race, arrive out of order, or resume stale and still commit state, publish a result, perform an effect, or release another operation's resource.
- The path crosses a security, trust, permission, tenant, deployment, ownership, or consistency boundary.
- An external effect may be irreversible, duplicated, or ambiguously completed.
- A resource has an independent acquisition, replacement, failure, or release lifetime.
- The work transfers real traffic, data, decisions, writes, or operational responsibility from an old implementation to a new one.
- A proposed shared abstraction or boundary would change several real callers or encode a consequential invariant.

Cite the concrete observation that triggered escalation. “Could someday,” unfamiliarity, age, file length, repeated syntax, framework layering, low coverage, generic naming, and hypothetical reuse are not triggers. A short diff may contain a real trigger, but a large or ugly file may contain none.

If no trigger is present, return to the direct path.

## Load advanced guidance only after escalation

Read only the reference matching the observed work; most tasks need zero or one:

- Read [references/compression.md](references/compression.md) when a consequential shared abstraction, inference rule, state machine, service boundary, or reorganization is already being proposed because of present pressure.
- Read [references/rehabilitation.md](references/rehabilitation.md) only for an explicitly authorized structural migration or transfer of decision, write, state, traffic, or operational authority.
- Read [references/endurance.md](references/endurance.md) only for durable or public information, mixed versions, concurrency, retry, irreversible effects, operational recovery, or another genuinely long-lived boundary.
- Read [references/review-method.md](references/review-method.md) only for an explicitly requested architecture audit or pressure test of a consequential design.
- Read [references/architecture-lenses.md](references/architecture-lenses.md) only when reorganizing source or navigation structure is itself authorized and supported by repeated maintenance evidence.

Do not load every reference for completeness. A reference is a menu for an activated hazard, not a protocol to impose on the whole task.

## Preserve a small vocabulary with strong meaning

When architecture work is warranted, prefer code in which:

- Consequential state changes through a visible authority or an explicit authority protocol.
- Invalid states and illegal transitions are difficult to express where their prevention matters.
- Effects, failures, concurrency, and resource lifetimes are visible where they affect correctness.
- Each abstraction compresses a real decision, invariant, protocol, or lifetime rather than repeated syntax.
- Special cases live beside the policy that makes them special.
- The structure makes the home and consequences of the next real change predictable.

Use these as judgment criteria, not as instructions to manufacture types, state machines, services, interfaces, schemas, or layers. A direct conditional, local function, ordinary module, database constraint, or focused test may be the best expression of the law.

Let readers reason by exclusion only for exclusions the current contract actually needs: who may write, which transition is forbidden, which effect is unavailable, or which rule wins. Do not attempt to close every possible world around ordinary application code.

## Make new structure earn existence

Keep direct code unless present evidence shows that a new concept will do at least one of the following:

- Remove a currently duplicated policy decision, not merely duplicated syntax.
- Enforce a consequential invariant that the current path can bypass.
- Isolate an actual independent lifetime, trust boundary, compatibility boundary, or volatile mechanism.
- Give one already-required behavior a substantially shorter and more predictable change path.

Before introducing the concept, answer only what the decision needs:

1. What exact law will it own, and what will it deliberately not own?
2. Which current examples share that law, and what nearest similar case must remain distinct?
3. What is the simpler direct implementation?
4. Which navigation, translation, configuration, lifecycle, coordination, and failure costs would the concept add?
5. What current change becomes safer or more predictable?

If the law or current benefit is unclear, keep the code direct. If the direct and abstract designs tie, keep the direct design. Do not introduce structure for symmetry, mocking, possible replacement, hypothetical reuse, line-count reduction, or a preferred pattern.

## Model only boundaries that are present

For an escalated change, name only the semantics that can affect it:

- For competing writers or declarative rules, identify the candidates, applicability, precedence or merge rule, permitted override, fallback, and effective winner.
- Across suspension, callbacks, streams, queues, or retries, capture the operation identity and semantic context before suspension; fence consequential commit, publication, effect, and cleanup against the authority that is current at that point. Cancellation alone is not a safety proof.
- At durable or public boundaries, preserve identity, units, absence, versions, compatibility horizon, migration direction, and recovery only as required by the real contract.
- For external effects, distinguish who decides the effect from the capability that performs it; define idempotency or ambiguous completion only when retry or recovery can occur.
- For resources, put acquisition beside the owner of failure, cancellation, replacement, and release.

Do not add temporal, durability, protocol, lifecycle, or distributed-systems machinery when the behavior has no such boundary.

## Rehabilitate without architecture theater

Anchor structural work to a requested behavior, recurring defect, incident, operational burden, or demonstrated repeated change cost. Follow the shortest actual path:

`input or event -> decision or resolution -> state or effect -> observable result`

Add a failure, concurrency, compatibility, or cleanup branch only when it exists in the current contract. Expand the search only for an unknown authority, writer, consumer, dynamic edge, or boundary that could change the chosen repair.

Prefer one local seam and one real caller over a parallel replacement stack. Separate behavior-preserving movement from intended behavior change when that distinction helps verification. Require recovery, cutover, and deletion machinery only for a real migration; an ordinary refactor does not need to retire an “old authority.”

Do not impose a target module tree, repository-wide vocabulary, interface family, service boundary, or generalized framework. If the requested change remains supportable in the current shape, make it there and stop. Imperfection elsewhere is not a blocker.

## Verify proportionately and stop

Match evidence to the promise actually changed:

- Run the nearest established checks and inspect the diff.
- Add a focused regression test for the requested behavior or demonstrated defect when useful.
- Exercise a relevant boundary case when the change touches precedence, invalid input, stale work, retry, compatibility, cleanup, security, or irreversible effects.
- Inspect an unfamiliar harness before running it only when it may reach shared, durable, privileged, destructive, costly, or external state.
- Expand to integration, fault, compatibility, security, recovery, performance, or load evidence only when the changed contract makes it relevant.

Do not require a universal adversarial suite, formal closure proof, maintainability experiment, new telemetry, decision record, or architectural fitness test for ordinary work. Add a lasting ratchet only when recurrence is plausible and the guard is cheaper than the failure it prevents.

Stop when the requested behavior is correct, the relevant checks pass, and no unresolved observation can invalidate that result. Record adjacent opportunities instead of implementing them. For architecture work, stop when the authorized decision or bounded migration slice is supportable on its own; do not widen it merely because the investigation found more architecture.

## Hand off at the scale of the change

For direct work, report the outcome, changed artifacts, exact verification, checks not run, and material residual risk. Do not add an architecture essay.

For an architecture review, report concrete evidence, consequence, the smallest coherent action or explicit decision to keep the design direct, and what observation would change that conclusion. Keep independent findings independent. Recommend at most one next action unless the user requests a roadmap; do not bundle adjacent repairs merely because the review discovered them together. Do not use `clean`, `simple`, `elegant`, `modular`, `decoupled`, or `maintainable` without tying the judgment to a real change or failure.
