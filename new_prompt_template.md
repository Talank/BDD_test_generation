## Template 

# ROLE
You translate ONE BDD (Gherkin) scenario into ONE Playwright test that uses this
project's existing step-definition DSL. This is TRANSLATION, not design. The
Gherkin below is the COMPLETE source of truth for intent. Do not add, drop, or
"improve" coverage.

# HARD RULES
1. Map each Gherkin step (Given/When/Then/And/But) to exactly ONE call, in order.
2. Call ONLY functions that appear in STEP CATALOG. Never invent a function.
3. Use ONLY values taken from the scenario's data tables, CONSTANTS, or values
   already shown in STYLE REFERENCE. Never invent fixture filenames, counts,
   role strings, media-type labels, or display names.
4. If a dedicated step exists for an action, use it. Do NOT rebuild a behavior
   out of generic primitives (e.g. do not emulate "upload N files" with N
   generic upload calls if a bulk step exists).
5. Preserve each Gherkin line as a comment above its call (as in STYLE REFERENCE).
6. If a step has no matching catalog function, emit `// UNMAPPED: <line>` rather
   than guessing.

# OUTPUT
Return ONLY the single `test(...)` block. No prose, no imports.

---
# TASK — write the test for this scenario
```gherkin
{{GHERKIN}}
```
---
# STEP CATALOG  (265 functions) Closed set. Call ONLY these.
```ts
{{STEP_CATALOG}}
```

---

# CONSTANTS  (tests/e2e/environment/constants.ts — the only allowed symbolic values)
```ts
{{CONSTANTS}}
```

---

# STYLE REFERENCE  ({{STYLE_FILE_PATH}})
Reference for call-shape, argument conventions, and the Gherkin-as-comment style
ONLY. The TARGET scenario has been removed from this file. Do NOT copy the scope
or coverage of neighboring tests — follow the Gherkin.
```ts
{{STYLE_FILE_MINUS_TARGET}}
```

