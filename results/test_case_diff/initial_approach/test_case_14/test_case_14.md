Test name- hooks

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

  @then("the output does not contain {string}")
  @then("the output does not contain text:")
  public checkStdoutDoesNotContains(text: string) {
    expect(this.runner.lastRun.output).not.toContain(text);
  }

  @then("the error output contains {string}")
  @then("the error output contains text:")
  public checkStderrContains(text: string) {
    expect(this.runner.lastRun.errorOutput).toContain(text);
  }

// ---- cucumber-tsflow-specs/src/step_definitions/file_steps.ts ----
  @given("a file named {string} with:")
  public newFile(filePath: string, fileContent: string) {
    this.runner.dir.writeFile(filePath, fileContent);
  }

// ---- cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts ----
  @then("the hook {string} was executed on scenario {string}")
  public checkNamedHookExecution(hookName: string, scenarioName: string) {
    const hook = this.runner.extractor.getHookByName(hookName);
    const executions = this.runner.extractor.getHookExecutions(
      scenarioName,
      hook.id,
    );

    assert(
      executions.length === 1,
      `Hook ${hookName} executed ${executions.length} times on scenario "${scenarioName}"`,
    );
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
    expect(this.runner.lastRun.error).toBeNull();
  }

  @then("it fails")
  public async checkFails() {
    await Promise.resolve();
    expect(this.runner.lastRun.error).not.toBeNull();
  }

  @then("the output does not contain {string}")
  public async checkOutputDoesNotContain(text: string) {
    await Promise.resolve();
    expect(this.runner.lastRun.output).not.toContain(text);
  }

  @then("the output contains {string}")
  public async checkOutputContains(text: string) {
    await Promise.resolve();
    expect(this.runner.lastRun.output).toContain(text);
  }

  @then("the output contains text:")
  public async checkOutputContainsText(text: string) {
    await Promise.resolve();
    expect(this.runner.lastRun.output).toContain(text);
  }

  @then("the error output contains text:")
  public async checkErrorOutputContainsText(text: string) {
    await Promise.resolve();
    expect(this.runner.lastRun.errorOutput).toContain(text);
  }

  @then("the hook {string} was executed on scenario {string}")
  public async checkHookExecuted(hookName: string, scenarioName: string) {
    const hook = await Promise.resolve(this.runner.extractor.getHookByName(hookName));
    const executions = await Promise.resolve(
      this.runner.extractor.getHookExecutions(scenarioName, hook.id),
    );

    expect(executions.length).toBeGreaterThan(0);
  }
}

export = HookSteps;
```
