Test name - mutual-tls
## Original
```ts
// ---- source/apickli/apickli-gherkin.js ----
Given(/^I have (.+) client TLS configuration$/, function(configurationName, callback) {
  this.apickli.setClientTLSConfiguration(configurationName, function(error) {
    if (error) {
      callback(new Error(error));
    }
    callback();
  });
});
// ---- source/test/features/step_definitions/mock-target.js ----
Given(/^I use the mock target$/, function(callback) {
  this.apickli.domain = 'https://localhost:5000';
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

Then(/^response code should be (.*)$/, function(responseCode, callback) {
  const assertion = this.apickli.assertResponseCode(responseCode);
  callbackWithAssertion(callback, assertion);
});


```

## Generated
```ts
/* eslint new-cap: "off", no-invalid-this: "off" */

'use strict';

const {Given, When, Then} = require('@cucumber/cucumber');

Given(/^I use the mock target$/, async function() {
  // UNMAPPED: I use the mock target
});

Given(/^I have valid client TLS configuration$/, async function() {
  await new Promise((resolve, reject) => {
    this.apickli.setClientTLSConfiguration('valid', function(error) {
      if (error) {
        reject(new Error(error));
      } else {
        resolve();
      }
    });
  });
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

Then(/^response code should be 200$/, async function() {
  const assertion = this.apickli.assertResponseCode('200');

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});
```
