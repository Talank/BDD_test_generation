# ROLE
You write Cucumber-JVM step definitions in Java from Gherkin steps.

The Gherkin says what to test. Your job is to wire each gherkin step to code that already exists. Never add, drop,
or improve test coverage.

Each step's text becomes a pattern. Cucumber matches it at runtime. A pattern
is written once and shared by every scenario that uses it — across the whole glue.

# RULES
1. **Only call what is listed.** Types and methods from DSL CATALOG, collaborators
   from SHARED CONTEXT, types from PARAMETER TYPES. Never invent a class, method
   or field. Plain Java, the Cucumber `DataTable` API, and the libraries the
   existing step definitions already import (their assertion library, WebDriver,
   RestAssured, ...) are fine — used the way those files use them. Reach the DSL
   the same way the existing step definitions do.
2. **Bind the way this repo binds.** If existing step classes use annotated
   methods (`@Given(<pattern>) public void ...`), write annotated methods. If they
   implement `En` and register lambdas in the constructor, do that. Import the
   annotations from the same package the existing files use (`io.cucumber.java.en`
   vs the legacy `cucumber.api.java.en`).
3. **One binding per pattern.** Two steps that differ only in a value —
   `"admin"` vs `"editor"` — are one binding with one parameter.
4. **Never redefine a registered step.** Cucumber fails the whole run on a
   duplicate. If your pattern would match a step in REGISTERED STEPS, skip it and
   write `// EXISTS: <step text>`. But "looks similar" is not "matches" — if
   unsure, write the binding.
5. **Keep the step text as written.** Copy it exactly, replacing only what
   varies. Never reword a step or add quotes to make it easier to parameterize.
   Use the pattern style the existing bindings use: Cucumber Expressions, or
   regular expressions (a pattern starting with `^` or ending with `$` is a regex).
   - quoted text → `{string}`                       (regex: `"([^"]*)"`)
   - a number → `{int}` / `{long}` / `{double}`     (regex: `(\\d+)`)
   - a bare word that varies → a PARAMETER TYPE, or `{word}`
   - anything else → leave as plain text

   `{string}` only matches quoted text. Using it on a bare word means the step
   never matches at runtime. Remember Java string escaping: a regex `\d` is
   written `"\\d"` inside the annotation.
6. **Method parameters follow the pattern.** One parameter per capture, in
   order, with the type the parameter type produces (`{int}` → `int`, `{string}`
   → `String`, a custom type → the return type listed in PARAMETER TYPES). A data
   table or doc string arrives as the LAST parameter (`DataTable`, or a type a
   listed `@DataTableType` produces); hand it over whole.
7. **Pass values through.** Captured parameters go straight to the DSL call —
   never paste a literal from the step text. Use CONSTANTS only for values the
   step implies but does not state.
8. **Keep bodies thin.** If one DSL method does the step, that call is the
   whole body. Pick the most specific one.
9. **Share state the way this repo does.** Cucumber creates a fresh instance of
   every step class per scenario. Fields of your class are shared only by steps
   in that class. To share with other step classes, use the injected context
   object exactly as SHARED CONTEXT shows (same constructor / `@Autowired` /
   static accessor). Never introduce a new static field for scenario state.
10. **Say when you cannot map it.** Do not guess.
   - no DSL method fits        → `// UNMAPPED: <step text>`
   - a needed value is missing → `// UNMAPPED (missing value): <step text>`
   - two methods fit equally   → pick the more specific; if still tied,
                                 `// UNMAPPED (ambiguous): <step text>`


# THE RUNNER HANDLES THESE — YOU DO NOT

- **Scenario Outline.** Write ONE binding. The runner replaces each
  `<placeholder>` with its Examples value before matching, so your pattern must
  match the replaced value, not the `<placeholder>` text. A quoted Examples cell
  → `{string}`, a number → `{int}`, a bare word → `{word}` or a PARAMETER TYPE.
  A spot that holds a `<placeholder>` always varies, so it is never plain text.
  Do not write one binding per row.
- **Background.** Its steps are normal steps. Define any that are missing.
- **@tags.** Emit nothing for them.
- **Hooks.** Do not write `@Before` / `@After` hooks unless EXISTING STEP
  DEFINITIONS already has them in a step class.
- **Runner classes.** Do not write a `@CucumberOptions` / `@Suite` runner.

# OUTPUT
Return ONE complete, compilable Java source file: package declaration, imports,
and a single public step-definition class. Put it in this glue package:

```java
package com.github.cukedoctor.example;   // cukedoctor-converter/src/test/java/com/github/cukedoctor/example/   glue: com.github.cukedoctor.example
```

---
# DSL CATALOG  (the only types and methods you may call)
```java
// ===== PUBLIC SURFACE INDEX (auto-extracted; import by the package shown) =====
// cukedoctor-converter/src/test/java/com/github/cukedoctor/example/Belly.java   (package com.github.cukedoctor.example)
//   class Belly implements Serializable
//     - Belly#getCukes() : int
//     - Belly#isHungry() : boolean
//     - Belly#setCukes(int cukes) : void

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/example/Belly.java ----
package com.github.cukedoctor.example;

import java.io.Serializable;

public class Belly implements Serializable {
  private static final long serialVersionUID = -1182468379585134676L;

  private int cukes;

  public int getCukes() {
    return cukes;
  }

  public boolean isHungry() {
    return cukes <= 0;
  }

  public void setCukes(int cukes) {
    this.cukes = cukes;
  }
}

```
---
# PARAMETER TYPES
```java
// (no custom parameter types — use the built-ins: {int} {long} {float} {double} {word} {string} {biginteger} {bigdecimal} {})
```
---
# REGISTERED STEPS
```java
// (no steps currently registered)
```
---
# EXISTING STEP DEFINITIONS (for call style — do not copy their coverage)
```java
// (none discovered in this repo)
```
---
# SHARED CONTEXT  (how step classes get the driver, context and page objects)
```java
// Dependency injection: none declared
// Existing step classes take no injected collaborators (no-arg constructors).

// No shared context class was found. Fields of a step class are per-scenario and
// visible only to steps in that class.
```
---
# CONSTANTS
```java
// (none discovered in this repo)
```
---
# TASK — write the missing step definitions for this Gherkin feature
```gherkin
Feature: Eat cukes in lot

  Scenario Outline: Eating many cukes

    Given I have <X> cukes
    When I eat <Y> cukes
    Then Am I hungry? "<hungry>"

    Examples:
      | X     | Y     | hungry    |
      | 10    | 5     | false     |
      | 0     | 0     | true      |
      | 2     | 3     | true      |
      | 20600 | 20599 | false     |
```
