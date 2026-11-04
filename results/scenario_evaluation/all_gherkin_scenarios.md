# All Gherkin scenarios (test cases 1-20)

## Test case 1

```gherkin
@register
Feature: Scenarios related to register user

    Background:
        Given user is on home page

    @regression
    @sanity
    Scenario Outline: register a new user
        Given user navigate to registration page
        When the user enters the registration details "<firstName>", "<lastName>", "<email>", "<telephone>", "<password>", "<confirmPassword>", "<subscribe>"
        Then user should see a message "Your Account Has Been Created!"
        Then user logs out of application
        Then user should see a message "Account Logout"
        Examples:
            | firstName | lastName | email              | telephone  | password | confirmPassword | subscribe |
            | John      | Doe      | john_{0}@email.com | 9876543210 | test321  | test321         | yes       |
            | Jane      | Doe      | jane_{0}@email.com | 4321098765 | test123  | test123         | no        |
```

## Test case 2

```gherkin
Feature: Subscriptions
  As an user, I'm able to view the subscription page

  Scenario: User open the app and navigate subscription page
    Given user open the app
    And user open the subscription link
    Then user should see the subscription page

  Scenario: User on subscription page, should be able to filter the list of subscriptions
    Given user open the "subscriptions" page
    Then user should see "3" subscriptions
    When user change filter by "One Time Purchase"
    Then user should see "1" subscriptions

  Scenario: User upon refreshing subscription page, should see filter persisted
    Given user open the "subscriptions" page
    And user change filter by "One Time Purchase"
    Then user should see "1" subscriptions
    When user reload current page
    Then user should see "1" subscriptions
```

## Test case 3

```gherkin
Feature: User Authentication tests

  Background:
    Given User navigates to the application
    And User click on the login link

  Scenario: Login should be success
    And User enter the username as "ortoni11"
    And User enter the password as "Pass1234"
    When User click on the login button
    Then Login should be success

  Scenario: Login should not be success
    Given User enter the username as "koushik"
    Given User enter the password as "Passkoushik"
    When User click on the login button
    But Login should fail
```

## Test case 4

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

## Test case 5

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

## Test case 6

```gherkin
Feature: Create a user

  @user
  Scenario: I can create a user
    Given user profile data
      | email              | country | street      | postalCode |
      | john.doe@gmail.com | England | Road Avenue | 29145      |
    When I send a request to create a user
    Then I receive my user ID
    And I can see my user in a list of all users

  @user
  Scenario Outline: I try to create a user with invalid data
    Given user profile data
      | email   | country   | street   | postalCode   |
      | <Email> | <Country> | <Street> | <PostalCode> |
    When I send a request to create a user
    Then I receive an error "Bad Request" with status code 400

    Examples:
      | Email          | Country | Street      | PostalCode |
      | johngmail.com  | England | Road Avenue | 29145      |
      | john@gmail.com | 123     | Road Avenue | 29145      |
      | johng@mail.com | England | 123         | 29145      |
      | johng@mail.com | England | Road Avenue | @          |
      | #@!$           | $#@1    | %542        | !321       |
```

## Test case 7

```gherkin
Feature: Delete a user

  Background: Existing user
    Given user profile data
      | email              | country | street      | postalCode |
      | john.doe@gmail.com | England | Road Avenue | 29145      |
    When I send a request to create a user

  @user
  Scenario: I can delete a user
    Given I send a request to delete my user
    Then I cannot see my user in a list of all users
```

## Test case 8

```gherkin
@core
Feature: 
    As an API Client
    I want to present a Client Certificate with a HTTP Request
    So that I can access protected systems

    Scenario: I successfully present a client certificate and ca certificate
        Given I use the mock target
        And I have valid client TLS configuration
        When I GET / 
        Then response code should be 200
```

## Test case 9

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

## Test case 10

