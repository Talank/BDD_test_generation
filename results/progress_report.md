# Progress Report: LLM-Based Test Generation from Gherkin (BDD)

*Last updated: October 15, 2026*


## 1. Our Approach

We use a zero-shot LLM approach that generates test code directly from Gherkin scenarios. To give the model the project context it needs, We developed a script that can generate a prompt consisting of -
1. **Gherkin scenario** — the target scenario to be implemented.
2. **DSL catalog** — the project's helpers and page objects.
3. **Existing step definitions** — all step definitions in the project, excluding those for the target test.
4. **Parameter types** — custom Cucumber parameter types, if any.
5. **World file** — the shared Cucumber world/context, if any.
6. **Constants** — project-level constants referenced by the tests.

A sample prompt is available here: [new_prompt_template.md](https://github.com/Talank/BDD_test_generation/blob/master/new_prompt_template.md)
## 2. Related Works

1. S. R. Ribeiro dos Santos et al., "Automated Test Generation Using LLM Based on BDD: A Comparative Study," in *Proc. 21st Int. Conf. Web Inf. Syst. Technol. (WEBIST 2025)*, 2025, pp. 47–57.
2. M. Ferreira, L. Viegas, J. P. Faria, and B. Lima, "Acceptance Test Generation with Large Language Models: An Industrial Case Study," *arXiv preprint* arXiv:2504.07244, 2025.
3. T. Stennett, R. Pan, B. McGinn, A. Orso, and S. Sinha, "Sakura: An Approach for Generating Complex Tests from Natural Language Test Descriptions," *Proc. ACM Softw. Eng.*, vol. 3 (ISSTA 2026), 2026.
4. Shi et al., "Bridging Behavior and Implementation: Automated Java Glue Code Generation for Behavior-Driven Development," *ACM Trans. Softw. Eng.*, 2026.
5. S. Karpurapu, S. Myneni, U. Nettur, L. S. Gajja, D. Burke, T. Stiehm, and J. Payne, "Comprehensive Evaluation and Insights Into the Use of Large Language Models in the Automation of Behavior-Driven Development Acceptance Test Formulation," *IEEE Access*, vol. 12, pp. 58715–58721, 2024.

## 3. Dataset and Project Selection

We are picking our projects for the experiment from a recent MSR paper that has published a Gherkin dataset - https://aserg.labsoft.dcc.ufmg.br/assets/papers/2026-msr-gwt.pdf
 
Reason to use this dataset:
 
* This dataset is relatively new.
* All the tests in this dataset are written in Gherkin Syntax.
* The dataset is already published

The dataset has projects from three different languages - Java, Javascript and Ruby. We are filtering only Java projects and sorting them by github stars. From the highest rated stars, we try to pick projects but many of them don't fit our criteria. Our criteria is made up of three things:- 
 
1. Is the repository non-archived?
2. Is it a real world project/tool?(not a template or tutorial project)
3. Is the gherkin for the project’s own test suite? (not dummy samples or bundled for something else)
The whole filtered projects list with reasoning for each one for the first 150 can be found here - 
https://github.com/Talank/BDD_test_generation/blob/master/playwright-github_actions-projects/output/all_projects_by_stars_with_reasoning.csv
 
(For now, I have selected the project cukedoctor which is the first Java project that meets our criteria that has more than 20 features. I have purposefully avoided including the cucumber java repo as its from cucumber itself)

## 4. Additional Work Completed

### 4.1 Replicating the Sakura workflow

We ran the Sakura workflow [3] and manually inspected its output, first on the paper's own setting and then on real-world Gherkin projects:

- Inspection of Sakura-generated test cases: [test_case_comparison_report_sakura.md](https://github.com/Talank/BDD_test_generation/blob/master/results/test_case_comparison_report_sakura.md)
- Sakura's performance on real-world Gherkin projects: [test_case_comparison_report_sakura_on_gherkin.md](https://github.com/Talank/BDD_test_generation/blob/master/results/test_case_comparison_report_sakura_on_gherkin.md)

### 4.2 Gherkin-only zero-shot prompting

In the early stages, we prompted the LLM with Gherkin scenarios alone, without any project context. The shortcomings observed in this setting motivated the context-rich prompt described in Section 1.

### 4.3 Inconsistencies report on related works
Study inconsistencies between dev test and gherkin scenarios from related works. Report - https://github.com/Talank/BDD_test_generation/blob/master/results/inconsistencies_report.md
