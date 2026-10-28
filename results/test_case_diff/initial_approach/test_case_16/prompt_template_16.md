# ROLE
You write cucumber-js step definitions from Gherkin steps.

The Gherkin says what to test. Your job is to wire each gherkin step to code that already exists. Never add, drop,
or improve test coverage.

Each step's text becomes a pattern. cucumber-js matches it at runtime. A pattern
is written once and shared by every scenario that uses it.

# RULES
1. **Only call what is listed.** Functions from DSL CATALOG, members on `this`
   from WORLD, types from PARAMETER TYPES. Never invent a name. Plain JavaScript
   and the Cucumber DataTable API are fine. Reach the DSL the same way the
   existing step definitions do.
2. **Use `async function`, never an arrow function.** An arrow breaks `this`.
   Await every DSL call.
3. **One binding per pattern.** Two steps that differ only in a value —
   `"admin"` vs `"editor"` — are one binding with one parameter..
4. **Never redefine a registered step.** If your pattern would match a step in
   REGISTERED STEPS, skip it and write `// EXISTS: <step text>`. But "looks
   similar" is not "matches" — if unsure, write the binding.
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
9. **Say when you cannot map it.** Do not guess.
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
// src/utils/detect_series.js
//   - detectSeries(arr, iterator, check)

// ---- src/step_definitions/index.js ----
/**
 * Dependencies
 */

const action = require('./action.js');
const assertDOM = require('./assert_dom.js');
const assertForm = require('./assert_form.js');
const assertURL = require('./assert_url.js');
const form = require('./form.js');
const navigation = require('./navigation.js');
const utility = require('./utility.js');

/**
 * Interface
 */

module.exports = [
  ...action,
  ...assertDOM,
  ...assertForm,
  ...assertURL,
  ...form,
  ...navigation,
  ...utility,
];

// ---- src/utils/detect_series.js ----
/**
 * Dependencies
 */

const Promise = require('bluebird');
const dbg = require('debug');

/**
 * Private
 */

const debug = dbg('mink:detectSeries');
class Result extends Error {
  constructor(item, result) {
    super();
    this.item = item;
    this.result = result;
  }
}

/**
 * Public
 */

function detectSeries(arr, iterator, check) {
  return Promise.each(arr, item =>
    Promise.try(() => iterator(item))
      .tap(debug)
      .then(result => {
        if (check(result)) {
          throw new Result(item, result);
        }
      }),
  ).catch(Result, ({ item, result }) => ({
    item,
    result,
  }));
}

/**
 * Interface
 */

module.exports = detectSeries;

// ---- src/utils/errors.js ----
/**
 * Interface
 */

module.exports = {
  ACTION: {
    CLICK_LINK: 'Unable to find a link with selector or text matching',
    CLICK_BUTTON:
      'Unable to find button / input[type=submit] with selector or text matching',
  },
  NAVIGATION: {
    BASE_URL: 'Base url should be a valid absolute url.',
    ROOT: 'Please provide "config.baseUrl" or set BASE_URL in your env to use root function.',
  },
};

// ---- test/features/support/mink.js ----
const cucumber = require('@cucumber/cucumber');
const mink = require('../../../src/mink.js');

mink.gherkin(cucumber);

const driver = new mink.Mink({
  selectors: { 'Blogpost Teaser': 'section.post' },
});
driver.hook(cucumber);

