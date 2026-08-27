# Prove Explanatory Compression

Use this reference only after present work has produced a consequential abstraction, shared kernel, inference rule, state machine, service boundary, or architecture-wide reorganization to evaluate. Do not load it to search ordinary code for abstraction opportunities. A candidate must arise from an explicitly requested architecture decision or observed current pressure that the direct implementation cannot adequately resolve.

## Contents

- [Define the claim](#define-the-claim)
- [Build the scenario packet](#build-the-scenario-packet)
- [Test whether the concept earned a name](#test-whether-the-concept-earned-a-name)
- [Run the loss and independence test](#run-the-loss-and-independence-test)
- [Apply the mechanism lens](#apply-the-mechanism-lens)
- [Compare direct and abstract designs](#compare-direct-and-abstract-designs)
- [Prove the exclusion](#prove-the-exclusion)
- [Verify with a fresh reader](#verify-with-a-fresh-reader)
- [Choose a disposition](#choose-a-disposition)
- [Recognize counterfeit compression](#recognize-counterfeit-compression)

## Define the claim

Treat elegance as **truthful explanatory compression**: a few named concepts and laws predict much behavior while preserving every distinction that can vary independently for an in-scope requirement.

Do not equate compression with fewer lines, fewer files, reuse, uniformity, indirection, declarative syntax, or a small vocabulary. Those may be consequences. The proof is that a reader can exclude more illegal behavior, simulate a shorter direct path, and predict a representative change more accurately.

Treat every candidate abstraction as a falsifiable hypothesis:

`candidate C replaces decisions D under law L, preserves distinctions P, excludes behavior X through mechanism E, and makes scenarios S more predictable at added cost K`

Reject unsupported adjectives. `Simple`, `clean`, `elegant`, `deep`, `cohesive`, and `decoupled` are conclusions, not evidence.

When principles conflict, apply this priority order:

1. Preserve required behavior, data integrity, safety, security, and explicit external obligations.
2. Represent real domain distinctions, authority, time, concurrency, failure, and partial progress without pretending they are simpler.
3. Use the simplest mechanism meeting those truths with acceptable failure and operating costs.
4. Minimize the reasoning surface and keep representative changes connected and predictable.
5. Buy compatibility, portability, and replaceability in proportion to the boundary's actual lifetime.
6. Pursue reuse, uniformity, symmetry, and aesthetic elegance only after the higher constraints hold.

## Build the scenario packet

Use evidence already present in the task. Before describing a preferred abstraction, choose:

1. The requested or demonstrated ordinary change.
2. One nearest boundary case where similar-looking behavior must remain distinct.
3. One failure, compatibility, operational, removal, replacement, or evolution case only when the current contract makes it relevant.

For each scenario record:

| Scenario | Expected observable behavior | Forbidden behavior | Current policy-owning locations | Evidence |
| --- | --- | --- | --- | --- |

Choose scenarios from real requirements, incidents, committed plans, current variants, or demonstrated code pressure. Never invent a portfolio to justify the candidate. If only the requested change and one counterexample are real, use those two; if this evidence does not reject direct code, stop the abstraction analysis.

## Test whether the concept earned a name

Complete this sentence without a pattern name:

> `<candidate>` is the one place that decides or guarantees ___ for ___; it deliberately does not decide ___;

Then answer:

- If the implementation were inlined everywhere, which policy, invariant, authority, lifetime, effect, failure rule, or protocol law would become duplicated, hidden, or unenforced?
- If every repeated line disappeared, would the concept still need an owner?
- Can a reader discover the concept's law and non-responsibility from its public name and contract?

Pass when the name exposes a stable semantic law. One use can pass when it protects a consequential invariant, lifetime, authority, or failure boundary. Multiple uses pass only when they share meaning, authority, lifetime, failure semantics, and compatibility obligations.

Keep direct code when the answer merely says `wraps`, `handles`, `manages`, `coordinates`, `provides helpers`, restates mechanics, reduces lines, enables mocking, or anticipates possible reuse. Removing a name that carries no design fact is decompression of ceremony, not loss of architecture.

## Run the loss and independence test

Expand the candidate into its contract:

- What may callers assume?
- What must callers provide?
- What states, transitions, orderings, dependencies, and effects are forbidden?
- Who owns mutable state, effects, failure policy, and cleanup?
- What constitutes completion?
- What remains explicitly outside the abstraction?

For every inferred relationship `A -> B`, hold A constant and vary B:

- If B may legitimately vary in scope, represent B independently.
- Allow `B = default(A)` when useful, but let new intent override B without falsifying A.
- Narrow the scope if the implication is true only in a smaller domain.

Find two cases with similar implementation shape that must behave differently. Verify that the interface preserves the difference without requiring callers to inspect internals, downcast, bypass the abstraction, or supply a growing set of flags and callbacks.

Construct one illegal or ambiguous case. Require the design to reject it, represent it explicitly, or label it outside the closed scope. Syntax validation alone does not establish domain validity.

Fail the candidate when it merges different authorities or lifetimes; collapses absence, failure, cancellation, timeout, and completion; depends on undocumented call order; or reintroduces erased distinctions through booleans, mode strings, nullable fields, generic callbacks, tags, escape hatches, or synchronized copies.

## Apply the mechanism lens

Use only the rows relevant to the system:

| Mechanism | Required account | Disqualifying evidence |
| --- | --- | --- |
| Imperative or stateful | Legal states and transitions, command authority, commit point, effects, terminal outcomes, and cleanup | Alternate writers, ambiguous completion, illegal transitions, or stale work can commit |
| Declarative or precedence-driven | Rule domain, applicability, overlaps, precedence, complement or fallback, permitted override, and invalid combinations | Correctness depends on accidental ordering, hidden specificity, wrong-winner cases, or an unenumerated fallback |
| Data or schema | Canonical identity, units, absence, provenance, constraints, read/write authority, round trip, version, and migration | Serialization loses meaning or incompatible representations can be confused |
| Protocol or message | Messages, legal order, duplicates, retry, idempotency, timeout, partial progress, ambiguous completion, and compatibility | Replay duplicates effects or peers assign different meaning to the same history |
| Resource or lifecycle | Detection, acquisition, readiness, replacement, failure, cancellation, release, and disposal proof | Acquisition and cleanup have different owners or partial setup leaks |
| Mixed | Each applicable account plus the translation boundary | Declared intent, committed state, and visible projection can disagree without a named resolver |

Record absent dimensions as absent. Do not manufacture a state machine, durable writer, lifecycle, or temporal ledger for a mechanism that has none.

## Compare direct and abstract designs

Before editing, compare the established direct design with the candidate for every scenario:

| Concern | Direct design | Candidate | Evidence after rehearsal or change |
| --- | --- | --- | --- |
| Independent policy owners touched | | | |
| Semantic edits | | | |
| Mechanical propagation | | | |
| Navigation jumps | | | |
| Representation translations | | | |
| New modes or configuration | | | |
| Lifetime, coordination, or failure obligations | | | |
| Verification seams and tests | | | |

Predict the artifacts and runtime boundaries before implementation. After a real change or bounded rehearsal, record every unexpected policy site, bypass, ordering dependency, escape hatch, or unrelated edit.

Adopt the candidate only when it passes the loss test, makes at least one scenario touch fewer independent policy decisions or become materially more predictable, introduces no unexplained authority, and does not worsen the boundary or adverse scenarios. Distinguish legitimate mechanical propagation from duplicated policy.

When direct and abstract designs tie, keep the direct code. A boundary must buy more than it costs.

## Prove the exclusion

When adoption depends on claiming that a consequential behavior becomes impossible, record:

`forbidden behavior -> enforcement mechanism -> exact scope -> nearest bypass attempted -> evidence -> structural, runtime-defended, operationally bounded, or unresolved`

Use types, constructors, exhaustive tables, constraints, transactions, permissions, capability limits, dependency rules, fencing, or a complete resolution protocol for structural claims. Positive examples, naming, convention, repository search, or sampled tests do not prove absence.

Derive adversarial evidence from the mechanism. Use forbidden event histories for temporal systems and forbidden input, context, configuration, overlap, precedence, serialization, or message combinations for declarative, data, and protocol systems.

## Verify with a fresh reader

Use an independent reader only when the architecture decision is expensive, widespread, hard to reverse, or explicitly under audit. Give them the artifact and raw scenario without the architectural explanation. Ask them to:

1. Locate the canonical resolver and cite the owning artifact.
2. State the candidate's law, deliberate non-responsibility, and one important impossibility.
3. Trace one ordinary and one adverse path to the observable outcome.
4. Predict every semantic artifact and runtime boundary the change should touch; mark mechanical propagation separately.
5. Construct the nearest non-case and forbidden case.
6. Apply or rehearse one representative change and report every surprise.

Pass when the reader finds authority from the public vocabulary, predicts at least as accurately for every scenario and more accurately for at least one, and encounters no hidden policy owner or erased distinction. Treat global search, required implementation inspection, unexplained edits, and new escape hatches as failures.

## Choose a disposition

- **Keep direct:** the name gate fails, reuse is hypothetical, or change evidence ties.
- **Name locally:** one law deserves visibility but no independent boundary or replacement seam is justified.
- **Extract:** the candidate passes every applicable gate and a real path can adopt it reversibly.
- **Narrow or split:** only a coherent subset shares law, authority, lifetime, failure meaning, and evolution pressure.
- **Reject:** any consequential distinction is erased or easier change cannot be demonstrated.
- **Investigate:** a material claim remains unknown and a safe decisive probe can resolve it.

Do not leave a rejected candidate as scaffolding. Do not keep a temporary adapter, mode, or compatibility path without an owner, expiry, and deletion condition.

## Recognize counterfeit compression

- Similar syntax is unified while meanings differ.
- A generic center accumulates switches for unrelated cases.
- A pass-through layer repeats data and delegates without policy.
- A framework or directory name substitutes for a law.
- A representation merges facts that can vary independently.
- A default becomes the only expressible state.
- A declarative cascade is deterministic but its overlaps and precedence are not locally knowable.
- A state machine names phases but does not exclude illegal transitions.
- An interface mirrors a vendor or database without semantic translation.
- A wrapper exists only for mocking a stable dependency.
- A new boundary trades local repetition for navigation, translation, coordination, versioning, or distributed failure.
- A happy-path change gets easier while failure, cleanup, compatibility, or removal gets harder.

Keep functions and modules semantically honest: preserve long straight causal code; split around laws, not size; normalize representations at real edges; make mutable prerequisites explicit; return failures where callers can act; and place comments beside non-obvious reasons, constraints, units, hazards, and rejected simpler choices. Novelty spends future readers' attention and must pass the same compression proof.
