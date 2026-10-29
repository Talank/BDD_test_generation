# Test case 20

## Gherkin scenario

```gherkin
Feature: I can use cucumber.mink to fill in forms

  Background:
    Given I browse "http://localhost:3000/"

  Scenario: I can check a checkbox
    Given I am on "/form"
    Then I should see "Form Page"
    Then the "#cb" checkbox should not be checked
    Then I check "#cb"
    Then the "#cb" checkbox should be checked
    Then I uncheck "#cb"
    Then the "#cb" checkbox should not be checked

  Scenario Outline: Multiple form submit
    Given I am on "/form"

    Then the "input[name='first_name']" field should be enabled
    Then the "input[name='disabled_input']" field should be disabled

    When I fill in "input[name='first_name']" with "<first_name>"
    And  I fill in the following:
      | input[name='last_name']   | <last_name> |
      | textarea[name='description'] | <description> |

    And I select "<country>" from "select[name='country']"
      Then the "select[name='country']" current option contain "<country>"

    And I <cbState> "#cb"
      Then the "input[name='first_name']" field should contain "<first_name>"
      Then the "input[name='first_name']" field should not contain "<last_name>"
    And I press "button[type='submit']"

    Then I should be on "/result"
      And I should see "<first_name>" in the "p.first-name" element
      And I should see "<last_name>" in the "p.last-name" element
      And I should see "<description>" in the "p.description" element
      And I should see "<countryVal>" in the "p.country" element
      And I should see "<cbBool>" in the "p.cb" element

  Examples:
    | first_name | last_name | description | country | countryVal | cbState | cbBool |
    | fn1        | ln1       | d1          | UK      | 3          | check   | true   |
    | fn2        | ln2       | d2          | Italy   | 1          | uncheck | false  |
    | fn3        | ln3       | d3          | USA     | 2          | uncheck | false  |

  Scenario Outline: Submit action shortcut
    Given I am on "/form"
    And   I submit "<selector>" form
    Then  I should be on "/result"

  Examples:
    | selector |
    | #register-form |
    | input[name='first_name'] |
    | select[name='country'] |
```

## Original test

```ts
// ---- src/step_definitions/action.js ----
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

  [/^(?:|I )press "([^"]*)"/, press],

  [/^(?:|I )submit "([^"]*)" form/, submit],

// ---- src/step_definitions/assert_dom.js ----
const seeText = function (expected) {
  return this.mink.html().then(html => {
    expect(html).to.contain(expected);
  });
};

const elementContainsText = function (expected, selector) {
  selector = this.mink.getSelector(selector);
  return this.mink.html(selector).then(html => {
    expect(html).to.contain(expected);
  });
};

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

  [/^(?:|I )should see "([^"]*)"$/, seeText],

  [
    /^(?:|I )should see "([^"]*)" in the "([^"]*)" element$/,
    elementContainsText,
  ],

  [/the "([^"]*)" (?:field|element) should be enabled$/, isDisabled(false)],

  [/the "([^"]*)" (?:field|element) should be disabled$/, isDisabled(true)],

  [/the "([^"]*)" checkbox should be checked$/, isChecked(true)],

  [/the "([^"]*)" checkbox should not be checked$/, isChecked(false)],

// ---- src/step_definitions/assert_form.js ----
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

  [/the "([^"]*)" current option contain "([^"]*)"/, currentOption],

  [/the "([^"]*)" field should contain "([^"]*)"/, fieldContains],

  [/the "([^"]*)" field should not contain "([^"]*)"/, fieldNotContains],

// ---- src/step_definitions/assert_url.js ----
const isEqual = function (location) {
  const parsed = url.parse(this.mink.page.url());
  expect([parsed.pathname, parsed.search].join('')).to.equal(location);
};

  [/^(?:|I )should be on "([^"]*)"/, isEqual],

// ---- src/step_definitions/form.js ----
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

  [/^(?:|I )fill in "([^"]*)" with "([^"]*)"/, fillField],

  [/^(?:|I )fill in the following:/, fillFieldsHash],

  [/^(?:|I )select "([^"]*)" from "([^"]*)"/, selectFrom],

  [/^(?:|I )check "([^"]*)"/, checkInput(true)],

  [/^(?:|I )uncheck "([^"]*)"/, checkInput(false)],

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
const cucumber = require('@cucumber/cucumber');

module.exports = function () {
  // UNMAPPED (missing DSL function): Given I browse "http://localhost:3000/"
  // UNMAPPED (missing DSL function): Given I am on "/form"
  // UNMAPPED: Then I should see "Form Page"
  // EXISTS: Then the "#cb" checkbox should not be checked
  // UNMAPPED (missing DSL function): Then I check "#cb"
  // EXISTS: Then the "#cb" checkbox should be checked
  // UNMAPPED (missing DSL function): Then I uncheck "#cb"

  // UNMAPPED (missing DSL function): Then the "input[name='first_name']" field should be enabled
  // UNMAPPED (missing DSL function): Then the "input[name='disabled_input']" field should be disabled
  // UNMAPPED (missing DSL function): When I fill in "input[name='first_name']" with "<first_name>"
  // UNMAPPED (missing DSL function): And I fill in the following:
  // UNMAPPED (missing DSL function): And I select "<country>" from "select[name='country']"
  // UNMAPPED (missing DSL function): Then the "select[name='country']" current option contain "<country>"
  // UNMAPPED (missing DSL function): And I <cbState> "#cb"
  // UNMAPPED (missing DSL function): Then the "input[name='first_name']" field should contain "<first_name>"
  // UNMAPPED (missing DSL function): Then the "input[name='first_name']" field should not contain "<last_name>"
  // UNMAPPED (missing DSL function): And I press "button[type='submit']"
  // UNMAPPED: Then I should be on "/result"
  // UNMAPPED: And I should see "<first_name>" in the "p.first-name" element
  // UNMAPPED: And I should see "<last_name>" in the "p.last-name" element
  // UNMAPPED: And I should see "<description>" in the "p.description" element
  // UNMAPPED: And I should see "<countryVal>" in the "p.country" element
  // UNMAPPED: And I should see "<cbBool>" in the "p.cb" element

  // UNMAPPED (missing DSL function): And I submit "<selector>" form
};
```