```
---
# PARAMETER TYPES
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS 
```ts
// 46 step bindings already registered — do NOT redefine any of these:
Step(/^(?:|I )click on "([^"]*)"/)                          // src/step_definitions/action.js
Step(/^(?:|I )press "([^"]*)"/)                             // src/step_definitions/action.js
Step(/^(?:|I )follow "([^"]*)"/)                            // src/step_definitions/action.js
Step(/^(?:|I )submit "([^"]*)" form/)                       // src/step_definitions/action.js
Step(/^(?:|I )send key "([^"]*)" in "([^"]*)" element/)     // src/step_definitions/action.js
Step(/^(?:|I )should see "([^"]*)"$/)                       // src/step_definitions/assert_dom.js
Step(/^(?:|I )should not see "([^"]*)"$/)                   // src/step_definitions/assert_dom.js
Step(/^(?:|I )should see text matching (.+)$/)              // src/step_definitions/assert_dom.js
Step(/^(?:|I )should not see text matching (.+)$/)          // src/step_definitions/assert_dom.js
Step(/^(?:|I )should see (\d+) "([^"]*)" elements?$/)       // src/step_definitions/assert_dom.js
Step(/^(?:|I )should see "([^"]*)" in the "([^"]*)" element$/)// src/step_definitions/assert_dom.js
Step(/^(?:|I )should see "([^"]*)" in the "([^"]*)" element text$/)// src/step_definitions/assert_dom.js
Step(/^(?:|I )should not see "([^"]*)" in the "([^"]*)" element$/)// src/step_definitions/assert_dom.js
Step(/^(?:|I )should not see "([^"]*)" in the "([^"]*)" element text$/)// src/step_definitions/assert_dom.js
Step(/^(?:|I )should see an? "([^"]*)" element$/)           // src/step_definitions/assert_dom.js
Step(/^(?:|I )should not see an? "([^"]*)" element$/)       // src/step_definitions/assert_dom.js
Step(/the "([^"]*)" element should exist$/)                 // src/step_definitions/assert_dom.js
Step(/the "([^"]*)" element should not exist$/)             // src/step_definitions/assert_dom.js
Step(/the "([^"]*)" (?:field|element) should be enabled$/)  // src/step_definitions/assert_dom.js
Step(/the "([^"]*)" (?:field|element) should be disabled$/) // src/step_definitions/assert_dom.js
Step(/the "([^"]*)" checkbox should be checked$/)           // src/step_definitions/assert_dom.js
Step(/the checkbox "([^"]*)" (?:is|should be) checked$/)    // src/step_definitions/assert_dom.js
Step(/the "([^"]*)" checkbox should not be checked$/)       // src/step_definitions/assert_dom.js
Step(/the checkbox "([^"]*)" should (?:be unchecked|not be checked)$/)// src/step_definitions/assert_dom.js
Step(/the checkbox "([^"]*)" is (?:unchecked|not checked)$/)// src/step_definitions/assert_dom.js
Step(/the "([^"]*)" current option contain "([^"]*)"/)      // src/step_definitions/assert_form.js
Step(/the "([^"]*)" field should contain "([^"]*)"/)        // src/step_definitions/assert_form.js
Step(/the "([^"]*)" field should not contain "([^"]*)"/)    // src/step_definitions/assert_form.js
Step(/^(?:|I )should be on "([^"]*)"/)                      // src/step_definitions/assert_url.js
Step(/^(?:|I )should be on (?:|the )homepage/)              // src/step_definitions/assert_url.js
Step(/the url should match (.+)/)                           // src/step_definitions/assert_url.js
Step(/the url parameter should match (.+)/)                 // src/step_definitions/assert_url.js
Step(/^(?:|I )fill in "([^"]*)" with "([^"]*)"/)            // src/step_definitions/form.js
Step(/^(?:|I )fill in "([^"]*)" with:/)                     // src/step_definitions/form.js
Step(/^(?:|I )fill in the following:/)                      // src/step_definitions/form.js
Step(/^(?:|I )select "([^"]*)" from "([^"]*)"/)             // src/step_definitions/form.js
Step(/^(?:|I )check "([^"]*)"/)                             // src/step_definitions/form.js
Step(/^(?:|I )uncheck "([^"]*)"/)                           // src/step_definitions/form.js
Step(/^(?:|I )am on (?:|the )homepage/)                     // src/step_definitions/navigation.js
Step(/^(?:|I )go to (?:|the )homepage/)                     // src/step_definitions/navigation.js
Step(/^(?:|I )go to "([^"]*)"/)                             // src/step_definitions/navigation.js
Step(/^(?:|I )reload the page/)                             // src/step_definitions/navigation.js
Step(/^(?:|I )move backward one page/)                      // src/step_definitions/navigation.js
Step(/^(?:|I )wait (\d+) seconds?/)                         // src/step_definitions/utility.js
Step(/the viewport is (\d+)px width and (\d+)px height/)    // src/step_definitions/utility.js
Step(/^(?:|I )take a screenshot/)                           // src/step_definitions/utility.js
```
---
# EXISTING STEP DEFINITIONS (for call style — do not copy their coverage)
```ts
// ---- src/step_definitions/action.js ----
const Errors = require('../utils/errors.js');

