
# Inconsistencies and Dataset in Behavior-Driven Development (BDD)
## Task 1  - Inconsistencies study 
## 1. Types of Inconsistencies Studied

| Paper | What it evaluated | Common Inconsistency Subtypes | Primary Manifestation |
| :---: | :--- | :--- | :--- |
| **Bridging Behavior and Implementation** (Shi et al.) | Gherkin scenario vs. test code | • Missing Action (18%)<br>• Parameter Mismatch (10%)<br>• Condition Mismatch (4%)<br>• Over-Implementation (3%)<br>• Invocation Order (1%) | Missing required operations, incorrect API arguments, or extraneous speculative code. |
| **Acceptance Test Generation with LLMs** (Ferreira et al.) | Executable Script vs. UI | • Semantic Context Deficit<br>• Spec vs. Behavior Contradiction | Missing context in stories (up to 40% non-alignment) or UI state mismatches (e.g., hidden vs. disabled). |
| **Sakura: Generating Complex Tests** (Stennett et al.) | Generated Tests vs. Dev test | • Localization & Method Errors<br>• Structural & Coverage Gaps | Wrong target methods, mismatched exception types, and line/branch coverage gaps. |
| **BDD Acceptance Test Formulation** (Karpurapu et al.) | Gherkin Feature Files | • Keyword Order Errors<br>• Missing Keywords / Tags<br>• Restricted Pattern Violations | Out-of-sequence keywords (e.g., `Given Then When`), missing tags, or syntax header defects. |

### 1.1 Glue Code & Implementation Mismatches (Gherkin Steps vs. Test Glue Code) [4]
* **Missing Action:** The generated or developer-written glue code captures the broad intent of a Gherkin step but omits key required operations (representing 18% of evaluated cases in glue code studies) [4].
* **Parameter Mismatch:** The code invokes the correct project APIs but supplies incorrect, incomplete, or imprecise arguments (10% of cases) [4].
* **Condition Mismatch:** The primary action is implemented, but conditional checks or branching logic fail to reflect required execution conditions (4% of cases) [4].
* **Over-Implementation:** The test code introduces speculative, extra API calls or logic not requested by the Gherkin step (3% of cases) [4].
* **Invocation Order Mismatch:** Relevant methods or setup operations are called in an incorrect or suboptimal sequence (1% of cases) [4].

### 1.2 Executable Test Script & Application UI Mismatches [2]
* **Semantic Relevance & Lack of Context:** Executable test scripts (e.g., Cypress) fail to accurately mirror Gherkin scenarios due to missing contextual details in the user story or scenario descriptions (up to 40% initial non-alignment) [2].
* **Specification vs. Application Behavior Contradictions:** Mismatches between what the Gherkin scenario specifies and what the application UI actually implements—for instance, a scenario specifying that a button should be disabled, whereas the web application renders it as hidden [2].

### 1.3 Structural & Behavioral Coverage Gaps (NL/Gherkin vs. Developer Test Suites) [3]
* **Localization & Method Call Errors:** Automated test generators call incorrect methods or assert wrong exceptions compared to developer tests (e.g., calling `getFields` instead of `findFields`, or expecting `ClassFormatException` instead of `ClassCircularityError`) [3].
* **Coverage & Structural Fidelity Gaps:** Differences in class, method, line, and branch coverage overlap, as well as mismatches in instantiated types, assertion types, and focal method identification when comparing generated tests against developer-written ground truth [3].

### 1.4 Syntactic & Structural Rule Violations in Gherkin Scenarios [5]
* **Keyword Order Errors:** Gherkin steps not adhering to logical keyword sequence (e.g., `Given Then When`) [5].
* **Missing Keywords & Tags:** Scenarios missing required `Given`/`When`/`Then` keywords or organizational `@tags` [5].
* **Restricted Patterns:** Presence of unnecessary special characters or malformed background/feature headers [5].

---

## 2. Detection Methodologies

| Analysis type | Primary Techniques & Tools | Target | Detection Signal |
| :---: | :--- | :--- | :--- |
| **Static Analysis** | AST Parsing, Similarity Metrics (CodeBLEU, Cosine) | Source code ASTs | Low API overlap (precision/recall/F1) and lexical divergence. |
| **Static Verification** | Linters (`gherkin-lint`), Build Tools (Maven, Gradle) | `.feature` files & test suites | Syntax rule violations and compile errors (missing imports, bad types). |
| **Dynamic Validation** | Profilers (JaCoCo), E2E execution, LLM-as-a-Judge | Test execution runtime & DOM | Coverage gaps, runtime pass/fail rates, and usability mismatch classifications. |

