# Test Case Comparison Report
**Overview:** Comparison of two test cases converting `apickli-gherkin.js` step definitions from callbacks to `async`/`await`.

---

## Test 1 — Full Step File (34 steps)

**All steps and focal methods match.** The callback → async conversion is done correctly: `callbackWithAssertion` is dropped and replaced with inline throws.

**Only One regex is different **

```diff
- Then(/^response body path (.*) should be (((?!of type).*))$/, ...)
+ Then(/^response body path (.*) should be (.*)$/, ...)
```

```gherkin
Then response body path $.items should be of type array
```

---

## Test 2 — Reduced Step Set (17 steps)

Test 2 also does the same regex mistake as Test 1.

**All steps are present**, but another problem arises:

```diff
  Then(/^response code should be (.*)$/, async function(responseCode) {
    const assertion = await this.apickli.assertResponseCode(responseCode);
-   callbackWithAssertion(callback, assertion);
+   callbackWithAssertion(this, assertion);
  });
```
This leads to error in runtime