```gherkin
Feature: Binding steps

    Scenario Outline: Bind steps with <Bind Mode>
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario a
                Given step one
                When step two
                Then step three
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, when, then} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @given(<Step 1>)
                public given() {
                    console.log("Step one executed");
                }

                @when(<Step 2>)
                public when() {
                    console.log("Step two executed");
                }

                @then(<Step 3>)
                public then() {
                    console.log("Step three executed");
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains "Step one executed"
        And the output contains "Step two executed"
        And the output contains "Step three executed"

        Examples:
            | Bind Mode | Step 1       | Step 2       | Step 3         |
            | names     | "step one"   | "step two"   | "step three"   |
            | regex     | /^step one$/ | /^step two$/ | /^step three$/ |

    Scenario: Failing test
        Given a file named "features/a.feature" with:
            """feature
            Feature: Some feature
              Scenario: example
                Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given} from 'cucumber-tsflow';

            @binding()
            class Step {
                @given("a step")
                public step() {
                    throw new Error("Inner error message.");
                }
            }

            export = Step;
            """
        When I run cucumber-js
        Then it fails
        And the output contains "Error: Inner error message."

    Scenario: Missing step definition
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario a
                Given missing step
            """
        When I run cucumber-js
        Then it fails
        And the output contains "Given('missing step'"
```

## Test case 11

```gherkin
Feature: Cucumber context objects

    Scenario: Using the cucumber logger
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Given a step
                And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, CucumberLog} from 'cucumber-tsflow';

            @binding([CucumberLog])
            class Steps {
                public constructor(private readonly logger: CucumberLog) {}

                @given("a step")
                public one() {
                    this.logger.log("logged value");
                }

                @given("another step")
                public noop() {}
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And scenario "example" step "Given a step" has the logs:
            | logged value |
        And scenario "example" step "And another step" has no attachments

    Scenario: Using the cucumber attachments
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Given a step
                And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, CucumberAttachments} from 'cucumber-tsflow';

            @binding([CucumberAttachments])
            class Steps {
                public constructor(private readonly att: CucumberAttachments) {}

                @given("a step")
                public one() {
                    this.att.attach("my string", "text/plain+custom");
                }

                @given("another step")
                public noop() {}
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And scenario "example" step "Given a step" has the attachments:
            | DATA      | MEDIA TYPE        | MEDIA ENCODING |
            | my string | text/plain+custom | IDENTITY       |
        And scenario "example" step "And another step" has no attachments

    Scenario: Using the cucumber attachments in hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, before, after, given, CucumberAttachments} from 'cucumber-tsflow';

            @binding([CucumberAttachments])
            class Steps {
                public constructor(private readonly att: CucumberAttachments) {}

                @before()
                public before() {
                    this.att.attach("my first string", "text/plain+custom");
                }

                @given("a step")
                public one() {}

                @after()
                public after() {
                    this.att.attach("my second string", "text/plain+custom");
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And scenario "example" "Before" hook has the attachments:
            | DATA            | MEDIA TYPE        | MEDIA ENCODING |
            | my first string | text/plain+custom | IDENTITY       |
        And scenario "example" "After" hook has the attachments:
            | DATA             | MEDIA TYPE        | MEDIA ENCODING |
            | my second string | text/plain+custom | IDENTITY       |
        And scenario "example" step "Given a step" has no attachments

    Scenario: Using world parameters
        Given a file named "cucumber.js" with:
            """js
            const cucumberPkg = require("@cucumber/cucumber/package.json");

            module.exports = cucumberPkg.version.startsWith("7.")
              ? {
                default: [
                  "--world-parameters '{\"name\":\"Earth\"}'"
                ].join(" ")
              }
              : {
                default: {
                  worldParameters: {
                    name: 'Earth'
                  }
                }
              };
            """
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the world name is "Earth"
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, then, WorldParameters} from 'cucumber-tsflow';
            import * as assert from 'node:assert';

            @binding([WorldParameters])
            class Steps {
                public constructor(private readonly world: WorldParameters) {}

                @then("the world name is {string}")
                public checkWorldName(name: string) {
                    assert.deepStrictEqual(this.world.value, {name})
                }
            }

            export = Steps;
            """

        When I run cucumber-js
        Then it passes

    Scenario: Reading the scenario information
        Given a file named "features/a.feature" with:
            """feature
            @foo
            Feature: Feature
              @bar
              Scenario: example
                Then the scenario title is "example"
                And  the tags are [ "@foo", "@bar" ]
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, then, ScenarioInfo} from 'cucumber-tsflow';
            import * as assert from 'node:assert';

            @binding([ScenarioInfo])
            class Steps {
                public constructor(private readonly scenario: ScenarioInfo) {}

                @then("the scenario title is {string}")
                public checkScenarioName(name: string) {
                    assert.strictEqual(this.scenario.scenarioTitle, name);
                }

                @then("the tags are {}")
                public checkTags(tags: string) {
                    assert.deepStrictEqual(this.scenario.tags, JSON.parse(tags));
                }
            }

            export = Steps;
            """

        When I run cucumber-js
        Then it passes
```

