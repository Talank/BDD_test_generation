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
Feature: Subscriptions
  As an user, I'm able to view the subscription page

  Scenario: User open the app and navigate subscription page
    Given user open the app
    And user open the subscription link
    Then user should see the subscription page

  Scenario: User on subscription page, should be able to filter the list of subscriptions
    Given user open the "subscriptions" page
    Then user should see "3" subscriptions
    When user change filter by "One Time Purchase"
    Then user should see "1" subscriptions

  Scenario: User upon refreshing subscription page, should see filter persisted
    Given user open the "subscriptions" page
    And user change filter by "One Time Purchase"
    Then user should see "1" subscriptions
    When user reload current page
    Then user should see "1" subscriptions
```
---
# DSL CATALOG  (page objects / helpers — closed set, call ONLY these)
```ts
// ===== PUBLIC SURFACE INDEX (auto-extracted) =====
// e2e/page-objects/app.po.ts
//   - homePage()
//   - AppPo(page: Page)
// e2e/page-objects/subscription.po.ts
//   - subscriptionLink()
//   - filterTrigger()
//   - list()
//   - async pickOptionFromFilter(option: string)
//   - SubscriptionPo(page: Page)

// ---- e2e/page-objects/app.po.ts ----
import type { Page } from '@playwright/test';

const AppPo = (page: Page) => {
  function homePage() {
    return page.getByTestId('home-page');
  }

  return {
    homePage,
  };
};

export default AppPo;

// ---- e2e/page-objects/subscription.po.ts ----
import type { Page } from '@playwright/test';

const SubscriptionPo = (page: Page) => {
  function subscriptionLink() {
    return page.getByTestId('subscription-link');
  }

  function filterTrigger() {
    return page.getByTestId('filter-trigger');
  }

  function list() {
    return page.getByTestId('subscription-item');
  }

  async function pickOptionFromFilter(option: string) {
    await filterTrigger().click();
    await page.getByRole('option', { name: option }).click();
  }

  return {
    subscriptionLink,
    filterTrigger,
    pickOptionFromFilter,
    list,
  };
};

export default SubscriptionPo;

```
---
# DSL USAGE  (how existing steps reach the DSL — mirror these call shapes)
```ts
// HOW EXISTING STEPS REACH THE DSL (observed call shapes — mirror these):
//   this.pageObjects.appPo.homePage(…)
```
---
# PARAMETER TYPES  (custom Cucumber Expression types available)
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS  (already bound — never redefine or overlap; reuse shared steps)
```ts
// 1 step bindings already registered — do NOT redefine any of these:
Then(/^user should see the home page$/)                     // e2e/steps/app.steps.ts
```
---
# EXISTING STEP DEFINITIONS  (bodies, for style + reuse; target scenario held out)
```ts
// ---- e2e/steps/app.steps.ts ----
import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { ICustomWorld } from '../support/custom-world';

Then(/^user should see the home page$/, async function (this: ICustomWorld) {
  await expect(this.pageObjects.appPo.homePage()).toBeVisible();
});

```
---
# WORLD  (how `this` exposes page / context / helpers / scenario state)
```ts
// ---- e2e/support/custom-world.ts ----
import { setWorldConstructor, World } from '@cucumber/cucumber';
import type * as messages from '@cucumber/messages';
import type {
  APIRequestContext,
  BrowserContext,
  Page,
  PlaywrightTestOptions,
} from '@playwright/test';
import type { PageObjects } from './common-hooks';

enum Parameters {
  SERVER_URL = 'SERVER_URL',
}

export type WorldParams = Record<Parameters, any>;

export interface CucumberWorldConstructorParams {
  parameters: WorldParams;
}

export interface ICustomWorld extends World, PageObjects {
  debug: boolean;
  mobile: boolean;
  feature?: messages.Pickle;
  context?: BrowserContext;
  page?: Page;
  parameters: WorldParams;

  testName?: string;
  startTime?: Date;

