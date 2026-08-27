---
name: buildless-solid-spa
description: Build, edit, debug, test, architect, or review maintainable single-page SolidJS apps that run directly in the browser without a bundler, JSX transform, Vite, or build step. Use for one-file HTML apps, import-map Solid apps, solid-js/html tagged templates, Solid stores, hash or memory routing, browser-native test harnesses, Playwright visual verification, meta-architecture selection, or long-term code-guardian reviews.
---

# Buildless Solid SPA

## Start with the file

Read the whole artifact before rearranging it: markup, styles, imports, state, effects, browser resources, persistence, routes, mount code, and tests. Find the real entrypoints and established commands. When behavior depends on Solid, its HTML runtime, stores, or the router, inspect the exact installed browser build and types. Preserve stronger local conventions.

Scale the work to the change. For a substantial edit:

1. Trace one ordinary feature, one cross-cutting invariant, and one failure or cleanup path.
2. Identify the file's primary reading spine and the canonical owner of each state transition involved.
3. Change the smallest coherent seam. Do not build abstractions for imagined growth.
4. Verify the behavior, failure path, cleanup, visual result, and resulting change locality.

## Choose the reading spine

A single file can be elegant in several ways. Choose the order that answers the app's most common maintenance question:

| Spine | Use it when readers usually ask... |
| --- | --- |
| Dependency-first | What does this behavior depend on? |
| Narrative-first | What does the product do, and where does that lead? |
| Feature-first | Where does this capability live? |
| Pipeline or state-machine | How does input become output or one state become another? |
| Route-first | What owns this location or screen? |
| Registry-first | Which tools, providers, or renderers are available? |
| Lifecycle-first | Where is this resource acquired, replaced, and released? |
| Specification-first | What behavior does this executable artifact promise? |

Most healthy files are deliberate hybrids. A narrative shell may lead into feature capsules; a registry may index lifecycle-owned implementations. Use one clear top-level spine, then let each substantial section adopt the local order that best exposes its problem. Do not duplicate implementation to make every reading order physical.

Make other views executable. Root composition shows the product map. Route and tool tables show registries. Command objects show mutations. State machines show transitions. Named tests and visual cases show contracts. Use a short region note only when the code cannot make ownership, dependencies, cleanup, and proof apparent.

Judge the architecture by the paths a maintainer must walk:

- Follow an event through policy, state change, external synchronization, rendered result, and test.
- Follow a resource through capability detection, acquisition, failure, replacement, and cleanup.
- Find the owner of a persisted field, route, provider, or global listener without searching the whole file.

Length alone is not a reason to split. Reorganize when ordinary changes cross surprising sections. Extract a seam when its own lifetime, invariants, dependencies, reuse, or test environment matter more than the locality of keeping it here.

## Protect ownership and lifetimes

Whatever spine you choose, keep these properties:

- Give each mutation and invariant one semantic owner. Views should express intent, not know storage paths or repair rules.
- Separate durable domain data, user preferences, session interaction, external resources, and read-only derived state.
- Expose consequential dependencies through arguments, focused capabilities, registries, or narrow closures.
- Keep domain decisions out of effects. Use effects to synchronize with the outside world.
- Keep acquisition beside cleanup and stale-result policy beside async work.
- Match each important seam with a pure, mounted, protocol, browser, adversarial, or visual contract.
- Keep real seams extractable without extracting them prematurely.

Keep mutable module state only when it truly has page lifetime and tests can reset it. Otherwise create it inside a disposable Solid root. Put time, storage, network, media, popups, workers, and other nondeterminism behind the narrowest useful capability boundary; replace that boundary with plain fakes in tests.

Name commands after user intent and let them repair invariants. Use `batch` when several independent writes must appear atomic. Let a small component close over nearby capabilities; introduce a focused controller when a subsystem gains its own policy or lifetime. Avoid one object that knows everything.

