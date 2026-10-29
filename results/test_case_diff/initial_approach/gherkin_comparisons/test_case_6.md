# Test case 6

## Gherkin scenario

```gherkin
Feature: Create a user

  @user
  Scenario: I can create a user
    Given user profile data
      | email              | country | street      | postalCode |
      | john.doe@gmail.com | England | Road Avenue | 29145      |
    When I send a request to create a user
    Then I receive my user ID
    And I can see my user in a list of all users

  @user
  Scenario Outline: I try to create a user with invalid data
    Given user profile data
      | email   | country   | street   | postalCode   |
      | <Email> | <Country> | <Street> | <PostalCode> |
    When I send a request to create a user
    Then I receive an error "Bad Request" with status code 400

    Examples:
      | Email          | Country | Street      | PostalCode |
      | johngmail.com  | England | Road Avenue | 29145      |
      | john@gmail.com | 123     | Road Avenue | 29145      |
      | johng@mail.com | England | 123         | 29145      |
      | johng@mail.com | England | Road Avenue | @          |
      | #@!$           | $#@1    | %542        | !321       |
```

## Original test

```ts
// ---- tests/shared/common.steps.ts ----
Then(
  /^I receive an error "(.*)" with status code (\d+)$/,
  async function (this: ICustomWorld, errorMessage: string, statusCode: string) {
    assert.strictEqual(this.context.latestResponse!.statusCode, +statusCode);
    assert.strictEqual(this.context.latestResponse!.statusMessage, errorMessage);
  },
);

// ---- tests/user/user.steps.ts ----
Given(/^user profile data$/, function (this: ICustomWorld, table) {
  this.context.createUserDto = table.hashes()[0];
});

When('I send a request to create a user', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: '/api/v1/users',
    body: this.context.createUserDto,
  });
});

Then('I receive my user ID', function (this: ICustomWorld) {
  assert.deepStrictEqual(typeof this.context.latestResponse!.json().id, 'string');
});

Then('I can see my user in a list of all users', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'GET',
    url: '/api/v1/users',
  });
  const users = response.json<Paginated<UserModel>>();
  assert.strictEqual(
    users.data.some((item) => item.id === this.context.latestResponse!.json().id),
    true,
  );
});
```

## Generated test

```ts

import assert from 'node:assert';
import { Given, Then, When } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';
Given('user profile data', async function (this: ICustomWorld, table: DataTable) {
  this.context.createUserDto = table.rowsHash();
});
When('I send a request to create a user', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: '/api/v1/users',
    payload: this.context.createUserDto,
  });
});
Then('I receive my user ID', async function (this: ICustomWorld) {
  assert.strictEqual(this.context.latestResponse!.statusCode, 201);
  assert.ok(this.context.latestResponse!.json().id);
});
Then('I can see my user in a list of all users', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'GET',
    url: '/api/v1/users',
  });
  const users = response.json<{ data: Array<{ id: string }> }>();
  assert.ok(
    users.data.some((item) => item.id === this.context.latestResponse!.json().id),
  );
});
Then(
  'I receive an error {string} with status code {int}',
  async function (this: ICustomWorld, message: string, statusCode: number) {
    assert.strictEqual(this.context.latestResponse!.statusCode, statusCode);
    assert.strictEqual(this.context.latestResponse!.json().message, message);
  },
);
```
