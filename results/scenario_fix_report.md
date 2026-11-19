# Scenario Fix using Step Definition (Tests 1, 6, 7, 14)

Claude Opus 5.5 (`claude-opus-5-5`) was given each problematic scenario with its step definitions and asked to rewrite the scenario. Each scenario was prompted separately.

## Summary

| # | Test | Problems with the original scenario | How the fixed scenario addresses them |
|---|---|---|---|
| 1 | Registration | The registration step also generates a random email, accepts the privacy policy and clicks Continue, but does not say so. The message check is vague | States the random email, privacy-policy acceptance and Continue click in the registration step, and says the checked message is the title message |
| 6 | Create user API | The ID check and user-list check overstate what is asserted. The error step suggests an error in the response body, but the code checks the HTTP status code and status message | States that the ID is a string and that the user is in the first page of the paginated list. States the status code and status message checks |
| 7 | Delete user API | Deletion is written as `Given`, and the scenario omits its 204 status check | Changes deletion (action) to `When` and states the 204 response |
| 14 | tsflow hooks (scenario *Binding named hooks*) | The scenario states that each hook ran, but the code checks that it ran exactly once | Adds `exactly once` to the hook checks |

## Prompt

The two `<...>` lines are replaced with the scenario (and its Background) and the step definitions its steps bind to.

````text
Below is a Gherkin scenario and the step definitions that automate it.

## Scenarios
<the scenario to fix, with its Background if it has one>

## Step definitions
<the step definitions that the steps of this scenario bind to>

## Problem
The scenario does not accurately describe what the step definitions do. Some actions or checks performed by the step definitions are missing from the scenario, or are described imprecisely.

## Task
Rewrite the scenario so that it accurately describes what the step definitions do while making minimal neccessary changes.
Change a step only if a reader of the scenario would be misled about the behavior being tested.
While rewriting the scenario, do not create new steps which would make us change the step definitions as well.
Our goal is to change the steps in scenario but not the step definition.
It is fine to change the scenario step regex in the step definition but we should not split or merge the step definitions.
Output only the fixed scenario, and the fixed lines (step regex) in the step definition.
````

## Diffs

### Test 1: register a new user

```diff
--- a/original.feature
+++ b/fixed.feature
@@ -7,10 +7,10 @@ Feature: Scenarios related to register user
   @sanity
   Scenario Outline: register a new user
       Given user navigate to registration page
-      When the user enters the registration details "<firstName>", "<lastName>", "<email>", "<telephone>", "<password>", "<confirmPassword>", "<subscribe>"
-      Then user should see a message "Your Account Has Been Created!"
+      When the user enters the registration details "<firstName>", "<lastName>", "<email>", "<telephone>", "<password>", "<confirmPassword>", "<subscribe>" with a random 5-digit number substituted into the email, agrees to the privacy policy and clicks continue
+      Then user should see a title message "Your Account Has Been Created!"
       Then user logs out of application
-      Then user should see a message "Account Logout"
+      Then user should see a title message "Account Logout"
       Examples:
           | firstName | lastName | email              | telephone  | password | confirmPassword | subscribe |
           | John      | Doe      | john_{0}@email.com | 9876543210 | test321  | test321         | yes       |
```

```diff
--- a/original_steps.ts
+++ b/fixed_steps.ts
@@ -20,3 +20,3 @@ Given('user navigate to registration page', async function () {
 
-When('the user enters the registration details {string}, {string}, {string}, {string}, {string}, {string}, {string}',
+When('the user enters the registration details {string}, {string}, {string}, {string}, {string}, {string}, {string} with a random 5-digit number substituted into the email, agrees to the privacy policy and clicks continue',
     async function (firstName, lastName, email, telephone, password, confirmPassword, subscribe) {
@@ -28,3 +28,3 @@ When('the user enters the registration details {string}, {string}, {string}, {st
 
-Then('user should see a message {string}', async function (message) {
+Then('user should see a title message {string}', async function (message) {
     await new CommonPage(this.web).verifyTitleMessage(message);
```

