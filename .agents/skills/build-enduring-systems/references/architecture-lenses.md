# Architecture Lenses

Use this reference only when source or navigation reorganization is explicitly authorized and repeated real maintenance evidence shows that the established layout obscures a consequential path. Do not load it for ordinary implementation, a one-time search, a long file, or a general desire to make code easier to read. Select a primary spine by the maintainer's recurring question, not by architectural fashion. At system scale, map several areas and their contracts instead of demanding one global linear spine.

## Lens catalog

| Spine | Put it first when readers ask | Natural units | Revealing evidence |
| --- | --- | --- | --- |
| Dependency | What does this policy require, and what may it call? | stable policy, ports, adapters, composition | substitute an edge; dependency and contract tests |
| Feature or capability | Where does this user-visible behavior live? | end-to-end feature capsules with shared kernels | behavior stories and change-locality checks |
| Pipeline or dataflow | How does input become output? | stages, typed intermediate forms, transforms | stage contracts, golden cases, end-to-end samples |
| Incremental dataflow | What must update when this fact changes? | nodes, dependencies, subscriptions, schedulers | propagation, ordering, backpressure, and stabilization tests |
| Rule or precedence | Which candidates apply, which wins, and what is the fallback? | predicates, rules, priorities, defaults, merge laws, overrides | overlap, wrong-winner, invalid-input, and fallback cases |
| State machine | What states exist, and which transitions are legal? | states, events, guards, transitions, actions | model, transition, and sequence tests |
| Lifecycle | Where is a resource acquired, replaced, failed, and released? | scopes, supervisors, sessions, resource owners | failure, cancellation, restart, and cleanup tests |
| Data-centric | Which facts, relations, constraints, and queries define the system? | schemas, transactions, constraints, views | concurrent transactions, queries, migrations, and integrity checks |
| Registry or plugin | Which implementations exist, and how is one selected? | a stable host contract plus independent entries | enumerate entries; host and conformance tests |
| Route, screen, or command | What owns this external entrypoint? | request, route, screen, CLI command, or job | entrypoint-to-outcome contract tests |
| Protocol or message | What may participants say, and in what order? | messages, roles, versions, sessions | conformance, compatibility, and sequence tests |
| Event history | What happened, and how is current state reconstructed? | facts, folds, projections, snapshots | replay, ordering, idempotency, and migration tests |
| Specification | What promises does this artifact make? | rules, examples, schemas, executable specifications | generated, property, conformance, and acceptance tests |

Do not choose event history merely because auditing exists, plugins merely because variants exist, or dependency inversion merely because an external service exists. Each spine adds machinery and should expose a dominant reasoning problem.

Treat a small shared kernel as a result, not a target. When capabilities share few stable semantics, feature capsules with narrow contracts are clearer than a lowest-common-denominator core.

## Selection method

1. Gather representative changes, incidents, and operational tasks already evidenced by current plans or history. For greenfield architecture explicitly requested by the user, use committed product scenarios rather than imagined module names.
2. Write the first question a maintainer asks for each scenario.
3. Test whether one navigation hypothesis makes the highest-cost and most frequent questions shorter to answer. Keep several entrypoints when no single order dominates.
4. Check the choice against authority, lifetime, deployment, trust, consistency, and verification environments.
5. Sketch one end-to-end trace in the proposed order. Prefer doing nothing, then an index or cross-link, before reorganizing established code; move code only when several real traces show the same costly jumps.
6. Let a substantial subsystem adopt another local spine when its dominant question differs.

Include at least one concurrency, ambiguous-failure, migration or replacement, removal, and performance-sensitive scenario when those risks exist. Weight scenarios by frequency and consequence; do not optimize only for the happy path or the most dramatic edge case.

## Keep four maps distinct

Distinguish the semantic architecture (concepts, rules, invariants, authorities), execution architecture (calls, messages, pipelines, tasks), source architecture (files, modules, packages), and deployment architecture (processes, services, stores, networks). Align them where that helps navigation, but do not let a framework folder layout or a deployment diagram define the domain.

Use a network boundary only for independent deployment, scaling, trust, ownership, technology, or failure containment that outweighs coordination and compatibility cost. Keep an atomic invariant inside one consistency authority when possible; otherwise make reconciliation an explicit part of the model. A modular monolith may legitimately contain pipelines, state machines, supervised workers, relational constraints, and plugin registries.

## Combine lenses without creating two architectures

Name the authority model for each fact or decision and keep conformance checks between independently maintained artifacts. Generate or derive other views when practical:

- Let a composition root derive the dependency view.
- Let commands or reducers enumerate state transitions.
- Let a registry enumerate supported variants.
- Let routes or message schemas enumerate external entrypoints.
- Let tests enumerate promises and examples.
- Let telemetry use the same domain event names rather than inventing an operational vocabulary.

Avoid duplicating logic to make every view physically adjacent. Prefer indexes, composition, generated documentation, or executable tables that point to the authority model.

## Decide whether a seam deserves extraction

Extract when the candidate has at least one independent force and extraction improves an observed path:

- Its invariants can be stated and enforced independently.
- Its state or resources have an independent lifetime.
- Its authority, trust, consistency, or failure domain differs.
- Its dependencies or policy change for a different reason.
- It requires a distinct runtime or verification environment.
- It is reused with the same semantics, not merely similar syntax.
- It must be replaced, deployed, or versioned independently.

Keep it local when extraction would mainly create pass-through calls, mirrored data models, navigation overhead, distributed transactions, or versioning work.

## Recognize shape failures

- **Shotgun change:** one promise requires unrelated edits across the system.
- **Distributed invariant:** several paths must remember the same repair rule.
- **Layer echo:** each layer repeats the same data and delegates without adding policy.
- **Hidden resolution:** several rules can claim the same input, but precedence, merge, default, or fallback behavior is incidental or must be simulated globally.
- **Lossy inference:** one fact is used as the only representation of another fact that can vary independently, so callers falsify the source, add modes, or bypass the abstraction.
- **Counterfeit compression:** repeated shape is unified while authority, lifetime, failure meaning, or compatibility differs, and the erased distinctions return as flags or escape hatches.
- **Feature interleaving:** unrelated capabilities share control flow full of mode checks.
- **Hidden lifecycle:** acquisition is far from failure, cancellation, or cleanup.
- **Temporal authority split:** intent, admitted work, durable commit, visible projection, and cleanup can each claim to be current, so correctness depends on which `await`, callback, stream chunk, retry, or switch wins.
- **Leaky edge:** vendor, storage, transport, or UI shapes become domain concepts.
- **State-product explosion:** independent flags, nullable fields, duplicated statuses, or synchronized stores admit many unnamed or contradictory combinations that readers must simulate.
- **Open capability set:** globals, generic environments, raw stores, reflection, or hidden registrations make it impossible to enumerate what a unit may mutate or effect.
- **Unclosed transition set:** legal commands, states, failures, retries, or cleanup paths cannot be enumerated, so important exclusions depend on caller discipline.
- **False locality:** code is adjacent, but independent authority or failure domains are entangled.
- **False distribution:** code is remote, but every ordinary change still requires coordinated release.
- **Competing spines:** no reading order answers the main question without global search.

Treat these as evidence about a specific change path. Do not answer every smell with another layer.
