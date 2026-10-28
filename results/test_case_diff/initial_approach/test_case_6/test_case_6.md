test name - create-user

## Original
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

## Generated
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