## Test case 12

```gherkin
Feature: Extracing context objects from World externally

    Scenario: Failing to retrieve state from a non-initialized World object
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario a
                Given a step
            """
        And a file named "support/state.ts" with:
            """ts
            export class State {
                public constructor() {
                  console.log('State has been initialized');
                }

                public value: string = "initial value";
            }
            """
        And a file named "step_definitions/a.ts" with:
            """ts
            import {State} from '../support/state';
            import {Before, Given} from '@cucumber/cucumber';
            import {getBindingFromWorld} from 'cucumber-tsflow';

            Before(function() {
              const state = getBindingFromWorld(this, State);

              console.log(`Cucumber-style before. State is "${state.value}"`);

              state.value = 'cucumber-style before';
            });

            Given('a step', function() {
              const state = getBindingFromWorld(this, State);

              console.log(`Cucumber-style step. State is "${state.value}"`);

              state.value = 'cucumber-style step';
            });
            """
        When I run cucumber-js
        Then it fails
        And the output contains text:
            """
            Before # step_definitions/a.ts:5
                   Error: Scenario context have not been initialized in the provided World object.
            """

    Scenario: Sharing a state between native Cucumber and Decorator-style steps
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario a
                Given a cucumber-style step is called
                And a decorator-style step is called
            """
        And a file named "support/state.ts" with:
            """ts
            export class State {
                public constructor() {
                  console.log('State has been initialized');
                }

                public value: string = "initial value";
            }
            """
        And a file named "step_definitions/a.ts" with:
            """ts
            import {State} from '../support/state';
            import {Before, Given} from '@cucumber/cucumber';
            import {ensureWorldIsInitialized,getBindingFromWorld} from 'cucumber-tsflow';

            ensureWorldIsInitialized();

            Before(function() {
              const state = getBindingFromWorld(this, State);

              console.log(`Cucumber-style before. State is "${state.value}"`);

              state.value = 'cucumber-style before';
            });

            Given('a cucumber-style step is called', function() {
              const state = getBindingFromWorld(this, State);

              console.log(`Cucumber-style step. State is "${state.value}"`);

              state.value = 'cucumber-style step';
            });
            """
        And a file named "step_definitions/b.ts" with:
            """ts
            import {State} from '../support/state';
            import {binding, before, given} from 'cucumber-tsflow';

            @binding([State])
            class Steps {
                public constructor(private readonly state: State) {}

                @before()
                public before() {
                    console.log(`Decorator-style before. State is "${this.state.value}"`);

                    this.state.value = 'decorator-style before';
                }

                @given('a decorator-style step is called')
                public step() {
                    console.log(`Decorator-style step. State is "${this.state.value}"`);

                    this.state.value = 'decorator-style step';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text:
            """
            .State has been initialized
            Cucumber-style before. State is "initial value"
            .Decorator-style before. State is "cucumber-style before"
            .Cucumber-style step. State is "decorator-style before"
            .Decorator-style step. State is "cucumber-style step"
            """

    Scenario: Share state between underlying cucumber functionality and TSFlow functionality
        Given a file named "features/a.feature" with:
            """feature
            Feature: some feature
              Scenario: scenario before year 2k
                Given a step for 1999-03-04T21:43:54Z
              @y2k
              Scenario: scenario after year 2k
                Given a step for 2023-09-13T12:34:56.789Z
            """
        And a file named "support/state.ts" with:
            """ts
            export class State {
                public maxDate = new Date('2000-01-01');
            }
            """
        And a file named "step_definitions/a.ts" with:
            """ts
            import {State} from '../support/state';
            import {defineParameterType} from '@cucumber/cucumber';
            import {ensureWorldIsInitialized,getBindingFromWorld} from 'cucumber-tsflow';

            ensureWorldIsInitialized();

            defineParameterType({
              name: 'datetime',
              regexp: /[+-]?\d{4,}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z/,
              preferForRegexpMatch: true,
              useForSnippets: true,
              transformer: function (this: any, datetime): Date {
                const state = getBindingFromWorld(this, State);

                const date = new Date(datetime);

                console.log(`Parsing date up to ${state.maxDate.toISOString()}`);

                if (state.maxDate.valueOf() < date.valueOf()) {
                    throw new Error('Date after maximum date.');
                }

                return new Date(datetime)
              }
            });
            """
        And a file named "step_definitions/b.ts" with:
            """ts
            import {State} from '../support/state';
            import {binding, before, given} from 'cucumber-tsflow';

            @binding([State])
            class Steps {
                public constructor(private readonly state: State) {}

                @before({tag: '@y2k'})
                public before() {
                    this.state.maxDate = new Date('3000-01-01');
                }

                @given('a step for {datetime}')
                public step(datetime: Date) {
                    console.log(`Step received a ${datetime.constructor.name}: ${datetime.toISOString()}`);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text:
            """
            .Parsing date up to 2000-01-01T00:00:00.000Z
            Step received a Date: 1999-03-04T21:43:54.000Z
            ....Parsing date up to 3000-01-01T00:00:00.000Z
            Step received a Date: 2023-09-13T12:34:56.789Z
            """
```