Create components for semantic interactions, repeated identity, local state, cleanup, or important visual states. Keep one-off markup inline. Give CSS a deliberate cascade, prefer semantic state selectors, and treat labels, keyboard operation, visible focus, reduced motion, and responsive behavior as component contracts.

Warning signs are concrete: mutable globals with no reset story, DOM queries standing in for state, effects copying derived values, browser APIs scattered through views, async work without cancellation, arbitrary sleeps, screenshots no one inspects, and architectural comments that disagree with the code.

## Establish the browser runtime

Use one mount node and one module script. Map every Solid entrypoint to the same browser version and runtime instance. These relative `node_modules` paths suit a local server that deliberately exposes them:

~~~html
<div id="app"></div>
<script type="importmap">
  {
    "imports": {
      "solid-js": "./node_modules/solid-js/dist/solid.js",
      "solid-js/html": "./node_modules/solid-js/html/dist/html.js",
      "solid-js/store": "./node_modules/solid-js/store/dist/store.js",
      "solid-js/web": "./node_modules/solid-js/web/dist/web.js"
    }
  }
</script>
<script type="module">
  import {
    For, Index, Match, Show, batch, children,
    createEffect, createMemo, createSignal, on, onCleanup
  } from "solid-js";
  import html from "solid-js/html";
  import { createStore, produce, reconcile, unwrap } from "solid-js/store";
  import { Dynamic, render } from "solid-js/web";
</script>
~~~

Import only what the app uses, and never map to server builds. For deployment, vendor a narrow module directory or pin exact CDN URLs; do not expose an entire dependency tree by accident.

Prefer HTTPS when practical because it resembles deployment and enables secure-context features. `file://` remains valid when the target browser can load the full module graph and the app avoids or adapts origin-sensitive capabilities. Test it as a distinct supported environment. Feature-detect `crypto.randomUUID`, camera, display capture, restricted clipboard access, and similar APIs.

`solid-js/html` parses and caches tagged templates and generates clone/assignment code with `new Function`. Strict CSP must allow dynamic function construction; otherwise use precompiled templates.

## Use Solid's reactive model

The most expensive Solid mistakes begin with the wrong execution model: component bodies run once. Solid reruns tracked computations, not components.

Treat the rules below as an installed-runtime baseline, not a reason to wrap every value in an accessor. When an unlisted form matters, mount the smallest probe against the installed `solid-js/html` build and assert both its initial value and an update before touching production code.

### Read reactive values at the right time

- Read a signal in JavaScript with `count()`.
- Insert `${count}` to retain reactivity.
- Treat `${count()}` as an initial snapshot.
- Wrap store reads and expressions: `${() => draft.name}` and `${() => a() + b()}`.

Wrap the complete dynamic DOM value:

~~~js
return html`
  <button
    disabled=${() => saving()}
    class=${() => saving() ? "btn disabled" : "btn"}
    classList=${() => ({ active: selected(), invalid: errors().length > 0 })}
    style=${() => ({ width: `${width()}px`, display: hidden() ? "none" : "" })}
    onClick=${event => save(event)}
  >Save</button>
`;
~~~

Wrap the whole `classList` or `style` object. The runtime does not call accessors nested inside a static object:

~~~js
classList=${() => ({ active: isActive() })} // reactive
classList=${{ active: () => isActive() }}    // function is truthy
~~~

### Pass component props deliberately

Pass changing component values as zero-argument thunks. `solid-js/html` turns an own zero-argument function prop into a getter, so the child reads it as a value:

~~~js
function Parent() {
  const [current, setCurrent] = createSignal({ name: "Ada" });
  return html`<${Child} item=${() => current()} onSave=${value => save(value)} />`;
}

function Child(props) {
  return html`<button onClick=${event => props.onSave(props.item)}>${() => props.item.name}</button>`;
}
~~~

Do not destructure changing props outside an accessor or call a wrapped value as `props.item()`. Give callback props at least one declared parameter, such as `value => save(value)` or `_ => save()`: a zero-argument component prop is treated as dynamic data. Native DOM events do not have this trap.

