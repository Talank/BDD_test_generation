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
// source/apickli/apickli.js
//   - Apickli(scheme, domain, fixturesDirectory, variableChar)
//   - base64Encode(str)
//   - getContentType(content)
//   - evaluateJsonPath(path, content)
//   - evaluateXPath(path, content)
//   - evaluatePath(path, content)
//   - getAssertionResult(success, expected, actual, apickliInstance)
//   - Apickli#addRequestHeader(name, value)
//   - Apickli#removeRequestHeader(name)
//   - Apickli#setClientTLSConfiguration(configurationName, callback)
//   - Apickli#setRequestHeader(name, value)
//   - Apickli#getResponseObject()
//   - Apickli#addCookie(cookie)
//   - Apickli#setRequestBody(body)
//   - Apickli#setQueryParameters(queryParameters)
//   - Apickli#setFormParameters(formParameters)
//   - Apickli#setHeaders(headersTable)
//   - Apickli#pipeFileContentsToRequestBody(file, callback)
//   - Apickli#get(resource, callback)
//   - Apickli#post(resource, callback)
//   - Apickli#put(resource, callback)
//   - Apickli#delete(resource, callback)
//   - Apickli#patch(resource, callback)
//   - Apickli#options(resource, callback)
//   - Apickli#addHttpBasicAuthorizationHeader(username, password)
//   - Apickli#assertResponseCode(responseCode)
//   - Apickli#assertResponseDoesNotContainHeader(header, callback)
//   - Apickli#assertResponseContainsHeader(header, callback)
//   - Apickli#assertHeaderValue(header, expression)
//   - Apickli#assertPathInResponseBodyMatchesExpression(path, regexp)
//   - Apickli#assertResponseBodyContainsExpression(expression)
//   - Apickli#assertResponseBodyContentType(contentType)
//   - Apickli#assertPathIsArray(path)
//   - Apickli#assertPathIsArrayWithLength(path, length)
//   - Apickli#evaluatePathInResponseBody(path)
//   - Apickli#setAccessToken(token)
//   - Apickli#unsetAccessToken()
//   - Apickli#getAccessTokenFromResponseBodyPath(path)
//   - Apickli#setAccessTokenFromResponseBodyPath(path)
//   - Apickli#setBearerToken()
//   - Apickli#storeValueInScenarioScope(variableName, value)
//   - Apickli#storeValueOfHeaderInScenarioScope(header, variableName)
//   - Apickli#storeValueOfResponseBodyPathInScenarioScope(path, variableName)
//   - Apickli#assertScenarioVariableValue(variable, value)
//   - Apickli#storeValueOfHeaderInGlobalScope(headerName, variableName)
//   - Apickli#storeValueOfResponseBodyPathInGlobalScope(path, variableName)
//   - Apickli#setGlobalVariable(name, value)
//   - Apickli#getGlobalVariable(name)
//   - Apickli#validateResponseWithSchema(schemaFile, callback)
//   - Apickli#validateResponseWithSwaggerSpecDefinition(definitionName, swaggerSpecFile, callback)
//   - Apickli#replaceVariables(resource, scope, variableChar, offset)
//   - Apickli#sendRequest(method, resource, callback)

// ---- source/apickli/apickli.js ----
'use strict';

const request = require('request');
const {JSONPath: jsonPath} = require('jsonpath-plus');
const select = require('xpath.js');
const Dom = require('@xmldom/xmldom').DOMParser;
const fs = require('fs');
const path = require('path');
const jsonSchemaValidator = require('is-my-json-valid');
const spec = require('swagger-tools').specs.v2;

let accessToken;
const globalVariables = {};
const _xmlAttributeNodeType = 2;

const base64Encode = function(str) {
  return Buffer.from(str).toString('base64');
};

const getContentType = function(content) {
  try {
    JSON.parse(content);
    return 'json';
  } catch (e) {
    try {
      new Dom().parseFromString(content, 'text/xml');
      return 'xml';
    } catch (e) {
      return null;
    }
  }
};

