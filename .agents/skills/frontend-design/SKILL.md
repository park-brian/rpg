---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with a clear aesthetic point of view and code that fits the local stack. Use when building or restyling web components, pages, views, prototypes, or full frontend applications, especially when the user wants novel, memorable design instead of generic SaaS UI while still respecting local CSS architecture, responsiveness, accessibility, and product constraints.
---

# Frontend Design

Build frontend work that feels authored, not averaged. Create a fresh visual direction while keeping the implementation plausible for the existing codebase.

## Workflow

### 1. Read the local frontend context

Inspect the nearby code before choosing a direction.

- Read the surrounding component structure, CSS architecture, design tokens, utilities, breakpoints, and interaction patterns.
- Treat the local codebase as implementation substrate, not aesthetic ceiling.
- Reuse existing layout primitives, spacing logic, component shells, and naming patterns where practical.
- Preserve established behavior, responsiveness, and accessibility expectations unless the user asks for a redesign.
- Do not simply imitate the nearest existing screen.

### 2. Write the design brief before coding

Form a short internal brief before implementation. When the work is substantial, tell the user the chosen direction in a sentence or two before editing.

Include:

- purpose: what the interface needs to help the user do
- audience: who is using it and what mood or level of confidence it should create
- tone: pick a clear direction such as brutal, ceremonial, editorial, industrial, playful, luxurious, organic, retro-futuristic, soft, or raw
- constraints: framework, performance, accessibility, existing CSS rules, product requirements
- differentiation: define the one thing the user should remember

Commit to one direction instead of averaging across several safe ones. Intentionality matters more than intensity.

### 3. Think like an artist

Do not treat frontend design as decorating a working layout. Approach it the way an art director, editorial designer, set designer, or poster designer would: choose a point of view, build a visual world around it, and make every visible decision support that world.

Pull references from outside generic product UI: print, architecture, signage, film titles, exhibitions, packaging, fashion, industrial objects, games, transit systems, magazines, albums, and physical materials. Translate those references into browser-native work rather than copying a common gallery pattern.

Create a coherent visual argument. Favor one dominant gesture over many equally loud ideas. Use repetition and contrast intentionally through shape language, spacing rhythm, typography relationships, framing devices, surfaces, or one dramatic motion moment.

Design through tension, not polish alone. Memorable work often comes from controlled contrast: elegant type against raw dividers, strict grids with one rule-breaking element, a quiet field with one dangerous accent, dense information inside ceremonial framing, or near stillness followed by one precise reveal.

Assume a stronger answer exists than the first safe idea. Commit fully to the chosen direction and refine until the result feels authored rather than averaged. Encourage ambition, but cut anything that is merely louder instead of better.

### 4. Map the concept to system decisions

Translate the concept into concrete rules before polishing details.

- Typography: choose a type strategy with character. Prefer distinctive display and body choices when the stack supports them. If new fonts are not practical, create distinction through scale, weight, rhythm, case, spacing, and hierarchy rather than defaulting to flat system text.
- Color: build around one dominant field and a controlled accent strategy. Prefer decisive palettes over timid even distribution. Use CSS variables for new local tokens when needed.
- Composition: choose whether the interface should feel asymmetric, dense, monumental, quiet, layered, diagonal, or rigid. Let spacing and hierarchy reinforce that choice.
- Geometry: define corner radii, border weights, line styles, shadow behavior, and shape language so components feel related.
- Motion: choreograph a few meaningful moments. Prefer CSS-first motion and use an existing motion library only when the project already has it or the task clearly justifies it.
- Surfaces: decide whether the design wants flatness, grain, transparency, glow, pattern, texture, or hard edges. Background treatment should support the concept, not fill empty space by habit.

### 5. Build with compatible code

Keep the code mergeable and local.

- Prefer page-scoped or component-scoped styling over broad global changes.
- Add local CSS variables or narrowly scoped utility classes before introducing new global primitives.
- Avoid dependency churn for purely stylistic reasons.
- Avoid global resets, broad element selectors, and unrelated rewrites.
- Match implementation complexity to the concept. Maximalist work needs enough structure, layering, and motion to feel intentional. Refined minimalism needs restraint and precision rather than under-designed emptiness.

Create interfaces that feel newly art-directed, not newly frameworked.

### 6. Avoid generic UI

Do not fall back to common safe defaults just because they are easy.

Avoid:

- predictable rounded-card SaaS compositions with no strong focal idea
- purple-on-white gradients or trendy accent palettes used by reflex
- decorative effects that do not improve hierarchy, atmosphere, or memorability
- generic typography choices made from habit rather than concept
- novelty achieved only through louder colors, extra blur, or random motion
- reusing the same aesthetic across unrelated tasks

If the existing codebase is visually bland, use it as a technical substrate rather than aesthetic instruction.

### 7. Run the final design critique

Before finishing, review the work like a demanding design lead.

- Check responsiveness on desktop and mobile widths relevant to the task.
- Check hover, focus, active, disabled, empty, loading, and error states when they matter.
- Check keyboard usability, contrast, and readability.
- Remove ideas that feel trendy, unearned, or disconnected from the concept.
- Ask what still feels generic, what feels borrowed from default SaaS UI, and what single change would make the result more unmistakably itself.

Do not assemble attractive parts. Make a coherent visual argument.
