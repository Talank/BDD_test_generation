# Candidate issues between a Gherkin scenario and its step definitions
This is all possible issues that may occur between a scenario and developer written step definitions found by examining 20 test samples.


## Summary

| ID | Issue | Seen in |
|---|---|---|
| 1 | Given/When/Then keyword doesn't match the code | T3, T7 |
| 2 | The step does extra things it doesn't mention | T1, T3 |
| 3 | A Given or When step secretly checks something | T2, T7, T19, T20 |
| 4 | The Then step is vague about what it checks | T2, T3, T6 |
| 5 | The code checks an exact count the step doesn't mention | T2, T14 |
| 6 | A scenario depends on another scenario | T4 |
---

### 1. Given/When/Then keyword mismatch
The scenario writes a step as `Given`, but the code registers it as `Then` (or similar). Cucumber doesn't care about the keyword, so the test still runs, but it misleads anyone reading it. 

**Example.**
- **T7:** `Given I send a request to delete my user` is defined with `Then(...)`.
- **T3:** `But Login should fail` is defined with `When(...)`.

**How to fix the scenario.** Use Given for setup, When for the action and Then for the check.

---

### 2. The step does extra things scenario doesn't mention
The code does more than the step's text says, and later steps often rely on those extra actions.

**Example.**
- **T1:** "enters the registration details" also accepts the privacy policy and submits the form. The next step, which checks for "Your Account Has Been Created!", only works because of that hidden submit.
- **T3:** "click on the login button" also waits for the page to load, plus an extra 2 seconds.

**How to fix the scenario.** Make the extra actions visible, for example "When the user registers with …" or "And accepts the privacy policy / And submits the form".

### 3. A Given or When step secretly asserts something
A step that should just set something up or do an action also contains a check, which can make the test fail there.

**Example.**
- **T7:** "send a request to delete my user" also checks that the response code is 204.
- **T19/T20:** "press", "follow" and "submit" all wait for the page to change. If the page doesn't navigate, they fail or time out.
- **T2:** "should see N subscriptions" first checks that at least one item is visible, so "should see 0 subscriptions" could never pass.

**How to fix the scenario.** Add a separate Then for the check, for example "Then the user is deleted" or "Then I am taken to …".


### 4. The 'Then' step is vague about what it checks
The Then step says something general like "should be success", but the code checks one specific thing.

**Example.**
- **T3:** "Login should be success" just checks that the user menu button is visible.
- **T2:** "user should see the subscription page" just checks that the filter button is visible.
- **T6:** "I receive my user ID" just checks that the ID is a string.
**(T6).** In `Then I receive an error "Bad Request" with status code 400`, "Bad Request" is compared with the HTTP status text, not an error message in the response body.

**How to fix the scenario.** Say what is actually checked, for example "Then the user menu shows the username".



### 5. The code checks an exact count the step doesn't mention
The code checks for an exact number of times, but the step doesn't say so.

**Example.**
- **T14:** "the hook was executed on scenario "example"" actually checks that it ran exactly once.
- **T2:** "should see "3" subscriptions" means exactly 3, not at least 3.

**How to fix the scenario.** Add the number: "was executed once", "should see exactly 3 subscriptions".


### 6. A scenario depends on another file
A scenario needs the implementation of shared steps files or dependent on some other scenario.

**Example (T4).** "Using access token" uses a token that was saved by the previous scenario, "Access token retrieval". T9 does the same flow inside a single scenario, which avoids the problem.

**How to fix the scenario.** Merge the two scenarios, or add the setup steps to the scenario that needs them.




