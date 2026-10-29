# Test case 10

## Gherkin scenario

```gherkin
Feature: Binding steps

    Scenario Outline: Bind steps with <Bind Mode>
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario a
                Given step one
                When step two
                Then step three
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, when, then} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @given(<Step 1>)
                public given() {
                    console.log("Step one executed");
                }

                @when(<Step 2>)
                public when() {
                    console.log("Step two executed");
                }

                @then(<Step 3>)
                public then() {
                    console.log("Step three executed");
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains "Step one executed"
        And the output contains "Step two executed"
        And the output contains "Step three executed"

        Examples:
            | Bind Mode | Step 1       | Step 2       | Step 3         |
            | names     | "step one"   | "step two"   | "step three"   |
            | regex     | /^step one$/ | /^step two$/ | /^step three$/ |

    Scenario: Failing test
        Given a file named "features/a.feature" with:
            """feature
            Feature: Some feature
              Scenario: example
                Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given} from 'cucumber-tsflow';

            @binding()
            class Step {
                @given("a step")
                public step() {
                    throw new Error("Inner error message.");
                }
            }

            export = Step;
            """
        When I run cucumber-js
        Then it fails
        And the output contains "Error: Inner error message."

    Scenario: Missing step definition
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario a
                Given missing step
            """
        When I run cucumber-js
        Then it fails
        And the output contains "Given('missing step'"
```

## Original test

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

## Generated test

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
