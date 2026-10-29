# How the Three Edges Were Judged


| Edge | Question | Can it be automated? |
|---|---|---|
| 1 | Does the scenario match the dev test?| Requires human judgement |
| 2 | Does the scenario match the gen test? | Same  |
| 3 | Do the dev and gen tests match? | Partly, maybe with metrics like code coverage etc |

## General rule for all: compare three parts of the tests seperately


| Part | What it is | Example (Test 1) |
|---|---|---|
| **Setup** | Preparing data or state before the main call | `email = StringUtil.formatString(email, ...)` |
| **Main call**/ body| The one call that does what the step is about | `enterRegistrationDetails(...)` |
| **Check** (assertion) | What is checked, where, and how strictly | `verifyTitleMessage(message)` |

### Things that never count as a difference

The report ignores these on every edge, in every test:

- Code style like variable names etc.
- The keyword difference in Gherkin like Given instead of Then etc.
- Error messages.
- Unused imports, variables etc which doesn't affect test flow.
- Swapping one call for another that gives the same result (Test 3: `type` vs `fill`).

---

## Edge 1: Does the scenario match the dev test?

**How I approached it:** if you read only the step text, would you expect the code the developer wrote?

It is the only edge that judges the *scenario*. A "No" here almost always becomes the "Inadequate Scenario" or "Wrong Scenario" category.



| # | Rule | Verdict if the rule isnt followed | Example |
|---|---|---|---|
| 1 | **Every step has code.** Each step in the scenario has a matching definition in the dev files shown. | No (Incomplete Implementation) | Test 2: "Scenario contains steps that are configured in the shared steps files instead of the test file" |
| 2 | **No extra code.** The code doesn't do something important that the text never mentions | No(Inadequate Scenario) | Test 1: dev code also randomizes the email, agrees to the privacy policy and clicks Continue. None of that is in the step text, and whole test case depends on it. |
| 3 | **Defined role.** A step written as setup or action must not secretly be a check, and vice versa. | No (Wrong Scenario) | Test 7: `Given I send a request to delete my user` reads as an action, but the dev code also asserts `204`.so its not following the defined |
| 4 | **Assertion mentioned explicitly** | **Yes, but** (still counted as Yes, flagged as a minor scenario problem) | Test 3: "Login should be success" doesn't say what proves success. Test 6: "error 'Bad Request'" doesn't say where the text appears. Test 14: "was executed" doesn't say *once*. |

### Wiggle Room

- **A natural reading of the text is fine.** Test 17: `I browse "..."` only stores the base URL and doesn't open it. The text doesn't say so, but the relative paths in later steps make it clear, so it gets a **Yes**.
- **Assertion being stricter than the scenario mentions is allowed** as long as it is the same kind of check. Test 14's dev code checks "exactly once" for "was executed", so **Yes, but**, not No.

### Flag
Example: Test 2: "Scenario contains steps that are configured in the shared steps files instead of the test file". This is a common strategy in repos, should I keep it as non-match or allow shared steps and move it into wiggle room third point?

---

## Edge 2: Does the scenario match the gen test?

Apart from including all the judgement criteras from Edge 1, We added an extra judgement. Since there's no way to know if the generated step code is valid or not, we compare it with dev test to assess if it would reach the endgoal of the scenario in a valid way. We don't compare the two test cases as its done in E3 but we try to assess the validity of gen test. An example is inventing method names which doesn't make it to the end.

> **Edge 2 = Yes** if passes criterias of edge 1 and only if **every** scenario would reach the end, as it would with the dev code.
> Otherwise **No**, written as "X / N scenarios unchanged".

Using dev code as the reference answer is a choice we took because Edge 1 is (almost always) Yes.



### What makes a scenario non-match


| Rule | Example |
|---|---|
| A step has no code, or is left as an `UNMAPPED` comment | Test 8 (1 of 4 steps), Tests 16, 19, 20 (all steps) |
| A step's pattern can't match the step text | Test 9: `(\d+)` can't match `` `myCode` ``; Tests 17, 18: `"{string}"` never matches |
| Two patterns match the same step (ambiguous step) | Tests 4, 5: the dropped `(?!of type)` lookahead |
| The code crashes in setup | Tests 6, 7: `rowsHash()` on a 4-column table |
| The code reads the wrong data | Test 11: `rows()` drops the only row of a headerless table |
| A needed side effect is missing | Tests 10, 14: `verifiedLastRunError` never set, so the After hook throws |
| Inventing functions | Test 4: `assertResponseDoesNotContainHeader` |
| Empty assertion or Tautology | Test 18: "goes green without asserting anything" |
| The scenario fails for a **different reason** | Test 5: the scenarios are meant to fail, and they do, but with a crash instead of the assertion message. Counted as non-match. |