## Test case 13

```gherkin
Feature: Support for Cucumber hooks

    Scenario: Binding a beforeAll hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()
                public static hook() {
                    console.log('hook exec')
                }

                @given("a step")
                public given() {
                    console.log('step exec');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            hook exec
            .step exec
            ...step exec
            ..
            """

    Scenario: Binding a afterAll hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @afterAll()
                public static hook() {
                    console.log('hook exec')
                }

                @given("a step")
                public given() {
                    console.log('step exec');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            .step exec
            ...step exec
            ..hook exec
            """

    Scenario: Binding beforeAll and afterAll hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll, afterAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()
                public static before() {
                    console.log('before exec')
                }

                @afterAll()
                public static after() {
                    console.log('after exec')
                }

                @given("a step")
                public given() {
                    console.log('step exec');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            before exec
            .step exec
            ...step exec
            ..after exec
            """

    Scenario: Binding multiple beforeAll hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()
                public static one() {
                    console.log('one')
                }

                @beforeAll()
                public static two() {
                    console.log('two')
                }

                @given("a step")
                public given() {
                    console.log('step');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            one
            two
            .step
            ...step
            ..
            """

    Scenario: Binding multiple global hooks on the same line
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @beforeAll()public static one() { console.log('one') }@beforeAll()public static two() { console.log('two') }

                @given("a step")
                public given() {
                    console.log('step');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            one
            two
            .step
            ...step
            ..
            """

    Scenario: Binding multiple afterAll hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example one
                    Given a step

                Scenario: example two
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterAll} from 'cucumber-tsflow';

            @binding()
            class Steps {
                @afterAll()
                public static one() {
                    console.log('one')
                }

                @afterAll()
                public static two() {
                    console.log('two')
                }

                @given("a step")
                public given() {
                    console.log('step');
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output contains text once:
            """
            .step
            ...step
            ..two
            one
            """
```