const click = function (selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.page.click(selector);
};

const submit = function (selector) {
  selector = this.mink.getSelector(selector);
  const self = this;
  /* istanbul ignore next */
  return Promise.all([
    self.mink.page.waitForNavigation(),
    self.mink.page.$eval(selector, elem => {
      const form = elem.form || elem;
      form.submit();
    }),
  ]);
};

const press = function (selector) {
  selector = this.mink.getSelector(selector);
  const self = this;
  return this.mink.button(selector).then(item => {
    if (!item) throw new Error(Errors.ACTION.CLICK_BUTTON);
    return Promise.all([self.mink.page.waitForNavigation(), item.click()]).then(
      () => item.dispose(),
    );
  });
};

const follow = function (selector) {
  selector = this.mink.getSelector(selector);
  const self = this;
  return this.mink.link(selector).then(item => {
    if (!item) throw new Error(Errors.ACTION.CLICK_LINK);
    return Promise.all([self.mink.page.waitForNavigation(), item.click()]).then(
      () => item.dispose(),
    );
  });
};

const sendKey = function (key, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.page.$(selector).then(handle => {
    return handle.press(key).then(() => {
      handle.dispose();
    });
  });
};

module.exports = [
  [/^(?:|I )click on "([^"]*)"/, click],
  [/^(?:|I )press "([^"]*)"/, press],
  [/^(?:|I )follow "([^"]*)"/, follow],

  [/^(?:|I )submit "([^"]*)" form/, submit],
  [/^(?:|I )send key "([^"]*)" in "([^"]*)" element/, sendKey],
];

// ---- src/step_definitions/assert_dom.js ----
const { expect } = require('chai');

const seeText = function (expected) {
  return this.mink.html().then(html => {
    expect(html).to.contain(expected);
  });
};

const notSeeText = function (expected) {
  return this.mink.html().then(html => {
    expect(html).to.not.contain(expected);
  });
};

const matchText = function (regex) {
  return this.mink.html().then(html => {
    expect(html).to.match(new RegExp(regex));
  });
};

const notMatchText = function (regex) {
  return this.mink.html().then(html => {
    expect(html).to.not.match(new RegExp(regex));
  });
};

const elementContainsText = function (expected, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.html(selector).then(html => {
    expect(html).to.contain(expected);
  });
};

const elementNotContainsText = function (expected, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.html(selector).then(html => {
    expect(html).to.not.contain(expected);
  });
};

const elementTextContainsText = function (expected, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.text(selector).then(str => {
    expect(str).to.contain(expected);
  });
};

const elementTextNotContainsText = function (expected, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.text(selector).then(str => {
    expect(str).to.not.contain(expected);
  });
};

const elementsCount = function (expected, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.count(selector).then(count => {
    expect(count).to.equal(parseInt(expected, 10));
  });
};

const waitForSelector = (visible = false, hidden = false) => {
  return function (selector) {
    selector = this.mink.getSelector(selector);
    return this.mink.page
      .waitForSelector(selector, {
        timeout: 100,
        visible,
        hidden,
      })
      .then(handle => {
        expect(handle).to.not.equal(undefined);
        if (handle) handle.dispose();
      });
  };
};

const isExisting = waitForSelector();
const isNotExisting = waitForSelector(false, true);

const isChecked = expected => {
  return function (selector) {
    selector = this.mink.getSelector(selector);
    /* istanbul ignore next */
    return this.mink.page
      .$eval(selector, elem => elem.checked)
      .then(res => expect(res).to.equal(expected));
  };
};

const isDisabled = expected => {
  return function (selector) {
    selector = this.mink.getSelector(selector);
    /* istanbul ignore next */
    return this.mink.page
      .$eval(selector, elem => elem.disabled)
      .then(res => expect(res).to.equal(expected));
  };
};

