# Test Case Comparison Report



| # | Test | 1. Does Scenario match dev test? | 2. Does Scenario match gen test? | 3. Does two tests match | 4. Category | 5. What should change |
|---|---|---|---|---|---|---|
| 1 | Registration | **No.** (a) Test does more than the scenario says | **Yes** it matches every step but dont do the extra steps like the dev test| **No.** Setup differs (raw vs randomized email); 2 actions missing; assertion matches. | Inadequate Scenario | **Scenario** , explicitly add the extra steps and unique email rule  |
| 2 | Subscription | **No.** Scenario contains steps that are configured in the shared steps files instead of the test file | **Yes.** | **No.** Assertion target differs (`filterTrigger` vs `list`); shared steps that the dev repo implements elsewhere exist only as stubs in the generated file; matched steps are equivalent. | Inadequate Scenario + Context Gap (shared steps not shown to generator). | **Scenario** , name the observable (e.g. "user should see the subscription filter"); **Context** , show shared step files to the generator. |
| 3 | Login | **Yes** but it doesnt specify the assertion| **Yes.** again, the assertion, everything matches but assertion is wrong as it fails to check the logged in status of user | **No.** Assertion differs (user menu vs URL); | Inadequate Scenario  | **Scenario**, define the success observable (e.g. "user menu shows the username"); |
| 4 | apickli @core | **Yes.**  | **No , 48/51 scenarios unchanged.** but invented a nonexistent API; both array-validation scenarios fail (b) None. | **No.** apart from the two concern mentioned previously | Generation Fault | **Generated** |
| 5 | apickli @console | **Yes.**  | **No , 14/15 scenarios produce the wrong outcome type.**  | **No.** Setup method, assertion harness, and two regexes all are diff. | Generation Fault. | **Generated** , fix the method name, inline throws (as Test 4's generation did), restore `(xml|json)` and the regex. |
| 6 | User create API | **Yes.** but it doesn't specify assert | **No.** (a) `rowsHash()` throws on the feature's 4-column table , every scenario dies at the `Given`; `json().message` holds the validation detail, not "Bad Request"; a `201` the scenario never states is asserted. (b) Nothing left unimplemented. | **No.** |Generation Fault + Inadequate Scenario| **Generated** , fix table parse, assert `statusMessage`; **Scenario** , say where the error text appears. |
| 7 | User delete API | **No** Test does the opposite of what scenario says in one step | **No.** Same problem as test case 6's rowhash() | **No.** | Generation Fault + Wrong Scenario | **Generated** fix table parse like 6 **Scenario** , phrase the delete as a `When` and add an explicit verification `Then`. |


## Test 1 , Registration Flow (Inadequate Scenario)

Repo - https://github.com/VinayKumarBM/playwright-cucumber-sample

**Focal method matches.** `enterRegistrationDetails()` is called identically in both versions.

**But two required actions are missing after it:**

```diff
  await new RegisterUserPage(this.page).enterRegistrationDetails(...);
- await new RegisterUserPage(this.page).agreePrivacyPolicy();
- await new RegisterUserPage(this.page).clickContinueButton();
```

**Setup is also weaker** , original randomizes the email to avoid duplicate-user failures; generated uses it raw:

```diff
- email = StringUtil.formatString(email, StringUtil.randomNumberString(5));
  await enterRegistrationDetails(firstName, lastName, email, ...);
```

| | Original | Generated |
|---|---|---|
| Email setup | Randomized | Raw |
| Privacy policy | Agreed | **Not called** |
| Form submission | Clicked | **Not called** |

**Result:** Form is filled but never submitted.

### Why the actions were missed

Both methods are in the catalog:

```
// - RegisterUserPage#async agreePrivacyPolicy()
// - RegisterUserPage#async clickContinueButton()
```

But the feature file never asks for them:

```gherkin
When the user enters the registration details "<firstName>", "<lastName>", "<email>", ...
Then user should see a message "Your Account Has Been Created!"
```

Nothing tells the model the `When` must also satisfy the `Then`.

**Also Rule 7 from the prompt dictates the opposite:**

```
7. THINNESS: when a single DSL function performs the step, the body is that ONE
   call , prefer the most specific / highest-level function.
```

`enterRegistrationDetails` matches the step verb and all 7 params → one call, stop.

### Why the email setup was missed

`{0}` appears only in the Examples table , no step mentions randomizing:

```gherkin
Examples:
    | firstName | email              | ... |
    | John      | john_{0}@email.com | ... |
```

---

## Test 2 , Subscription Filtering (Inadequate Scenario + Context Gap)

Repo - https://github.com/vannizhang/react-redux-boilerplate

**Setup and two focal methods match.** `subscriptionLink().click()` and `pickOptionFromFilter(option)` are called identically in both versions.

**But one focal method is replaced and that changes the assertion:**

```diff
  Then('user should see the subscription page', async function () {
-   await expect(subscriptionPo.filterTrigger()).toBeVisible();
+   await expect(subscriptionPo.list().first()).toBeVisible();
  });
```

**Result:** Weak Assertion and signaling different things.

| Scenario | Original (checks page structure) | Generated (checks data present) |
|---|---|---|
| Page loads, 0 subscriptions | Pass | **Fail** |
| Page fails to load, stale list shown | **Fail** | Pass |





```gherkin
Given user open the app                      
And user open the subscription link          
Then user should see the subscription page   
Given user open the "subscriptions" page     
Then user should see "3" subscriptions       
When user change filter by "..."             
When user reload current page             
```

### Why the focal method was replaced

The step text names no element:

```gherkin
Then user should see the subscription page
```

The catalog offers both `filterTrigger()` and `list()`and maybe that confused the model as both kind of satisfies.

Also another thing to note: The catalog has no function for "open the app" or "open the {string} page" , in the repo these steps are implemented in shared step files the model was not shown. That's why, generated tests kept this empty which made it identical to the original test case as it also didn't have this but it was in a shared step files but not in DSL catalog.

---

## Test 3 , Login Flow (Inadequate Scenario)

Repo - https://github.com/ortoniKC/Playwright_Cucumber_TS

**Setup and action steps mostly match** , with two benign substitutions and one unverified one:



**Success assertion focal method is substituted:**

```diff
  Then('Login should be success', async function () {
-   const user = page.locator("...mat-menu-trigger...span[1]");
-   await expect(user).toBeVisible();
+   await assert.assertURL("https://bookcart.azurewebsites.net/");
  });
```

**Result:** Weak assertion again , and this one can pass **without logging in**. The asserted URL is the app's root, which is where the user already stands before login. The original checks the user-menu trigger, an element that exists only in the logged-in state.


### Why the assertion was substituted

The step text defines no observable:

```gherkin
Then Login should be success
```

The generated project's catalog contains a high-level `Assert` wrapper (`assert.assertURL`), but it doesn't specify what to assert under this wrapper.

---

## Test 4 , API DSL Migration (apickli, @console feature) - (Generation Fault)

Repo - https://github.com/apickli/apickli


**Measured against the feature, 48 of 51 scenarios behave identically. Three do not:**

**Fault 1 , one assertion focal method is hallucinated:**

```diff
  Then(/^response header (.*) should not exist$/, ...
-   const assertion = this.apickli.assertResponseContainsHeader(header);
-   assertion.success = !assertion.success;
+   const assertion = await this.apickli.assertResponseDoesNotContainHeader(header);
```

`assertResponseDoesNotContainHeader` is not part of apickli's API , LLM completely invented this method.

**Fault 2 , Regex is changed:**

```diff
- Then(/^response body path (.*) should be (((?!of type).*))$/, ...
+ Then(/^response body path (.*) should be (.*)$/, ...
```

The negative lookahead existed so that `response body path $.json should be of type array` matches only the array pattern. Without it, that step (and `... of type array with length 3`) matches **two** definitions, and both array-validation scenarios abort with Cucumber's ambiguous-step error.




### Why the regex got changed

The lookahead is meaningless for any single step in isolation; it only matters as *disambiguation between sibling patterns*. A generator mapping one step at a time reads `(((?!of type).*))` as noise and simplifies it to `(.*)` , and the collision only surfaces in the two scenarios that use both patterns back to back.

---

## Test 5 , API DSL Migration (apickli, @console feature) - (Generation Fault)

Repo - https://github.com/apickli/apickli

**The @console feature is a failure-output suite.** Its 15 scenarios are *designed to fail* , The original fails each one cleanly with `JSON.stringify(assertion)`. The generated file changes the outcome type of **14 of the 15 scenarios**:


**Fault 1 , the header setup focal method is replaced with a nonexistent one:**

```diff
  Given(/^I set (.*) header to (.*)$/, ...
-   this.apickli.addRequestHeader(headerName, headerValue);
+   await this.apickli.setRequestHeader(header, value);
```

**Fault 2 , the assertion  is broken:**

```diff
- callbackWithAssertion(callback, assertion);   // callback supplied by Cucumber
+ callbackWithAssertion(this, assertion);       // `this` is the World object
```

.

**Fault 3 , captures different thing:**

```diff
- Then(/^response body should be valid (xml|json)$/, ...
+ Then(/^response body should be valid (word)$/, ...
```

**Plus the same two faults as Test 4:** the hallucinated `assertResponseDoesNotContainHeader`, and the dropped `(?!of type)` lookahead that makes the two array scenarios ambiguous.


### Why the assertion broke

The generated file converts every step to `async` (so no `callback` parameter exists any more) and that's why it uses this instead of callback.

### Why `(word)` appeared

```gherkin
Then response body should be valid xml
Then response body should be valid json
```
`(word)` reads like a placeholder token , feature file mentions both xml and Json but llm used this instead of two step matching.

---

## Test 6 , User Creation API - (Generation Fault + Inadequate scenario)

Repo - https://github.com/marcoturi/fastify-boilerplate

**Focal methods match.** 

**The feature explains the table's shape but the generated parser cannot read it:**

```gherkin
Given user profile data
  | email              | country | street      | postalCode |
  | john.doe@gmail.com | England | Road Avenue | 29145      |
```

```diff
  Given('user profile data', ...
-   this.context.createUserDto = table.hashes()[0];   // horizontal: header row + data row ✓
+   this.context.createUserDto = table.rowsHash();    // vertical: requires exactly 2 columns
```

`rowsHash()` and `hashes` mean completely different two things.

**Also difference in error message checking:**

```gherkin
Then I receive an error "Bad Request" with status code 400
```

```diff
    assert.strictEqual(latestResponse!.statusCode, statusCode);
-   assert.strictEqual(latestResponse!.statusMessage, errorMessage);   // HTTP reason phrase
+   assert.strictEqual(latestResponse!.json().message, message);       // JSON body field
```



### Why the table was misread

The scenario includes the table so scenario is adequate and its classified as a generation fault.

### Why the error message checking changed

The scenario never explicitly says where the error message can viewed. Inadequate scenario and thats why, it assumed its in the json body message.

---

## Test 7 , User Deletion API - (Wrong Scenario + Generation Fault)

Repo - https://github.com/marcoturi/fastify-boilerplate

**It inherits Test 6's first fault - confusing the table structure.** .

**But even after that a fault gets introduced**

```diff
- Then('I send a request to delete my user', async function () {
-   const response = await this.server.inject({ method: 'DELETE', url: `.../${latestResponse!.json().id}` });
-   assert.strictEqual(response.statusCode, 204);
+ Given('I send a request to delete my user', async function () {
+   const userId = this.context.latestResponse!.json().id;
+   this.context.latestResponse = await this.server.inject({ method: 'DELETE', ... });
  });
```

**That destroys the final assertion:**

```diff
  Then('I cannot see my user in a list of all users', ...
    assert.strictEqual(
-     users.data.some((item) => item.id === this.context.latestResponse!.json().id),   // create response → real ID
+     users.data.some((item) => item.id === this.context.latestResponse?.json().id),   // DELETE response → 204, empty body
      false,
    );
```


### Why the assertion was dropped

The feature phrases the delete as *context*, not verification:

```gherkin
Given I send a request to delete my user
```

Nothing in a `Given` "send a request" asks for an assertion , so LLM can not assume its a verification step

---