  server?: APIRequestContext;

  playwrightOptions?: PlaywrightTestOptions;
}

export class CustomWorld extends World implements ICustomWorld {
  debug = false;

  mobile = false;
}

setWorldConstructor(CustomWorld);

// ---- e2e/support/common-hooks.ts ----
import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  type ITestCaseHookParameter,
  Status,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import {
  type ChromiumBrowser,
  type ConsoleMessage,
  chromium,
  devices,
  type FirefoxBrowser,
  firefox,
  type WebKitBrowser,
  webkit,
} from '@playwright/test';
import { ensureDir } from 'fs-extra';
import AppPo from '../page-objects/app.po';
import SubscriptionPo from '../page-objects/subscription.po';
import config from './config';
import type { ICustomWorld } from './custom-world';

let browser: ChromiumBrowser | FirefoxBrowser | WebKitBrowser;
const tracesDir = 'traces';

export interface PageObjects {
  pageObjects?: {
    appPo: ReturnType<typeof AppPo>;
    subscriptionPo: ReturnType<typeof SubscriptionPo>;
  };
}

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 1000);

BeforeAll(async () => {
  switch (config.browser) {
    case 'firefox': {
      browser = await firefox.launch(config.browserOptions);
      break;
    }
    case 'webkit': {
      browser = await webkit.launch(config.browserOptions);
      break;
    }
    default: {
      browser = await chromium.launch(config.browserOptions);
    }
  }
  await ensureDir(tracesDir);
});

Before({ tags: '@pending' }, () => 'skipped' as any);

Before({ tags: '@debug' }, function (this: ICustomWorld) {
  this.debug = true;
});

Before({ tags: '@mobile' }, function (this: ICustomWorld) {
  this.mobile = true;
});

Before(async function (this: ICustomWorld, { pickle }: ITestCaseHookParameter) {
  this.startTime = new Date();
  this.testName = pickle.name.replaceAll(/\W/g, '-');
  // customize the [browser context](https://playwright.dev/docs/next/api/class-browser#browsernewcontextoptions)

  const isMobile = this.mobile ? devices['iPhone 14 Pro'] : {};
  this.context = await browser.newContext({
    acceptDownloads: true,
    recordVideo: process.env.PWVIDEO ? { dir: 'screenshots' } : undefined,
    viewport: { width: 1200, height: 800 },
    ...isMobile,
  });

  await this.context.tracing.start({ screenshots: true, snapshots: true });
  this.page = await this.context.newPage();
  this.page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'log') {
      this.attach(msg.text());
    }
  });
  this.feature = pickle;

  this.pageObjects = {
    appPo: AppPo(this.page),
    subscriptionPo: SubscriptionPo(this.page),
  };
});

After(async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  if (result) {
    this.attach(
      `Status: ${result?.status}. Duration:${result.duration?.seconds}s`,
    );

    if (result.status !== Status.PASSED) {
      const image = await this.page?.screenshot();

      // Replace : with _ because colons aren't allowed in Windows paths
      const timePart = this.startTime
        ?.toISOString()
        .split('.')[0]
        .replaceAll(':', '_');

      if (image) {
        this.attach(image, 'image/png');
      }
      await this.context?.tracing.stop({
        path: `${tracesDir}/${this.testName}-${timePart}trace.zip`,
      });
    }
  }
  await this.page?.close();
  await this.context?.close();
});

AfterAll(async () => {
  await browser.close();
});

```
---
# CONSTANTS  (the only allowed symbolic values)
```ts
// ---- e2e/support/config.ts ----
import type { LaunchOptions } from '@playwright/test';

const browserOptions: LaunchOptions = {
  slowMo: 0,
  args: [
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
  ],
  // headless: false,
  firefoxUserPrefs: {
    'media.navigator.streams.fake': true,
    'media.navigator.permission.disabled': true,
  },
};

const config = {
  browser: process.env.BROWSER || 'chromium',
  browserOptions,
};

export default config;

```
