# Test case 5

## Gherkin scenario

```gherkin
@console
Feature:
    Httpbin.org exposes various resources for HTTP request testing
    As Httpbin client I want to verify that all API resources are working as they should

    Scenario: Test output - response code should be (.*)
        Given I set User-Agent header to apickli
        When I GET /get
        Then response code should be 400

    Scenario: Test output - response code should be (.*)
        Given I set User-Agent header to apickli
        When I GET /xml
        Then response code should be 400

    Scenario: Test output - response header (.*) should exist
        Given I set User-Agent header to apickli
        When I GET /get
        Then response header boo should exist

    Scenario: Test output - response header (.*) should not exist
        When I GET /get
        Then response header Content-Length should not exist

    Scenario: Test output - response header (.*) should be (.*)
        When I GET /get
        Then response header Content-Type should be foo

    Scenario: Test output - response header (.*) should not be (.*)
        When I GET /get
        Then response header Content-Type should not be application/json

    Scenario: Test output - response body path (.*) should be (.*)
        Given I set User-Agent header to apickli
        When I GET /get
        Then response body path $.headers.User-Agent should be foo

    Scenario: Test output - response header (.*) should not be (.*)
        Given I set User-Agent header to apickli
        When I GET /get
        Then response body path $.headers.User-Agent should not be apickli

    Scenario: Test output - response body should contain (.*)
        Given I set User-Agent header to apickli
        When I GET /get
        Then response body should contain foo

    Scenario: Test output - response body should not contain (.*)
        Given I set User-Agent header to apickli
        When I GET /get
        Then response body should not contain apickli

    Scenario: Test output - response body should be valid (xml|json)
        When I GET /get
        Then response body should be valid xml

    Scenario: Test output - response body should be valid (xml|json)
        When I GET /xml
        Then response body should be valid json

    Scenario: should successfully validate json using schema
        When I GET /headers
        Then response body should be valid according to schema file ./test/features/fixtures/get-simple.schema

    Scenario: should successfully validate json array
        Given I set body to ["a","b","c"]
        When I POST to /post
        And response body path $.headers.Host should be of type array

    Scenario: should successfully validate json array length
        Given I set body to ["a","b","c"]
        When I POST to /post
        And response body path $.json should be of type array with length 2
```

## Original test

```ts
Original:
// ---- source/apickli/apickli-gherkin.js ----
Given(/^I set (.*) header to (.*)$/, function(headerName, headerValue, callback) {
  this.apickli.addRequestHeader(headerName, headerValue);
  callback();
});

Given(/^I set body to (.*)$/, function(bodyValue, callback) {
  this.apickli.setRequestBody(bodyValue);
  callback();
});

When(/^I GET (.*)$/, function(resource, callback) {
  this.apickli.get(resource, function(error, response) {
    if (error) {
      callback(new Error(error));
    }

    callback();
  });
});

When(/^I POST to (.*)$/, function(resource, callback) {
  this.apickli.post(resource, function(error, response) {
    if (error) {
      callback(new Error(error));
    }

    callback();
  });
});

Then(/^response header (.*) should exist$/, function(header, callback) {
  const assertion = this.apickli.assertResponseContainsHeader(header);
  callbackWithAssertion(callback, assertion);
});

Then(/^response header (.*) should not exist$/, function(header, callback) {
  const assertion = this.apickli.assertResponseContainsHeader(header);
  assertion.success = !assertion.success;
  callbackWithAssertion(callback, assertion);
});

Then(/^response body should be valid (xml|json)$/, function(contentType, callback) {
  const assertion = this.apickli.assertResponseBodyContentType(contentType);
  callbackWithAssertion(callback, assertion);
});

Then(/^response code should be (.*)$/, function(responseCode, callback) {
  const assertion = this.apickli.assertResponseCode(responseCode);
  callbackWithAssertion(callback, assertion);
});

Then(/^response header (.*) should be (.*)$/, function(header, expression, callback) {
  const assertion = this.apickli.assertHeaderValue(header, expression);
  callbackWithAssertion(callback, assertion);
});

Then(/^response header (.*) should not be (.*)$/, function(header, expression, callback) {
  const assertion = this.apickli.assertHeaderValue(header, expression);
  assertion.success = !assertion.success;
  callbackWithAssertion(callback, assertion);
});

Then(/^response body should contain (.*)$/, function(expression, callback) {
  const assertion = this.apickli.assertResponseBodyContainsExpression(expression);
  callbackWithAssertion(callback, assertion);
});

Then(/^response body should not contain (.*)$/, function(expression, callback) {
  const assertion = this.apickli.assertResponseBodyContainsExpression(expression);
  assertion.success = !assertion.success;
  callbackWithAssertion(callback, assertion);
});

Then(/^response body path (.*) should be (((?!of type).*))$/, function(path, value, callback) {
  const assertion = this.apickli.assertPathInResponseBodyMatchesExpression(path, value);
  callbackWithAssertion(callback, assertion);
});

Then(/^response body path (.*) should not be (((?!of type).+))$/, function(path, value, callback) {
  const assertion = this.apickli.assertPathInResponseBodyMatchesExpression(path, value);
  assertion.success = !assertion.success;
  callbackWithAssertion(callback, assertion);
});

Then(/^response body path (.*) should be of type array$/, function(path, callback) {
  const assertion = this.apickli.assertPathIsArray(path);
  callbackWithAssertion(callback, assertion);
});

Then(/^response body path (.*) should be of type array with length (.*)$/, function(path, length, callback) {
  const assertion = this.apickli.assertPathIsArrayWithLength(path, length);
  callbackWithAssertion(callback, assertion);
});

Then(/^response body should be valid according to schema file (.*)$/, function(schemaFile, callback) {
  this.apickli.validateResponseWithSchema(schemaFile, function(assertion) {
    callbackWithAssertion(callback, assertion);
  });
});

```

