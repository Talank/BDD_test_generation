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
| ↳ 8 *re-run with revised prompt* | . | **No.** Still 1 of 4 steps unmapped , but now in the correct `UNMAPPED (missing value)` form. | **No.** Target step still empty (the URL is held out, so it cannot be derived); `response code should be (.*)` now parameterized; `valid` still hard-coded. | Context Gap , confirmed unresolvable inside the experiment | **Nothing more in the prompt.** The only fix is showing `mock-target.js`, which is the held-out file. **Generated test** , parameterize the TLS-config pattern. |
| 9 | injecting-variables | **Yes.** | **No , 16/18 scenarios unchanged.** `(\d+)` captures reject the backtick variables the feature passes in; 2 scenarios fail. | **No.** Three regexes narrowed to `(\d+)`; `(?!of type)` lookahead dropped as in Test 4; header step uses `setRequestHeader` for `addRequestHeader` (same outcome here); rest equivalent. | Generation Fault | **Generated test** , restore `(.*)` captures and the lookahead. |
| 10 | tsflow basic-test | **Yes.** | **No , 2/4 runs unchanged.** `it fails` never sets `verifiedLastRunError`, so the After hook re-throws the expected error. | **No.** Flag missing in `it fails`; `it passes` and `output contains` are exact-only with no diagnostics. | Generation Fault + Context Gap (`verifiedLastRunError` not in the surface index) | **Generated test** , set `this.runner.verifiedLastRunError = true`; **Context** , list public fields, not only methods, in the catalog index. |
| ↳ 10 *re-run, revised prompt* | Unchanged. | **No , 0/4 runs unchanged (was 2/4).** `it fails` still never sets `verifiedLastRunError`; `the output contains {string}` is now dropped outright (not registered → undefined step in every run). | **No.** Flag still missing; one feature step silently omitted; `it passes` / `it fails` now throw with diagnostics (improvement). | Generation Fault (context gap closed in the prompt , field indexed `(read/write)`, rule 1 allows assignment, rule 9 points at it , but not consumed) | **Generated test** , set the flag, bind `the output contains {string}`. **Prompt** , no further context to add; re-sample before attributing the omission to rule 4. |
| 11 | tsflow context objects | **Yes.** | **No , 4/5 scenarios unchanged.** Logs table read with `rows()`, which drops the only row. | **No.** `raw()` → `rows()` on the logs step; attachment tables read by position instead of header; one step invented (`hook has no attachments`). | Generation Fault | **Generated test** , use `raw()` for the headerless table, drop the invented step. |
| 12 | tsflow World context | **Yes.** | **No , 0/3 scenarios unchanged.** The only assertion step is marked `// EXISTS` but is not registered → undefined step. | **No.** `the output contains text:` missing entirely; other steps equivalent (this generation *did* set `verifiedLastRunError`). | Generation Fault + Context Gap | **Generated test** , define `the output contains text:`; **Context** , expose `expectOutputToContain` in the catalog. |
| ↳ 12 *re-run, revised prompt* | Unchanged. | **No , 0/3 unchanged (same as gen 1).** `the output contains text:` now omitted outright , no `// EXISTS`, no binding , so still undefined. | **No.** Same missing step; **regression**: `it fails` no longer sets `verifiedLastRunError` (gen 1 did). Helper reimplementation never attempted because the step was never bound. | Generation Fault (the `// EXISTS` misfire is gone, replaced by silent omission) | **Generated test** , bind `the output contains text:` with a local flexible-regex reimplementation; restore the flag. |
| 13 | tsflow global hooks | **Yes.** | **Yes.** Every step bound; the `once` check is an exact substring count. | **Mostly.** Same outcome when stdout matches byte-for-byte; the original also tolerates whitespace / dot-run drift via `countMatches`. | Context Gap | **Context** , export the flexible output helpers so the generator can call them. |
| ↳ 13 *re-run, revised prompt* | Unchanged. | **Yes.** All steps bound; the `once` check is the same exact split-count. | **Mostly (unchanged).** `it passes` → `expect(error).toBeNull()`, equivalent. Flexible matching not reimplemented although `CALLABLE HELPERS` now names `createFlexibleOutputRegex` as reimplementable. | Generation Fault (mild) , context gap closed, not consumed; outcome identical to gen 1 | **Generated test** , reimplement the flexible count locally. No prompt change indicated. |
| 14 | tsflow hooks | **Yes** but "was executed" doesn't say how many times. | **No , 14/15 scenarios unchanged.** `it fails` misses `verifiedLastRunError` (as Test 10). | **No.** Flag missing; hook count `=== 1` loosened to `> 0`; doc-string matching exact-only (9 scenarios at risk). | Generation Fault + Context Gap + Inadequate Scenario | **Generated test** , set the flag, assert `=== 1`; **Scenario** , say "was executed once"; **Context** , as Test 13. |
| ↳ 14 *re-run, revised prompt* | Unchanged (still "was executed"). | **No , 14/15 unchanged (same count, different failure).** `it fails` now omitted outright → *Attempting to bind named hooks…* dies as an undefined step instead of in the After hook. | **No.** Flag still absent; hook count still `> 0`; doc-string matching still exact (9 at risk). Improvements: `it passes` reports `errorOutput`; padding removed. | Generation Fault + Inadequate Scenario (context gap closed in the prompt, not consumed) | **Generated test** , bind `it fails` with the flag, assert `=== 1`, flexible matching; **Scenario** , say "was executed once". |
| 15 | tsflow tag parameters | **Yes.** | **Yes.** | **Yes.** Same pass/fail for all 14 scenarios; only the failure message is less informative. | Match | None. |
| 16 | mink action (hover) | **Yes.** | **No , 0/1 scenario unchanged.** All 7 steps declared `// UNMAPPED`; the file registers nothing. | **No.** Zero bindings. `page.hover` is absent from the prompt, but the two visibility steps and both navigation steps were derivable from visible code (`waitForSelector` factory, `goRoot`, `config.baseUrl`). | Context Gap (catalog index empty for this repo; puppeteer `page` surface not listed) + Generation Fault (over-caution on 4 derivable steps) | **Context** , index `Mink#` driver methods and the puppeteer `page` API; **Generated test** , bind the visibility and navigation steps from the visible `waitForSelector` / `goRoot` code. |
| 17 | mink assert_content | **Yes.** (`I browse` does not say it only *stores* the base URL , the relative paths that follow imply it.) | **No , 0/3 runs unchanged.** Every quoted pattern is written `"{string}"`, which never matches (verified); the Background's first step is undefined in every scenario. Behind that, every assertion tests an un-awaited Promise and throws. | **No.** Unmatchable patterns; no `await`; `browse` navigates instead of storing the base URL; `goto('/')` relative; `html()` collapsed to `text()`; visibility → `count > 0`. | Generation Fault | **Generated test** , `{string}` without literal quotes (or keep regexes as the repo does), `await` every driver call, restore `html()` / `waitForSelector` semantics and base-URL resolution. |
| 18 | mink assert_url | **Yes.** | **No , 0/4 unchanged.** Same `"{string}"` defect , `I am on` undefined in every scenario. Every body is an empty stub with an `// UNMAPPED` comment, so the two `{word}` assertions that *do* match would pass without asserting. | **No.** Five registered no-ops; base URL mangled into a markdown link inside the comment. | Generation Fault + Context Gap (`assert_url.js` held out; `page.url()` appears nowhere in the template) | **Generated test** , fix `{string}`, never register a body for an unmapped step; **Context** , list the puppeteer `page` surface (`url()`, `goto()`, `hover()`, …). |
| 19 | mink compatibility | **Yes.** | **No , 0/2 unchanged.** Nothing registered, no `require`; 18 `// UNMAPPED (missing DSL function)` lines, one per *occurrence* rather than per pattern. | **No.** Zero bindings although every held-out function has a visible mirror (`notSeeText`, `isRoot` / `urlMatch`, `Mink#button` / `Mink#link`, `submit`'s `waitForNavigation`, `Errors.ACTION.*`). | Generation Fault (catalog-index gap as in 16 is a contributing factor, not the cause , nothing was genuinely missing) | **Generated test** , bind the five patterns from the visible mirrors; **Prompt** , output-completeness rule, one line per pattern. |
| 20 | mink form | **Yes.** | **No , 0/7 runs unchanged.** Comment-only file inside a legacy `module.exports = function () {}` wrapper that `@cucumber/cucumber` never invokes; two `// EXISTS` misfires (registered siblings have the other word order); `<cbState>` in verb position never expanded to `check` / `uncheck`. | **No.** Zero bindings. About half the patterns were derivable (`press` ← `follow`, `seeText` ← `notSeeText`, `elementContainsText` ← `elementNotContainsText`, `isEqual` ← `isRoot`); the form-manipulation half needs `page.$eval` / `page.select`, which the template never shows. | Generation Fault + Context Gap (`form.js`, `assert_form.js`, `isChecked`, `isDisabled` all held out; puppeteer element API not indexed) | **Generated test** , real top-level bindings, two patterns for `check` / `uncheck`, drop the false `// EXISTS`; **Context** , index the puppeteer element API. |


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


### Re-run with the revised prompt (`test_case_8 copy`)

**Prompt changes applied:** thirteen `Apickli#` fields added to PUBLIC SURFACE INDEX, including `Apickli#domain: string (read/write)`; rule 1 now permits assigning to a listed writable field; rule 4 exact-match; rule 9 re-check fields before `UNMAPPED`. `https://localhost:5000` was **not** added , it lives in the held-out `mock-target.js`, and a leak check on the revised prompt finds zero occurrences of `5000`.

**What changed in the output:**

```diff
  Given(/^I use the mock target$/, async function() {
-   // UNMAPPED: I use the mock target
+   // UNMAPPED (missing value): Given I use the mock target
  });
```

```diff
- Then(/^response code should be 200$/, async function() {
-   const assertion = this.apickli.assertResponseCode('200');
+ Then(/^response code should be (.*)$/, async function(responseCode) {
+   const assertion = await this.apickli.assertResponseCode(responseCode);
```

**Unchanged:** `I have valid client TLS configuration` still hard-codes `valid`. It is the only value the feature uses, so Rule 5's "replace only what varies" arguably permits it, but the binding stays single-use. `assertResponseCode` is synchronous, so the added `await` is harmless. The `new-cap: "off"` eslint directive was dropped , lint-only.

**Current state:** runtime outcome is identical to gen 1 , the GET still goes to the httpbin default and the client certificate is never presented against a TLS server. That is the *expected* result: no output can derive a value that is not in the prompt. The index edit did its narrower job , `domain` is now a known assignable member, and the model correctly reported the *value* as missing rather than the *function*, which is the form the original review said it should have used.

**Verdict:** Context Gap, confirmed as unresolvable within the experiment's contamination line. Nothing further to change in the prompt. This case is best kept as the control for the `UNMAPPED (missing value)` path.

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


### Re-run with the revised prompt (`test_case_10 copy`)

**Prompt changes applied:** `TestRunner#verifiedLastRunError: boolean (read/write)` and five other `TestRunner` fields added to PUBLIC SURFACE INDEX; new `# CALLABLE HELPERS` section; rule 1 (fields may be assigned), rule 4 (exact match before `// EXISTS`), rule 9 (re-check fields before `UNMAPPED`).

**The targeted gap is still open:**

```diff
  @then("it fails")
  public async checkFails() {
-   await Promise.resolve();
-   assert.notStrictEqual(this.runner.lastRun.error, null);
+   if (this.runner.lastRun.error == null) {
+     throw new Error("Expected cucumber-js to fail, but it passed.");
+   }
  }
```

Still no `this.runner.verifiedLastRunError = true`. *Failing test* and *Missing step definition* still die in the After hook.

**And a new regression , a step the feature uses was dropped without a trace:**

```diff
- @then("the output contains {string}")
- public async checkOutputContains(text: string) {
-   await Promise.resolve();
-   assert.ok(this.runner.lastRun.output.includes(text));
- }
+ (nothing , no binding, no `// EXISTS` comment)
```

`the output contains "…"` appears five times across all three scenarios. This template's REGISTERED STEPS lists `the output contains {string} once` but not the plain form, so the step is undefined at runtime in every run.

**Improvements:** `it passes` and `it fails` now throw with a message and `errorOutput`, closer to the original's diagnostics; the `assert` import and the `await Promise.resolve()` padding are gone.

| Run | Gen 1 | Gen 2 (revised prompt) |
|---|---|---|
| Bind steps with `<Bind Mode>` (×2 examples) | Pass | **Fail , undefined step** |
| Failing test | Fail (After hook) | **Fail , undefined step, then After hook** |
| Missing step definition | Fail (After hook) | **Fail , undefined step, then After hook** |

**Current state:** 0/4 runs unchanged, down from 2/4.

**Verdict:** category moves from *Generation Fault + Context Gap* to **Generation Fault**. The context gap is closed by construction , the field is indexed `(read/write)`, rule 1 says it may be assigned, rule 9 says to re-check the field list before writing anything , and the model still did not use it. Whether the silent omission of `the output contains {string}` is a side-effect of the stricter rule 4 (the plain form is a sibling of the registered `… once` family) cannot be settled from one sample; see the note at the end of the report.

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


### Re-run with the revised prompt (`test_case_12 copy`)

**Prompt changes applied:** the priority edit here was rule 4 , `// EXISTS` only on a character-for-character match, with the matched REGISTERED STEPS entry quoted verbatim. Also: fields index, `# CALLABLE HELPERS` (which names `expectOutputToContain` and `createFlexibleOutputRegex` as module-private, to be reimplemented locally), rule 1 and rule 9 edits. REGISTERED STEPS is unchanged and still does not list `the output contains text:`.

**The `// EXISTS` misfire is gone , but the step went with it:**

```diff
- // EXISTS: Then('the output contains text:')
+ (nothing , no binding, no comment)
```

Rule 4 now requires quoting the matching entry; there is none, and the model wrote neither the quote nor the binding. All three scenarios end with `the output contains text:`, so all three still hit an undefined step. 0/3 unchanged, same as gen 1.

**Regression on the step gen 1 got right:**

```diff
  @then("it fails")
- public async checkFailure() {
-   assert(this.runner.lastRun.error != null);
-   this.runner.verifiedLastRunError = true;
+ public async checkItFails() {
+   if (this.runner.lastRun.error == null) {
+     throw new Error("Expected cucumber-js to fail.");
+   }
  }
```

Gen 1 set the flag *without* the field being indexed; gen 2 dropped it *with* the field indexed `(read/write)`. *Failing to retrieve state from a non-initialized World object* now carries two independent failures (undefined step, then the After hook).

**Minor:** unused `DataTable` and `assert` imports removed; all indentation lost (cosmetic , it compiles).

**Current state:** 0/3 unchanged. Same headline outcome as gen 1, plus one additional defect.

**Verdict:** **Generation Fault.** The context gap noted in gen 1 (`expectOutputToContain` not callable) is now addressed in the prompt through `CALLABLE HELPERS`, but it was never exercised because the step was never bound. The rule 4 edit removed the false `// EXISTS` but did not produce the binding it was meant to force.

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


### Re-run with the revised prompt (`test_case_13 copy`)

**Prompt changes applied:** `# CALLABLE HELPERS` lists `escapeRegex`, `createFlexibleOutputRegex` and `expectOutputToContain` as module-private with the instruction to reimplement locally (`countMatches` is correctly omitted , it is held out in this template); fields index; rule 1, 4 and 9 edits.

**The targeted step is byte-identical to gen 1:**

```ts
@then("the output contains text once:")
public checkOutputContainsTextOnce(text: string) {
  const occurrences = this.runner.lastRun.output.split(text).length - 1;
  expect(occurrences).toBe(1);
}
```

No flexible-regex reimplementation, although `createFlexibleOutputRegex`'s body is fully visible in EXISTING STEP DEFINITIONS and the new section says to reimplement it.

**Only `it passes` changed, equivalently:**

```diff
- const exitCode = this.runner.lastRun.error?.code ?? 0;
- expect(exitCode).toBe(0);
+ expect(this.runner.lastRun.error).toBeNull();
```

`lastRun.error` comes straight from `execFile`'s callback and is `null` on success, so both forms give the same verdict; the original additionally dumps stdout and stderr on failure. Unused `DataTable` import removed; the `await` on the synchronous `writeFile` is harmless.

**Current state:** unchanged , 6/6 pass when stdout matches byte-for-byte; all 6 remain at risk from whitespace or dot-run drift.

**Verdict:** category moves from *Context Gap* to **Generation Fault (mild)**. The information the generator needed is now in the prompt and explicitly labelled as "reimplement this"; the output did not move. Outcome-wise this still "mostly matches".

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


### Re-run with the revised prompt (`test_case_14 copy`)

**Prompt changes applied:** the same four edits as 10/12/13 (`# CALLABLE HELPERS` here has all four `cucumber_steps.ts` helpers, including `countMatches`). The scenario wording ("was executed") was **not** revised.

**Fault 1 (missing flag) turned into a missing step:**

```diff
- @then("it fails")
- public async checkFails() {
-   await Promise.resolve();
-   expect(this.runner.lastRun.error).not.toBeNull();
- }
+ (nothing , no binding, no comment)
```

`it fails` is used once (*Attempting to bind named hooks with old cucumber*) and is not among this template's 16 REGISTERED STEPS. The scenario now fails as an undefined step instead of in the After hook. `verifiedLastRunError` is still never written anywhere in the file.

**Fault 2 (loosened hook count) unchanged:**

```diff
- expect(executions.length).toBeGreaterThan(0);
+ if (executions.length === 0) {
+   throw new Error(`Hook "${hookName}" was not executed on scenario "${scenarioName}"`);
+ }
```

Same predicate; still passes on a double execution. Expected, since the scenario still says "was executed".

**Exact-only output matching unchanged:** all four `contains` / `does not contain` steps use `includes(text)`; the 9 doc-string scenarios remain at risk.

**Improvements:** `it passes` throws `errorOutput`; every assertion has a descriptive message; the `await Promise.resolve()` padding and the unused `DataTable` import are gone. The `await`s on `getHookByName` / `getHookExecutions` are harmless (both synchronous).

**Current state:** 14/15 unchanged , the same count as gen 1, with the one broken scenario failing differently; 1 weakened; 9 at risk.

**Verdict:** **Generation Fault + Inadequate Scenario.** The context component is closed in the prompt and not consumed; the scenario component is untouched because the scenario was not revised.

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

---

## Test 16 , Hover (cucumber-mink, action feature) - (Context Gap + Generation Fault)

Repo - https://github.com/adezandee/cucumber-mink

**Nothing is bound.** The generated file is one `require` line and seven `// UNMAPPED` comments; the only scenario is undefined from its first Background step.

```diff
- [/^(?:|I )browse "([^"]*)"/, setBaseURL],
- [/^(?:|I )am on "([^"]*)"/, goTo],
- [/the "([^"]*)" element should be visible$/, isVisible],
- [/the "([^"]*)" element should not be visible$/, isNotVisible],
- [/^(?:|I )hover "([^"]*)" element/, hover],
+ // UNMAPPED: I browse "http://localhost:3000/"
+ // UNMAPPED: I am on "/action"
+ // UNMAPPED: the ".hover-test .one" element should be visible
+ // UNMAPPED: the ".hover-test .two" element should not be visible
+ // UNMAPPED: I hover ".hover-test" element
+ ...
```

**Result:** 0/1 scenario runs; 7 undefined steps.

**Four of the five patterns were reconstructible from what the prompt shows:**

| Step | Held-out body | Visible in the template | Verdict |
|---|---|---|---|
| `I hover "…" element` | `this.mink.page.hover(selector)` | nothing , `page.hover` appears nowhere; the page methods on view are `click`, `goto`, `reload`, `goBack`, `$eval`, `$$eval`, `waitForSelector`, `waitForNavigation`, `select`, `evaluate`, `setViewport`, `screenshot`, `url` | UNMAPPED is defensible |
| `… element should be visible` | `waitForSelector(true)` | the `waitForSelector` factory (`page.waitForSelector(selector, { timeout: 100, visible, hidden })`) is fully visible; `isVisible` is even still referenced in `module.exports` | derivable |
| `… element should not be visible` | `waitForSelector(false, true)` | `isNotExisting = waitForSelector(false, true)` is the identical call, one line above | derivable |
| `I browse "…"` | `this.mink.config.baseUrl = …` | `baseUrl` in `DEFAULT_CONFIG` and `examples/support.js`; `Errors.NAVIGATION.*` names it; `goRoot` reads it | derivable (minus the held-out env-expansion / absolute-URL check) |
| `I am on "…"` | `url.resolve(baseUrl, location)` → `page.goto` | `page.goto` in `goRoot`; `require('url')` in `assert_url.js` | derivable |

### Why everything was unmapped

The DSL CATALOG for this repo indexes exactly one function:

```
// ===== PUBLIC SURFACE INDEX (auto-extracted) =====
// src/utils/detect_series.js
//   - detectSeries(arr, iterator, check)
```

cucumber-mink's step definitions export `[regex, fn]` pairs, not named functions, and the driver (`Mink#html`, `#text`, `#count`, `#button`, `#link`, `#getSelector`, and the puppeteer `page`) is a class in the WORLD section, which the extractor does not index. Rule 1 does allow "members on `this` from WORLD", but the heading "the only functions you may call" over a one-entry catalog reads as "there is nothing to call", and this generation took it literally. Test 17 , same catalog, same WORLD , called `this.mink.text()` and `this.mink.page.goto()` without hesitation, so the information was reachable; what varied is how the model read Rule 1.

One caveat for the visibility steps: the `waitForSelector` factory is module-private (the same situation as the tsflow helpers in Tests 13 and 14), so a rule-abiding binding would inline `this.mink.page.waitForSelector(selector, { timeout: 100, visible: true })` rather than call the factory. The 100 ms timeout is a value the model would have had to copy from the visible code.

---

## Test 17 , Assert content (cucumber-mink, assert_content feature) - (Generation Fault)

Repo - https://github.com/adezandee/cucumber-mink

**Every step is bound, and none of them can run.** Two independent defects; either one alone fails all 3 scenario runs.

**Fault 1 , every quoted pattern is unmatchable:**

```diff
- [/^(?:|I )browse "([^"]*)"/, setBaseURL],
+ Given('I browse "{string}"', async function (url) {
```

`{string}` already consumes the quotes. Wrapping it in literal quotes compiles to `^I browse "("[^"]*")"$`, which only matches `I browse ""http://…""`. Checked against `@cucumber/cucumber-expressions`: `I browse "{string}"` → no match on the feature text; `I browse {string}` → match. Eleven of the fourteen bindings carry the defect. The Background's first step is one of them, so every scenario is undefined at step 1.

**Fault 2 , every assertion tests a Promise:**

```diff
- return this.mink.html().then(html => {
-   expect(html).to.contain(expected);
- });
+ expect(this.mink.text('body')).to.contain(text);
```

`Mink#text`, `#html` and `#count` all return promises (`page.$$eval`). Not one is awaited. Chai refuses the combination: `.to.contain('x')` on a promise throws *the given combination of arguments (promise and string) is invalid*, `.to.match(...)` fails with *expected Promise{…} to match*, `.greaterThan(0)` with *expected [object Promise] to be a number*, `.to.equal(3)` fails outright. The negated forms throw the same error rather than passing, so all eleven `Then`s fail, positive and negative alike.

**Semantics also drift where the feature is specifically testing the distinction:**

| Step | Original | Generated |
|---|---|---|
| `I browse "…"` | stores `config.baseUrl` (env-expanded, must be absolute) | navigates to it; base URL never set |
| `I am on the homepage` | `goto(config.baseUrl)` | `goto('/')` , puppeteer rejects a relative URL |
| `I am on "…"` | `url.resolve(baseUrl, path)` | `goto(path)` , relative, rejected |
| `I should see "…"` | page **HTML** (`page.content()`) | `text('body')` (rendered text) |
| `… in the "h1" element` **vs** `… element text` | `html(selector)` vs `text(selector)` , the feature runs both on purpose | both → `text(selector)` |
| `I should see an "…" element` | `waitForSelector({ visible: true })` | `count > 0` (existence, not visibility) |
| `… element should not exist` | `waitForSelector({ hidden: true })` | `count === 0` |
| `I should see an? "…" element` | `an?` | hard-coded `an` |

**Result:** 0/3 runs unchanged.

**What is right:** correct `Given` / `Then` split, `{int}` for the count, `{word}` for the two regex steps (both feature values are whitespace-free, so `{word}` happens to work where the original uses `(.+)`), and `this.mink.*` reached exactly the way the existing definitions reach it.

### Why the quotes were doubled

Rule 5 says "quoted text → `{string}`" and adds "`{string}` only matches quoted text", which guards against the *opposite* mistake (using it on a bare word). Nothing says the parameter consumes the quotes. Every registered pattern in this repo is a regex with a visible `"([^"]*)"`, so the model kept the quotes and swapped the capture group for the parameter. Test 18 does the same.

### Why the awaits were dropped

The originals are promise-chained (`.then(html => expect(...))`) rather than `async` / `await`. Rule 2 asks for `async function` and "await every DSL call"; the model converted the outer shape and not the dataflow.

---

## Test 18 , Assert url (cucumber-mink, assert_url feature) - (Generation Fault + Context Gap)

Repo - https://github.com/adezandee/cucumber-mink

**Five bindings, five empty bodies.** Each is registered with an `// UNMAPPED` comment as its only content:

```diff
- [/^(?:|I )should be on "([^"]*)"/, isEqual],
+ Then('I should be on "{string}"', async function (path) {
+   // UNMAPPED: I should be on "/post/2"
+ });
```

**Fault 1 , same `"{string}"` defect as Test 17.** `I browse`, `I am on` and `I should be on` never match. `I am on` opens every scenario, so 0/4 scenarios get past step 1.

**Fault 2 , unmapped steps registered as no-ops.** Rule 9 says to write the `// UNMAPPED` line *instead of* a binding. Here the comment sits inside a binding, so the step is defined and passes with an empty body. The two `{word}` patterns do match their feature text (`post.\d` and `search=fo+` are whitespace-free), so once Fault 1 is fixed, *Url matching* and *Url pattern matching* go **green without asserting anything**. An unmapped assertion that passes is worse than an undefined one; this is the most dangerous output shape in the report so far.

**Fault 3 , the base URL is rewritten:**

```
// UNMAPPED: I browse "[http://localhost:3000/](http://localhost:3000/)"
```

The feature says `I browse "http://localhost:3000/"`. The model turned it into a markdown link inside the comment. Harmless here because the body is empty, but it is a literal from the step text being altered, which Rules 5 and 6 forbid.

**Result:** 0/4 unchanged.

### What was held out

`assert_url.js` is removed from this template entirely , no `url.parse`, no `this.mink.page.url()`, no `pathname` / `search`. The puppeteer `page` object is reachable through WORLD, but `page.url()` is not mentioned anywhere in the prompt, and the catalog indexes only `detectSeries` (see Test 16). Declaring the three URL assertions unmapped is therefore defensible. The two navigation steps are not: `page.goto` and `config.baseUrl` are visible in `goRoot`. And registering the unmapped steps as passing stubs is wrong under any reading.

---

## Test 19 , Driver compatibilities (cucumber-mink, compatiblity feature) - (Generation Fault)

Repo - https://github.com/adezandee/cucumber-mink

**Zero bindings, zero requires.** The whole output is 18 comment lines in a form Rule 9 does not define:

```
// UNMAPPED (missing DSL function): Given I browse "http://localhost:3000/"
// UNMAPPED (missing DSL function): Given I am on homepage
// UNMAPPED (missing DSL function): And I follow "Post-1"
// UNMAPPED (missing DSL function): And I follow "a[href='/post/1']"
// UNMAPPED (missing DSL function): And I follow "Follow me to form !"
// UNMAPPED (missing DSL function): And I follow "Follow me to form"
...
```

One line per *occurrence* rather than per pattern (`I follow` ×4, `I press` ×4, `I should be on` ×6, `I should see` ×2), which is the opposite of the prompt's own framing: "a pattern is written once and shared by every scenario that uses it."

**Every held-out function has a visible twin in the same template:**

| Held out | Visible twin | What changes |
|---|---|---|
| `press` | `Mink#button(mixed)` in WORLD, full body; `submit` shows `page.waitForNavigation()`; `sendKey` shows `handle.dispose()`; `Errors.ACTION.CLICK_BUTTON` in the catalog | assemble `button()` → `click()` → `dispose()` |
| `follow` | `Mink#link(mixed)` in WORLD, full body; `Errors.ACTION.CLICK_LINK` | same with `link()` |
| `seeText` | `notSeeText` , identical body with `.to.not.contain` | drop the `not` |
| `isEqual` | `isRoot` still calls `isEqual.bind(this)('/')`; `urlMatch` shows `url.parse(this.mink.page.url()).pathname` | `.to.equal(location)` on `pathname + search` |
| `goRoot` | `config.baseUrl` in WORLD; `Errors.NAVIGATION.ROOT` names `config.baseUrl` | `page.goto(this.mink.config.baseUrl)` |

**Result:** 0/2 scenarios unchanged; every step in the file is undefined.

### Why nothing was written

The invented label says what the model checked: it searched the DSL CATALOG (one entry, `detectSeries`), found no function named for the step, and stopped. It did not read WORLD or EXISTING STEP DEFINITIONS, where every one of the five bodies is either present or one token away. Same root cause as Test 16, but here nothing is genuinely missing, so the category is Generation Fault with the catalog-index gap as a contributing factor.

---

## Test 20 , Forms (cucumber-mink, form feature) - (Generation Fault + Context Gap)

Repo - https://github.com/adezandee/cucumber-mink

**Nothing is registered, and the wrapper guarantees it:**

```js
const cucumber = require('@cucumber/cucumber');

module.exports = function () {
  // 28 comment lines
};
```

`module.exports = function () { … }` is the cucumber-js 1.x support-code idiom. `@cucumber/cucumber` requires the file and never invokes an exported function, so even if the comments were bindings they would not register. `cucumber` is required and never used.

**Fault 2 , two `// EXISTS` misfires:**

```
// EXISTS: Then the "#cb" checkbox should not be checked
// EXISTS: Then the "#cb" checkbox should be checked
```

REGISTERED STEPS has `the checkbox "([^"]*)" (?:is|should be) checked$` and `the checkbox "([^"]*)" should (?:be unchecked|not be checked)$` , *the checkbox "X"*, not *the "X" checkbox*. The feature's word order is the held-out one (`isChecked` is removed from this template). Same Rule 4 failure as Test 12: near-identical siblings taken for a match.

**Fault 3 , the outline placeholder in verb position is never expanded:**

```gherkin
And I <cbState> "#cb"
...
| cbState |
| check   |
| uncheck |
```

The runner substitutes `check` / `uncheck` before matching, so this needs the two patterns the original has (`I check "…"`, `I uncheck "…"`). The generated file lists the raw `<cbState>` line as unmapped, which is precisely the case the "THE RUNNER HANDLES THESE" section describes.

**Fault 4 , inconsistent, per-occurrence labelling.** `I should see "Form Page"` is `UNMAPPED`; `I press` is `UNMAPPED (missing DSL function)`; the five `should see "…" in the "…" element` lines are listed once each although they are one pattern.

**Result:** 0/7 scenario runs (1 scenario + 3 outline rows + 3 outline rows).

### What was derivable

| Step family | Held out | Visible in the template | Verdict |
|---|---|---|---|
| `I press "…"` | `press` | `follow` (identical shape, `link` → `button`); `Mink#button` in WORLD | derivable |
| `I should see "…"` | `seeText` | `notSeeText` | derivable |
| `I should see "…" in the "…" element` | `elementContainsText` | `elementNotContainsText`, `elementTextContainsText` | derivable |
| `I should be on "…"` | `isEqual` | `isRoot` (still references it), `urlMatch` | derivable |
| `I browse`, `I am on "…"` | `setBaseURL`, `goTo` | `goRoot`, `config.baseUrl` | derivable |
| `checkbox should be checked`, `field should be enabled / disabled` | `isChecked`, `isDisabled` | nothing , `page.$eval` appears nowhere in this template (WORLD uses only `$$eval` for reads) | context gap |
| `fill in`, `fill in the following:`, `select … from`, `check` / `uncheck` | all of `form.js` | nothing , `page.$eval` with a value argument and `page.select` are absent; `Mink#elementsWithText` is visible but its use on `<option>` is not | context gap |
| `current option contain`, `field should (not) contain` | all of `assert_form.js` | nothing | context gap |
| `I submit "…" form` | `submit` | `page.$eval` + DOM `form.submit()` not shown | context gap |

Roughly half the feature's patterns were reconstructible; the other half needed puppeteer element APIs the prompt never shows. The model wrote neither half, and the wrapper means it could not have registered them anyway.

### Why the legacy wrapper

`test/features/support/mink.js` (in the catalog) and `examples/support.js` (in WORLD) are support files that register through an object , `mink.gherkin(cucumber)`, `driver.hook(cucumber)` , rather than with top-level `Given` / `Then`. The model appears to have pattern-matched "support file that wires things up" to the old `module.exports = function` idiom. Nothing in the prompt uses it; it is training-data recall.

---

## Note on the revised-prompt round (Tests 8, 10, 12, 13, 14)

Three things stand out across the five re-runs:

1. **The indexed field was never used.** `verifiedLastRunError` is now listed `(read/write)`, rule 1 permits assigning it, rule 9 says to re-check the field list , and none of 10, 12 or 14 set it. Test 12 *lost* it. On this evidence the flag omission is a generation fault, not a context gap.
2. **A new failure mode: silent step omission.** Gen 1 never dropped a feature step without leaving either a binding or an `// EXISTS` line. Gen 2 does so in 10 (`the output contains {string}`), 12 (`the output contains text:`) and 14 (`it fails`). Two of the three are siblings of a registered family, which is exactly what rule edit B targets; the third (`it fails`) is not. The edit may have made the model more cautious about redefining without making it more diligent about writing , but one sample per template cannot confirm cause.
3. **`CALLABLE HELPERS` did not change behaviour.** It correctly labels the flexible-output helpers as reimplementable; 13 and 14 still use naive substring / split matching.

Suggested next steps: (a) re-sample each revised template several times before attributing the omissions to rule 4; (b) add an output-completeness rule , every step in the feature must appear in the output exactly once, as a binding, an `// EXISTS` line, or an `// UNMAPPED` line , which would have caught all three omissions mechanically; (c) Test 8 needs no further prompt work.


## Note on the cucumber-mink round (Tests 16 to 20)

Five templates from one repo, one generation each, 0 of 17 scenario runs unchanged across the five. Four things stand out:

1. **The catalog index is empty for this repo.** `PUBLIC SURFACE INDEX` lists `detectSeries` only. The step definitions export `[regex, fn]` pairs and the driver is a class in WORLD; the extractor indexes neither. Three of five outputs (16, 19, 20) declared nearly every step unmapped, two of them with an invented `(missing DSL function)` label that says exactly what was checked. The other two (17, 18) called `this.mink.*` and `this.mink.page.*` freely. Same prompt, opposite readings of Rule 1.
2. **`"{string}"` is a new, mechanical failure mode.** Both files that used Cucumber Expressions wrapped `{string}` in literal quotes; verified against `@cucumber/cucumber-expressions` never to match. Every registered pattern in this repo is a regex, so the safer path was to keep regexes as the existing definitions do.
3. **Unmapped steps registered as no-op bodies (18).** That converts "undefined step" into "assertion passes". Rule 9's forms are comments, not bindings; the model merged the two.
4. **Twins of held-out code were on the page and not used.** `notSeeText` ↔ `seeText`, `follow` ↔ `press`, `isNotExisting = waitForSelector(false, true)` ↔ `isNotVisible`, `goRoot` ↔ `goTo`, `isRoot` still calling `isEqual`. The generator does not mine EXISTING STEP DEFINITIONS for mirrors of what it is asked to write.

Suggested prompt changes: (a) have the extractor index class methods and fields reachable from `this` (`Mink#html`, `Mink#page: puppeteer.Page`, `Mink#config.baseUrl`, …) and, where a third-party driver hangs off `this`, either list its surface or state "any method of `this.mink.page` (puppeteer `Page`) is callable"; (b) Rule 5: "`{string}` consumes the quotes , write `{string}`, never `"{string}"`; when EXISTING STEP DEFINITIONS use regexes, use regexes"; (c) Rule 9: an unmapped step gets a comment and **no binding**; (d) the output-completeness rule proposed after Test 14 (one line per pattern, as a binding, `// EXISTS`, or `// UNMAPPED`) would have caught 19 and 20 mechanically.
