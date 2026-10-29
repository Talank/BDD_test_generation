# How the Three Edges Were Judged

We evaluated 20 test cases for this experiment, drawing them from the GWT dataset introduced in the [GWT dataset paper](https://dl.acm.org/doi/full/10.1145/3793302.3793308).

**Methodology for Selecting the Projects**:

The initial selection process began by filtering the dataset for projects that used Playwright, Cucumber, and GitHub Actions workflows. However, the repositories identified through these filters were primarily starter or tutorial repositories, or personal hobby projects. To identify more representative real-world projects, we broadened the search by removing these filters and sorting the resulting repositories by their GitHub star counts.

Each repository was then evaluated against the following three criteria:

1. Is the repository currently not archived?
2. Does the repository represent a real-world project or tool, rather than a template, starter repository, or tutorial?
3. Does the Gherkin code belong to the project's own test suite, rather than consisting of dummy examples or being bundled for an unrelated purpose?

The highest-ranked repositories that satisfied all three criteria were selected for the experiment.

The first three test cases came from the initial filtered selection. Test cases 4–20 were selected from the repositories identified through the expanded search and subsequent evaluation.

The full list of candidate repositories, sorted by GitHub stars, along with their reasoning, is available here: **https://github.com/Talank/BDD_test_generation/blob/master/playwright-github_actions-projects/output/all_projects_by_stars_with_reasoning.csv**.

The finally selected four Javascript repos are available here - https://github.com/Talank/BDD_test_generation/blob/master/playwright-github_actions-projects/output/selected_projects_after_reasoning.csv

We selected four repository and 20 test cases from those as a proof of concept to see if our experiments can produce significant results. 

### Things that never count as a difference

The report ignores these on every edge, in every test:

- Code style like variable names etc.
- The keyword difference in Gherkin like Given instead of Then etc.
- Error messages.
- Unused imports, variables etc which doesn't affect test flow.
- Swapping one call for another that gives the same result (Test 3: `type` vs `fill`).

---

## Edge 1: Does the scenario match the dev test?

**What is being compared here in this edge:** One feature file to its step definitions (test code). A feature file can have one or multiple scenarios. So the mapping is scenario's steps ↔ the dev step definitions those steps call

**How I approached it:** if you read only the step text, would you expect the code the developer wrote?

It is the only edge that judges the *scenario*. A "No" here almost always becomes the "Inadequate Scenario" or "Wrong Scenario" category.


| # | Rule | Verdict if the rule isnt followed | Example | Tests that violate it |
|---|---|---|---|---|
| 1 | **Every step has code.** Each step in the scenario has a matching definition in the dev files shown. | No (Incomplete Implementation) | Test 2: "Scenario contains steps that are configured in the shared steps files instead of the test file" | 2 |
| 2 | **No extra code.** The code doesn't do something important that the text never mentions | No(Inadequate Scenario) | Test 1: dev code also randomizes the email, agrees to the privacy policy and clicks Continue. None of that is in the step text, and whole test case depends on it. | 1 |
| 3 | **Defined role.** A step written as setup or action must not secretly be a check, and vice versa. | No (Wrong Scenario) | Test 7: `Given I send a request to delete my user` reads as an action, but the dev code also asserts `204`.so its not following the defined | 7 |
| 4 | **Assertion mentioned explicitly** | **Yes, but** (still counted as Yes, flagged as a minor scenario problem) | Test 3: "Login should be success" doesn't say what proves success. Test 6: "error 'Bad Request'" doesn't say where the text appears. Test 14: "was executed" doesn't say *once*. | 2, 3, 6, 14 |

### Wiggle Room

- **A natural reading of the text is fine.** Test 17: `I browse "..."` only stores the base URL and doesn't open it. The text doesn't say so, but the relative paths in later steps make it clear, so it gets a **Yes**.
- **Assertion being stricter than the scenario mentions is allowed** as long as it is the same kind of check. Test 14's dev code checks "exactly once" for "was executed", so **Yes, but**, not No.

### Flag
1. Example: Test 2: "Scenario contains steps that are configured in the shared steps files instead of the test file". This is a common strategy in repos, should I keep it as non-match or allow shared steps and move it into wiggle room third point? 

2. Any other criterias for wrong scenario? apart from rule 3?

---

## Edge 2: Does the scenario match the gen test?

**What is being compared here in this edge:** One feature file to its step definitions (test code). A feature file can have one or multiple scenarios. So the mapping is scenario's steps ↔ the generated step definitions those steps call

Apart from using gherkin as the ground truth here, We added an extra judgement. Since there's no way to know if the generated step code is valid or not, we compare it with dev test to assess if it would reach the endgoal of the scenario in a valid way. We don't compare the two test cases as its thoroughly done in E3 but we try to assess the validity of gen test. Such an example is inventing functions names which if happened, the test doesn't make it to the end.

> **Edge 2 = Yes** if passes criterias of edge 1 and only if **every** scenario would reach the end, as it would with the dev code.
> Otherwise **No**, written as "X / N scenarios unchanged".

Using dev code as the reference answer is a choice we took because Edge 1 is (almost always) Yes.



### What makes a scenario non-match


| Rule | Example | Tests that violate it |
|---|---|---|
| A step has no code, or is left as an `UNMAPPED` comment | Test 8 (1 of 4 steps), Tests 16, 19, 20 (all steps) | 8, 12, 16, 19, 20; re-runs of 8, 10, 12, 14 |
| A step code's pattern can't match the step text | Test 9: `(\d+)` can't match `` `myCode` ``; Tests 17, 18: `"{string}"` never matches | 5, 9, 17, 18 |
| The code crashes  | Tests 6, 7: `rowsHash()` on a 4-column table | 5, 6, 7, 17 |
| The code reads the wrong data | Test 11: `rows()` drops the only row of a headerless table | 6, 7, 11 |
| Missing helper functions | Tests 10, 14: `verifiedLastRunError` never set, so the After hook throws | 10, 14; re-runs of 10, 12 |
| Inventing functions | Test 4: `assertResponseDoesNotContainHeader` | 4, 5 |
| Empty assertion or Tautology | Test 18: "goes green without asserting anything" | 18 |

Edge 2 can either be categorized into Generation fault or Context Gap. When Edge 2 is No, choosing between **Generation Fault** and **Context Gap** depends on one question: *was the missing piece visible in the prompt?*

### Wiggle room

- **A weaker assertion that still passes on the normal path.** Test 14: `>= 1` instead of `=== 1` is counted as "weakened", not broken. Test 3: the URL check is "weak", but Edge 2 is still Yes.
- **Being less tolerant of small output differences.** Test 13: exact substring count instead of the whitespace-tolerant helper is "at risk", not broken, so Edge 2 stays **Yes**.

### Flag

The scenario fails for a different reason | Test 5: the scenarios are meant to fail, and they do, but with a crash instead of the assertion message. Counted as non-match.
 
---

## Edge 3: Do the dev and gen tests match?

**What is being compared here in this edge:** Each developer written step definition to its generated counterpart for one test. 

**The question:** lay the two step definitions side by side. Are they the same code in every way that matters?

Edge 2 and Edge 3 ask different things. Edge 2 asks how each **scenario** would end. Edge 3 asks whether the **code** is the same. So Edge 3 catches differences that don't change any result *in this feature* but would on other inputs (Test 8: hard-coded `valid` and `200`; Test 13: exact instead of whitespace-tolerant matching). That's why Edge 3 is often "No" even when Edge 2 is close.

### The rules

For each step, compare the three parts:

| Part | Same if | Example of "different" | Tests that violate it |
|---|---|---|---|
| Setup | the same data is prepared the same way | Test 1: email randomized vs raw | 1, 6, 7, 8, 11 |
| Main call | the same call is made, or one with an identical effect here | Test 1: `agreePrivacyPolicy` / `clickContinueButton` missing | 1, 4, 5, 7, 10, 12, 14, 16, 17, 19, 20 |
| Check | the same **target** is checked with the same **strength** | Test 2: `filterTrigger()` vs `list()`. Test 3: user menu vs URL. Test 14: `=== 1` vs `> 0` | 2, 3, 5, 6, 7, 10, 13, 14, 17, 18 |



---

## Categorization


| Edge 1 | Edge 2 | Edge 3 | Category | Tests |
|---|---|---|---|---|
| Yes | Yes | Yes | Match | 15 |
| Yes | Yes | Mostly | Context Gap / mild Generation Fault | 13 |
| Yes | No | No | Generation Fault or Context Gap (see below) | 4, 5, 8–12, 16–20 |
| Yes, but | No | No | Generation Fault + Inadequate Scenario | 6, 14 |
| Yes, but | Yes | No | Inadequate Scenario. The generator followed the text; the developer did more than the text says | 1, 3 |
| No | No | No | Wrong Scenario + Generation Fault | 7 |


---
| Edge | Question | Can it be automated? |
|---|---|---|
| 1 | Does the scenario match the dev test?| Requires human judgement |
| 2 | Does the scenario match the gen test? | Same  |
| 3 | Do the dev and gen tests match? | Partly, maybe with metrics like code coverage etc |
