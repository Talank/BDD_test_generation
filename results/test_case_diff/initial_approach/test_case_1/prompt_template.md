# ROLE
You translate BDD (Gherkin) steps into cucumber-js step definitions that call
this project's existing DSL / page-object layer. This is TRANSLATION, not design.
The Gherkin is the COMPLETE source of truth for intent. Do not add, drop, or
"improve" coverage.

Each step's text becomes a binding PATTERN that cucumber-js matches at runtime. A
step definition is written ONCE and is reused by every scenario that shares that
step text.

# HARD RULES
1. Emit one binding (Given/When/Then) per UNIQUE step. Before writing one, check
   REGISTERED STEPS: if a listed pattern already matches this step's text — OR a
   pattern you would write could also match a step already listed there — do NOT
   redefine it. cucumber-js throws on a duplicate or ambiguous registration.
   Skip it and note `// EXISTS: <step text>`.
2. A binding body may CALL only: functions/methods in DSL CATALOG, members
   exposed by WORLD, and custom parameter types in PARAMETER TYPES. Never invent
   a function, page object, method, or parameter type. Reach the DSL exactly the
   way DSL USAGE shows existing steps reaching it (e.g. through `this`, or a
   constructed page object) — do not call a bare method name that has no receiver.
3. Use `async function (...) { ... }` — NEVER an arrow function — so `this` binds
   to the cucumber World.
4. SCENARIO STATE flows between steps ONLY through the World (`this`). Steps are
   separate function bodies with no shared locals: a step that needs a value
   produced by an earlier step READS it from a WORLD member; a step that PRODUCES
   such a value MAY assign it onto `this` (e.g. `this.orderId = await ...`).
   Writing scenario state to `this` is allowed even though it is not a DSL call.
   Do not use module-level mutable variables for per-scenario state unless
   EXISTING STEP DEFINITIONS already does.
5. PARAMETERIZE only what varies as SURFACE syntax — a Cucumber Expression matches
   the literal shape of the text:
   - text that appears QUOTED in the step  → `{string}` (pass the value through)
   - a NUMBER in the step                  → `{int}` / `{float}`
   - a bare (unquoted) word that varies     → use a custom type from PARAMETER
                                              TYPES or an alternation `(a/b)` IF
                                              one applies; OTHERWISE leave it as
                                              LITERAL text in the pattern.
   Do NOT wrap a bare word in `{string}` — `{string}` only matches quoted text, so
   the step would go undefined at runtime. Never hard-code into the DSL call a
   value that came from the step text; pass the captured parameter. Use CONSTANTS
   only for fixed symbolic values.
6. Data tables and doc strings arrive as the LAST parameter (dataTable /
   docString). Hand them to the DSL; don't reconstruct their contents.
7. THINNESS: when a single DSL function performs the step, the body is that ONE
   call — prefer the most specific / highest-level function. Use multiple calls
   only when no single function covers the step. Never rebuild a behavior from
   generic primitives when a higher-level function exists.
8. Failure modes (do not guess):
   - No DSL function fits the action         → `// UNMAPPED: <step text>`
   - Required value not in step/table/CONST  → `// UNMAPPED (missing value): <step text>`
   - Multiple DSL functions match            → prefer the most specific; if still
                                               ambiguous → `// UNMAPPED (ambiguous): <step text>`

# CONVENTIONS (style — not correctness gates)
- And / But inherit the keyword of the preceding Given/When/Then for readability
  (an "And" after a "When" is written `When`). cucumber-js treats Given/When/Then
  as aliases, so this never affects matching — follow it, but don't agonize over it.
- Mirror the binding SHAPE, Cucumber Expression conventions, and call style of
  EXISTING STEP DEFINITIONS. Take SHAPE from them only — do NOT copy their
  coverage, and do not treat a step they already cover as one you must rewrite.

# SCOPE NOTES (the runner handles these — you do NOT)
- Scenario Outline / Examples: write ONE parameterized binding. The runner
  substitutes each `<placeholder>` with its Examples value BEFORE matching, so
  your pattern must match the SUBSTITUTED value (a quoted Examples cell →
  `{string}`, a numeric one → `{int}`), NOT the literal `<placeholder>` token.
  Do not unroll the rows.
- Background: its steps are ordinary steps — define any that are missing.
- @tags: runner-level filtering/hooks. Emit nothing for them unless a tagged hook
  already appears in WORLD or EXISTING STEP DEFINITIONS.

# OUTPUT
Return a COMPLETE, RUNNABLE step-definitions file:
1. An IMPORT BLOCK: `Given`/`When`/`Then` (and any hook you use) from
   `@cucumber/cucumber`, plus every page object / helper / constant your bodies
   call. Import each from the path shown in its `// ---- <path> ----` header,
   written as a correct relative path from a sibling step-definitions file. Keep
   the repo's module style — ESM `import` vs CommonJS `require` — as seen in
   EXISTING STEP DEFINITIONS.
2. The BINDING(S), in Gherkin order, one per unique not-yet-registered step.
No World class, no prose, no explanation outside the file.

Before returning, confirm: every called name is in DSL CATALOG, WORLD, or
PARAMETER TYPES; every quoted/numeric literal is a captured parameter and every
bare literal is intentional; no pattern duplicates or overlaps one in REGISTERED
STEPS; every function is `async function`, not an arrow; every import resolves to
a path shown below.