### Test 6: I can create a user

```diff
--- a/original.feature
+++ b/fixed.feature
@@ -6,5 +6,5 @@ Feature: Create a user
       | email              | country | street      | postalCode |
       | john.doe@gmail.com | England | Road Avenue | 29145      |
     When I send a request to create a user
-    Then I receive my user ID
-    And I can see my user in a list of all users
+    Then I receive my user ID as a string
+    And I can see my user ID in the first page of the paginated list of all users
```

```diff
--- a/original_steps.ts
+++ b/fixed_steps.ts
@@ -19,3 +19,3 @@ When('I send a request to create a user', async function (this: ICustomWorld) {
 
-Then('I receive my user ID', function (this: ICustomWorld) {
+Then('I receive my user ID as a string', function (this: ICustomWorld) {
   assert.deepStrictEqual(typeof this.context.latestResponse!.json().id, 'string');
@@ -23,3 +23,3 @@ Then('I receive my user ID', function (this: ICustomWorld) {
 
-Then('I can see my user in a list of all users', async function (this: ICustomWorld) {
+Then('I can see my user ID in the first page of the paginated list of all users', async function (this: ICustomWorld) {
   const response = await this.server.inject({
```

### Test 6: I try to create a user with invalid data

```diff
--- a/original.feature
+++ b/fixed.feature
@@ -6,7 +6,7 @@ Feature: Create a user
       | email   | country   | street   | postalCode   |
       | <Email> | <Country> | <Street> | <PostalCode> |
     When I send a request to create a user
-    Then I receive an error "Bad Request" with status code 400
+    Then I receive a response with status code 400 and status message "Bad Request"
 
     Examples:
       | Email          | Country | Street      | PostalCode |
```

```diff
--- a/original_steps.ts
+++ b/fixed_steps.ts
@@ -25,4 +25,4 @@ import type { ICustomWorld } from '../support/custom-world.ts';
 Then(
-  /^I receive an error "(.*)" with status code (\d+)$/,
-  async function (this: ICustomWorld, errorMessage: string, statusCode: string) {
+  /^I receive a response with status code (\d+) and status message "(.*)"$/,
+  async function (this: ICustomWorld, statusCode: string, errorMessage: string) {
     assert.strictEqual(this.context.latestResponse!.statusCode, +statusCode);
```

### Test 7: I can delete a user

```diff
--- a/original.feature
+++ b/fixed.feature
@@ -8,5 +8,5 @@ Feature: Delete a user
 
   @user
   Scenario: I can delete a user
-    Given I send a request to delete my user
+    When I send a request to delete my user and receive a 204 No Content response
     Then I cannot see my user in a list of all users
```

```diff
--- a/original_steps.ts
+++ b/fixed_steps.ts
@@ -19,3 +19,3 @@ When('I send a request to create a user', async function (this: ICustomWorld) {
 
-Then('I send a request to delete my user', async function (this: ICustomWorld) {
+Then('I send a request to delete my user and receive a 204 No Content response', async function (this: ICustomWorld) {
   const response = await this.server.inject({
```

### Test 14: Binding named hooks

```diff
--- a/original.feature
+++ b/fixed.feature
@@ -37,5 +37,5 @@ Feature: Support for Cucumber hooks
           """
       When I run cucumber-js
       Then it passes
-      And the hook "setup environment" was executed on scenario "example"
-      And the hook "tear down environment" was executed on scenario "example"
+      And the hook "setup environment" was executed exactly once on scenario "example"
+      And the hook "tear down environment" was executed exactly once on scenario "example"
```

```diff
--- a/original_steps.ts
+++ b/fixed_steps.ts
@@ -59,3 +59,3 @@ class ScenarioSteps {
 
-  @then("the hook {string} was executed on scenario {string}")
+  @then("the hook {string} was executed exactly once on scenario {string}")
   public checkNamedHookExecution(hookName: string, scenarioName: string) {
```
