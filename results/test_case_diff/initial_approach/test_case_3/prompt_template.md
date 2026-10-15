# ROLE
You translate BDD (Gherkin) steps into cucumber-js step definitions that call
this project's existing DSL / page-object layer. This is TRANSLATION, not design.
The Gherkin is the COMPLETE source of truth for intent. Do not add, drop, or
"improve" coverage.

Each step's text becomes a binding PATTERN that cucumber-js matches at runtime. A
step definition is written ONCE and is reused by every scenario that shares that
step text.

# HARD RULES
1. Emit one binding (Given/When/Then) per UNIQUE step. Before writing one, check
   REGISTERED STEPS: if a listed pattern already matches this step's text — OR a
   pattern you would write could also match a step already listed there — do NOT
   redefine it. cucumber-js throws on a duplicate or ambiguous registration.
   Skip it and note `// EXISTS: <step text>`.
2. A binding body may CALL only: functions/methods in DSL CATALOG, members
   exposed by WORLD, and custom parameter types in PARAMETER TYPES. Never invent
   a function, page object, method, or parameter type. Reach the DSL exactly the
   way DSL USAGE shows existing steps reaching it (e.g. through `this`, or a
   constructed page object) — do not call a bare method name that has no receiver.
3. Use `async function (...) { ... }` — NEVER an arrow function — so `this` binds
   to the cucumber World.
4. SCENARIO STATE flows between steps ONLY through the World (`this`). Steps are
   separate function bodies with no shared locals: a step that needs a value
   produced by an earlier step READS it from a WORLD member; a step that PRODUCES
   such a value MAY assign it onto `this` (e.g. `this.orderId = await ...`).
   Writing scenario state to `this` is allowed even though it is not a DSL call.
   Do not use module-level mutable variables for per-scenario state unless
   EXISTING STEP DEFINITIONS already does.
5. PARAMETERIZE only what varies as SURFACE syntax — a Cucumber Expression matches
   the literal shape of the text:
   - text that appears QUOTED in the step  → `{string}` (pass the value through)
   - a NUMBER in the step                  → `{int}` / `{float}`
   - a bare (unquoted) word that varies     → use a custom type from PARAMETER
                                              TYPES or an alternation `(a/b)` IF
                                              one applies; OTHERWISE leave it as
                                              LITERAL text in the pattern.
   Do NOT wrap a bare word in `{string}` — `{string}` only matches quoted text, so
   the step would go undefined at runtime. Never hard-code into the DSL call a
   value that came from the step text; pass the captured parameter. Use CONSTANTS
   only for fixed symbolic values.
6. Data tables and doc strings arrive as the LAST parameter (dataTable /
   docString). Hand them to the DSL; don't reconstruct their contents.
7. THINNESS: when a single DSL function performs the step, the body is that ONE
   call — prefer the most specific / highest-level function. Use multiple calls
   only when no single function covers the step. Never rebuild a behavior from
   generic primitives when a higher-level function exists.
8. Failure modes (do not guess):
   - No DSL function fits the action         → `// UNMAPPED: <step text>`
   - Required value not in step/table/CONST  → `// UNMAPPED (missing value): <step text>`
   - Multiple DSL functions match            → prefer the most specific; if still
                                               ambiguous → `// UNMAPPED (ambiguous): <step text>`

# CONVENTIONS (style — not correctness gates)
- And / But inherit the keyword of the preceding Given/When/Then for readability
  (an "And" after a "When" is written `When`). cucumber-js treats Given/When/Then
  as aliases, so this never affects matching — follow it, but don't agonize over it.
- Mirror the binding SHAPE, Cucumber Expression conventions, and call style of
  EXISTING STEP DEFINITIONS. Take SHAPE from them only — do NOT copy their
  coverage, and do not treat a step they already cover as one you must rewrite.

# SCOPE NOTES (the runner handles these — you do NOT)
- Scenario Outline / Examples: write ONE parameterized binding. The runner
  substitutes each `<placeholder>` with its Examples value BEFORE matching, so
  your pattern must match the SUBSTITUTED value (a quoted Examples cell →
  `{string}`, a numeric one → `{int}`), NOT the literal `<placeholder>` token.
  Do not unroll the rows.
- Background: its steps are ordinary steps — define any that are missing.
- @tags: runner-level filtering/hooks. Emit nothing for them unless a tagged hook
  already appears in WORLD or EXISTING STEP DEFINITIONS.

