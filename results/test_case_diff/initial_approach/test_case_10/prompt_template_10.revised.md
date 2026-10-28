# ROLE
You write cucumber-js step definitions from Gherkin steps.

The Gherkin says what to test. Your job is to wire each gherkin step to code that already exists. Never add, drop,
or improve test coverage.

Each step's text becomes a pattern. cucumber-js matches it at runtime. A pattern
is written once and shared by every scenario that uses it.

# RULES
1. **Only use what is listed.** Functions from DSL CATALOG, members on `this`
   from WORLD, types from PARAMETER TYPES. Never invent a name. Plain JavaScript
   and the Cucumber DataTable API are fine. Reach the DSL the same way the
   existing step definitions do.
   **Listed covers FIELDS, not just functions.** A member listed in PUBLIC
   SURFACE INDEX, WORLD or PARAMETER TYPES may be READ, and where the index marks
   it `(read/write)` it may also be ASSIGNED. Assigning to a listed writable
   member is a legal statement in a body — it is not inventing a name.
2. **Use `async function`, never an arrow function.** An arrow breaks `this`.
   Await every DSL call.
3. **One binding per pattern.** Two steps that differ only in a value —
   `"admin"` vs `"editor"` — are one binding with one parameter..
4. **Never redefine a registered step.** Write `// EXISTS: <step text>` ONLY when
   an entry in REGISTERED STEPS matches the step text exactly, and QUOTE that
   entry verbatim in the comment:
   `// EXISTS: <step text>   — matches: <registered entry, copied verbatim>`.
   Compare character-for-character against the entry itself, never against the
   family it belongs to. "Looks similar" is not "matches": near-identical
   patterns are registered one at a time, and the presence of some of them says
   nothing about the rest. If no entry matches character-for-character, WRITE the
   binding.
5. **Keep the step text as written.** Copy it exactly, replacing only what
   varies. Never reword a step or add quotes to make it easier to parameterize.
   - quoted text → `{string}`
   - a number → `{int}` or `{float}`
   - a bare word that varies → a PARAMETER TYPE, or `{word}`
   - anything else → leave as plain text

   `{string}` only matches quoted text. Using it on a bare word means the step
   never matches at runtime.
6. **Pass values through.** Captured parameters go straight to the DSL call —
   never paste a literal from the step text. Data tables and doc strings arrive
   as the last parameter; hand them over whole. Use CONSTANTS only for values the
   step implies but does not state.
7. **Keep bodies thin.** If one DSL function does the step, that call is the
   whole body. Pick the most specific one.
8. **Share values through `this`.** Steps do not share local variables. A step
   that produces a value a later step needs assigns it to `this`
   (`this.orderId = await ...`). A step that needs it reads it from `this`.
9. **Say when you cannot map it.** Do not guess. Before writing either UNMAPPED
   form, re-check WORLD, the FIELDS in PUBLIC SURFACE INDEX, and CALLABLE
   HELPERS — not only the DSL CATALOG function list. A member reachable through
   `this`, a listed writable member you may assign, or a module-private helper
   you must reimplement rather than call, can each change the answer.
   - no DSL function fits      → `// UNMAPPED: <step text>`
   - a needed value is missing → `// UNMAPPED (missing value): <step text>`
   - two functions fit equally → pick the more specific; if still tied,
                                 `// UNMAPPED (ambiguous): <step text>`


# THE RUNNER HANDLES THESE — YOU DO NOT

- **Scenario Outline.** Write ONE binding. The runner replaces each
  `<placeholder>` with its Examples value before matching, so your pattern must
  match the replaced value, not the `<placeholder>` text. A quoted Examples cell
  → `{string}`, a number → `{int}`, a bare word → `{word}` or a PARAMETER TYPE.
  A spot that holds a `<placeholder>` always varies, so it is never plain text.
  Do not write one binding per row.
- **Background.** Its steps are normal steps. Define any that are missing.
- **@tags.** Emit nothing for them.
- **Hooks.** Do not write hooks unless EXISTING STEP DEFINITIONS already has one.

# OUTPUT
Return a complete, runnable step-definitions file:


---
# DSL CATALOG  (the only functions you may call)
```ts
// ===== PUBLIC SURFACE INDEX (auto-extracted) =====
// Functions and methods are listed with their signature. Public fields and
// properties are listed with their type and their mutability — `(read)` or
// `(read/write)`.
// cucumber-tsflow-specs/src/step_definitions/prepare.ts
//   - Prepare#setupTestDir({ gherkinDocument, pickle }: ITestCaseHookParameter)
//   - Prepare#tearDownTestDir()
//   - Prepare#setupNodeModules()
//   - Prepare#writeDefaultFiles(tags: string[])
// cucumber-tsflow-specs/src/support/formatter_output_helpers.ts
//   - valueOrDefault(value: T | null | undefined, defaultValue: T)
//   - normalizeExceptionAndUri(exception: string, cwd: string)
//   - normalizeMessage(obj: any, cwd: string)
//   - normalizeMessageOutput(envelopeObjects: messages.Envelope[], cwd: string,)
//   - stripMetaMessages(envelopeObjects: messages.Envelope[],)
//   - normalizeJsonOutput(str: string, cwd: string)
//   - ignorableKeys: string[]                          (read)
// cucumber-tsflow-specs/src/support/helpers.ts
//   - Extractor#logsFromAttachments(attachments: messages.Attachment[],)
//   - Extractor#simplifyAttachment(attachment: messages.Attachment,)
//   - Extractor#getPickleNamesInOrderOfExecution()
//   - Extractor#getPickleStep(pickleName: string, stepText: string,)
//   - Extractor#getHookByName(hookName: string)
//   - Extractor#getHookExecutions(pickleName: string, hookId: string,)
//   - Extractor#getTestCaseResult(pickleName: string)
//   - Extractor#getTestStepResults(pickleName: string, attempt = 0,)
//   - Extractor#getAttachmentsForStep(pickleName: string, stepText: string,)
//   - Extractor#getAttachmentsForHook(pickleName: string, isBeforeHook: boolean,)
//   - Extractor#getPickle(pickleName: string)
//   - Extractor#getGherkinDocument(uri: string)
//   - Extractor#getTestCase(pickleId: string)
//   - Extractor#getTestCaseStarted(testCaseId: string, attempt = 0,)
//   - Extractor#getPickleStepByStepText(pickle: messages.Pickle, gherkinDocument: messages.GherkinDocument, stepText: string,)
//   - Extractor#getTestStepAttachments(testCaseStartedId: string, testStepId: string,)
//   - doesHaveValue(value: T | null | undefined)
//   - parseEnvString(str: string)
//   - dump(val: unknown)
// cucumber-tsflow-specs/src/support/runner.ts
//   - TestRunner#get lastRun()
//   - TestRunner#get extractor()
//   - TestRunner#async run(envOverride: NodeJS.ProcessEnv | null = null,)
//   - TestRunner#dir: TestDir                          (read)
//   - TestRunner#sharedEnv?: NodeJS.ProcessEnv         (read/write)
//   - TestRunner#spawn: boolean                        (read/write)
//   - TestRunner#debug: boolean                        (read/write)
//   - TestRunner#worldParameters?: any                 (read/write)
//   - TestRunner#verifiedLastRunError: boolean         (read/write)
// cucumber-tsflow-specs/src/support/testDir.ts
//   - TestDir#get path()
//   - TestDir#set path(newPath: string)
//   - TestDir#readFileStream(...pathParts: string[] | [string[]])
//   - TestDir#writeFileStream(...pathParts: string[] | [string[]])
//   - TestDir#readFile(...pathParts: string[] | [string[]])
//   - TestDir#writeFile(pathParts: string | string[], data: string)
//   - TestDir#mkdir(...pathParts: string[] | [string[]])
//   - TestDir#getPath(...pathParts: string[] | [string[]])

// ---- cucumber-tsflow-specs/src/step_definitions/prepare.ts ----
import { formatterHelpers, ITestCaseHookParameter } from "@cucumber/cucumber";
import { after, before, binding } from "cucumber-tsflow";
import fsExtra from "fs-extra";
import path from "path";
import { TestRunner } from "../support/runner";

const projectPath = path.join(__dirname, "..", "..", "..");
const projectNodeModulePath = path.join(projectPath, "node_modules");
const cucumberPath = path.join(projectNodeModulePath, "@cucumber", "cucumber");
const tsNodePath = path.join(projectNodeModulePath, "ts-node");
const projectLibPath = path.join(projectPath, "cucumber-tsflow");
const log4jsPath = path.join(projectLibPath, "node_modules", "log4js");

@binding([TestRunner])
class Prepare {
  public constructor(private readonly runner: TestRunner) {}

  @before()
  public setupTestDir({ gherkinDocument, pickle }: ITestCaseHookParameter) {
    const { line } = formatterHelpers.PickleParser.getPickleLocation({
      gherkinDocument,
      pickle,
    });

    const tmpDir = path.join(
      projectPath,
      "tmp",
      `${path.basename(pickle.uri)}_${line.toString()}`,
    );

    fsExtra.removeSync(tmpDir);

    this.runner.dir.path = tmpDir;

    this.setupNodeModules();

    const tags = [
      ...pickle.tags.map((tag) => tag.name),
      ...(gherkinDocument.feature?.tags.map((tag) => tag.name) ?? []),
    ];

    this.writeDefaultFiles(tags);
  }

  @after()
  public tearDownTestDir() {
    const { lastRun } = this.runner;

    if (lastRun?.error != null && !this.runner.verifiedLastRunError) {
      throw new Error(
        `Last run errored unexpectedly. Output:\n\n${lastRun.output}\n\n` +
          `Error Output:\n\n${lastRun.errorOutput}`,
      );
    }
  }

  private setupNodeModules() {
    const tmpDirNodeModulesPath = this.runner.dir.mkdir("node_modules");

    fsExtra.ensureSymlinkSync(
      cucumberPath,
      path.join(tmpDirNodeModulesPath, "@cucumber", "cucumber"),
    );
    fsExtra.ensureSymlinkSync(
      tsNodePath,
      path.join(tmpDirNodeModulesPath, "ts-node"),
    );
    fsExtra.ensureSymlinkSync(
      projectLibPath,
      path.join(tmpDirNodeModulesPath, "cucumber-tsflow"),
    );
    fsExtra.ensureSymlinkSync(
      log4jsPath,
      path.join(tmpDirNodeModulesPath, "log4js"),
    );
  }

  private writeDefaultFiles(tags: string[]) {
    if (!tags.includes("custom-tsconfig")) {
      this.runner.dir.writeFile(
        "tsconfig.json",
        JSON.stringify({
          compilerOptions: {
            experimentalDecorators: true,
            types: ["node"],
          },
        }),
      );
    }

    if (!tags.includes("no-logging")) {
      this.runner.dir.writeFile(
        "a-logging.ts",
        `