## Test case 14

```gherkin
Feature: Support for Cucumber hooks

    Scenario: Binding a before hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before()
                public hook() {
                    this.state = 'hook has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "hook has not executed"
        And the output contains "hook has executed"

    Scenario: Binding an after hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'step has not executed';

                @after()
                public hook() {
                    console.log(this.state);
                }

                @given("a step")
                public given() {
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains "step has executed"

    Scenario: Binding before and after hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before()
                public before() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @after()
                public after() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .before hook executed
            .step has executed
            """

    Scenario: Binding multiple before hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @before()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @before()
                public hookTwo() {
                    console.log(this.state)
                    this.state = 'hook two has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            .hook one has executed
            .hook two has executed
            """


    Scenario: Binding multiple hooks same line
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @before()public hookOne() {console.log(this.state);this.state = 'hook one has executed';}@before()public hookTwo() {console.log(this.state);this.state = 'hook two has executed';}

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            .hook one has executed
            .hook two has executed
            """

    Scenario: Binding multiple after hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @given("a step")
                public given() {
                    console.log(this.state)
                    this.state = 'step has executed';
                }

                @after()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @after()
                public hookTwo() {
                    console.log(this.state);
                    this.state = 'hook two has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            .step has executed
            .hook two has executed
            """

    @oldApis
    Scenario: Attempting to bind named hooks with old cucumber
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before({name: 'setup environment'})
                public before() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @after({name: 'tear down environment'})
                public after() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it fails
        And the error output contains text:
            """
            Object literal may only specify known properties, and 'name' does not exist in type 'HookOptions'.
            """

    @newApis
    Scenario: Binding named hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, before, after} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @before({name: 'setup environment'})
                public before() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @after({name: 'tear down environment'})
                public after() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the hook "setup environment" was executed on scenario "example"
        And the hook "tear down environment" was executed on scenario "example"

    Scenario: Binding a before step hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @beforeStep()
                public hook() {
                    this.state = 'hook has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "hook has not executed"
        And the output contains "hook has executed"

    Scenario: Binding a before step hook with multiple steps
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
                    And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep, when} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private counter = 0;

                @beforeStep()
                public hook() {
                    console.log(`${this.counter++} execution: beforeStep`);
                }

                @given("a step")
                public given() {
                    console.log(`${this.counter++} execution: given`);
                }

                @when("another step")
                public when() {
                    console.log(`${this.counter++} execution: when`);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "hook has not executed"
        And the output contains text:
            """
            .0 execution: beforeStep
            1 execution: given
            .2 execution: beforeStep
            3 execution: when
            """

    Scenario: Binding multiple before step hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @beforeStep()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @beforeStep()
                public hookTwo() {
                    console.log(this.state)
                    this.state = 'hook two has executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            hook one has executed
            hook two has executed
            """

    Scenario: Binding an after step hook
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'step has not executed';

                @afterStep()
                public hook() {
                    console.log(this.state);
                }

                @given("a step")
                public given() {
                    this.state = 'step has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains "step has executed"

    Scenario: Binding an after step hook with multiple steps
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
                    And another step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterStep, when} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private counter = 0;

                @afterStep()
                public hook() {
                    console.log(`${this.counter++} execution: afterStep`);
                }

                @given("a step")
                public given() {
                    console.log(`${this.counter++} execution: given`);
                }

                @when("another step")
                public when() {
                    console.log(`${this.counter++} execution: when`);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
        """
        .0 execution: given
        1 execution: afterStep
        .2 execution: when
        3 execution: afterStep
        """

    Scenario: Binding multiple after step hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, afterStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'no hook executed';

                @given("a step")
                public given() {
                    console.log(this.state)
                    this.state = 'step has executed';
                }

                @afterStep()
                public hookOne() {
                    console.log(this.state)
                    this.state = 'hook one has executed';
                }

                @afterStep()
                public hookTwo() {
                    console.log(this.state);
                    this.state = 'hook two has executed';
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .no hook executed
            step has executed
            hook two has executed
            """

    Scenario: Binding before and after step hooks
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
                Scenario: example
                    Given a step
            """
        And a file named "step_definitions/steps.ts" with:
            """ts
            import {binding, given, beforeStep, afterStep} from 'cucumber-tsflow';

            @binding()
            class Steps {
                private state = 'hook has not executed';

                @beforeStep()
                public beforeStep() {
                    this.state = 'before hook executed';
                }

                @given("a step")
                public given() {
                    console.log(this.state);
                    this.state = 'step has executed';
                }

                @afterStep()
                public afterStep() {
                    console.log(this.state);
                }
            }

            export = Steps;
            """
        When I run cucumber-js
        Then it passes
        And the output does not contain "step has not executed"
        And the output contains text:
            """
            .before hook executed
            step has executed
            """
```