const evaluateJsonPath = function(path, content) {
  const contentJson = JSON.parse(content);
  const evalResult = jsonPath(path, contentJson);
  return (evalResult.length > 0) ? evalResult[0] : null;
};

const evaluateXPath = function(path, content) {
  const xmlDocument = new Dom().parseFromString(content, 'text/xml');
  const node = select(xmlDocument, path)[0];
  if (node.nodeType === _xmlAttributeNodeType) {
    return node.value;
  }

  return node.firstChild.data; // element or comment
};

const evaluatePath = function(path, content) {
  const contentType = getContentType(content);

  switch (contentType) {
    case 'json':
      return evaluateJsonPath(path, content);
    case 'xml':
      return evaluateXPath(path, content);
    default:
      return null;
  }
};

const getAssertionResult = function(success, expected, actual, apickliInstance) {
  return {
    success,
    expected,
    actual,
    response: {
      statusCode: apickliInstance.getResponseObject().statusCode,
      headers: apickliInstance.getResponseObject().headers,
      body: apickliInstance.getResponseObject().body,
    },
  };
};

function Apickli(scheme, domain, fixturesDirectory, variableChar) {
  this.domain = scheme + '://' + domain;
  this.headers = {};
  this.cookies = [];
  this.httpResponse = {};
  this.requestBody = '';
  this.scenarioVariables = {};
  this.fixturesDirectory = (fixturesDirectory ? fixturesDirectory : '');
  this.queryParameters = {};
  this.formParameters = {};
  this.httpRequestOptions = {};
  this.clientTLSConfig = {};
  this.selectedClientTLSConfig = '';
  this.variableChar = (variableChar ? variableChar : '`');
}

Apickli.prototype.addRequestHeader = function(name, value) {
  name = this.replaceVariables(name);
  value = this.replaceVariables(value);

  let valuesArray = [];
  if (this.headers[name]) {
    valuesArray = this.headers[name].split(',');
  }
  valuesArray.push(value);

  this.headers[name] = valuesArray.join(',');
};

Apickli.prototype.removeRequestHeader = function(name) {
  name = this.replaceVariables(name);
  delete this.headers[name];
};

Apickli.prototype.setClientTLSConfiguration = function(configurationName, callback) {
  if (!Object.prototype.hasOwnProperty.call(this.clientTLSConfig, configurationName)) {
    callback('Client TLS Configuration ' + configurationName + ' does not exist.');
  } else {
    this.selectedClientTLSConfig = configurationName;
    callback();
  }
};

Apickli.prototype.setRequestHeader = function(name, value) {
  this.removeRequestHeader(name);

  name = this.replaceVariables(name);
  value = this.replaceVariables(value);
  this.addRequestHeader(name, value);
};

Apickli.prototype.getResponseObject = function() {
  return this.httpResponse;
};

Apickli.prototype.addCookie = function(cookie) {
  cookie = this.replaceVariables(cookie);
  this.cookies.push(cookie);
};

Apickli.prototype.setRequestBody = function(body) {
  body = this.replaceVariables(body);
  this.requestBody = body;
};

Apickli.prototype.setQueryParameters = function(queryParameters) {
  const self = this;
  const paramsObject = {};

  queryParameters.forEach(function(q) {
    const queryParameterName = self.replaceVariables(q.parameter);
    const queryParameterValue = self.replaceVariables(q.value);
    paramsObject[queryParameterName] = queryParameterValue;
  });

  this.queryParameters = paramsObject;
};

Apickli.prototype.setFormParameters = function(formParameters) {
  const self = this;
  const paramsObject = {};

  formParameters.forEach(function(f) {
    const formParameterName = self.replaceVariables(f.parameter);
    const formParameterValue = self.replaceVariables(f.value);
    paramsObject[formParameterName] = formParameterValue;
  });

  this.formParameters = paramsObject;
};

Apickli.prototype.setHeaders = function(headersTable) {
  const self = this;

  headersTable.forEach(function(h) {
    const headerName = self.replaceVariables(h.name);
    const headerValue = self.replaceVariables(h.value);
    self.addRequestHeader(headerName, headerValue);
  });
};