---
# TASK — write the missing step definitions for this scenario/feature
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
---
# DSL CATALOG  (page objects / helpers — closed set, call ONLY these)
```ts
// ===== PUBLIC SURFACE INDEX (auto-extracted) =====
// src/support/logger/Log.ts
//   - Log#testBegin(scenario: string)
//   - Log#testEnd(scenario: string, status: string)
//   - Log#printLogs(msg: string, separator: string)
//   - Log#info(message: string)
//   - Log#error(error: string)
//   - Log#attachText(attach: ICreateAttachment, message: string)
// src/support/manager/Browser.ts
//   - Browser#async launch()
// src/support/playwright/API/RESTRequest.ts
//   - RESTRequest#async createRequestBody(jsonFileName: string, data: any)
//   - RESTRequest#async post(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonAsString: string, description: string)
//   - RESTRequest#async setRestResponse(attach: ICreateAttachment, response: APIResponse, description: string)
//   - RESTRequest#async get(attach: ICreateAttachment, endPoint: string, requestHeader: any, description: string)
//   - RESTRequest#async put(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonAsString: any, description: string)
//   - RESTRequest#async patch(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonAsString: any, description: string)
//   - RESTRequest#async delete(attach: ICreateAttachment, endPoint: string, requestHeader: any, description: string)
//   - RESTRequest#printRequest(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonRequestBody: string, method: string)
// src/support/playwright/API/RESTResponse.ts
//   - RESTResponse#async getTagContentByJsonPath(jsonPath: string, description: string)
//   - RESTResponse#async getHeaderValueByKey(key: string)
//   - RESTResponse#async getStatusCode()
//   - RESTResponse#async getBody()
//   - RESTResponse#async getHeaders()
// src/support/playwright/API/RequestHeader.ts
//   - RequestHeader#set(key: string, value: any)
//   - RequestHeader#get()
// src/support/playwright/API/SOAPRequest.ts
//   - SOAPRequest#async createRequestBody(attach: ICreateAttachment, xmlFileName: string, data: any)
//   - SOAPRequest#async post(attach: ICreateAttachment, endPoint: string, requestHeader: any, fileName: string, requestData: any, description: string)
// src/support/playwright/API/SOAPResponse.ts
//   - SOAPResponse#async getTagContentByXpath(xPathExpression: string, description: string)
//   - SOAPResponse#async getAttributeValueByXpath(xPathExpression: string, description: string)
//   - SOAPResponse#async getHeaderValueByKey(key: string)
//   - SOAPResponse#async getStatusCode()
//   - SOAPResponse#async getBody()
//   - SOAPResponse#async getHeaders()
// src/support/playwright/actions/AlertActions.ts
//   - AlertActions#async accept(promptText?: string)
//   - AlertActions#async dismiss()
// src/support/playwright/actions/CheckBoxActions.ts
//   - CheckBoxActions#setLocator(locator: Locator, description: string)
//   - CheckBoxActions#async check()
//   - CheckBoxActions#async uncheck()
//   - CheckBoxActions#async isChecked()
// src/support/playwright/actions/DropDownActions.ts
//   - DropDownActions#setLocator(locator: Locator, description: string)
//   - DropDownActions#async selectByValue(value: string)
//   - DropDownActions#async selectByVisibleText(text: string)
//   - DropDownActions#async selectByIndex(index: number)
//   - DropDownActions#async getAllOptions()
//   - DropDownActions#async getAllSelectedOptions()
// src/support/playwright/actions/EditBoxActions.ts
//   - EditBoxActions#setEditBox(selector: string, description: string)
//   - EditBoxActions#setLocator(locator: Locator, description: string)
//   - EditBoxActions#async fill(value: string)
//   - EditBoxActions#async type(value: string)
//   - EditBoxActions#async fillAndTab(value: string)
//   - EditBoxActions#async typeAndTab(value: string)
// src/support/playwright/actions/UIActions.ts
//   - UIActions#getPage()
//   - UIActions#setPage(page: Page)
//   - UIActions#closePage()
//   - UIActions#alert()
//   - UIActions#editBox(selector: string, description: string)
//   - UIActions#element(selector: string, description: string)
//   - UIActions#dropdown(selector: string, description: string)
//   - UIActions#checkbox(selector: string, description: string)
//   - UIActions#async goto(URL: string, description: string)
//   - UIActions#async goBack(description: string)
//   - UIActions#async goForward(description: string)
//   - UIActions#async pageRefresh()
//   - UIActions#async keyPress(key: string, description: string)
//   - UIActions#async waitForNavigation()
//   - UIActions#async waitForLoadState()
//   - UIActions#async waitForDomContentLoaded()
//   - UIActions#async switchToNewWindow(selector: string, description: string)
//   - UIActions#async acceptAlertOnElementClick(selector: string, description: string)
//   - UIActions#async dismissAlertOnElementClick(selector: string, description: string)
//   - UIActions#async acceptPromptOnElementClick(selector: string, description: string, promptText: string)
//   - UIActions#async handleAlert(selector: string, description: string, message: Promise<string>)
//   - UIActions#async getPageTitle()
//   - UIActions#async downloadFile(selector: string, description: string)
//   - UIActions#async pauseInSecs(sec: number)
// src/support/playwright/actions/UIElementActions.ts
//   - UIElementActions#getLocator()
//   - UIElementActions#getLocators()
//   - UIElementActions#setElement(selector: string, description: string)
//   - UIElementActions#setLocator(locator: Locator, description: string)
//   - UIElementActions#async click()
//   - UIElementActions#async doubleClick()
//   - UIElementActions#async scrollIntoView()
//   - UIElementActions#async waitTillInvisible()
//   - UIElementActions#async waitTillDetached()
//   - UIElementActions#async waitTillVisible()
//   - UIElementActions#async waitForPresent()
//   - UIElementActions#async hover()
//   - UIElementActions#async getInputValue()
//   - UIElementActions#async getTextContent()
//   - UIElementActions#async getAttribute(attributeName: string)
//   - UIElementActions#async getInnerHTML()
//   - UIElementActions#async getInnerText()
//   - UIElementActions#async isEditable(sec: number)
//   - UIElementActions#async isEnabled(sec: number)
//   - UIElementActions#async isVisible(sec: number)
//   - UIElementActions#async keyPress(key: string)
//   - UIElementActions#async getAllTextContent()
//   - UIElementActions#async getCount()
//   - UIElementActions#async mouseClick()
//   - UIElementActions#async jsClick()
// src/support/playwright/asserts/Assert.ts
//   - Assert#async assertTrue(condition: boolean, description: string, softAssert = false)
//   - Assert#async assertContains(value1: string, value2: string, description: string, softAssert = false)
//   - Assert#async assertContainsIgnoreCase(value1: string, value2: string, description: string, softAssert = false)
//   - Assert#async assertEqualsIgnoreCase(actual: string, expected: string, description: string, softAssert = false)
//   - Assert#async assertEquals(actual: any, expected: any, description: string, softAssert = false)
//   - Assert#async assertFalse(condition: boolean, description: string, softAssert = false)
//   - Assert#async assertNotContains(actual: any, expected: any, description: string, softAssert = false)
//   - Assert#async assertNotEquals(actual: any, expected: any, description: string, softAssert = false)
//   - Assert#async assertNotNull(value: any, description: string, softAssert = false)
//   - Assert#async assertNull(value: any, description: string, softAssert = false)
//   - Assert#async assertUndefined(value: any, description: string, softAssert = false)
//   - Assert#async assertToBeEmpty(value: any, description: string, softAssert = false)
// src/support/utils/StringUtil.ts
//   - StringUtil#formatString(str: string, ...replaceValue: string[])
//   - StringUtil#formatStringValue(str: string, replaceValue: any)
//   - StringUtil#replaceAll(str: string, searchValue: string, replaceValue: string)
//   - StringUtil#getRegXLocator(str: string, regex: RegExp, value: string)
//   - StringUtil#randomAlphanumericString(length: number)
//   - StringUtil#randomAlphabeticString(length: number)
//   - StringUtil#randomUppercaseString(length: number)
//   - StringUtil#randomLowercaseString(length: number)
//   - StringUtil#randomNumberString(length: number)
//   - StringUtil#formatStringFromObject(str: string, obj: any)
// src/support/utils/XMLParserUtil.ts
//   - XMLParserUtil#getTagContentByXpath(xml: string, xPathExpression: string)
//   - XMLParserUtil#getAttributeValueByXpath(xml: string, xPathExpression: string)
// src/web/pages/CommonPage.ts
//   - CommonPage#async searchProduct(product: string)
//   - CommonPage#async logout()
//   - CommonPage#async navigateToRegisterUser()
//   - CommonPage#async verifyTitleMessage(message: string)
// src/web/pages/HomePage.ts
//   - HomePage#async navigateToHomePage()
// src/web/pages/RegisterUserPage.ts
//   - RegisterUserPage#async enterRegistrationDetails(firstName: string, lastName: string, email: string, telephone: string, password: string, confirmPassword: string, subscribe: string)
//   - RegisterUserPage#async agreePrivacyPolicy()
//   - RegisterUserPage#async clickContinueButton()
// src/web/pages/SearchResultsPage.ts
//   - SearchResultsPage#async verifySearchResult(product: string)
//   - SearchResultsPage#async verifyInvalidSearchMessage(message: string)

// ---- src/support/logger/Log.ts ----
import { ICreateAttachment } from '@cucumber/cucumber/lib/runtime/attachment_manager';
import winston from 'winston';

const Logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.uncolorize({ level: true, message: true, raw: true }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.align(),
                winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
            ),
        }),
        new winston.transports.File({
            filename: 'test-results/logs/execution.log',
            format: winston.format.combine(
                winston.format.uncolorize({ level: true, message: true, raw: true }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.align(),
                winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
            ),
        }),
    ],
});

const TEST_SEPARATOR = "##############################################################################";

export default class Log {
    public static testBegin(scenario: string): void {
        this.printLogs(`Scenario: ${scenario} - Started`, TEST_SEPARATOR);
    }
 
    public static testEnd(scenario: string, status: string): void {
        this.printLogs(`Scenario: ${scenario} - ${status}`, TEST_SEPARATOR);
    }

    private static printLogs(msg: string, separator: string) {
        Logger.info(separator);
        Logger.info(`${msg.toUpperCase()}`);
        Logger.info(separator);
    }

    public static info(message: string): void {
        Logger.info(message);
    }

    public static error(error: string): void {
        Logger.error(error);
    }

    public static attachText(attach: ICreateAttachment, message: string): void {
        Logger.info(message);
        attach(message);
    }
}

// ---- src/support/manager/Browser.ts ----
import { chromium, ChromiumBrowser, firefox, FirefoxBrowser, LaunchOptions, webkit, WebKitBrowser } from "@playwright/test";
import BrowserConstants from "../constants/BrowserConstants";

const browserOptions: LaunchOptions = {
    slowMo: 50,
    args: ["--start-maximized", "--disable-extensions", "--disable-plugins"],
    firefoxUserPrefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true,
    },
    headless: false,
    timeout: Number.parseInt(process.env.BROWSER_LAUNCH_TIMEOUT, 10),
    downloadsPath: "./test-results/downloads",
};

export default class Browser {
    public static async launch() {
        const browserType = process.env.BROWSER;
        let browser: ChromiumBrowser | FirefoxBrowser | WebKitBrowser;
        if (BrowserConstants.FIREFOX === browserType) {
            browser = await firefox.launch(browserOptions);
        } else if (BrowserConstants.WEBKIT === browserType) {
            browser = await webkit.launch(browserOptions);
        } else {
            browser = await chromium.launch(browserOptions);
        }
        return browser;
    }
    /*
        public static channel() {
            const browser = process.env.BROWSER.toLowerCase();
            let browserChannel;
            if (browser === BrowserConstants.CHROME) {
                browserChannel = BrowserConstants.CHROME;
            } else if (browser === BrowserConstants.EDGE) {
                browserChannel = BrowserConstants.MSEDGE;
            } else {
                browserChannel = BrowserConstants.BLANK;
            }
            return browserChannel;
        }   */
}

// ---- src/support/playwright/API/RESTRequest.ts ----
import { Page, APIResponse } from '@playwright/test';
import fs from 'fs';
import fetchToCurl from 'fetch-to-curl';
import CommonConstants from '../../constants/CommonConstants';
import StringUtil from '../../utils/StringUtil';
import RESTResponse from "./RESTResponse";
import Log from '../../logger/Log';
import { ICreateAttachment } from '@cucumber/cucumber/lib/runtime/attachment_manager';

export default class RESTRequest {
    constructor(private page: Page) { }
    /**
     * Creates request body from JSON file by replacing the input parameters
     * @param jsonFileName 
     * @param data 
     * @returns 
     */
    public async createRequestBody(jsonFileName: string, data: any): Promise<string> {
        let json = fs.readFileSync(CommonConstants.REST_JSON_REQUEST_PATH + jsonFileName, 'utf-8');
        json = StringUtil.formatStringValue(json, data);
        return json;
    }
    /**
     * Make POST request and return response
     * @param endPoint 
     * @param requestHeader 
     * @param jsonAsString
     * @param description 
     * @returns 
     */
    public async post(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonAsString: string,
        description: string): Promise<RESTResponse> {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log.info(`Making POST request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, jsonAsString, 'post');
        const response = await this.page.request.post(endPoint,
            { headers: headersAsJson, data: JSON.parse(jsonAsString) });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Sets the API Response into RestResponse object
     * @param response 
     * @param description 
     * @returns RestResponse object
     */
    private async setRestResponse(attach: ICreateAttachment, response: APIResponse, description: string): Promise<RESTResponse> {
        const body = await response.text();
        const headers = response.headers();
        const statusCode = response.status();
        const restResponse: RESTResponse = new RESTResponse(headers, body, statusCode, description);  
        const responseBody = body === CommonConstants.BLANK ? CommonConstants.BLANK : JSON.stringify(JSON.parse(body), undefined, 2);
        Log.attachText(attach, `Response body: ${responseBody}`);    
        return restResponse;
    }
    /**
     * Make Get request and return response
     * @param endPoint 
     * @param requestHeader 
     * @param description 
     * @returns 
     */
    public async get(attach: ICreateAttachment, endPoint: string, requestHeader: any, description: string): Promise<RESTResponse> {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log.info(`Making GET request for ${description}`);
        this.printRequest(attach ,endPoint, headersAsJson, null, 'get');
        const response = await this.page.request.get(endPoint, { headers: headersAsJson });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Make Put request and return response
     * @param endPoint 
     * @param requestHeader 
     * @param jsonAsString 
     * @param description 
     * @returns 
     */
    public async put(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonAsString: any,
        description: string): Promise<RESTResponse> {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log.info(`Making PUT request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, jsonAsString, 'put');
        const response = await this.page.request.put(endPoint,
            { headers: headersAsJson, data: JSON.parse(jsonAsString) });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Make Patch request and return response
     * @param endPoint 
     * @param requestHeader 
     * @param jsonAsString 
     * @param description 
     * @returns 
     */
    public async patch(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonAsString: any,
        description: string): Promise<RESTResponse> {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log.info(`Making PATCH request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, jsonAsString, 'patch');
        const response = await this.page.request.patch(endPoint,
            { headers: headersAsJson, data: JSON.parse(jsonAsString) });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Make Delete request and return response
     * @param endPoint 
     * @param requestHeader 
     * @param description 
     * @returns 
     */
    public async delete(attach: ICreateAttachment, endPoint: string, requestHeader: any, description: string): Promise<RESTResponse> {
        const headersAsJson = JSON.parse(JSON.stringify(requestHeader));
        Log.info(`Making DELETE request for ${description}`);
        this.printRequest(attach, endPoint, headersAsJson, null, 'delete');
        const response = await this.page.request.delete(endPoint, { headers: headersAsJson });
        return await this.setRestResponse(attach, response, description);
    }
    /**
     * Prints the API request on console in curl format
     * @param endPoint 
     * @param requestHeader 
     * @param jsonRequestBody 
     * @param method 
     */
    private printRequest(attach: ICreateAttachment, endPoint: string, requestHeader: any, jsonRequestBody: string, method: string) {
        let requestBody = jsonRequestBody;
        if (jsonRequestBody !== null) {
            requestBody = JSON.stringify(JSON.parse(jsonRequestBody), undefined, 2);
        }
        Log.attachText(attach, `Request:  ${fetchToCurl({
            url: endPoint,
            headers: requestHeader,
            body: requestBody,
            method: method,
        })}`);
    }
}

// ---- src/support/playwright/API/RESTResponse.ts ----
import jp from "jsonpath";
import Log from "../../logger/Log";

export default class RESTResponse {
    public constructor(private headers: any, private body: string, private status: number,
        private description: string) { }

    /**
     * Get content of tag in response body using JSON path
     * @param jsonPath 
     * @param description 
     * @returns 
     */
    public async getTagContentByJsonPath(jsonPath: string, description: string): Promise<string> {
        Log.info(`Getting content of ${description}`);
        // eslint-disable-next-line prefer-destructuring
        return jp.query(JSON.parse(this.body), jsonPath)[0];
    }

    /**
     * Get header value by header key
     * @param key 
     * @returns 
     */
    public async getHeaderValueByKey(key: string): Promise<string> {
        Log.info(`Getting header value of ${key}`);
        const jsonHeaders = await JSON.parse(JSON.stringify(this.headers));
        return jsonHeaders[key];
    }

    /**
     * Get response status code
     * @returns 
     */
    public async getStatusCode(): Promise<number> {
        Log.info(`Getting status code of ${this.description}`);
        return this.status;
    }

    /**
    * Get response body
    * @returns 
    */
    public async getBody(): Promise<string> {
        Log.info(`Getting response body of ${this.description}`);
        return this.body;
    }

    /**
     * Get response headers 
     * @returns 
     */
    public async getHeaders(): Promise<string> {
        Log.info(`Getting response Headers of ${this.description}`);
        return this.headers;
    }
}

// ---- src/support/playwright/API/RequestHeader.ts ----
export default class RequestHeader {
    private map = new Map<string, any>();

    public set(key: string, value: any): RequestHeader {
        this.map.set(key, value);
        return this;
    }

    public get() {
        return Object.fromEntries(this.map);
    }
}

// ---- src/support/playwright/API/SOAPRequest.ts ----
import soapRequest from "easy-soap-request";
import format from "xml-formatter";
import fs from 'fs';
import SOAPResponse from "./SOAPResponse";
import StringUtil from "../../utils/StringUtil";
import CommonConstants from "../../constants/CommonConstants";
import Log from "../../logger/Log";
import { ICreateAttachment } from "@cucumber/cucumber/lib/runtime/attachment_manager";

export default class SOAPRequest {
    /**
     * Creates request body by replacing the input parameters
     * @param xmlFileName 
     * @param data 
     * @returns 
     */
    private async createRequestBody(attach: ICreateAttachment, xmlFileName: string, data: any): Promise<string> {
        let xml = fs.readFileSync(CommonConstants.SOAP_XML_REQUEST_PATH + xmlFileName, 'utf-8');
        xml = StringUtil.formatStringValue(xml, data);
        Log.attachText(attach, `SOAP request : \n${format(xml, { collapseContent: true })}`);
        return xml;
    }

    /**
     * Make POST request and return response
     * @param endPoint 
     * @param requestHeader 
     * @param fileName 
     * @param gData 
     * @param data 
     * @param description 
     * @returns 
     */
    public async post(attach: ICreateAttachment, endPoint: string, requestHeader: any, fileName: string,
        requestData: any, description: string): Promise<SOAPResponse> {
        Log.info(`Making SOAP request for ${description}`);
        Log.attachText(attach, `URL: ${endPoint}`);
        const xml = await this.createRequestBody(attach, fileName, requestData);        
        const { response } = await soapRequest({ url: endPoint, headers: requestHeader, xml: xml });
        const { headers, body, statusCode } = response;
        Log.attachText(attach, `SOAP Response: \n${format(body, { collapseContent: true })}`);
        return new SOAPResponse(headers, body, statusCode, description);
    }
}

// ---- src/support/playwright/API/SOAPResponse.ts ----
import Log from "../../logger/Log";
import XMLParserUtil from "../../utils/XMLParserUtil";

export default class SOAPResponse {
    public constructor(private headers: any, private body: any, private status: number, private description: string) { }
    /**
     * Get content of tag in response body using xpath
     * @param xPathExpression xpath for the tag
     * @param description 
     */
    public async getTagContentByXpath(xPathExpression: string, description: string): Promise<string> {
        Log.info(`Getting tag value of action ${description}`);
        return XMLParserUtil.getTagContentByXpath(this.body, xPathExpression);
    }

    /**
     * Get value of attribute in response body using xpath
     * @param xPathExpression xpath for the attribute
     * @param description 
     */
    public async getAttributeValueByXpath(xPathExpression: string, description: string): Promise<string> {
        Log.info(`Getting attribute value of action ${description}`);
        return XMLParserUtil.getAttributeValueByXpath(this.body, xPathExpression);
    }

    /**
     * Get header value by header key
     * @param key 
     * @returns 
     */
    public async getHeaderValueByKey(key: string): Promise<string> {
        Log.info(`Getting header value of ${key}`);
        const jsonHeaders = await JSON.parse(JSON.stringify(this.headers));
        return jsonHeaders[key];
    }

    /**
     * Get response status code
     * @returns 
     */
    public async getStatusCode(): Promise<number> {
        Log.info(`Getting status code of ${this.description}`);
        return this.status;
    }

    /**
     * Get response body
     * @returns 
     */
    public async getBody(): Promise<string> {
        Log.info(`Getting response body of ${this.description}`);
        return this.body;
    }

    /**
     * Get response headers 
     * @returns 
     */
    public async getHeaders(): Promise<string> {
        Log.info(`Getting response Headers of ${this.description}`);
        return JSON.stringify(this.headers);
    }
}

// ---- src/support/playwright/actions/AlertActions.ts ----
import { Page } from "@playwright/test";

export default class AlertActions {
  constructor(private page: Page) {}

  /**
   * Accept alert and return alert message
   * @param promptText A text to enter in prompt. It is optional for alerts.
   * @returns alert message
   */
  public async accept(promptText?: string): Promise<string> {
    return this.page.waitForEvent("dialog").then(async (dialog) => {
      if (dialog.type() === "prompt") {
        await dialog.accept(promptText);
      } else {
        await dialog.accept();
      }
      return dialog.message().trim();
    });
  }

  /**
   * Dismiss alert and return alert message
   * @returns alert message
   */
  public async dismiss(): Promise<string> {
    return this.page.waitForEvent("dialog").then(async (d) => {
      await d.dismiss();
      return d.message().trim();
    });
  }
}

// ---- src/support/playwright/actions/CheckBoxActions.ts ----
import { Locator } from "@playwright/test";
import CommonConstants from "../../constants/CommonConstants";
import Log from "../../logger/Log";

export default class CheckBoxActions {
  private locator: Locator;
  private description: string;

  /**
   * Sets the locator with description
   * @param locator
   * @param description
   * @returns
   */
  public setLocator(locator: Locator, description: string): CheckBoxActions {
    this.locator = locator;
    this.description = description;
    return this;
  }

  /**
   * check checkbox or radio button
   */
  public async check() {
    Log.info(`Check ${this.description}`);
    await this.locator.check();
    return this;
  }

  /**
   * uncheck checkbox or radio button
   */
  public async uncheck() {
    Log.info(`Uncheck ${this.description}`);
    await this.locator.uncheck();
    return this;
  }

  /**
   * Returns the status of the checkbox
   * @returns
   */
  public async isChecked(): Promise<boolean> {
    Log.info(`Checking status of checkbox ${this.description}`);
    const element = this.locator;
    await element.waitFor({ state: "visible", timeout: CommonConstants.WAIT });
    return await this.locator.isChecked();
  }
}

// ---- src/support/playwright/actions/DropDownActions.ts ----
import { Locator } from "@playwright/test";
import CommonConstants from "../../constants/CommonConstants";
import HTMLConstants from "../../constants/HTMLConstants";
import Log from "../../logger/Log";

export default class DropDownActions {
  private locator: Locator;
  private description: string;

  /**
   * Sets the locator with description
   * @param locator
   * @param description
   * @returns
   */
  public setLocator(locator: Locator, description: string): DropDownActions {
    this.locator = locator;
    this.description = description;
    return this;
  }

  /**
   * Select the dropdown by value
   * @param value
   * @returns
   */
  public async selectByValue(value: string) {
    Log.info(`Selecting value ${value} from ${this.description}`);
    await this.locator.selectOption({ value });
    return this;
  }

  /**
   * Select the dropdown by Label
   * @param text
   * @returns
   */
  public async selectByVisibleText(text: string) {
    Log.info(`Selecting text ${text} from ${this.description}`);
    await this.locator.selectOption({ label: text });
    return this;
  }

  /**
   * Select the dropdown by index
   * @param index
   * @returns
   */
  public async selectByIndex(index: number) {
    Log.info(`Selecting index ${index} of ${this.description}`);
    await this.locator.selectOption({ index });
    return this;
  }

  /**
   * Gets all the options in dropdown
   * @param index
   * @returns
   */
  public async getAllOptions(): Promise<string[]> {
    Log.info(`Getting all the options of ${this.description}`);
    await this.locator.waitFor({state: "visible", timeout: CommonConstants.WAIT});
    return await this.locator.locator(HTMLConstants.OPTION).allTextContents();
  }

  /**
   * Gets all the selected options in dropdown
   * @param index
   * @returns
   */
  public async getAllSelectedOptions(): Promise<string[]> {
    Log.info(`Getting all the selected options of ${this.description}`);
    await this.locator.waitFor({ state: "visible", timeout: CommonConstants.WAIT });
    return await this.locator.locator(HTMLConstants.SELECTED_OPTION).allTextContents();
  }
}

// ---- src/support/playwright/actions/EditBoxActions.ts ----
import { Locator } from "@playwright/test";
import Log from "../../logger/Log";
import UIElementActions from "./UIElementActions";

export default class EditBoxActions extends UIElementActions {
  /**
   * Sets the selector with description
   * @param selector
   * @param description
   * @returns
   */
  public setEditBox(selector: string, description: string): EditBoxActions {
    this.setElement(selector, description);
    return this;
  }

  /**
   * Sets the locator with description
   * @param locator
   * @returns
   */
  public setLocator(locator: Locator, description: string): EditBoxActions {
    super.setLocator(locator, description);
    return this;
  }

  /**
   * Clear and enter text
   * @param value
   * @returns
   */
  public async fill(value: string) {
    Log.info(`Entering ${this.description} as ${value}`);
    await this.getLocator().fill(value);
    return this;
  }

  /**
   * Types the value to text field
   * @param value
   * @returns
   */
  public async type(value: string) {
    Log.info(`Typing ${this.description} as ${value}`);
    await this.getLocator().type(value);
    return this;
  }

  /**
   * Enter text and hit tab key
   * @param value
   * @returns
   */
  public async fillAndTab(value: string) {
    Log.info(`Entering ${this.description} as ${value} and Tab`);
    await this.getLocator().fill(value);
    await this.getLocator().press("Tab");
    return this;
  }

  /**
   * Typing text and hit tab key
   * @param value
   * @returns
   */
  public async typeAndTab(value: string) {
    Log.info(`Entering ${this.description} as ${value} and Tab`);
    await this.getLocator().type(value);
    await this.getLocator().press("Tab");
    return this;
  }
}

// ---- src/support/playwright/actions/UIActions.ts ----
import { Page } from "@playwright/test";
import CommonConstants from "../../constants/CommonConstants";
import Log from "../../logger/Log";
import AlertActions from "./AlertActions";
import CheckBoxActions from "./CheckBoxActions";
import DropDownActions from "./DropDownActions";
import EditBoxActions from "./EditBoxActions";
import UIElementActions from "./UIElementActions";

export default class UIActions {
  private elementAction: UIElementActions;
  private editBoxAction: EditBoxActions;
  private checkboxAction: CheckBoxActions;
  private dropdownAction: DropDownActions;
  private alertAction: AlertActions;

  constructor(private page: Page) {
    this.elementAction = new UIElementActions(page);
    this.editBoxAction = new EditBoxActions(page);
    this.checkboxAction = new CheckBoxActions();
    this.dropdownAction = new DropDownActions();
    this.alertAction = new AlertActions(this.page);
  }

  /**
   * Returns page object
   * @returns
   */
  public getPage(): Page {
    return this.page;
  }

  /**
   * Sets the page
   * @param page
   */
  public setPage(page: Page) {
    this.page = page;
    this.elementAction = new UIElementActions(page);
    this.editBoxAction = new EditBoxActions(page);
    this.alertAction = new AlertActions(this.page);
  }

  /**
   * Close page 
   * @returns 
   */
  public closePage() {
    this.page.close();
  }

  /**
   * Returns the instance of Alert
   * @returns
   */
  public alert() {
    return this.alertAction;
  }

  /**
   * Returns the instance of editbox actions
   * @param selector
   * @param description
   * @returns
   */
  public editBox(selector: string, description: string) {
    return this.editBoxAction.setEditBox(selector, description);
  }

  /**
   * Returns the instance of UIElements actions
   * @param selector
   * @param description
   * @returns
   */
  public element(selector: string, description: string) {
    return this.elementAction.setElement(selector, description);
  }

  /**
   * Returns the instance of Dropdown actions
   * @param selector
   * @param description
   * @returns
   */
  public dropdown(selector: string, description: string) {
    return this.dropdownAction.setLocator(this.elementAction.setElement(selector, description).getLocator(), description);
  }

  /**
   * Returns the instance of CheckBox actions
   * @param selector
   * @param description
   * @returns
   */
  public checkbox(selector: string, description: string) {
    return this.checkboxAction.setLocator(this.elementAction.setElement(selector, description).getLocator(), description);
  }

  /**
   * Navigate to specified URL
   * @param URL
   * @param description
   */
  public async goto(URL: string, description: string) {
    Log.info(`Navigate to ${description}`);
    await this.page.goto(URL, {timeout: CommonConstants.WAIT, waitUntil: "load"});
  }

  /**
   * Navigate to previous URL
   * @param description
   */
  public async goBack(description: string) {
    Log.info(`Go to the previous ${description}`);
    await this.page.goBack({ timeout: CommonConstants.WAIT, waitUntil: "load" });
  }

  /**
   * Navigate to next URL
   * @param description
   */
  public async goForward(description: string) {
    Log.info(`Go to the next ${description}`);
    await this.page.goForward({ timeout: CommonConstants.WAIT, waitUntil: "load" });
  }

  /**
   * Page Refresh
   */
  public async pageRefresh() {
    Log.info(`Page Refresh`);
    await this.page.reload({ timeout: CommonConstants.WAIT, waitUntil: "load" });
  }

  /**
   * Press a key on web page
   * @param key
   * @param description
   */
  public async keyPress(key: string, description: string) {
    Log.info(`Pressing ${description}`);
    await this.page.keyboard.press(key);
  }

  /**
   * Waits for the main frame navigation and returns the main resource response.
   */
  public async waitForNavigation() {
    Log.info(`Waiting for navigation`);
    await this.page.waitForNavigation();
  }

  /**
   * Returns when the required load state has been reached.
   */
  public async waitForLoadState() {
    Log.info(`Waiting for load event`);
    await this.page.waitForLoadState("load", { timeout: CommonConstants.WAIT });
  }

  /**
   * Returns when the required dom content is in loaded state.
   */
  public async waitForDomContentLoaded() {
    Log.info(`Waiting for load event`);
    await this.page.waitForLoadState("domcontentloaded", { timeout: CommonConstants.WAIT });
  }

  /**
   * Gets the handle of the new window
   * @param selector
   * @param description
   */
  public async switchToNewWindow(selector: string, description: string): Promise<Page> {
    let [newPage] = [this.page];
    Log.info(`Opening  ${description} Window`);
    [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      await this.elementAction.setElement(selector, description).click(),
    ]);
    await this.waitForDomContentLoaded();
    return newPage;
  }

  /**
   * Clicks the an element, accepts the alert and returns the alert message
   * @param selector  selector of the element
   * @param description description of element
   * @returns alert message
   */
  public async acceptAlertOnElementClick(selector: string, description: string): Promise<string> {
    const message = this.alert().accept();
    return this.handleAlert(selector, description, message);
  }

  /**
   * Clicks the an element, dismisses the alert and returns the alert message
   * @param selector  selector of the element
   * @param description description of element
   * @returns alert message
   */
  public async dismissAlertOnElementClick(selector: string, description: string): Promise<string> {
    const message = this.alert().dismiss();
    return this.handleAlert(selector, description, message);
  }

  /**
   * Clicks the an element, accepts the alert prompt and returns the alert message
   * @param selector  selector of the element
   * @param description description of element
   * @param promptText A text to enter in prompt.
   * @returns alert message
   */
  public async acceptPromptOnElementClick(selector: string, description: string, promptText: string): Promise<string> {
    const message = this.alert().accept(promptText);
    return this.handleAlert(selector, description, message);
  }

  private async handleAlert(selector: string, description: string, message: Promise<string>): Promise<string> {
    await this.elementAction.setElement(selector, description).click();
    return message;
  }

  /**
   * Gets the page Title
   * @returns
   */
  public async getPageTitle(): Promise<string> {
    let title: string;
    title = await this.page.title();
    Log.info(`Getting Page Title: ${title}`)
    return title;
  }

  /**
   * Downloads the file and returns the downloaded file name
   * @param selector element that results in file download
   * @param description description of the element
   * @returns downloaded file name
   */
  public async downloadFile(selector: string, description: string): Promise<string> {
    let fileName: string;
    Log.info(`Downloading ${description} file`);
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CommonConstants.WAIT }),
      await this.page.locator(selector).click({ modifiers: ["Alt"] }),
    ]);
    fileName = download.suggestedFilename();
    const filePath = `${CommonConstants.DOWNLOAD_PATH}${fileName}`;
    await download.saveAs(filePath);
    await download.delete();
    return fileName;
  }
  /**
   * Pause the execution in seconds
   * @param sec
   */
  public async pauseInSecs(sec: number) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, sec * CommonConstants.ONE_THOUSAND));
  }
}

