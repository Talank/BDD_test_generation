# Test Case Comparison Report
**Overview:** Comparison of three test cases based on focal methods, action steps and setups.

**Prompts and Test cases Link:** https://github.com/Talank/BDD_test_generation/tree/master/results/test_case_diff


## Test 1 — Registration Flow


**Focal method matches.** `enterRegistrationDetails()` is called identically in both versions.

**But two required actions are missing after it:**

```diff
  await new RegisterUserPage(this.page).enterRegistrationDetails(...);
- await new RegisterUserPage(this.page).agreePrivacyPolicy();
- await new RegisterUserPage(this.page).clickContinueButton();
```

**Setup is also weaker** — original randomizes the email to avoid duplicate-user failures; generated uses it raw:

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

---

## Test 2 — Subscription Filtering

**Setup and two focal methods match.** 

**but one focal method is replaced and that changes the assertion:**

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
---

## Test 3 — Login Flow

**Setup and action steps match.**

**Success assertion focal method is substituted:**

```diff
  Then('Login should be success', async function () {
-   const user = page.locator("...mat-menu-trigger...span[1]");
-   await expect(user).toBeVisible();
+   await assert.assertURL("https://bookcart.azurewebsites.net/");
  });
```


**Result:** Weak assertion again.

---

## Summary

```
Test 1 (Registration)   Focal method: OK    Setup: WEAK    Actions: 2 MISSING
Test 2 (Subscription)   Focal method: OK    Setup: OK      Assertion: Weak
Test 3 (Login)          Focal method: N/A   Setup: OK      Assertion: WEAK
```