import * as log4js from 'log4js';

log4js.configure({
  appenders: {
    logfile: {
      type: "file",
      filename: "output.log",
    }
  },
  categories: {
    default: { appenders: ["logfile"], level: "trace" },
  }
});
`,
      );
    }
  }
}

export = Prepare;

// ---- cucumber-tsflow-specs/src/support/formatter_output_helpers.ts ----
import * as messages from "@cucumber/messages";

interface IJsonFeature {
  elements: IJsonScenario[];
  uri: string;
}

interface IJsonScenario {
  steps: IJsonStep[];
}

interface IJsonStep {
  match?: {
    location?: string;
  };
  result?: {
    duration?: number;
    error_message?: string;
  };
}

function valueOrDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value === null || value === undefined ? defaultValue : value;
}

function normalizeExceptionAndUri(exception: string, cwd: string): string {
  return exception
    .replace(cwd, "")
    .replace(/\\/g, "/")
    .replace("/features", "features")
    .split("\n")[0];
}

function normalizeMessage(obj: any, cwd: string): void {
  if (obj.uri != null) {
    obj.uri = normalizeExceptionAndUri(obj.uri, cwd);
  }
  if (obj.sourceReference?.uri != null) {
    obj.sourceReference.uri = normalizeExceptionAndUri(
      obj.sourceReference.uri,
      cwd,
    );
  }
  if (obj.testStepResult != null) {
    if (obj.testStepResult.duration != null) {
      obj.testStepResult.duration.nanos = 0;
    }
    if (obj.testStepResult.message != null) {
      obj.testStepResult.message = normalizeExceptionAndUri(
        obj.testStepResult.message,
        cwd,
      );
    }
  }
}

export function normalizeMessageOutput(
  envelopeObjects: messages.Envelope[],
  cwd: string,
): messages.Envelope[] {
  envelopeObjects.forEach((e: any) => {
    for (const key of Object.keys(e)) {
      normalizeMessage(e[key], cwd);
    }
  });
  return envelopeObjects;
}

export function stripMetaMessages(
  envelopeObjects: messages.Envelope[],
): messages.Envelope[] {
  return envelopeObjects.filter((e: any) => {
    // filter off meta objects, almost none of it predictable/useful for testing
    return e.meta == null;
  });
}

export function normalizeJsonOutput(str: string, cwd: string): IJsonFeature[] {
  const json: IJsonFeature[] = JSON.parse(valueOrDefault(str, "[]"));
  json.forEach((feature: IJsonFeature) => {
    if (feature.uri != null) {
      feature.uri = normalizeExceptionAndUri(feature.uri, cwd);
    }
    feature.elements.forEach((element: IJsonScenario) => {
      element.steps.forEach((step: IJsonStep) => {
        if (step.match != null && step.match.location != null) {
          step.match.location = normalizeExceptionAndUri(
            step.match.location,
            cwd,
          );
        }
        if (step.result != null) {
          if (step.result.duration != null) {
            step.result.duration = 0;
          }
          if (step.result.error_message != null) {
            step.result.error_message = normalizeExceptionAndUri(
              step.result.error_message,
              cwd,
            );
          }
        }
      });
    });
  });
  return json;
}

export const ignorableKeys = [
  "meta",
  // sources
  "uri",
  "line",
  // ids
  "astNodeId",
  "astNodeIds",
  "hookId",
  "id",
  "pickleId",
  "pickleStepId",
  "stepDefinitionIds",
  "testCaseId",
  "testCaseStartedId",
  "testStepId",
  // time
  "nanos",
  "seconds",
  // errors
  "message",
];

// ---- cucumber-tsflow-specs/src/support/helpers.ts ----
// Adapted from:
// https://github.com/cucumber/cucumber-js/blob/6505e61abce385787767f270b6ce2077eb3d7c1c/features/support/message_helpers.ts
import { formatterHelpers } from "@cucumber/cucumber";
import * as messages from "@cucumber/messages";
import * as assert from "node:assert";
import util, { inspect } from "util";

const { getGherkinStepMap } = formatterHelpers.GherkinDocumentParser;
const { getPickleStepMap, getStepKeyword } = formatterHelpers.PickleParser;

function doesHaveValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function parseEnvString(str: string): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};
  if (doesHaveValue(str)) {
    try {
      Object.assign(result, JSON.parse(str));
    } catch {
      str
        .split(/\s+/)
        .map((keyValue) => keyValue.split("="))
        .forEach((pair) => (result[pair[0]] = pair[1]));
    }
  }
  return result;
}

export function dump(val: unknown): string {
  return inspect(val, { depth: null });
}

export interface IStepTextAndResult {
  text: string;

  result: messages.TestStepResult;
}

export type SimpleAttachment = Pick<
  messages.Attachment,
  "body" | "mediaType" | "contentEncoding"
>;

export class Extractor {
  public constructor(private readonly envelopes: messages.Envelope[]) {}

  public static logsFromAttachments(
    attachments: messages.Attachment[],
  ): string[] {
    return attachments
      .filter(
        (att) =>
          att.contentEncoding === messages.AttachmentContentEncoding.IDENTITY &&
          att.mediaType === "text/x.cucumber.log+plain",
      )
      .map((att) => att.body);
  }

  public static simplifyAttachment(
    attachment: messages.Attachment,
  ): SimpleAttachment {
    return {
      body: attachment.body,
      mediaType: attachment.mediaType,
      contentEncoding: attachment.contentEncoding,
    };
  }

  public getPickleNamesInOrderOfExecution(): string[] {
    const pickleNameMap: Record<string, string> = {};
    const testCaseToPickleNameMap: Record<string, string> = {};
    const result: string[] = [];
    this.envelopes.forEach((e) => {
      if (e.pickle != null) {
        pickleNameMap[e.pickle.id] = e.pickle.name;
      } else if (e.testCase != null) {
        testCaseToPickleNameMap[e.testCase.id] =
          pickleNameMap[e.testCase.pickleId];
      } else if (e.testCaseStarted != null) {
        result.push(testCaseToPickleNameMap[e.testCaseStarted.testCaseId]);
      }
    });
    return result;
  }

  public getPickleStep(
    pickleName: string,
    stepText: string,
  ): messages.PickleStep {
    const pickle = this.getPickle(pickleName);
    const gherkinDocument = this.getGherkinDocument(pickle.uri);
    return this.getPickleStepByStepText(pickle, gherkinDocument, stepText);
  }

  public getHookByName(hookName: string): messages.Hook {
    const hookEnvelope = this.envelopes.find(
      ({ hook }) => hook?.name === hookName,
    );

    if (hookEnvelope == null) {
      throw new Error(`Unknown hook ${hookName}`);
    }

    return hookEnvelope.hook!;
  }

  public getHookExecutions(
    pickleName: string,
    hookId: string,
  ): messages.TestStep[] {
    const pickle = this.getPickle(pickleName);
    const testCase = this.getTestCase(pickle.id);

    return testCase.testSteps.filter((step) => step.hookId === hookId);
  }

  public getTestCaseResult(pickleName: string): messages.TestStepResult {
    const pickle = this.getPickle(pickleName);
    const testCase = this.getTestCase(pickle.id);
    const testCaseStarted = this.getTestCaseStarted(testCase.id);
    const testStepResults: messages.TestStepResult[] = [];
    this.envelopes.forEach((e) => {
      if (
        e.testStepFinished != null &&
        e.testStepFinished.testCaseStartedId === testCaseStarted.id
      ) {
        testStepResults.push(e.testStepFinished.testStepResult);
      }
    });
    return messages.getWorstTestStepResult(testStepResults);
  }

  public getTestStepResults(
    pickleName: string,
    attempt = 0,
  ): IStepTextAndResult[] {
    const pickle = this.getPickle(pickleName);
    const gherkinDocument = this.getGherkinDocument(pickle.uri);
    const testCase = this.getTestCase(pickle.id);
    const testCaseStarted = this.getTestCaseStarted(testCase.id, attempt);
    const testStepIdToResultMap: Record<string, messages.TestStepResult> = {};
    this.envelopes.forEach((e) => {
      if (
        e.testStepFinished != null &&
        e.testStepFinished.testCaseStartedId === testCaseStarted.id
      ) {
        testStepIdToResultMap[e.testStepFinished.testStepId] =
          e.testStepFinished.testStepResult;
      }
    });
    const gherkinStepMap = getGherkinStepMap(gherkinDocument);
    const pickleStepMap = getPickleStepMap(pickle);
    let isBeforeHook = true;
    return testCase.testSteps.map((testStep) => {
      let text;
      if (testStep.pickleStepId == null) {
        text = isBeforeHook ? "Before" : "After";
      } else {
        isBeforeHook = false;
        const pickleStep = pickleStepMap[testStep.pickleStepId];
        const keyword = getStepKeyword({ pickleStep, gherkinStepMap });
        text = `${keyword}${pickleStep.text}`;
      }
      return { text, result: testStepIdToResultMap[testStep.id] };
    });
  }

  public getAttachmentsForStep(
    pickleName: string,
    stepText: string,
  ): messages.Attachment[] {
    const pickle = this.getPickle(pickleName);
    const gherkinDocument = this.getGherkinDocument(pickle.uri);
    const testCase = this.getTestCase(pickle.id);
    const pickleStep = this.getPickleStepByStepText(
      pickle,
      gherkinDocument,
      stepText,
    );
    assert.ok(
      pickleStep,
      `Step "${stepText}" not found in pickle ${dump(pickle)}`,
    );

    const testStep = testCase.testSteps.find(
      (s) => s.pickleStepId === pickleStep.id,
    )!;
    const testCaseStarted = this.getTestCaseStarted(testCase.id);
    return this.getTestStepAttachments(testCaseStarted.id, testStep.id);
  }

  public getAttachmentsForHook(
    pickleName: string,
    isBeforeHook: boolean,
  ): messages.Attachment[] {
    const pickle = this.getPickle(pickleName);
    const testCase = this.getTestCase(pickle.id);
    // Ignore the first Before hook and the last After hook
    // Those are used to set up and tear down the tsflow harness
    const testStepIndex = isBeforeHook ? 1 : testCase.testSteps.length - 2;
    const testStep = testCase.testSteps[testStepIndex];
    const testCaseStarted = this.getTestCaseStarted(testCase.id);
    return this.getTestStepAttachments(testCaseStarted.id, testStep.id);
  }

  private getPickle(pickleName: string): messages.Pickle {
    const pickleEnvelope = this.envelopes.find(
      (e) => e.pickle != null && e.pickle.name === pickleName,
    );
    if (pickleEnvelope == null) {
      throw new Error(
        `No pickle with name "${pickleName}" in this.envelopes:\n ${util.inspect(
          this.envelopes,
        )}`,
      );
    }
    return pickleEnvelope.pickle!;
  }

  private getGherkinDocument(uri: string): messages.GherkinDocument {
    const gherkinDocumentEnvelope = this.envelopes.find(
      (e) => e.gherkinDocument != null && e.gherkinDocument.uri === uri,
    );
    if (gherkinDocumentEnvelope == null) {
      throw new Error(
        `No gherkinDocument with uri "${uri}" in this.envelopes:\n ${util.inspect(
          this.envelopes,
        )}`,
      );
    }
    return gherkinDocumentEnvelope.gherkinDocument!;
  }

  private getTestCase(pickleId: string): messages.TestCase {
    const testCaseEnvelope = this.envelopes.find(
      (e) => e.testCase != null && e.testCase.pickleId === pickleId,
    );
    if (testCaseEnvelope == null) {
      throw new Error(
        `No testCase with pickleId "${pickleId}" in this.envelopes:\n ${util.inspect(
          this.envelopes,
        )}`,
      );
    }
    return testCaseEnvelope.testCase!;
  }

  private getTestCaseStarted(
    testCaseId: string,
    attempt = 0,
  ): messages.TestCaseStarted {
    const testCaseStartedEnvelope = this.envelopes.find(
      (e) =>
        e.testCaseStarted != null &&
        e.testCaseStarted.testCaseId === testCaseId &&
        e.testCaseStarted.attempt === attempt,
    );
    if (testCaseStartedEnvelope == null) {
      throw new Error(
        `No testCaseStarted with testCaseId "${testCaseId}" in this.envelopes:\n ${util.inspect(
          this.envelopes,
        )}`,
      );
    }
    return testCaseStartedEnvelope.testCaseStarted!;
  }

  private getPickleStepByStepText(
    pickle: messages.Pickle,
    gherkinDocument: messages.GherkinDocument,
    stepText: string,
  ): messages.PickleStep {
    const gherkinStepMap = getGherkinStepMap(gherkinDocument);
    return pickle.steps.find((s) => {
      const keyword = getStepKeyword({ pickleStep: s, gherkinStepMap });
      return `${keyword}${s.text}` === stepText;
    })!;
  }

  private getTestStepAttachments(
    testCaseStartedId: string,
    testStepId: string,
  ): messages.Attachment[] {
    return this.envelopes
      .filter(
        (e) =>
          e.attachment != null &&
          e.attachment.testCaseStartedId === testCaseStartedId &&
          e.attachment.testStepId === testStepId,
      )
      .map((e) => e.attachment!);
  }
}

// ---- cucumber-tsflow-specs/src/support/runner.ts ----
// Adapted from:
// https://github.com/cucumber/cucumber-js/blob/6505e61abce385787767f270b6ce2077eb3d7c1c/features/support/world.ts
import * as messageStreams from "@cucumber/message-streams";
import * as messages from "@cucumber/messages";
import assert from "assert";
import { execFile } from "child_process";
import expect from "expect";
import path from "path";
import { Writable } from "stream";
import { finished } from "stream/promises";
import stripAnsi from "strip-ansi";
import VError from "verror";
import { Extractor } from "./helpers";
import { TestDir } from "./testDir";

const projectPath = path.join(__dirname, "..", "..", "..");
const cucumberBinPath = path.join(
  projectPath,
  "node_modules",
  ".bin",
  "cucumber-js",
);

interface IRunResult {
  error: any;

  stderr: string;

  stdout: string;
}

interface ILastRun {
  error: any;

  errorOutput: string;

  envelopes: messages.Envelope[];

  output: string;
}

export class TestRunner {
  public readonly dir = new TestDir();

  public sharedEnv?: NodeJS.ProcessEnv;

  public spawn: boolean = false;

  public debug: boolean = false;

  public worldParameters?: any;

  public verifiedLastRunError!: boolean;

  private _lastRun?: ILastRun;

  public get lastRun(): ILastRun {
    assert(this._lastRun, "Cucumber has not executed yet.");
    return this._lastRun;
  }

  public get extractor(): Extractor {
    return new Extractor(this.lastRun.envelopes);
  }

  public async run(
    envOverride: NodeJS.ProcessEnv | null = null,
  ): Promise<void> {
    const messageFilename = "message.ndjson";
    const env = { ...process.env, ...this.sharedEnv, ...envOverride };

    const result = await new Promise<IRunResult>((resolve) => {
      execFile(
        "node",
        [
          cucumberBinPath,
          "--format",
          `message:${messageFilename}`,
          "--require-module",
          "ts-node/register",
          "--require",
          "a-logging.ts",
          "--require",
          "step_definitions/**/*.ts",
        ],
        { cwd: this.dir.path, env },
        (error, stdout, stderr) => {
          resolve({ error, stdout, stderr });
        },
      );
    });

    const stderrSuffix =
      result.error != null ? VError.fullStack(result.error) : "";

    const envelopes: messages.Envelope[] = [];
    const messageOutputStream = this.dir
      .readFileStream(messageFilename)
      ?.pipe(new messageStreams.NdjsonToMessageStream())
      .pipe(
        new Writable({
          objectMode: true,
          write(envelope: messages.Envelope, _: BufferEncoding, callback) {
            envelopes.push(envelope);
            callback();
          },
        }),
      );

    if (messageOutputStream !== undefined) {
      await finished(messageOutputStream);
    }

    this._lastRun = {
      error: result.error,
      errorOutput: result.stderr + stderrSuffix,
      envelopes,
      output: stripAnsi(result.stdout),
    };
    this.verifiedLastRunError = false;

    expect(this._lastRun.output).not.toContain("Unhandled rejection.");
  }
}

// ---- cucumber-tsflow-specs/src/support/testDir.ts ----
import assert from "assert";
import fs, { ReadStream, WriteStream } from "fs";
import path from "path";

export class TestDir {
  private _path?: string;

  public get path(): string {
    assert(this._path, "Test directory not configured");
    return this._path;
  }

  public set path(newPath: string) {
    this._path = newPath;
  }

  public readFileStream(
    ...pathParts: string[] | [string[]]
  ): ReadStream | null {
    const filePath = this.getPath(...pathParts);

    if (fs.existsSync(filePath)) {
      return fs.createReadStream(filePath, { encoding: "utf-8" });
    }

    return null;
  }

  public writeFileStream(...pathParts: string[] | [string[]]): WriteStream {
    const filePath = this.getPath(...pathParts);

    return fs.createWriteStream(filePath, { encoding: "utf-8" });
  }

  public readFile(...pathParts: string[] | [string[]]): string | null {
    const filePath = this.getPath(...pathParts);

    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, { encoding: "utf-8" });
    }

    return null;
  }

  public writeFile(pathParts: string | string[], data: string): void {
    const pathArgs = (
      typeof pathParts === "string" ? [pathParts] : pathParts
    ).flatMap((part) => part.split("/"));

    if (pathArgs.length > 1) {
      this.mkdir(pathArgs.slice(0, pathArgs.length - 1));
    }

    const filePath = this.getPath(pathArgs);

    fs.writeFileSync(filePath, data, { encoding: "utf-8" });
  }

  public mkdir(...pathParts: string[] | [string[]]): string {
    const dirPath = this.getPath(...pathParts);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  }

  private getPath(...pathParts: string[] | [string[]]): string {
    return path.join(
      this.path,
      ...(pathParts.length === 1 && Array.isArray(pathParts[0])
        ? pathParts[0]
        : (pathParts as string[])),
    );
  }
}

```
---
# PARAMETER TYPES
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS 
```ts
// 21 step bindings already registered — do NOT redefine any of these:
When('my env includes {string}')                            // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
When('I run cucumber-js with env `{}`')                     // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the output contains {string} once')                   // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the output contains text once:')                      // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the output does not contain {string}')                // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the output does not contain text:')                   // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the error output contains {string}')                  // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the error output contains text:')                     // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the error output does not contain {string}')          // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Then('the error output does not contain text:')             // cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts
Given('an empty file named {string}')                       // cucumber-tsflow-specs/src/step_definitions/file_steps.ts
Given('a directory named {string}')                         // cucumber-tsflow-specs/src/step_definitions/file_steps.ts
Then('it runs {int} scenarios')                             // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('it runs the scenario {string}')                       // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('it runs the scenarios:')                              // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('scenario {string} has status {string}')               // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('scenario {string} step {string} has the attachments:')// cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('scenario {string} {string} hook has the attachments:')// cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('scenario {string} step {string} has the logs:')       // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('scenario {string} step {string} has no attachments')  // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
Then('the hook {string} was executed on scenario {string}') // cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts
```
---
# CALLABLE HELPERS  (module-local symbols in the step-definition sources)
```ts
// These names appear in the step-definition sources below. They are NOT part of
// the callable surface: each is declared WITHOUT `export`, so it is PRIVATE to
// its own module and cannot be imported from a sibling step-definitions file.
// They are listed here so their existence is not mistaken for availability. If a
// body needs behaviour one of them provides, reimplement it locally — do not
// import it, and do not call it by name.
//
// cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts   (module-private)
//   - function escapeRegex(text: string): string
//   - function createFlexibleOutputRegex(text: string): RegExp
//   - function countMatches(output: string, text: string): number
//   - function expectOutputToContain(output: string, text: string): void
//
// cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts   (module-private)
//   - const ENCODING_MAP: { [key: string]: messages.AttachmentContentEncoding }
//
// Each of these files ends in `export = <StepClass>`, so the only name any of
// them exports is the step-definition class itself.
```
---
# EXISTING STEP DEFINITIONS (for call style — do not copy their coverage)
```ts
// ---- cucumber-tsflow-specs/src/step_definitions/cucumber_steps.ts ----
import { binding, then, when } from "cucumber-tsflow";
import expect from "expect";
import { parseEnvString } from "../support/helpers";
import { TestRunner } from "../support/runner";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createFlexibleOutputRegex(text: string): RegExp {
  let pattern = "";

  for (let index = 0; index < text.length; ) {
    const char = text[index];

    if (char === "\r") {
      index += 1;
      continue;
    }

    if (char === "\n") {
      pattern += "\\r?\\n[. ]*";
      index += 1;
      continue;
    }

    if (char === ".") {
      while (text[index] === ".") {
        index += 1;
      }
      pattern += "\\.+";
      continue;
    }

    if (char === " ") {
      while (text[index] === " ") {
        index += 1;
      }
      pattern += " +";
      continue;
    }

    pattern += escapeRegex(char);
    index += 1;
  }

  return new RegExp(pattern, "m");
}

function countMatches(output: string, text: string): number {
  const exactMatches = output.match(new RegExp(escapeRegex(text), "g")) ?? [];

  if (exactMatches.length > 0) {
    return exactMatches.length;
  }

  const regex = createFlexibleOutputRegex(text);
  return Array.from(output.matchAll(new RegExp(regex.source, "gm"))).length;
}

function expectOutputToContain(output: string, text: string): void {
  if (output.includes(text) || createFlexibleOutputRegex(text).test(output)) {
    return;
  }

  expect(output).toContain(text);
}

@binding([TestRunner])
class CucumberSteps {
  public constructor(private readonly runner: TestRunner) {}

  @when("my env includes {string}")
  public setEnvironment(envString: string) {
    this.runner.sharedEnv = parseEnvString(envString);
  }

  @when("I run cucumber-js with env `{}`")
  public async runCucumberWithEnv(envString: string) {
    await this.runner.run(parseEnvString(envString));
  }

  @then("the output contains {string} once")
  @then("the output contains text once:")
  public checkStdoutContainsOnce(text: string) {
    const { output } = this.runner.lastRun;

    expectOutputToContain(output, text);
    expect(countMatches(output, text)).toBe(1);
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

  @then("the error output does not contain {string}")
  @then("the error output does not contain text:")
  public checkStderrDoesNotContains(text: string) {
    expect(this.runner.lastRun.errorOutput).not.toContain(text);
  }
}

export = CucumberSteps;

// Then(
//   "the output contains these types and quantities of message:",
//   function(this: World, expectedMessages: DataTable) {
//     const envelopes = this.lastRun.output
//       .split("\n")
//       .filter((line) => !!line)
//       .map((line) => JSON.parse(line));
//     expectedMessages.rows().forEach(([type, count]) => {
//       expect(envelopes.filter((envelope) => !!envelope[type])).to.have.length(
//         Number(count),
//         `Didn't find expected number of ${type} messages`
//       );
//     });
//   }
// );