module.exports = [
  [/^(?:|I )should see "([^"]*)"$/, seeText],
  [/^(?:|I )should not see "([^"]*)"$/, notSeeText],
  [/^(?:|I )should see text matching (.+)$/, matchText],
  [/^(?:|I )should not see text matching (.+)$/, notMatchText],
  [/^(?:|I )should see (\d+) "([^"]*)" elements?$/, elementsCount],
  [
    /^(?:|I )should see "([^"]*)" in the "([^"]*)" element$/,
    elementContainsText,
  ],
  [
    /^(?:|I )should see "([^"]*)" in the "([^"]*)" element text$/,
    elementTextContainsText,
  ],
  [
    /^(?:|I )should not see "([^"]*)" in the "([^"]*)" element$/,
    elementNotContainsText,
  ],
  [
    /^(?:|I )should not see "([^"]*)" in the "([^"]*)" element text$/,
    elementTextNotContainsText,
  ],
  [/^(?:|I )should see an? "([^"]*)" element$/, isVisible],
  [/^(?:|I )should not see an? "([^"]*)" element$/, isNotVisible],

  [/the "([^"]*)" element should exist$/, isExisting],
  [/the "([^"]*)" element should not exist$/, isNotExisting],
  [/the "([^"]*)" (?:field|element) should be enabled$/, isDisabled(false)],
  [/the "([^"]*)" (?:field|element) should be disabled$/, isDisabled(true)],
  [/the "([^"]*)" checkbox should be checked$/, isChecked(true)],
  [/the checkbox "([^"]*)" (?:is|should be) checked$/, isChecked(true)],
  [/the "([^"]*)" checkbox should not be checked$/, isChecked(false)],
  [
    /the checkbox "([^"]*)" should (?:be unchecked|not be checked)$/,
    isChecked(false),
  ],
  [/the checkbox "([^"]*)" is (?:unchecked|not checked)$/, isChecked(false)],
];

// ---- src/step_definitions/assert_form.js ----
const { expect } = require('chai');

const currentOption = function (selector, expected) {
  selector = this.mink.getSelector(selector);
  /* istanbul ignore next */
  return this.mink.page
    .$eval(selector, x => x.value)
    .then(value => {
      return this.mink
        .html(`${selector} option[value="${value}"]`)
        .then(html => {
          expect(html).to.contain(expected);
        });
    });
};

const fieldContains = function (selector, expected) {
  selector = this.mink.getSelector(selector);
  /* istanbul ignore next */
  return this.mink.page
    .$eval(selector, x => x.value)
    .then(value => {
      expect(value).to.contain(expected);
    });
};

const fieldNotContains = function (selector, expected) {
  selector = this.mink.getSelector(selector);
  /* istanbul ignore next */
  return this.mink.page
    .$eval(selector, x => x.value)
    .then(value => {
      expect(value).to.not.contain(expected);
    });
};

module.exports = [
  [/the "([^"]*)" current option contain "([^"]*)"/, currentOption],
  [/the "([^"]*)" field should contain "([^"]*)"/, fieldContains],
  [/the "([^"]*)" field should not contain "([^"]*)"/, fieldNotContains],
];

// ---- src/step_definitions/assert_url.js ----
const { expect } = require('chai');
const url = require('url');

const isEqual = function (location) {
  const parsed = url.parse(this.mink.page.url());
  expect([parsed.pathname, parsed.search].join('')).to.equal(location);
};

const isRoot = function () {
  return isEqual.bind(this)('/');
};

const urlMatch = function (regex) {
  const parsed = url.parse(this.mink.page.url());
  expect(parsed.pathname).to.match(new RegExp(regex));
};

const queryMatch = function (regex) {
  const parsed = url.parse(this.mink.page.url());
  expect(parsed.search).to.match(new RegExp(regex));
};

module.exports = [
  [/^(?:|I )should be on "([^"]*)"/, isEqual],
  [/^(?:|I )should be on (?:|the )homepage/, isRoot],
  [/the url should match (.+)/, urlMatch],
  [/the url parameter should match (.+)/, queryMatch],
];