## Test case 15

```gherkin
Feature: Tag parameters

    Background:
        Given a file named "step_definitions/steps.ts" with:
            """ts
            import * as assert from 'assert';
            import {binding, then, ScenarioInfo} from 'cucumber-tsflow';

            @binding([ScenarioInfo])
            class Steps {
                public constructor(private readonly scenario: ScenarioInfo) {}

                @then("the flag {string} is enabled")
                public checkEnabled(name: string) {
                    assert.ok(this.scenario.getFlag(name))
                }

                @then("the flag {string} is disabled")
                public checkDisabled(name: string) {
                    assert.ok(!this.scenario.getFlag(name))
                }

                @then("the option tag {string} is set to {string}")
                public checkOption(name: string, value: string) {
                    assert.strictEqual(this.scenario.getOptionTag(name), value);
                }

                @then("the option tag {string} is unset")
                public checkOptionUnset(name: string) {
                    assert.strictEqual(this.scenario.getOptionTag(name), undefined);
                }

                @then("the multi option tag {string} is set to {}")
                public checkMultiOption(name: string, value: string) {
                    assert.deepStrictEqual(this.scenario.getMultiOptionTag(name), JSON.parse(value));
                }

                @then("the attribute tag {string} is set to {}")
                @then("the attribute tag {string} is set to:")
                public checkAttributes(name: string, values: string) {
                    assert.deepStrictEqual(this.scenario.getAttributeTag(name), JSON.parse(values));
                }

                @then("the attribute tag {string} is unset")
                public checkAttributesUnset(name: string) {
                    assert.deepStrictEqual(this.scenario.getAttributeTag(name), undefined);
                }
            }

            export = Steps;
            """

    Scenario: Checking for an absent flag
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the flag "enableFoo" is disabled
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for a flag on the feature
        Given a file named "features/a.feature" with:
            """feature
            @enableFoo
            Feature: Feature
              Scenario: One
                Then the flag "enableFoo" is enabled
              Scenario: Two
                Then the flag "enableFoo" is enabled
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for a flag on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @enableFoo
              Scenario: One
                Then the flag "enableFoo" is enabled
                Then the flag "enableBar" is disabled
              @enableBar
              Scenario: Two
                Then the flag "enableFoo" is disabled
                Then the flag "enableBar" is enabled
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an absent option
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the option tag "foo" is unset
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an option on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            Feature: Feature
              Scenario: One
                Then the option tag "foo" is set to "bar"
              Scenario: Two
                Then the option tag "foo" is set to "bar"
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an option on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @foo(bar)
              Scenario: One
                Then the option tag "foo" is set to "bar"
              @foo(baz)
              Scenario: Two
                Then the option tag "foo" is set to "baz"
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an option on the scenario overriding one on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            Feature: Feature
              Scenario: One
                Then the option tag "foo" is set to "bar"
              @foo(baz)
              Scenario: Two
                Then the option tag "foo" is set to "baz"
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an absent attribute tag
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              Scenario: example
                Then the attribute tag "foo" is unset
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for multi options on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            @foo(baz)
            Feature: Feature
              Scenario: One
                Then the multi option tag "foo" is set to ["bar", "baz"]
              Scenario: Two
                Then the multi option tag "foo" is set to ["bar", "baz"]
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for multi options on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @foo(bar)
              @foo(baz)
              Scenario: One
                Then the multi option tag "foo" is set to ["bar", "baz"]
              @foo(qux)
              @foo(zzz)
              Scenario: Two
                Then the multi option tag "foo" is set to ["qux", "zzz"]
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for multi options on the scenario combining with multi options on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo(bar)
            Feature: Feature
              Scenario: One
                Then the multi option tag "foo" is set to ["bar"]
              @foo(baz)
              Scenario: Two
                Then the multi option tag "foo" is set to ["bar", "baz"]
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an attribute tag on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo({"bar":1})
            Feature: Feature
              Scenario: One
                Then the attribute tag "foo" is set to { "bar": 1 }
              Scenario: Two
                Then the attribute tag "foo" is set to { "bar": 1 }
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an attribute tag on the scenario
        Given a file named "features/a.feature" with:
            """feature
            Feature: Feature
              @foo({"bar":1})
              Scenario: One
                Then the attribute tag "foo" is set to { "bar": 1 }
              @foo({"bar":2})
              Scenario: Two
                Then the attribute tag "foo" is set to { "bar": 2 }
            """
        When I run cucumber-js
        Then it passes

    Scenario: Checking for an attribute tag on the scenario overriding one on the feature
        Given a file named "features/a.feature" with:
            """feature
            @foo({"bar":1})
            Feature: Feature
              Scenario: One
                Then the attribute tag "foo" is set to { "bar": 1 }
              @foo({"not-bar":2})
              Scenario: Two
                Then the attribute tag "foo" is set to { "not-bar": 2 }
            """
        When I run cucumber-js
        Then it passes
```

