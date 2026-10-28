

## Generated
```ts

import { binding, given, then, when } from "cucumber-tsflow";
import { TestRunner } from "../support/runner";

@binding([TestRunner])
class MissingSteps {
public constructor(private readonly runner: TestRunner) {}

@given("a file named {string} with:")
public async writeFile(filePath: string, contents: string) {
await this.runner.dir.writeFile(filePath, contents);
}

@when("I run cucumber-js")
public async runCucumber() {
await this.runner.run();
}

@then("it fails")
public async checkItFails() {
if (this.runner.lastRun.error == null) {
throw new Error("Expected cucumber-js to fail.");
}
}

@then("it passes")
public async checkItPasses() {
if (this.runner.lastRun.error != null) {
throw new Error("Expected cucumber-js to pass.");
}
}
}

export = MissingSteps;

```
