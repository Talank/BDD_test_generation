# Test case 18

## Gherkin scenario

```gherkin
Feature: I can use cucumber.mink to navigate through my website

  Background:
    Given I browse "http://localhost:3000/"

  Scenario: Assert url
    Given I am on "/post/2"
    Then  I should be on "/post/2"

  Scenario: Assert url with query
    Given I am on "/post/2?search=foo"
    Then  I should be on "/post/2?search=foo"

  Scenario: Url matching
    Given I am on "/post/2?search=foo"
    Then  the url should match post.\d

  Scenario: Url pattern matching
    Given I am on "/post/2?search=foo"
    Then  the url parameter should match search=fo+
```

## Original test

```ts
// ---- src/step_definitions/assert_url.js ----
const isEqual = function (location) {
  const parsed = url.parse(this.mink.page.url());
  expect([parsed.pathname, parsed.search].join('')).to.equal(location);
};

const urlMatch = function (regex) {
  const parsed = url.parse(this.mink.page.url());
  expect(parsed.pathname).to.match(new RegExp(regex));
};

const queryMatch = function (regex) {
  const parsed = url.parse(this.mink.page.url());
  expect(parsed.search).to.match(new RegExp(regex));
};

  [/^(?:|I )should be on "([^"]*)"/, isEqual],

  [/the url should match (.+)/, urlMatch],

  [/the url parameter should match (.+)/, queryMatch],

// ---- src/step_definitions/navigation.js ----
const setBaseURL = function (location) {
  const finalLocation = parseUrlWithEnv(location);
  if (!isAbsoluteUrl(finalLocation)) {
    throw new Error(Errors.NAVIGATION.BASE_URL);
  }
  this.mink.config.baseUrl = finalLocation;
};

const goTo = function (location) {
  let finalLocation = location;
  if (!isAbsoluteUrl(location) && this.mink.config.baseUrl) {
    finalLocation = url.resolve(this.mink.config.baseUrl, location);
  }
  return this.mink.page.goto(finalLocation);
};

  [/^(?:|I )browse "([^"]*)"/, setBaseURL],

  [/^(?:|I )am on "([^"]*)"/, goTo],

```

## Generated test

```ts
const { Given, Then } = require('@cucumber/cucumber');

Given('I browse "{string}"', async function (url) {
  // UNMAPPED: I browse "[http://localhost:3000/](http://localhost:3000/)"
});

Given('I am on "{string}"', async function (path) {
  // UNMAPPED: I am on "/post/2"
});

Then('I should be on "{string}"', async function (path) {
  // UNMAPPED: I should be on "/post/2"
});

Then('the url should match {word}', async function (pattern) {
  // UNMAPPED: the url should match post.\d
});

Then('the url parameter should match {word}', async function (pattern) {
  // UNMAPPED: the url parameter should match search=fo+
});
```