// ---- src/step_definitions/form.js ----
/* eslint no-param-reassign: 0 */
const Promise = require('bluebird');

const fillField = function (selector, value) {
  selector = this.mink.getSelector(selector);
  /* istanbul ignore next */
  return this.mink.page.$eval(
    selector,
    (el, val) => {
      el.value = val;
    },
    value,
  );
};

const fillFieldsHash = function (hashDataTable) {
  /* istanbul ignore next */
  return Promise.each(hashDataTable.raw(), ([field, value]) =>
    this.mink.page.$eval(
      field,
      (el, val) => {
        el.value = val;
      },
      value,
    ),
  );
};

const selectFrom = function (option, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink
    .elementsWithText(`${selector} option`, option)
    .then(handles => {
      return Promise.each(handles, handle => {
        /* istanbul ignore next */
        return this.mink.page
          .evaluate(x => x.value, handle)
          .then(value => this.mink.page.select(selector, value))
          .then(() => handle.dispose());
      });
    });
};

const checkInput = function (state) {
  return function (selector) {
    selector = this.mink.getSelector(selector);
    /* istanbul ignore next */
    return this.mink.page.$eval(
      selector,
      (el, val) => {
        el.checked = val;
      },
      state,
    );
  };
};

module.exports = [
  [/^(?:|I )fill in "([^"]*)" with "([^"]*)"/, fillField],
  [/^(?:|I )fill in "([^"]*)" with:/, fillField],
  [/^(?:|I )fill in the following:/, fillFieldsHash],
  [/^(?:|I )select "([^"]*)" from "([^"]*)"/, selectFrom],
  [/^(?:|I )check "([^"]*)"/, checkInput(true)],
  [/^(?:|I )uncheck "([^"]*)"/, checkInput(false)],
];

// ---- src/step_definitions/navigation.js ----
const url = require('url');
const Errors = require('../utils/errors.js');

// From https://github.com/sindresorhus/is-absolute-url

const goRoot = function () {
  if (!this.mink.config.baseUrl) {
    throw new Error(Errors.NAVIGATION.ROOT);
  }
  return this.mink.page.goto(this.mink.config.baseUrl);
};

const refresh = function () {
  return this.mink.page.reload();
};

const goBack = function () {
  return this.mink.page.goBack();
};

module.exports = [

  [/^(?:|I )am on (?:|the )homepage/, goRoot],
  [/^(?:|I )go to (?:|the )homepage/, goRoot],

  [/^(?:|I )go to "([^"]*)"/, goTo],
  [/^(?:|I )reload the page/, refresh],
  [/^(?:|I )move backward one page/, goBack],
];

// ---- src/step_definitions/utility.js ----
const Promise = require('bluebird');

const viewport = function (width, height) {
  return this.mink.page.setViewport({
    width: parseInt(width, 10),
    height: parseInt(height, 10),
  });
};

const wait = function (seconds) {
  return Promise.delay(parseInt(seconds, 10) * 1000);
};

const screenshot = function () {
  return this.mink.page.screenshot({
    path: './screenshot.png',
  });
};

module.exports = [
  [/^(?:|I )wait (\d+) seconds?/, wait],
  [/the viewport is (\d+)px width and (\d+)px height/, viewport],
  [/^(?:|I )take a screenshot/, screenshot],
];

```
---
# WORLD  (what `this` gives you)
```ts
// ---- src/mink.js ----
const dbg = require('debug');
const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const defaultsDeep = require('lodash.defaultsdeep');

const detectSeries = require('./utils/detect_series.js');
const definitions = require('./step_definitions/index.js');

const debug = dbg('mink');

const DEFAULT_CONFIG = {
  baseUrl: process.env.BASE_URL,
  viewport: {
    width: 1366,
    height: 768,
  },
  puppeteer: {
    headless: process.env.RUN_HEADLESS !== '0',
    devtools: process.env.RUN_DEVTOOLS === '1',
  },
  selectors: {},
};

function gherkin(cucumber) {
  definitions.forEach(([pattern, fn]) => {
    cucumber.defineStep(pattern, fn);
  });
}

