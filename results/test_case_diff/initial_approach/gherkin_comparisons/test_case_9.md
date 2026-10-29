# Test case 9

## Gherkin scenario

```gherkin
@core
Feature:
	As Httpbin client I want to use variables in my feature files

#test variable injection logic

	Scenario: using unknown variable in request path
		When I GET /get?foo=`UNKNOWN_VARIABLE`
        #replace unknown variables with empty string
        Then response body path $.args.foo should not be UNKNOWN_VARIABLE

	Scenario: using scenario variable
		Given I store the raw value bar as value1 in scenario scope
		When I GET /get?foo=`value1`
        Then response body path $.args.foo should be bar

	@jarl
	Scenario: using long named variables
        Given I store the raw value A as variableWithAVeryVeryVeryLongNameAndAShortValueA in scenario scope
        And I store the raw value B as v2 in scenario scope
		When I GET /get?var1=`variableWithAVeryVeryVeryLongNameAndAShortValueA`&var2=`v2`
        Then response body path $.args.var1 should be A
        And response body path $.args.var2 should be B

#test injection logic with other step definitions

    Scenario: Setting headers with variables
        Given I store the raw value apickli as foo in scenario scope
        And I set User-Agent header to `foo`
		When I GET /get
		Then response body path $.headers.User-Agent should be apickli

    Scenario: Calling a resource with variables
        Given I store the raw value /get as myResourcePath in scenario scope
		When I GET `myResourcePath`
		Then response body path $.url should be (.*)/get

    Scenario: Setting headers in datatable with variables
        Given I store the raw value apickli as foo in scenario scope
        And I store the raw value Accept as bar in scenario scope
		And I set headers to
		|name|value|
		|User-Agent|`foo`|
		|`bar`|application/json|
		When I GET /get
		Then response body path $.headers.Accept should be application/json
		And response body path $.headers.User-Agent should be apickli

	Scenario: Setting body payload using variables
        Given I store the raw value {"key":"hello-world"} as myPayload in scenario scope
		And I set body to `myPayload`
		When I POST to /post
		Then response body should contain hello-world

	Scenario: Setting body payload from file using variable
        Given I store the raw value ./test/features/fixtures/requestBody.xml as myFilePath in scenario scope
		And I pipe contents of file `myFilePath` to body
		When I POST to /post
		Then response body should contain "<a>b</a>"

	Scenario: Sending request with basic auth authentication using variables
        Given I store the raw value username as myUsername in scenario scope
        And I store the raw value password as myPassword in scenario scope
		Given I have basic authentication credentials `myUsername` and `myPassword`
		When I POST to /post
		Then response body path $.headers.Authorization should be Basic dXNlcm5hbWU6cGFzc3dvcmQ=

	Scenario: Response code checks
        Given I store the raw value 200 as myCode in scenario scope
        And I store the raw value 404 as myIncorrectCode in scenario scope
		When I GET /xml
		Then response code should be `myCode`
		And response code should not be `myIncorrectCode`

	Scenario: Response header value assertions
        Given I store the raw value Content-Type as myHeaderName in scenario scope
        And I store the raw value [a-z]/xml as myHeaderValue in scenario scope
        And I store the raw value boo as myHeaderIncorrectValue in scenario scope
		When I GET /xml
		Then response header `myHeaderName` should be application/xml
		And response header Content-Type should be `myHeaderValue`
		And response header Connection should not be `myHeaderIncorrectValue`

	Scenario: Response body text assertions
        Given I store the raw value WonderWidgets as correctValue in scenario scope
        And I store the raw value boo as incorrectValue in scenario scope
		When I GET /xml
		Then response body should contain `correctValue`
		And response body should not contain `incorrectValue`

	Scenario: Response body xpath assertions
        Given I store the raw value /slideshow/slide[2]/title as myPath in scenario scope
        Given I store the raw value [a-z]+ as correctValue in scenario scope
        And I store the raw value \d+ as incorrectValue in scenario scope
		When I GET /xml
		Then response body path `myPath` should be `correctValue`
		And response body path `myPath` should not be `incorrectValue`

	Scenario: Access token retrieval from response body (authorization code grant, password, client credentials)
        Given I store the raw value $.headers.Token as myTokenPath in scenario scope
		And I set Token header to token123
		When I GET /get
		Then I store the value of body path `myTokenPath` as access token
		Given I set bearer token
		When I GET /get
		Then response body path $.headers.Authorization should be Bearer token123

    Scenario: checking values of query parameter passed as datatable
        Given I store the raw value argument1 as myParam in scenario scope
        And I store the raw value test as myVal in scenario scope
		And I set query parameters to
		|parameter|value|
		|argument1|`myParam`|
		|argument2|`myVal`|
		When I GET /get
		Then response body path $.args.argument1 should be 1
		And response body path $.args.argument2 should be test

    Scenario: should successfully validate json using schema
        Given I store the raw value ./test/features/fixtures/get-simple.schema as schemaPath in scenario scope
        When I GET /get
        Then response body should be valid according to schema file `schemaPath`

	Scenario: should successfully validate json using the OpenAPI spec description
        Given I store the raw value ./test/features/fixtures/get-simple-swagger-spec.json as swaggerSpecPath in scenario scope
        When I GET /get
        Then response body should be valid according to schema file `swaggerSpecPath`

    Scenario: should successfully validate json array
        Given I store the raw value 3 as myLength in scenario scope
    	And I set body to ["a","b","c"]
    	When I POST to /post
    	And response body path $.json should be of type array with length `myLength`
```

## Original test

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

## Generated test

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