# OUTPUT
Return a COMPLETE, RUNNABLE step-definitions file:
1. An IMPORT BLOCK: `Given`/`When`/`Then` (and any hook you use) from
   `@cucumber/cucumber`, plus every page object / helper / constant your bodies
   call. Import each from the path shown in its `// ---- <path> ----` header,
   written as a correct relative path from a sibling step-definitions file. Keep
   the repo's module style — ESM `import` vs CommonJS `require` — as seen in
   EXISTING STEP DEFINITIONS.
2. The BINDING(S), in Gherkin order, one per unique not-yet-registered step.
No World class, no prose, no explanation outside the file.

Before returning, confirm: every called name is in DSL CATALOG, WORLD, or
PARAMETER TYPES; every quoted/numeric literal is a captured parameter and every
bare literal is intentional; no pattern duplicates or overlaps one in REGISTERED
STEPS; every function is `async function`, not an arrow; every import resolves to
a path shown below.

---
# TASK — write the missing step definitions for this scenario/feature
```gherkin
Feature: User Authentication tests

  Background:
    Given User navigates to the application
    And User click on the login link

  Scenario: Login should be success
    And User enter the username as "ortoni11"
    And User enter the password as "Pass1234"
    When User click on the login button
    Then Login should be success

  Scenario: Login should not be success
    Given User enter the username as "koushik"
    Given User enter the password as "Passkoushik"
    When User click on the login button
    But Login should fail
```
---
# DSL CATALOG  (page objects / helpers — closed set, call ONLY these)
```ts
// ===== PUBLIC SURFACE INDEX (auto-extracted) =====
// src/helper/browsers/browserManager.ts
//   - invokeBrowser()
// src/helper/util/logger.ts
//   - options(scenarioName: string)
// src/helper/wrapper/PlaywrightWrappers.ts
//   - PlaywrightWrapper#async goto(url: string)
//   - PlaywrightWrapper#async waitAndClick(locator: string)
//   - PlaywrightWrapper#async navigateTo(link: string)
// src/helper/wrapper/assert.ts
//   - Assert#async assertTitle(title: string)
//   - Assert#async assertTitleContains(title: string)
//   - Assert#async assertURL(url: string)
//   - Assert#async assertURLContains(title: string)
// src/pages/registerPage.ts
//   - RegisterPage#async navigateToRegisterPage()
//   - RegisterPage#async registerUser(firstname: string, lastname: string, userName: string, password: string, confirmPassword: string, gender: string)
//   - RegisterPage#async enterUsername(userName: string)

// ---- src/helper/browsers/browserManager.ts ----
import { LaunchOptions, chromium, firefox, webkit } from "@playwright/test";

const options: LaunchOptions = {
    headless: !true
}
export const invokeBrowser = () => {
    const browserType = process.env.npm_config_BROWSER || "chrome";
    switch (browserType) {
        case "chrome":
            return chromium.launch(options);
        case "firefox":
            return firefox.launch(options);
        case "webkit":
            return webkit.launch(options);
        default:
            throw new Error("Please set the proper browser!")
    }

}

// ---- src/helper/util/logger.ts ----
import { transports, format } from "winston";

export function options(scenarioName: string) {
    return {
        transports: [
            new transports.File({
                filename: `test-results/logs/${scenarioName}/log.log`,
                level: 'info',
                format: format.combine(
                    format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
                    format.align(),
                    format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`)
                )
            }),
        ]
    }
};

// ---- src/helper/wrapper/PlaywrightWrappers.ts ----
import { Page } from "@playwright/test";

export default class PlaywrightWrapper {

    constructor(private page: Page) { }

    async goto(url: string) {
        await this.page.goto(url, {
            waitUntil: "domcontentloaded"
        });
    }

    async waitAndClick(locator: string) {
        const element = this.page.locator(locator);
        await element.waitFor({
            state: "visible"
        });
        await element.click();
    }

    async navigateTo(link: string) {
        await Promise.all([
            this.page.waitForNavigation(),
            this.page.click(link)
        ])
    }

}

// ---- src/helper/wrapper/assert.ts ----
import { expect, Page } from "@playwright/test";

export default class Assert {

    constructor(private page: Page) { }

    async assertTitle(title: string) {
        await expect(this.page).toHaveTitle(title);
    }

    async assertTitleContains(title: string) {
        const pageTitle = await this.page.title();
        expect(pageTitle).toContain(title);
    }

    async assertURL(url: string) {
        await expect(this.page).toHaveURL(url);
    }

    async assertURLContains(title: string) {
        const pageURL = this.page.url();
        expect(pageURL).toContain(title);
    }

}

