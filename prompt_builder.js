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
 *                          [--out <file>] [--template <file>] [--json]
 *
 *   --repo      Path to the target repo (required).
 *   --gherkin   Target scenario/feature: a path to a .feature file, OR literal
 *               Gherkin text. If omitted, a placeholder is left in the prompt.
 *   --out       Write the prompt here instead of stdout.
 *   --template  Template file (default: ./new_prompt_template.md next to this script).
 *   --json      Print the discovery result as JSON (debug) instead of the prompt.
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
const SOURCE_EXTS = ['.ts', '.js', '.mjs', '.cjs', '.tsx', '.jsx'];

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

function invocationCodeGlobs(repo) {
  const blobs = [];

  // (a) cucumber config files
  const configNames = [
    'cucumber.js', 'cucumber.cjs', 'cucumber.mjs', 'cucumber.json',
    'cucumber.yaml', 'cucumber.yml', '.cucumberrc', '.cucumberrc.json',
  ];
  for (const name of configNames) {
    const p = path.join(repo, name);
    if (fs.existsSync(p)) blobs.push(read(p));
  }

  // (b) package.json: cucumber field + the primary test script
  const pkgPath = path.join(repo, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let pkg = {};
    try { pkg = JSON.parse(read(pkgPath)); } catch { /* ignore */ }
    if (pkg.cucumber) blobs.push(JSON.stringify(pkg.cucumber));
    const scripts = pkg.scripts || {};
    // Prefer `test`; else the first script that runs cucumber-js.
    let scriptText = '';
    if (scripts.test && /cucumber-js/.test(scripts.test)) scriptText = scripts.test;
    else {
      const hit = Object.values(scripts).find((s) => /cucumber-js/.test(s));
      if (hit) scriptText = hit;
    }
    if (scriptText) blobs.push(scriptText);
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

  // Drop transpiler hooks and non-path junk.
  return out
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => /[\/.]/.test(t) && !t.includes('://'))
    .filter((t) => !/^(ts-node|tsx?|esbuild-register|@babel)/.test(t));
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
  const constByName = /(^|[.\-_/])(constants?|config|caps|env|settings|fixtures?)([.\-_]|$)/.test(name)
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
  const stripped = base.replace(/\.(ts|js|mjs|cjs|tsx|jsx)$/, '');
  const cands = [];
  for (const ext of SOURCE_EXTS) cands.push(stripped + ext);
  for (const ext of SOURCE_EXTS) cands.push(path.join(stripped, 'index' + ext));
  return cands.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

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

function isBuiltin(spec) {
  const name = spec.replace(/^node:/, '').split('/')[0];
  return spec.startsWith('node:')
    || ['fs', 'path', 'os', 'url', 'util', 'assert', 'crypto', 'child_process',
        'events', 'stream', 'http', 'https', 'zlib', 'buffer'].includes(name);
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
      deadGlobs++;
      warnings.push(`--require/--import glob matched no files: "${t}"`);
    }
    for (const f of hits) invocationFiles.add(f);
  }

  const buckets = { step: [], world: [], support: [], constant: [], dsl: [] };
  const seen = new Set();
  const isCucumberConfig = (f) =>
    /^(cucumber\.(js|cjs|mjs|ts|json|ya?ml)|\.cucumberrc(\.json)?)$/.test(path.basename(f));
  const addFile = (f) => {
    if (seen.has(f) || !isSource(f) || isCucumberConfig(f)) return;
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

  return {
    repo,
    featureFiles,
    stepFiles: buckets.step.sort(),
    worldFiles: buckets.world.sort(),
    supportFiles: buckets.support.sort(),
    constantFiles: buckets.constant.sort(),
    dslFiles: buckets.dsl.sort(),
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

// Best-effort public-surface index for a DSL/page-object/helper file.
function extractSignatures(src) {
  const sigs = new Set();
  const push = (kw, name, args) => {
    if (!name || JS_KEYWORDS.has(name)) return;
    sigs.add(`${kw}${name}(${(args || '').replace(/\s+/g, ' ').trim()})`);
  };
  // exported functions
  for (const m of src.matchAll(/export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g))
    push(m[1] ? 'async ' : '', m[2], m[3]);
  // exported arrow consts
  for (const m of src.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/g))
    push(m[2] ? 'async ' : '', m[1], m[3]);
  // plain function declarations (factory-internal helpers, page fns)
  for (const m of src.matchAll(/(?:^|\n)\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g))
    push(m[1] ? 'async ' : '', m[2], m[3]);
  // class methods:  `name(args) {`  (filter keywords / control flow)
  for (const m of src.matchAll(/(?:^|\n)\s{2,}(async\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g))
    push(m[1] ? 'async ' : '', m[2], m[3]);
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

// Pick the most representative step file for the STYLE REFERENCE:
// the one with the most Given/When/Then bindings.
function pickStyleFile(stepFiles) {
  let best = null, bestCount = -1;
  for (const f of stepFiles) {
    const c = (read(f).match(/\b(Given|When|Then)\s*\(/g) || []).length;
    if (c > bestCount) { best = f; bestCount = c; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Step 5: build the prompt from the template.
// ---------------------------------------------------------------------------

function loadTemplate(templatePath) {
  const raw = read(templatePath);
  const start = raw.indexOf('# ROLE');
  return start >= 0 ? raw.slice(start) : raw;
}

function resolveGherkin(arg) {
  if (!arg) return '# <-- paste the target Gherkin scenario/feature here -->';
  if (fs.existsSync(arg) && fs.statSync(arg).isFile()) return read(arg).trimEnd();
  // A mistyped path would otherwise be embedded verbatim as the "scenario".
  const s = String(arg);
  const looksLikePath = /\.feature$/i.test(s) || (!/\s/.test(s) && /[/\\]/.test(s));
  if (looksLikePath) {
    console.error(`Gherkin file not found: ${s}`);
    process.exit(1);
  }
  return s.trimEnd();
}

function buildPrompt(d, gherkin, templatePath) {
  const styleFile = pickStyleFile(d.stepFiles);
  const worldAll = [...d.worldFiles, ...d.supportFiles];

  const values = {
    GHERKIN: gherkin,
    DSL_CATALOG: sectionFromFiles(d.repo, d.dslFiles, { withIndex: true }),
    EXISTING_STEP_DEFS: sectionFromFiles(d.repo, d.stepFiles),
    WORLD_DEFINITION: worldAll.length
      ? sectionFromFiles(d.repo, worldAll)
      : '// No custom World was found. `this` is the default cucumber-js World.\n'
        + '// Values may be shared via module-level globals or the World `this`.',
    CONSTANTS: sectionFromFiles(d.repo, d.constantFiles),
    STYLE_FILE_PATH: styleFile ? rel(d.repo, styleFile) : '(no step file found)',
    STYLE_FILE: styleFile ? read(styleFile).trimEnd() : '// (no existing step file to reference)',
  };

  let out = loadTemplate(templatePath);
  for (const [k, v] of Object.entries(values)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.repo) {
    console.error('Usage: node prompt_builder.js --repo <path> [--gherkin <file|text>] [--out <file>] [--json]');
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
      Object.entries(d).map(([k, v]) => {
        if (k === 'warnings' || !Array.isArray(v)) return [k, v];
        return [k, v.map((f) => rel(repo, f))];
      }),
    );
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const gherkin = resolveGherkin(args.gherkin);
  const prompt = buildPrompt(d, gherkin, templatePath);

  if (args.out === true) {
    console.error('--out needs a file path.');
    process.exit(1);
  }
  if (args.out) {
    fs.writeFileSync(args.out, prompt);
    console.error(`Wrote prompt -> ${args.out}`);
  } else {
    process.stdout.write(prompt);
  }

  // Warnings go to stderr so they survive `> prompt.md` and stay out of the prompt.
  for (const w of d.warnings) console.error(`WARNING: ${w}`);
}

main();
