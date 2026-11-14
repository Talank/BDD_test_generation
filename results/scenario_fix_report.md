# Scenario Fix using Step Definition (Tests 1, 6, 7, 14)

We prompted an LLM (Claude Opus 5.5) to rewrite the scenarios for Tests 1, 6, 7, and 14. For each test, we provided the original scenario and the developer's step definitions (linked to the steps of the scenario that we want to fix) and asked the LLM to make the scenario accurately describe the step definitions.

## Summary

| # | Test | Problems with the original scenario | How the fixed scenario addresses them |
|---|---|---|---|
| 1 | Registration | The registration step omits privacy-policy acceptance, clicking Continue, and random email generation. Logout action is written as `Then` | Adds separate steps for the omitted actions, describes the random email value, and changes logout step to `When` |
| 6 | Create user API | Steps omit request details | Specifies the HTTP requests, request body |
| 7 | Delete user API | Deletion is written as `Given`, and the scenario omits its 204 status check and the GET request used to verify deletion | Changes deletion (action) to `When` and states the status check and GET request |
| 14 | tsflow hooks (scenario *Binding named hooks*) | The scenario states that each hook ran, but the code checks that it ran exactly once | Adds `exactly once` to the hook checks to make the step clearer |

---

## Test 1: Registration (`VinayKumarBM/playwright-cucumber-sample`)

Feature file: `features/web/register_user.feature`

**Known problem** (from `non-fixed_vs_fixed_scenario_report.md`): the scenario omits privacy-policy acceptance, clicking Continue, and the email-generation rule. **These omissions are addressed** in the first two rows below.

| Problem with the original scenario | Fix in the updated scenario |
|---|---|
| The registration step also accepts the privacy policy and clicks Continue, but does not describe these actions. | Splits the scenario step and its definition into three steps: enter details, accept the privacy policy, and click Continue. |
| The scenario omits the replacement of `{0}` in the email with a random 5-digit number. | States that a random 5-digit number is inserted into the email. |
| Logout is an action written as `Then`. | Changes logout to `When` in the scenario and step definition. |
| Message checks are vague, and navigation steps describe states rather than actions. | Specifies title-message checks and explicitly describes navigation. |

### Scenario diff

```diff
diff --git a/original.feature b/fixed.feature
--- a/original.feature
+++ b/fixed.feature
@@ -2,17 +2,19 @@
 Feature: Scenarios related to register user
 
     Background:
-        Given user is on home page
+        Given the user navigates to the home page
 
     @regression
     @sanity
     Scenario Outline: register a new user
-        Given user navigate to registration page
-        When the user enters the registration details "<firstName>", "<lastName>", "<email>", "<telephone>", "<password>", "<confirmPassword>", "<subscribe>"
-        Then user should see a message "Your Account Has Been Created!"
-        Then user logs out of application
-        Then user should see a message "Account Logout"
+        Given the user navigates to the register user page
+        When the user enters the registration details "<firstName>", "<lastName>", "<email>" with a random 5-digit number inserted, "<telephone>", "<password>", "<confirmPassword>", "<subscribe>"
+        And the user agrees to the privacy policy
+        And the user clicks the continue button
+        Then the title message should be "Your Account Has Been Created!"
+        When the user logs out
+        Then the title message should be "Account Logout"
         Examples:
             | firstName | lastName | email              | telephone  | password | confirmPassword | subscribe |
             | John      | Doe      | john_{0}@email.com | 9876543210 | test321  | test321         | yes       |
            | Jane      | Doe      | jane_{0}@email.com | 4321098765 | test123  | test123         | no        |
```

---

## Test 6: Create user API (`marcoturi/fastify-boilerplate`)

Feature file: `tests/user/create-user/create-user.feature`

| Problem with the original scenario | Fix in the updated scenario |
|---|---|
| `Given user profile data` omits how the data is used. | States that the first table row supplies the create-user request body. |
| The create-user step omits the HTTP method and endpoint. | Specifies a POST request to `/api/users` with the prepared request body. |
| `Then I receive my user ID` overstates the assertion, which only checks the type of `id`. | States that the response body contains an `id` of type string. |
| The user-list check omits the GET request used to retrieve users. | Specifies a GET request to `/api/users` and checks for a user with the returned ID. |
| The error step suggests a response-body check, but the code checks the HTTP status code and status message. | Explicitly states both status checks and reorders the step-definition parameters to match. |

### Scenario diff