## Test case 16

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

## Test case 17

```gherkin
Feature: I can use cucumber.mink to check the content of my website

  Background:
    Given I browse "http://localhost:3000/"

  Scenario: Check Homepage content
    Given I am on the homepage
    Then I should see "Home Page"
      And I should not see "Post Detail Page"
      And I should see text matching Post-\d+
      And I should not see text matching .+_@_.+
      And I should see "Home Page" in the "h1" element
      And I should see "Home Page" in the "h1" element text
      And I should not see "Post Detail Page" in the "h1" element
      And I should not see "Post Detail Page" in the "h1" element text
      And I should see an "h2.content-subhead" element
      And the "p.description" element should not exist
      And I should see 3 "section.post" elements

  Scenario Outline: Check Generated content
    Given I am on "<path>"
    Then I should see <count> "section.post" elements

  Examples:
    | path         | count |
    | /generate/7  | 7     |
    | /generate/30 | 30    |
```

## Test case 18

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

## Test case 19

```gherkin
Feature: Driver compatibilities

  Background:
    Given I browse "http://localhost:3000/"

  Scenario: Link
    Given I am on homepage
      And I follow "Post-1"
    Then I should be on "/post/1"
      And I should see "Post-1"

    Given I am on homepage
      And I follow "a[href='/post/1']"
    Then I should be on "/post/1"
      And I should see "Post-1"

    Given I am on homepage
      And I follow "Follow me to form !"
    Then I should be on "/form"
      And I should see "Form Page"

    Given I am on homepage
      And I follow "Follow me to form"
    Then I should be on "/form"
      And I should see "Form Page"

  Scenario: Press
    Given I am on "/form"
      And I press "Button-Register"
    Then I should be on "/result"

    Given I am on "/form"
      And I press "Input-Register"
    Then I should be on "/result"

    Given I am on "/form"
      And I press "button.pure-button"
    Then I should be on "/result"

    Given I am on "/form"
      And I press "Weird button '-' text"
    Then I should be on "/result"
```

## Test case 20

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