Apickli.prototype.pipeFileContentsToRequestBody = function(file, callback) {
  const self = this;
  file = this.replaceVariables(file);
  fs.readFile(path.join(this.fixturesDirectory, file), 'utf8', function(err, data) {
    if (err) {
      callback(err);
    } else {
      self.setRequestBody(data);
      callback();
    }
  });
};

Apickli.prototype.get = function(resource, callback) { // callback(error, response)
  resource = this.replaceVariables(resource);
  this.sendRequest('GET', resource, callback);
};

Apickli.prototype.post = function(resource, callback) { // callback(error, response)
  resource = this.replaceVariables(resource);
  this.sendRequest('POST', resource, callback);
};

Apickli.prototype.put = function(resource, callback) { // callback(error, response)
  resource = this.replaceVariables(resource);
  this.sendRequest('PUT', resource, callback);
};

Apickli.prototype.delete = function(resource, callback) { // callback(error, response)
  resource = this.replaceVariables(resource);
  this.sendRequest('DELETE', resource, callback);
};

Apickli.prototype.patch = function(resource, callback) { // callback(error, response)
  resource = this.replaceVariables(resource);
  this.sendRequest('PATCH', resource, callback);
};

Apickli.prototype.options = function(resource, callback) { // callback(error, response)
  resource = this.replaceVariables(resource);
  this.sendRequest('OPTIONS', resource, callback);
};

Apickli.prototype.addHttpBasicAuthorizationHeader = function(username, password) {
  username = this.replaceVariables(username);
  password = this.replaceVariables(password);
  const b64EncodedValue = base64Encode(username + ':' + password);
  this.removeRequestHeader('Authorization');
  this.addRequestHeader('Authorization', 'Basic ' + b64EncodedValue);
};

Apickli.prototype.assertResponseCode = function(responseCode) {
  responseCode = this.replaceVariables(responseCode);
  const realResponseCode = this.getResponseObject().statusCode.toString();
  const success = (realResponseCode === responseCode);
  return getAssertionResult(success, responseCode, realResponseCode, this);
};

Apickli.prototype.assertResponseDoesNotContainHeader = function(header, callback) {
  header = this.replaceVariables(header);
  const success = typeof this.getResponseObject().headers[header.toLowerCase()] == 'undefined';
  return getAssertionResult(success, true, false, this);
};

Apickli.prototype.assertResponseContainsHeader = function(header, callback) {
  header = this.replaceVariables(header);
  const success = typeof this.getResponseObject().headers[header.toLowerCase()] != 'undefined';
  return getAssertionResult(success, true, false, this);
};

Apickli.prototype.assertHeaderValue = function(header, expression) {
  header = this.replaceVariables(header);
  expression = this.replaceVariables(expression);
  const realHeaderValue = this.getResponseObject().headers[header.toLowerCase()];
  const regex = new RegExp(expression);
  const success = (regex.test(realHeaderValue));
  return getAssertionResult(success, expression, realHeaderValue, this);
};

Apickli.prototype.assertPathInResponseBodyMatchesExpression = function(path, regexp) {
  path = this.replaceVariables(path);
  regexp = this.replaceVariables(regexp);
  const regExpObject = new RegExp(regexp);
  const evalValue = evaluatePath(path, this.getResponseObject().body);
  const success = regExpObject.test(evalValue);
  return getAssertionResult(success, regexp, evalValue, this);
};

Apickli.prototype.assertResponseBodyContainsExpression = function(expression) {
  expression = this.replaceVariables(expression);
  const regex = new RegExp(expression);
  const success = regex.test(this.getResponseObject().body);
  return getAssertionResult(success, expression, null, this);
};

Apickli.prototype.assertResponseBodyContentType = function(contentType) {
  contentType = this.replaceVariables(contentType);
  const realContentType = getContentType(this.getResponseObject().body);
  const success = (realContentType === contentType);
  return getAssertionResult(success, contentType, realContentType, this);
};

