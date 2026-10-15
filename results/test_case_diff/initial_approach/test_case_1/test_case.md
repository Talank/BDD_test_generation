Are these test cases semantically similar?

## Original
```ts
import { Given, Then, When } from "@cucumber/cucumber";
import StringUtil from "../../support/utils/StringUtil";
import CommonPage from "../pages/CommonPage";
import RegisterUserPage from "../pages/RegisterUserPage";
Given("user navigate to registration page", async function () {
  await new CommonPage(this.web).navigateToRegisterUser();
});
When(
  "the user enters the registration details {string}, {string}, {string}, {string}, {string}, {string}, {string}",
  async function (
    firstName,
    lastName,
    email,
    telephone,
    password,
    confirmPassword,
    subscribe,
  ) {
    email = StringUtil.formatString(email, StringUtil.randomNumberString(5));
    await new RegisterUserPage(this.web).enterRegistrationDetails(
      firstName,
      lastName,
      email,
      telephone,
      password,
      confirmPassword,
      subscribe,
    );
    await new RegisterUserPage(this.web).agreePrivacyPolicy();
    await new RegisterUserPage(this.web).clickContinueButton();
  },
);
Then("user should see a message {string}", async function (message) {
  await new CommonPage(this.web).verifyTitleMessage(message);
});
Then("user logs out of application", async function () {
  await new CommonPage(this.web).logout();
});
```

## Generated
```ts
import { Given, When, Then } from "@cucumber/cucumber";
import CommonPage from "../pages/CommonPage";
import HomePage from "../pages/HomePage";
import RegisterUserPage from "../pages/RegisterUserPage";
Given("user is on home page", async function () {
  await new HomePage(this.page).navigateToHomePage();
});
Given("user navigate to registration page", async function () {
  await new CommonPage(this.page).navigateToRegisterUser();
});
When(
  "the user enters the registration details {string}, {string}, {string}, {string}, {string}, {string}, {string}",
  async function (
    firstName,
    lastName,
    email,
    telephone,
    password,
    confirmPassword,
    subscribe,
  ) {
    await new RegisterUserPage(this.page).enterRegistrationDetails(
      firstName,
      lastName,
      email,
      telephone,
      password,
      confirmPassword,
      subscribe,
    );
  },
);
Then("user should see a message {string}", async function (message) {
  await new CommonPage(this.page).verifyTitleMessage(message);
});
Then("user logs out of application", async function () {
  await new CommonPage(this.page).logout();
});
```
