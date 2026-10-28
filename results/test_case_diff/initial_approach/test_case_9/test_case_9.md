Test name - injecting-variables

## Original
```ts
// ---- source/apickli/apickli-gherkin.js ----
Given(/^I set (.*) header to (.*)$/, function(headerName, headerValue, callback) {
  this.apickli.addRequestHeader(headerName, headerValue);
  callback();
});

Given(/^I set headers to$/, function(headers, callback) {
  this.apickli.setHeaders(headers.hashes());
  callback();
});

Given(/^I set body to (.*)$/, function(bodyValue, callback) {
  this.apickli.setRequestBody(bodyValue);
  callback();
});

Given(/^I pipe contents of file (.*) to body$/, function(file, callback) {
  this.apickli.pipeFileContentsToRequestBody(file, function(error) {
    if (error) {
      callback(new Error(error));
    }

    callback();
  });
});

Given(/^I set query parameters to$/, function(queryParameters, callback) {
  this.apickli.setQueryParameters(queryParameters.hashes());
  callback();
});

Given(/^I have basic authentication credentials (.*) and (.*)$/, function(username, password, callback) {
  this.apickli.addHttpBasicAuthorizationHeader(username, password);
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

Then(/^response code should be (.*)$/, function(responseCode, callback) {
  const assertion = this.apickli.assertResponseCode(responseCode);
  callbackWithAssertion(callback, assertion);
});

Then(/^response code should not be (.*)$/, function(responseCode, callback) {
  const assertion = this.apickli.assertResponseCode(responseCode);
  assertion.success = !assertion.success;
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

Then(/^response body path (.*) should be of type array with length (.*)$/, function(path, length, callback) {
  const assertion = this.apickli.assertPathIsArrayWithLength(path, length);
  callbackWithAssertion(callback, assertion);
});

Then(/^response body should be valid according to schema file (.*)$/, function(schemaFile, callback) {
  this.apickli.validateResponseWithSchema(schemaFile, function(assertion) {
    callbackWithAssertion(callback, assertion);
  });
});

Then(/^I store the value of body path (.*) as access token$/, function(path, callback) {
  this.apickli.setAccessTokenFromResponseBodyPath(path);
  callback();
});

When(/^I set bearer token$/, function(callback) {
  this.apickli.setBearerToken();
  callback();
});

Given(/^I store the raw value (.*) as (.*) in scenario scope$/, function(value, variable, callback) {
  this.apickli.storeValueInScenarioScope(variable, value);
  callback();
});

```

## Generated
```ts
/* eslint new-cap: "off", no-invalid-this: "off" */

'use strict';

const {Given, When, Then} = require('@cucumber/cucumber');

Given(/^I store the raw value (.*) as (.*) in scenario scope$/, async function(value, variableName) {
  await this.apickli.storeValueInScenarioScope(variableName, value);
});

Given(/^I set (.*) header to (.*)$/, async function(header, value) {
  await this.apickli.setRequestHeader(header, value);
});

Given(/^I set headers to$/, async function(headersTable) {
  await this.apickli.setHeaders(headersTable.hashes());
});

Given(/^I set body to (.*)$/, async function(body) {
  await this.apickli.setRequestBody(body);
});

Given(/^I pipe contents of file (.*) to body$/, async function(file) {
  await new Promise((resolve, reject) => {
    this.apickli.pipeFileContentsToRequestBody(file, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

Given(/^I have basic authentication credentials (.*) and (.*)$/, async function(username, password) {
  await this.apickli.addHttpBasicAuthorizationHeader(username, password);
});

Given(/^I set bearer token$/, async function() {
  await this.apickli.setBearerToken();
});

Given(/^I set query parameters to$/, async function(queryParameters) {
  await this.apickli.setQueryParameters(queryParameters.hashes());
});

When(/^I GET (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.get(resource, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

When(/^I POST to (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.post(resource, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

Then(/^response code should be (\d+)$/, async function(responseCode) {
  const assertion = await this.apickli.assertResponseCode(responseCode);

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response code should not be (\d+)$/, async function(responseCode) {
  const assertion = await this.apickli.assertResponseCode(responseCode);

  if (assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response header (.*) should be (.*)$/, async function(header, expression) {
  const assertion = await this.apickli.assertHeaderValue(header, expression);

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response header (.*) should not be (.*)$/, async function(header, expression) {
  const assertion = await this.apickli.assertHeaderValue(header, expression);

  if (assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body should contain (.*)$/, async function(expression) {
  const assertion = await this.apickli.assertResponseBodyContainsExpression(expression);

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body should not contain (.*)$/, async function(expression) {
  const assertion = await this.apickli.assertResponseBodyContainsExpression(expression);

  if (assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body path (.*) should be (.*)$/, async function(path, regexp) {
  const assertion = await this.apickli.assertPathInResponseBodyMatchesExpression(path, regexp);

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body path (.*) should not be (.*)$/, async function(path, regexp) {
  const assertion = await this.apickli.assertPathInResponseBodyMatchesExpression(path, regexp);

  if (assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^I store the value of body path (.*) as access token$/, async function(path) {
  await this.apickli.setAccessTokenFromResponseBodyPath(path);
});

Then(/^response body path (.*) should be of type array with length (\d+)$/, async function(path, length) {
  const assertion = await this.apickli.assertPathIsArrayWithLength(path, length);

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body should be valid according to schema file (.*)$/, async function(schemaFile) {
  await new Promise((resolve, reject) => {
    this.apickli.validateResponseWithSchema(schemaFile, function(assertion) {
      if (assertion && assertion.success) {
        resolve();
      } else {
        reject(new Error(JSON.stringify(assertion)));
      }
    });
  });
});

// EXISTS: response body should be valid according to openapi description (.*) in file (.*)
```