Apickli.prototype.assertPathIsArray = function(path) {
  path = this.replaceVariables(path);
  const value = evaluatePath(path, this.getResponseObject().body);
  const success = Array.isArray(value);
  return getAssertionResult(success, 'array', typeof value, this);
};

Apickli.prototype.assertPathIsArrayWithLength = function(path, length) {
  path = this.replaceVariables(path);
  length = this.replaceVariables(length);
  let success = false;
  let actual = '?';
  const value = evaluatePath(path, this.getResponseObject().body);
  if (Array.isArray(value)) {
    success = value.length.toString() === length;
    actual = value.length;
  }

  return getAssertionResult(success, length, actual, this);
};

Apickli.prototype.evaluatePathInResponseBody = function(path) {
  path = this.replaceVariables(path);
  return evaluatePath(path, this.getResponseObject().body);
};

Apickli.prototype.setAccessToken = function(token) {
  accessToken = token;
};

Apickli.prototype.unsetAccessToken = function() {
  accessToken = undefined;
};

Apickli.prototype.getAccessTokenFromResponseBodyPath = function(path) {
  path = this.replaceVariables(path);
  return evaluatePath(path, this.getResponseObject().body);
};

Apickli.prototype.setAccessTokenFromResponseBodyPath = function(path) {
  this.setAccessToken(this.getAccessTokenFromResponseBodyPath(path));
};

Apickli.prototype.setBearerToken = function() {
  if (accessToken) {
    this.removeRequestHeader('Authorization');
    return this.addRequestHeader('Authorization', 'Bearer ' + accessToken);
  } else {
    return false;
  }
};

Apickli.prototype.storeValueInScenarioScope = function(variableName, value) {
  this.scenarioVariables[variableName] = value;
};

Apickli.prototype.storeValueOfHeaderInScenarioScope = function(header, variableName) {
  header = this.replaceVariables(header); // only replace header. replacing variable name wouldn't make sense
  const value = this.getResponseObject().headers[header.toLowerCase()];
  this.scenarioVariables[variableName] = value;
};

Apickli.prototype.storeValueOfResponseBodyPathInScenarioScope = function(path, variableName) {
  path = this.replaceVariables(path); // only replace path. replacing variable name wouldn't make sense
  const value = evaluatePath(path, this.getResponseObject().body);
  this.scenarioVariables[variableName] = value;
};

Apickli.prototype.assertScenarioVariableValue = function(variable, value) {
  value = this.replaceVariables(value); // only replace value. replacing variable name wouldn't make sense
  return (String(this.scenarioVariables[variable]) === value);
};

Apickli.prototype.storeValueOfHeaderInGlobalScope = function(headerName, variableName) {
  headerName = this.replaceVariables(headerName); // only replace headerName. replacing variable name wouldn't make sense
  const value = this.getResponseObject().headers[headerName.toLowerCase()];
  this.setGlobalVariable(variableName, value);
};

Apickli.prototype.storeValueOfResponseBodyPathInGlobalScope = function(path, variableName) {
  path = this.replaceVariables(path); // only replace path. replacing variable name wouldn't make sense
  const value = evaluatePath(path, this.getResponseObject().body);
  this.setGlobalVariable(variableName, value);
};

Apickli.prototype.setGlobalVariable = function(name, value) {
  globalVariables[name] = value;
};

Apickli.prototype.getGlobalVariable = function(name) {
  return globalVariables[name];
};

Apickli.prototype.validateResponseWithSchema = function(schemaFile, callback) {
  const self = this;
  schemaFile = this.replaceVariables(schemaFile, self.scenarioVariables, self.variableChar);

  fs.readFile(path.join(this.fixturesDirectory, schemaFile), 'utf8', function(err, jsonSchemaString) {
    if (err) {
      callback(err);
    } else {
      const jsonSchema = JSON.parse(jsonSchemaString);
      const responseBody = JSON.parse(self.getResponseObject().body);

      const validate = jsonSchemaValidator(jsonSchema, {verbose: true});
      const success = validate(responseBody);
      callback(getAssertionResult(success, validate.errors, null, self));
    }
  });
};