// ---- src/support/playwright/actions/UIElementActions.ts ----
import { Locator, Page } from "@playwright/test";
import CommonConstants from "../../constants/CommonConstants";
import Log from "../../logger/Log";

export default class UIElementActions {
  protected locator: Locator;
  protected description: string;
  protected selector: string;

  constructor(private page: Page) { }

  /**
   * Returns the first locator
   * @returns
   */
  public getLocator(): Locator {
    return this.locator.first();
  }

  /**
   * Returns the all the locators
   * @returns
   */
  public getLocators(): Locator {
    return this.locator;
  }

  /**
   * Sets the locator using the selector * 
   * @param selector 
   * @param description
   * @returns
   */
  public setElement(selector: string, description: string): UIElementActions {
    this.selector = selector;
    this.locator = this.page.locator(this.selector);
    this.description = description;
    return this;
  }

  /**
   * Sets the locator with description
   * @param locator
   * @param description
   * @returns
   */
  public setLocator(locator: Locator, description: string): UIElementActions {
    this.locator = locator;
    this.description = description;
    return this;
  }

  /**
   * Click on element
   * @returns
   */
  public async click() {
    Log.info(`Clicking on ${this.description}`);
    await this.getLocator().click();
    return this;
  }

  /**
   * Double click on element
   * @returns
   */
  public async doubleClick() {
    Log.info(`Double Clicking ${this.description}`);
    await this.getLocator().dblclick();
    return this;
  }

