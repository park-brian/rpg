---
name: code-simplifier
description: Refine recently modified code for clarity, consistency, and maintainability without changing behavior. Use after writing or editing code, or when asked to simplify, clean up, or refactor touched files while preserving exact functionality. Especially useful for behavior-preserving cleanup, removing incidental complexity, aligning with local project conventions, and tightening code before review.
---

# Code Simplifier

Improve code that was just changed. Favor explicit, durable code over clever compression, and preserve exact behavior.

## Workflow

### 1. Find the real scope

Start with the narrowest safe scope.

- If the user names files or functions, limit work to that scope.
- Otherwise inspect the current diff and work only on touched files.
- Expand beyond touched code only when a correctness issue forces it.

Prefer commands that show the current change surface quickly, such as `git diff --name-only`, `git diff --stat`, and targeted file reads.

### 2. Learn the local rules before editing

Do not apply generic style opinions blindly. Read the nearest source of truth first:

- `CLAUDE.md`, `AGENTS.md`, or similar repo instructions
- linter, formatter, and package config
- nearby files in the same area of the codebase
- framework-specific docs already present in the repo

Infer standards from the project before refining code. Prefer local consistency over personal preference.

### 3. Simplify only when it improves the code

Use strong engineering judgment about what "clean, elegant, minimal, and working" means.

Optimize for:

- code that is easy to read top to bottom
- the fewest moving parts needed to express the behavior clearly
- explicit control flow over dense expressions
- local reasoning, so a reader does not need to chase many helpers to understand the change
- consistency with surrounding code and project conventions
- maintainability under future edits, debugging, and review

Treat code as better when it:

- removes incidental complexity without hiding important logic
- makes invariants and edge cases easier to see
- reduces duplication that obscures intent
- keeps related logic together
- uses names that explain purpose instead of implementation trivia
- preserves exact behavior while making that behavior easier to verify by inspection

Treat code as worse when it:

- becomes shorter but harder to understand
- introduces abstractions before they are justified
- compresses branches into nested ternaries or dense one-liners
- hides side effects, control flow, or error handling
- increases indirection for small or local logic
- rewrites working code to match a preference instead of solving a clarity problem

When multiple refactors are valid, prefer the one with:

1. clearer intent
2. less unnecessary indirection
3. lower behavior risk
4. better fit with nearby code

### 4. Apply behavior-preserving refinements

Good targets for cleanup:

- reduce unnecessary nesting
- remove redundant variables, branches, and wrappers
- consolidate duplicated logic when the result is still easier to read
- rename unclear local variables and private helpers
- keep related data flow and decision logic close together
- remove comments that only restate obvious code
- replace nested ternaries with `if`/`else` or `switch` when that is clearer

Protect behavior while editing:

- preserve outputs, side effects, and public interfaces
- preserve data shapes and call contracts
- preserve error behavior unless the user asked to change it
- preserve DOM structure or markup details that styling or tests may depend on
- preserve framework-specific reactive behavior

### 5. Respect framework and language constraints

Do not force patterns from one stack into another.

- In plain JavaScript files, do not introduce TypeScript-only conventions.
- In frontend code, respect the framework's reactive model and rendering rules.
- In repos with explicit import ordering or module rules, follow them.
- Preserve established local patterns unless changing them clearly improves readability without causing churn.

If the repo documents a constraint that changes what "clean" means, follow the repo. Example: if a framework warns against destructuring props or eagerly reading reactive values, treat that as a correctness constraint, not a style preference.

## Guardrails

- Do not broaden scope into untouched files just for style cleanup.
- Do not rename exported APIs, routes, props, events, or schema fields unless the user asked for it.
- Do not collapse readable code into fewer lines just to look minimal.
- Do not remove a helper or abstraction that still earns its keep.
- Do not make speculative performance refactors unless the current code is clearly more complex than necessary.

Prefer the simplest code that remains obvious to a future maintainer. Do not confuse minimal code with fewer lines.

## Validation

After refining code, verify the result when feasible:

- run the most targeted lint, format, or test command for the affected area
- inspect the diff to confirm the changes stayed behavior-preserving
- if validation cannot be run, say so explicitly

## Output

Report only meaningful refinements:

- what changed
- why it improved clarity or maintainability
- what you intentionally left alone to avoid behavior risk
