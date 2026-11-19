# Manual Test Sensei on BDD Projects: Report

**Tool:** Manual Test Sensei, from Soares et al., *"Manual Tests Do Smell! Cataloging and Identifying Natural Language Test Smells"* (arXiv:2308.01386)
**Projects:** the 26 projects marked `meets_criteria = Yes` in `all_projects_by_stars_with_reasoning.csv`, minus apickli, fastify-boilerplate, cucumber-js-tsflow and cucumber-mink
**Input:** feature files from `GivenWhenThen.json`

## Setup

- **The tool.** Cloned from `github.com/easy-software-ufal/manual-test-sensei`. It runs on Python 3.10 with spaCy 3.4.1 and the `en_core_web_lg` 3.4.1 language model. These are the tool's pinned versions, and the model is the one named in the authors' own results file.
- **Demo on the authors' data.** Ran a check, matches the authors' published results file exactly: 7,298 of 7,298 rows.
- **Gherkin adapter.** The tool can only read the Ubuntu test format, so  turns each scenario into the tool's own test structure, How the adapter works is given below:

| Gherkin | Tool concept |
|---|---|
| Background and Given steps | Preconditions (not checked by the tool) |
| Each When step | Action step |
| Each Then step | Verification step, placed under the latest When |
| And / But | Take the type of the step before them |

Step keywords are removed before analysis. `<placeholders>` in Scenario Outlines are kept as plain words. Doc strings and data tables are not analysed.

## Results

| Project | Features | Scenarios | Scenarios with a smell | Ambiguous | Conditional | Misplaced Precondition | Misplaced Verification | Unverified Action | Total |
|---|---|---|---|---|---|---|---|---|---|
| cucumber/cucumber-jvm | 47 | 69 | 30 | 11 | 1 | 17 | 3 | 21 | **53** |
| 7ep/demo | 11 | 39 | 24 | 25 | 0 | 0 | 3 | 0 | **28** |
| serenity-bdd/serenity-cucumber | 37 | 81 | 24 | 8 | 0 | 0 | 0 | 18 | **26** |
| SuffolkLITLab/ALKiln | 3 | 24 | 12 | 12 | 0 | 0 | 0 | 10 | **22** |
| znsio/teswiz | 18 | 46 | 13 | 10 | 0 | 0 | 0 | 9 | **19** |
| osvaldjr/easy-cucumber | 1 | 8 | 8 | 15 | 0 | 0 | 0 | 0 | **15** |
| selcukes/selcukes-java | 4 | 10 | 4 | 4 | 0 | 0 | 0 | 2 | **6** |
| martinschneider/justtestlah | 6 | 7 | 2 | 2 | 0 | 0 | 0 | 0 | **2** |
| telekom/bdd-web-app | 3 | 4 | 1 | 1 | 0 | 0 | 0 | 0 | **1** |
| 6 projects with no smells found¹ | 11 | 19 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| **Total** | **141** | **308** | **118** | **88** | **1** | **17** | **6** | **60** | **172** |

¹ cucumber-js, protractor-cucumber-framework, cukedoctor, react-redux-boilerplate, quarkus-cucumber, jfactory-cucumber

## Limitations

The Eager Action and Misplaced Action rules look for commands like "Click Save". BDD steps are usually first person ("I click Save"), so these smells are close to undetectable here.

The GWT dataset includes pair of scenario-step definitions but they are not all inclusive, they leave quite a bit of scenarios if no step definitions can be found through their tool but manual inspection shows that step definitions do exist