  /**
   * scroll element into view, unless it is completely visible
   * @returns
   */
  public async scrollIntoView() {
    Log.info(`Scroll to element ${this.description}`);
    await this.getLocator().scrollIntoViewIfNeeded();
    return this;
  }

  /**
   * Wait for element to be invisible
   * @returns
   */
  public async waitTillInvisible() {
    Log.info(`Waiting for ${this.description} to be invisible`);
    await this.getLocator().waitFor({ state: "hidden", timeout: CommonConstants.WAIT });
    return this;
  }

  /**
   * wait for element not to be present in DOM
   * @returns
   */
  public async waitTillDetached() {
    Log.info(`Wait for ${this.description} to be detached from DOM`);
    await this.getLocator().waitFor({ state: "detached", timeout: CommonConstants.WAIT });
    return this;
  }

  /**
   * wait for element to be visible
   * @returns
   */
  public async waitTillVisible() {
    Log.info(`Wait for ${this.description} to be visible in DOM`);
    await this.getLocator().waitFor({ state: "visible", timeout: CommonConstants.WAIT });
    return this;
  }

  /**
   * wait for element to be attached to DOM
   * @returns
   */
  public async waitForPresent() {
    Log.info(`Wait for ${this.description} to attach to DOM`);
    await this.getLocator().waitFor({ state: "attached", timeout: CommonConstants.WAIT });
    return this;
  }

  /**
   * This method hovers over the element
   */
  public async hover() {
    Log.info(`Hovering on ${this.description}`);
    await this.getLocator().hover();
    return this;
  }

  /**
   * Returns input.value for <input> or <textarea> or <select> element.
   * @returns
   */
  public async getInputValue(): Promise<string> {
    Log.info(`Getting input value of ${this.description}`);
    await this.waitTillVisible();
    return await this.getLocator().inputValue();
  }

  /**
   * Gets the text content
   * @returns
   */
  public async getTextContent(): Promise<string> {
    Log.info(`Getting text content of ${this.description}`);
    await this.waitTillVisible();
    return (await this.getLocator().textContent()).trim();
  }

  /**
   * Get Attribute value
   * @param attributeName
   * @returns
   */
  public async getAttribute(attributeName: string): Promise<string> {
    Log.info(`Getting attribute value of ${this.description}`);
    await this.waitTillVisible();
    return (await this.getLocator().getAttribute(attributeName)).trim();
  }

  /**
   * Get innerHTML
   * @returns
   */
  public async getInnerHTML(): Promise<string> {
    Log.info(`Get innerHTML of ${this.description}`);
    await this.waitTillVisible();
    return (await this.getLocator().innerHTML()).trim();
  }

  /**
   * Get inner text
   * @returns
   */
  public async getInnerText(): Promise<string> {
    Log.info(`Get inner text of ${this.description}`);
    const element = this.getLocator();
    await this.waitTillVisible();
    return (await element.innerText()).trim();
  }

