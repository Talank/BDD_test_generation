# Test case 11

## Gherkin scenario

```gherkin
Feature: Cucumber context objects

    Scenario: Using the cucumber logger
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Given a step
                And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, CucumberLog} from 'cucumber-tsflow';

            @binding([CucumberLog])
            class Steps {
                public constructor(private readonly logger: CucumberLog) {}

                @given("a step")
                public one() {
                    this.logger.log("logged value");
                }

                @given("another step")
                public noop() {}
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And scenario "example" step "Given a step" has the logs:
            | logged value |
        And scenario "example" step "And another step" has no attachments

    Scenario: Using the cucumber attachments
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Given a step
                And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, CucumberAttachments} from 'cucumber-tsflow';

            @binding([CucumberAttachments])
            class Steps {
                public constructor(private readonly att: CucumberAttachments) {}

                @given("a step")
                public one() {
                    this.att.attach("my string", "text/plain+custom");
                }

                @given("another step")
                public noop() {}
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And scenario "example" step "Given a step" has the attachments:
            | DATA      | MEDIA TYPE        | MEDIA ENCODING |
            | my string | text/plain+custom | IDENTITY       |
        And scenario "example" step "And another step" has no attachments

    Scenario: Using the cucumber attachments in hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, before, after, given, CucumberAttachments} from 'cucumber-tsflow';

            @binding([CucumberAttachments])
            class Steps {
                public constructor(private readonly att: CucumberAttachments) {}

                @before()
                public before() {
                    this.att.attach("my first string", "text/plain+custom");
                }

                @given("a step")
                public one() {}

                @after()
                public after() {
                    this.att.attach("my second string", "text/plain+custom");
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And scenario "example" "Before" hook has the attachments:
            | DATA            | MEDIA TYPE        | MEDIA ENCODING |
            | my first string | text/plain+custom | IDENTITY       |
        And scenario "example" "After" hook has the attachments:
            | DATA             | MEDIA TYPE        | MEDIA ENCODING |
            | my second string | text/plain+custom | IDENTITY       |
        And scenario "example" step "Given a step" has no attachments

    Scenario: Using world parameters
        Given a file named "cucumber.js" with:
            """js
            const cucumberPkg = require("@cucumber/cucumber/package.json");

            module.exports = cucumberPkg.version.startsWith("7.")
              ? {
                default: [
                  "--world-parameters '{\"name\":\"Earth\"}'"
                ].join(" ")
              }
              : {
                default: {
                  worldParameters: {
                    name: 'Earth'
                  }
                }
              };
            """
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the world name is "Earth"
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, then, WorldParameters} from 'cucumber-tsflow';
            import * as assert from 'node:assert';

            @binding([WorldParameters])
            class Steps {
                public constructor(private readonly world: WorldParameters) {}

                @then("the world name is {string}")
                public checkWorldName(name: string) {
                    assert.deepStrictEqual(this.world.value, {name})
                }
            }

            export = Steps;
            """

        When I run cucumber-js
        Then it passes

    Scenario: Reading the scenario information
        Given a file named "features/a.feature" with:
            """feature
            @foo
            Feature: Feature
              @bar
              Scenario: example
                Then the scenario title is "example"
                And  the tags are [ "@foo", "@bar" ]
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, then, ScenarioInfo} from 'cucumber-tsflow';
            import * as assert from 'node:assert';

            @binding([ScenarioInfo])
            class Steps {
                public constructor(private readonly scenario: ScenarioInfo) {}

                @then("the scenario title is {string}")
                public checkScenarioName(name: string) {
                    assert.strictEqual(this.scenario.scenarioTitle, name);
                }

                @then("the tags are {}")
                public checkTags(tags: string) {
                    assert.deepStrictEqual(this.scenario.tags, JSON.parse(tags));
                }
            }

            export = Steps;
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

// ---- cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts ----
  @then("scenario {string} step {string} has the attachments:")
  public checkStepAttachment(
    pickleName: string,
    stepText: string,
    table: DataTable,
  ) {
    const expectedAttachments = table.hashes().map((x) => {
      return {
        body: x.DATA,
        mediaType: x["MEDIA TYPE"],
        contentEncoding: ENCODING_MAP[x["MEDIA ENCODING"]],
      };
    });

    const actualAttachments = this.runner.extractor
      .getAttachmentsForStep(pickleName, stepText)
      .map(Extractor.simplifyAttachment);

    expect(actualAttachments).toEqual(expectedAttachments);
  }

  @then("scenario {string} {string} hook has the attachments:")
  public checkHookAttachment(
    pickleName: string,
    hookKeyword: string,
    table: DataTable,
  ) {
    const expectedAttachments: messages.Attachment[] = table
      .hashes()
      .map((x) => {
        return {
          body: x.DATA,
          mediaType: x["MEDIA TYPE"],
          contentEncoding: ENCODING_MAP[x["MEDIA ENCODING"]],
        };
      });

    const actualAttachments = this.runner.extractor
      .getAttachmentsForHook(pickleName, hookKeyword === "Before")
      .map(Extractor.simplifyAttachment);

    expect(actualAttachments).toEqual(expectedAttachments);
  }

  @then("scenario {string} step {string} has the logs:")
  public checkStepLogs(pickleName: string, stepName: string, logs: DataTable) {
    const expectedLogs = logs.raw().map((row) => row[0]);
    const actualLogs = Extractor.logsFromAttachments(
      this.runner.extractor.getAttachmentsForStep(pickleName, stepName),
    );

    expect(actualLogs).toStrictEqual(expectedLogs);
  }

  @then("scenario {string} step {string} has no attachments")
  public checkNoStepLogs(pickleName: string, stepName: string) {
    const attachments = this.runner.extractor.getAttachmentsForStep(
      pickleName,
      stepName,
    );

    expect(attachments).toStrictEqual([]);
  }

```