// ---- src/hooks/pageFixture.ts ----
import { Page } from "@playwright/test";
import { Logger } from "winston";

export const fixture = {
    // @ts-ignore
    page: undefined as Page,
    logger: undefined as Logger
}

// ---- src/pages/registerPage.ts ----
import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";

export default class RegisterPage {

    private base: PlaywrightWrapper;

    constructor(private page: Page) {
        this.base = new PlaywrightWrapper(page);
    }

    private Elements = {
        fName: "input[formcontrolname='firstname']",
        lname: "input[formcontrolname='lastname']",
        userName: "input[formcontrolname='username']",
        password: "input[formcontrolname='password']",
        confirmPassword: "input[formcontrolname='confirmPassword']",
        maleInput: "input[value='Male']",
        femaleInput: "input[value='Female']",
        maleRadioBtn: "//span[contains(text(),'Male')]",
        femaleRadioBtn: "//span[contains(text(),'Female')]",
        regBtn: "button[color='primary']"
    }

    async navigateToRegisterPage() {
        await this.base.goto("https://bookcart.azurewebsites.net/register")
    }


    async registerUser(firstname: string, lastname: string, userName: string,
        password: string, confirmPassword: string,
        gender: string) {
        await this.page.type(this.Elements.fName, firstname);
        await this.page.type(this.Elements.lname, lastname);
        // this must be unique always
        await this.enterUsername(userName);
        await this.page.type(this.Elements.password, password);
        await this.page.type(this.Elements.confirmPassword, confirmPassword);
        if (gender == "m") {
            await this.page.click(this.Elements.maleRadioBtn);
            await expect(this.page.locator(this.Elements.maleInput)).toBeChecked();
        } else {
            await this.page.click(this.Elements.femaleRadioBtn);
            await expect(this.page.locator(this.Elements.femaleInput)).toBeChecked();
        }
        const regBtn = this.page.locator(this.Elements.regBtn);
        await regBtn.click();
    }

    async enterUsername(userName: string) {
        await this.page.type(this.Elements.userName, userName);
        const [response] = await Promise.all([
            this.page.waitForResponse(res => {
                return res.status() == 200
                    &&
                    res.url() == `https://bookcart.azurewebsites.net/api/user/validateUserName/${userName}`
            })
        ]);
        await response.finished();
    }
}

```
---
# DSL USAGE  (how existing steps reach the DSL — mirror these call shapes)
```ts
// HOW EXISTING STEPS REACH THE DSL (observed call shapes — mirror these):
//   assert.assertURL(…)
//   fixture.logger.info(…)
//   fixture.page.locator(…)
//   fixture.page.waitForTimeout(…)
//   new Assert(…)
//   new RegisterPage(…)
//   registerPage.navigateToRegisterPage(…)
//   registerPage.registerUser(…)
//   toast.waitFor(…)
```
---
# PARAMETER TYPES  (custom Cucumber Expression types available)
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS  (already bound — never redefine or overlap; reuse shared steps)
```ts
// 6 step bindings already registered — do NOT redefine any of these:
Given('user search for a {string}')                         // src/test/steps/addToCartSteps.ts
When('user add the book to the cart')                       // src/test/steps/addToCartSteps.ts
Then('the cart badge should get updated')                   // src/test/steps/addToCartSteps.ts
Given('I navigate to the register page')                    // src/test/steps/registerUsersSteps.ts
When('I created a new user')                                // src/test/steps/registerUsersSteps.ts
Then('I confirm user registration is success')              // src/test/steps/registerUsersSteps.ts
```
---
# EXISTING STEP DEFINITIONS  (bodies, for style + reuse; target scenario held out)
```ts
// ---- src/test/steps/addToCartSteps.ts ----
import { Given, When, Then, setDefaultTimeout } from "@cucumber/cucumber";

setDefaultTimeout(60 * 1000 * 2)

import { expect } from "@playwright/test";
import { fixture } from "../../hooks/pageFixture";

Given('user search for a {string}', async function (book) {
    fixture.logger.info("Searching for a book: " + book)
    await fixture.page.locator("input[type='search']").type(book);
    await fixture.page.waitForTimeout(2000);
    await fixture.page.locator("mat-option[role='option'] span").click();
});
When('user add the book to the cart', async function () {
    await fixture.page.locator("//button[@color='primary']").click();
    const toast = fixture.page.locator("simple-snack-bar");
    await expect(toast).toBeVisible();
    await toast.waitFor({ state: "hidden" })
});
Then('the cart badge should get updated', async function () {
    const badgeCount = await fixture.page.locator("#mat-badge-content-0").textContent();
    expect(Number(badgeCount)).toBeGreaterThan(0);
});

