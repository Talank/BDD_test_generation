# Test case 13

## Gherkin scenario

```gherkin
Feature: Support for Cucumber hooks

    Scenario: Binding a beforeAll hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()
                public static hook() {
                    console.log('hook exec')
                }

                @given("a step")
                public given() {
                    console.log('step exec');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            hook exec
            .step exec
            ...step exec
            ..
            """

    Scenario: Binding a afterAll hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @afterAll()
                public static hook() {
                    console.log('hook exec')
                }

                @given("a step")
                public given() {
                    console.log('step exec');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            .step exec
            ...step exec
            ..hook exec
            """

    Scenario: Binding beforeAll and afterAll hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll, afterAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()
                public static before() {
                    console.log('before exec')
                }

                @afterAll()
                public static after() {
                    console.log('after exec')
                }

                @given("a step")
                public given() {
                    console.log('step exec');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            before exec
            .step exec
            ...step exec
            ..after exec
            """

    Scenario: Binding multiple beforeAll hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()
                public static one() {
                    console.log('one')
                }

                @beforeAll()
                public static two() {
                    console.log('two')
                }

                @given("a step")
                public given() {
                    console.log('step');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            one
            two
            .step
            ...step
            ..
            """

    Scenario: Binding multiple global hooks on the same line
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()public static one() { console.log('one') }@beforeAll()public static two() { console.log('two') }

                @given("a step")
                public given() {
                    console.log('step');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            one
            two
            .step
            ...step
            ..
            """

    Scenario: Binding multiple afterAll hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @afterAll()
                public static one() {
                    console.log('one')
                }

                @afterAll()
                public static two() {
                    console.log('two')
                }

                @given("a step")
                public given() {
                    console.log('step');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            .step
            ...step
            ..two
            one
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
