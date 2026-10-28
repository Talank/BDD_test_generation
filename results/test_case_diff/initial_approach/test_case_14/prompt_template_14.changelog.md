# Changelog — `prompt_template_14.md` → `prompt_template_14.revised.md`

Repo: `cucumber-tsflow-specs` (cucumber-tsflow self-tests). Line numbers refer to
the **original** file and are cited here only; they do not appear in the revised
prompt.

Protected sections verified byte-identical to the original: `# TASK`,
`# REGISTERED STEPS`, `# EXISTING STEP DEFINITIONS`, `# PARAMETER TYPES`,
`# CONSTANTS`, `# WORLD`.

Templates 10, 12, 13 and 14 are the same repository. Every edit below is
**byte-identical across all four** except where this changelog says otherwise;
that was verified by diffing the revised files against each other.

---

## 1. `PUBLIC SURFACE INDEX` — public fields (structural change 1)

**Section touched:** `# DSL CATALOG` → `// ===== PUBLIC SURFACE INDEX
(auto-extracted) =====` (orig. L66).

**Added (3 parts):**

a. Three framing lines under the index header: methods are listed with their
   signature; public fields and properties are listed with their type and their
   `(read)` / `(read/write)` mutability.

b. Under `cucumber-tsflow-specs/src/support/runner.ts` (after the existing
   `TestRunner#async run(...)` line, orig. L102), six `TestRunner` public members:

| Indexed entry | Original declaration | Why it matters |
|---|---|---|
| `TestRunner#dir: TestDir` (read) | `public readonly dir = new TestDir();` L700 | `readonly` → read only; used at L146, L171, L193 |
| `TestRunner#sharedEnv?: NodeJS.ProcessEnv` (read/write) | L702 | assigned in an existing step at L963 |
| `TestRunner#spawn: boolean` (read/write) | L704 | — |
| `TestRunner#debug: boolean` (read/write) | L706 | — |
| `TestRunner#worldParameters?: any` (read/write) | L708 | — |
| `TestRunner#verifiedLastRunError: boolean` (read/write) | L710 | read by the `@after()` hook at L162; reset at the end of `run()` at L777 |

c. Under `cucumber-tsflow-specs/src/support/formatter_output_helpers.ts` (after
   `normalizeJsonOutput`, orig. L78): `ignorableKeys: string[]` (read), justified
   by `export const ignorableKeys = [...]` at orig. L338 — an exported public
   member the methods-only extractor skipped.

**Justification for (b):** the original index listed only `get lastRun()`,
`get extractor()` and `run()` (orig. L100–102), while `verifiedLastRunError` is a
declared public field (L710), is reset at the end of `run()` (L777), and is
enforced by the `@after()` hook in `prepare.ts` (L162) — all three visible in the
dump, none reachable through the index.

**Not added:** `TestRunner#_lastRun` (L712, `private`), `TestDir#_path`
(`private`), the `Prepare` constructor's `private readonly runner`, and the
`Extractor` constructor's `private readonly envelopes` — all private. `TestDir`
has no public field beyond the `get path()` / `set path()` pair already indexed.

---

## 2. New `# CALLABLE HELPERS` section (structural change 3)

**Section touched:** new top-level section inserted between `# REGISTERED STEPS`
and `# EXISTING STEP DEFINITIONS` (orig. L886), in the existing
`---` + heading + `ts` fence style, so the index precedes the dump it describes —
matching the `PUBLIC SURFACE INDEX` pattern.

**Added:** a list of the module-local symbols in the step-definition sources,
with signatures, the file each lives in, and an explicit statement that they are
**module-private**: each is declared without `export`, cannot be imported from a
sibling step-definitions file, and must be reimplemented locally rather than
called. A closing line notes that each of those files ends in
`export = <StepClass>`, so the step class is the only exported name.

| Listed symbol | File | Original line |
|---|---|---|
| `function escapeRegex(text: string): string` | `cucumber_steps.ts` | L894 |
| `function createFlexibleOutputRegex(text: string): RegExp` | `cucumber_steps.ts` | L898 |
| `function countMatches(output: string, text: string): number` | `cucumber_steps.ts` | L938 |
| `function expectOutputToContain(output: string, text: string): void` | `cucumber_steps.ts` | L949 |
| `const ENCODING_MAP` | `scenario_steps.ts` | L1035 |

Export status verified: no `export` keyword on any of these declarations, and the
only export statements in these files are `export = CucumberSteps` (L987),
`export = FileSteps` (L1024) and `export = ScenarioSteps` (L1142).