## Generated test

```ts
import { DataTable } from "@cucumber/cucumber";
import { binding, given, then, when } from "cucumber-tsflow";

import { Extractor } from "../support/helpers";
import { TestRunner } from "../support/runner";

@binding([TestRunner])
class ContextSteps {
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
  public async ensureSuccess() {
    if (this.runner.lastRun.error != null) {
      throw new Error(
        `Cucumber failed unexpectedly.\n\nOutput:\n${this.runner.lastRun.output}\n\nError Output:\n${this.runner.lastRun.errorOutput}`,
      );
    }
  }

  @then('scenario {string} step {string} has the logs:')
  public async checkStepLogs(
    scenarioName: string,
    stepText: string,
    table: DataTable,
  ) {
    const attachments = this.runner.extractor.getAttachmentsForStep(
      scenarioName,
      stepText,
    );
    const actualLogs = Extractor.logsFromAttachments(attachments);
    const expectedLogs = table.rows().map((row) => row[0]);

    if (
      actualLogs.length !== expectedLogs.length ||
      actualLogs.some((log, index) => log !== expectedLogs[index])
    ) {
      throw new Error(
        `Expected logs ${JSON.stringify(expectedLogs)}, got ${JSON.stringify(actualLogs)}`,
      );
    }
  }

  @then('scenario {string} step {string} has the attachments:')
  public async checkStepAttachments(
    scenarioName: string,
    stepText: string,
    table: DataTable,
  ) {
    const attachments = this.runner.extractor.getAttachmentsForStep(
      scenarioName,
      stepText,
    );
    const actualAttachments = attachments.map((attachment) =>
      Extractor.simplifyAttachment(attachment),
    );
    const expectedAttachments = table
      .rows()
      .map(([body, mediaType, contentEncoding]) => ({
        body,
        mediaType,
        contentEncoding,
      }));

    if (
      JSON.stringify(actualAttachments) !== JSON.stringify(expectedAttachments)
    ) {
      throw new Error(
        `Expected attachments ${JSON.stringify(expectedAttachments)}, got ${JSON.stringify(actualAttachments)}`,
      );
    }
  }

  @then('scenario {string} step {string} has no attachments')
  public async checkStepHasNoAttachments(
    scenarioName: string,
    stepText: string,
  ) {
    const attachments = this.runner.extractor.getAttachmentsForStep(
      scenarioName,
      stepText,
    );

    if (attachments.length !== 0) {
      throw new Error(
        `Expected no attachments, got ${attachments.length}`,
      );
    }
  }

  @then('scenario {string} {string} hook has the attachments:')
  public async checkHookAttachments(
    scenarioName: string,
    hookName: string,
    table: DataTable,
  ) {
    const attachments = this.runner.extractor.getAttachmentsForHook(
      scenarioName,
      hookName === "Before",
    );
    const actualAttachments = attachments.map((attachment) =>
      Extractor.simplifyAttachment(attachment),
    );
    const expectedAttachments = table
      .rows()
      .map(([body, mediaType, contentEncoding]) => ({
        body,
        mediaType,
        contentEncoding,
      }));

    if (
      JSON.stringify(actualAttachments) !== JSON.stringify(expectedAttachments)
    ) {
      throw new Error(
        `Expected attachments ${JSON.stringify(expectedAttachments)}, got ${JSON.stringify(actualAttachments)}`,
      );
    }
  }

  @then('scenario {string} {string} hook has no attachments')
  public async checkHookHasNoAttachments(
    scenarioName: string,
    hookName: string,
  ) {
    const attachments = this.runner.extractor.getAttachmentsForHook(
      scenarioName,
      hookName === "Before",
    );

    if (attachments.length !== 0) {
      throw new Error(
        `Expected no attachments, got ${attachments.length}`,
      );
    }
  }
}

export = ContextSteps;
```
