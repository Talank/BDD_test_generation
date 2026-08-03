#!/usr/bin/env node
/**
 * Generalized BDD step-definition prompt builder.
 *
 * Given any Playwright + cucumber-js repo, discovers its test layout
 * (features, step definitions, page-object / DSL layer, World, constants)
 * and fills `new_prompt_template.md` so an LLM can write the missing step
 * definitions for a target Gherkin scenario/feature.
 *
 * Zero dependencies (Node >= 16). Pure filesystem + text analysis, so it
 * never executes the target repo's config or test code.
 *
 * Usage:
 *   node prompt_builder.js --repo <path> [--gherkin <feature-file|"inline text">]
 *                          [--out <file>] [--truth <file>] [--template <file>]
 *                          [--json] [--no-holdout]
 *
 *   --repo        Path to the target repo (required).
 *   --gherkin     Target scenario/feature: a path to a .feature file, OR literal
 *                 Gherkin text. If omitted, a placeholder is left in the prompt.
 *   --out         Write the prompt here instead of stdout.
 *   --truth       Write the held-out ground-truth binding(s) here (for diffing an
 *                 LLM's answer against the repo's real step definitions).
 *   --template    Template file (default: ./new_prompt_template.md next to this script).
 *   --json        Print the discovery result as JSON (debug) instead of the prompt.
 *   --no-holdout  Keep the target scenario's existing bindings in the prompt
 *                 (default is to remove them so the model must write them).
 *   --keep-residue  After removing the target bindings, keep the declarations
 *                 that only they used (file-local helpers, now-unused imports).
 *                 Default is to prune them: they are answer residue.
 *
 * Hold-out is content-based: every registered binding is compiled the way cucumber
 * compiles it (a regex binding as itself, a Cucumber Expression to its equivalent
 * regex) and tested against the target scenario's step texts — with Scenario
 * Outline placeholders substituted from Examples first, as the runner does.
 * Matched bindings are removed from the existing-defs slot, along with anything
 * only they used. No filename convention, and no textual approximation of
 * matching, is involved.
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'coverage',
  '.next', '.nuxt', '.svelte-kit', 'target', 'vendor', '.cache',
  'reports', 'test-results', 'allure-results', 'playwright-report',
]);
const SOURCE_EXTS = ['.ts', '.js', '.mjs', '.cjs', '.mts', '.cts', '.tsx', '.jsx'];
// Non-source files a step may import for its data (fixtures, payloads, tables).
// A step that reads `data.userName` is unreproducible without these, so they are
// resolved and surfaced rather than silently dropped.
const DATA_EXTS = ['.json', '.json5', '.yaml', '.yml', '.xml', '.csv', '.txt'];
const MAX_FIXTURE_BYTES = 16 * 1024;

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

const _readCache = new Map();
function read(file) {
  if (_readCache.has(file)) return _readCache.get(file);
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { text = ''; }
  _readCache.set(file, text);
  return text;
}

// tsconfig/jsconfig are JSON-with-comments and often carry trailing commas.
function parseJsonc(text) {
  if (!text) return null;
  const stripped = text
    .replace(/"(?:\\.|[^"\\])*"|(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m, comment) => (comment ? ' ' : m))
    .replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(stripped); } catch { return null; }
}

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

// Expand brace sets and extglob alternations into a list of plain globs, so the
// simple matcher below only ever sees **, * and ?. Cucumber configs routinely
// use `e2e/**/*.{ts,mts}` or `features/**/*.@(js|ts)`, which the plain matcher
// would otherwise treat as literal characters and match nothing.
const MAX_GLOB_EXPANSION = 128;

function expandGlob(glob) {
  // @(a|b) +(a|b) ?(a|b) *(a|b) (a|b)  ->  {a,b}
  const normalized = glob.replace(
    /[@+?*!]?\(([^()]*\|[^()]*)\)/g,
    (_, inner) => '{' + inner.split('|').join(',') + '}',
  );

  const out = [];
  const expand = (s) => {
    if (out.length >= MAX_GLOB_EXPANSION) return;
    const open = s.indexOf('{');
    if (open === -1) { out.push(s); return; }

    let depth = 0, close = -1;
    for (let i = open; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}' && --depth === 0) { close = i; break; }
    }
    if (close === -1) { out.push(s); return; } // unbalanced: treat literally

    const pre = s.slice(0, open);
    const post = s.slice(close + 1);
    const parts = [];
    let d = 0, cur = '';
    for (const ch of s.slice(open + 1, close)) {
      if (ch === '{') d++;
      else if (ch === '}') d--;
      if (ch === ',' && d === 0) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    for (const p of parts) expand(pre + p + post);
  };
  expand(normalized);
  return out.length ? out : [glob];
}

// Convert a simple glob (supporting **, *, ?) to a RegExp anchored full-match.
function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { // ** => any depth
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++; // swallow the slash after **/
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') re += '[^/]';
    else if ('\\^$+.()|[]{}'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

// ---------------------------------------------------------------------------
// Step 1: figure out how cucumber-js is invoked (config file + npm scripts).
// We only use this to LOCATE files; junk tokens are dropped by resolve-filter.
// ---------------------------------------------------------------------------

// The one place cucumber's config filenames are written down. Both the "read the
// config" path and the "never bucket the config as a source file" check derive
// from this array, so the two cannot drift apart.
const CUCUMBER_CONFIG_NAMES = [
  'cucumber.js', 'cucumber.cjs', 'cucumber.mjs', 'cucumber.ts', 'cucumber.json',
  'cucumber.yaml', 'cucumber.yml', '.cucumberrc', '.cucumberrc.json',
  '.cucumberrc.yaml', '.cucumberrc.yml',
];
const CUCUMBER_CONFIG_RE = new RegExp(
  '^(' + CUCUMBER_CONFIG_NAMES.map(escapeRe).join('|') + ')$', 'i');

function invocationCodeGlobs(repo) {
  const blobs = [];

  // (a) cucumber config files
  for (const name of CUCUMBER_CONFIG_NAMES) {
    const p = path.join(repo, name);
    if (fs.existsSync(p)) blobs.push(read(p));
  }

  // (b) package.json: cucumber field + every script that runs cucumber-js.
  // All of them, not just `test`: repos routinely put the real --require list on
  // a `test:e2e` / `debug` script and leave `test` as a thin wrapper.
  const pkgPath = path.join(repo, 'package.json');
  const scriptTexts = [];
  if (fs.existsSync(pkgPath)) {
    let pkg = {};
    try { pkg = JSON.parse(read(pkgPath)); } catch { /* ignore */ }
    if (pkg.cucumber) blobs.push(JSON.stringify(pkg.cucumber));
    for (const s of Object.values(pkg.scripts || {})) {
      if (typeof s === 'string' && /cucumber-js/.test(s)) { blobs.push(s); scriptTexts.push(s); }
    }
  }

  // (c) follow `--config <path>` / `-c <path>` out of those scripts. Without this
  // a repo whose config lives at e.g. `config/cucumber.js` looks like it has no
  // invocation at all, and discovery silently falls through to the widening scan.
  for (const text of scriptTexts) {
    for (const m of text.matchAll(/(?:--config|(?:^|\s)-c)(?:=|\s+)["']?([^\s"';&|]+)/g)) {
      const p = path.resolve(repo, m[1]);
      if (p.startsWith(repo) && fs.existsSync(p) && fs.statSync(p).isFile()) blobs.push(read(p));
    }
  }

  const globs = new Set();
  for (const text of blobs) for (const g of codeGlobsFromText(text)) globs.add(g);
  return [...globs];
}

// Extract code-require globs from a config/script blob. We ONLY collect args of
// --require / --import (CLI + legacy array form) and the require/import keys of
// object configs. Positional args (the features path) and everything else are
// ignored — features are found by scanning for *.feature directly.
function codeGlobsFromText(text) {
  const out = [];

  // CLI form:  --require e2e/**/*.ts   or   --import=tests/support
  for (const m of text.matchAll(/--(?:require|import)(?:=|\s+)["'`]?([^\s"'`,]+)/g)) {
    out.push(m[1]);
  }

  // Legacy array / string-profile form: ordered tokens where a quoted or bare
  // "--require"/"--import" is immediately followed by its glob.
  const ordered = [];
  for (const m of text.matchAll(/["'`]([^"'`]+)["'`]/g)) ordered.push(m[1]);
  for (let i = 0; i < ordered.length - 1; i++) {
    if (ordered[i] === '--require' || ordered[i] === '--import') out.push(ordered[i + 1]);
  }

  // Object-config form:  require: [ '...' ]  /  import: [ '...' ]
  for (const m of text.matchAll(/\b(?:require|import)\s*:\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) out.push(s[1]);
  }

  // Drop non-path junk. Transpiler hooks are NOT filtered by vendor name here —
  // a name list can only ever know the loaders that existed when it was written
  // (@swc-node/register, tsimp and sucrase/register all walk straight through
  // one). They are separated from real paths in discover() by whether they point
  // at anything inside the repo, which needs no knowledge of who wrote them.
  return out
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => /[\/.]/.test(t) && !t.includes('://'));
}

// A token that is a bare package specifier and matches nothing in the repo is a
// module hook, not a broken path — it must not count as a dead glob, because a
// dead glob flips discovery into the repo-wide widening scan.
function looksLikeRepoPath(repo, token) {
  return /^[./]/.test(token)
    || /[*?{[(]/.test(token)
    || fs.existsSync(path.join(repo, token));
}

// Resolve a token (glob, dir, or file) against the repo into concrete files.
function resolveToken(repo, token, allFiles) {
  const clean = token.replace(/^\.\//, '');
  const abs = path.join(repo, clean);
  // plain existing file
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return [abs];
  // plain existing directory -> everything under it
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    return allFiles.filter((f) => f === abs || f.startsWith(abs + path.sep));
  }
  // glob
  if (/[*?{(]/.test(clean)) {
    const regexes = expandGlob(clean).map(globToRegex);
    return allFiles.filter((f) => {
      const r = rel(repo, f);
      return regexes.some((re) => re.test(r));
    });
  }
  return [];
}

// ---------------------------------------------------------------------------
// Step 2: classify files into buckets.
// ---------------------------------------------------------------------------

const isSource = (f) => SOURCE_EXTS.includes(path.extname(f));

function classify(file, src, repo) {
  const name = path.basename(file).toLowerCase();
  const relp = rel(repo, file).toLowerCase();
  const hasStep = /\b(Given|When|Then)\s*\(/.test(src);
  const hasWorld = /setWorldConstructor|extends\s+World|WorldConstructor|new\s+World\b/.test(src);
  const hasHooks = /\b(Before|After|BeforeAll|AfterAll|BeforeStep|AfterStep|setDefaultTimeout)\s*\(/.test(src);
  // NB: `fixtures?` deliberately does NOT appear here — the support branch below
  // tests it first and returns, so listing it again would be dead code.
  const constByName = /(^|[.\-_/])(constants?|config|env|settings)([.\-_]|$)/.test(name)
    || /(^|\/)(constants?|config)\b/.test(relp);

  if (hasStep) return 'step';
  if (hasWorld || /(^|[.\-_/])(world)([.\-_]|$)/.test(name)) return 'world';
  if (hasHooks || /(^|[.\-_/])(hooks?|support|setup|assertions?|globals?|fixtures?)([.\-_]|$)/.test(name)) return 'support';
  if (constByName) return 'constant';
  return 'dsl';
}

// ---------------------------------------------------------------------------
// Module resolution: relative specifiers, tsconfig `paths`/`baseUrl`,
// package.json subpath `imports`, and monorepo workspace package names.
//
// A relative-only resolver drops the whole page-object layer in any repo that
// reaches it through an alias (`@pages/cart`), which is the norm in TS repos.
// We only ever resolve to files that exist INSIDE the repo, so real npm
// packages simply fail to resolve and are reported as unresolved.
// ---------------------------------------------------------------------------

// One alias = a prefix/suffix pair around a single `*`, plus its target patterns.
function makeAlias(pattern, targets, baseDir) {
  const star = pattern.indexOf('*');
  return {
    prefix: star === -1 ? pattern : pattern.slice(0, star),
    suffix: star === -1 ? '' : pattern.slice(star + 1),
    exact: star === -1,
    targets: targets.map((t) => ({
      abs: path.resolve(baseDir, t.replace(/^\.\//, '')),
      hasStar: t.includes('*'),
    })),
  };
}

function readTsConfigChain(repo, file, depth = 0) {
  if (depth > 5 || !fs.existsSync(file)) return null;
  const cfg = parseJsonc(read(file));
  if (!cfg) return null;
  const dir = path.dirname(file);

  let inherited = { baseUrlAbs: null, paths: {}, pathsBaseAbs: null };
  if (typeof cfg.extends === 'string') {
    let ext = cfg.extends;
    let extPath;
    if (ext.startsWith('.')) {
      extPath = path.resolve(dir, ext);
      if (!/\.json$/i.test(extPath)) extPath += '.json';
    } else {
      extPath = path.join(repo, 'node_modules', ext);
      if (!/\.json$/i.test(extPath)) extPath = path.join(extPath, 'tsconfig.json');
    }
    inherited = readTsConfigChain(repo, extPath, depth + 1) || inherited;
  }

  const co = cfg.compilerOptions || {};
  const ownPaths = co.paths && Object.keys(co.paths).length ? co.paths : null;
  const baseUrlAbs = co.baseUrl ? path.resolve(dir, co.baseUrl) : inherited.baseUrlAbs;
  return {
    baseUrlAbs,
    paths: ownPaths || inherited.paths,
    // `paths` are relative to baseUrl when set, otherwise to the tsconfig itself.
    pathsBaseAbs: ownPaths
      ? (co.baseUrl ? path.resolve(dir, co.baseUrl) : dir)
      : inherited.pathsBaseAbs,
  };
}

// Gather every alias source in the repo. For discovery we want to be generous:
// merging several tsconfigs can only help us FIND files, never mis-compile them.
function loadAliases(repo, allFiles) {
  const aliases = [];
  const baseUrls = [];

  const configs = allFiles.filter((f) =>
    /^(ts|js)config[\w.-]*\.json$/i.test(path.basename(f)));
  for (const cfgFile of configs) {
    const tc = readTsConfigChain(repo, cfgFile);
    if (!tc) continue;
    if (tc.baseUrlAbs) baseUrls.push(tc.baseUrlAbs);
    for (const [pattern, targets] of Object.entries(tc.paths || {})) {
      if (!Array.isArray(targets)) continue;
      aliases.push(makeAlias(pattern, targets, tc.pathsBaseAbs || path.dirname(cfgFile)));
    }
  }

  // package.json: subpath `imports` (#alias/*) and workspace package names.
  for (const pkgFile of allFiles.filter((f) => path.basename(f) === 'package.json')) {
    const pkg = parseJsonc(read(pkgFile));
    if (!pkg) continue;
    const dir = path.dirname(pkgFile);
    for (const [pattern, target] of Object.entries(pkg.imports || {})) {
      const t = typeof target === 'string'
        ? target
        : (target && (target.default || target.import || target.require));
      if (typeof t === 'string') aliases.push(makeAlias(pattern, [t], dir));
    }
    // A workspace package: `@org/e2e-dsl` -> that package's directory.
    if (pkg.name && dir !== repo) {
      aliases.push(makeAlias(pkg.name + '/*', ['*'], dir));
      aliases.push(makeAlias(pkg.name, [pkg.main || 'index'], dir));
    }
  }

  return { aliases, baseUrls: [...new Set(baseUrls)] };
}

// Turn a bare path (no extension) into a real file, honouring TS's habit of
// writing `./helpers.js` when it means `helpers.ts`.
function resolveToFile(base) {
  // An import may already name a real file with a non-source extension
  // (`./test-data/user.json`). Try the literal path FIRST so data imports resolve
  // instead of silently disappearing.
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  const stripped = base.replace(/\.(m|c)?(ts|js)x?$/, '');
  const cands = [];
  for (const ext of SOURCE_EXTS) cands.push(stripped + ext);
  for (const ext of SOURCE_EXTS) cands.push(path.join(stripped, 'index' + ext));
  for (const ext of DATA_EXTS) cands.push(stripped + ext);
  return cands.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

const isData = (f) => DATA_EXTS.includes(path.extname(f).toLowerCase());

function resolveSpec(spec, fromFile, ctx) {
  if (spec.startsWith('.')) {
    return resolveToFile(path.resolve(path.dirname(fromFile), spec));
  }

  for (const a of ctx.aliases) {
    let tail = null;
    if (a.exact) {
      if (spec === a.prefix) tail = '';
    } else if (spec.startsWith(a.prefix) && spec.endsWith(a.suffix)
               && spec.length >= a.prefix.length + a.suffix.length) {
      tail = spec.slice(a.prefix.length, spec.length - a.suffix.length);
    }
    if (tail === null) continue;

    for (const t of a.targets) {
      const base = t.hasStar ? path.join(t.abs.replace(/\*/g, ''), tail) : t.abs;
      const hit = resolveToFile(base);
      if (hit) return hit;
    }
  }

  for (const baseUrl of ctx.baseUrls) {
    const hit = resolveToFile(path.join(baseUrl, spec));
    if (hit) return hit;
  }
  return null;
}

// Follow imports/requires from a file (used to reach DSL/constants that live
// outside the invocation globs, e.g. a shared page-object folder). Returns both
// what resolved and what didn't, so discovery can warn about the gaps.
function localImports(file, src, ctx) {
  const specs = new Set();
  for (const m of src.matchAll(/\bfrom\s+["']([^"']+)["']/g)) specs.add(m[1]);
  for (const m of src.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);
  for (const m of src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);

  const resolved = [];
  const unresolved = [];
  for (const spec of specs) {
    const hit = resolveSpec(spec, file, ctx);
    if (hit) resolved.push(hit);
    else if (!spec.startsWith('.') && !ctx.deps.has(pkgNameOf(spec)) && !isBuiltin(spec)) {
      unresolved.push(spec); // not relative, not a declared dependency -> suspicious
    }
  }
  return { resolved, unresolved };
}

function pkgNameOf(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

// Ask Node what its builtins are rather than keeping a list that silently rots:
// a missing name (net, dns, worker_threads, http2, ...) produces a bogus
// "unresolved import" warning, which is precisely the warning you need to trust.
const BUILTIN_MODULES = new Set(require('module').builtinModules || []);

function isBuiltin(spec) {
  if (spec.startsWith('node:')) return true;
  return BUILTIN_MODULES.has(spec.split('/')[0]);
}

// ---------------------------------------------------------------------------
// Step 3: discovery orchestration.
// ---------------------------------------------------------------------------

function declaredDeps(repo) {
  const pkg = parseJsonc(read(path.join(repo, 'package.json'))) || {};
  return new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);
}

function discover(repo) {
  const allFiles = walk(repo);
  const featureFiles = allFiles.filter((f) => f.endsWith('.feature')).sort();
  const warnings = [];

  const { aliases, baseUrls } = loadAliases(repo, allFiles);
  const ctx = { repo, aliases, baseUrls, deps: declaredDeps(repo) };

  // Resolve invocation code-globs (--require/--import) -> candidate source files.
  const globs = invocationCodeGlobs(repo);
  const invocationFiles = new Set();
  let deadGlobs = 0;
  for (const t of globs) {
    const hits = resolveToken(repo, t, allFiles).filter(isSource);
    if (!hits.length) {
      if (!looksLikeRepoPath(repo, t)) continue; // a transpiler/module hook
      deadGlobs++;
      warnings.push(`--require/--import glob matched no files: "${t}"`);
    }
    for (const f of hits) invocationFiles.add(f);
  }

  const buckets = { step: [], world: [], support: [], constant: [], dsl: [], fixture: [] };
  const seen = new Set();
  const isCucumberConfig = (f) => CUCUMBER_CONFIG_RE.test(path.basename(f));
  const addFile = (f) => {
    if (seen.has(f) || isCucumberConfig(f)) return;
    // Data imports (JSON/YAML/XML/CSV fixtures) carry values a step body reads
    // directly; they get their own bucket rather than being dropped for not
    // having a source extension.
    if (isData(f)) { seen.add(f); buckets.fixture.push(f); return; }
    if (!isSource(f)) return;
    seen.add(f);
    buckets[classify(f, read(f), repo)].push(f);
  };

  // Seed from the invocation globs, widening to a repo-wide scan for files that
  // import @cucumber/cucumber ONLY when the invocation looks incomplete: no globs
  // at all, a glob we couldn't resolve, or globs that yielded no step bindings.
  //
  // Widening unconditionally is tempting but wrong: a repo may deliberately
  // exclude an alternative support dir (a legacy selenium World, a second
  // profile) from its primary run, and hoovering those up would put two rival
  // Worlds in the prompt. Only widen when we have evidence something is missing.
  const hasBindings = (files) =>
    files.some((f) => /\b(Given|When|Then)\s*\(/.test(read(f)));
  const seeds = new Set(invocationFiles);
  if (!globs.length || deadGlobs > 0 || !hasBindings([...invocationFiles])) {
    for (const f of allFiles) {
      if (isSource(f) && /@cucumber\/cucumber/.test(read(f))) seeds.add(f);
    }
  }
  seeds.forEach(addFile);

  // Follow imports from steps/world/support/dsl to reach shared page objects.
  const unresolvedSpecs = new Map(); // spec -> importing file
  const followFrom = () => [...buckets.step, ...buckets.world, ...buckets.support, ...buckets.dsl];
  for (let depth = 0; depth < 5; depth++) {
    const frontier = followFrom();
    let grew = false;
    for (const f of frontier) {
      const { resolved, unresolved } = localImports(f, read(f), ctx);
      for (const imp of resolved) {
        if (!seen.has(imp)) { addFile(imp); grew = true; }
      }
      for (const spec of unresolved) {
        if (!unresolvedSpecs.has(spec)) unresolvedSpecs.set(spec, f);
      }
    }
    if (!grew) break;
  }

  // Constants fallback: surface constant-ish files that nothing imports YET but
  // a new step might need (imported ones already arrived above). Scope it to the
  // top-level directories that actually contain test code — NEVER the repo root,
  // or a root-level layout (features/ + step-definitions/ as siblings) would drag
  // in every app config in the project, secrets included.
  const testTopDirs = new Set();
  for (const f of [...featureFiles, ...followFrom()]) {
    const r = rel(repo, f);
    if (!r.includes('/')) continue; // a file sitting at the repo root: no dir to claim
    testTopDirs.add(path.join(repo, r.split('/')[0]));
  }
  for (const dir of testTopDirs) {
    for (const f of walk(dir)) {
      if (seen.has(f) || !isSource(f)) continue;
      const name = path.basename(f).toLowerCase();
      if (/(^|[.\-_])(constants?|config)([.\-_]|$)/.test(name)) addFile(f);
    }
  }

  // Discovery confidence. An empty DSL catalog makes the prompt unusable (the
  // template tells the model to call ONLY what the catalog lists), so say so
  // loudly rather than emitting a confidently-empty prompt.
  if (!buckets.step.length) {
    warnings.push('No step-definition files found — is this a cucumber-js repo?');
  }
  if (!buckets.dsl.length) {
    warnings.push('DSL CATALOG is EMPTY: no page-object/helper layer was reached. '
      + 'The generated prompt will force the model to emit only // UNMAPPED.');
  }
  for (const [spec, from] of unresolvedSpecs) {
    warnings.push(`Unresolved import "${spec}" in ${rel(repo, from)} — `
      + 'not relative, not a declared dependency, and no tsconfig path matched. '
      + 'Any DSL behind it is MISSING from the catalog.');
  }
  // A DSL file whose public surface we could not read is in the catalog as raw
  // text but contributes nothing to the index the model is told is the closed
  // set — the most common silent cause of a thin prompt.
  for (const f of buckets.dsl) {
    if (!extractSignatures(read(f)).length) {
      warnings.push(`No callable surface extracted from DSL file ${rel(repo, f)} — `
        + 'it is included as source but absent from the PUBLIC SURFACE INDEX.');
    }
  }

  return {
    repo,
    featureFiles,
    stepFiles: buckets.step.sort(),
    worldFiles: buckets.world.sort(),
    supportFiles: buckets.support.sort(),
    constantFiles: buckets.constant.sort(),
    dslFiles: buckets.dsl.sort(),
    fixtureFiles: buckets.fixture.sort(),
    // Everything a step may legitimately reach. Used to decide, by provenance,
    // which observed calls are DSL calls rather than assertion/stdlib noise.
    dslReachable: new Set([
      ...buckets.dsl, ...buckets.world, ...buckets.support,
      ...buckets.constant, ...buckets.fixture,
    ]),
    ctx,
    warnings,
  };
}


// ---------------------------------------------------------------------------
// Step 4: extraction helpers for building the prompt sections.
// ---------------------------------------------------------------------------

const JS_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'await',
  'typeof', 'new', 'do', 'else', 'try', 'finally', 'super', 'constructor',
  'with', 'yield', 'case', 'default', 'in', 'of', 'instanceof',
]);

// ---- source-scanning primitives (string/regex/comment-aware) ----------------

function skipString(src, i) {
  const quote = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === '\\') { j++; continue; }
    if (src[j] === quote) return j;
  }
  return src.length - 1;
}

function skipRegexLiteral(src, i) {
  let inClass = false;
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') { j++; continue; }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) return j;
    else if (c === '\n') return j; // unterminated: bail on newline
  }
  return src.length - 1;
}

function prevNonSpace(src, i) {
  while (i >= 0 && /\s/.test(src[i])) i--;
  return i >= 0 ? src[i] : '';
}

// Index of the delimiter that closes the one at `open`, skipping strings.
function matchDelim(src, open, o, c) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') { i = skipString(src, i); continue; }
    if (ch === o) depth++;
    else if (ch === c) { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// Match a `(` accounting for strings, comments, and regex literals (a step
// pattern is a regex literal whose `(` groups must not be counted as call parens).
function matchParen(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(src, i); continue; }
    if (c === '/' && src[i + 1] === '/') { const nl = src.indexOf('\n', i); if (nl < 0) return -1; i = nl; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) return -1; i = e + 1; continue; }
    if (c === '/') {
      const p = prevNonSpace(src, i - 1);
      if (p === '' || '(,=:[!&|?{;'.includes(p)) { i = skipRegexLiteral(src, i); continue; }
    }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// cucumber sees the string literal's VALUE, not its source text. `'a \\d b'` is
// the four characters `a \d b`; comparing against the raw source would treat the
// doubled backslash as two characters and fail to match.
function decodeJsString(raw) {
  return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, esc) => {
    switch (esc[0]) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'v': return '\v';
      case 'x': return String.fromCharCode(parseInt(esc.slice(1), 16));
      case 'u': return esc[1] === '{'
        ? String.fromCodePoint(parseInt(esc.slice(2, -1), 16))
        : String.fromCharCode(parseInt(esc.slice(1), 16));
      default: return esc; // \\ -> \ ,  \' -> ' ,  \. -> .
    }
  });
}

// The first argument of a Given/When/Then call: a string or a regex literal.
function firstArg(argsSrc) {
  let i = 0;
  while (i < argsSrc.length && /\s/.test(argsSrc[i])) i++;
  const c = argsSrc[i];
  if (c === '"' || c === "'" || c === '`') {
    return { pattern: decodeJsString(argsSrc.slice(i + 1, skipString(argsSrc, i))), isRegex: false };
  }
  // A regex literal's source IS its pattern — no JS-string decoding here.
  if (c === '/') return { pattern: argsSrc.slice(i + 1, skipRegexLiteral(argsSrc, i)), isRegex: true };
  return { pattern: '', isRegex: false };
}

// Parse a step-definitions source into individual binding blocks so we can hold
// out, index, or count them without disturbing the surrounding file.
function parseBindings(src) {
  const bindings = [];
  const re = /\b(Given|When|Then|defineStep)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const openParen = re.lastIndex - 1;
    const close = matchParen(src, openParen);
    if (close === -1) continue;
    let end = close + 1;
    while (end < src.length && /[ \t]/.test(src[end])) end++;
    if (src[end] === ';') end++;
    const { pattern, isRegex } = firstArg(src.slice(openParen + 1, close));
    bindings.push({ start: m.index, end, keyword: m[1], pattern, isRegex });
    re.lastIndex = end;
  }
  return bindings;
}

// ---- Step matching, the way cucumber does it -------------------------------
// A binding implements a target step iff its pattern MATCHES the step text.
// A regex binding is tested as the regex it literally is; a Cucumber Expression
// is compiled to the regex cucumber would compile it to. There is no
// approximation here: an earlier "skeleton" heuristic (collapse both sides to a
// shape and compare strings) silently failed on capture groups, character
// classes, escaped dots, literal numbers and alternation, and every such failure
// left the target binding sitting in the prompt — i.e. leaked the answer.

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Built-in Cucumber Expression parameter types.
const BUILTIN_PARAM_SOURCES = {
  '': '.*',
  any: '.*',
  int: '-?\\d+',
  biginteger: '-?\\d+',
  byte: '-?\\d+',
  short: '-?\\d+',
  long: '-?\\d+',
  float: '-?\\d*\\.?\\d+',
  double: '-?\\d*\\.?\\d+',
  bigdecimal: '-?\\d*\\.?\\d+',
  word: '[^\\s]+',
  string: '"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|\'(?:[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*)\'',
};

// Custom types registered with defineParameterType. Their regexp is what makes
// `{role}` matchable; without it we cannot tell whether a binding covers a step.
function collectParameterTypes(files) {
  const types = new Map();
  for (const f of files) {
    for (const m of read(f).matchAll(/defineParameterType\s*\(\s*\{([\s\S]*?)\}\s*\)/g)) {
      const body = m[1];
      const name = (body.match(/name\s*:\s*['"`]([^'"`]+)['"`]/) || [])[1];
      if (!name) continue;
      const raw = (body.match(
        /regexp\s*:\s*(\/(?:\\.|[^/\\\n])+\/[a-z]*|\[[\s\S]*?\]|['"`](?:\\.|[^'"`])*['"`])/,
      ) || [])[1];
      types.set(name, { file: f, raw: raw ? raw.trim() : null, source: regexpSourceOf(raw) });
    }
  }
  return types;
}

// `/a/i` | `'a'` | `[/a/, /b/]`  ->  a regex SOURCE string.
function regexpSourceOf(raw) {
  if (!raw) return null;
  const t = raw.trim();
  const lit = /^\/((?:\\.|[^/\\\n])+)\/[a-z]*$/.exec(t);
  if (lit) return lit[1];
  const str = /^['"`]([\s\S]*)['"`]$/.exec(t);
  if (str) return str[1];
  if (t.startsWith('[')) {
    const parts = [];
    for (const m of t.matchAll(/\/((?:\\.|[^/\\\n])+)\/[a-z]*|['"`]([\s\S]*?)['"`]/g)) {
      parts.push(m[1] !== undefined ? m[1] : m[2]);
    }
    if (parts.length) return '(?:' + parts.join('|') + ')';
  }
  return null;
}

function paramSourceFor(name, paramTypes, unknown) {
  if (Object.prototype.hasOwnProperty.call(BUILTIN_PARAM_SOURCES, name)) {
    return '(?:' + BUILTIN_PARAM_SOURCES[name] + ')';
  }
  const custom = paramTypes && paramTypes.get(name);
  if (custom && custom.source) return '(?:' + custom.source + ')';
  // Unknown type: match permissively. Over-matching costs us one extra held-out
  // binding; under-matching would leak the answer, so bias toward matching.
  if (unknown) unknown.add(name);
  return '(?:.*)';
}

function tokenizeExpression(expr) {
  const tokens = [];
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '\\') { const n = expr[++i]; tokens.push({ t: 'text', v: n === undefined ? '\\' : n }); continue; }
    if (c === '{') {
      const j = expr.indexOf('}', i);
      if (j === -1) { tokens.push({ t: 'text', v: c }); continue; }
      tokens.push({ t: 'param', v: expr.slice(i + 1, j) });
      i = j; continue;
    }
    if (c === '(') { tokens.push({ t: 'open' }); continue; }
    if (c === ')') { tokens.push({ t: 'close' }); continue; }
    if (c === '/') { tokens.push({ t: 'alt' }); continue; }
    if (/\s/.test(c)) { tokens.push({ t: 'ws', v: c }); continue; }
    tokens.push({ t: 'text', v: c });
  }
  return tokens;
}

function renderSeq(tokens, paramTypes, unknown) {
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t === 'text' || tk.t === 'ws') { out += escapeRe(tk.v); continue; }
    if (tk.t === 'param') { out += '(' + paramSourceFor(tk.v, paramTypes, unknown) + ')'; continue; }
    if (tk.t === 'open') {
      let depth = 1, j = i + 1;
      for (; j < tokens.length; j++) {
        if (tokens[j].t === 'open') depth++;
        else if (tokens[j].t === 'close') { depth--; if (!depth) break; }
      }
      if (j >= tokens.length) { out += '\\('; continue; } // unbalanced: literal
      out += '(?:' + renderAlternatives(tokens.slice(i + 1, j), paramTypes, unknown) + ')?';
      i = j; continue;
    }
    if (tk.t === 'close') { out += '\\)'; continue; }
    if (tk.t === 'alt') { out += '/'; continue; }
  }
  return out;
}

// Alternation binds to the whitespace-delimited word, so `I have a cat/dog` is
// `I have a (cat|dog)`, not `I have (a cat|dog)`. Expanding alternation (rather
// than collapsing it to a hole, as the old skeleton did) is what makes an
// alternation binding matchable against its own step text at all.
function renderAlternatives(tokens, paramTypes, unknown) {
  const parts = [];
  let cur = [], depth = 0;
  for (const tk of tokens) {
    if (tk.t === 'open') depth++;
    else if (tk.t === 'close') depth--;
    if (tk.t === 'ws' && depth === 0) { parts.push({ seg: cur }); parts.push({ ws: tk.v }); cur = []; }
    else cur.push(tk);
  }
  parts.push({ seg: cur });

  let out = '';
  for (const p of parts) {
    if (p.ws !== undefined) { out += escapeRe(p.ws); continue; }
    const alts = [];
    let a = [], d = 0, hasAlt = false;
    for (const tk of p.seg) {
      if (tk.t === 'open') d++;
      else if (tk.t === 'close') d--;
      if (tk.t === 'alt' && d === 0) { alts.push(a); a = []; hasAlt = true; }
      else a.push(tk);
    }
    alts.push(a);
    out += hasAlt
      ? '(?:' + alts.map((x) => renderSeq(x, paramTypes, unknown)).join('|') + ')'
      : renderSeq(p.seg, paramTypes, unknown);
  }
  return out;
}

const _patternCache = new Map();
function compileStepPattern(pattern, isRegex, paramTypes, unknown) {
  const key = (isRegex ? 'r:' : 'e:') + pattern;
  if (_patternCache.has(key)) {
    const hit = _patternCache.get(key);
    if (hit instanceof Error) throw hit;
    return hit;
  }
  let re;
  try {
    // cucumber applies a regex binding unanchored, and anchors an expression.
    re = isRegex
      ? new RegExp(pattern)
      : new RegExp('^' + renderAlternatives(tokenizeExpression(pattern), paramTypes, unknown) + '$');
  } catch (err) {
    _patternCache.set(key, err);
    throw err;
  }
  _patternCache.set(key, re);
  return re;
}

// True iff this binding is the one cucumber would run for any of these steps.
function bindingMatchesAny(binding, targetSteps, paramTypes, problems) {
  if (!targetSteps.length) return false;
  let re;
  try {
    re = compileStepPattern(binding.pattern, binding.isRegex, paramTypes, problems && problems.unknownParams);
  } catch {
    // An uncompilable pattern cannot be proven safe, so surface it rather than
    // quietly treating it as "does not match" (which would leak it).
    if (problems) problems.uncompilable.add(binding.isRegex ? `/${binding.pattern}/` : `'${binding.pattern}'`);
    return false;
  }
  return targetSteps.some((s) => re.test(s));
}

// ---- Gherkin: the concrete step texts cucumber will try to match -----------
// Scenario Outline placeholders are substituted from the Examples table BEFORE
// matching (exactly as the runner does), because `{int}` never matches the
// literal token `<count>` — leaving them unsubstituted leaks every outline step
// whose placeholder is not quoted.

function splitTableRow(line) {
  const cells = [];
  let cur = '';
  for (let i = line.indexOf('|') + 1; i < line.length; i++) {
    const c = line[i];
    if (c === '\\') { cur += line[++i] || ''; continue; }
    if (c === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  return cells;
}

function extractTargetSteps(gherkin) {
  const out = [];
  let block = { steps: [], rows: [], isOutline: false };
  let inDoc = false, fence = null, inExamples = false, header = null;

  const flush = () => {
    if (block.steps.length) {
      out.push(...block.steps); // raw form, in case Examples are absent/partial
      if (block.isOutline && block.rows.length) {
        for (const row of block.rows) {
          for (const s of block.steps) {
            out.push(s.replace(/<([^>]+)>/g, (m, k) => (k in row ? row[k] : m)));
          }
        }
      }
    }
    block = { steps: [], rows: [], isOutline: false };
  };

  for (const raw of gherkin.split(/\r?\n/)) {
    const line = raw.trim();
    if (inDoc) { if (line === fence) inDoc = false; continue; }
    if (line === '"""' || line === '```') { inDoc = true; fence = line; continue; }
    if (!line || line.startsWith('#') || line.startsWith('@')) continue;

    if (/^(Scenario Outline|Scenario Template):/i.test(line)) {
      flush(); block.isOutline = true; inExamples = false; continue;
    }
    if (/^(Feature|Rule|Background|Scenario|Example):/i.test(line)) {
      flush(); inExamples = false; continue;
    }
    if (/^(Examples|Scenarios):/i.test(line)) { inExamples = true; header = null; continue; }
    if (inExamples && line.startsWith('|')) {
      const cells = splitTableRow(line);
      if (!header) header = cells;
      else block.rows.push(Object.fromEntries(header.map((h, i) => [h, cells[i] === undefined ? '' : cells[i]])));
      continue;
    }
    if (line.startsWith('|')) continue; // a step's data table, not a step

    const m = /^(Given|When|Then|And|But|\*)\s+(.*\S)\s*$/.exec(line);
    if (m) { block.steps.push(m[2]); inExamples = false; }
  }
  flush();
  return [...new Set(out)];
}

// Best-effort public-surface index for a DSL/page-object/helper file. Methods
// are qualified with their class so the model sees `LoginPage#login`, not a bare
// `login()` it cannot reach.
// A class member, matched from the start of a member declaration. Covers
// modifiers, get/set, async, private `#name`, methods AND arrow-function
// properties (`open = async (u) => {}`), which page objects use constantly.
// Anchored at BOTH ends: it is tested against exactly the text from the member
// start up to and including its opening paren, so there is no scan window to
// overflow. A fixed lookahead budget silently dropped any member whose modifiers,
// generics or return type ran long — and the file still parsed, so the
// "no callable surface" warning would not fire either.
const MEMBER_RE = /^(?:(?:public|private|protected|readonly|static|abstract|override|declare)\s+)*(?:(get|set)\s+)?(async\s+)?(#?[A-Za-z_$][\w$]*)\s*[?!]?\s*(=\s*(async\s+)?)?(?:<[^<>()]*>)?\s*\($/;

// Walk a class body brace-aware and pick out members at body top level.
// The previous implementation keyed on `\n\s{2,}`, so a tab-indented class
// yielded ZERO methods and a default parameter containing `)` dropped the member
// entirely — both silent holes in the DSL catalog.
function classMembers(src, open, close) {
  const out = [];
  let i = open + 1, depth = 0, atStart = true;
  while (i < close) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') { i = skipString(src, i) + 1; atStart = false; continue; }
    if (ch === '/' && src[i + 1] === '/') { const nl = src.indexOf('\n', i); i = nl < 0 ? close : nl + 1; continue; }
    if (ch === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? close : e + 2; continue; }
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '@') { // decorator: skip it, the member still follows
      const dm = /^@[\w$.]+/.exec(src.slice(i));
      i += dm ? dm[0].length : 1;
      while (i < close && /\s/.test(src[i])) i++;
      if (src[i] === '(') { const cp = matchParen(src, i); i = cp > i ? cp + 1 : i + 1; }
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') { depth++; i++; atStart = false; continue; }
    if (ch === '}' || ch === ')' || ch === ']') { depth--; i++; atStart = depth === 0; continue; }
    if (ch === ';' || ch === ',') { i++; atStart = depth === 0; continue; }
    if (depth === 0 && atStart) {
      // The declaration text is bounded by its own opening paren, not by a
      // guessed number of characters.
      const openParen = src.indexOf('(', i);
      const m = openParen > 0 && openParen < close
        ? MEMBER_RE.exec(src.slice(i, openParen + 1))
        : null;
      if (m) {
        const closeParen = matchParen(src, openParen);
        // Confirm it really is callable: `=` form must be an arrow, plain form
        // must open a body (or end a declaration). Rejects `x = (a || b);`.
        // Skips any return-type annotation, however long or multi-line.
        let k = closeParen + 1;
        while (k < close && /\s/.test(src[k])) k++;
        if (src[k] === ':') {
          while (k < close && !(src[k] === '{' || src[k] === ';'
            || (src[k] === '=' && src[k + 1] === '>'))) k++;
        }
        const ok = m[4]
          ? (src[k] === '=' && src[k + 1] === '>')
          : (src[k] === '{' || src[k] === ';');
        if (closeParen > openParen && ok) {
          out.push({
            kind: m[1] || '',
            async: !!(m[2] || m[5]),
            name: m[3],
            args: src.slice(openParen + 1, closeParen),
          });
          i = closeParen + 1; atStart = false; continue;
        }
      }
      atStart = false;
    }
    i++;
  }
  return out;
}

function extractSignatures(src) {
  const sigs = new Set();
  const push = (kw, name, args, owner) => {
    if (!name || JS_KEYWORDS.has(name)) return;
    sigs.add(`${owner ? owner + '#' : ''}${kw}${name}(${(args || '').replace(/\s+/g, ' ').trim()})`);
  };

  for (const m of src.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) {
    const brace = src.indexOf('{', m.index);
    if (brace < 0) continue;
    const end = matchDelim(src, brace, '{', '}');
    if (end <= brace) continue;
    for (const mem of classMembers(src, brace, end)) {
      push((mem.kind ? mem.kind + ' ' : '') + (mem.async ? 'async ' : ''), mem.name, mem.args, m[1]);
    }
  }

  // Top-level function declarations (exported or not). Parameter lists are read
  // with the paren matcher, so defaults containing `)` and multi-line signatures
  // survive.
  for (const m of src.matchAll(
    /(?:^|[\n;})])\s*(?:export\s+(?:default\s+)?)?(async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*(?:<[^<>()]*>)?\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = matchParen(src, open);
    if (close > open) push(m[1] ? 'async ' : '', m[2], src.slice(open + 1, close));
  }
  // Top-level arrow consts.
  for (const m of src.matchAll(
    /(?:^|[\n;})])\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*(async\s+)?(?:<[^<>()]*>)?\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = matchParen(src, open);
    if (close > open && /^\s*(?::[^=>{\n]*)?=>/.test(src.slice(close + 1))) {
      push(m[2] ? 'async ' : '', m[1], src.slice(open + 1, close));
    }
  }
  return [...sigs];
}

function fenceFile(repo, file, body) {
  return `// ---- ${rel(repo, file)} ----\n${body.trimEnd()}\n`;
}

function sectionFromFiles(repo, files, { withIndex = false } = {}) {
  if (!files.length) return '// (none discovered in this repo)';
  const parts = [];
  if (withIndex) {
    const idx = [];
    for (const f of files) {
      const sigs = extractSignatures(read(f));
      if (sigs.length) idx.push(`// ${rel(repo, f)}\n` + sigs.map((s) => `//   - ${s}`).join('\n'));
    }
    if (idx.length) parts.push('// ===== PUBLIC SURFACE INDEX (auto-extracted) =====\n' + idx.join('\n') + '\n');
  }
  for (const f of files) parts.push(fenceFile(repo, f, read(f)));
  return parts.join('\n');
}

// Remove, from each step file, the bindings that IMPLEMENT the target scenario,
// matched by expression skeleton. Returns per-file cleaned source plus the
// removed blocks (the ground truth the model must reproduce). This is what keeps
// the answer out of the prompt no matter which file or name it lives under.
// ---- residue pruning ------------------------------------------------------
// Cutting out the binding blocks is not hold-out on its own. What the target's
// bindings ALONE depended on stays behind in their file, and it is answer-shaped:
//   - file-local helpers that were the bindings' body logic factored out, so the
//     held-out answer reduces to a one-line wrapper around a helper the prompt
//     hands over verbatim;
//   - the import list, which announces exactly which 3 of 20 catalog files the
//     answer needs.
// So after removal we do dead-code elimination: any top-level declaration no
// longer reachable from surviving code goes too.

// Bracket depth at every offset, string/comment/regex aware. Used to tell a
// top-level declaration from an identical-looking line inside a function body.
function depthMap(src) {
  const depth = new Int32Array(src.length + 1);
  let d = 0;
  const fill = (from, to) => { for (let k = from; k <= to && k < src.length; k++) depth[k] = d; };
  for (let i = 0; i < src.length; i++) {
    depth[i] = d;
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { const e = skipString(src, i); fill(i, e); i = e; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i); const e = nl < 0 ? src.length - 1 : nl; fill(i, e); i = e; continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e0 = src.indexOf('*/', i + 2); const e = e0 < 0 ? src.length - 1 : e0 + 1; fill(i, e); i = e; continue;
    }
    if (c === '/') {
      const p = prevNonSpace(src, i - 1);
      if (p === '' || '(,=:[!&|?{;'.includes(p)) { const e = skipRegexLiteral(src, i); fill(i, e); i = e; continue; }
    }
    if (c === '{' || c === '(' || c === '[') { d++; continue; }
    if (c === '}' || c === ')' || c === ']') { d--; depth[i] = d; continue; }
  }
  depth[src.length] = d;
  return depth;
}

function isBalanced(text) {
  let d = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(text, i); continue; }
    if ('{(['.includes(c)) d++;
    else if ('})]'.includes(c)) { d--; if (d < 0) return false; }
  }
  return d === 0;
}

function collectTopLevelDecls(src) {
  const depth = depthMap(src);
  const decls = [];
  const add = (start, end, names, keep) => {
    if (end <= start || depth[start] !== 0) return;
    if (decls.some((d) => start < d.end && end > d.start)) return; // overlaps an earlier decl
    decls.push({ start, end, names: names.filter(Boolean), keep, text: src.slice(start, end) });
  };

  // import ... from '...'   |   import '...'  (side-effect: always kept)
  for (const m of src.matchAll(/^[ \t]*import\s+(?:([\s\S]*?)\s+from\s*)?['"][^'"\n]+['"][ \t]*;?/gm)) {
    const names = m[1] ? importedNames(m[1]) : [];
    add(m.index, m.index + m[0].length, names, names.length === 0);
  }
  // const X = require('...')
  for (const m of src.matchAll(
    /^[ \t]*(?:const|let|var)\s+(\{[^}]*\}|[A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"][^'"\n]+['"]\s*\)[ \t]*;?/gm)) {
    add(m.index, m.index + m[0].length, importedNames(m[1]), false);
  }
  // function declarations (span includes the body)
  for (const m of src.matchAll(
    /^[ \t]*(export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*(?:<[^<>()]*>)?\s*\(/gm)) {
    const open = m.index + m[0].length - 1;
    const cp = matchParen(src, open);
    if (cp < 0) continue;
    const brace = src.indexOf('{', cp);
    if (brace < 0) continue;
    const endBrace = matchDelim(src, brace, '{', '}');
    if (endBrace < 0) continue;
    add(m.index, endBrace + 1, [m[2]], !!m[1]); // exported: part of the module contract
  }
  // class declarations
  for (const m of src.matchAll(/^[ \t]*(export\s+(?:default\s+)?)?class\s+([A-Za-z_$][\w$]*)/gm)) {
    const brace = src.indexOf('{', m.index);
    if (brace < 0) continue;
    const endBrace = matchDelim(src, brace, '{', '}');
    if (endBrace < 0) continue;
    add(m.index, endBrace + 1, [m[2]], !!m[1]);
  }
  // single-line const/let/var (`let registerPage: RegisterPage;`)
  for (const m of src.matchAll(/^[ \t]*(export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)[^\n]*$/gm)) {
    if (/=\s*require\(/.test(m[0]) || !isBalanced(m[0])) continue;
    add(m.index, m.index + m[0].length, [m[2]], !!m[1]);
  }
  return decls.sort((a, b) => a.start - b.start);
}

function pruneResidue(src) {
  const decls = collectTopLevelDecls(src);
  if (!decls.length) return { text: src, removed: [] };

  // Everything that is NOT a declaration: surviving bindings, hooks, statements.
  let rootLive = '', cursor = 0;
  for (const d of decls) { rootLive += src.slice(cursor, d.start); cursor = Math.max(cursor, d.end); }
  rootLive += src.slice(cursor);

  const uses = (text, name) => new RegExp(`(?<![.\\w$])${escapeRe(name)}\\b`).test(text);
  const live = new Set(decls.filter((d) => d.keep));
  for (let grew = true; grew;) {
    grew = false;
    for (const d of decls) {
      if (live.has(d)) continue;
      const referenced = d.names.some((n) =>
        uses(rootLive, n) || [...live].some((l) => uses(l.text, n)));
      if (referenced) { live.add(d); grew = true; }
    }
  }

  let out = src;
  const removed = [];
  for (const d of decls.slice().reverse()) {
    if (live.has(d)) continue;
    removed.push(...(d.names.length ? d.names : ['<side-effect>']));
    out = out.slice(0, d.start) + out.slice(d.end);
  }
  return { text: out, removed };
}

function applyHoldout(stepFiles, targetSteps, paramTypes, problems, { prune = true } = {}) {
  const perFile = new Map();
  const removed = [];
  for (const f of stepFiles) {
    const src = read(f);
    const targets = parseBindings(src)
      .filter((b) => bindingMatchesAny(b, targetSteps, paramTypes, problems));
    let cleaned = src;
    for (const b of targets.slice().sort((a, z) => z.start - a.start)) {
      removed.push({ file: f, text: src.slice(b.start, b.end) });
      cleaned = cleaned.slice(0, b.start) + cleaned.slice(b.end);
    }
    // Also strip COMMENTED-OUT copies of a target binding — a repo that left an
    // old version behind would otherwise leak the answer as a comment.
    cleaned = stripCommentedTargets(cleaned, targetSteps, paramTypes, problems);
    if (targets.length && prune) {
      const pruned = pruneResidue(cleaned);
      cleaned = pruned.text;
      if (pruned.removed.length && problems) {
        problems.pruned.push({ file: f, names: pruned.removed });
      }
    }
    perFile.set(f, cleaned.replace(/\n{3,}/g, '\n\n'));
  }
  return { perFile, removed };
}

// Drop commented-out copies of a target binding, in BOTH comment styles. A repo
// that left an old version behind as `/* ... */` would otherwise hand over the
// answer verbatim.
function stripCommentedTargets(src, targetSteps, paramTypes, problems) {
  if (!targetSteps.length) return src;
  const hasTarget = (code) =>
    parseBindings(code).some((b) => bindingMatchesAny(b, targetSteps, paramTypes, problems));

  let out = src;

  // (a) /* ... */ blocks, innermost-last so indices stay valid.
  if (/\/\*/.test(out)) {
    const spans = [];
    for (let i = 0; i < out.length; i++) {
      const c = out[i];
      if (c === '"' || c === "'" || c === '`') { i = skipString(out, i); continue; }
      if (c === '/' && out[i + 1] === '/') { const nl = out.indexOf('\n', i); if (nl < 0) break; i = nl; continue; }
      if (c === '/' && out[i + 1] === '*') {
        const end = out.indexOf('*/', i + 2);
        if (end < 0) break;
        spans.push([i, end + 2]);
        i = end + 1;
      }
    }
    for (const [s, e] of spans.reverse()) {
      const body = out.slice(s + 2, e - 2).replace(/^[ \t]*\*[ \t]?/gm, '');
      if (hasTarget(body)) out = out.slice(0, s) + out.slice(e);
    }
  }

  // (b) runs of `//` line comments.
  if (/\/\/\s*(Given|When|Then|defineStep)\s*\(/.test(out)) {
    const lines = out.split('\n');
    const keep = new Array(lines.length).fill(true);
    for (let i = 0; i < lines.length;) {
      if (!/^\s*\/\//.test(lines[i])) { i++; continue; }
      // A comment block may contain blank lines, as long as it resumes with `//`
      // (commented-out code frequently keeps its internal blank lines).
      let j = i;
      while (j < lines.length && (/^\s*\/\//.test(lines[j])
        || (lines[j].trim() === '' && j + 1 < lines.length && /^\s*\/\//.test(lines[j + 1])))) j++;
      if (hasTarget(lines.slice(i, j).map((l) => l.replace(/^\s*\/\/ ?/, '')).join('\n'))) {
        for (let k = i; k < j; k++) keep[k] = false;
      }
      i = j;
    }
    out = lines.filter((_, idx) => keep[idx]).join('\n');
  }

  return out;
}

// Complete, cheap index of every still-registered expression — the sound signal
// for "don't redefine this" (Rule 1), without pasting hundreds of bodies twice.
function registeredIndex(stepFiles, srcOf, repo) {
  const lines = [];
  for (const f of stepFiles) {
    for (const b of parseBindings(srcOf(f))) {
      const pat = b.isRegex ? `/${b.pattern}/` : `'${b.pattern}'`;
      lines.push(`${b.keyword}(${pat})`.padEnd(60) + `// ${rel(repo, f)}`);
    }
  }
  if (!lines.length) return '// (no steps currently registered)';
  return `// ${lines.length} step bindings already registered — do NOT redefine any of these:\n`
    + [...new Set(lines)].join('\n');
}

// Mine the actual call shapes existing steps use to reach the DSL, so the model
// sees `this.pageObjects.appPo.homePage(...)` / `new SamplePage().launch(...)`,
// not a bare `homePage()` it has no way to reach.
// Names in this file that provably refer to the discovered test layer. Deciding
// by PROVENANCE replaces a hardcoded denylist of noisy globals: such a list can
// never be complete — Buffer, Date, chai, lodash, test.step and describe.each all
// walked straight through the old one and were presented to the model as DSL.
function importedNames(clause) {
  const out = [];
  const c = clause.replace(/\btype\b/g, ' ');
  const braced = /\{([^}]*)\}/.exec(c);
  if (braced) {
    for (const part of braced[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) out.push(n);
    }
  }
  for (const m of c.replace(/\{[^}]*\}/g, ' ').matchAll(/\*\s+as\s+([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)/g)) {
    const n = m[1] || m[2];
    if (n && !['as', 'from', 'import', 'default'].includes(n)) out.push(n);
  }
  return out;
}

function dslBoundNames(file, src, ctx, reachable) {
  const names = new Set();
  const fromDsl = (spec) => {
    const hit = resolveSpec(spec, file, ctx);
    return !!hit && reachable.has(hit);
  };
  for (const m of src.matchAll(/\bimport\s+([\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g)) {
    if (fromDsl(m[2])) for (const n of importedNames(m[1])) names.add(n);
  }
  for (const m of src.matchAll(/\b(?:const|let|var)\s+(\{[^}]*\}|[\w$]+)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (fromDsl(m[2])) for (const n of importedNames(m[1])) names.add(n);
  }
  // `const { page } = this` — a World member reached through a local alias.
  for (const m of src.matchAll(/\b(?:const|let|var)\s*(\{[^}]*\})\s*=\s*this\b/g)) {
    for (const n of importedNames(m[1])) names.add(n);
  }
  // Propagate to anything that provably holds one of those values:
  //   `let p: RegisterPage`, `const p = new RegisterPage(...)`  (declarations)
  //   `function f(soap: SOAPRequest)`                            (typed parameters)
  // Run to a fixed point so a handle passed one hop further still counts.
  for (let pass = 0; pass < 3; pass++) {
    const before = names.size;
    for (const m of src.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$]*))?[^;\n=]*(?:=\s*(?:await\s+)?(?:new\s+)?([A-Za-z_$][\w$]*))?/g)) {
      const [, v, type, rhs] = m;
      if (!v || names.has(v)) continue;
      if ((type && names.has(type)) || (rhs && names.has(rhs))) names.add(v);
    }
    for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)/g)) {
      if (!names.has(m[1]) && names.has(m[2])) names.add(m[1]);
    }
    if (names.size === before) break;
  }
  return names;
}

function observedCallsBlock(stepFiles, srcOf, ctx, reachable) {
  const calls = new Set();
  for (const f of stepFiles) {
    const src = srcOf(f);
    const local = dslBoundNames(f, src, ctx, reachable);

    // Through the World — `this.page!.goto(...)`, `this.pageObjects.appPo.homePage(...)`.
    for (const m of src.matchAll(/\bthis(?:[!?]?\.[\w$]+)+(?=\s*\()/g)) calls.add(m[0] + '(…)');

    // Rooted at a name that provably came from the test layer. Covers receiverless
    // calls (`compareToBaseImage(...)`) and `new Page(...)` alike.
    for (const m of src.matchAll(
      /(?<![.\w$])(new\s+)?([A-Za-z_$][\w$]*)((?:[!?]?\.[\w$]+)*)(?=\s*\()/g)) {
      if (!local.has(m[2])) continue;
      calls.add((m[1] ? 'new ' : '') + m[2] + m[3] + '(…)');
    }

    // `new Page(...).method(...)` — show the whole reach, not just the constructor.
    for (const m of src.matchAll(/\bnew\s+([A-Z][\w$]*)\s*\(/g)) {
      if (!local.has(m[1])) continue;
      const open = m.index + m[0].length - 1;
      const close = matchParen(src, open);
      if (close < 0) continue;
      const tail = /^((?:[!?]?\.[\w$]+)+)\s*\(/.exec(src.slice(close + 1));
      if (tail) calls.add(`new ${m[1]}(…)${tail[1]}(…)`);
    }
  }
  if (!calls.size) return '// (no DSL call patterns observed in existing steps)';
  return '// HOW EXISTING STEPS REACH THE DSL (observed call shapes — mirror these):\n'
    + [...calls].sort().map((c) => '//   ' + c).join('\n');
}

// Custom Cucumber Expression parameter types (defineParameterType). Without
// these the model cannot know {role}/{mediaType} exist and falls back to
// {string} or a bare literal, silently rotting the repo's custom types.
function parameterTypesBlock(paramTypes, repo) {
  if (!paramTypes.size) {
    return '// (no custom parameter types registered — use only {string},{int},{float},{word})';
  }
  const lines = [];
  for (const [name, t] of paramTypes) {
    lines.push(`{${name}}`.padEnd(18) + `// ${rel(repo, t.file)}${t.raw ? '  regexp: ' + t.raw : ''}`);
  }
  return '// Custom parameter types you MAY use in patterns:\n' + lines.join('\n');
}

// CONSTANTS slot: symbolic constants PLUS any data file a step actually imports.
// A step body that reads `data.userName` is unreproducible without the fixture,
// and the fixture has no source extension, so it used to vanish entirely.
function constantsSection(d) {
  const parts = [];
  if (d.constantFiles.length) parts.push(sectionFromFiles(d.repo, d.constantFiles));
  for (const f of d.fixtureFiles) {
    const raw = read(f);
    const body = raw.length > MAX_FIXTURE_BYTES
      ? raw.slice(0, MAX_FIXTURE_BYTES) + `\n... truncated (${raw.length} bytes total)`
      : raw;
    parts.push(`// ---- ${rel(d.repo, f)} ----  (test data imported by a step definition)\n`
      + `${body.trimEnd()}\n`);
  }
  return parts.length ? parts.join('\n') : '// (none discovered in this repo)';
}

// ---------------------------------------------------------------------------
// Step 5: build the prompt from the template.
// ---------------------------------------------------------------------------

// The template file may carry an editorial preamble that must not ship inside
// the prompt. An explicit `<!-- PROMPT START -->` marker says where the prompt
// begins; failing that we fall back to the first top-level `# ` heading (any
// heading, not one hardcoded title) and say we guessed.
const PROMPT_START_MARKER = '<!-- PROMPT START -->';

function loadTemplate(templatePath, warnings = []) {
  const raw = read(templatePath);
  const marked = raw.indexOf(PROMPT_START_MARKER);
  if (marked >= 0) return raw.slice(marked + PROMPT_START_MARKER.length).replace(/^\r?\n/, '');

  const heading = /^# \S/m.exec(raw);
  if (heading && heading.index > 0) {
    warnings.push(`Template has no ${PROMPT_START_MARKER} marker; assumed the prompt `
      + `starts at the first top-level heading (offset ${heading.index}). `
      + 'Add the marker to make this explicit.');
    return raw.slice(heading.index);
  }
  return raw;
}

// `--gherkin-file` / `--gherkin-text` state the intent outright and involve no
// guessing. `--gherkin` is kept for compatibility and still has to infer whether
// a non-existent argument was a mistyped path or literal Gherkin.
function resolveGherkin(args) {
  if (args['gherkin-file'] && args['gherkin-file'] !== true) {
    const p = String(args['gherkin-file']);
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
      console.error(`Gherkin file not found: ${p}`);
      process.exit(1);
    }
    return read(p).trimEnd();
  }
  if (args['gherkin-text'] && args['gherkin-text'] !== true) {
    return String(args['gherkin-text']).trimEnd();
  }

  const arg = args.gherkin;
  if (!arg || arg === true) return '# <-- paste the target Gherkin scenario/feature here -->';
  if (fs.existsSync(arg) && fs.statSync(arg).isFile()) return read(arg).trimEnd();
  // A mistyped path would otherwise be embedded verbatim as the "scenario".
  const s = String(arg);
  const looksLikePath = /\.feature$/i.test(s) || (!/\s/.test(s) && /[/\\]/.test(s));
  if (looksLikePath) {
    console.error(`Gherkin file not found: ${s}`
      + ' (use --gherkin-text to pass literal Gherkin, --gherkin-file for a path)');
    process.exit(1);
  }
  return s.trimEnd();
}

function buildPrompt(d, gherkin, templatePath, { holdout = true, prune = true } = {}) {
  // Custom parameter types must be known BEFORE matching: without `{role}`'s
  // regexp we cannot tell whether a binding covers a target step.
  const paramFiles = [...d.worldFiles, ...d.supportFiles, ...d.dslFiles, ...d.stepFiles];
  const paramTypes = collectParameterTypes(paramFiles);
  const problems = { unknownParams: new Set(), uncompilable: new Set(), template: [], pruned: [] };

  // Content-based hold-out: find and remove the bindings that implement the
  // target scenario, wherever they live, so the answer is never in the prompt.
  const targetSteps = holdout ? extractTargetSteps(gherkin) : [];
  const ho = applyHoldout(d.stepFiles, targetSteps, paramTypes, problems, { prune });
  const srcOf = (f) => ho.perFile.get(f) ?? read(f);

  const worldAll = [...d.worldFiles, ...d.supportFiles];

  // Existing bodies come from the CLEANED sources (target held out). This is the
  // only place step-definition bodies appear: the old STYLE REFERENCE slot was a
  // verbatim duplicate of one of these files, and its "most bindings remaining"
  // picker had no notion of relatedness — it held up an API step file as the
  // style model for web UI scenarios.
  // A file with no bindings left is dropped outright: its remaining runner
  // boilerplate teaches nothing, while its `// ---- path ----` header still
  // points at where the answer used to live. Kept only if it exports something
  // another step file might import.
  const kept = d.stepFiles
    .map((f) => [f, srcOf(f)])
    .filter(([, src]) => src.trim().length
      && (!prune || parseBindings(src).length > 0 || /^[ \t]*export\s/m.test(src)));
  const existingBodies = kept.length
    ? kept.map(([f, src]) => fenceFile(d.repo, f, src)).join('\n')
    : '// (none discovered in this repo)';

  const values = {
    GHERKIN: gherkin,
    DSL_CATALOG: sectionFromFiles(d.repo, d.dslFiles, { withIndex: true }),
    DSL_USAGE: observedCallsBlock(d.stepFiles, srcOf, d.ctx, d.dslReachable),
    PARAMETER_TYPES: parameterTypesBlock(paramTypes, d.repo),
    REGISTERED_STEPS: registeredIndex(d.stepFiles, srcOf, d.repo),
    EXISTING_STEP_DEFS: existingBodies,
    WORLD_DEFINITION: worldAll.length
      ? sectionFromFiles(d.repo, worldAll)
      : '// No custom World was found. `this` is the default cucumber-js World.\n'
        + '// Share per-scenario state by assigning onto `this` inside a step body.',
    CONSTANTS: constantsSection(d),
  };

  let out = loadTemplate(templatePath, problems.template);
  for (const [k, v] of Object.entries(values)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return { prompt: out, heldOut: ho.removed, problems };
}

// The removed ground-truth bindings, formatted for a --truth dump / diff target.
function formatTruth(repo, heldOut) {
  if (!heldOut.length) return '';
  const byFile = new Map();
  for (const { file, text } of heldOut) {
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(text.trimEnd());
  }
  const parts = [];
  for (const [file, blocks] of byFile) {
    parts.push(`// ---- ${rel(repo, file)} ----\n` + blocks.join('\n\n'));
  }
  return parts.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

// Flags that never take a value. Everything else consumes the next token even if
// it starts with `--`, so inline Gherkin may begin with a comment or a dash.
const BOOLEAN_FLAGS = new Set(['json', 'no-holdout', 'keep-residue', 'help']);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq > 2) { args[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const key = a.slice(2);
    if (BOOLEAN_FLAGS.has(key) || i + 1 >= argv.length) { args[key] = true; continue; }
    args[key] = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.repo) {
    console.error('Usage: node prompt_builder.js --repo <path> '
      + '[--gherkin-file <f> | --gherkin-text <t> | --gherkin <file|text>] '
      + '[--out <file>] [--truth <file>] [--json] [--no-holdout] [--keep-residue]');
    process.exit(1);
  }
  const repo = path.resolve(args.repo);
  if (!fs.existsSync(repo)) {
    console.error(`Repo not found: ${repo}`);
    process.exit(1);
  }
  const templatePath = path.resolve(
    args.template || path.join(__dirname, 'new_prompt_template.md'),
  );

  const d = discover(repo);

  if (args.json) {
    const summary = Object.fromEntries(
      Object.entries(d)
        .filter(([k]) => k !== 'ctx' && k !== 'dslReachable') // internals, not JSON
        .map(([k, v]) => {
          if (k === 'warnings' || !Array.isArray(v)) return [k, v];
          return [k, v.map((f) => rel(repo, f))];
        }),
    );
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (args.out === true) { console.error('--out needs a file path.'); process.exit(1); }
  if (args.truth === true) { console.error('--truth needs a file path.'); process.exit(1); }

  const gherkin = resolveGherkin(args);
  const holdout = args['no-holdout'] !== true;
  const prune = args['keep-residue'] !== true;
  const { prompt, heldOut, problems } = buildPrompt(d, gherkin, templatePath, { holdout, prune });

  if (args.out) {
    fs.writeFileSync(args.out, prompt);
    console.error(`Wrote prompt -> ${args.out}`);
  } else {
    process.stdout.write(prompt);
  }

  // The held-out ground truth: what the model must reproduce, for your diff.
  if (heldOut.length && args.truth) {
    fs.writeFileSync(args.truth, formatTruth(repo, heldOut));
    console.error(`Wrote ${heldOut.length} held-out ground-truth binding(s) -> ${args.truth}`);
  }

  // Warnings + hold-out report go to stderr so they survive `> prompt.md`.
  if (holdout) {
    if (heldOut.length) {
      const files = [...new Set(heldOut.map((h) => rel(repo, h.file)))];
      console.error(`HELD OUT ${heldOut.length} target binding(s) from ${files.length} file(s): ${files.join(', ')}`);
    } else if (args.gherkin || args['gherkin-file'] || args['gherkin-text']) {
      console.error('HELD OUT nothing: no registered binding matched a target step '
        + '(new scenario, or the step text differs from every existing pattern).');
    }
  }
  // A pattern we could not compile was never tested against the target steps, so
  // it may be the answer sitting in the prompt. Never let that pass silently.
  for (const { file, names } of problems.pruned) {
    console.error(`PRUNED residue from ${rel(repo, file)}: ${[...new Set(names)].join(', ')} `
      + '(unreachable once the target bindings were removed).');
  }
  for (const w of problems.template) console.error(`WARNING: ${w}`);
  for (const p of problems.uncompilable) {
    console.error(`WARNING: could not compile step pattern ${p} — it was NOT checked `
      + 'against the target scenario and may still be in the prompt.');
  }
  for (const p of problems.unknownParams) {
    console.error(`WARNING: unknown parameter type {${p}} — no defineParameterType found. `
      + 'Matched permissively, so hold-out may have removed more than the target.');
  }
  for (const w of d.warnings) console.error(`WARNING: ${w}`);
}

main();
