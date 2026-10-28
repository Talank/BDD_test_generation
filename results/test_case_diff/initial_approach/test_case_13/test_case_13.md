Test name- global hooks

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

  @then("the output contains {string} once")
  @then("the output contains text once:")
  public checkStdoutContainsOnce(text: string) {
    const { output } = this.runner.lastRun;

    expectOutputToContain(output, text);
    expect(countMatches(output, text)).toBe(1);
  }

// ---- cucumber-tsflow-specs/src/step_definitions/file_steps.ts ----
  @given("a file named {string} with:")
  public newFile(filePath: string, fileContent: string) {
    this.runner.dir.writeFile(filePath, fileContent);
  }

```

## Generated
```ts
import { DataTable } from "@cucumber/cucumber";
import { binding, given, then, when } from "cucumber-tsflow";
import expect from "expect";

import { TestRunner } from "../support/runner";

@binding([TestRunner])
class HookSteps {
  public constructor(private readonly runner: TestRunner) {}

  @given("a file named {string} with:")
  public async writeFile(filePath: string, contents: string) {
    this.runner.dir.writeFile(filePath, contents);
  }

  @when("I run cucumber-js")
  public async runCucumber() {
    await this.runner.run();
  }

  @then("it passes")
  public ensureSuccess() {
    const exitCode = this.runner.lastRun.error?.code ?? 0;
    expect(exitCode).toBe(0);
  }

  @then("the output contains text once:")
  public checkOutputContainsTextOnce(text: string) {
    const occurrences = this.runner.lastRun.output.split(text).length - 1;
    expect(occurrences).toBe(1);
  }
}

export = HookSteps;
```

```