Pass stable objects and store proxies directly. A proxy item from `For` remains reactive when its properties are read inside accessors.

If the child must receive a zero-argument function itself, preserve it behind an outer getter:

~~~js
component=${() => Home}                 // child receives Home
formatter=${() => value => format(value)}
component=${Home}                       // wrong when Home.length === 0: reading calls Home
~~~

Use this form for router `component` and `root` props, render callbacks, factories, and similar values. Otherwise pass stable values directly and ordinary callbacks with at least one parameter. An accessor is not an all-purpose prop fix.

### Respect the template grammar

- Write components as `<${Component}>...<//>` or self-close them as `<${Component} />`. A literal capitalized HTML tag is not component syntax, and repeating the interpolation in `</${Component}>` misaligns later expressions.
- Static component attributes are strings. `<${Child} count="2" enabled>` passes `"2"` and `""`, not `2` and `true`; use `count=${2}` and `enabled=${true}`.
- Static DOM boolean attributes are true by presence, so `disabled="false"` is still disabled. Use `disabled=${false}` or a reactive accessor.
- Do not use mixed literal/interpolation attributes on components, such as `label="Hello ${name}"`. The runtime only evaluates a component attribute whose complete value is one interpolation. Use `label=${() => `Hello ${name()}`}`.
- Mixed DOM attributes are supported and become reactive if any interpolation is a function.
- Component children are lazy getter props. Do not destructure them. Read `props.children` in an accessor, or use Solid's `children(() => props.children)` helper when resolving or reading them more than once.
- A mapper child for `For`, `Index`, `Show`, or `Match` must keep its expected parameter arity; do not hide it in a zero-argument wrapper.
- Whitespace-only template children and formatting newlines are removed or normalized. Insert `${" "}` when a meaningful text space must survive.
- Multiple roots return a node array. Null, undefined, and booleans render no text. Interpolated strings are text, but `innerHTML` is raw HTML and requires trusted or sanitized input.

Treat spreads as their own syntax:

~~~js
<div ...${() => ({ title: title(), hidden: hidden() })}></div>
<${Child} ...${() => ({ item: current(), component: Home })} />
~~~

- Use `...${object}` for stable values or getter-bearing/store objects.
- Use `...${() => object}` when the spread object must be recomputed reactively.
- A zero-argument function stored as a value inside a plain spread object is not auto-unwrapped. This differs from a directly written component prop.
- Later component spread/prop groups take precedence unless their value is undefined.
- A DOM spread's `children` is ignored when literal template children already exist.
- Use a spread object for dynamic attribute names; interpolated attribute names are not supported.

### Bind DOM behavior explicitly

Events, refs, directives, and namespaces are binding syntax, not reactive values:

- `onClick=${handler}` registers that exact function once. A signal accessor is not a reactive handler; use `event => currentHandler()(event)`.
- Use `on:event=${handler}` for a direct custom listener and `oncapture:event=${handler}` for capture. Common `onClick`-style events may be delegated.
- `ref=${node => element = node}` runs once when the DOM node is created. A DOM ref is not reactive and does not clean up resources automatically.
- Component `ref` is only an ordinary component prop and follows the function-prop rules.
- The supported directive form is `use:${directive}=${argument}`. The directive owns its setup and cleanup.
- Use `attr:name=${value}` to force an attribute and `prop:name=${value}` to force a property. Do not use JSX-style `class:name` or `style:name`; use reactive `classList` and `style` objects.
- Custom elements default unknown names to property assignment; force `attr:` when an attribute is required. SVG uses attribute/namespace assignment unless forced otherwise.
- Import `Dynamic` from `solid-js/web` and use `<${Dynamic} component=${() => tagName}>` for a changing native tag; `<${value}>` is component syntax, not a dynamic native-tag shortcut.

### Keep identity and state ownership visible