```diff
diff --git a/original.feature b/fixed.feature
--- a/original.feature
+++ b/fixed.feature
@@ -2,20 +2,20 @@ Feature: Create a user
 
   @user
   Scenario: I can create a user
-    Given user profile data
+    Given the create-user request body is the first row of the user profile data
       | email              | country | street      | postalCode |
       | john.doe@gmail.com | England | Road Avenue | 29145      |
-    When I send a request to create a user
-    Then I receive my user ID
-    And I can see my user in a list of all users
+    When I send a POST request to "/api/users" with the create-user request body
+    Then the response body contains an "id" of type string
+    And the users returned by a GET request to "/api/users" include a user with that id
 
   @user
   Scenario Outline: I try to create a user with invalid data
-    Given user profile data
+    Given the create-user request body is the first row of the user profile data
       | email   | country   | street   | postalCode   |
       | <Email> | <Country> | <Street> | <PostalCode> |
-    When I send a request to create a user
-    Then I receive an error "Bad Request" with status code 400
+    When I send a POST request to "/api/users" with the create-user request body
+    Then the response has status code 400 and status message "Bad Request"
 
     Examples:
       | Email          | Country | Street      | PostalCode |
```

---

## Test 7: Delete user API (`marcoturi/fastify-boilerplate`)

Feature file: `tests/user/delete-user/delete-user.feature`

| Problem with the original scenario | Fix in the updated scenario |
|---|---|
| The create-user step omits which data is sent. | States that the request uses the profile data. |
| Deletion is the action under test, but uses `Given` in the scenario and `Then` in the step definition. | Changes both to `When`. |
| The delete step omits the assertion that the response status is 204. | States the expected status and passes it as an `{int}` parameter to the existing assertion. |
| The final check omits the GET request used to retrieve users. | States that the user must be absent from the list returned by the request. |


### Scenario diff

```diff
diff --git a/original.feature b/fixed.feature
--- a/original.feature
+++ b/fixed.feature
@@ -4,9 +4,9 @@ Feature: Delete a user
     Given user profile data
       | email              | country | street      | postalCode |
       | john.doe@gmail.com | England | Road Avenue | 29145      |
-    When I send a request to create a user
+    When I send a request to create a user with the profile data
 
   @user
   Scenario: I can delete a user
-    Given I send a request to delete my user
-    Then I cannot see my user in a list of all users
+    When I send a request to delete my user and the response status code is 204
+    Then my user is not in the list of all users returned by a request to get all users
```

---

## Test 14: Cucumber hooks (`timjroberts/cucumber-js-tsflow`)

Feature file: `cucumber-tsflow-specs/features/hooks.feature`, scenario **Binding named hooks**


| Problem with the original scenario | Fix in the updated scenario |
|---|---|
| The hook step states only that the hook ran, while the code checks that it ran exactly once. | Adds `exactly once` to the step. |
| `Then it passes` is vague about what is checked. | States that the cucumber-js run finishes without an error. |
| File-creation and execution steps omit the target directory and project. | Specifies that files are written to the test project directory and cucumber-js runs on that project. |


### Scenario diff

```diff
diff --git a/original.feature b/fixed.feature
--- a/original.feature
+++ b/fixed.feature
@@ -1,40 +1,40 @@
     @newApis
     Scenario: Binding named hooks
-        Given a file named "features/a.feature" with:
+        Given the file "features/a.feature" is written to the test project directory with content:
             """feature
             Feature: Feature
                 Scenario: example
                     Given a step
             """
-        And a file named "step_definitions/steps.ts" with:
+        And the file "step_definitions/steps.ts" is written to the test project directory with content:
             """ts
             import {binding, given, before, after} from 'cucumber-tsflow';
 
             @binding()
             class Steps {
                 private state = 'hook has not executed';
 
                 @before({name: 'setup environment'})
                 public before() {
                     this.state = 'before hook executed';
                 }
 
                 @given("a step")
                 public given() {
                     console.log(this.state);
                     this.state = 'step has executed';
                 }
 
                 @after({name: 'tear down environment'})
                 public after() {
                     console.log(this.state);
                 }
             }
 
             export = Steps;
             """
-        When I run cucumber-js
-        Then it passes
-        And the hook "setup environment" was executed on scenario "example"
-        And the hook "tear down environment" was executed on scenario "example"
+        When cucumber-js is run on the test project
+        Then the cucumber-js run finishes without an error
+        And the hook "setup environment" was executed exactly once on scenario "example"
+        And the hook "tear down environment" was executed exactly once on scenario "example"
```
