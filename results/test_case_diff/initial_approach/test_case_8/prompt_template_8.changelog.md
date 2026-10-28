# Changelog — `prompt_template_8.md` → `prompt_template_8.revised.md`

Repo: apickli (CommonJS, `source/apickli/`). Target feature: mutual TLS against a
mock target. Line numbers refer to the **original** file and are cited here only.

Protected sections verified byte-identical to the original: `# TASK`,
`# REGISTERED STEPS`, `# EXISTING STEP DEFINITIONS`, `# PARAMETER TYPES`,
`# CONSTANTS`, `# WORLD`.

---

## ⚠️ FLAG FOR THE EXPERIMENT OWNER — this file is a true context gap, not an index gap

This is the one template of the six where the original diagnosis ("the model
lacked context") is **correct**. The step `Given I use the mock target` requires
the value `https://localhost:5000`, and that string appears **nowhere** in the
template: the step-definition file that sets it was held out. A leak check on the
revised file confirms zero occurrences of `5000`.

No indexing change can make the correct body derivable. **The expected output for
`Given I use the mock target` remains `// UNMAPPED (missing value): I use the
mock target`**, and it remains correct after this revision.

The index edit below is still worth making — it removes a *separate*, real
reachability defect (`domain` is invisible to a methods-only index) — but it does
**not** and must not resolve the missing value. The held-out step-definition file
was not added and the URL was not added.

---

## 1. `PUBLIC SURFACE INDEX` — Apickli public fields (structural change 1)

**Section touched:** `# DSL CATALOG` → `// ===== PUBLIC SURFACE INDEX
(auto-extracted) =====` (orig. L66), entries inserted so that all `Apickli#…`
lines stay contiguous, immediately above `Apickli#addRequestHeader` (orig. L75).

**Added (2 parts):**

a. Two framing lines under the index header stating that methods are listed with
   their signature and fields with their type and `(read)` / `(read/write)`
   mutability.

b. Thirteen field entries, all `(read/write)` (plain-JS instance properties, no
   accessors, no `Object.freeze` anywhere in the dump), in constructor order:

| Indexed entry | Original line | Also written/read at |
|---|---|---|
| `Apickli#domain: string` | L198 | read when the request URL is built, L574; read L587 |
| `Apickli#headers: object` | L199 | L216–223, L227 |
| `Apickli#cookies: array` | L200 | L254, L586–587 |
| `Apickli#httpResponse: object` | L201 | returned L249; assigned L610 |
| `Apickli#requestBody: string` | L202 | L259 |
| `Apickli#scenarioVariables: object` | L203 | L453, L459, L465, L470, L553 |
| `Apickli#fixturesDirectory: string` | L204 | — |
| `Apickli#queryParameters: object` | L205 | L272 |
| `Apickli#formParameters: object` | L206 | L285 |
| `Apickli#httpRequestOptions: object` | L207 | read L573; set in WORLD hook L938 |
| `Apickli#clientTLSConfig: object` | L208 | read L232; set in WORLD hook L931 |
| `Apickli#selectedClientTLSConfig: string` | L209 | L235 |
| `Apickli#variableChar: string` | L210 | — |

**Justification:** every one of these is assigned on `this` in the `Apickli`
constructor (orig. L196–210) and several are read by prototype methods, yet the
auto-extracted index listed only the constructor and the prototype **methods**.
`domain` in particular is set at L198 and read at L574 when the request URL is
assembled, and was never mentioned in the index.

**Not added:** the module-level `accessToken`, `globalVariables` and
`_xmlAttributeNodeType` (orig. L134–136) — module-private, not public surface.

---

## 2. `# RULES` 1 — rule edit A (fields and assignment)

**Section touched:** `# RULES`, rule 1 (orig. L11–14).

**Reworded:** heading "Only call what is listed" → "Only use what is listed";
the four original lines are otherwise unchanged. Four lines appended stating that
"listed" covers **fields**, that a member in `PUBLIC SURFACE INDEX` / `WORLD` /
`PARAMETER TYPES` may be read, that one marked `(read/write)` may be **assigned**,
and that such an assignment is not an invented name.

**Justification:** the original rule read as functions-only, which made
`this.apickli.<field> = …` — the shape the `# WORLD` hook itself uses at orig.
L931 and L938 — look like invention.

---

## 3. `# RULES` 4 — rule edit B (exact match before `// EXISTS`)

**Section touched:** `# RULES`, rule 4 (orig. L19–21).

**Reworded:** `// EXISTS` is now emitted **only** on a character-for-character
match with a `REGISTERED STEPS` entry, and the matched entry must be quoted
verbatim in the comment (comment shape given as a generic placeholder, not a
worked example). The pre-existing "'looks similar' is not 'matches'" warning is
retained and made operative: compare against the entry, never the family;
near-identical patterns are registered one at a time. Fallback stated explicitly:
no exact match → write the binding.

**Justification:** applied uniformly across all six templates per the revision
brief. `REGISTERED STEPS` here lists 35 entries (orig. L625–659), many in
near-identical families (`response header … should be` / `should not be` /
`should exist` / `should not exist`).

---

## 4. `# RULES` 9 — rule edit C (failure modes point at fields and WORLD)

**Section touched:** `# RULES`, rule 9 header line (orig. L40).

**Reworded:** added a preamble requiring a re-check of `WORLD` and of the
**fields** in `PUBLIC SURFACE INDEX` — not only its function list — before either
`UNMAPPED` form is written. The three bullets (orig. L41–44) are unchanged.

**Justification:** rule edit C, adapted to this file's sections. It does **not**
name `CALLABLE HELPERS`, which this template does not have (see below).

**Interaction with the flag above:** this edit makes it easier for the model to
see that `this.apickli.domain` is assignable — and the correct answer is still
`// UNMAPPED (missing value)`, because the *value* is absent, not the *member*.
That is the intended behaviour of the missing-value rule and is not a leak.

---

## Not done (scope / contamination line)

- **No `# CALLABLE HELPERS` section**, per the revision brief's "do, and only
  this" instruction for this template. For the record, this file does contain
  qualifying material: `stepContext` (orig. L672), `prettyPrintJson` (L674) and
  `callbackWithAssertion` (L685) are module-local in
  `source/apickli/apickli-gherkin.js` and are visible but not importable
  (`exports.Apickli = Apickli` at orig. L535 is the only export in the catalog
  file; `apickli-gherkin.js` exports nothing). Flagged for the owner as a
  candidate if this template is ever brought in line with 10/12/13/14.
- **No `WORLD SURFACE INDEX`**, same reason. `# WORLD` (orig. L918–941) shows
  `this.apickli` reached through a `Before` hook; the model already finds it.
- **The revision brief states that templates 2 and 8 "use a longer rules block
  with different numbering than 10/12/13/14."** That is true of template 2, but
  **not** of template 8: its `# RULES` block (orig. L10–44) is byte-identical to
  template 10's. This changelog therefore matches template 8's own wording and
  numbering, which is the same 9-rule block used by 10/12/13/14, differing only
  in rule 9 (no `CALLABLE HELPERS` reference here).