class Mink {
  constructor(config = {}) {
    this.config = defaultsDeep(config, DEFAULT_CONFIG);
  }

  hook(cucumber) {
    const self = this;
    cucumber.BeforeAll(() => self.setup());
    cucumber.AfterAll(() => self.cleanup());
    cucumber.setWorldConstructor(function () {
      this.mink = self;
    });
  }

  async setup() {
    this.browser = await puppeteer.launch(this.config.puppeteer);
    this.page = await this.browser.newPage();
    return this.page.setViewport(this.config.viewport);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Driver methods
  html(selector) {
    if (!selector) {
      return this.page.content();
    }
    /* istanbul ignore next */
    return this.page.$$eval(selector, elements => {
      return elements.map(x => x.outerHTML).join('');
    });
  }

  text(selector) {
    /* istanbul ignore next */
    return this.page.$$eval(selector, elements => {
      return elements.map(x => x.outerText).join('');
    });
  }

  count(selector) {
    /* istanbul ignore next */
    return this.page.$$eval(selector, elements => {
      return elements.length;
    });
  }

  async elementsWithText(selector, text, exact = true) {
    const self = this;
    const items = await self.page.$$(selector);
    return await Promise.filter(items, handle => {
      /* istanbul ignore next */
      return self.page
        .evaluate(obj => obj.innerText, handle)
        .then(res => {
          if (exact) {
            return res.toUpperCase() === text.toUpperCase();
          }
          return res.toUpperCase().indexOf(text.toUpperCase()) >= 0;
        });
    });
  }

  async elementsWithValue(selector, text) {
    const self = this;
    const items = await self.page.$$(selector);
    return await Promise.filter(items, async handle => {
      /* istanbul ignore next */
      const res = await self.page.evaluate(obj => obj.value, handle);
      return res.toUpperCase() === text.toUpperCase();
    });
  }

  async button(mixed) {
    const arr = [
      () =>
        Promise.try(() => this.page.$$(mixed)).catch(err => {
          debug(err);
          return [];
        }),
      () => this.elementsWithText('button', mixed),
      () => this.elementsWithValue('input[type=submit]', mixed),
    ];
    const { result } = await detectSeries(
      arr,
      fn_1 => fn_1(),
      WebElements => !!WebElements.length,
    );
    if (!result) throw new Error('Button not found !');
    return result[0];
  }

  async link(mixed) {
    const arr = [
      () =>
        Promise.try(() => this.page.$$(mixed)).catch(err => {
          debug(err);
          return [];
        }),
      () => this.elementsWithText('a', mixed, true),
      () => this.elementsWithText('a', mixed, false),
    ];
    const { result } = await detectSeries(
      arr,
      fn_1 => fn_1(),
      WebElements => !!WebElements.length,
    );
    if (!result) throw new Error('Link not found !');
    const visibleLinks = await Promise.filter(result, async handle => {
      try {
        const box = await handle.boundingBox();
        return box !== null;
      } catch (e) {
        return false;
      }
    });
    if (!visibleLinks.length) throw new Error('Link not found !');
    return visibleLinks[0];
  }

  getSelector(key) {
    return key in this.config.selectors ? this.config.selectors[key] : key;
  }
}

module.exports.Mink = Mink;
module.exports.gherkin = gherkin;

// ---- examples/support.js ----
const cucumber = require('@cucumber/cucumber');
const mink = require('cucumber-mink');

mink.gherkin(cucumber);

const driver = new mink.Mink({
  baseUrl: 'http://localhost:8080',
  viewport: {
    width: 1366,
    height: 768,
  },
});

driver.hook(cucumber);

```
---
# CONSTANTS 
```ts
// (none discovered in this repo)
```
---
# TASK — write the missing step definitions for this Gherkin feature
```gherkin
Feature: I can test cucumber-mink simulated action features

  Background:
    Given I browse "http://localhost:3000/"
    And I am on "/action"

  Scenario: Hover
    Then the ".hover-test .one" element should be visible
    And  the ".hover-test .two" element should not be visible
    When I hover ".hover-test" element
    Then the ".hover-test .one" element should not be visible
    And  the ".hover-test .two" element should be visible
```