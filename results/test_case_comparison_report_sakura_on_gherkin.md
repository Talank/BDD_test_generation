# Test Case Comparison Report: Sakura Workflow on a Gherkin Project (CukeDoctor)

Running the Sakura workflow on Gherkin scenarios. The config and everything is identical to the Sakura paper, nothing is changed from their public code repo. To accomodate Gherkin scenarios, the step definitions were converted to Junit test like how the Sakura workflow demands it. The converted test was compared with original dev written via Jacoco so that it confirms an identical and matches every line coverage.

| # | Test | 1. Does Scenario match dev test? | 2. Does Scenario match gen test? | 3. Does two tests match | 4. Category | 5. What should change |
|---|---|---|---|---|---|---|
| 1 | section-layout · Assigning a Feature to a Section | **Yes.**| **No.** no scenario or step is built, Three calls are invented| **No.** Does not compile | Generation Fault + Inadequate Scenario | **Generated test** , Call the correct three calls **Scenario** , explicitly name the classes|
| 4 | section-layout · Skipping | **Yes.** | **No.** Builds five empty features (three never used), drops every name and scenario, and replaces the expected document with `assertTrue(result != null)` ("Verification logic would go here") | **No.** Compiles, but throws an NPE | Generation Fault | **Generated test** , name the features, compare against the docstring; never replace the `Then` with a non-null check. |
| 8 | section-layout · The built-in Features Section | **Yes.** | **Partly.** `BuiltInFeaturesSection` is the right concept and a real class, but the feature builder chain, the fluent converter and `DocumentAttributes.builder()` are invented; the section is never rendered; asserts the flags it just set | **No.** Does not compile | Generation Fault | **Generated test** , let `SectionFeatureRenderer` assign the section; do not assert your own setup. |
| 9 | section-layout · When the Features Section is hidden | **Yes.**| **Partly.** Best step mapping in the set: each `Given` becomes a real `CukedoctorConfig` setter. But the whole Gherkin text is stuffed into `description`, the feature is read with the private `getFeature()`, and the classic renderer is used | **No.** Does not compile; with that fixed, the name is `null` so `= *Head Adornments*` can never appear | Generation Fault + Inadequate Scenario | **Generated test** , `build()`, a real name + scenario, `SectionFeatureRenderer`; **Scenario** , say the docstring is a feature file to run. |
| 12 | section-layout · Assigning a Feature to a Subsection | **Yes.** | **Partly.** All three features get the right tags (including `Relatives` with no section) and the expected document is copied in full, but no feature has a name or scenario; calls a non-existent `converter.setConfig(...)`; uses `renderDocumentation()` | **No.** Does not compile. Even if it did: NPE on sort, and `renderDocumentation()` adds a title + summary and nests every section one level deeper | Generation Fault | **Generated test** , names + scenarios, `SectionFeatureRenderer` + `CukedoctorDocumentBuilder.Factory.newInstance()`, `normaliseLineEndings`. |
| 16 | integration · Integration | **Mostly.** The dev test also hides the summary, isolates the intro chapter and zeroes step durations; none of that is in the scenario, yet the exact output depends on it | **Partly.** Right entry point (`Cukedoctor.instance`) and all three features with the right tags; but parses Gherkin text with `FeatureParser.parse` (expects a JSON *path*), builds a config it never passes, reads `getDocumentation()` without rendering | **No.** Compiles, NPE at `habitatFeature.get(0)`; the `contains` checks would also miss order, `[appendix]`, `Cranium` and heading levels | Generation Fault + Inadequate Scenario | **Generated test** , pass the config, call `renderDocumentation()`, compare the full document; **Scenario** , say "with the summary section hidden". |
| 17 | integration · Config | **Mostly.** Same hidden config as Test 16 | **Partly.** The step under test is right: "disabled the scenario keyword" → `setHideScenarioKeyword(true)`, and `contains("==== Tar Pits")` would really catch the keyword. Everything around it is wrong: invented builder calls, `null` attributes, `null` document builder | **No.** Does not compile; past that, NPE at `docBuilder.clear()`, and `null` attributes would drop the 13 header lines it asserts | Generation Fault + Inadequate Scenario | **Generated test** , `Cukedoctor.instance(features, new DocumentAttributes(), config)`; **Scenario** , "summary hidden". |
| 18 | converter · Whitespace in descriptions | **Yes.** Only hidden detail is that the docstring is run through Cucumber, so Gherkin splits it into name, description and scenarios | **Partly.** Docstring copied almost exactly and the right renderer class picked, but the whole Gherkin goes into the `description` of a nameless feature; `renderFeature` not `renderFeatures`; three fragment checks instead of the full block | **No.** Compiles, NPE inside the renderer; even past it, the indent baseline is 2 spaces instead of 4, so all three fragments mismatch | Generation Fault + Inadequate Scenario (mild) | **Generated test** , `new CukedoctorFeatureRenderer((DocumentAttributes) null)`, real name/description/scenarios, full-block `contains`. |
| 19 | multipage · One page per scenario | **Partly.** Title says "per scenario", the Rule and the files say per *feature*; "plugin" names the Maven plugin, but the dev test drives the `MultipageConverter` API over a Cucumber JSON report | **No.** Takes "plugin" literally: `CukedoctorMojo` (not on this module's classpath), never configured, exceptions swallowed; features and converter built and never used | **No.** Does not compile; nothing in it writes the files it checks | Inadequate Scenario + Generation Fault | **Scenario** , name `MultipageConverter` and the JSON input; **Generated test** , `saveDocumentation()`, never swallow exceptions, use the `@TempDir` it declares. |
| 20 | multipage · Setting the :toc: attribute | **Mostly.** Dev test only checks `contains(":toc:")`, which the default `:toc: right` already satisfies; "left" is never verified | **Partly.** Right classes (`MultipageConverter`, `DocumentAttributes.setToc`, `Page`) but an invented `.features(...)` builder, Gherkin through `FeatureParser.parse`, no `saveDocumentation()`; the actual check is left as a comment | **No.** Does not compile; no oracle | Generation Fault + Inadequate Scenario | **Generated test** , `saveDocumentation()`, then check `getToc()` is `"left"`; **Scenario** , say what value must appear. |

# Evaluation Table (10 sampled tests)

| Metric | My run (10 Gherkin scenarios) | Authors' Qwen3-Coder, low level (488) |
| :--- | :--- | :--- |
| **Compile rate** | 30% (3/10) | 88% |
| **Line coverage overlap** | 0.03 | 0.73 |
| **Focal method recall** | 0.01 | 0.81 |
| **Call recall** | 0.03 | 0.81 |
| **Assertion recall** | 0.07 | 0.87 |
| **Localization recall** | 0.09 | 0.82 |
| **Model calls per scenario** | 73 | 44 |
## Test 1 , Assigning a Feature to a Section (section-layout) - (Generation Fault + Inadequate Scenario)

Ground truth - `SectionLayoutScenariosTest#assigningAFeatureToASection`

**Three calls that do not exist, and the wrong renderer:**

```diff
- metaCuke.addFeature("@section-Dinosaurs\nFeature: Head Adornments\n\n  Scenario: Parasaurolophus\n\n    Given I have an implausible head adornment");
- metaCuke.runCucumber(InceptionStepDefs.class);
- List<Feature> features = FeatureParser.parse(metaCuke.getReport().getAbsolutePath());
- String renderedDocument = new SectionFeatureRenderer().renderFeatures(features, CukedoctorDocumentBuilder.Factory.newInstance());
+ Feature featureWithSection = FeatureBuilder.name("@section-Dinosaurs\nFeature: Head Adornments").build();  // name() is an instance method; tag ends up in the name
+ LayoutConfig layoutConfig = config.getLayoutConfig();                                                   // CukedoctorConfig has no getLayoutConfig()
+ FeatureSection section = new FeatureSection("Dinosaurs");                                              // constructor takes a Feature, not a String
+ String asciidocOutput = new CukedoctorFeatureRenderer().renderFeature(featureWithSection);              // classic layout: never emits "= *Dinosaurs*"
```

**Weak assertion:** the dev test compares the whole document with `assertEquals`; the generated test checks three substrings. Blank lines, anchors (`[[Dinosaurs, Dinosaurs]]`) and heading order are never checked.

**Result:** Does not compile.

---

## Test 4 , Skipping (section-layout) - (Generation Fault)

Ground truth - `SectionLayoutScenariosTest#skipping`

**Five features, none with a name or scenario; three never used:**

```diff
+ Feature feature1 = FeatureBuilder.instance().build();                       // unused
+ Feature feature2 = FeatureBuilder.instance().build();                       // unused
+ Feature feature2Tagged = FeatureBuilder.instance().tag("@skipDocs").build(); // unused
+ Feature anatomyFeature  = FeatureBuilder.instance().tag("@section-Anatomy").build();
+ Feature behaviorFeature = FeatureBuilder.instance().tag("@skipDocs").tag("@section-Behaviour").build();
+ LayoutConfig layoutConfig = new LayoutConfig();   // never connected to anything
```

**The `Then` is dropped:**

```diff
- assertEquals(normaliseLineEndings(expectedDocument), normaliseLineEndings(renderedDocument));
+ CukedoctorConverter result = converter.renderFeatures();   // returns `this`
+ // Verification logic would go here
+ assertTrue(result != null);
```

**Result:** Compiles, but never reaches the assertion. `Cukedoctor.instance` sorts the features in the converter constructor; both have no `@order-` tag, so `Feature.compareTo` falls back to `name.compareTo(...)` on a `null` name → `NullPointerException`. Hence 0.0 coverage despite compiling.

### What the test was about

The whole point is the *absence* of the `Behaviour` section (all its Features are `@skipDocs`). The generated test cannot check that: it has no expected document and no negative assertion. Missing `Head Adornments` / `Hunters` names means the output could not contain the expected headings anyway.

---

## Test 8 , The built-in Features Section (section-layout) - (Generation Fault)

Ground truth - `SectionLayoutScenariosTest#theBuiltInFeaturesSection`

| Generated | Reality |
|---|---|
| `FeatureBuilder.instance().feature().name(..).scenario().name(..).given(..)` | no `feature()`, no no-arg `scenario()`, no `given()`; `scenario(Scenario)` only |
| `CukedoctorConverter.instance().withFeatures(..).withLayoutConfig(..).withCukedoctorConfig(..)` | interface, no static factory, no `with*` methods; use `Cukedoctor.instance(...)` |
| `DocumentAttributes.builder().build()` | plain constructor + fluent setters |
| `new BuiltInFeaturesSection()` + `addFeatures(...)` | real, but never rendered |

**Self-checking asserts:**

```java
layoutConfig.setHideStepTime(true);
...
assertTrue(layoutConfig.isHideStepTime());           // asserts its own setup
assertTrue(config.isDisableMinMaxExtension());       // same
```

The same feature is also built twice (Step 0 and Step 4).

**Result:** Does not compile.

### Why `BuiltInFeaturesSection` was built by hand

"If the Features Section is enabled, Features will be rendered by default in the Features Section" reads as an instruction to create that section. In reality `SectionFeatureRenderer` → `DocumentSection` does the assignment; the test only has to render and compare.

---

## Test 9 , When the Features Section is hidden (section-layout) - (Generation Fault + Inadequate Scenario)

Ground truth - `SectionLayoutScenariosTest#whenTheFeaturesSectionIsHidden`

**Steps mapped well, Feature built wrongly:**

```diff
- metaCuke.addFeature("Feature: Head Adornments\n\n  Scenario: Parasaurolophus\n\n    Given I have an implausible head adornment");
+ Feature feature = FeatureBuilder.instance()
+     .description("Feature: Head Adornments\n\n  Scenario: Parasaurolophus\n\n    Given I have an implausible head adornment")
+     .getFeature();                                   // private: does not compile
- System.setProperty("HIDE_FEATURES_SECTION", "true");
+ config.setHideFeaturesSection(true);                 // real setter
+ config.setHideStepTime(true);                        // real setter
+ config.setDisableMinMaxExtension(true);              // real setter (narrower than "all extensions", same effect on this output)
- new SectionFeatureRenderer().renderFeatures(features, ...)
+ new CukedoctorFeatureRenderer(config).renderFeature(feature)
```

**Result:** Does not compile. With `build()` instead of `getFeature()`: the name is `null`, the Gherkin text is rendered inside a `****` sidebar, no scenario is rendered, so all three `contains` checks fail. `hideFeaturesSection` is also ignored by `renderFeature` (only `renderFeatures` reads it).

### Why the Gherkin went into `description`

This is the only test whose config handling is right, which shows the setters were findable. The missing link is the same as Test 1: the docstring is Gherkin *source* that has to be executed and parsed, not a description string, and the scenario does not say so.

---

## Test 12 , Assigning a Feature to a Subsection (section-layout) - (Generation Fault)

Ground truth - `SectionLayoutScenariosTest#assigningAFeatureToASubsection`

**Tags right, everything else missing:**

```diff
- "@section-Dinosaurs\n@subsection-Behaviour\nFeature: Eating Habits\n\n  Scenario: Hunting"
+ FeatureBuilder.instance().tag("@section-Dinosaurs").tag("@subsection-Behaviour").build();   // no name, no scenario
```

**Wrong pipeline and a non-existent setter:**

```diff
- new SectionFeatureRenderer().renderFeatures(features, CukedoctorDocumentBuilder.Factory.newInstance());
+ CukedoctorConverter converter = Cukedoctor.instance(Arrays.asList(feature1, feature2, feature3));
+ converter.setConfig(config);                       // no such method
+ String convertedAsciidoc = converter.renderDocumentation();
```

**Even if it compiled, it could not pass:**

- the three nameless features hit the same NPE on sort as Test 4;
- `renderDocumentation()` emits `= *Living Documentation*` and a summary first, and nests sections one level down (`== *Dinosaurs*`, as Test 16's expected output shows), while the expected string starts with `= *Dinosaurs*`;
- the expected string ends `Birds\n\n\n`; the docstring (and the dev test) end `Birds\n\n`;
- raw `assertEquals` with no `normaliseLineEndings`.

**Result:** Does not compile.

### Why `renderDocumentation()`

The scenario says "When I convert the Feature" (same words as Tests 1–9), but the generator picked the top-level `Cukedoctor` facade. Tests 16/17 use "When I run Cukedoctor" for that path; the distinction between *convert* (renderer only) and *run* (whole document) is only in the step definitions.

---

## Test 16 , Integration (section-layout) - (Generation Fault + Inadequate Scenario)

Ground truth - `SectionLayoutScenariosTest#integration`

**Gherkin text passed where a JSON path is expected:**

```diff
- metaCuke.runCucumber(InceptionStepDefs.class);
- List<Feature> features = FeatureParser.parse(metaCuke.getReport().getAbsolutePath());
+ List<Feature> habitatFeature = FeatureParser.parse("Feature: Habitat\n\n  Scenario: Tar Pits\n\n    Given I do not mind getting mucky");
+ ... habitatFeature.get(0)   // parse() opens the string as a file, catches FileNotFoundException, returns null → NPE
```

**Config built, never used; nothing rendered:**

```diff
- CukedoctorConfig config = new CukedoctorConfig().setHideSummarySection(true).setIntroChapterDir(tmp)...;
- String renderedDocument = Cukedoctor.instance(features, new DocumentAttributes(), config).renderDocumentation();
+ config.setHideFeaturesSection(false); config.setHideStepTime(true); config.setDisableMinMaxExtension(true);
+ CukedoctorConverter converter = Cukedoctor.instance(allFeatures, documentAttributes);   // default config, not `config`
+ String documentationOutput = converter.getDocumentation();                            // empty: nothing rendered yet
```

**What the 12 `contains` checks miss:** section order (Behaviour → Features → Anatomy), the `[appendix]` marker, the `Cranium` subsection, and heading depth (`===== Scenario: Parasaurolophus`). These are exactly what the integration scenario exercises.

**Result:** Compiles; NPE at `habitatFeature.get(0)`, so 0.0 coverage. Focal R 0.11 comes from the `Cukedoctor.instance` call.

### What the scenario leaves out

The expected output has no summary section and no step durations, and the dev test makes that happen with `setHideSummarySection(true)`, an empty intro directory and `setDuration(0L)` on every step. None of these is a step in the scenario. A generator that got every API right would still render a summary and fail an exact comparison.

---

## Test 17 , Config (section-layout) - (Generation Fault + Inadequate Scenario)

Ground truth - `SectionLayoutScenariosTest#config`

**The focal step is right:**

```java
config.setHideScenarioKeyword(true);                       // = dev's hideScenarioKeyword = true
assertTrue(generatedDocumentation.contains("==== Tar Pits"));   // fails if the keyword is shown ("==== Scenario: Tar Pits")
```

**The rest:**

```diff
+ Feature feature = featureBuilder.addFeature("Habitat").addScenario("Tar Pits").build();  // neither method exists
+ LayoutConfig layoutConfig = new LayoutConfig(); layoutConfig.setHideStepTime(true);     // dead object
+ DocumentAttributes documentAttributes = null;
+ Cukedoctor.instance(features, documentAttributes, config, null);                        // null CukedoctorDocumentBuilder
```

**Result:** Does not compile. With the builder fixed: `renderDocumentation()` calls `docBuilder.clear()` on `null` → NPE. With a builder supplied: `null` attributes make the header renderer return `""`, so all 13 header assertions (`:toc: right` … `:version-label: Version`) fail.

### Why it still scores 0.11 localization

Only the scenario-keyword step was localized; the others ("showing the Features Section" left as a comment, the other two sent to the wrong object). Same hidden summary/intro setup as Test 16.

---

## Test 18 , Whitespace in descriptions (converter) - (Generation Fault + Inadequate Scenario, mild)

Ground truth - `ConverterScenariosTest#whitespaceInDescriptions`

**Gherkin source used as a description:**

```diff
- metaCuke.addFeature(featureText);
- metaCuke.runCucumber("com.care.dont");
- List<Feature> features = FeatureParser.parse(metaCuke.getReport().getAbsolutePath());
- new CukedoctorFeatureRenderer((DocumentAttributes) null).renderFeatures(features, new CukedoctorDocumentBuilderImpl().createNestedBuilder());
+ Feature featureWithDescriptions = FeatureBuilder.instance().description(featureDescription).build();   // whole file in `description`, name null
+ new CukedoctorFeatureRenderer().renderFeature(featureWithDescriptions);
```

**Why it crashes:** the no-arg constructor takes the global `DocumentAttributes` (`backend: html5`) and a fresh config (min/max extension enabled), so `renderFeature` enters the min/max branch and calls `feature.getName().replace(...)` → NPE. The dev test passes `(DocumentAttributes) null` and skips that branch.

**Why it would still fail:** the de-indent baseline is the first non-blank line. In the dev test that is the description line (4 spaces). In the generated test it is `"  Feature: Feature One"` (2 spaces), so `"      Therefore"` becomes 4 spaces, not 2, and all three expected fragments miss.

**Small input drift:** one extra blank line before `Scenario: Scenario Two`, and the final `\n` dropped.

**Oracle:** three fragments vs one `contains` of the full block, which also covers `== *Features*`, the `****` sidebar and both scenario headings.

**Result:** Compiles; the only non-zero coverage in the set (28% lines), but the run ends with an NPE before any assertion.

### Why this is the closest case

The step definition uses the same `CukedoctorFeatureRenderer` class the generator chose, and the docstring was copied almost exactly. The only gap is the same one as Tests 1–17: the docstring has to go through Cucumber (or at least a Gherkin parse) to become a Feature.

---

## Test 19 , One page per scenario (multipage-layout) - (Inadequate Scenario + Generation Fault)

Ground truth - `MultipageScenariosTest#onePagePerScenario`

**"plugin" taken literally:**

```diff
- MultipageConverter multipageConverter = MultipageConverter.builder().attrs(attrs)
-     .jsonFileLocation("target/test-classes/json-output/").outputFolderLocation(outputFolderLocation).build();
- multipageConverter.saveDocumentation();
+ CukedoctorMojo mojo = new CukedoctorMojo();     // maven-plugin module: not a dependency of multipage-layout
+ try { mojo.execute(); } catch (Exception e) { /* Handle or ignore as needed */ }
```

**Built and never used:** both features (name only, no scenario: "For simplicity, we're just setting the name"), the `features` list ("Set the features to the mojo", never done), the `MultipageConverter`, and the `@TempDir`.

**Result:** Does not compile. Even if it did, nothing writes `Calculator1.adoc` / `Calculator2.adoc`; the existence checks could only pass on files left in `target/docs/generated/` by an earlier run of the dev test.

### Where the scenario misleads

- "I run the cukedoctor-multipage-layout **plugin**" points to the Maven Mojo; the dev test calls the `MultipageConverter` API.
- `MultipageConverter` takes no Feature objects at all; it reads Cucumber JSON files from `jsonFileLocation`. The scenario never mentions the JSON report.
- The Example title says "One page per scenario" while the Rule and the expected files are one page per **feature**.

---

## Test 20 , Setting the :toc: attribute (multipage-layout) - (Generation Fault + Inadequate Scenario)

Ground truth - `MultipageScenariosTest#settingTheTocAttribute`

**Right classes, invented builder, nothing run:**

```diff
+ List<Feature> featureFile1 = FeatureParser.parse(featureFileContent1);   // Gherkin text as path → null; addAll → NPE
+ MultipageConverter.builder().features(allFeatures)...                   // no features(...) on the builder
- multipageConverter.saveDocumentation();
+ List<Page> pages = converter.getPages();                                 // null until saveDocumentation() runs
```

**Oracle left as a comment:**

```java
DocumentAttributes attrs = page.getDocumentAttributes();
assertNotNull(attrs);
// Note: We're assuming there's a getter method for toc, but since we didn't find it,
// we'll check the render output or other means to verify the toc setting
```

`DocumentAttributes.getToc()` exists.

**Result:** Does not compile; the property under test is never asserted.

### A weakness in the dev test too

The dev test checks `fileContent.contains(":toc:")`. Default attributes already carry `toc: right`, so the check passes without `attrs.toc("left")`; "left" is never verified. The dev test also sets `toc` on the global `GlobalConfig` singleton and never resets it. The scenario ("have the `:toc:` meta property set") mirrors that weak check, so it gives the generator no value to assert.

---

## Patterns across the 10 cases

**1. The Inception step is invisible (all 10).** Every dev test writes the docstring to a `.feature` file, runs it through Cucumber with stub steps (`MetaCuke` + `InceptionStepDefs`), and parses the JSON report. The scenarios only say "I have the Feature" / "the following feature file". The generator built Features in memory instead, using three different wrong routes:

| Route | Tests | Why it fails |
|---|---|---|
| `FeatureBuilder` with tags only / name only | 4, 8, 12, 17, 19 | no name → NPE on sort; no scenarios; no step results, so no "Passed" icon |
| Whole Gherkin text in `description` | 9, 18 | name `null`; text rendered as a sidebar; wrong indent baseline |
| `FeatureParser.parse(gherkinText)` | 16, 20 | `parse` expects a JSON file path, returns `null` |

**2. Shared steps mapped to objects that are never read (7 section-layout tests).**

| Step | Dev test | Generated |
|---|---|---|
| I am hiding step timings | `System.setProperty("HIDE_STEP_TIME","true")` | `new LayoutConfig().setHideStepTime(true)` (4, 8, 17); `config.getLayoutConfig()` (1, does not exist); `CukedoctorConfig.setHideStepTime` (9, 12, 16, real but not passed in 12 and 16) |
| all Cukedoctor extensions are disabled | `cukedoctor.disable-extensions` property | `setDisableMinMaxExtension(true)` on a config that is mostly never passed |
| I am showing/hiding the Features Section | `HIDE_FEATURES_SECTION` property | `setHideFeaturesSection` (9, 12, 16) or a comment (17) |

**3. `SectionFeatureRenderer` used in 0 of 7 section-layout tests.** The classic renderer (1, 9), the `Cukedoctor` facade (4, 12, 16, 17) or an invented converter (8) were used instead.

**4. Exact oracles downgraded.** All 7 section-layout dev tests use `assertEquals` on the whole document. Generated tests use substring checks (1, 8, 9, 16, 17), a non-null check (4), or a comment (20). Only Test 12 kept the full expected string.

**5. "Compiles" does not mean "runs".** Tests 4, 16 and 18 compile and all three throw an NPE before any assertion.

**6. What the scenarios would need.** Name the converter entry point (`SectionFeatureRenderer`, `MultipageConverter`), say the inner feature is executed and its steps pass, and spell out hidden configuration that shapes the expected output (summary hidden, durations zeroed, the expected `:toc:` value).