Use `For` for identity-bearing items that enter, leave, or reorder; its item is a value and its index an accessor. Use `Index` for fixed slots whose values change; its item is an accessor and its index a number. Use keyed `Show` when child-local state belongs to the truthy record and must reset when that record changes.

Use signals for scalar UI state and stores for nested trees. Prefer narrow stable-ID paths:

~~~js
setDraft("rows", produce(rows => rows.push(nextRow)));
setModel("groups", group => group.id === groupId, "title", title);
const payload = structuredClone(unwrap(model));
~~~

Setter paths accept keys, key arrays, array predicates, and ranges. `produce` supplies a mutation-shaped proxy while updates still flow through store setters. `reconcile(next, { key: "id", merge: false })` preserves matching identity in replacement trees; `"id"` is the default key, `null` disables keyed matching, and the identity policy must be deliberate. `unwrap` returns raw data; clone it for durable snapshots or external mutation.

Keep these store and signal semantics explicit:

- Destructuring a store property outside an accessor snapshots it. Read `store.record.name` inside a memo, effect, or template accessor.
- Store tracking is per property, array index, and `length`; read the exact dependency a query needs.
- `setStore({ ... })` merges a root object. Use `reconcile(next)` for identity-preserving replacement and a deliberate reset strategy when identity must be discarded.
- Setting a store property to `undefined` deletes it.
- Plain objects and arrays are wrappable; `Date`, `Map`, `Set`, DOM nodes, streams, and window handles are not useful reactive store leaves. Keep resources in signals, maps, or dedicated controllers.
- Prefer `createStore` plus named commands over `createMutable`; unrestricted proxy mutation makes ownership and tests harder to audit. When maintaining an existing `createMutable` app, centralize its writes behind the same command boundary.
- A signal setter treats a function argument as an updater. To store a function, call `setHandler(() => nextHandler)`.
- Mutating an object and setting the same identity may not notify dependents. Replace it or use a store setter.

### Use effects at system boundaries

Use effects for external synchronization. Hydrate, migrate, and validate durable data before enabling persistence, or the first effect can overwrite saved state. Define what happens when storage is denied or full. Pair acquisition and release visibly:

~~~js
createEffect(() => environment.writeStorage(STORAGE_KEY, JSON.stringify(unwrap(model))));

addEventListener("keydown", onKey);
onCleanup(() => removeEventListener("keydown", onKey));
~~~

Do not use `createEffect(async () => ...)` or `createMemo(async () => ...)`. Tracking and cleanup ownership are synchronous. Snapshot before `await`, abort superseded work, and handle rejection:

~~~js
function createAsyncEffect(deps, run) {
  createEffect(on(deps, (value, previous) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    void (async () => run(value, previous, controller.signal))().catch(error => {
      if (!controller.signal.aborted) console.error(error);
    });
  }));
}
~~~

Use the disposer returned by `render`; it releases the root and empties the mount node.

## Route static apps with hashes

Add a router only when navigation earns it. Install `@solidjs/router` and map its browser entrypoint:

~~~sh
npm install --save-dev @solidjs/router
~~~

~~~json
"@solidjs/router": "./node_modules/@solidjs/router/dist/index.js"
~~~

`devDependencies` suits a directly served artifact, but this module is still needed at runtime: vendor or deploy it with the app. Keep it compatible with the one Solid runtime mapped by the page.

Use `HashRouter` for static or file-hosted SPAs. The fragment carries navigation, so the server needs no pathname fallback. Routes still begin with `/`; `/items/7` appears as `#/items/7`.

Prefer configuration routes because they pass component functions as ordinary JavaScript values and avoid template prop-arity mistakes:

~~~js
import { A, HashRouter, Route, useParams } from "@solidjs/router";

function Home() {
  return html`<h1>Home</h1>`;
}

function ItemPage() {
  const params = useParams();
  return html`<h1>${() => params.id}</h1>`;
}

