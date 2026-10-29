# Test case 17

## Gherkin scenario

```gherkin
Feature: I can use cucumber.mink to check the content of my website

  Background:
    Given I browse "http://localhost:3000/"

  Scenario: Check Homepage content
    Given I am on the homepage
    Then I should see "Home Page"
      And I should not see "Post Detail Page"
      And I should see text matching Post-\d+
      And I should not see text matching .+_@_.+
      And I should see "Home Page" in the "h1" element
      And I should see "Home Page" in the "h1" element text
      And I should not see "Post Detail Page" in the "h1" element
      And I should not see "Post Detail Page" in the "h1" element text
      And I should see an "h2.content-subhead" element
      And the "p.description" element should not exist
      And I should see 3 "section.post" elements

  Scenario Outline: Check Generated content
    Given I am on "<path>"
    Then I should see <count> "section.post" elements

  Examples:
    | path         | count |
    | /generate/7  | 7     |
    | /generate/30 | 30    |
```

## Original test

```ts
// ---- src/step_definitions/assert_dom.js ----
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

const isNotExisting = waitForSelector(false, true);

const isVisible = waitForSelector(true);

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

  [/the "([^"]*)" element should not exist$/, isNotExisting],

// ---- src/step_definitions/navigation.js ----
const setBaseURL = function (location) {
  const finalLocation = parseUrlWithEnv(location);
  if (!isAbsoluteUrl(finalLocation)) {
    throw new Error(Errors.NAVIGATION.BASE_URL);
  }
  this.mink.config.baseUrl = finalLocation;
};

const goRoot = function () {
  if (!this.mink.config.baseUrl) {
    throw new Error(Errors.NAVIGATION.ROOT);
  }
  return this.mink.page.goto(this.mink.config.baseUrl);
};

const goTo = function (location) {
  let finalLocation = location;
  if (!isAbsoluteUrl(location) && this.mink.config.baseUrl) {
    finalLocation = url.resolve(this.mink.config.baseUrl, location);
  }
  return this.mink.page.goto(finalLocation);
};

  [/^(?:|I )browse "([^"]*)"/, setBaseURL],

  [/^(?:|I )am on (?:|the )homepage/, goRoot],

  [/^(?:|I )am on "([^"]*)"/, goTo],

```

## Generated test

```ts
const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('I browse "{string}"', async function (url) {
  await this.mink.page.goto(url);
});

Given('I am on the homepage', async function () {
  await this.mink.page.goto('/');
});

Given('I am on "{string}"', async function (path) {
  await this.mink.page.goto(path);
});

Then('I should see "{string}"', async function (text) {
  expect(this.mink.text('body')).to.contain(text);
});

Then('I should not see "{string}"', async function (text) {
  expect(this.mink.text('body')).to.not.contain(text);
});

Then('I should see text matching {word}', async function (pattern) {
  expect(this.mink.text('body')).to.match(new RegExp(pattern));
});

Then('I should not see text matching {word}', async function (pattern) {
  expect(this.mink.text('body')).to.not.match(new RegExp(pattern));
});

Then('I should see "{string}" in the "{string}" element', async function (
  text,
  selector,
) {
  expect(this.mink.text(selector)).to.contain(text);
});

Then('I should see "{string}" in the "{string}" element text', async function (
  text,
  selector,
) {
  expect(this.mink.text(selector)).to.contain(text);
});

Then('I should not see "{string}" in the "{string}" element', async function (
  text,
  selector,
) {
  expect(this.mink.text(selector)).to.not.contain(text);
});

Then('I should not see "{string}" in the "{string}" element text', async function (
  text,
  selector,
) {
  expect(this.mink.text(selector)).to.not.contain(text);
});

Then('I should see an "{string}" element', async function (selector) {
  expect(this.mink.count(selector)).to.be.greaterThan(0);
});

Then('the "{string}" element should not exist', async function (selector) {
  expect(this.mink.count(selector)).to.equal(0);
});

Then('I should see {int} "{string}" elements', async function (count, selector) {
  expect(this.mink.count(selector)).to.equal(count);
});
```