### What does *not* make a scenario "changed"

- **A weaker check that still passes on the normal path.** Test 14: `>= 1` instead of `=== 1` is counted as "weakened", not broken. Test 3: the URL check is "weak", but Edge 2 is still Yes.
- **Being less tolerant of small output differences.** Test 13: exact substring count instead of the whitespace-tolerant helper is "at risk", not broken, so Edge 2 stays **Yes**.
- Anything on the "never counts" list above.

### Possible answers

- **Yes**: N / N scenarios unchanged.
- **No (X / N unchanged)**: at least one scenario ends differently.

---

## Edge 3: Do the dev and gen tests match?

**The question:** lay the two step definitions side by side. Are they the same code in every way that matters?

Edge 2 and Edge 3 are both done by reading, but they ask different things. Edge 2 asks how each **scenario** would end. Edge 3 asks whether the **code** is the same. So Edge 3 catches differences that don't change any result *in this feature* but would on other inputs (Test 8: hard-coded `valid` and `200`; Test 13: exact instead of whitespace-tolerant matching). That's why Edge 3 is often "No" even when Edge 2 is close.

### The rules

For each step, compare the three parts:

| Part | Same if… | Example of "different" |
|---|---|---|
| Setup | the same data is prepared the same way | Test 1: email randomized vs raw |
| Main call | the same call is made, or one with an identical effect here | Test 1: `agreePrivacyPolicy` / `clickContinueButton` missing |
| Check | the same **target** is checked with the same **strength** | Test 2: `filterTrigger()` vs `list()`. Test 3: user menu vs URL. Test 14: `=== 1` vs `> 0` |

Also compared: the **pattern** for each step (Test 9: `(.*)` narrowed to `(\d+)`; Test 8: `(.+)` hard-coded to `valid`) and whether every step has code at all.

### The three-level answer

| Answer | When | Example |
|---|---|---|
| **Yes** | Only differences from the "never counts" list | Test 15 |
| **Mostly** | Same result on every scenario here, but the gen code is less forgiving and could fail where the dev code wouldn't | Test 13 (exact vs whitespace-tolerant output match) |
| **No** | Any missing call, different check target, different check strength, narrower or hard-coded pattern, missing step, or anything else that changes a result | Every other test |

---

## How the three edges fit together

The pattern of answers points to the category in column 4 of the original table:

| Edge 1 | Edge 2 | Edge 3 | Category | Tests |
|---|---|---|---|---|
| Yes | Yes | Yes | Match | 15 |
| Yes | Yes | Mostly | Context Gap / mild Generation Fault | 13 |
| Yes | No | No | Generation Fault or Context Gap (see below) | 4, 5, 8–12, 16–20 |
| Yes, but | No | No | Generation Fault + Inadequate Scenario | 6, 14 |
| No / Yes, but | Yes | No | Inadequate Scenario. The generator followed the text; the developer did more than the text says | 1, 3 |
| No | No | No | Wrong Scenario + Generation Fault | 7 |

When Edge 2 is No, choosing between **Generation Fault** and **Context Gap** depends on one question: *was the missing piece visible in the prompt?*

- Visible, or easy to work out from visible code → **Generation Fault** (Test 19: "every held-out function has a visible twin").
- Not visible anywhere → **Context Gap** (Test 8: `https://localhost:5000` appears nowhere in the prompt).

---

## Where the report breaks its own rules

I'm confident about flags 1–3. Flags 4–5 are softer and depend on where you draw a line.

### Flag 1: Test 2, Edge 2 should be **No**, not Yes

The generated file registers two steps with **empty bodies**:

```ts
Given("user open the app", async function () {
  // UNMAPPED: user open the app
});
Given("user open the {string} page", async function (page) {
  // UNMAPPED (missing value): user open the {string} page
});
```

The report treats this same pattern as a failure everywhere else:

- Test 8: **one** `UNMAPPED` step out of four → Edge 2 **No**.
- Test 18: empty bodies with an `UNMAPPED` comment → "the most dangerous output shape in the report so far".

