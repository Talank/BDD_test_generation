# Test case 16

## Gherkin scenario

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

## Original test

```ts
// ---- src/step_definitions/action.js ----
const hover = function (selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.page.hover(selector);
};

  [/^(?:|I )hover "([^"]*)" element/, hover],

// ---- src/step_definitions/assert_dom.js ----
const isVisible = waitForSelector(true);

const isNotVisible = waitForSelector(false, true);

  [/the "([^"]*)" element should be visible$/, isVisible],

  [/the "([^"]*)" element should not be visible$/, isNotVisible],

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
const { Given, When, Then } = require('@cucumber/cucumber');

// UNMAPPED: I browse "http://localhost:3000/"

// UNMAPPED: I am on "/action"

// UNMAPPED: the ".hover-test .one" element should be visible

// UNMAPPED: the ".hover-test .two" element should not be visible

// UNMAPPED: I hover ".hover-test" element

// UNMAPPED: the ".hover-test .one" element should not be visible

// UNMAPPED: the ".hover-test .two" element should be visible
```