// ---- cucumber-tsflow-specs/src/step_definitions/file_steps.ts ----
import { binding, given } from "cucumber-tsflow";
import { TestRunner } from "../support/runner";

@binding([TestRunner])
class FileSteps {
  public constructor(private readonly runner: TestRunner) {}

  @given("an empty file named {string}")
  public newEmptyFile(filePath: string) {
    return this.newFile(filePath, "");
  }

  @given("a directory named {string}")
  public async newDir(filePath: string) {
    this.runner.dir.mkdir(filePath);
  }
}

export = FileSteps;

// ---- cucumber-tsflow-specs/src/step_definitions/scenario_steps.ts ----
import { DataTable } from "@cucumber/cucumber";
import * as messages from "@cucumber/messages";
import assert from "assert";
import { binding, then } from "cucumber-tsflow";
import expect from "expect";
import { Extractor } from "../support/helpers";
import { TestRunner } from "../support/runner";

const ENCODING_MAP: { [key: string]: messages.AttachmentContentEncoding } = {
  IDENTITY: messages.AttachmentContentEncoding.IDENTITY,
  BASE64: messages.AttachmentContentEncoding.BASE64,
};

@binding([TestRunner])
class ScenarioSteps {
  public constructor(private readonly runner: TestRunner) {}

  @then("it runs {int} scenarios")
  public checkScenarioCount(expectedCount: number) {
    const startedTestCases = this.runner.lastRun.envelopes.reduce(
      (acc, e) => (e.testCaseStarted == null ? acc : acc + 1),
      0,
    );

    expect(startedTestCases).toBe(expectedCount);
  }

