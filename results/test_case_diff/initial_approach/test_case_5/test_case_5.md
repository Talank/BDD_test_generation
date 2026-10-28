test name - tag parameters

## Original
```ts
Original:
// ---- source/apickli/apickli-gherkin.js ----
Given(/^I set (.*) header to (.*)$/, function(headerName, headerValue, callback) {
  this.apickli.addRequestHeader(headerName, headerValue);
  callback();
});

Given(/^I set cookie to (.*)$/, function(cookie, callback) {
  this.apickli.addCookie(cookie);
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

Given(/^I set form parameters to$/, function(formParameters, callback) {
  this.apickli.setFormParameters(formParameters.hashes());
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

When(/^I PUT (.*)$/, function(resource, callback) {
  this.apickli.put(resource, function(error, response) {
    if (error) {
      callback(new Error(error));
    }

    callback();
  });
});

When(/^I DELETE (.*)$/, function(resource, callback) {
  this.apickli.delete(resource, function(error, response) {
    if (error) {
      callback(new Error(error));
    }

    callback();
  });
});

When(/^I PATCH (.*)$/, function(resource, callback) {
  this.apickli.patch(resource, function(error, response) {
    if (error) {
      callback(new Error(error));
    }

    callback();
  });
});

When(/^I request OPTIONS for (.*)$/, function(resource, callback) {
  this.apickli.options(resource, function(error, response) {
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

Then(/^response body should be valid according to openapi description (.*) in file (.*)$/, function(definitionName, swaggerSpecFile, callback) {
  this.apickli.validateResponseWithSwaggerSpecDefinition(definitionName, swaggerSpecFile, function(assertion) {
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

Then(/^I store the value of response header (.*) as (.*) in scenario scope$/, function(name, variable, callback) {
  this.apickli.storeValueOfHeaderInScenarioScope(name, variable);
  callback();
});

Then(/^I store the value of body path (.*) as (.*) in scenario scope$/, function(path, variable, callback) {
  this.apickli.storeValueOfResponseBodyPathInScenarioScope(path, variable);
  callback();
});

Then(/^value of scenario variable (.*) should be (.*)$/, function(variableName, variableValue, callback) {
  if (this.apickli.assertScenarioVariableValue(variableName, variableValue)) {
    callback();
  } else {
    callback(new Error('value of variable ' + variableName + ' isn\'t equal to ' + variableValue));
  }
});

```

## Generated
```ts
'use strict';

const {Given, When, Then} = require('@cucumber/cucumber');

Given(/^I set (.+) header to (.*)$/, async function(headerName, value) {
  await this.apickli.addRequestHeader(headerName, value);
});

Given(/^I set headers to$/, async function(table) {
  await this.apickli.setHeaders(table.hashes());
});

Given(/^I set cookie to (.*)$/, async function(cookie) {
  await this.apickli.addCookie(cookie);
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

Given(/^I have basic authentication credentials (.+) and (.+)$/, async function(username, password) {
  await this.apickli.addHttpBasicAuthorizationHeader(username, password);
});

Given(/^I set bearer token$/, async function() {
  await this.apickli.setBearerToken();
});

Given(/^I set query parameters to$/, async function(table) {
  await this.apickli.setQueryParameters(table.hashes());
});

Given(/^I set form parameters to$/, async function(table) {
  await this.apickli.setFormParameters(table.hashes());
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

When(/^I PUT (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.put(resource, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

When(/^I DELETE (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.delete(resource, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

When(/^I PATCH (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.patch(resource, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

When(/^I request OPTIONS for (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.options(resource, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

Then(/^response body path (.*) should be (.*)$/, async function(path, expression) {
  const assertion = await this.apickli.assertPathInResponseBodyMatchesExpression(path, expression);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body path (.*) should not be (.*)$/, async function(path, expression) {
  const assertion = await this.apickli.assertPathInResponseBodyMatchesExpression(path, expression);
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

Then(/^response body should be valid (json|xml)$/, async function(contentType) {
  const assertion = await this.apickli.assertResponseBodyContentType(contentType);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response header (.*) should exist$/, async function(header) {
  const assertion = await this.apickli.assertResponseContainsHeader(header);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response header (.*) should not exist$/, async function(header) {
  const assertion = await this.apickli.assertResponseDoesNotContainHeader(header);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response code should be (.*)$/, async function(responseCode) {
  const assertion = await this.apickli.assertResponseCode(responseCode);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response code should not be (.*)$/, async function(responseCode) {
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

Then(/^I store the value of body path (.*) as (.*) in scenario scope$/, async function(path, variableName) {
  await this.apickli.storeValueOfResponseBodyPathInScenarioScope(path, variableName);
});

Then(/^I store the value of response header (.*) as (.*) in scenario scope$/, async function(headerName, variableName) {
  await this.apickli.storeValueOfHeaderInScenarioScope(headerName, variableName);
});

Then(/^I store the value of body path (.*) as access token$/, async function(path) {
  await this.apickli.setAccessTokenFromResponseBodyPath(path);
});

Then(/^value of scenario variable (.*) should be (.*)$/, async function(variable, value) {
  const assertion = await this.apickli.assertScenarioVariableValue(variable, value);
  if (!assertion) {
    throw new Error('Scenario variable assertion failed');
  }
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

Then(/^response body should be valid according to openapi description (.*) in file (.*)$/, async function(definitionName, swaggerSpecFile) {
  await new Promise((resolve, reject) => {
    this.apickli.validateResponseWithSwaggerSpecDefinition(definitionName, swaggerSpecFile, function(assertion) {
      if (assertion.success) {
        resolve();
      } else {
        reject(new Error(JSON.stringify(assertion)));
      }
    });
  });
});

Then(/^response body path (.*) should be of type array$/, async function(path) {
  const assertion = await this.apickli.assertPathIsArray(path);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});

Then(/^response body path (.*) should be of type array with length (.*)$/, async function(path, length) {
  const assertion = await this.apickli.assertPathIsArrayWithLength(path, length);
  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});
```

