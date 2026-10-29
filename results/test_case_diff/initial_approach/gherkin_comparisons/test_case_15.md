# Test case 15

## Gherkin scenario

```gherkin
Feature: Tag parameters

    Background:
        Given a file named "step_definitions/steps.ts" with:
            """ts
            import * as assert from 'assert';
            import {binding, then, ScenarioInfo} from 'cucumber-tsflow';

            @binding([ScenarioInfo])
            class Steps {
                public constructor(private readonly scenario: ScenarioInfo) {}

                @then("the flag {string} is enabled")
                public checkEnabled(name: string) {
                    assert.ok(this.scenario.getFlag(name))
                }

                @then("the flag {string} is disabled")
                public checkDisabled(name: string) {
                    assert.ok(!this.scenario.getFlag(name))
                }

                @then("the option tag {string} is set to {string}")
                public checkOption(name: string, value: string) {
                    assert.strictEqual(this.scenario.getOptionTag(name), value);
                }

                @then("the option tag {string} is unset")
                public checkOptionUnset(name: string) {
                    assert.strictEqual(this.scenario.getOptionTag(name), undefined);
                }

                @then("the multi option tag {string} is set to {}")
                public checkMultiOption(name: string, value: string) {
                    assert.deepStrictEqual(this.scenario.getMultiOptionTag(name), JSON.parse(value));
                }

                @then("the attribute tag {string} is set to {}")
                @then("the attribute tag {string} is set to:")
                public checkAttributes(name: string, values: string) {
                    assert.deepStrictEqual(this.scenario.getAttributeTag(name), JSON.parse(values));
                }

                @then("the attribute tag {string} is unset")
                public checkAttributesUnset(name: string) {
                    assert.deepStrictEqual(this.scenario.getAttributeTag(name), undefined);
                }
            }

            export = Steps;
            """

    Scenario: Checking for an absent flag
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the flag "enableFoo" is disabled
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for a flag on the feature
        Given a file named "features/a.feature" with:
            """feature
            @enableFoo
            Feature: Feature
              Scenario: One
                Then the flag "enableFoo" is enabled
              Scenario: Two
                Then the flag "enableFoo" is enabled
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for a flag on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @enableFoo
              Scenario: One
                Then the flag "enableFoo" is enabled
                Then the flag "enableBar" is disabled
              @enableBar
              Scenario: Two
                Then the flag "enableFoo" is disabled
                Then the flag "enableBar" is enabled
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an absent option
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the option tag "foo" is unset
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an option on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            Feature: Feature
              Scenario: One
                Then the option tag "foo" is set to "bar"
              Scenario: Two
                Then the option tag "foo" is set to "bar"
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an option on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @foo(bar)
              Scenario: One
                Then the option tag "foo" is set to "bar"
              @foo(baz)
              Scenario: Two
                Then the option tag "foo" is set to "baz"
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an option on the scenario overriding one on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            Feature: Feature
              Scenario: One
                Then the option tag "foo" is set to "bar"
              @foo(baz)
              Scenario: Two
                Then the option tag "foo" is set to "baz"
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an absent attribute tag
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the attribute tag "foo" is unset
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for multi options on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            @foo(baz)
            Feature: Feature
              Scenario: One
                Then the multi option tag "foo" is set to ["bar", "baz"]
              Scenario: Two
                Then the multi option tag "foo" is set to ["bar", "baz"]
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for multi options on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @foo(bar)
              @foo(baz)
              Scenario: One
                Then the multi option tag "foo" is set to ["bar", "baz"]
              @foo(qux)
              @foo(zzz)
              Scenario: Two
                Then the multi option tag "foo" is set to ["qux", "zzz"]
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for multi options on the scenario combining with multi options on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            Feature: Feature
              Scenario: One
                Then the multi option tag "foo" is set to ["bar"]
              @foo(baz)
              Scenario: Two
                Then the multi option tag "foo" is set to ["bar", "baz"]
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an attribute tag on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo({"bar":1})
            Feature: Feature
              Scenario: One
                Then the attribute tag "foo" is set to { "bar": 1 }
              Scenario: Two
                Then the attribute tag "foo" is set to { "bar": 1 }
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an attribute tag on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @foo({"bar":1})
              Scenario: One
                Then the attribute tag "foo" is set to { "bar": 1 }
              @foo({"bar":2})
              Scenario: Two
                Then the attribute tag "foo" is set to { "bar": 2 }
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an attribute tag on the scenario overriding one on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo({"bar":1})
            Feature: Feature
              Scenario: One
                Then the attribute tag "foo" is set to { "bar": 1 }
              @foo({"not-bar":2})
              Scenario: Two
                Then the attribute tag "foo" is set to { "not-bar": 2 }
            """
        When I run cucumber-js
        Then it passes
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

// ---- cucumber-tsflow-specs/src/step_definitions/file_steps.ts ----
  @given("a file named {string} with:")
  public newFile(filePath: string, fileContent: string) {
    this.runner.dir.writeFile(filePath, fileContent);
  }

```

## Generated test

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
