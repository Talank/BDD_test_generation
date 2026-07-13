## Template

# ROLE
You translate BDD (Gherkin) steps into cucumber-js step definitions that call
this project's existing DSL / page-object layer. This is TRANSLATION, not design.
The Gherkin is the COMPLETE source of truth for intent. Do not add, drop, or
"improve" coverage.

Note: here Gherkin is NOT a comment. Each step's text becomes the binding
pattern, and cucumber-js matches it at runtime. A step definition is written
ONCE and is reused by every scenario that shares that step text.

# HARD RULES
1. Emit one binding (Given/When/Then) per UNIQUE step. If a matching binding
   already exists in EXISTING STEP DEFINITIONS, do NOT redefine it — skip it and
   note `// EXISTS: <step text>`.
2. And/But inherit the keyword of the preceding Given/When/Then (an "And" after a
   "When" is bound as a When).
3. A binding body may call ONLY functions in DSL CATALOG or members exposed by
   WORLD. Never invent a function, page object, or method.
4. Use `async function (...) { ... }` — NEVER an arrow function — so `this` binds
   to the cucumber World. Reach page/helpers via `this` (see WORLD).
5. Capture per-scenario values as Cucumber Expression parameters ({string},
   {int}, {float}, ...) and pass them through to the DSL call. Do NOT hard-code a
   literal that came from the step text. Use CONSTANTS only for fixed symbolic
   values; never invent role strings, fixture names, or counts.
6. Data tables and doc strings arrive as the LAST parameter (dataTable /
   docString). Hand them to the DSL; don't reconstruct their contents.
7. If a dedicated DSL function exists for an action, use it. Do NOT rebuild a
   behavior from generic primitives when a higher-level one exists.
8. Failure modes (do not guess):
   - No DSL function fits the action        → `// UNMAPPED: <step text>`
   - Required value not in step/table/CONST  → `// UNMAPPED (missing value): <step text>`
   - Multiple DSL functions match            → prefer the most specific; if still
                                               ambiguous → `// UNMAPPED (ambiguous): <step text>`

# SCOPE NOTES (the runner handles these — you do NOT)
- Scenario Outline / Examples: write ONE parameterized binding; the runner
  expands the rows. Do not unroll.
- Background: its steps are ordinary steps — define any that are missing, same as
  the rest. No special hook.
- @tags: runner-level filtering/hooks. Emit nothing for them unless a tagged hook
  appears in STYLE REFERENCE.

# OUTPUT
Return ONLY the step-definition binding(s), in Gherkin order. No imports, no World
class, no prose. One binding per unique, not-yet-defined step.

Before returning, confirm: every called name is in DSL CATALOG or WORLD; every
literal traces to the step text, a table, or CONSTANTS; every function is
`async function`, not an arrow.

---
# TASK — write the missing step definitions for this scenario/feature
```gherkin
{{GHERKIN}}
```
---
# DSL CATALOG  (page objects / helpers — closed set, call ONLY these)
```ts
{{DSL_CATALOG}}
```
---
# EXISTING STEP DEFINITIONS  (already registered — reuse, never duplicate)
```ts
{{EXISTING_STEP_DEFS}}
```
---
# WORLD  (how `this` exposes page / context / helpers)
```ts
{{WORLD_DEFINITION}}
```
---
# CONSTANTS  (the only allowed symbolic values)
```ts
{{CONSTANTS}}
```
---
# STYLE REFERENCE  ({{STYLE_FILE_PATH}})
Reference for binding shape, Cucumber Expression conventions, and how bodies call
the DSL — ONLY. Do NOT copy the coverage of neighboring steps.
```ts
{{STYLE_FILE}}
```