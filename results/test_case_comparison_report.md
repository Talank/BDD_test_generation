# Test Case Comparison Report



| # | Test | 1. Does Scenario match dev test? | 2. Does Scenario match gen test? | 3. Does two tests match | 4. Category | 5. What should change |
|---|---|---|---|---|---|---|
| 1 | Registration | **No.** Test does more than the scenario says | **Yes** it matches every step but dont do the extra steps like the dev test| **No.** Setup differs (raw vs randomized email); 2 actions missing; assertion matches. | Inadequate Scenario | **Scenario** , explicitly add the extra steps and unique email rule  |
| 2 | Subscription | **No.** Scenario contains steps that are configured in the shared steps files instead of the test file | **Yes.** | **No.** Assertion target differs (`filterTrigger` vs `list`); shared steps that the dev repo implements elsewhere exist only as stubs in the generated file; matched steps are equivalent. | Inadequate Scenario + Context Gap (shared steps not shown to generator). | **Scenario** , name the observable (e.g. "user should see the subscription filter"); **Context** , show shared step files to the generator. |
| 3 | Login | **Yes** but it doesnt specify the assertion| **Yes.** again, the assertion, everything matches but assertion is wrong as it fails to check the logged in status of user | **No.** Assertion differs (user menu vs URL); | Inadequate Scenario  | **Scenario**, define the success observable (e.g. "user menu shows the username"); |
| 4 | apickli @core | **Yes.**  | **No , 48/51 scenarios unchanged.** but invented a nonexistent API; both array-validation scenarios fail (b) None. | **No.** apart from the two concern mentioned previously | Generation Fault | **Generated test** |
| 5 | apickli @console | **Yes.**  | **No , 14/15 scenarios produce the wrong outcome type.**  | **No.** Setup method, assertion harness, and two regexes all are diff. | Generation Fault. | **Generated test** , fix the method name, inline throws (as Test 4's generation did), restore `(xml|json)` and the regex. |
| 6 | User create API | **Yes.** but it doesn't specify assert | **No.** (a) `rowsHash()` throws on the feature's 4-column table , every scenario dies at the `Given`; `json().message` holds the validation detail, not "Bad Request"; a `201` the scenario never states is asserted. (b) Nothing left unimplemented. | **No.** |Generation Fault + Inadequate Scenario| **Generated test** , fix table parse, assert `statusMessage`; **Scenario** , say where the error text appears. |
| 7 | User delete API | **No** Test does the opposite of what scenario says in one step | **No.** Same problem as test case 6's rowhash() | **No.** | Generation Fault + Wrong Scenario | **Generated test** fix table parse like 6 **Scenario** , phrase the delete as a `When` and add an explicit verification `Then`. |
| 8 | mutual-tls | **Yes.** | **No.** 1 of 4 steps left `UNMAPPED` (`I use the mock target`). | **No.** Target step is empty, so the request goes to the World default (httpbin) instead of the mTLS mock server; two patterns hard-code `valid` and `200` where the original captures them. | Context Gap | **Context** , show `mock-target.js` (the mock server URL) to the generator; **Generated test** , parameterize the two hard-coded patterns. |
| 9 | injecting-variables | **Yes.** | **No , 16/18 scenarios unchanged.** `(\d+)` captures reject the backtick variables the feature passes in; 2 scenarios fail. | **No.** Three regexes narrowed to `(\d+)`; `(?!of type)` lookahead dropped as in Test 4; header step uses `setRequestHeader` for `addRequestHeader` (same outcome here); rest equivalent. | Generation Fault | **Generated test** , restore `(.*)` captures and the lookahead. |
| 10 | tsflow basic-test | **Yes.** | **No , 2/4 runs unchanged.** `it fails` never sets `verifiedLastRunError`, so the After hook re-throws the expected error. | **No.** Flag missing in `it fails`; `it passes` and `output contains` are exact-only with no diagnostics. | Generation Fault + Context Gap (`verifiedLastRunError` not in the surface index) | **Generated test** , set `this.runner.verifiedLastRunError = true`; **Context** , list public fields, not only methods, in the catalog index. |
| 11 | tsflow context objects | **Yes.** | **No , 4/5 scenarios unchanged.** Logs table read with `rows()`, which drops the only row. | **No.** `raw()` → `rows()` on the logs step; attachment tables read by position instead of header; one step invented (`hook has no attachments`). | Generation Fault | **Generated test** , use `raw()` for the headerless table, drop the invented step. |
| 12 | tsflow World context | **Yes.** | **No , 0/3 scenarios unchanged.** The only assertion step is marked `// EXISTS` but is not registered → undefined step. | **No.** `the output contains text:` missing entirely; other steps equivalent (this generation *did* set `verifiedLastRunError`). | Generation Fault + Context Gap | **Generated test** , define `the output contains text:`; **Context** , expose `expectOutputToContain` in the catalog. |
| 13 | tsflow global hooks | **Yes.** | **Yes.** Every step bound; the `once` check is an exact substring count. | **Mostly.** Same outcome when stdout matches byte-for-byte; the original also tolerates whitespace / dot-run drift via `countMatches`. | Context Gap | **Context** , export the flexible output helpers so the generator can call them. |
| 14 | tsflow hooks | **Yes** but "was executed" doesn't say how many times. | **No , 14/15 scenarios unchanged.** `it fails` misses `verifiedLastRunError` (as Test 10). | **No.** Flag missing; hook count `=== 1` loosened to `> 0`; doc-string matching exact-only (9 scenarios at risk). | Generation Fault + Context Gap + Inadequate Scenario | **Generated test** , set the flag, assert `=== 1`; **Scenario** , say "was executed once"; **Context** , as Test 13. |
| 15 | tsflow tag parameters | **Yes.** | **Yes.** | **Yes.** Same pass/fail for all 14 scenarios; only the failure message is less informative. | Match | None. |


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

## Test 8 , Mutual TLS (apickli, mutual-tls feature) - (Context Gap)

Repo - https://github.com/apickli/apickli

**Focal methods match.** `setClientTLSConfiguration(...)`, `get(resource)` and `assertResponseCode(...)` are called with the same values in both versions.

**But the target-selection step is left empty:**

```diff
  Given(/^I use the mock target$/, ...
-   this.apickli.domain = 'https://localhost:5000';
+   // UNMAPPED: I use the mock target
```

**Result:** `this.apickli.domain` keeps the World default. The GET goes to httpbin over plain HTTP; the client certificate is loaded but never presented to a TLS server.

| | Original | Generated |
|---|---|---|
| Target | `https://localhost:5000` (mTLS mock server) | `http://httpbin.org` (World default) |
| Client cert exercised | Yes | **No** |
| `response code should be 200` proves | mTLS handshake succeeded | httpbin is up |

**Two patterns are also hard-coded** where the original captures:

```diff
- Given(/^I have (.+) client TLS configuration$/, function(configurationName, callback) {
-   this.apickli.setClientTLSConfiguration(configurationName, ...
+ Given(/^I have valid client TLS configuration$/, async function() {
+   this.apickli.setClientTLSConfiguration('valid', ...
```

```diff
- Then(/^response code should be (.*)$/, function(responseCode, callback) {
+ Then(/^response code should be 200$/, async function() {
```

Same outcome for this feature (only `valid` and `200` appear), but the bindings are single-use, and `200` should have been a parameter under the prompt's own Rule 5 (a number → `{int}`).

### Why the mock target was unmapped

`https://localhost:5000` appears nowhere in the prompt: `mock-target.js` is not in EXISTING STEP DEFINITIONS, the step is not in REGISTERED STEPS, and `domain` is a constructor field, not a catalog function. Rule 9 says "do not guess", so declaring it unmapped was the correct call , though it should have used the `UNMAPPED (missing value)` form.

---

## Test 9 , Variable Injection (apickli, injecting-variables feature) - (Generation Fault)

Repo - https://github.com/apickli/apickli

**Measured against the feature, 16 of 18 scenarios behave identically. Two do not.**

**Fault 1 , numeric captures narrowed:**

```diff
- Then(/^response code should be (.*)$/, ...
+ Then(/^response code should be (\d+)$/, ...
- Then(/^response code should not be (.*)$/, ...
+ Then(/^response code should not be (\d+)$/, ...
- Then(/^response body path (.*) should be of type array with length (.*)$/, ...
+ Then(/^response body path (.*) should be of type array with length (\d+)$/, ...
```

The feature never passes a digit to these steps , it passes a variable:

```gherkin
Then response code should be `myCode`
And response code should not be `myIncorrectCode`
...
And response body path $.json should be of type array with length `myLength`
```

`\d+` does not match a backtick variable. *Response code checks* has two undefined steps; *should successfully validate json array* falls through to the generic `should be (.*)` binding, which treats `of type array with length 3` as a regex against the array and fails.

**Fault 2 , same lookahead drop as Test 4:** `(((?!of type).*))` → `(.*)` on `should be` / `should not be`. No ambiguous-step error here, because the sibling `with length` pattern never matches (Fault 1); it only turns the array scenario from "undefined step" into a wrong assertion.

**One focal method is swapped, benignly:**

```diff
  Given(/^I set (.*) header to (.*)$/, ...
-   this.apickli.addRequestHeader(headerName, headerValue);
+   await this.apickli.setRequestHeader(header, value);
```

Both are in the catalog. `addRequestHeader` appends (comma-joined) to an existing header; `setRequestHeader` replaces it. Neither header set in this feature (`User-Agent`, `Token`) pre-exists, so the outcome is identical.

**Everything else is equivalent:** callback → promise wrapping, `callbackWithAssertion` → `throw new Error(JSON.stringify(assertion))`, `should not` → inverted check, `I set bearer token` registered as `Given` instead of `When` (keyword is ignored when matching), and `// EXISTS` correctly used for the openapi step.

### Why the captures were narrowed

Rule 5 says "a number → `{int}`". The model typed the parameter by what a response code *is* rather than by what the step *says*. The feature exists to test apickli's backtick variable injection, which only the `replaceVariables` source mentions , the rules never do. The existing definitions all use `(.*)` for exactly this reason.

---

## Test 10 , Binding steps (cucumber-tsflow, basic feature) - (Generation Fault + Context Gap)

Repo - https://github.com/timjroberts/cucumber-js-tsflow

**Setup and action focal methods match.** `writeFile`, `run`, `it passes` and `the output contains {string}` produce the same pass/fail.

**But `it fails` drops the acknowledgement flag:**

```diff
  @then("it fails")
- public ensureFailure() {
-   const exitCode = this.runner.lastRun.error?.code ?? 0;
-   expect(exitCode).not.toBe(0);
-   this.runner.verifiedLastRunError = true;
+ public async checkFails() {
+   await Promise.resolve();
+   assert.notStrictEqual(this.runner.lastRun.error, null);
  }
```

**That trips the After hook** in `prepare.ts`, which re-throws any run error nobody acknowledged:

```ts
if (lastRun?.error != null && !this.runner.verifiedLastRunError) {
  throw new Error(`Last run errored unexpectedly. ...`);
}
```

**Result:** *Failing test* and *Missing step definition* pass every step, then fail in the After hook. 2 of 4 scenario runs broken.

**Two assertions are weaker but equivalent here:**

| Step | Original | Generated |
|---|---|---|
| `it passes` | throws with run output + stderr | `assert.strictEqual(error, null)` , no diagnostics |
| `the output contains {string}` | exact match, then whitespace/dot-tolerant regex | `output.includes(text)` , exact only |

### Why the flag was missed

`verifiedLastRunError` is a public *field*; the auto-extracted PUBLIC SURFACE INDEX lists only `lastRun`, `extractor` and `run`. The hook that enforces it sits in `prepare.ts`, and nothing in `Then it fails` points there. Test 12's generation did set it, so the information was reachable , just easy to miss.

---

## Test 11 , Cucumber context objects (cucumber-tsflow) - (Generation Fault)

Repo - https://github.com/timjroberts/cucumber-js-tsflow

**4 of 5 scenarios behave identically.** `writeFile`, `run`, `it passes`, both attachment checks and `has no attachments` are equivalent.

**One table reader is wrong:**

```diff
  @then("scenario {string} step {string} has the logs:")
-   const expectedLogs = logs.raw().map((row) => row[0]);
+   const expectedLogs = table.rows().map((row) => row[0]);
```

`raw()` returns every row; `rows()` skips the first as a header. The feature's table has no header:

```gherkin
And scenario "example" step "Given a step" has the logs:
    | logged value |
```

**Result:** `expectedLogs` is `[]`, actual is `["logged value"]`, and *Using the cucumber logger* fails.

**Attachment tables are read by position instead of by header:**

```diff
- const expectedAttachments = table.hashes().map((x) => ({
-   body: x.DATA, mediaType: x["MEDIA TYPE"], contentEncoding: ENCODING_MAP[x["MEDIA ENCODING"]],
- }));
+ const expectedAttachments = table.rows().map(([body, mediaType, contentEncoding]) => ({
+   body, mediaType, contentEncoding,
+ }));
```

Same result (the `IDENTITY` cell equals the enum's string value), but it depends on column order and bypasses `ENCODING_MAP`.

**One step is invented:** `scenario {string} {string} hook has no attachments` appears in neither the feature nor the original. Never matched at runtime, but it is coverage the Gherkin never asked for.

### Why the table was misread

The other three tables in the feature all carry a header row (`DATA | MEDIA TYPE | MEDIA ENCODING`), and the only registered table step (`it runs the scenarios:`) uses `rows()`. A one-row headerless table looks exactly like a header, and nothing in the step text says which it is.

---

## Test 12 , Context objects from World externally (cucumber-tsflow) - (Generation Fault + Context Gap)

Repo - https://github.com/timjroberts/cucumber-js-tsflow

**Setup and result steps match.** `writeFile`, `run`, `it passes` and `it fails` (this time *with* `verifiedLastRunError = true`) are equivalent.

**But the only output assertion is skipped as already registered:**

```diff
- @then("the output contains {string}")
- @then("the output contains text:")
- public checkStdoutContains(text: string) {
-   expectOutputToContain(this.runner.lastRun.output, text);
- }
+ // EXISTS: Then('the output contains text:')
```

REGISTERED STEPS lists `the output contains text once:`, `the output does not contain text:` and `the error output contains text:` , not `the output contains text:`. Every scenario ends with it:

```gherkin
Then it fails
And the output contains text:
    """
    Before # step_definitions/a.ts:5
           Error: Scenario context have not been initialized in the provided World object.
    """
```

**Result:** the step is undefined at runtime; all 3 scenarios fail.

### Why the step was skipped

Rule 4's own warning , "looks similar is not matches" , is exactly what happened: three near-identical registered patterns made the model assume the fourth existed. A second problem waits behind it: a correct binding would need `expectOutputToContain`'s whitespace/dot-tolerant matching for these multi-line doc strings, and that helper is file-local to `cucumber_steps.ts`, not in the catalog.

---

## Test 13 , Global hooks (cucumber-tsflow) - (Context Gap)

Repo - https://github.com/timjroberts/cucumber-js-tsflow

**Focal methods match.** `writeFile`, `run` and `it passes` (exit-code check, the mirror of the original `it fails`) are equivalent.

**The count assertion is re-implemented strictly:**

```diff
  @then("the output contains text once:")
-   expectOutputToContain(output, text);
-   expect(countMatches(output, text)).toBe(1);
+   const occurrences = this.runner.lastRun.output.split(text).length - 1;
+   expect(occurrences).toBe(1);
```

`countMatches` tries an exact count first and falls back to a regex that tolerates `\r\n`, runs of dots and runs of spaces. The doc strings are progress-formatter output:

```gherkin
And the output contains text once:
    """
    hook exec
    .step exec
    ...step exec
    ..
    """
```

**Result:** identical when stdout matches byte-for-byte. The generated step fails wherever the original's fallback would have absorbed a whitespace or dot-run difference , which is why the fallback exists. All 6 scenarios carry the risk; none is certainly broken.

### Why it was re-implemented

`expectOutputToContain`, `countMatches` and `createFlexibleOutputRegex` are visible in EXISTING STEP DEFINITIONS but are module-private and absent from the DSL CATALOG, so Rule 1 forbids calling them. The model wrote the naive equivalent.

---

## Test 14 , Hooks (cucumber-tsflow) - (Generation Fault + Context Gap + Inadequate Scenario)

Repo - https://github.com/timjroberts/cucumber-js-tsflow

**Most steps match.** `writeFile`, `run`, `it passes`, `the output does not contain {string}` and `the error output contains text:` are equivalent. `the output contains {string}` / `text:` are exact-only (same caveat as Test 13; 9 doc-string scenarios at risk).

**Fault 1 , same missing flag as Test 10:**

```diff
  @then("it fails")
-   expect(exitCode).not.toBe(0);
-   this.runner.verifiedLastRunError = true;
+   expect(this.runner.lastRun.error).not.toBeNull();
```

*Attempting to bind named hooks with old cucumber* fails in the After hook.

**Fault 2 , the hook-execution assertion is loosened:**

```diff
  @then("the hook {string} was executed on scenario {string}")
-   assert(executions.length === 1, `Hook ${hookName} executed ${executions.length} times ...`);
+   expect(executions.length).toBeGreaterThan(0);
```

Passes if a named hook is registered and run twice , the regression the original guards against. Same outcome for *Binding named hooks* today.

**Result:** 1 of 15 scenarios certainly broken; 1 weakened; 9 at risk from exact matching.

### Why the assertion loosened

The step says "was executed", not "was executed once". The registered sibling `the output contains {string} once` shows this repo spells out "once" when it means it, so the model read the step literally as "at least once".

---

## Test 15 , Tag parameters (cucumber-tsflow) - (Match)

Repo - https://github.com/timjroberts/cucumber-js-tsflow

**All three focal methods match.** `writeFile`, `run` and `it passes` give the same pass/fail for all 14 scenarios.

**Only the failure message differs:**

```diff
  @then("it passes")
-   if (lastRun?.error != null) {
-     throw new Error(`Last run errored unexpectedly. Output:\n\n${lastRun.output}...`);
-   }
+   assert.strictEqual(this.runner.lastRun.error, null);
```

The original dumps stdout and stderr on failure; the generated one reports only that `error` was not `null`. Two bindings are also plain `function`s where Rule 2 asks for `async`, which is harmless here since `writeFile` is synchronous.

Nothing to change.
