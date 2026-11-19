# Scenario review against step definitions (20 initial + 10 cukedoctor test cases)

We prompted Claude Opus 5.5 (`claude-opus-5-5`, adaptive thinking, effort `high`) with `scenario_stepdef_review_prompt.md` for 30 test cases. For each case, `{{scenario}}` was the original Gherkin (the whole feature file, including its Background) and `{{step_definitions}}` was the developer-written step definitions:

- **initial (T1–T20):** `test_case_N.md`, sections *Gherkin scenario* and *Original test*.
- **Java(Cukedoctor) (C1, C4, C8, C9, C12, C16–C20)**

## Summary

| | initial (20) | Cukedoctor (10) | Total (30) |
|---|---|---|---|
| Test Cases with ≥ 1 issue | **16** | **7** | **23 (77%)** |
| Cases with no issue (cosmetic edits only) | 4 (T8, T16, T17, T18) | 3 (C4, C8, C9) | 7 |
| Issue instances | 66 | 32 | 98 |

### Distribution of issue types


| ID | Issue | initial cases | Cukedoctor cases | **Total cases** | Instances |
|---|---|---|---|---|---|
| 4 | Vague Then' | 11 | 6 | **17** | 30 |
| 2 | Hidden actions in the step | 4 | 6 | **10** | 12 |
| 1 | Wrong Given/When/Then keyword | 9 | 0 | **9** | 22 |
| 3 | Hidden check in Given/When | 3 | 3 | **6** | 23 |
| 5 | Hidden exact count | 3 | 3 | **6** | 10 |
| 6 | Depends on another scenario | 1 | 0 | **1** | 1 |


---

## Example fixes for each category of issue

One diff per issue type, excerpted from the original and revised scenarios.

### 1. Wrong keyword (T20)
`I check` / `I uncheck` are actions but were written as `Then`.

```diff
   Scenario: I can check a checkbox
     Given I am on "/form"
     Then I should see "Form Page"
-    Then the "#cb" checkbox should not be checked
-    Then I check "#cb"
+    And the "#cb" checkbox should not be checked
+    When I check "#cb"
     Then the "#cb" checkbox should be checked
-    Then I uncheck "#cb"
+    When I uncheck "#cb"
     Then the "#cb" checkbox should not be checked
```

### 2. Hidden actions (C16)
`I run Cukedoctor` also runs Cucumber and sets every step duration to zero before running Cukedoctor.

```diff
     And I am hiding step timings
     And all Cukedoctor extensions are disabled
-    When I run Cukedoctor
+    When I run Cucumber on the Features
+    And I set all step durations to zero
+    And I run Cukedoctor on the Cucumber results
```

### 3. Hidden check in Given/When (C1)
The Given asserts that the JSON fixture file exists, and `I convert the Feature` asserts that exactly 1 Feature was parsed. Both became separate Then steps.

```diff
   Scenario: Logging a string in Cucumber-JVM 6.7.0
-    Given a Step has logged a string in Cucumber-JVM 6.7.0
-    And I am hiding step timings
+    Given the Cucumber JSON output of a Step that has logged a string in Cucumber-JVM 6.7.0
+    And step timings are hidden
     And all Cukedoctor extensions are disabled
-    When I convert the Feature
-    Then it will be rendered as
+    When I parse the Cucumber JSON output and render its Features
+    Then the Cucumber JSON output file was found
+    And exactly 1 Feature was parsed from the Cucumber JSON output
+    And the rendered document will be exactly
```

### 4. Vague Then (T6)
`"Bad Request"` is compared with the HTTP status message, not with an error in the response body.

```diff
-    When I send a request to create a user
-    Then I receive an error "Bad Request" with status code 400
+    When I send a POST request to "/api/v1/users" with the user profile data
+    Then the response has status code 400
+    And the response has status message "Bad Request"
```

### 5. Hidden exact count (T11)
The code compares the whole attachment list with `toEqual`, so the count and the order must both match.

```diff
         When I run cucumber-js
-        Then it passes
-        And scenario "example" "Before" hook has the attachments:
+        Then the cucumber-js run completes without an error
+        And scenario "example" "Before" hook has exactly the attachments, in order:
             | DATA            | MEDIA TYPE        | MEDIA ENCODING |
             | my first string | text/plain+custom | IDENTITY       |
-        And scenario "example" "After" hook has the attachments:
+        And scenario "example" "After" hook has exactly the attachments, in order:
```

### 6. Depends on another scenario (T4)
*Using access token* relied on the token stored by the previous scenario. The two were merged.

```diff
-  Scenario: Access token retrieval from response body (authorization code grant, password, client credentials)
+  Scenario: Access token retrieval from response body and usage as bearer token (authorization code grant, password, client credentials)
     Given I set Token header to token123
     When I GET /get
-    Then I store the value of body path $.headers.Token as access token
-
-  Scenario: Using access token
-    Given I set bearer token
-    When I GET /get
+    And I store the value of body path $.headers.Token as access token
+    And I set bearer token
+    And I GET /get
     Then response body path $.headers.Authorization should be Bearer token123
```

---

## Issues found, fixed and remaining


| ID | Issue | Found | Fixed | Remaining |
|---|---|---|---|---|
| 1 | Wrong keyword | 19 | 19 | 0 |
| 2 | Hidden actions | 11 | 11 | 0 |
| 3 | Hidden check in Given/When | 11 | 9 | 2 |
| 4 | Vague Then | 33 | 25 | 8 |
| 5 | Hidden exact count | 8 | 8 | 0 |
| 6 | Depends on another scenario | 1 | 1 | 0 |
| | **Total** | **83** | **73** | **10** |


---

## Concerns
 **Changes with no issue behind them.** In the 5 cases with no issue (T8, T16, C4, C8, C9), the LLM still edited the scenario (titles, whitespace, wording). It never returned the original unchanged.
