# Natural language test smells in the 20 Gherkin test cases

This report checks all **655 steps** in 152 scenarios (and their Backgrounds) against two smell catalogs. Soares et al. 2023 is the primary catalog and Hauptmann et al. 2013 is secondary. Line numbers refer to `all_gherkin_scenarios.md` in the same folder. The full CSV report can be found also under the name `gherkin_smell_flags.csv`.

## Results

- **134 of 655 steps (20%) have a 2023 smell**, and 19 of those have at least one Clear flag. The rest are Possible, mostly judgement calls on Tacit Knowledge and Ambiguous Test.
- **443 more steps (68%) have only a 2013 smell**, almost all Hard-Coded Values or Test Clones.
- **78 steps (12%) have no flag.**
- **60 steps have a smell named in both papers.** All of them are Ambiguous Test. Conditional Test, the other shared smell, never occurs.
- **Structural smells are rare but clear-cut:** 8 Misplaced Action, 4 Misplaced Verification, 5 Unverified Action and 1 Misplaced Precondition.
- **The catalogs miss a common defect:** 22 steps put a user action in a Given, and neither paper names this. They are listed under [Issues neither catalog names](#Some-Issues-I-found-that-are-in-neither-of-the-test-cases).

### 2023 catalog (primary)

| Smell | In both papers? | Clear | Possible | Total |
|---|---|--:|--:|--:|
| Ambiguous Test | Yes | 5 | 55 | 60 |
| Conditional Test | Yes | 0 | 0 | 0 |
| Eager Action | No | 0 | 2 | 2 |
| Misplaced Action | No | 8 | 0 | 8 |
| Misplaced Precondition | No | 1 | 0 | 1 |
| Misplaced Verification | No | 4 | 0 | 4 |
| Tacit Knowledge | No | 0 | 63 | 63 |
| Unverified Action | No | 5 | 0 | 5 |

A step can have more than one smell, so totals add up to more than the number of flagged steps.

### 2013-only smells (secondary)

| Smell | Clear | Possible | Total | Steps where it is the final label |
|---|--:|--:|--:|--:|
| Hard-Coded Values | 220 | 225 | 445 | 394 |
| Long Test Steps | 19 | 0 | 19 | 19 |
| Test Clones | 214 | 0 | 214 | 181 |
| Inconsistent Wording | 0 | 7 | 7 | 6 |
| Badly Structured Test Suite | n/a | n/a | n/a | Not assessed |


### By test case

| Test case | Feature | Steps | 2023 smell | 2013-only | No flag |
|--:|---|--:|--:|--:|--:|
| 1 | Scenarios related to register user | 6 | 2 | 2 | 2 |
| 2 | Subscriptions | 12 | 0 | 9 | 3 |
| 3 | User Authentication tests | 10 | 2 | 0 | 8 |
| 4 | (no title) | 177 | 27 | 137 | 13 |
| 5 | (no title) | 39 | 2 | 31 | 6 |
| 6 | Create a user | 7 | 2 | 2 | 3 |
| 7 | Delete a user | 4 | 2 | 1 | 1 |
| 8 | (no title) | 4 | 2 | 2 | 0 |
| 9 | (no title) | 82 | 37 | 28 | 17 |
| 10 | Binding steps | 16 | 3 | 10 | 3 |
| 11 | Cucumber context objects | 28 | 5 | 21 | 2 |
| 12 | Extracing context objects from World externally | 20 | 3 | 12 | 5 |
| 13 | Support for Cucumber hooks | 30 | 6 | 24 | 0 |
| 14 | Support for Cucumber hooks | 89 | 15 | 74 | 0 |
| 15 | Tag parameters | 43 | 14 | 20 | 9 |
| 16 | I can test cucumber-mink simulated action features | 7 | 0 | 7 | 0 |
| 17 | I can use cucumber.mink to check the content of my website | 15 | 5 | 9 | 1 |
| 18 | I can use cucumber.mink to navigate through my website | 9 | 2 | 7 | 0 |
| 19 | Driver compatibilities | 29 | 0 | 25 | 4 |
| 20 | I can use cucumber.mink to fill in forms | 28 | 5 | 22 | 1 |

## How steps were flagged

**Priority.** Each step's `final_label` is its 2023 smell or smells if it has any, otherwise its 2013-only smell. Smells in both papers are tagged `both papers`. 2013-only smells stay visible in their own column even when a 2023 smell wins.

**Gherkin mapping.** Neither paper covers Gherkin, so I mapped it onto their test structure: Given is a precondition, When is an action, and Then is a verification. `And` and `But` take the section of the step above them.

**Confidence.**

- **Clear:** the step meets the paper's rule, metric or definition under this mapping, and reading it supports that.
- **Possible:** a judgement call, usually because the step fits a smell's definition but no syntactic rule fires.

| Smell | How it was checked |
|---|---|
| Ambiguous Test, Conditional Test | The paper's tool on every step, keyword scans (including the 2013 word lists), then reading each step |
| Eager Action | The paper's tool, then reading each step |
| Misplaced Action, Misplaced Verification | Each step's meaning compared with its Gherkin section, plus the paper's tool for Misplaced Action |
| Unverified Action | An action with no verification before the next `Given` or the end of the scenario, compared with the paper's tool |
| Misplaced Precondition | The paper's tool, then its definition |
| Tacit Knowledge | Judgement only. The paper's tool doesn't implement it, and no glossary was available |
| Long Test Steps | The 2013 metric: more than 50 words, including attached doc strings and tables |
| Hard-Coded Values | The 2013 metric: more than 10% of a scenario's words are quoted or numeric (Clear). The same threshold counting unquoted literals gives Possible |
| Test Clones | The 2013 metric: a run of at least 30 words appearing twice with under 10% gap, using my own approximate matcher |
| Inconsistent Wording | Judgement only. I did not run the paper's WordNet metric |


## Some Issues I found that are in neither of the test cases

These are in the `notes_outside_catalog` column. They are not counted as smells, because forcing them into a category would misrepresent the papers.

- **User action written as a precondition (22 steps):** for example `Given I send a request to delete my user` (line 527) is the action under test. Misplaced Precondition is the reverse case. Lines: 15, 33, 34, 38, 44, 45, 57, 58, 61, 62, 67, 68, 527, 2370, 2375, 2380, 2385, 2391, 2395, 2399, 2403, 2458.
- **Verification before the action (8 steps):** a `Then` appears before the scenario's main action, for example lines 2296 and 2297.
- **Second test cycle in one scenario (7 steps):** a `Given` follows a `Then`, as in Test case 19 and line 653.
- **Assertions that can never fail (9 steps):** the step checks that the output lacks a string that appears nowhere in that scenario's fixture, which looks like copy-paste residue. Lines: 1535, 1580, 1617, 1663, 1822, 1869, 1946, 1993, 2037.
- **Data that looks inconsistent (line 665):** lines 658 and 662 send `argument1` as the parameter's value, but this step expects `1`.
- **Scenarios that seem meant to fail (Test case 5):** assertions such as `response code should be 400` on `/get` look intentional, given the `Test output` titles and `@console` tag. Nothing in the steps says so, and I didn't flag them for it.


## Sources

- Soares et al., *Manual Tests Do Smell! Cataloging and Identifying Natural Language Test Smells*, 2023 (`2308.01386v1.pdf`).
- Hauptmann et al., *Hunting for Smells in Natural Language Tests*, ICSE 2013 (`2013-hunting-for-smells-in-natural-language-tests.pdf`).
- Manual Test Sensei: https://github.com/easy-software-ufal/manual-test-sensei