 /**
  * checks if element is editable
  * @param sec 
  * @returns 
  */
  public async isEditable(sec: number): Promise<boolean> {
    Log.info(`Checking if ${this.description} is editable`);
    const element = this.getLocator();
    return await element.isEditable({ timeout: sec * CommonConstants.ONE_THOUSAND });
  }

  /**
   * checks if element is enabled
   * @param sec
   * @returns Promise<boolean>
   */
  public async isEnabled(sec: number): Promise<boolean> {
    Log.info(`Checking if ${this.description} is enabled`);
    const element = this.getLocator();
    return await element.isEnabled({ timeout: sec * CommonConstants.ONE_THOUSAND });
  }

  /**
   * checks if element is visible
   * @param sec time for element to be visible
   * @returns Promise<boolean>
   */
  public async isVisible(sec: number): Promise<boolean> {
    let visibility: boolean;
    Log.info(`Checking if ${this.description} is visible`);
    try {
      visibility = await this.getLocator().isVisible({ timeout: sec * CommonConstants.ONE_THOUSAND });
    } catch (error) {
      visibility = false;
    }
    return visibility;
  }

  /**
   * Press a key on web element
   * @param key
   */
  public async keyPress(key: string) {
    Log.info(`Pressing ${this.description}`);
    await this.getLocator().press(key);
    return this;
  }

  /**
   * Get all the text Content
   * @returns
   */
  public async getAllTextContent(): Promise<string[]> {
    Log.info(`Getting all the text content of ${this.description}`);
    await this.waitTillVisible();
    return await this.getLocators().allTextContents();
  }

  /**
   * Get the count of
   * @returns
   */
  public async getCount(): Promise<number> {
    Log.info(`Getting the count of ${this.description}`);
    return await this.getLocators().count();
  }
  /**
   * Performs mouse click action on the element
   * @returns 
   */
  public async mouseClick() {
    Log.info(`Clicking on ${this.description}`);
    await this.getLocator().scrollIntoViewIfNeeded();
    const box = await this.getLocator().boundingBox();
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    return this;
  }
  /**
   * Click on element using js
   * @returns
   */
  public async jsClick() {
    Log.info(`Clicking on ${this.description}`);
    await this.waitTillVisible();
    await this.getLocator().evaluate((node: HTMLElement) => { node.click(); });
    return this;
  }
}

// ---- src/support/playwright/asserts/Assert.ts ----
import { test, expect } from "@playwright/test";
import Log from "../../logger/Log";