**Justification:** these names are visible in `# EXISTING STEP DEFINITIONS` but,
under rule 1's "only call what is listed", illegal to call — and they were not
listed anywhere. Naming them as module-private makes "reimplement it locally" an
informed choice instead of a guess, which is different from not knowing they
exist.

---

## 3. `# RULES` 1 — rule edit A (fields and assignment)

**Section touched:** `# RULES`, rule 1 (orig. L11–14).

**Reworded:** heading "Only call what is listed" → "Only use what is listed"; the
four original lines are otherwise unchanged. Four lines appended: "listed" covers
**fields** as well as functions; a member listed in `PUBLIC SURFACE INDEX`,
`WORLD` or `PARAMETER TYPES` may be READ; where the index marks it `(read/write)`
it may also be ASSIGNED; and assigning to a listed writable member is a legal
statement in a body, not an invented name.

**Justification:** the original rule read as functions-only, which made writing to
a public field — e.g. the pattern an existing step already uses at orig.
L963 — look like invention.

---

## 4. `# RULES` 4 — rule edit B (exact match before `// EXISTS`)

**Section touched:** `# RULES`, rule 4 (orig. L19–21).

**Reworded:** `// EXISTS` is now emitted **only** on a character-for-character
match with a `REGISTERED STEPS` entry, and the matched entry must be quoted
verbatim in the comment (the comment shape is given as a generic placeholder —
no step from the target feature is used as an example). The pre-existing
"'looks similar' is not 'matches'" warning is retained and made operative:
compare against the entry itself, never against the family it belongs to;
near-identical patterns are registered one at a time and the presence of some
says nothing about the rest. The vague "if unsure, write the binding" becomes the
definite "if no entry matches character-for-character, WRITE the binding".

---

## 5. `# RULES` 9 — rule edit C (failure modes point at the new sections)

**Section touched:** `# RULES`, rule 9 header line (orig. L40).

**Reworded:** added a preamble requiring a re-check of `WORLD`, the **fields** in
`PUBLIC SURFACE INDEX`, and `CALLABLE HELPERS` — not only the `DSL CATALOG`
function list — before either `UNMAPPED` form is written, noting that a member
reachable through `this`, a listed writable member that may be assigned, or a
module-private helper that must be reimplemented rather than called, can each
change the answer. The three bullets (orig. L41–44) are unchanged.

---

## Not done (contamination line / no source support)

- **No `WORLD SURFACE INDEX`** (structural change 2): `# WORLD` (orig.
  L1293) reports "No custom World was found. `this` is the default
  cucumber-js World." There is no custom World member in the dump to index, so
  the section would have been empty. Rule edit C therefore points at `WORLD` as
  it stands rather than at a non-existent index.
- **`ILastRun` field shape not indexed.** `TestRunner#get lastRun()` returns
  `ILastRun` with `error`, `errorOutput`, `envelopes`, `output` (orig. L689–697).
  These are fields of an interface, not of an indexed class, so adding them falls
  outside "public fields of each indexed class". Flagged for the owner as a
  candidate — it is general, applies identically to all four templates, and is
  entirely present in the dump.
- **Index inaccuracies left alone** (pre-existing, not introduced here, and out of
  scope for a surgical revision): `Prepare#setupNodeModules` / `#writeDefaultFiles`
  are `private` (orig. L170, L191) yet indexed as public; `valueOrDefault`,
  `normalizeExceptionAndUri`, `normalizeMessage` and `doesHaveValue` are indexed
  but are not exported from their modules; `Extractor#logsFromAttachments` and
  `#simplifyAttachment` are `static` but are indexed with the same `Class#member`
  shape as instance methods. Flagged for the owner.
- **`newFile` not indexed.** `FileSteps` calls `this.newFile(filePath, "")`
  (orig. L1015) but the method itself is not in the dump — it belongs to the
  held-out material. Adding it would leak; it was left out.

---

## Template-specific notes

This template combines template 10's field gap (`TestRunner#verifiedLastRunError`,
orig. L710 / L777 / L162) and template 13's helper gap (the module-local
output-matching functions in `cucumber_steps.ts`). Edits 1(b) and 2 close both.

**OUT OF SCOPE — flagged for the experiment owner.** The `=== 1` vs `> 0`
hook-count difference in this template's generated output traces to the wording of
the `# TASK` Gherkin, not to anything missing or unreachable in the context. The
Gherkin was left untouched, as required. This is a scenario-side issue: if the
intended assertion is an exact count, the step text has to say so — no context or
rules edit can or should fix it, and none was attempted.