In Test 2 it's called "identical to the original" instead. Traced through, scenarios 2 and 3 start with `user open the "subscriptions" page`, which now does nothing, so `user should see "3" subscriptions` has nothing to count. If the shared step files from the repo are still there, these become duplicate definitions and Cucumber stops with an ambiguous-step error. Either way, those scenarios don't end the same as with the dev code.

### Flag 2: Test 1, Edge 2 is only "Yes" under the read-the-text method

The generated code fills the form but never submits it, as the report itself says ("Form is filled but never submitted"). So `Then user should see a message "Your Account Has Been Created!"` fails in both Examples rows. Under the trace-each-scenario method used for Tests 4–20, that's **0 / 2 unchanged → No**.

For Tests 1–3, Edge 2 only checked whether each generated step does what its own text says. For Tests 4–20, it traced each whole scenario to its end. Either one should be used for all 20. Mixing them makes Test 1 look like the generator succeeded when its output can't pass. (Test 3 comes out Yes under both methods, so it isn't affected.)

### Flag 3: Tests 5 and 9 disagree about `setRequestHeader`

- Test 5: "the header setup focal method is replaced with a **nonexistent** one" (`setRequestHeader`).
- Test 9: "Both are in the catalog. `addRequestHeader` appends…; `setRequestHeader` replaces it."

Both can't be true. It matters for Test 9's count. If Test 5 is right, the two Test 9 scenarios that set a header ("Setting headers with variables" and "Access token retrieval") also fail, and Test 9 becomes **14 / 18**, not 16 / 18. Test 5's verdict doesn't change either way, because its `callbackWithAssertion(this, ...)` bug alone breaks 14 of 15.

### Flag 4 (softer): the hidden `verifiedLastRunError` flag in Tests 10, 12, 14

The dev `it fails` step does something the text never mentions:

```ts
@then("it fails")
public ensureFailure() {
  ...
  this.runner.verifiedLastRunError = true;   // not in the step text
}
```

Without it, an After hook throws and the scenario fails. That's the same kind of hidden work that made Test 1's Edge 1 a **No** (Rule 2: something the scenario depends on that the text never mentions). The report gives Edge 1 a plain **Yes** for 10, 12 and 14.

You could argue this is test-tool bookkeeping rather than behaviour the scenario should describe. Even so, it's exactly what tripped the generator three times, so it should at least be a **"Yes, but"**.

### Flag 5 (softer): Test 2, Edge 1 is the only verdict decided by *which file* the code lives in

Test 2's Edge 1 is **No** because some steps are defined in shared step files. But:

- Test 1 has the same situation (`user is on home page` isn't in the dev file shown) and wasn't marked down for it.
- Test 6 includes the shared file (`tests/shared/common.steps.ts`) as part of the dev test.

If shared step files count as part of the dev test, as they do in Test 6, Test 2's Edge 1 becomes **"Yes, but"** (`user should see the subscription page` doesn't name what to look for, the same issue as Test 3). The Context Gap point for Test 2 still stands; it just belongs in the category column, not in Edge 1.

---

## Mismatch categories

This section groups every "No" and "Yes, but" in the original report by kind. A test marked with **\*** comes from the flags above, not from the original verdicts. "Re-run" means the revised-prompt rows.

### Edge 1: Scenario vs dev test

| Category | What it means | Tests |
|---|---|---|
| Hidden extra work | The dev code does something important that the step text never mentions | 1 (privacy policy, Continue button, random email); 10\*, 12\*, 14\* (`verifiedLastRunError`) |
| Wrong step role | A step written as an action is really a check, or the other way round | 7 |
| Step code in another file | The step has code, but in a shared file that wasn't shown | 2 (Test 1's `user is on home page` is the same case but wasn't counted) |
| Vague check (Yes, but) | A `Then` step doesn't say what to look at, where, or how many times | 3, 6, 14, 2\* |

Only 3 of the 20 tests get a plain "No" here. Edge 1 problems are mostly about how the scenario is worded, not about the dev code.

### Edge 2: Scenario vs gen test

These fall into four families.

**A. The step never reaches any code**