function Layout(props) {
  return html`
    <nav>
      <${A} href="/" end=${true}>Home<//>
      <${A} href="/items" activeClass="selected">Items<//>
    </nav>
    <main>${() => props.children}</main>
  `;
}

const routes = [
  { path: "/", component: Home },
  { path: "/items/:id", component: ItemPage }
];

render(
  () => html`<${HashRouter} root=${() => Layout}>${routes}<//>`,
  document.getElementById("app")
);
~~~

If route declarations live in the template, preserve component functions explicitly:

~~~js
<${HashRouter} root=${() => Layout}>
  <${Route} path="/" component=${() => Home} />
  <${Route} path="/items/:id" component=${() => ItemPage} />
<//>
~~~

Use `A` or router navigation instead of pathname anchors. Route search belongs inside the fragment (`#/items?sort=name`); page-level flags such as `?test=1` stay in `location.search` before the hash.

### Learn the API through `MemoryRouter`

Treat a mounted memory-router suite as executable documentation. Keep the core hook shapes visible:

~~~js
const location = useLocation();                 // reactive object: pathname, search, hash, query, state
const params = useParams();                     // reactive object; values may be undefined
const [search, setSearch] = useSearchParams();  // strings or arrays; null/undefined/"" removes a key
const navigate = useNavigate();
navigate("/items/123", { replace: false, scroll: true, state: { source: "list" } });
navigate(-1);
~~~

Read `location`, `params`, and `search` inside accessors or tracked computations; do not destructure them. Navigation and search setters are commands, not reactive values.

Seed history before mounting, then drive the same object in assertions:

~~~js
import { MemoryRouter, createMemoryHistory } from "@solidjs/router";

const history = createMemoryHistory();
history.set({ value: "/items/123?sort=name", replace: true, scroll: false });
const settle = () => new Promise(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(resolve))
);
const assertRoute = (path, text) => {
  if (history.get() !== path || !testRoot.textContent.includes(text)) {
    throw new Error(`Expected ${path} and ${text}`);
  }
};

const dispose = render(
  () => html`<${MemoryRouter} history=${history} root=${() => Layout}>${routes}<//>`,
  testRoot
);

await settle();
assertRoute("/items/123?sort=name", "123");
history.set({ value: "/items/456", replace: false, scroll: false });
await settle();
assertRoute("/items/456", "456");
history.back();
await settle();
assertRoute("/items/123?sort=name", "123");
history.forward();
await settle();
assertRoute("/items/456", "456");
dispose();
~~~

Cover configuration and `Route` declarations; root and nested layouts; outlets; static, parameter, optional, and wildcard matches; the location, params, search, and navigation hooks; `A` hrefs and active classes; push, replace, state, relative paths, back, forward, go, preload behavior, unknown routes, and disposal. Assert router state and rendered DOM after every action. Reread the installed source and rerun the notebook after upgrades.

Memory tests do not replace browser integration. Test initial hash deep links, rendered `#/` hrefs, `hashchange`, browser back/forward, route search inside the hash, page-level query flags before it, unknown routes, and reload. Reset the hash or use a fresh context between cases.

## Make verification part of the design

Choose the proof that matches the seam:

1. Test normalization, migration, parsing, identity, ordering, and serialization as pure domain contracts.
2. Test commands, transitions, cancellation, and cleanup through controller contracts.
3. Mount real components and dispatch real events to prove wiring.
4. Use browser contracts for page errors, popups, secure contexts, viewport, DPR, and geometry.
5. Capture named visual states at deterministic sizes.
6. Test malformed storage, missing APIs, denied permissions, empty data, long content, stale requests, and disposal during work.

Let the suite reveal the chosen spine: iterate registries; test pipeline stages and state transitions; write behavior stories for narrative or feature spines; prove acquisition, replacement, and disposal for lifecycle spines; exercise routes through memory and hash integrations. Add tests across those boundaries so the suite does not inherit the architecture's blind spots.

Name tests after the promise they protect: "imports atomically," "keeps selection safe through removal," or "stale work cannot replace a newer result."