* **Static Analysis & AST Parsing:** Extracting Abstract Syntax Trees (ASTs) from test code to measure API Overlap (Precision, Recall, and F1 score) by comparing method invocations and object references against human-written reference code [4].
* **Code Similarity & Coverage Metrics:** Applying lexical, syntactic, and structural similarity metrics (CodeBLEU, METEOR, ROUGE-L, Cosine Similarity) [4] alongside code coverage profilers (JaCoCo) to measure branch, line, class, and method overlap [3].
* **Automated Linters & Compilers:** Utilizing static linters such as `gherkin-lint` to catch syntax violations in `.feature` files [5], and using build tools (e.g., Maven, Gradle) to detect compilation failures such as missing imports, inaccessible methods, and invalid types [3].
* **Reference-Aware LLM-as-a-Judge:** Utilizing LLM evaluators to classify test code as an *Exact Match* (directly usable), *Partial Match* (requires minor edits), or *Mismatch* (unusable), validated against manual human developer evaluations (showing high agreement, e.g., Spearman $\\rho = 0.84$) [4].
* **Execution-Based End-to-End Validation:** Executing test scripts against real web applications or sandboxed execution environments to monitor pass/fail rates and identify discrepancies between formal specifications and real application behavior [1]–[3].

---

## 3. Remaining Research Gaps

Several critical open challenges remain unaddressed in the current literature:

1. **Scenario- and Feature-Level Multi-Step Synthesis:** Most glue code generation approaches evaluate isolated steps in isolation. Synthesizing multi-step scenarios or full feature files while preserving shared state, variable bindings, fixture setups, and cross-step data flow remains an open challenge [4].
2. **Closed-Loop Feedback & Automated Repair:** Current approaches predominantly rely on one-shot or prompt-based generation. Integrating real-time execution feedback (compilation errors, stack traces, assertion failures) into multi-round automated repair loops requires deeper investigation [3], [4].
3. **Evolution-Aware BDD Maintenance:** Empirical data indicates that over 65% of scenarios and glue code methods evolve over time [4]. Automated techniques capable of detecting divergence between evolving Gherkin feature files, glue code, and project APIs—and subsequently recommending synchronization updates—remain largely unexplored [4].

---

## Task 2  - Dataset Comparison

| Dataset | Contains Gherkin Scenarios? | Linked tests/impl? | Mapping labeled/validated? | Total Scenarios / Steps | Total Projects | Project & Framework Diversity | Actively Maintained? |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **GivenWhenThen** *(the one we are currently using)* | Yes | Yes | Yes (with a heuristic function) | 2,289 scenarios | 1,720 | Java, JavaScript, Ruby; Cucumber | Data mined in Oct 2025; presented at MSR 2026; planned extension to Python and additional languages. |
| **cukereuse** (Mughal *et al.*, 2026) | Yes | No | No | 1,113,616 steps / 23,667 files | 347 | Multi-framework: Cucumber-JVM, behave, pytest-bdd, SpecFlow, Behat, Karate, cucumber-js | Released April 25, 2026. |
| **Sakura** (Stennett *et al.*, 2026) | Synthetic BDD-style Natural Language | Yes | Derived from tests | 488 scenarios | 20 (Apache Commons) | Java | ISSTA26 paper |
| **Chandorkar *et al.*** (SANER 2022) | Yes | No | No | 1,572 spec files | 23 | Java; Cucumber | Inactive (last release in 2021). |
---

## References

[1] S. R. Ribeiro dos Santos *et al.*, "Automated Test Generation Using LLM Based on BDD: A Comparative Study," in *Proc. 21st Int. Conf. Web Inf. Syst. Technol. (WEBIST 2025)*, 2025, pp. 47–57.

[2] M. Ferreira, L. Viegas, J. P. Faria, and B. Lima, "Acceptance Test Generation with Large Language Models: An Industrial Case Study," *arXiv preprint arXiv:2504.07244*, 2025.

[3] T. Stennett, R. Pan, B. McGinn, A. Orso, and S. Sinha, "Sakura: An Approach for Generating Complex Tests from Natural Language Test Descriptions," *Proc. ACM Softw. Eng.*, vol. 3, (ISSTA 2026), 2026.

[4] Shi *et al.*, "Bridging Behavior and Implementation: Automated Java Glue Code Generation for Behavior-Driven Development," *ACM Trans. Softw. Eng.*, 2026.

[5] S. Karpurapu, S. Myneni, U. Nettur, L. S. Gajja, D. Burke, T. Stiehm, and J. Payne, "Comprehensive Evaluation and Insights Into the Use of Large Language Models in the Automation of Behavior-Driven Development Acceptance Test Formulation," *IEEE Access*, vol. 12, pp. 58715–58721, 2024.\n
bdd_inconsistencies_and_datasets.md
Displaying bdd_inconsistencies_and_datasets.md.