  @then("it runs the scenario {string}")
  public checkRunSingleScenario(scenario: string) {
    const actualNames =
      this.runner.extractor.getPickleNamesInOrderOfExecution();
    expect(actualNames).toEqual([scenario]);
  }

  @then("it runs the scenarios:")
  public checkScenarios(table: DataTable) {
    const expectedNames = table.rows().map((row) => row[0]);
    const actualNames =
      this.runner.extractor.getPickleNamesInOrderOfExecution();
    expect(actualNames).toEqual(expectedNames);
  }

  @then("scenario {string} has status {string}")
  public checkScenarioStatus(name: string, status: string) {
    const result = this.runner.extractor.getTestCaseResult(name);

    expect(result.status).toEqual(status.toUpperCase());
  }

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
}

export = ScenarioSteps;

// Then(
//   "the scenario {string} has the steps:",
//   function(this: World, name: string, table: DataTable) {
//     const actualTexts = getTestStepResults(this.lastRun.envelopes, name).map(
//       (s) => s.text
//     );
//     const expectedTexts = table.rows().map((row) => row[0]);
//     expect(actualTexts).to.eql(expectedTexts);
//   }
// );
//
// Then(
//   "scenario {string} step {string} has status {string}",
//   function(this: World, pickleName: string, stepText: string, status: string) {
//     const testStepResults = getTestStepResults(
//       this.lastRun.envelopes,
//       pickleName
//     );
//     const testStepResult = testStepResults.find((x) => x.text === stepText);
//     expect(testStepResult.result.status).to.eql(
//       status.toUpperCase() as messages.TestStepResultStatus
//     );
//   }
// );
//
// Then(
//   "scenario {string} attempt {int} step {string} has status {string}",
//   function(
//     this: World,
//     pickleName: string,
//     attempt: number,
//     stepText: string,
//     status: string
//   ) {
//     const testStepResults = getTestStepResults(
//       this.lastRun.envelopes,
//       pickleName,
//       attempt
//     );
//     const testStepResult = testStepResults.find((x) => x.text === stepText);
//     expect(testStepResult.result.status).to.eql(
//       status.toUpperCase() as messages.TestStepResultStatus
//     );
//   }
// );
//
// Then(
//   "scenario {string} {string} hook has status {string}",
//   function(
//     this: World,
//     pickleName: string,
//     hookKeyword: string,
//     status: string
//   ) {
//     const testStepResults = getTestStepResults(
//       this.lastRun.envelopes,
//       pickleName
//     );
//     const testStepResult = testStepResults.find((x) => x.text === hookKeyword);
//     expect(testStepResult.result.status).to.eql(
//       status.toUpperCase() as messages.TestStepResultStatus
//     );
//   }
// );
//
// Then(
//   "scenario {string} step {string} failed with:",
//   function(
//     this: World,
//     pickleName: string,
//     stepText: string,
//     errorMessage: string
//   ) {
//     const testStepResults = getTestStepResults(
//       this.lastRun.envelopes,
//       pickleName
//     );
//     const testStepResult = testStepResults.find((x) => x.text === stepText);
//     if (semver.satisfies(process.version, ">=14.0.0")) {
//       errorMessage = errorMessage.replace(
//         "{ member: [Circular] }",
//         "<ref *1> { member: [Circular *1] }"
//       );
//     }
//     expect(testStepResult.result.status).to.eql(
//       messages.TestStepResultStatus.FAILED
//     );
//     expect(testStepResult.result.message).to.include(errorMessage);
//   }
// );
//
// Then(
//   "scenario {string} attempt {int} step {string} failed with:",
//   function(
//     this: World,
//     pickleName: string,
//     attempt: number,
//     stepText: string,
//     errorMessage: string
//   ) {
//     const testStepResults = getTestStepResults(
//       this.lastRun.envelopes,
//       pickleName,
//       attempt
//     );
//     const testStepResult = testStepResults.find((x) => x.text === stepText);
//     expect(testStepResult.result.status).to.eql(
//       messages.TestStepResultStatus.FAILED
//     );
//     expect(testStepResult.result.message).to.include(errorMessage);
//   }
// );
//
// Then(
//   "scenario {string} step {string} has the doc string:",
//   function(
//     this: World,
//     pickleName: string,
//     stepText: string,
//     docString: string
//   ) {
//     const pickleStep = getPickleStep(
//       this.lastRun.envelopes,
//       pickleName,
//       stepText
//     );
//     expect(pickleStep.argument.docString.content).to.eql(docString);
//   }
// );
//
// Then(
//   "scenario {string} step {string} has the data table:",
//   function(
//     this: World,
//     pickleName: string,
//     stepText: string,
//     dataTable: DataTable
//   ) {
//     const pickleStep = getPickleStep(
//       this.lastRun.envelopes,
//       pickleName,
//       stepText
//     );
//     expect(new DataTable(pickleStep.argument.dataTable)).to.eql(dataTable);
//   }
// );

```
---
# WORLD  (what `this` gives you)
```ts
// No custom World was found. `this` is the default cucumber-js World.
// Share per-scenario state by assigning onto `this` inside a step body.
```
---
# CONSTANTS 
```ts
// (none discovered in this repo)
```
---
# TASK — write the missing step definitions for this Gherkin feature
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