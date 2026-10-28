

## Generated
```ts
import { binding, given, then, when } from "cucumber-tsflow";

import { TestRunner } from "../support/runner";

@binding([TestRunner])
class BindingSteps {
  public constructor(private readonly runner: TestRunner) {}

  @given("a file named {string} with:")
  public async newFile(filePath: string, contents: string) {
    await this.runner.dir.writeFile(filePath, contents);
  }

  @when("I run cucumber-js")
  public async runCucumber() {
    await this.runner.run();
  }

  @then("it passes")
  public async checkPasses() {
    if (this.runner.lastRun.error != null) {
      throw new Error(
        `Expected cucumber-js to pass, but it failed:\n\n${this.runner.lastRun.errorOutput}`,
      );
    }
  }

  @then("it fails")
  public async checkFails() {
    if (this.runner.lastRun.error == null) {
      throw new Error("Expected cucumber-js to fail, but it passed.");
    }
  }
}

export = BindingSteps;
```
