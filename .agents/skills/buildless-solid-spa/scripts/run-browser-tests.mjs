import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const requireFromProject = createRequire(path.join(process.cwd(), "package.json"));
let chromium;
try {
  ({ chromium } = requireFromProject("playwright"));
} catch {
  throw new Error("Playwright is not installed in the target project. Run: npm install --save-dev playwright");
}

const input = process.argv[2] ?? "index.html";
const artifactDirectory = path.resolve(process.argv[3] ?? "test-results/solid-spa");
const requestedTimeout = Number(process.env.SOLID_BROWSER_TEST_TIMEOUT_MS);
const testTimeout = Number.isFinite(requestedTimeout) && requestedTimeout > 0
  ? requestedTimeout
  : 90000;
const inputIsUrl = /^(?:https?|file):/i.test(input);
const target = new URL(inputIsUrl ? input : pathToFileURL(path.resolve(input)).href);
target.searchParams.set("test", "1");
await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch();
let screenshotIndex = 0;

function viewportDimension(value, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(4096, Math.max(240, number)) : fallback;
}

function isFirstParty(entry) {
  if (!entry.url) return false;
  const url = new URL(entry.url);
  if (url.pathname.includes("/node_modules/")) return false;
  return target.protocol === "file:"
    ? url.protocol === "file:" && url.pathname.startsWith(target.pathname.slice(0, target.pathname.lastIndexOf("/") + 1))
    : url.origin === target.origin;
}

function reportCoverage(entries) {
  const relevant = entries.filter(isFirstParty);
  if (!relevant.length) {
    console.warn("No first-party Chromium coverage entries were returned.");
    return;
  }

  let coveredTotal = 0;
  let lineTotal = 0;
  for (const entry of relevant) {
    const lines = entry.source.split("\n");
    const offsets = [0];
    for (const line of lines) offsets.push(offsets.at(-1) + line.length + 1);
    const uncovered = new Set();

    for (const fn of entry.functions) {
      for (const range of fn.ranges) {
        if (range.count) continue;
        for (let line = 0; line < lines.length; line++) {
          if (range.startOffset < offsets[line + 1] && range.endOffset > offsets[line]) uncovered.add(line);
        }
      }
    }

    const covered = lines.length - uncovered.size;
    coveredTotal += covered;
    lineTotal += lines.length;
    console.log(`${new URL(entry.url).pathname}: ${covered}/${lines.length} lines (${(100 * covered / lines.length).toFixed(1)}%)`);

    const missed = entry.functions
      .filter(fn => fn.functionName && fn.ranges.every(range => !range.count))
      .map(fn => fn.functionName);
    if (missed.length) console.log(`Uncovered functions: ${missed.join(", ")}`);
  }
  console.log(`First-party coverage: ${coveredTotal}/${lineTotal} lines (${(100 * coveredTotal / lineTotal).toFixed(1)}%)`);
}

try {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  const pageErrors = [];
  let rejectFirstPageError;
  const firstPageError = new Promise((_, reject) => {
    rejectFirstPageError = reject;
  });
  const failOnPageError = operation => Promise.race([operation, firstPageError]);

  page.on("console", message => console.log(message.text()));
  page.on("pageerror", error => {
    pageErrors.push(error.message);
    console.error("PAGE ERROR:", error.stack || error.message);
    rejectFirstPageError(error);
  });

  await page.exposeFunction("captureTestScreenshot", async (name, selector, settings = {}) => {
    const config = settings && typeof settings === "object" ? settings : {};
    const previousViewport = page.viewportSize();
    const requestedViewport = config.viewport;
    if (requestedViewport) {
      const width = viewportDimension(requestedViewport.width, previousViewport.width);
      const height = viewportDimension(requestedViewport.height, previousViewport.height);
      await page.setViewportSize({ width, height });
    }

    const safeName = String(name || "state").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "") || "state";
    const filename = `${String(++screenshotIndex).padStart(2, "0")}-${safeName}.png`;
    const screenshotPath = path.join(artifactDirectory, filename);
    const options = { path: screenshotPath, animations: "disabled", caret: "hide" };
    try {
      if (config.assertNoHorizontalOverflow) {
        const geometry = await page.evaluate(() => ({
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth
        }));
        if (geometry.documentWidth > geometry.viewportWidth) {
          throw new Error(`Horizontal overflow: document is ${geometry.documentWidth}px wide in a ${geometry.viewportWidth}px viewport`);
        }
      }
      if (config.assertControlsContainedBy) {
        const clippedControls = await page.locator(config.assertControlsContainedBy).evaluate(container => {
          const bounds = container.getBoundingClientRect();
          return [...container.querySelectorAll("input, textarea, select, button")]
            .map(element => {
              const rect = element.getBoundingClientRect();
              return { label: element.getAttribute("aria-label") || element.name || element.tagName, left: rect.left, right: rect.right };
            })
            .filter(rect => rect.right > rect.left && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1));
        });
        if (clippedControls.length) {
          throw new Error(`Controls escape ${config.assertControlsContainedBy}: ${JSON.stringify(clippedControls)}`);
        }
      }
      if (selector) await page.locator(selector).screenshot(options);
      else await page.screenshot({ ...options, fullPage: config.fullPage ?? true });
      console.log(`Screenshot: ${screenshotPath}`);
      return screenshotPath;
    } finally {
      if (requestedViewport && previousViewport) await page.setViewportSize(previousViewport);
    }
  });

  await page.coverage.startJSCoverage({ reportAnonymousScripts: true });
  const response = await failOnPageError(page.goto(target.href, { waitUntil: "domcontentloaded", timeout: testTimeout }));
  if (response && !response.ok()) throw new Error(`Navigation failed: ${response.status()} ${response.statusText()}`);
  await failOnPageError(page.waitForFunction(() => window.TESTS_DONE, null, { timeout: testTimeout }));

  const failures = await page.evaluate(() => Number(window.TESTS_FAILED || 0));
  reportCoverage(await page.coverage.stopJSCoverage());
  if (failures || pageErrors.length) {
    throw new Error(`${failures} in-page test failure(s), ${pageErrors.length} uncaught page error(s)`);
  }

  await context.close();
} finally {
  await browser.close();
}