export default class Assert {
    /**
     * To verify that condition passed as input is true
     * @param condition - boolean condition
     * @param description - description of element that is being validated
     * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertTrue(condition: boolean, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is true`);
        try {
            expect(condition, `Expected is 'True' & Actual is '${condition}'`).toBeTruthy();
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
    /**
     * To verify that value1 contains value2
     * @param value1 - string input
     * @param value2 - should be present in value1
     * @param description - description of element that is being validated
     * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertContains(value1: string, value2: string, description: string, softAssert = false) {
        Log.info(`Verifying that ${description}: '${value1}' contains text '${value2}'`);
        try {
            expect(value1, `'${value1}' is expected to CONTAIN '${value2}'`).toContain(value2);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
    * To verify that value1 contains value1 ignoring case
    * @param value1 - string input
    * @param value2 - should be present in value1
    * @param description - description of element that is being validated
    * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
    */
    public static async assertContainsIgnoreCase(value1: string, value2: string, description: string,
        softAssert = false) {
        Log.info(`Verifying that ${description}: '${value1}' contains text '${value2}'`);
        try {
            expect(value1.toLowerCase(), `'${value1}' is expected to CONTAIN '${value2}'`).toContain(value2.toLowerCase());
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
   * To verify that actual contains expected ignoring case
   * @param actual - string input
   * @param expected - string input
   * @param description - description of element that is being validated
   * @param softAssert - for soft asserts this has to be set to true, else this can be ignored
   */
    public static async assertEqualsIgnoreCase(actual: string, expected: string, description: string,
        softAssert = false) {
        Log.info(`Verifying that ${description} has text ${expected}`);
        try {
            expect(actual.toLowerCase(), `Expected '${expected}' should be EQUAL to Actual '${actual}'`)
                .toEqual(expected.toLowerCase());
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
     * To verify actual equals expected
     * @param value1 any object
     * @param value2 any object to compare
     * @param description object description
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertEquals(actual: any, expected: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} has text '${expected}'`);
        try {
            expect(actual, `Expected '${expected}' should be EQUAL to Actual '${actual}'`).toEqual(expected);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
     * To verify that actual passed as input is false
     * @param condition boolean
     * @param description description of element that is being validated
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertFalse(condition: boolean, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is false`);
        try {
            expect(condition, `Expected is 'false' & Acutal is '${condition}'`).toBeFalsy();
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
    * To verify that element not contains expected
    * @param actual any value 
    * @param expected any value
    * @param description description of element that is being validated
    * @param softAssert for soft asserts this has to be set to true, else this can be ignored
    */
    public static async assertNotContains(actual: any, expected: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} does not contain '${expected}'`);
        try {
            await expect(actual, `'${actual}' should NOT CONTAIN '${expected}'`).not.toContain(expected);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
     * To verify actual not equals to expected
     * @param actual any object
     * @param expected any object to compare
     * @param description object description
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertNotEquals(actual: any, expected: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is not equals to ${expected}`);
        try {
            expect(actual, `Expected '${expected}' should NOT be EQUAL to Actual '${actual}'`).not.toEqual(expected);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
     * To verify value not equals to null
     * @param value any value
     * @param description description of the value
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertNotNull(value: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is not null`);
        try {
            expect(value, `Expected is 'NOT null' & Actual is '${value}'`).not.toEqual(null);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
     * To validate that value is not null
     * @param value any value
     * @param description description of the element
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertNull(value: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is equals to null`);
        try {
            expect(value, `Expected is 'null' & Actual is '${value}'`).toEqual(null);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
    * To validate that value is Undefined
    * @param value any value
    * @param description description of the element
    * @param softAssert for soft asserts this has to be set to true, else this can be ignored
    */
    public static async assertUndefined(value: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is undefined`);
        try {
            expect(value, `Expected is 'Undefined' & Actual is '${value}'`).toEqual(typeof undefined);
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }

    /**
     * To validate that element is empty
     * @param value any element
     * @param description description of the element
     * @param softAssert for soft asserts this has to be set to true, else this can be ignored
     */
    public static async assertToBeEmpty(value: any, description: string, softAssert = false) {
        Log.info(`Verifying that ${description} is empty`);
        try {
            await expect(value, `Expected is 'Empty' & Actual is '${value}'`).toBeEmpty();
        } catch (error) {
            if (!softAssert) {
                throw new Error(error);
            }
        }
    }
}

// ---- src/support/utils/StringUtil.ts ----
import randomString from "randomstring";
import format from "string-format";

export default class StringUtil {
  /**
   * This method will return the formatted String by replacing value in {\d}
   * @param str : String to be formatted
   * @param replaceValue : value to replaced in formatted string
   * @returns str
   */
  public static formatString(str: string, ...replaceValue: string[]): string {
    for (let i = 0; i < replaceValue.length; i++) {
      // eslint-disable-next-line no-param-reassign
      str = str.split(`{${i}}`).join(replaceValue[i]);
    }
    return str;
  }

  /**
   * This method will return the formatted String by replacing value in {key}
   * @param str : String to be formatted
   * @param replaceValue : value to replaced in formatted string
   * @returns str
   */
  public static formatStringValue(str: string, replaceValue: any): string {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(replaceValue)) {
      // eslint-disable-next-line no-param-reassign
      str = str.split(`{${key}}`).join(`${value}`);
    }
    return str;
  }

  /**
   * Replaces text in a string, using an string that supports replacement within a string.
   * @param str Original string
   * @param searchValue searches for and replace matches within the string.
   * @param replaceValue A string containing the text to replace for every successful match of searchValue in this string.
   * @returns 
   */
  public static replaceAll(str: string, searchValue: string, replaceValue: string): string {
    const replacer = new RegExp(searchValue, 'g');
    const replacedStr = str.replace(replacer, replaceValue);
    return replacedStr;
  }

  /**
   * replaces the regex with string value
   * @param str 
   * @param regex 
   * @param value 
   * @returns 
   */
  public static getRegXLocator(str: string, regex: RegExp, value: string) {
    return str.replace(regex, value);
  }

  /**
   * Generates random alphanumeric string of given length
   * @param length 
   * @returns 
   */
  public static randomAlphanumericString(length: number): string {
    const str = randomString.generate(length);
    return str;
  }

  /**
   * Generates random string of given length
   * @param length
   * @returns
   */
  public static randomAlphabeticString(length: number): string {
    const str = randomString.generate({ length: length, charset: 'alphabetic' });
    return str;
  }

  /**
   * Generates random string of given length with all letters a as uppercase
   * @param length
   * @returns
   */
  public static randomUppercaseString(length: number): string {
    const str = randomString.generate({ length: length, charset: 'alphabetic', capitalization: "uppercase" });
    return str;
  }

  /**
   * Generates random string of given length with all letters a as lowercase
   * @param length
   * @returns
   */
  public static randomLowercaseString(length: number): string {
    const str = randomString.generate({ length: length, charset: 'alphabetic', capitalization: "lowercase" });
    return str;
  }

  /**
   * Generates random number string of given length
   * @param length
   * @returns
   */
  public static randomNumberString(length: number): string {
    const str = randomString.generate({ length: length, charset: 'numeric' });
    return str;
  }

  /**
   * This method will return the formatted String by replacing value in {key} from Object
   * @param str 
   * @param obj 
   * @returns 
   */
  public static formatStringFromObject(str: string, obj: any): string {
    return format(str, obj);
  }
}

// ---- src/support/utils/XMLParserUtil.ts ----
/* eslint-disable @typescript-eslint/no-var-requires */
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;

export default class XMLParserUtil {
    /**
     * Get content of tag in XML using xpath
     * @param xPathExpression xpath for the tag
     * @param xml as string
     */
    public static getTagContentByXpath(xml: string, xPathExpression: string): string {        
        const doc = new Dom().parseFromString(xml);
        const text = xpath.select(`string(${xPathExpression})`, doc);
        return text;
    }

    /**
     * Get value of attribute in XML using xpath
     * @param xPathExpression xpath for the attribute
     * @param xml as string
     */
    public static getAttributeValueByXpath(xml: string, xPathExpression: string): string {
        const doc = new Dom().parseFromString(xml);
        const text = xpath.select1(xPathExpression, doc).value;
        return text;
    }
}

// ---- src/web/pages/CommonPage.ts ----
import UIActions from "../../support/playwright/actions/UIActions";
import Assert from "../../support/playwright/asserts/Assert";
import StringUtil from "../../support/utils/StringUtil";
import Constants from "../constants/Constants";

export default class CommonPage {
    constructor(private web: UIActions) { }
    
    private SUCCESS_MESSAGE_TEXT = "h1.page-title";
    private SEARCH_TEXTBOX = "[name='search']";
    private SEARCH_BUTTON = ".search-button";
    private MY_ACCOUNT_LINK = "//li[contains(@class,'dropdown')]//span[contains(text(),'My account')]";
    private MENU_LINK = "//ul[contains(@class,'dropdown-menu')]//span[contains(text(),'{0}')]";

    /**
     * Search for a product from header banner
     * @param product 
     */
    public async searchProduct(product: string) {
        await this.web.editBox(this.SEARCH_TEXTBOX, Constants.PRODUCT).fill(product);
        await this.web.element(this.SEARCH_BUTTON, Constants.SEARCH_BUTTON).click();
    }

    public async logout() {
        await this.web.element(this.MY_ACCOUNT_LINK, Constants.MY_ACCOUNT).hover();
        await this.web.element(StringUtil.formatString(this.MENU_LINK, Constants.LOGOUT), Constants.LOGOUT).click();
    }

    public async navigateToRegisterUser() {
        await this.web.element(this.MY_ACCOUNT_LINK, Constants.MY_ACCOUNT).hover();
        await this.web.element(StringUtil.formatString(this.MENU_LINK, Constants.REGISTER), Constants.REGISTER).click();
    }

    /**
     * Verify the message displayed on title of the page
     * @param message 
     */
    public async verifyTitleMessage(message: string) {
        const actualMsg = await this.web.element(this.SUCCESS_MESSAGE_TEXT, Constants.MESSAGE).getTextContent();
        await Assert.assertEquals(actualMsg, message, Constants.MESSAGE);
    }

}

// ---- src/web/pages/HomePage.ts ----
import UIActions from "../../support/playwright/actions/UIActions";
import Assert from "../../support/playwright/asserts/Assert";
import Constants from "../constants/Constants";

export default class HomePage {
    constructor(private web: UIActions) { }
    /**
     * async navigateToHomePage
     */
    public async navigateToHomePage() {
        await this.web.goto(process.env.BASE_URL, "Home page");
    }
}

// ---- src/web/pages/RegisterUserPage.ts ----
import UIActions from "../../support/playwright/actions/UIActions";
import Assert from "../../support/playwright/asserts/Assert";
import StringUtil from "../../support/utils/StringUtil";
import Constants from "../constants/Constants";

export default class RegisterUserPage {    
    constructor(private web: UIActions) { }
        
    private FIRST_NAME_TEXTBOX = "#input-firstname";
    private LAST_NAME_TEXTBOX = "#input-lastname";
    private EMAIL_TEXTBOX = "#input-email";
    private TELEPHONE_TEXTBOX = "#input-telephone";
    private PASSWORD_TEXTBOX = "#input-password";
    private CONFIRM_PASSWORD_TEXTBOX = "#input-confirm";
    private SUBSCRIBE_RADIO = "[for='input-newsletter-{0}']";
    private PRIVACY_POLICY_CHECKBOX = "[for='input-agree']";
    private PRIVACY_POLICY_LINK = "//a/b[text()='Privacy Policy']";
    private CONTINUE_BUTTON = "[value='Continue']";
    
    public async enterRegistrationDetails(firstName: string, lastName: string, email: string, telephone: string, password: string, confirmPassword: string, subscribe: string) {
        await this.web.editBox(this.FIRST_NAME_TEXTBOX, Constants.FIRST_NAME).fill(firstName);
        await this.web.editBox(this.LAST_NAME_TEXTBOX, Constants.LAST_NAME).fill(lastName);
        await this.web.editBox(this.EMAIL_TEXTBOX, Constants.EMAIL).fill(email);
        await this.web.editBox(this.TELEPHONE_TEXTBOX, Constants.TELEPHONE).fill(telephone);
        await this.web.editBox(this.PASSWORD_TEXTBOX, Constants.PASSWORD).fill(password);
        await this.web.editBox(this.CONFIRM_PASSWORD_TEXTBOX, Constants.CONFIRM_PASSWORD).fill(confirmPassword);
        await this.web.element(StringUtil.formatString(this.SUBSCRIBE_RADIO, subscribe.toLowerCase()), subscribe.toUpperCase()).click();
    }

    public async agreePrivacyPolicy() {
        await Assert.assertTrue(await this.web.element(this.PRIVACY_POLICY_LINK, Constants.PRIVACY_POLICY).isVisible(1),
            Constants.PRIVACY_POLICY);
        await this.web.element(this.PRIVACY_POLICY_CHECKBOX, Constants.PRIVACY_POLICY).click();
    }

    public async clickContinueButton() {
        await this.web.element(this.CONTINUE_BUTTON, Constants.CONTINUE).click();
    }
}

// ---- src/web/pages/SearchResultsPage.ts ----
import UIActions from "../../support/playwright/actions/UIActions";
import Assert from "../../support/playwright/asserts/Assert";
import Constants from "../constants/Constants";

export default class SearchResultsPage {
    constructor(private web: UIActions) { }
    
    private SEARCH_RESULT_PRODUCT_TEXT = ".product-thumb .title a";
    private SEARCH_MESSAGE_TEXT = ".entry-content.content-products p";
    
    /**
     * Verify the product search results
     * @param product 
     */
    public async verifySearchResult(product: string) {
        const products = await this.web.element(this.SEARCH_RESULT_PRODUCT_TEXT, Constants.PRODUCT).getAllTextContent();
        for(const prod of products) {
            await Assert.assertContainsIgnoreCase(prod, product, Constants.PRODUCT);
        }
    }
    /**
     * Verify the message displayed when searched for invalid product
     * @param message 
     */
    public async verifyInvalidSearchMessage(message: string) {
        const actualMsg = await this.web.element(this.SEARCH_MESSAGE_TEXT, Constants.MESSAGE).getTextContent();
        await Assert.assertEquals(actualMsg, message, Constants.MESSAGE);
    }
}

```
---
# DSL USAGE  (how existing steps reach the DSL — mirror these call shapes)
```ts
// HOW EXISTING STEPS REACH THE DSL (observed call shapes — mirror these):
//   Assert.assertContains(…)
//   Assert.assertEquals(…)
//   Assert.assertNotNull(…)
//   StringUtil.formatString(…)
//   bookResponse.getBody(…)
//   new CommonPage(…)
//   new CommonPage(…).searchProduct(…)
//   new RequestHeader(…)
//   new RequestHeader(…).set(…)
//   new SearchResultsPage(…)
//   new SearchResultsPage(…).verifyInvalidSearchMessage(…)
//   new SearchResultsPage(…).verifySearchResult(…)
//   request.createRequestBody(…)
//   request.post(…)
//   response.getBody(…)
//   response.getStatusCode(…)
//   response.getTagContentByJsonPath(…)
//   response.getTagContentByXpath(…)
//   soap.post(…)
//   this.response.getTagContentByJsonPath(…)
//   this.rest.delete(…)
//   this.rest.get(…)
//   this.rest.post(…)
//   this.rest.put(…)
```
---
# PARAMETER TYPES  (custom Cucumber Expression types available)
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS  (already bound — never redefine or overlap; reuse shared steps)
```ts
// 28 step bindings already registered — do NOT redefine any of these:
Given('user has access to Library Information System')      // src/api/steps/RESTAuthor.ts
When('user makes a request to retrieves all the Authors in the System')// src/api/steps/RESTAuthor.ts
Then('user should get a status code {int}')                 // src/api/steps/RESTAuthor.ts
Then('user should get list of Authors')                     // src/api/steps/RESTAuthor.ts
When('user makes a request to retrieve an Author with id {int}')// src/api/steps/RESTAuthor.ts
Then('user should get the author with id {int}')            // src/api/steps/RESTAuthor.ts
When('user makes a request to retrieves all the Books in the System')// src/api/steps/RESTBook.ts
Then('user should get list of Books')                       // src/api/steps/RESTBook.ts
When('user makes a request to retrieve an Book with id {int}')// src/api/steps/RESTBook.ts
Then('user should get the Book with id {int}')              // src/api/steps/RESTBook.ts
When('user adds a book with details {string}, {string}, {int}, {string}, {int}, {string}, {int}, {string}, {string}')// src/api/steps/RESTBook.ts
Then('user should be able to added Book {string}, {string}, {int}, {int}, {string}')// src/api/steps/RESTBook.ts
Then('user deletes the book that was added')                // src/api/steps/RESTBook.ts
Then('user should see that book details {string}, {string}, {int}, {int}, {string} are updated')// src/api/steps/RESTBook.ts
Then('user searches for books within date range {string} to {string}')// src/api/steps/RESTBook.ts
Then('user updates the book that was added {string}, {int}, {int}')// src/api/steps/RESTBook.ts
Then('user should see book in search result with details {string}, {string}, {int}, {int}, {string}')// src/api/steps/RESTBook.ts
When('user adds two numbers {int} and {int} in the calculator')// src/api/steps/SOAPCalculator.ts
Then('user should get the result of addition as {string}')  // src/api/steps/SOAPCalculator.ts
When('user subtracts two numbers {int} and {int} in the calculator')// src/api/steps/SOAPCalculator.ts
When('user multiplies two numbers {int} and {int} in the calculator')// src/api/steps/SOAPCalculator.ts
When('user divides two numbers {int} and {int} in the calculator')// src/api/steps/SOAPCalculator.ts
Then('user should get the result of subtraction as {string}')// src/api/steps/SOAPCalculator.ts
Then('user should get the result of multiplication as {string}')// src/api/steps/SOAPCalculator.ts
Then('user should get the result of division as {string}')  // src/api/steps/SOAPCalculator.ts
When('the user searches for product {string}')              // src/web/steps/SearchProductSteps.ts
Then('user should see {string} product displayed on search result')// src/web/steps/SearchProductSteps.ts
Then('user should see a search result message as {string}') // src/web/steps/SearchProductSteps.ts
```
---
# EXISTING STEP DEFINITIONS  (bodies, for style + reuse; target scenario held out)
```ts
// ---- src/api/steps/RESTAuthor.ts ----
import { Given, Then, When } from "@cucumber/cucumber";
import RequestHeader from "../../support/playwright/API/RequestHeader";
import RESTResponse from "../../support/playwright/API/RESTResponse";
import Assert from "../../support/playwright/asserts/Assert";
import StringUtil from "../../support/utils/StringUtil";
import Constants from "../constants/Constants";

function getHeader() {
    return new RequestHeader().set(Constants.CONTENT_TYPE, Constants.APPLICATION_JSON)
        .set(Constants.ACCEPT, Constants.APPLICATION_JSON)
        .set(Constants.AUTHORIZATION, `${Constants.BASIC} ${Buffer.from(`${Constants.USER}:${Constants.USER}`)
            .toString(Constants.BASE64)}`).get();
}

Given('user has access to Library Information System', async function () {
    const endPoint = `${process.env.REST_API_BASE_URL}${Constants.SESSION_EP}`;
    const response: RESTResponse = await this.rest.get(this.attach, endPoint, getHeader(), Constants.SESSION);
    await Assert.assertEquals(await response.getStatusCode(), 200, Constants.STATUS_CODE);
    this.id = await response.getBody();
});

When('user makes a request to retrieves all the Authors in the System', async function () {
    const endPoint = `${process.env.REST_API_BASE_URL}${Constants.AUTHOR_EP}${this.id}`;
    this.response = await this.rest.get(this.attach, endPoint, getHeader(), Constants.AUTHORS);
});

Then('user should get a status code {int}', async function (status: number) {
    const response: RESTResponse = this.response;
    await Assert.assertEquals(await response.getStatusCode(), status, Constants.STATUS_CODE);
});

Then('user should get list of Authors', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), Constants.AUTHORS);
});

When('user makes a request to retrieve an Author with id {int}', async function (id: number) {
    const endPoint = `${process.env.REST_API_BASE_URL}${StringUtil.formatString(Constants.SINGLE_AUTHOR_EP, id.toString(), this.id)}`;
    this.response = await this.rest.get(this.attach, endPoint, getHeader(), Constants.SINGLE_AUTHOR);
});

Then('user should get the author with id {int}', async function (id: number) {
    const response: RESTResponse = this.response;
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.ID_JSON_PATH, Constants.SINGLE_AUTHOR), id, Constants.SINGLE_AUTHOR);
});

// ---- src/api/steps/RESTBook.ts ----
import { Given, Then, When } from "@cucumber/cucumber";
import RequestHeader from "../../support/playwright/API/RequestHeader";
import RESTRequest from "../../support/playwright/API/RESTRequest";
import RESTResponse from "../../support/playwright/API/RESTResponse";
import Assert from "../../support/playwright/asserts/Assert";
import StringUtil from "../../support/utils/StringUtil";
import Constants from "../constants/Constants";

function getHeader() {
    return new RequestHeader().set(Constants.CONTENT_TYPE, Constants.APPLICATION_JSON)
        .set(Constants.ACCEPT, Constants.APPLICATION_JSON)
        .set(Constants.AUTHORIZATION, `${Constants.BASIC} ${Buffer.from(`${Constants.USER}:${Constants.USER}`)
            .toString(Constants.BASE64)}`).get();
}

When('user makes a request to retrieves all the Books in the System', async function () {
    const endPoint = `${process.env.REST_API_BASE_URL}${Constants.BOOK_EP}${this.id}`;
    this.response = await this.rest.get(this.attach, endPoint, getHeader(), Constants.BOOKS);
});

Then('user should get list of Books', async function () {
    const response: RESTResponse = this.response;
    await Assert.assertNotNull(await response.getBody(), Constants.BOOKS);
});

When('user makes a request to retrieve an Book with id {int}', async function (id: number) {
    const endPoint = `${process.env.REST_API_BASE_URL}${StringUtil.formatString(Constants.SINGLE_BOOK_EP, id.toString(), this.id)}`;
    this.response = await this.rest.get(this.attach, endPoint, getHeader(), Constants.SINGLE_BOOK);
});

Then('user should get the Book with id {int}', async function (id: number) {
    const response: RESTResponse = this.response;
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.ID_JSON_PATH, Constants.SINGLE_BOOK), id, Constants.SINGLE_BOOK);
});

When('user adds a book with details {string}, {string}, {int}, {string}, {int}, {string}, {int}, {string}, {string}',
    async function (bookName: string, available: string, genreId: number, genreName: string, authorID: number,
        authorName: string, age: number, dateAdded: string, dateAddedIso: string) {
        const endPoint = `${process.env.REST_API_BASE_URL}${Constants.BOOK_EP}${this.id}`;
        const requestData = {
            bookName: bookName,
            available: available,
            genreId: genreId,
            genreName: genreName,
            authorID: authorID,
            authorName: authorName,
            age: age,
            dateAdded: dateAdded,
            dateAddedIso: dateAddedIso,
        }
        const request: RESTRequest = this.rest;
        const requestBody = await request.createRequestBody(Constants.BOOK_JSON, requestData);
        this.response = await request.post(this.attach, endPoint, getHeader(), requestBody, Constants.SINGLE_BOOK);
        this.bookID = await this.response.getTagContentByJsonPath(Constants.ID_JSON_PATH, Constants.SINGLE_BOOK);
    });

Then('user should be able to added Book {string}, {string}, {int}, {int}, {string}',
    async function (bookName: string, available: string, genreId: number, authorID: number, dateAddedIso: string) {
        const response: RESTResponse = this.response;
        await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.NAME_JSON_PATH, Constants.SINGLE_BOOK), bookName, Constants.SINGLE_BOOK);
        await Assert.assertEquals((await response.getTagContentByJsonPath(Constants.OUT_OF_PRINT_JSON_PATH, Constants.SINGLE_BOOK)).toString(), available, Constants.SINGLE_BOOK);
        await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.GENRE_ID_JSON_PATH, Constants.SINGLE_BOOK), genreId, Constants.SINGLE_BOOK);
        await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.AUTHOR_ID_JSON_PATH, Constants.SINGLE_BOOK), authorID, Constants.SINGLE_BOOK);
        await Assert.assertContains(await response.getTagContentByJsonPath(Constants.DATE_ADDED_ISO_JSON_PATH, Constants.SINGLE_BOOK), dateAddedIso, Constants.SINGLE_BOOK);
        await Assert.assertNotNull(await response.getTagContentByJsonPath(Constants.ID_JSON_PATH, Constants.SINGLE_BOOK), Constants.SINGLE_BOOK);
    });

Then('user deletes the book that was added', async function () {
    const endPoint = `${process.env.REST_API_BASE_URL}${StringUtil.formatString(Constants.SINGLE_BOOK_EP, this.bookID, this.id)}`;
    this.response = await this.rest.delete(this.attach, endPoint, getHeader(), Constants.SINGLE_BOOK);
});

Then('user should see that book details {string}, {string}, {int}, {int}, {string} are updated', async function (bookName: string, available: string, genreId: number, authorID: number, dateAddedIso: string) {
    const endPoint = `${process.env.REST_API_BASE_URL}${StringUtil.formatString(Constants.SINGLE_BOOK_EP, this.bookID, this.id)}`;
    const response: RESTResponse = await this.rest.get(this.attach, endPoint, getHeader(), Constants.SINGLE_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.NAME_JSON_PATH, Constants.SINGLE_BOOK), bookName, Constants.SINGLE_BOOK);
    await Assert.assertEquals((await response.getTagContentByJsonPath(Constants.OUT_OF_PRINT_JSON_PATH, Constants.SINGLE_BOOK)).toString(), available, Constants.SINGLE_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.GENRE_ID_JSON_PATH, Constants.SINGLE_BOOK), genreId, Constants.SINGLE_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.AUTHOR_ID_JSON_PATH, Constants.SINGLE_BOOK), authorID, Constants.SINGLE_BOOK);
    await Assert.assertContains(await response.getTagContentByJsonPath(Constants.DATE_ADDED_ISO_JSON_PATH, Constants.SINGLE_BOOK), dateAddedIso, Constants.SINGLE_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.ID_JSON_PATH, Constants.SINGLE_BOOK), this.bookID, Constants.SINGLE_BOOK);
});

Then('user searches for books within date range {string} to {string}',
    async function (startDateIso: string, endDateIso: string) {
        const searchBody = {
            "EndDateIso": `${endDateIso}T00:00:00`,
            "StartDateIso": `${startDateIso}T00:00:00`
        }
        const endPoint = `${process.env.REST_API_BASE_URL}${Constants.SEARCH_BOOK_EP}${this.id}`;
        this.response = await this.rest.post(this.attach, endPoint, getHeader(), JSON.stringify(searchBody), Constants.SEARCH_BOOK);
});

Then('user updates the book that was added {string}, {int}, {int}', async function (available: string, genreId: number, authorID: number) {
    const endPoint = `${process.env.REST_API_BASE_URL}${StringUtil.formatString(Constants.SINGLE_BOOK_EP, this.bookID, this.id)}`;
    const bookResponse: RESTResponse = await this.rest.get(this.attach, endPoint, getHeader(), Constants.SINGLE_BOOK);
    const bookBody = JSON.parse(await bookResponse.getBody());
    bookBody["IsOutOfPrint"] = available;
    bookBody["GenreId"] = genreId;
    bookBody["AuthorId"] = authorID;
    this.response = await this.rest.put(this.attach, endPoint, getHeader(), JSON.stringify(bookBody), Constants.SINGLE_BOOK);    
});

Then('user should see book in search result with details {string}, {string}, {int}, {int}, {string}', async function (bookName: string, available: string, genreId: number, authorID: number, dateAddedIso: string) {
    const response: RESTResponse = this.response;
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.FIRST_NAME_JSON_PATH, Constants.SEARCH_BOOK), bookName, Constants.SEARCH_BOOK);
    await Assert.assertEquals((await response.getTagContentByJsonPath(Constants.FIRST_OUT_OF_PRINT_JSON_PATH, Constants.SEARCH_BOOK)).toString(), available, Constants.SEARCH_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.FIRST_GENRE_ID_JSON_PATH, Constants.SEARCH_BOOK), genreId, Constants.SEARCH_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.FIRST_AUTHOR_ID_JSON_PATH, Constants.SEARCH_BOOK), authorID, Constants.SEARCH_BOOK);
    await Assert.assertContains(await response.getTagContentByJsonPath(Constants.FIRST_DATE_ADDED_ISO_JSON_PATH, Constants.SEARCH_BOOK), dateAddedIso, Constants.SEARCH_BOOK);
    await Assert.assertEquals(await response.getTagContentByJsonPath(Constants.FIRST_ID_JSON_PATH, Constants.SEARCH_BOOK), this.bookID, Constants.SEARCH_BOOK);
});

// ---- src/api/steps/SOAPCalculator.ts ----
import { Then, When } from "@cucumber/cucumber";
import { ICreateAttachment } from "@cucumber/cucumber/lib/runtime/attachment_manager";
import RequestHeader from "../../support/playwright/API/RequestHeader";
import SOAPRequest from "../../support/playwright/API/SOAPRequest";
import SOAPResponse from "../../support/playwright/API/SOAPResponse";
import Assert from "../../support/playwright/asserts/Assert";
import Constants from "../constants/Constants";

async function makePostRequest(attach: ICreateAttachment, soap: SOAPRequest, soapAction: string, operation: string,
    number1: number, number2: number) {
    const header = new RequestHeader().set(Constants.CONTENT_TYPE, Constants.TEXT_XML)
        .set(Constants.SOAP_ACTION, soapAction).get();
    const requestData = {
        number1: number1,
        number2: number2,
    };
    return await soap.post(attach, process.env.SOAP_API_BASE_URL, header, `${operation}${Constants.XML_FORMAT}`,
        requestData, operation);
}

async function validateResult(response: SOAPResponse, xpath: string, operation: string, result: string) {
    await Assert.assertEquals((await response.getTagContentByXpath(xpath, operation)), result, operation);
}

When('user adds two numbers {int} and {int} in the calculator', async function (number1: number, number2: number) {
    this.response = await makePostRequest(this.attach, this.soap, Constants.ADD_SOAP_ACTION, Constants.ADD, number1, number2);
});

Then('user should get the result of addition as {string}', async function (result: string) {
    await validateResult(this.response, Constants.ADD_RESULT_XPATH, Constants.ADD, result);
});

When('user subtracts two numbers {int} and {int} in the calculator', async function (number1: number, number2: number) {
    this.response = await makePostRequest(this.attach, this.soap, Constants.SUBTRACT_SOAP_ACTION, Constants.SUBTRACT, number1, number2);
});

When('user multiplies two numbers {int} and {int} in the calculator', async function (number1: number, number2: number) {
    this.response = await makePostRequest(this.attach, this.soap, Constants.MULTIPLY_SOAP_ACTION, Constants.MULTIPLY, number1, number2);
});

When('user divides two numbers {int} and {int} in the calculator', async function (number1: number, number2: number) {
    this.response = await makePostRequest(this.attach, this.soap, Constants.DIVIDE_SOAP_ACTION, Constants.DIVIDE, number1, number2);
});

Then('user should get the result of subtraction as {string}', async function (result: string) {
    await validateResult(this.response, Constants.SUBTRACT_RESULT_XPATH, Constants.SUBTRACT, result);
});

Then('user should get the result of multiplication as {string}', async function (result: string) {
    await validateResult(this.response, Constants.MULTIPLY_RESULT_XPATH, Constants.MULTIPLY, result);
});

Then('user should get the result of division as {string}', async function (result: string) {
    await validateResult(this.response, Constants.DIVIDE_RESULT_XPATH, Constants.DIVIDE, result);
});

// ---- src/web/steps/SearchProductSteps.ts ----
import { Given, Then, When } from "@cucumber/cucumber";
import CommonPage from "../pages/CommonPage";

import SearchResultsPage from "../pages/SearchResultsPage";

When('the user searches for product {string}', async function (product: string) {
    await new CommonPage(this.web).searchProduct(product);
});

Then('user should see {string} product displayed on search result', async function (product: string) {
    await new SearchResultsPage(this.web).verifySearchResult(product);
});

Then('user should see a search result message as {string}', async function (message: string) {
    await new SearchResultsPage(this.web).verifyInvalidSearchMessage(message);
});

```
---
# WORLD  (how `this` exposes page / context / helpers / scenario state)
```ts
// ---- src/support/config/hooks.ts ----
import { Before, BeforeAll, AfterAll, After, setDefaultTimeout, ITestCaseHookParameter, Status, formatterHelpers } from "@cucumber/cucumber";
import { Browser } from "@playwright/test";
import WebBrowser from "../manager/Browser";
import fse from "fs-extra";
import UIActions from "../playwright/actions/UIActions";
import Log from "../logger/Log";
import RESTRequest from "../playwright/API/RESTRequest";
import SOAPRequest from "../playwright/API/SOAPRequest";

const timeInMin: number = 60 * 1000;
setDefaultTimeout(Number.parseInt(process.env.TEST_TIMEOUT, 10) * timeInMin);
let browser: Browser;

// launch the browser
BeforeAll(async function () {
    browser = await WebBrowser.launch();
});

// close the browser
AfterAll(async function () {
    await browser.close();
});

// Create a new browser context and page per scenario
Before(async function ({ pickle, gherkinDocument }: ITestCaseHookParameter) {
    const { line } = formatterHelpers.PickleParser.getPickleLocation({ gherkinDocument, pickle })
    Log.testBegin(`${pickle.name}: ${line}`);
    this.context = await browser.newContext({
        viewport: null,
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        recordVideo: process.env.RECORD_VIDEO === "true" ? { dir: './test-results/videos' } : undefined,
    });
    this.page = await this.context?.newPage();
    this.web = new UIActions(this.page);
    this.rest = new RESTRequest(this.page);
    this.soap = new SOAPRequest();
});

// Cleanup after each scenario
After(async function ({ result, pickle, gherkinDocument }: ITestCaseHookParameter) {
    const { line } = formatterHelpers.PickleParser.getPickleLocation({ gherkinDocument, pickle })
    const status = result.status;
    const scenario = pickle.name;
    const videoPath = await this.page?.video()?.path();
    if (status === Status.FAILED) {
        const image = await this.page?.screenshot({ path: `./test-results/screenshots/${scenario} (${line}).png`, fullPage: true });
        await this.attach(image, 'image/png');
        Log.error(`${scenario}: ${line} - ${status}\n${result.message}`);
    }
    await this.page?.close();
    await this.context?.close();
    if (process.env.RECORD_VIDEO === "true") {
        if (status === Status.FAILED) {
            fse.renameSync(videoPath, `./test-results/videos/${scenario}(${line}).webm`);            
            await this.attach(fse.readFileSync(`./test-results/videos/${scenario}(${line}).webm`), 'video/webm');
        } else {
            fse.unlinkSync(videoPath);
        }
    }
    Log.testEnd(`${scenario}: ${line}`, status);
});

```
---
# CONSTANTS  (the only allowed symbolic values)
```ts
// ---- src/api/constants/Constants.ts ----
export default class Constants{
    // REST Endpoints 
    static readonly SESSION_EP = "/session";
    static readonly AUTHOR_EP = "/author?session_id=";
    static readonly SINGLE_AUTHOR_EP = "/author/{0}?session_id={1}";
    static readonly BOOK_EP = "/book?session_id=";
    static readonly SINGLE_BOOK_EP = "/book/{0}?session_id={1}";
    static readonly SEARCH_BOOK_EP = "/book/search?session_id=";

    // REST JSON path
    static readonly ID_JSON_PATH = "$.Id";
    static readonly AUTHOR_ID_JSON_PATH = "$.AuthorId";
    static readonly DATE_ADDED_ISO_JSON_PATH = "$.DateAddedIso";
    static readonly GENRE_ID_JSON_PATH = "$.GenreId";
    static readonly OUT_OF_PRINT_JSON_PATH = "$.IsOutOfPrint";
    static readonly NAME_JSON_PATH = "$.Name";
    static readonly FIRST_ID_JSON_PATH = "$[0].Id";
    static readonly FIRST_AUTHOR_ID_JSON_PATH = "$[0].AuthorId";
    static readonly FIRST_DATE_ADDED_ISO_JSON_PATH = "$[0].DateAddedIso";
    static readonly FIRST_GENRE_ID_JSON_PATH = "$[0].GenreId";
    static readonly FIRST_OUT_OF_PRINT_JSON_PATH = "$[0].IsOutOfPrint";
    static readonly FIRST_NAME_JSON_PATH = "$[0].Name";

    // SOAP Actions
    static readonly ADD_SOAP_ACTION = "http://tempuri.org/Add";
    static readonly SUBTRACT_SOAP_ACTION = "http://tempuri.org/Subtract";
    static readonly MULTIPLY_SOAP_ACTION = "http://tempuri.org/Multiply";
    static readonly DIVIDE_SOAP_ACTION = "http://tempuri.org/Divide";

    // SOAP Xpath
    static readonly ADD_RESULT_XPATH = "//*[local-name()='AddResult']/text()";
    static readonly SUBTRACT_RESULT_XPATH = "//*[local-name()='SubtractResult']/text()";
    static readonly MULTIPLY_RESULT_XPATH = "//*[local-name()='MultiplyResult']/text()";
    static readonly DIVIDE_RESULT_XPATH = "//*[local-name()='DivideResult']/text()";

    // Constants
    static readonly USER = "librarian";
    static readonly CONTENT_TYPE = "content-type";
    static readonly APPLICATION_JSON = "application/json";
    static readonly ACCEPT = "accept";
    static readonly AUTHORIZATION = "authorization";
    static readonly BASIC = "Basic";
    static readonly BASE64 = "base64";
    static readonly STATUS_CODE = "Status Code";    
    static readonly SESSION = "Session";    
    static readonly AUTHORS = "Authors"    
    static readonly SINGLE_AUTHOR = "Single Author";
    static readonly BOOKS = "Books"
    static readonly SINGLE_BOOK = "Single Book";
    static readonly TEXT_XML = "text/xml;charset=UTF-8"
    static readonly SOAP_ACTION = "SOAPAction";    
    static readonly XML_FORMAT = ".xml";
    static readonly ADD = "add";
    static readonly SUBTRACT = "subtract";
    static readonly MULTIPLY = "multiply";
    static readonly DIVIDE = "divide";
    static readonly BOOK_JSON = "book.json";
    static readonly SEARCH_BOOK = "Search Book";
}

// ---- src/support/constants/BrowserConstants.ts ----
export default class BrowserConstants {
    static readonly CHROME = "chrome";
    static readonly FIREFOX = "firefox";
    static readonly WEBKIT = "webkit";
    static readonly MSEDGE = "msedge";
    static readonly EDGE = "edge";
    static readonly CHROMIUM = "chromium";
    static readonly BLANK = "";
}

// ---- src/support/constants/CommonConstants.ts ----
export default class CommonConstants {
  static readonly SEMICOLON = ';';
  static readonly BLANK = '';
  static readonly ZERO = 0;
  static readonly ONE = 1;
  static readonly TWO = 2;
  static readonly THREE = 3;
  static readonly HALF = 0.5;
  static readonly ONE_THOUSAND = 1000;
  static readonly DOWNLOAD_PATH = "./test-results/downloads/";
  static readonly SOAP_XML_REQUEST_PATH = "src/resources/API/SOAP/";
  static readonly REST_JSON_REQUEST_PATH = "src/resources/API/REST/";
  static readonly TEST_FOLDER_PATH = "../../tests/";
  static readonly TEST_SUITE_FILE_FORMAT = ".test.ts";
  static readonly PARALLEL_MODE = "parallel";
  static readonly SERIAL_MODE = "serial";
  static readonly REPORT_TITLE = "Test Execution Report";
  static readonly RESULTS_PATH = "./test-results/results";
  static readonly JUNIT_RESULTS_PATH = `${CommonConstants.RESULTS_PATH}/results.xml`;
  static readonly SIXTY = 60;
  static readonly WAIT = parseInt(process.env.WAIT_TIME, 10) * CommonConstants.ONE_THOUSAND * CommonConstants.SIXTY;
}

// ---- src/support/constants/HTMLConstants.ts ----
export default class HTMLConstants {
    static readonly OPTION = "option";
    static readonly SELECTED_OPTION = "option[selected='selected']";
}

// ---- src/web/constants/Constants.ts ----
export default class Constants {
    static readonly PRODUCT = "Product";
    static readonly SEARCH_BUTTON = "Search Button";
    static readonly MESSAGE = "Message";
    static readonly MY_ACCOUNT = "My Account";
    static readonly LOGOUT = "Logout";
    static readonly REGISTER = "Register";
    static readonly FIRST_NAME = "First Name";
    static readonly  LAST_NAME = "Last Name";
    static readonly  EMAIL = "Email";
    static readonly  TELEPHONE = "Telephone";
    static readonly  PASSWORD = "Password";
    static readonly  CONFIRM_PASSWORD = "Confirm Password";
    static readonly PRIVACY_POLICY = "Privacy Policy";
    static readonly CONTINUE = "Continue";
}

```