## Generated test

```ts
'use strict';

const {Given, When, Then} = require('@cucumber/cucumber');

const callbackWithAssertion = function(callback, assertion) {
  if (assertion.success) {
    callback();
  } else {
    callback(new Error(JSON.stringify(assertion)));
  }
};

Given(/^I set (.*) header to (.*)$/, async function(header, value) {
  await this.apickli.setRequestHeader(header, value);
});

When(/^I GET (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.get(resource, function(error) {
      if (error) {
        reject(new Error(error));
      } else {
        resolve();
      }
    });
  });
});

Then(/^response code should be (.*)$/, async function(responseCode) {
  const assertion = await this.apickli.assertResponseCode(responseCode);
  callbackWithAssertion(this, assertion);
});

Then(/^response header (.*) should exist$/, async function(header) {
  const assertion = await this.apickli.assertResponseContainsHeader(header);
  callbackWithAssertion(this, assertion);
});

Then(/^response header (.*) should not exist$/, async function(header) {
  const assertion = await this.apickli.assertResponseDoesNotContainHeader(header);
  callbackWithAssertion(this, assertion);
});

Then(/^response header (.*) should be (.*)$/, async function(header, expression) {
  const assertion = await this.apickli.assertHeaderValue(header, expression);
  callbackWithAssertion(this, assertion);
});

Then(/^response header (.*) should not be (.*)$/, async function(header, expression) {
  const assertion = await this.apickli.assertHeaderValue(header, expression);
  assertion.success = !assertion.success;
  callbackWithAssertion(this, assertion);
});

Then(/^response body path (.*) should be (.*)$/, async function(path, expression) {
  const assertion = await this.apickli.assertPathInResponseBodyMatchesExpression(path, expression);
  callbackWithAssertion(this, assertion);
});

Then(/^response body path (.*) should not be (.*)$/, async function(path, expression) {
  const assertion = await this.apickli.assertPathInResponseBodyMatchesExpression(path, expression);
  assertion.success = !assertion.success;
  callbackWithAssertion(this, assertion);
});

Then(/^response body should contain (.*)$/, async function(expression) {
  const assertion = await this.apickli.assertResponseBodyContainsExpression(expression);
  callbackWithAssertion(this, assertion);
});

Then(/^response body should not contain (.*)$/, async function(expression) {
  const assertion = await this.apickli.assertResponseBodyContainsExpression(expression);
  assertion.success = !assertion.success;
  callbackWithAssertion(this, assertion);
});

Then(/^response body should be valid (word)$/, async function(contentType) {
  const assertion = await this.apickli.assertResponseBodyContentType(contentType);
  callbackWithAssertion(this, assertion);
});

Then(/^response body should be valid according to schema file (.*)$/, async function(schemaFile) {
  await new Promise((resolve, reject) => {
    this.apickli.validateResponseWithSchema(schemaFile, function(assertion) {
      if (assertion.success) {
        resolve();
      } else {
        reject(new Error(JSON.stringify(assertion)));
      }
    });
  });
});

Given(/^I set body to (.*)$/, async function(body) {
  await this.apickli.setRequestBody(body);
});

When(/^I POST to (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.post(resource, function(error) {
      if (error) {
        reject(new Error(error));
      } else {
        resolve();
      }
    });
  });
});

Then(/^response body path (.*) should be of type array$/, async function(path) {
  const assertion = await this.apickli.assertPathIsArray(path);
  callbackWithAssertion(this, assertion);
});

Then(/^response body path (.*) should be of type array with length (.*)$/, async function(path, length) {
  const assertion = await this.apickli.assertPathIsArrayWithLength(path, length);
  callbackWithAssertion(this, assertion);
});
```
