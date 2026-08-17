# Test Case Comparison Report —
**Overview:** Comparison of two test cases (Fastify `server.inject` API tests) based on setup, action steps and assertions.


---

## Test 1 — Create User

**Action step matches.**

### 1a. Setup — data table is parsed wrongly

```diff
  Given('user profile data', async function (this: ICustomWorld, table: DataTable) {
-   this.context.createUserDto = table.hashes()[0];
+   this.context.createUserDto = table.rowsHash();
  });
```

These are not interchangeable

| |  |
|---|---|
| `hashes()[0]` | Header row + first data row 
| `rowsHash()` | Column 1 as keys, column 2 as values 



### 1b. Added one more assertion, both seems weak

```diff
  Then('I receive my user ID', async function (this: ICustomWorld) {
+   assert.strictEqual(this.context.latestResponse!.statusCode, 201);
-   assert.deepStrictEqual(typeof this.context.latestResponse!.json().id, 'string');
+   assert.ok(this.context.latestResponse!.json().id);
  });
```
---

## Test 2 — Delete user

**Setup carry the same issue as Test 1** (`rowsHash()`).


### 2b. The final assertion is again different

```diff
  Then('I cannot see my user in a list of all users', async function (this: ICustomWorld) {
    const users = response.json<...>();
+   const userId = this.context.createUserDto!.email;   // declared, never used
    assert.strictEqual(
-     users.data.some((item) => item.id === this.context.latestResponse!.json().id),
+     users.data.some((item) => item.id === this.context.latestResponse?.json().id),
      false,
    );
  });
```