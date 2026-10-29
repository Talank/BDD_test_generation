# Test case 2

## Gherkin scenario

```gherkin
Feature: Subscriptions
  As an user, I'm able to view the subscription page

  Scenario: User open the app and navigate subscription page
    Given user open the app
    And user open the subscription link
    Then user should see the subscription page

  Scenario: User on subscription page, should be able to filter the list of subscriptions
    Given user open the "subscriptions" page
    Then user should see "3" subscriptions
    When user change filter by "One Time Purchase"
    Then user should see "1" subscriptions

  Scenario: User upon refreshing subscription page, should see filter persisted
    Given user open the "subscriptions" page
    And user change filter by "One Time Purchase"
    Then user should see "1" subscriptions
    When user reload current page
    Then user should see "1" subscriptions
```

## Original test

```ts
import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { ICustomWorld } from "../support/custom-world";
Given(/^user open the subscription link$/, async function (this: ICustomWorld) {
  await this.pageObjects.subscriptionPo.subscriptionLink().click();
});
Then(
  /^user should see the subscription page$/,
  async function (this: ICustomWorld) {
    await expect(this.pageObjects.subscriptionPo.filterTrigger()).toBeVisible();
  },
);
Then(
  /^user should see "([^"]*)" subscriptions$/,
  async function (this: ICustomWorld, num) {
    await expect(this.pageObjects.subscriptionPo.list().first()).toBeVisible();
    expect(await this.pageObjects.subscriptionPo.list().count()).toBe(+num);
  },
);
When(
  /^user change filter by "([^"]*)"$/,
  async function (this: ICustomWorld, option) {
    await this.pageObjects.subscriptionPo.pickOptionFromFilter(option);
  },
);
```

## Generated test

```ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { ICustomWorld } from "../support/custom-world";
Given("user open the app", async function (this: ICustomWorld) {
  // UNMAPPED: user open the app
});
Given("user open the subscription link", async function (this: ICustomWorld) {
  await this.pageObjects!.subscriptionPo.subscriptionLink().click();
});
Given(
  "user open the {string} page",
  async function (this: ICustomWorld, page: string) {
    // UNMAPPED (missing value): user open the {string} page
  },
);
Then(
  "user should see the subscription page",
  async function (this: ICustomWorld) {
    await expect(this.pageObjects!.subscriptionPo.list().first()).toBeVisible();
  },
);
Then(
  "user should see {string} subscriptions",
  async function (this: ICustomWorld, count: string) {
    await expect(this.pageObjects!.subscriptionPo.list()).toHaveCount(
      Number(count),
    );
  },
);
When(
  "user change filter by {string}",
  async function (this: ICustomWorld, option: string) {
    await this.pageObjects!.subscriptionPo.pickOptionFromFilter(option);
  },
);
When("user reload current page", async function (this: ICustomWorld) {
  await this.page!.reload();
});
```
