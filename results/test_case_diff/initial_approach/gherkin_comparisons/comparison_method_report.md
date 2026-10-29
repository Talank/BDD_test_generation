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

Apart from using gherkin as the ground truth here, We added an extra judgement. Since there's no way to know if the generated step code is valid or not, we compare it with dev test to assess if it would reach the endgoal of the scenario in a valid way. We don't compare the two test cases as its thoroughly done in E3 but we try to assess the validity of gen test. Such an example is inventing functions names which if happened, the test doesn't make it to the end.

> **Edge 2 = Yes** if passes criterias of edge 1 and only if **every** scenario would reach the end, as it would with the dev code.
> Otherwise **No**, written as "X / N scenarios unchanged".

Using dev code as the reference answer is a choice we took because Edge 1 is (almost always) Yes.



### What makes a scenario non-match


| Rule | Example |
|---|---|
| A step has no code, or is left as an `UNMAPPED` comment | Test 8 (1 of 4 steps), Tests 16, 19, 20 (all steps) |
| A step code's pattern can't match the step text | Test 9: `(\d+)` can't match `` `myCode` ``; Tests 17, 18: `"{string}"` never matches |
| Two patterns match the same step | Tests 4, 5: the dropped `(?!of type)` lookahead |
| The code crashes in setup | Tests 6, 7: `rowsHash()` on a 4-column table |
| The code reads the wrong data | Test 11: `rows()` drops the only row of a headerless table |
| Missing helper functions | Tests 10, 14: `verifiedLastRunError` never set, so the After hook throws |
| Inventing functions | Test 4: `assertResponseDoesNotContainHeader` |
| Empty assertion or Tautology | Test 18: "goes green without asserting anything" |

Edge 2 can either be categorized into Generation fault or Context Gap. When Edge 2 is No, choosing between **Generation Fault** and **Context Gap** depends on one question: *was the missing piece visible in the prompt?*

### Wiggle room

- **A weaker assertion that still passes on the normal path.** Test 14: `>= 1` instead of `=== 1` is counted as "weakened", not broken. Test 3: the URL check is "weak", but Edge 2 is still Yes.
- **Being less tolerant of small output differences.** Test 13: exact substring count instead of the whitespace-tolerant helper is "at risk", not broken, so Edge 2 stays **Yes**.

### Flag

The scenario fails for a different reason | Test 5: the scenarios are meant to fail, and they do, but with a crash instead of the assertion message. Counted as non-match.
 
---

## Edge 3: Do the dev and gen tests match?

**The question:** lay the two step definitions side by side. Are they the same code in every way that matters?

Edge 2 and Edge 3 ask different things. Edge 2 asks how each **scenario** would end. Edge 3 asks whether the **code** is the same. So Edge 3 catches differences that don't change any result *in this feature* but would on other inputs (Test 8: hard-coded `valid` and `200`; Test 13: exact instead of whitespace-tolerant matching). That's why Edge 3 is often "No" even when Edge 2 is close.

### The rules

For each step, compare the three parts:

| Part | Same if | Example of "different" |
|---|---|---|
| Setup | the same data is prepared the same way | Test 1: email randomized vs raw |
| Main call | the same call is made, or one with an identical effect here | Test 1: `agreePrivacyPolicy` / `clickContinueButton` missing |
| Check | the same **target** is checked with the same **strength** | Test 2: `filterTrigger()` vs `list()`. Test 3: user menu vs URL. Test 14: `=== 1` vs `> 0` |



---

## How the three edges fit together


| Edge 1 | Edge 2 | Edge 3 | Category | Tests |
|---|---|---|---|---|
| Yes | Yes | Yes | Match | 15 |
| Yes | Yes | Mostly | Context Gap / mild Generation Fault | 13 |
| Yes | No | No | Generation Fault or Context Gap (see below) | 4, 5, 8–12, 16–20 |
| Yes, but | No | No | Generation Fault + Inadequate Scenario | 6, 14 |
| Yes, but | Yes | No | Inadequate Scenario. The generator followed the text; the developer did more than the text says | 1, 3 |
| No | No | No | Wrong Scenario + Generation Fault | 7 |


---
