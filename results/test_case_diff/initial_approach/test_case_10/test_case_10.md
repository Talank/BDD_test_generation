Test name - basic-test

## Original
```ts
// ---- cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts ----
  @when("I run cucumber-js")
  public async runCucumber() {
    await this.runner.run();
  }

  @then("it passes")
  public checkPassed() {
    const { lastRun } = this.runner;

    if (lastRun?.error != null) {
      throw new Error(
        `Last run errored unexpectedly. Output:\n\n${lastRun.output}\n\n` +
          `Error Output:\n\n${lastRun.errorOutput}`,
      );
    }
  }

  @then("it fails")
  public ensureFailure() {
    const exitCode = this.runner.lastRun.error?.code ?? 0;
    expect(exitCode).not.toBe(0);

    this.runner.verifiedLastRunError = true;
  }

  @then("the output contains {string}")
  @then("the output contains text:")
  public checkStdoutContains(text: string) {
    expectOutputToContain(this.runner.lastRun.output, text);
  }

// ---- cucumber-tsflow-specs/src/step_definitions/file_steps.ts ----
  @given("a file named {string} with:")
  public newFile(filePath: string, fileContent: string) {
    this.runner.dir.writeFile(filePath, fileContent);
  }

```

## Generated
```ts
import assert from "assert";

import { binding, given, when, then } from "cucumber-tsflow";

import { TestRunner } from "../support/runner";

@binding([TestRunner])
class BindingSteps {
  public constructor(private readonly runner: TestRunner) {}

  @given("a file named {string} with:")
  public async writeFile(filePath: string, content: string) {
    await this.runner.dir.writeFile(filePath, content);
  }

  @when("I run cucumber-js")
  public async runCucumber() {
    await this.runner.run();
  }

  @then("it passes")
  public async checkPasses() {
    await Promise.resolve();
    assert.strictEqual(this.runner.lastRun.error, null);
  }

  @then("it fails")
  public async checkFails() {
    await Promise.resolve();
    assert.notStrictEqual(this.runner.lastRun.error, null);
  }

  @then("the output contains {string}")
  public async checkOutputContains(text: string) {
    await Promise.resolve();
    assert.ok(this.runner.lastRun.output.includes(text));
  }
}

export = BindingSteps;
```
