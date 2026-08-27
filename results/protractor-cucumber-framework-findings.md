# protractor-cucumber-framework

**The .feature files are test data, not real specs.**

## What this repo actually is

The thing being tested is `index.js` — a file that lets Protractor run Cucumber. Nothing to write test cases about.

The real tests are 19 Mocha files in `test/*.spec.js`. Each one starts a real `protractor`
process and then checks **what it printed and what exit code it returned**:


## Bugs I found

- `cucumber10.spec.js`, `cucumber11.spec.js`, `cucumber12.spec.js` filter on `@cucumber10` and
  `@cucumber11`, but those tags are in **no** feature file. `cucumber4.feature` stops at
  `@cucumber9`. The specs still expect `1 scenario (1 passed)`.