| Category | What it means | Tests |
|---|---|---|
| Step left unmapped | An `// UNMAPPED` comment or an empty stub instead of real code | 8 (1 step), 16, 19, 20 (every step), 2\* (2 stubs) |
| False "already exists" | Marked `// EXISTS`, but no such step is registered | 12, 20 |
| Step silently dropped | No code and no comment at all | 10, 12, 14 (re-runs only) |
| Pattern can't match the text | The pattern is written so that the step text never fits it | 5 (`(word)`), 9 (`(\d+)` vs backtick variables), 17, 18 (`"{string}"`), 20 (`<cbState>` not split into `check` / `uncheck`) |
| Two patterns match | Cucumber can't decide which code to run | 4, 5 (the dropped `(?!of type)`) |
| Code never registered | The code is wrapped in a form the test tool never loads | 20 (`module.exports = function () {}`) |

**B. The code breaks partway through**

| Category | What it means | Tests |
|---|---|---|
| Data table misread | The table is read in a shape it doesn't have | 6, 7 (`rowsHash()` on 4 columns), 11 (`rows()` drops the only row) |
| Invented function | Calls a function that doesn't exist | 4, 5 (`assertResponseDoesNotContainHeader`); 5 (`setRequestHeader`, see flag 3) |
| Wrong use of the test tool | The code misuses how the tool or library works | 5 (`callbackWithAssertion(this, …)`), 17 (promises never awaited) |

**C. The code runs but does the wrong thing**

| Category | What it means | Tests |
|---|---|---|
| Action missing or different | A step doesn't do what the scenario needs | 1\* (form never submitted), 7 (delete overwrites the saved create response), 17 (`I browse` opens the page instead of storing the base URL) |
| Missing side effect | Something the test tool expects is never set | 10, 14 (also 12 re-run) |
| Checks the wrong place | The check looks for the right value in the wrong spot | 6 (`json().message` instead of `statusMessage`) |

**D. The check proves nothing, or fails for the wrong reason**

| Category | What it means | Tests |
|---|---|---|
| Empty check that passes | A `Then` step with no body, so it always passes | 18 |
| Fails for a different reason | The scenario is meant to fail, and does, but not on its check | 5 |

**Not counted as mismatches:** a weaker check that still passes (3, 14), and less tolerant output matching (10, 13, 14).

### Edge 3: Dev vs gen code

| Part | Category | Tests |
|---|---|---|
| Setup | Data prepared differently | 1 (raw vs random email), 6, 7 (`hashes()[0]` vs `rowsHash()`), 11 (`raw()` vs `rows()`; read by header vs by position), 8 (target URL never set) |
| Main call | Call missing | 1 (privacy policy, Continue button), 10, 14 (flag never set; 12 re-run) |
| | Different call, different effect | 4, 5 (invented function), 7 (delete result replaces the create response), 17 (opens the page vs stores the base URL) |
| | Different call, same effect here (ignored) | 3 (`type` vs `fill`), 9 (`setRequestHeader` vs `addRequestHeader`) |
| Check | Different target | 2 (`filterTrigger()` vs `list()`), 3 (user menu vs URL), 6 (status message vs JSON field), 17 (page HTML vs text; visible vs count) |
| | Different strength | 14 (`=== 1` vs `> 0`); 10, 13, 14 (exact vs whitespace-tolerant matching) |
| | Check added or removed | 6 (extra `201` check), 7 (dev's `204` check dropped) |
| Pattern | Narrowed or hard-coded | 8 (`valid`, `200`), 9 (`\d+`), 17 (`an?` → `an`) |
| | Lookahead dropped | 4, 5, 9 |
| | Different capture | 5 (`(xml\|json)` → `(word)`), 17, 18 (`"{string}"`) |
| Coverage | Step missing in gen | 8, 12, 16, 19, 20 |
| | Extra step in gen | 11 (`hook has no attachments`), 1 (`user is on home page`), 2 (`user open the app` and others) |

### What stands out

- **Edge 2's biggest family is A, a step that never reaches any code.** It shows up in 11 of the 20 tests (2\*, 4, 5, 8, 9, 12, 16, 17, 18, 19, 20). These can be spotted without much judgement: check every step in the feature against the gen patterns and see whether exactly one matches. A small script could do this, so this part of Edge 2 can be automated after all.
- **Edge 3's most common difference is in the check:** a different target or a different strength, in 7 tests (2, 3, 6, 10, 13, 14, 17). These are the differences Edge 2 misses when the weaker check still passes.
- **Edge 1's problems are almost all about wording:** vague checks, or hidden work the text never mentions. These lead to the "Inadequate Scenario" category.