// ---- src/test/steps/registerUsersSteps.ts ----
import { Given, When, Then } from "@cucumber/cucumber";
import RegisterPage from "../../pages/registerPage";
import { fixture } from "../../hooks/pageFixture";
import Assert from "../../helper/wrapper/assert";
import * as data from "../../helper/util/test-data/registerUser.json";

let registerPage: RegisterPage;
let assert: Assert;

Given('I navigate to the register page', async function () {
    registerPage = new RegisterPage(fixture.page);
    assert = new Assert(fixture.page);
    await registerPage.navigateToRegisterPage();
});

When('I created a new user', async function () {
    const username = data.userName + Date.now().toString();
    await registerPage.registerUser(data.firstName, data.lastName,
        username, data.password, data.confirmPassword, "m");
});

Then('I confirm user registration is success', async function () {
    await assert.assertURL("https://bookcart.azurewebsites.net/login");
});

```
---
# WORLD  (how `this` exposes page / context / helpers / scenario state)
```ts
// ---- src/hooks/hooks.ts ----
import { BeforeAll, AfterAll, Before, After, Status } from "@cucumber/cucumber";
import { Browser, BrowserContext } from "@playwright/test";
import { fixture } from "./pageFixture";
import { invokeBrowser } from "../helper/browsers/browserManager";
import { getEnv } from "../helper/env/env";
import { createLogger } from "winston";
import { options } from "../helper/util/logger";
const fs = require("fs-extra");

let browser: Browser;
let context: BrowserContext;

BeforeAll(async function () {
    getEnv();
    browser = await invokeBrowser();
});
// It will trigger for not auth scenarios
Before({ tags: "not @auth" }, async function ({ pickle }) {
    const scenarioName = pickle.name + pickle.id
    context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    await context.tracing.start({
        name: scenarioName,
        title: pickle.name,
        sources: true,
        screenshots: true, snapshots: true
    });
    const page = await context.newPage();
    fixture.page = page;
    fixture.logger = createLogger(options(scenarioName));
});


// It will trigger for auth scenarios
Before({ tags: '@auth' }, async function ({ pickle }) {
    const scenarioName = pickle.name + pickle.id
    context = await browser.newContext({
        storageState: getStorageState(pickle.name),
        recordVideo: {
            dir: "test-results/videos",
        },
    });
    await context.tracing.start({
        name: scenarioName,
        title: pickle.name,
        sources: true,
        screenshots: true, snapshots: true
    });
    const page = await context.newPage();
    fixture.page = page;
    fixture.logger = createLogger(options(scenarioName));
});

After(async function ({ pickle, result }) {
    let videoPath: string;
    let img: Buffer;
    const path = `./test-results/trace/${pickle.id}.zip`;
    if (result?.status == Status.PASSED) {
        img = await fixture.page.screenshot(
            { path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        videoPath = await fixture.page.video().path();
    }
    await context.tracing.stop({ path: path });
    await fixture.page.close();
    await context.close();
    if (result?.status == Status.PASSED) {
        await this.attach(
            img, "image/png"
        );
        await this.attach(
            fs.readFileSync(videoPath),
            'video/webm'
        );
        const traceFileLink = `<a href="https://trace.playwright.dev/">Open ${path}</a>`
        await this.attach(`Trace file: ${traceFileLink}`, 'text/html');

    }

});

AfterAll(async function () {
    await browser.close();
})

function getStorageState(user: string): string | { cookies: { name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: "Strict" | "Lax" | "None"; }[]; origins: { origin: string; localStorage: { name: string; value: string; }[]; }[]; } {
    if (user.endsWith("admin"))
        return "src/helper/auth/admin.json";
    else if (user.endsWith("lead"))
        return "src/helper/auth/lead.json";
}

```
---
# CONSTANTS  (the only allowed symbolic values)
```ts
// ---- src/helper/env/env.ts ----
import * as dotenv from 'dotenv'

export const getEnv = () => {
    if (process.env.ENV) {
        dotenv.config({
            override: true,
            path: `src/helper/env/.env.${process.env.ENV}`
        })
    } else {
        console.error("NO ENV PASSED!")
    }

}

// ---- src/helper/util/test-data/registerUser.json ----  (test data imported by a step definition)
{
    "firstName": "Koushik ",
    "lastName": "C ",
    "userName": "user",
    "password": "Pass123$",
    "confirmPassword": "Pass123$"
}

```
