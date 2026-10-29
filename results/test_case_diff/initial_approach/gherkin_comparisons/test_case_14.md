# Test case 14

## Gherkin scenario

```gherkin
Feature: Support for Cucumber hooks

    Scenario: Binding a before hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before()
                public hook() {
                    this.state = 'hook has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "hook has not executed"
        And the output contains "hook has executed"

    Scenario: Binding an after hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'step has not executed';

                @after()
                public hook() {
                    console.log(this.state);
                }

                @given("a step")
                public given() {
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains "step has executed"

    Scenario: Binding before and after hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before()
                public before() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @after()
                public after() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .before hook executed
            .step has executed
            """

    Scenario: Binding multiple before hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @before()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @before()
                public hookTwo() {
                    console.log(this.state)
                    this.state = 'hook two has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            .hook one has executed
            .hook two has executed
            """


    Scenario: Binding multiple hooks same line
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @before()public hookOne() {console.log(this.state);this.state = 'hook one has executed';}@before()public hookTwo() {console.log(this.state);this.state = 'hook two has executed';}

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            .hook one has executed
            .hook two has executed
            """

    Scenario: Binding multiple after hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @given("a step")
                public given() {
                    console.log(this.state)
                    this.state = 'step has executed';
                }

                @after()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @after()
                public hookTwo() {
                    console.log(this.state);
                    this.state = 'hook two has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            .step has executed
            .hook two has executed
            """

    @oldApis
    Scenario: Attempting to bind named hooks with old cucumber
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before({name: 'setup environment'})
                public before() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @after({name: 'tear down environment'})
                public after() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it fails
        And the error output contains text:
            """
            Object literal may only specify known properties, and 'name' does not exist in type 'HookOptions'.
            """

    @newApis
    Scenario: Binding named hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before({name: 'setup environment'})
                public before() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @after({name: 'tear down environment'})
                public after() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the hook "setup environment" was executed on scenario "example"
        And the hook "tear down environment" was executed on scenario "example"

    Scenario: Binding a before step hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @beforeStep()
                public hook() {
                    this.state = 'hook has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "hook has not executed"
        And the output contains "hook has executed"

    Scenario: Binding a before step hook with multiple steps
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
                    And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep, when} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private counter = 0;

                @beforeStep()
                public hook() {
                    console.log(`${this.counter++} execution: beforeStep`);
                }

                @given("a step")
                public given() {
                    console.log(`${this.counter++} execution: given`);
                }

                @when("another step")
                public when() {
                    console.log(`${this.counter++} execution: when`);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "hook has not executed"
        And the output contains text:
            """
            .0 execution: beforeStep
            1 execution: given
            .2 execution: beforeStep
            3 execution: when
            """

    Scenario: Binding multiple before step hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @beforeStep()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @beforeStep()
                public hookTwo() {
                    console.log(this.state)
                    this.state = 'hook two has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            hook one has executed
            hook two has executed
            """

    Scenario: Binding an after step hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'step has not executed';

                @afterStep()
                public hook() {
                    console.log(this.state);
                }

                @given("a step")
                public given() {
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains "step has executed"

    Scenario: Binding an after step hook with multiple steps
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
                    And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterStep, when} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private counter = 0;

                @afterStep()
                public hook() {
                    console.log(`${this.counter++} execution: afterStep`);
                }

                @given("a step")
                public given() {
                    console.log(`${this.counter++} execution: given`);
                }

                @when("another step")
                public when() {
                    console.log(`${this.counter++} execution: when`);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
        """
        .0 execution: given
        1 execution: afterStep
        .2 execution: when
        3 execution: afterStep
        """

    Scenario: Binding multiple after step hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @given("a step")
                public given() {
                    console.log(this.state)
                    this.state = 'step has executed';
                }

                @afterStep()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @afterStep()
                public hookTwo() {
                    console.log(this.state);
                    this.state = 'hook two has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            step has executed
            hook two has executed
            """

    Scenario: Binding before and after step hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep, afterStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @beforeStep()
                public beforeStep() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @afterStep()
                public afterStep() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .before hook executed
            step has executed
            """
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

## Generated test

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
