test name - tag parameters

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

// ---- cucumber-tsflow-specs/src/step_definitions/file_steps.ts ----
  @given("a file named {string} with:")
  public newFile(filePath: string, fileContent: string) {
    this.runner.dir.writeFile(filePath, fileContent);
  }

```

## Generated
```ts
import { binding, given, then, when } from "cucumber-tsflow";
import assert from "assert";
import { TestRunner } from "../support/runner";

@binding([TestRunner])
class TagParameterSteps {
  public constructor(private readonly runner: TestRunner) {}

  @given('a file named {string} with:')
  public createFile(filePath: string, content: string) {
    this.runner.dir.writeFile(filePath, content);
  }

  @when("I run cucumber-js")
  public async runCucumber() {
    await this.runner.run();
  }

  @then("it passes")
  public checkPasses() {
    assert.strictEqual(this.runner.lastRun.error, null);
  }
}

export = TagParameterSteps;
```
