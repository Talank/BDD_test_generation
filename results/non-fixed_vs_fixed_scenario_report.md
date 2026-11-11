# Fixed-Scenario Re-run Report (Tests 1, 6, 7, 14)

Four tests from the original report had a scenario problem. Each scenario was rewritten and the generation re-run. This report compares the generated test **before** (original scenario) and **after** (fixed scenario).

Verdicts are by code inspection; no suite was executed.

| # | Test |  Category before → after | What is left to change|
|---|---|---|---|
| 1 | Registration | Inadequate Scenario → **Match** | It is a match but unique email identifier is still not mentioned in scenario|
| 6 | User create API | Generation Fault + Inadequate Scenario → **Generation Fault** | **Generated test**, use `{string}` for the quoted URL; assert `statusMessage` |
| 7 | User delete API | Generation Fault + Wrong Scenario → **Match** | None |
| 14 | tsflow hooks | Generation Fault + Inadequate Scenario → **same**  | **Scenario**, the "once" fix is still not applied; **Generated test**, bind the missing step, set the flag, assert `=== 1` |

**Overall:** 2 of 4 fixed (1, 7), 1 fixed in the targeted spot but broken by a new fault (6), 1 regressed with the scenario defect still in place (14).

---

## Test 1 , Registration Flow

**Scenario change:**

```diff
  When the user enters the registration details "<firstName>", ...
+ And the user agrees to the privacy policy
+ And the user clicks the Continue button
  Then the user should see the message "Your Account Has Been Created!"
```

```diff
- | John | john_{0}@email.com  | ... |
+ | John | john12345@email.com | ... |
```

**Both missing actions are now called:**

```diff
+ When('the user agrees to the privacy policy', async function () {
+     await new RegisterUserPage(this.web).agreePrivacyPolicy();
+ });
+ When('the user clicks the Continue button', async function () {
+     await new RegisterUserPage(this.web).clickContinueButton();
+ });
```

| | Dev test | Before | After |
|---|---|---|---|
| Email | Randomized | Raw `{0}` template | Fixed literal |
| Privacy policy | Agreed | **Not called** | Agreed (own step) |
| Form submission | Clicked | **Not called** | Clicked (own step) |
| Page-object argument | `this.web` | `this.page` | `this.web` |


**What is left:** the "unique email" rule was fixed by removing the placeholder, not by stating the rule. The dev test produces a new email every run; the new generated test registers the same two emails every run instead of new unique email generation.

---

## Test 6 , User Creation API

**Scenario change:** the three high-level steps became nine explicit ones.

```diff
- When I send a request to create a user
- Then I receive my user ID
- And I can see my user in a list of all users
+ When I send a POST request to "/api/v1/users" with the user profile data
+ Then the response contains a user ID as a non-empty string
+ And the response status code is 201
+ When I send a GET request to "/api/v1/users"
+ ...
```

**Thre previous issue got fixed which was parsing data table:**

```diff
- this.context.createUserDto = table.rowsHash();
+ this.context.createUserDto = dataTable.hashes()[0];
```

**Not fixed , the error text is still read from the body:**

```diff
  Then('the response status message is {string}', ...
-   assert.strictEqual(latestResponse!.statusMessage, errorMessage);   // dev test
+   assert.strictEqual(latestResponse!.json().message, message);       // before and after
```

The scenario now says "status message", which is the field's name to call but generated test still made the same mistake


---

## Test 7 , User Deletion API

**Scenario change:**

```diff
- Given I send a request to delete my user
- Then I cannot see my user in a list of all users
+ When I send a request to delete the created user
+ Then the user deletion response status code is 204
+ When I send a request to retrieve all users
+ Then the response status code is 200
+ And the list of all users does not contain the created user's ID
```

**All three faults are gone:**

| | Dev test | Before | After |
|---|---|---|---|
| Table parse | `hashes()[0]` | `rowsHash()` , throws | `hashes()[0]` |
| Delete returns 204 | Asserted | **Dropped** | Asserted (own step) |
| ID used in final check | Create response | **DELETE response (empty body)** | `createdUserId`, saved after create |

```diff
+ Then('the user creation response contains a user ID', function () {
+   this.context.createdUserId = userId;
+ });
  ...
-   users.data.some((item) => item.id === this.context.latestResponse?.json().id),
+   users.data.some((user) => user.id === this.context.createdUserId),
```


---

## Test 14 , Hooks (cucumber-tsflow)

For this test case, three generation exists. First, it was run with context gap (gen1). Second it re-run with proper context (gen2). Third, another re-run with fixed scenario (gen3)

**Scenario change:** mminor changes but doesnt address the main thing which is to specify hook counts:

```gherkin
And the hook "setup environment" was executed on scenario "example"
```

**So the hook count is still loose,** as expected:

```ts
if (executions.length === 0) { throw ... }   // dev test: executions.length === 1
```

**Result:** worse than both earlier generations, and not because of the scenario. The scenario edit did not touch the defect, and a different step goes missing in each generation, which points to maybe indeterminstic behavior of LLM itself
