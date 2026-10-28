

## Generated
```ts
import { binding, given, then, when } from "cucumber-tsflow";

import { TestRunner } from "../support/runner";

@binding([TestRunner])
class HookSteps {
  public constructor(private readonly runner: TestRunner) {}

  @given("a file named {string} with:")
  public async writeFile(filePath: string, contents: string) {
    await this.runner.dir.writeFile(filePath, contents);
  }

  @when("I run cucumber-js")
  public async runCucumber() {
    await this.runner.run();
  }

  @then("it passes")
  public async checkPasses() {
    if (this.runner.lastRun.error != null) {
      throw new Error(this.runner.lastRun.errorOutput);
    }
  }

  @then("the output does not contain {string}")
  public async checkOutputDoesNotContain(text: string) {
    if (this.runner.lastRun.output.includes(text)) {
      throw new Error(`Output contains "${text}"`);
    }
  }

  @then("the output contains {string}")
  public async checkOutputContains(text: string) {
    if (!this.runner.lastRun.output.includes(text)) {
      throw new Error(`Output does not contain "${text}"`);
    }
  }

  @then("the output contains text:")
  public async checkOutputContainsText(text: string) {
    if (!this.runner.lastRun.output.includes(text)) {
      throw new Error(`Output does not contain "${text}"`);
    }
  }

  @then("the error output contains text:")
  public async checkErrorOutputContainsText(text: string) {
    if (!this.runner.lastRun.errorOutput.includes(text)) {
      throw new Error(`Error output does not contain "${text}"`);
    }
  }

  @then("the hook {string} was executed on scenario {string}")
  public async checkHookExecuted(hookName: string, scenarioName: string) {
    const hook = await this.runner.extractor.getHookByName(hookName);
    const executions = await this.runner.extractor.getHookExecutions(
      scenarioName,
      hook.id,
    );

    if (executions.length === 0) {
      throw new Error(
        `Hook "${hookName}" was not executed on scenario "${scenarioName}"`,
      );
    }
  }
}

export = HookSteps;
```