Apickli.prototype.validateResponseWithSwaggerSpecDefinition = function(definitionName, swaggerSpecFile, callback) {
  const self = this;
  swaggerSpecFile = this.replaceVariables(swaggerSpecFile, self.scenarioVariables, self.variableChar);

  fs.readFile(path.join(this.fixturesDirectory, swaggerSpecFile), 'utf8', function(err, swaggerSpecString) {
    if (err) {
      callback(err);
    } else {
      const swaggerObject = JSON.parse(swaggerSpecString);
      const responseBody = JSON.parse(self.getResponseObject().body);

      spec.validateModel(swaggerObject, '#/definitions/' + definitionName, responseBody, function(err, result) {
        if (err) {
          callback(getAssertionResult(false, null, err, self));
        } else if (result && result.errors) {
          callback(getAssertionResult(false, null, result.errors, self));
        } else {
          callback(getAssertionResult(true, null, null, self));
        }
      });
    }
  });
};

exports.Apickli = Apickli;

/**
 * Replaces variable identifiers in the resource string
 * with their value in scope if it exists
 * Returns the modified string
 * The variable identifiers must be delimited with backticks or variableChar character
 * offset defines the index of the char from which the varaibles are to be searched
 * It's optional.
 *
 * Credits: Based on contribution by PascalLeMerrer
 */
Apickli.prototype.replaceVariables = function(resource, scope, variableChar, offset) {
  // handling of nullish values for resource
  // as cucumber-js passes undefined when a value in an example table is left empty
  // see issue #184
  if (!resource) return resource;

  scope = scope || this.scenarioVariables;
  variableChar = variableChar || this.variableChar;
  offset = offset || 0;

  const startIndex = resource.indexOf(variableChar, offset);
  if (startIndex >= 0) {
    const endIndex = resource.indexOf(variableChar, startIndex + 1);
    if (endIndex > startIndex) {
      const variableName = resource.substr(startIndex + 1, endIndex - startIndex - 1);
      const variableValue = scope && Object.prototype.hasOwnProperty.call(scope, variableName) ? scope[variableName] : globalVariables[variableName];

      resource = resource.substr(0, startIndex) + variableValue + resource.substr(endIndex + 1);
      resource = this.replaceVariables(resource, scope, variableChar);
    }
  }
  return resource;
};

Apickli.prototype.sendRequest = function(method, resource, callback) {
  const self = this;
  const options = this.httpRequestOptions || {};
  options.url = this.domain + resource;
  options.method = method;
  options.headers = this.headers;
  options.qs = this.queryParameters;

  if (this.requestBody.length > 0) {
    options.body = this.requestBody;
  } else if (Object.keys(this.formParameters).length > 0) {
    options.form = this.formParameters;
  }

  const cookieJar = request.jar();
  this.cookies.forEach(function(cookie) {
    cookieJar.setCookie(request.cookie(cookie), self.domain);
  });

  options.jar = cookieJar;

  if (this.selectedClientTLSConfig.length > 0) {
    options.key = fs.readFileSync(this.clientTLSConfig[this.selectedClientTLSConfig].key);
    options.cert = fs.readFileSync(this.clientTLSConfig[this.selectedClientTLSConfig].cert);
    if (this.clientTLSConfig[this.selectedClientTLSConfig].ca) {
      options.ca = fs.readFileSync(this.clientTLSConfig[this.selectedClientTLSConfig].ca);
    }
  }

  if (method !== 'OPTIONS') {
    options.followRedirect = false;
  }

  resource = this.replaceVariables(resource);
  request(options, function(error, response) {
    if (error) {
      return callback(error);
    }

    self.httpResponse = response;
    callback(null, response);
  });
};

