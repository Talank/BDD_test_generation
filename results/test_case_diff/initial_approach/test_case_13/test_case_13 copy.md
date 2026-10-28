

## Generated
```ts
import { binding, given, then, when } from "cucumber-tsflow";
import expect from "expect";
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
  public checkPasses() {
    expect(this.runner.lastRun.error).toBeNull();
  }

  @then("the output contains text once:")
  public checkOutputContainsTextOnce(text: string) {
    const occurrences = this.runner.lastRun.output.split(text).length - 1;
    expect(occurrences).toBe(1);
  }
}

export = HookSteps;
```


```
