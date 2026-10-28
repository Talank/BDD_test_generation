test name - compatiblity

## Original
```ts
// ---- src/step_definitions/action.js ----
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

  [/^(?:|I )press "([^"]*)"/, press],

  [/^(?:|I )follow "([^"]*)"/, follow],

// ---- src/step_definitions/assert_dom.js ----
const seeText = function (expected) {
  return this.mink.html().then(html => {
    expect(html).to.contain(expected);
  });
};

  [/^(?:|I )should see "([^"]*)"$/, seeText],

// ---- src/step_definitions/assert_url.js ----
const isEqual = function (location) {
  const parsed = url.parse(this.mink.page.url());
  expect([parsed.pathname, parsed.search].join('')).to.equal(location);
};

  [/^(?:|I )should be on "([^"]*)"/, isEqual],

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

## Generated
```ts
// UNMAPPED (missing DSL function): Given I browse "http://localhost:3000/"

// UNMAPPED (missing DSL function): Given I am on homepage

// UNMAPPED (missing DSL function): And I follow "Post-1"
// UNMAPPED (missing DSL function): And I follow "a[href='/post/1']"
// UNMAPPED (missing DSL function): And I follow "Follow me to form !"
// UNMAPPED (missing DSL function): And I follow "Follow me to form"

// UNMAPPED (missing DSL function): Then I should be on "/post/1"
// UNMAPPED (missing DSL function): Then I should be on "/form"
// UNMAPPED (missing DSL function): And I should see "Post-1"
// UNMAPPED (missing DSL function): And I should see "Form Page"

// UNMAPPED (missing DSL function): Given I am on "/form"

// UNMAPPED (missing DSL function): And I press "Button-Register"
// UNMAPPED (missing DSL function): And I press "Input-Register"
// UNMAPPED (missing DSL function): And I press "button.pure-button"
// UNMAPPED (missing DSL function): And I press "Weird button '-' text"

// UNMAPPED (missing DSL function): Then I should be on "/result"
```