```
---
# PARAMETER TYPES
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS 
```ts
// 5 step bindings already registered — do NOT redefine any of these:
Given(/^I have (.+) client TLS configuration$/)             // source/apickli/apickli-gherkin.js
Given(/^I store the raw value (.*) as (.*) in scenario scope$/)// source/apickli/apickli-gherkin.js
Then(/^I store the value of response header (.*) as (.*) in global scope$/)// source/apickli/apickli-gherkin.js
Then(/^I store the value of body path (.*) as (.*) in global scope$/)// source/apickli/apickli-gherkin.js
Given(/^I use the mock target$/)                            // source/test/features/step_definitions/mock-target.js
```
---
# EXISTING STEP DEFINITIONS (for call style — do not copy their coverage)
```ts
// ---- source/apickli/apickli-gherkin.js ----
/* eslint new-cap: "off", no-invalid-this: "off" */

'use strict';

const {Before, Given, When, Then} = require('@cucumber/cucumber');

const stepContext = {};

Before(function(scenarioResult, callback) {
  // https://github.com/cucumber/cucumber-js/issues/891
  // stepContext.step = step.getName;
  // stepContext.scenario = scenario.getName;

  callback();
});

Given(/^I have (.+) client TLS configuration$/, function(configurationName, callback) {
  this.apickli.setClientTLSConfiguration(configurationName, function(error) {
    if (error) {
      callback(new Error(error));
    }
    callback();
  });
});

Given(/^I store the raw value (.*) as (.*) in scenario scope$/, function(value, variable, callback) {
  this.apickli.storeValueInScenarioScope(variable, value);
  callback();
});

Then(/^I store the value of response header (.*) as (.*) in global scope$/, function(headerName, variableName, callback) {
  this.apickli.storeValueOfHeaderInGlobalScope(headerName, variableName);
  callback();
});

Then(/^I store the value of body path (.*) as (.*) in global scope$/, function(path, variableName, callback) {
  this.apickli.storeValueOfResponseBodyPathInGlobalScope(path, variableName);
  callback();
});

// ---- source/test/features/step_definitions/mock-target.js ----
/* eslint new-cap: "off", no-invalid-this: "off" */

'use strict';

const {Given} = require('@cucumber/cucumber');

Given(/^I use the mock target$/, function(callback) {
  this.apickli.domain = 'https://localhost:5000';
  callback();
});

```
---
# WORLD  (what `this` gives you)
```ts
// ---- source/test/features/support/init.js ----
/* eslint new-cap: "off", no-invalid-this: "off" */

'use strict';

const apickli = require('../../../apickli/apickli.js');
const {Before, setDefaultTimeout} = require('@cucumber/cucumber');

Before(function() {
  this.apickli = new apickli.Apickli('http', 'httpbin.org');
  this.apickli.addRequestHeader('Cache-Control', 'no-cache');
  this.apickli.clientTLSConfig = {
    valid: {
      key: './test/mock_target/certs/client-key.pem',
      cert: './test/mock_target/certs/client-crt.pem',
      ca: './test/mock_target/certs/ca-crt.pem',
    },
  };
  this.apickli.httpRequestOptions = {
    gzip: true,
  };
});

setDefaultTimeout(60 * 1000);

