# Test case 4

## Gherkin scenario

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

## Original test

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

## Generated test

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
