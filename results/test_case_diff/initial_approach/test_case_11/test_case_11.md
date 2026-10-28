Test name- cucumber context objects

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

## Generated
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