```
---
# CONSTANTS 
```ts
// (none discovered in this repo)
```
---
# TASK — write the missing step definitions for this Gherkin feature
```gherkin
@core
Feature:
  Httpbin.org exposes various resources for HTTP request testing
  As Httpbin client I want to verify that all API resources are working as they should

  Scenario: Setting headers in GET request
    Given I set User-Agent header to apickli
    When I GET /get
    Then response body path $.headers.User-Agent should be apickli

  Scenario: checking values of headers passed as datatable in get request
    Given I set headers to
      | name          | value            |
      | Accept        | application/json |
      | User-Agent    | apickli          |
    When I GET /get
    Then response body path $.headers.Accept should be application/json
    And response body path $.headers.User-Agent should be apickli

  Scenario: combine headers passed as table and Given syntax
    Given I set Custom-Header header to abcd
    And I set headers to
      | name       | value            |
      | User-Agent | apickli          |
      | Accept     | application/json |
    When I GET /get
    Then response body path $.headers.Accept should be application/json
    And response body path $.headers.User-Agent should be apickli
    And response body path $.headers.Custom-Header should be abcd

  Scenario: Same header field with multiple values
    Given I set Custom-Header header to A
    And I set Custom-Header header to B
    And I set headers to
      | name          | value |
      | Custom-Header | C     |
      | Custom-Header | D     |
    When I GET /get
    Then response body path $.headers.Custom-Header should be A,B,C,D

  Scenario: Setting cookie in GET request
    Given I set cookie to test=value; HttpOnly
    When I GET /get
    Then response body path $.headers.Cookie should be test=value

  Scenario: Setting body payload in POST request
    Given I set body to {"key":"hello-world"}
    When I POST to /post
    Then response body should contain hello-world

  Scenario: Setting body payload in PUT request
    Given I set body to {"key":"hello-world"}
    When I PUT /put
    Then response body should contain hello-world

  Scenario: Setting body payload in DELETE request
    Given I set body to {"key":"hello-world"}
    When I DELETE /delete
    Then response body should contain hello-world

  Scenario: Setting body payload from file
    Given I pipe contents of file ./test/features/fixtures/requestBody.xml to body
    When I POST to /post
    Then response body should contain "<a>b</a>"

  Scenario: Sending request with basic auth authentication
    Given I have basic authentication credentials username and password
    When I POST to /post
    Then response body path $.headers.Authorization should be Basic dXNlcm5hbWU6cGFzc3dvcmQ=

  Scenario: Parsing response xml body
    When I GET /xml
    Then response body path /slideshow/slide[1]/title should be Wake up to WonderWidgets!

  Scenario: Response body content type assertions (xml)
    When I GET /xml
    Then response body should be valid xml

  Scenario: Response body content type assertions (json)
    When I GET /get
    Then response body should be valid json

  Scenario: Checking headers in response
    When I GET /xml
    Then response header server should exist
    And response header boo should not exist

  Scenario: Response code checks
    When I GET /xml
    Then response code should be 200
    And response code should not be 404

  Scenario: Response header value assertions
    When I GET /xml
    Then response header Content-Type should be application/xml
    And response header Content-Type should be [a-z]/xml
    And response header Connection should not be boo

  Scenario: Response body text assertions
    When I GET /xml
    Then response body should contain WonderWidgets
    And response body should contain Wonder[Wdgist]
    And response body should not contain boo

  Scenario: Response body xpath assertions
    When I GET /xml
    Then response body path /slideshow/slide[2]/title should be [a-z]+
    And response body path /slideshow/slide[2]/title should not be \d+

  Scenario: Response body jsonpath assertions
    Given I set User-Agent header to apickli
    When I GET /get
    Then response body path $.headers.User-Agent should be [a-z]+
    And response body path $.headers.User-Agent should not be \d+

  Scenario: Access token retrieval from response body (authorization code grant, password, client credentials)
    Given I set Token header to token123
    When I GET /get
    Then I store the value of body path $.headers.Token as access token

  Scenario: Using access token
    Given I set bearer token
    When I GET /get
    Then response body path $.headers.Authorization should be Bearer token123

  Scenario: setting header value as variable
    When I GET /get
    Then I store the value of response header Content-Type as responseContentType in scenario scope
    And value of scenario variable responseContentType should be application/json

  Scenario: setting body path as variable (xml)
    When I GET /xml
    And I store the value of body path /slideshow/slide[2]/title as title in scenario scope
    Then value of scenario variable title should be Overview

  Scenario: setting body path as variable (json)
    Given I set User-Agent header to apickli
    When I GET /get
    And I store the value of body path $.headers.User-Agent as agent in scenario scope
    Then value of scenario variable agent should be apickli

  Scenario: checking values of scenario variables
    Then value of scenario variable title should be undefined

  Scenario: checking values of query parameters passed in url in get request
    When I GET /get?argument1=1&argument2=test
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameter passed as datatable in get request
    Given I set query parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I GET /get
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameters passed in url in post request
    When I POST to /post?argument1=1&argument2=test
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameter passed as datatable in post request
    Given I set query parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I POST to /post
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameters passed in url in put request
    When I PUT /put?argument1=1&argument2=test
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameter passed as datatable in put request
    Given I set query parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I PUT /put
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameters passed in url in delete request
    When I DELETE /delete?argument1=1&argument2=test
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameter passed as datatable in delete request
    Given I set query parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I DELETE /delete
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameters passed in url in patch request
    When I PATCH /patch?argument1=1&argument2=test
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: checking values of query parameter passed as datatable in patch request
    Given I set query parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I PATCH /patch
    Then response body path $.args.argument1 should be 1
    And response body path $.args.argument2 should be test

  Scenario: should successfully send an OPTIONS call to target API and assert response
    When I request OPTIONS for /get
    Then response code should be 200
    And response header Access-Control-Allow-Credentials should be true
    And response header Access-Control-Allow-Methods should be GET, POST, PUT, DELETE, PATCH, OPTIONS
    And response header Allow should be (.*)OPTIONS(.*)
    And response header Allow should be (.*)GET(.*)
    And response header Allow should be (.*)HEAD(.*)
    And response header Content-Length should be 0

  Scenario: should differentiate between empty string and non-existing element in JSON path assertions
    When I GET /get
    Then response code should be 200
    And response body path $.origin should be [0-9\.]+
    And response body path $.notthere should be null

  Scenario: should successfully validate json using schema
    When I GET /get
    Then response body should be valid according to schema file ./test/features/fixtures/get-simple.schema

  Scenario: should successfully validate json using the OpenAPI spec description
    When I GET /get
    Then response body should be valid according to openapi description GetResponse in file ./test/features/fixtures/get-simple-swagger-spec.json

  Scenario: should successfully validate json array
    Given I set body to ["a","b","c"]
    When I POST to /post
    Then response body path $.json should be of type array
    And response body path $.json should be of type array with length 3

  Scenario: should successfully validate json object array
    Given I set body to [{"a":1},{"b":2},{"c":3}]
    When I POST to /post
    Then response body path $.json should be of type array
    And response body path $.json should be of type array with length 3

  Scenario: checking values of form parameter passed as datatable in post request
    Given I set form parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I POST to /post
    Then response body path $.form.argument1 should be 1
    And response body path $.form.argument2 should be test

  Scenario: checking values of form parameter passed as datatable in put request
    Given I set form parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I PUT /put
    Then response body path $.form.argument1 should be 1
    And response body path $.form.argument2 should be test

  Scenario: checking values of form parameter passed as datatable in delete request
    Given I set form parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I DELETE /delete
    Then response body path $.form.argument1 should be 1
    And response body path $.form.argument2 should be test

  Scenario: checking values of form parameter passed as datatable in patch request
    Given I set form parameters to
      | parameter | value |
      | argument1 | 1     |
      | argument2 | test  |
    When I PATCH /patch
    Then response body path $.form.argument1 should be 1
    And response body path $.form.argument2 should be test

  Scenario: should successfully pipe form parameters
    Given I set Authorization header to Basic abcd
    And I pipe contents of file ./test/features/fixtures/formparams to body
    When I POST to /post
    Then response code should be 200
    And response body path $.data should be a=a&b=b&c=c

  Scenario: should override the authorization header correctly
    Given I set Authorization header to token1
    And I have basic authentication credentials user1 and password1
    When I GET /get
    Then response body path $.headers.Authorization should be ^Basic dXNlcjE6cGFzc3dvcmQx$

  Scenario: should handle nullish values in form parameters
    Given I set form parameters to
      | parameter | value |
      | argument1 |       |
    When I PUT /put
    Then response body path $.form.argument1 should be ^$

  Scenario: should handle nullish values in request headers as data table
    Given I set headers to
      | name     | value |
      | Endpoint |       |
    When I GET /get
    Then response body path $.headers.Endpoint should be ^$

  Scenario Outline: should handle nullish values in request headers as example table
    Given I set Endpoint header to <endpoint>
    When I GET /get
    Then response body path $.headers.Endpoint should be ^$

    Examples:
      | endpoint |
      |          |

  Scenario: should handle gzip
    When I GET /gzip
    Then response code should be 200
    And response body should be valid json
    And response body path $.gzipped should be true
```