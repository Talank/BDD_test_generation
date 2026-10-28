Test name - mutual-tls

## Generated
```ts
/* eslint no-invalid-this: "off" */

'use strict';

const {Given, When, Then} = require('@cucumber/cucumber');

Given(/^I use the mock target$/, async function() {
  // UNMAPPED (missing value): Given I use the mock target
});

Given(/^I have valid client TLS configuration$/, async function() {
  await new Promise((resolve, reject) => {
    this.apickli.setClientTLSConfiguration('valid', function(error) {
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve();
    });
  });
});

When(/^I GET (.*)$/, async function(resource) {
  await new Promise((resolve, reject) => {
    this.apickli.get(resource, function(error) {
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve();
    });
  });
});

Then(/^response code should be (.*)$/, async function(responseCode) {
  const assertion = await this.apickli.assertResponseCode(responseCode);

  if (!assertion.success) {
    throw new Error(JSON.stringify(assertion));
  }
});
```