Mount through one explicit boundary and create mutable state inside the Solid root:

~~~js
function mount(root, environment) {
  let controller;
  const dispose = render(() => {
    controller = createController(environment);
    return html`<${App} controller=${controller} />`;
  }, root);
  return { controller, dispose };
}
~~~

In test mode, expose commands, queries, deterministic fixtures, and assertion state; do not expose raw internals. Set the completion flags before mounting so a bootstrap failure cannot become a timeout:

~~~js
const testMode = new URLSearchParams(location.search).has("test");
if (testMode) {
  window.TESTS_DONE = false;
  window.TESTS_FAILED = 0;
}

let mounted;
try {
  mounted = mount(document.getElementById("app"), browserEnvironment);
} catch (error) {
  if (testMode) {
    window.TESTS_FAILED = 1;
    window.TESTS_DONE = true;
  }
  throw error;
}

if (testMode) {
  void (async () => {
    try {
      window.TESTS_FAILED = Number(await runTests(mounted.controller.testApi) || 0);
    } catch (error) {
      window.TESTS_FAILED = 1;
      console.error("Test bootstrap failed:", error);
    } finally {
      window.TESTS_DONE = true;
    }
  })();
}
~~~

Define `runTests` inline for a true one-file artifact or import it in a larger project. Continue after individual failures and return their count. Use semantic queries or stable `data-test` hooks. Call commands for controller contracts; dispatch real events for wiring. Wait for a condition or two animation frames, never an arbitrary sleep.

## Verify in a real browser

Use the bundled runner instead of reproducing a fragile shell one-liner:

~~~sh
npm install --save-dev playwright
npx playwright install chromium
node .agents/skills/buildless-solid-spa/scripts/run-browser-tests.mjs ./app.html
~~~

Pass an already-running URL for routes, headers, popups, or secure APIs:

~~~sh
node .agents/skills/buildless-solid-spa/scripts/run-browser-tests.mjs https://localhost/app.html
~~~

The runner adds `?test=1`, fixes the initial viewport, forwards console output, fails on page errors or `TESTS_FAILED`, reports first-party Chromium coverage, and writes screenshots under `test-results/solid-spa`. Pass a second argument to change the artifact directory.

Before navigation, the driver exposes this callback to the page:

~~~js
await window.captureTestScreenshot?.("populated-state");
await window.captureTestScreenshot?.("editor-open", "main");
await window.captureTestScreenshot?.("empty-narrow", null, {
  viewport: { width: 390, height: 844 }
});
~~~

The third argument accepts `viewport` and `fullPage`; a temporary viewport is restored after capture. Put the app in deterministic state, await fonts when typography matters, settle the layout, and name the image after the product state. Inspect every requested PNG. A screenshot supplements DOM, geometry, focus, and accessibility assertions; it does not replace them.

Attach console and `pageerror` listeners and start coverage before `goto`. Wait with the correct signature:

~~~js
await page.waitForFunction(() => window.TESTS_DONE, null, { timeout: 30000 });
~~~

The second argument belongs to the page function; options belong in the third. Filter coverage to first-party code and use missed functions to choose tests. A percentage measures execution, not correctness.

Verify representative visual states:

- Empty, populated, editing, validation/error, and active-resource states.
- Desktop and narrow viewports with horizontal-overflow assertions.
- Long content, important aspect ratios, and high DPR where relevant.
- Popup or secondary-window output when owned by the app.

## Before handing off

- Explain the file's reading spine and find every mutation owner without guesswork.
- Replay the representative feature, invariant, and failure traces.
- Keep durable, preference, session, resource, and derived state distinct.
- Pair every resource and global listener with cleanup.
- Exercise a reactive update and a real event.
- Run pure, controller, mounted, browser, adversarial, and visual checks in proportion to the change.
- Verify desktop and narrow layouts; inspect every requested screenshot.
- Review coverage for suspicious untouched branches, then run the project's established test command.
