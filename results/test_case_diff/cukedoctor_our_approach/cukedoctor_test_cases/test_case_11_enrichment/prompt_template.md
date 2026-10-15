# ROLE
You write Cucumber-JVM step definitions in Java from Gherkin steps.

The Gherkin says what to test. Your job is to wire each gherkin step to code that already exists. Never add, drop,
or improve test coverage.

Each step's text becomes a pattern. Cucumber matches it at runtime. A pattern
is written once and shared by every scenario that uses it — across the whole glue.

# RULES
1. **Only call what is listed.** Types and methods from DSL CATALOG, collaborators
   from SHARED CONTEXT, types from PARAMETER TYPES. Never invent a class, method
   or field. Plain Java, the Cucumber `DataTable` API, and the libraries the
   existing step definitions already import (their assertion library, WebDriver,
   RestAssured, ...) are fine — used the way those files use them. Reach the DSL
   the same way the existing step definitions do.
2. **Bind the way this repo binds.** If existing step classes use annotated
   methods (`@Given(<pattern>) public void ...`), write annotated methods. If they
   implement `En` and register lambdas in the constructor, do that. Import the
   annotations from the same package the existing files use (`io.cucumber.java.en`
   vs the legacy `cucumber.api.java.en`).
3. **One binding per pattern.** Two steps that differ only in a value —
   `"admin"` vs `"editor"` — are one binding with one parameter.
4. **Never redefine a registered step.** Cucumber fails the whole run on a
   duplicate. If your pattern would match a step in REGISTERED STEPS, skip it and
   write `// EXISTS: <step text>`. But "looks similar" is not "matches" — if
   unsure, write the binding.
5. **Keep the step text as written.** Copy it exactly, replacing only what
   varies. Never reword a step or add quotes to make it easier to parameterize.
   Use the pattern style the existing bindings use: Cucumber Expressions, or
   regular expressions (a pattern starting with `^` or ending with `$` is a regex).
   - quoted text → `{string}`                       (regex: `"([^"]*)"`)
   - a number → `{int}` / `{long}` / `{double}`     (regex: `(\\d+)`)
   - a bare word that varies → a PARAMETER TYPE, or `{word}`
   - anything else → leave as plain text

   `{string}` only matches quoted text. Using it on a bare word means the step
   never matches at runtime. Remember Java string escaping: a regex `\d` is
   written `"\\d"` inside the annotation.
6. **Method parameters follow the pattern.** One parameter per capture, in
   order, with the type the parameter type produces (`{int}` → `int`, `{string}`
   → `String`, a custom type → the return type listed in PARAMETER TYPES). A data
   table or doc string arrives as the LAST parameter (`DataTable`, or a type a
   listed `@DataTableType` produces); hand it over whole.
7. **Pass values through.** Captured parameters go straight to the DSL call —
   never paste a literal from the step text. Use CONSTANTS only for values the
   step implies but does not state.
8. **Keep bodies thin.** If one DSL method does the step, that call is the
   whole body. Pick the most specific one.
9. **Share state the way this repo does.** Cucumber creates a fresh instance of
   every step class per scenario. Fields of your class are shared only by steps
   in that class. To share with other step classes, use the injected context
   object exactly as SHARED CONTEXT shows (same constructor / `@Autowired` /
   static accessor). Never introduce a new static field for scenario state.
10. **Say when you cannot map it.** Do not guess.
   - no DSL method fits        → `// UNMAPPED: <step text>`
   - a needed value is missing → `// UNMAPPED (missing value): <step text>`
   - two methods fit equally   → pick the more specific; if still tied,
                                 `// UNMAPPED (ambiguous): <step text>`


# THE RUNNER HANDLES THESE — YOU DO NOT

- **Scenario Outline.** Write ONE binding. The runner replaces each
  `<placeholder>` with its Examples value before matching, so your pattern must
  match the replaced value, not the `<placeholder>` text. A quoted Examples cell
  → `{string}`, a number → `{int}`, a bare word → `{word}` or a PARAMETER TYPE.
  A spot that holds a `<placeholder>` always varies, so it is never plain text.
  Do not write one binding per row.
- **Background.** Its steps are normal steps. Define any that are missing.
- **@tags.** Emit nothing for them.
- **Hooks.** Do not write `@Before` / `@After` hooks unless EXISTING STEP
  DEFINITIONS already has them in a step class.
- **Runner classes.** Do not write a `@CucumberOptions` / `@Suite` runner.

# OUTPUT
Return ONE complete, compilable Java source file: package declaration, imports,
and a single public step-definition class. Put it in this glue package:

```java
package com.github.cukedoctor.bdd.cukedoctor;   // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/   glue: com.github.cukedoctor.bdd.cukedoctor
```

---
# DSL CATALOG  (the only types and methods you may call)
```java
// ===== PUBLIC SURFACE INDEX (auto-extracted; import by the package shown) =====
// cukedoctor-converter/src/main/java/com/github/cukedoctor/Cukedoctor.java   (package com.github.cukedoctor)
//   class Cukedoctor
//     - static Cukedoctor#instance(List<Feature> features, DocumentAttributes attrs, CukedoctorConfig cukedoctorConfig, CukedoctorDocumentBuilder docBuilder) : CukedoctorConverter
//     - static Cukedoctor#instance(List<Feature> features, DocumentAttributes attrs, CukedoctorConfig cukedoctorConfig) : CukedoctorConverter
//     - static Cukedoctor#instance(List<Feature> features, DocumentAttributes attrs) : CukedoctorConverter
//     - static Cukedoctor#instance(List<Feature> features, CukedoctorDocumentBuilder docBuilder) : CukedoctorConverter
//     - static Cukedoctor#instance(List<Feature> features) : CukedoctorConverter
//     - static Cukedoctor#getDefaultDocumentAttributes() : DocumentAttributes
//     - static Cukedoctor#getDefaultConfig() : CukedoctorConfig
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/CukedoctorConverter.java   (package com.github.cukedoctor.api)
//   interface CukedoctorConverter
//     - CukedoctorConverter#getDocumentAttributes() : DocumentAttributes
//     - CukedoctorConverter#getFeatures() : List<Feature>
//     - CukedoctorConverter#getDocumentation() : String
//     - CukedoctorConverter#renderDocumentation() : String
//     - CukedoctorConverter#getDocumentationTitle() : String
//     - CukedoctorConverter#renderFeatures(List<Feature> features) : CukedoctorConverter
//     - CukedoctorConverter#renderFeatures() : CukedoctorConverter
//     - CukedoctorConverter#renderAttributes() : CukedoctorConverter
//     - CukedoctorConverter#renderSummary() : CukedoctorConverter
//     - CukedoctorConverter#setFilename(String filename) : CukedoctorConverter
//     - CukedoctorConverter#getFilename() : String
//     - CukedoctorConverter#addCustomCss() : CukedoctorConverter
//     - CukedoctorConverter#addCustomPdfTheme() : CukedoctorConverter
//     - CukedoctorConverter#saveDocumentation() : CukedoctorConverter
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/CukedoctorDocumentBuilder.java   (package com.github.cukedoctor.api)
//   interface CukedoctorDocumentBuilder extends MarkupDocBuilder
//     - CukedoctorDocumentBuilder#attributes() : AttributesBuilder
//     - CukedoctorDocumentBuilder#sideBarBlock(String text) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#append(Object... text) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#textLine(String text) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#sectionTitleLevel5(String title) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#title(String title) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#nestTitle() : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#unNestTitle() : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#titleThenNest(String title) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#clear() : void
//     - CukedoctorDocumentBuilder#createNestedBuilder() : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilder#createPeerBuilder() : CukedoctorDocumentBuilder
//   class Factory
//     - static CukedoctorDocumentBuilder.Factory#instance() : CukedoctorDocumentBuilder
//     - static CukedoctorDocumentBuilder.Factory#newInstance() : CukedoctorDocumentBuilder
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/DocumentAttributes.java   (package com.github.cukedoctor.api)
//   class DocumentAttributes
//     - new DocumentAttributes()
//     - DocumentAttributes#docTitle(String docTitle) : DocumentAttributes
//     - DocumentAttributes#backend(String backend) : DocumentAttributes
//     - DocumentAttributes#docType(String docType) : DocumentAttributes
//     - DocumentAttributes#toc(String toc) : DocumentAttributes
//     - DocumentAttributes#tocLevels(String tocLevels) : DocumentAttributes
//     - DocumentAttributes#icons(String icons) : DocumentAttributes
//     - DocumentAttributes#chapterLabel(String chapterLabel) : DocumentAttributes
//     - DocumentAttributes#versionLabel(String versionLabel) : DocumentAttributes
//     - DocumentAttributes#sectAnchors(Boolean sectAnchors) : DocumentAttributes
//     - DocumentAttributes#sectLink(Boolean sectLink) : DocumentAttributes
//     - DocumentAttributes#numbered(Boolean numbered) : DocumentAttributes
//     - DocumentAttributes#linkCss(Boolean linkCss) : DocumentAttributes
//     - DocumentAttributes#docInfo(Boolean docInfo) : DocumentAttributes
//     - DocumentAttributes#sourceHighlighter(String sourceHighlighter) : DocumentAttributes
//     - DocumentAttributes#revNumber(String docVersion) : DocumentAttributes
//     - DocumentAttributes#hardBreaks(Boolean hardBreaks) : DocumentAttributes
//     - DocumentAttributes#pdfStyle(String pdfStyle) : DocumentAttributes
//     - DocumentAttributes#stem(String stem) : DocumentAttributes
//     - DocumentAttributes#allowUriRead(Boolean allowUriRead) : DocumentAttributes
//     - DocumentAttributes#dataUri(Boolean dataUri) : DocumentAttributes
//     - DocumentAttributes#getBackend() : String
//     - DocumentAttributes#getDocTitle() : String
//     - DocumentAttributes#getDocType() : String
//     - DocumentAttributes#getToc() : String
//     - DocumentAttributes#getIcons() : String
//     - DocumentAttributes#getTocLevels() : String
//     - DocumentAttributes#getChapterLabel() : String
//     - DocumentAttributes#getVersionLabel() : String
//     - DocumentAttributes#getSourceHighlighter() : String
//     - DocumentAttributes#getRevNumber() : String
//     - DocumentAttributes#getPdfStyle() : String
//     - DocumentAttributes#isSectAnchors() : Boolean
//     - DocumentAttributes#isSectLink() : Boolean
//     - DocumentAttributes#isNumbered() : Boolean
//     - DocumentAttributes#isLinkCss() : Boolean
//     - DocumentAttributes#isDocInfo() : Boolean
//     - DocumentAttributes#isHardBreaks() : Boolean
//     - DocumentAttributes#getStem() : String
//     - DocumentAttributes#isAllowUriRead() : Boolean
//     - DocumentAttributes#isDataUri() : Boolean
//     - DocumentAttributes#setPdfStyle(String pdfStyle) : void
//     - DocumentAttributes#setDocTitle(String docTitle) : void
//     - DocumentAttributes#setBackend(String backend) : void
//     - DocumentAttributes#setDocType(String docType) : void
//     - DocumentAttributes#setToc(String toc) : void
//     - DocumentAttributes#setIcons(String icons) : void
//     - DocumentAttributes#setTocLevels(String tocLevels) : void
//     - DocumentAttributes#setChapterLabel(String chapterLabel) : void
//     - DocumentAttributes#setVersionLabel(String versionLabel) : void
//     - DocumentAttributes#setLinkCss(Boolean linkCss) : void
//     - DocumentAttributes#setSectAnchors(Boolean sectAnchors) : void
//     - DocumentAttributes#setSectLink(Boolean sectLink) : void
//     - DocumentAttributes#setNumbered(Boolean numbered) : void
//     - DocumentAttributes#setDocInfo(Boolean docInfo) : void
//     - DocumentAttributes#setSourceHighlighter(String sourceHighlighter) : void
//     - DocumentAttributes#setRevNumber(String revNumber) : void
//     - DocumentAttributes#setHardBreaks(Boolean hardBreaks) : void
//     - DocumentAttributes#setStem(String stem) : void
//     - DocumentAttributes#setAllowUriRead(Boolean allowUriRead) : void
//     - DocumentAttributes#setDataUri(Boolean dataUri) : void
//     - DocumentAttributes#toMap() : Map<String, Object>
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/ScenarioResults.java   (package com.github.cukedoctor.api)
//   class ScenarioResults
//     - [package-private] ScenarioResults.passedScenarios : List<Scenario>
//     - [package-private] ScenarioResults.failedScenarios : List<Scenario>
//     - new ScenarioResults(List<Scenario> passedScenarios, List<Scenario> failedScenarios)
//     - ScenarioResults#getNumberOfScenariosPassed() : Integer
//     - ScenarioResults#getNumberOfScenariosFailed() : Integer
//     - ScenarioResults#getPassedScenarios() : List<Scenario>
//     - ScenarioResults#getFailedScenarios() : List<Scenario>
//     - ScenarioResults#getNumberOfScenarios() : Integer
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/StepResults.java   (package com.github.cukedoctor.api)
//   class StepResults
//     - new StepResults(List<Step> allSteps, Map<Status, AtomicInteger> statusCounter, long totalDuration)
//     - StepResults#getNumberOfSteps() : int
//     - StepResults#getNumberOfPasses() : int
//     - StepResults#getNumberOfFailures() : int
//     - StepResults#getNumberOfUndefined() : int
//     - StepResults#getNumberOfPending() : int
//     - StepResults#getNumberOfSkipped() : int
//     - StepResults#getNumberOfMissing() : int
//     - StepResults#getTotalDuration() : long
//     - StepResults#getTotalDurationAsString() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/builder/AttributesBuilder.java   (package com.github.cukedoctor.api.builder)
//   interface AttributesBuilder
//     - AttributesBuilder#toc(String value) : AttributesBuilder
//     - AttributesBuilder#backend(String value) : AttributesBuilder
//     - AttributesBuilder#docTitle(String value) : AttributesBuilder
//     - AttributesBuilder#docType(String value) : AttributesBuilder
//     - AttributesBuilder#icons(String value) : AttributesBuilder
//     - AttributesBuilder#numbered(Boolean value) : AttributesBuilder
//     - AttributesBuilder#linkcss(Boolean value) : AttributesBuilder
//     - AttributesBuilder#sectAnchors(Boolean value) : AttributesBuilder
//     - AttributesBuilder#sectLink(Boolean value) : AttributesBuilder
//     - AttributesBuilder#docInfo(Boolean value) : AttributesBuilder
//     - AttributesBuilder#hardBreaks(Boolean value) : AttributesBuilder
//     - AttributesBuilder#sourceHighlighter(String value) : AttributesBuilder
//     - AttributesBuilder#revNumber(String value) : AttributesBuilder
//     - AttributesBuilder#tocLevels(String value) : AttributesBuilder
//     - AttributesBuilder#pdfStyle(String value) : AttributesBuilder
//     - AttributesBuilder#chapterLabel(String value) : AttributesBuilder
//     - AttributesBuilder#versionLabel(String value) : AttributesBuilder
//     - AttributesBuilder#stem(String value) : AttributesBuilder
//     - AttributesBuilder#allowUriRead(Boolean value) : AttributesBuilder
//     - AttributesBuilder#dataUri(Boolean value) : AttributesBuilder
//     - AttributesBuilder#asciiDocBuilder() : AsciiDocBuilder
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Argument.java   (package com.github.cukedoctor.api.model)
//   class Argument
//     - Argument#getVal() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Comment.java   (package com.github.cukedoctor.api.model)
//   class Comment
//     - Comment#getValue() : String
//     - Comment#setValue(String value) : void
//     - Comment#getLine() : Integer
//     - Comment#setLine(Integer line) : void
//     - Comment#getLanguage() : Optional<String>
//     - protected Comment#extractPattern(String pattern) : Optional<String>
//     - Comment#getOrder() : Optional<String>
//     - Comment#toString() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/DocString.java   (package com.github.cukedoctor.api.model)
//   class DocString
//     - DocString#getValue() : String
//     - DocString#setValue(String value) : void
//     - DocString#getContentType() : String
//     - DocString#setContentType(String value) : void
//     - DocString#isDiscrete() : boolean
//     - DocString#toString() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Embedding.java   (package com.github.cukedoctor.api.model)
//   class Embedding
//     - Embedding#getData() : String
//     - Embedding#setData(String data) : void
//     - Embedding#getMimeType() : String
//     - Embedding#setMimeType(String mimeType) : void
//     - Embedding#getName() : String
//     - Embedding#setName(String name) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Example.java   (package com.github.cukedoctor.api.model)
//   class Example
//     - Example#getName() : String
//     - Example#setName(String name) : void
//     - Example#getRows() : Row[]
//     - Example#setRows(Row[] rows) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Feature.java   (package com.github.cukedoctor.api.model)
//   class Feature implements Comparable<Feature>
//     - new Feature()
//     - Feature#getId() : String
//     - Feature#setId(String id) : void
//     - Feature#getUri() : String
//     - Feature#setUri(String uri) : void
//     - Feature#hasTags() : boolean
//     - Feature#hasScenarios() : boolean
//     - Feature#getStatus() : Status
//     - Feature#getName() : String
//     - Feature#setName(String name) : void
//     - Feature#getDescription() : String
//     - Feature#setDescription(String description) : void
//     - Feature#getKeyword() : String
//     - Feature#setKeyword(String keyword) : void
//     - Feature#getElements() : List<Scenario>
//     - Feature#setElements(List<Scenario> elements) : void
//     - Feature#getTags() : List<Tag>
//     - Feature#setTags(List<Tag> tags) : void
//     - Feature#getStepResults() : StepResults
//     - Feature#getScenarioResults() : ScenarioResults
//     - Feature#getComments() : List<Comment>
//     - Feature#setComments(List<Comment> comments) : void
//     - Feature#isBackgroundRendered() : boolean
//     - Feature#setBackgroundRendered(boolean backgroundRendered) : void
//     - Feature#getNumberOfScenarios() : Integer
//     - Feature#getNumberOfSteps() : Integer
//     - Feature#getNumberOfPasses() : Integer
//     - Feature#getNumberOfFailures() : Integer
//     - Feature#getNumberOfPending() : Integer
//     - Feature#getNumberOfSkipped() : Integer
//     - Feature#getNumberOfMissing() : Integer
//     - Feature#getNumberOfUndefined() : Integer
//     - Feature#getDurationOfSteps() : String
//     - Feature#getNumberOfScenariosPassed() : Integer
//     - Feature#getNumberOfScenariosFailed() : Integer
//     - Feature#getScenarios() : List<Scenario>
//     - Feature#initScenarios() : void
//     - Feature#processSteps() : void
//     - Feature#isCucumberFeature() : boolean
//     - Feature#getLanguage() : String
//     - Feature#getOrder() : int
//     - Feature#equals(Object o) : boolean
//     - Feature#hashCode() : int
//     - Feature#hasIgnoreDocsTag() : boolean
//     - Feature#toString() : String
//     - Feature#compareTo(Feature other) : int
//     - Feature#getScenarioByName(String name) : Scenario
//     - Feature#hasTag(String pattern) : boolean
//     - Feature#extractTag(String pattern) : Optional<String>
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Match.java   (package com.github.cukedoctor.api.model)
//   class Match
//     - new Match()
//     - new Match(String location)
//     - Match#getArguments() : List<Argument>
//     - Match#getLocation() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Output.java   (package com.github.cukedoctor.api.model)
//   class Output
//     - new Output(String value)
//     - Output#getValue() : String
//     - Output#setValue(String value) : void
//     - Output#toString() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Result.java   (package com.github.cukedoctor.api.model)
//   class Result
//     - new Result()
//     - new Result(Status status)
//     - Result#getStatus() : Status
//     - Result#setStatus(Status status) : void
//     - Result#getDuration() : Long
//     - Result#setDuration(Long duration) : void
//     - Result#getErrorMessage() : String
//     - Result#setErrorMessage(String errorMessage) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Row.java   (package com.github.cukedoctor.api.model)
//   class Row
//     - new Row()
//     - Row#getCells() : String[]
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Scenario.java   (package com.github.cukedoctor.api.model)
//   class Scenario
//     - Scenario#getName() : String
//     - Scenario#setName(String name) : void
//     - Scenario#getDescription() : String
//     - Scenario#setDescription(String description) : void
//     - Scenario#getKeyword() : String
//     - Scenario#setKeyword(String keyword) : void
//     - Scenario#getSteps() : List<Step>
//     - Scenario#setSteps(List<Step> steps) : void
//     - Scenario#getTags() : List<Tag>
//     - Scenario#setTags(List<Tag> tags) : void
//     - Scenario#getType() : Type
//     - Scenario#setType(Type type) : void
//     - Scenario#getExamples() : List<Example>
//     - Scenario#setExamples(List<Example> examples) : void
//     - Scenario#isBackground() : boolean
//     - Scenario#getStatus() : Status
//     - Scenario#hasSteps() : boolean
//     - Scenario#hasExamples() : boolean
//     - Scenario#equals(Object o) : boolean
//     - Scenario#hashCode() : int
//     - Scenario#hasTags() : boolean
//     - Scenario#hasIgnoreDocsTag() : boolean
//     - Scenario#getStepByName(String stepName) : Step
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/ScenarioTotalizations.java   (package com.github.cukedoctor.api.model)
//   class ScenarioTotalizations
//     - new ScenarioTotalizations()
//     - new ScenarioTotalizations(List<Feature> features)
//     - ScenarioTotalizations#addFeatureTotals(Feature feature) : void
//     - ScenarioTotalizations#getTotalPassedScenarios() : int
//     - ScenarioTotalizations#getTotalFailedScenarios() : int
//     - ScenarioTotalizations#getTotalScenarios() : int
//     - ScenarioTotalizations#getTotalPassedSteps() : int
//     - ScenarioTotalizations#getTotalFailedSteps() : int
//     - ScenarioTotalizations#getTotalSkippedSteps() : int
//     - ScenarioTotalizations#getTotalPendingSteps() : int
//     - ScenarioTotalizations#getTotalMissingSteps() : int
//     - ScenarioTotalizations#getTotalUndefinedSteps() : int
//     - ScenarioTotalizations#getTotalSteps() : int
//     - ScenarioTotalizations#getTotalDuration() : long
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Status.java   (package com.github.cukedoctor.api.model)
//   enum Status
//     - Status.{passed, failed, skipped, pending, undefined, missing}
//     - static Status#getStatusColor(Status status) : String
//     - static Status#getStatusIcon(Status status) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Step.java   (package com.github.cukedoctor.api.model)
//   class Step
//     - Step#getName() : String
//     - Step#setName(String name) : void
//     - Step#getKeyword() : String
//     - Step#setKeyword(String keyword) : void
//     - Step#getLine() : String
//     - Step#setLine(String line) : void
//     - Step#getResult() : Result
//     - Step#setResult(Result result) : void
//     - Step#getRows() : Row[]
//     - Step#setRows(Row[] rows) : void
//     - Step#getMatch() : Match
//     - Step#setMatch(Match match) : void
//     - Step#getOutput() : List<Output>
//     - Step#setOutput(List<Output> output) : void
//     - Step#getComments() : List<Comment>
//     - Step#setComments(List<Comment> comments) : void
//     - Step#getDocString() : DocString
//     - Step#setDocString(DocString docString) : void
//     - Step#getEmbeddings() : List<Embedding>
//     - Step#setEmbeddings(List<Embedding> embeddings) : void
//     - Step#getDuration() : Long
//     - Step#getStatus() : Status
//     - Step#isFailling() : boolean
//     - Step#isMissing() : boolean
//     - Step#isPassing() : boolean
//     - Step#isPendding() : boolean
//     - Step#isUndefined() : boolean
//     - Step#isSkipped() : boolean
//     - Step#equals(Object o) : boolean
//     - Step#hashCode() : int
//     - Step#hasComments() : boolean
//     - Step#hasDiscreteComment() : boolean
//     - Step#toString() : String
//     - Step#hasOutput() : boolean
//     - Step#hasEmbeddings() : boolean
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Tag.java   (package com.github.cukedoctor.api.model)
//   class Tag
//     - new Tag()
//     - new Tag(String name)
//     - Tag#extractPattern(String pattern) : Optional<String>
//     - Tag#getName() : String
//     - Tag#isOrder() : boolean
//     - Tag#getOrder() : Optional<String>
//     - Tag#isDiscrete() : boolean
//     - Tag#isLanguage() : boolean
//     - Tag#getLanguage() : Optional<String>
// cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Type.java   (package com.github.cukedoctor.api.model)
//   enum Type
//     - Type.{scenario, scenario_outline, background}
// cukedoctor-converter/src/main/java/com/github/cukedoctor/builder/AttributesBuilderImpl.java   (package com.github.cukedoctor.builder)
//   class AttributesBuilderImpl implements AttributesBuilder
//     - new AttributesBuilderImpl(AsciiDocBuilder docBuilder)
//     - AttributesBuilderImpl#toc(String value) : AttributesBuilder
//     - AttributesBuilderImpl#backend(String value) : AttributesBuilder
//     - AttributesBuilderImpl#docTitle(String value) : AttributesBuilder
//     - AttributesBuilderImpl#docType(String value) : AttributesBuilder
//     - AttributesBuilderImpl#icons(String value) : AttributesBuilder
//     - AttributesBuilderImpl#numbered(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#linkcss(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#sectAnchors(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#sectLink(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#docInfo(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#hardBreaks(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#sourceHighlighter(String value) : AttributesBuilder
//     - AttributesBuilderImpl#tocLevels(String value) : AttributesBuilder
//     - AttributesBuilderImpl#chapterLabel(String value) : AttributesBuilder
//     - AttributesBuilderImpl#versionLabel(String value) : AttributesBuilder
//     - AttributesBuilderImpl#pdfStyle(String value) : AttributesBuilder
//     - AttributesBuilderImpl#stem(String value) : AttributesBuilder
//     - AttributesBuilderImpl#allowUriRead(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#dataUri(Boolean value) : AttributesBuilder
//     - AttributesBuilderImpl#asciiDocBuilder() : AsciiDocBuilder
//     - AttributesBuilderImpl#revNumber(String value) : AttributesBuilder
// cukedoctor-converter/src/main/java/com/github/cukedoctor/builder/CukedoctorDocumentBuilderImpl.java   (package com.github.cukedoctor.builder)
//   class CukedoctorDocumentBuilderImpl extends AsciiDocBuilder implements CukedoctorDocumentBuilder
//     - new CukedoctorDocumentBuilderImpl()
//     - CukedoctorDocumentBuilderImpl#attributes() : AttributesBuilder
//     - CukedoctorDocumentBuilderImpl#sideBarBlock(String text) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#append(Object... text) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#textLine(String text) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#sectionTitleLevel5(String title) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#title(String title) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#nestTitle() : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#unNestTitle() : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#titleThenNest(String title) : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#clear() : void
//     - CukedoctorDocumentBuilderImpl#createNestedBuilder() : CukedoctorDocumentBuilder
//     - CukedoctorDocumentBuilderImpl#createPeerBuilder() : CukedoctorDocumentBuilder
//   public static class NestingOverflowException extends RuntimeException
//     - new CukedoctorDocumentBuilderImpl.NestingOverflowException()
//   public static class NestingUnderflowException extends RuntimeException
//     - new CukedoctorDocumentBuilderImpl.NestingUnderflowException(int currentLevel)
// cukedoctor-converter/src/main/java/com/github/cukedoctor/config/CukedoctorConfig.java   (package com.github.cukedoctor.config)
//   class CukedoctorConfig implements Serializable
//     - new CukedoctorConfig()
//     - CukedoctorConfig#getErrorMessageSize() : Integer
//     - CukedoctorConfig#getIntroChapterDir() : String
//     - CukedoctorConfig#getCustomizationDir() : String
//     - CukedoctorConfig#isHideFeaturesSection() : Boolean
//     - CukedoctorConfig#isHideStepTime() : Boolean
//     - CukedoctorConfig#isHideSummarySection() : boolean
//     - CukedoctorConfig#isHideScenarioKeyword() : Boolean
//     - CukedoctorConfig#isHideTags() : Boolean
//     - CukedoctorConfig#isDisableMinMaxExtension() : Boolean
//     - CukedoctorConfig#getIntroChapterRelativePath() : String
//     - CukedoctorConfig#setCustomizationDir(String customizationDir) : CukedoctorConfig
//     - CukedoctorConfig#setDisableMinMaxExtension(Boolean disableMinMaxExtension) : CukedoctorConfig
//     - CukedoctorConfig#setHideScenarioKeyword(Boolean hideScenarioKeyword) : CukedoctorConfig
//     - CukedoctorConfig#setErrorMessageSize(Integer errorMessageSize) : CukedoctorConfig
//     - CukedoctorConfig#setIntroChapterDir(String introChapterDir) : CukedoctorConfig
//     - CukedoctorConfig#setIntroChapterRelativePath(String introChapterRelativePath) : CukedoctorConfig
//     - CukedoctorConfig#setHideFeaturesSection(Boolean hideFeaturesSection) : CukedoctorConfig
//     - CukedoctorConfig#setHideStepTime(Boolean hideStepTime) : CukedoctorConfig
//     - CukedoctorConfig#setHideSummarySection(Boolean hideSummarySection) : CukedoctorConfig
//     - CukedoctorConfig#setHideTags(Boolean hideTags) : CukedoctorConfig
// cukedoctor-converter/src/main/java/com/github/cukedoctor/config/GlobalConfig.java   (package com.github.cukedoctor.config)
//   class GlobalConfig
//     - static GlobalConfig#getInstance() : GlobalConfig
//     - static GlobalConfig#newInstance() : GlobalConfig
//     - GlobalConfig#getDocumentAttributes() : DocumentAttributes
//     - GlobalConfig#setDocumentAttributes(DocumentAttributes documentAttributes) : void
//     - GlobalConfig#getLayoutConfig() : LayoutConfig
//     - GlobalConfig#setLayoutConfig(LayoutConfig layoutConfig) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/config/LayoutConfig.java   (package com.github.cukedoctor.config)
//   class LayoutConfig
//     - LayoutConfig#isHideFeaturesSection() : boolean
//     - LayoutConfig#setHideFeaturesSection(boolean hideFeaturesSection) : void
//     - LayoutConfig#isHideSummarySection() : boolean
//     - LayoutConfig#setHideSummarySection(boolean hideSummarySection) : void
//     - LayoutConfig#isHideStepTime() : boolean
//     - LayoutConfig#setHideStepTime(boolean hideStepTime) : void
//     - LayoutConfig#isHideScenarioKeyword() : boolean
//     - LayoutConfig#setHideScenarioKeyword(boolean hideScenarioKeyword) : void
//     - LayoutConfig#isHideTags() : boolean
//     - LayoutConfig#setHideTags(boolean hideTags) : void
//     - LayoutConfig#getErrorMessageLength() : Integer
//     - LayoutConfig#setErrorMessageLength(Integer errorMessageLength) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/converter/CukedoctorConverterImpl.java   (package com.github.cukedoctor.converter)
//   class CukedoctorConverterImpl implements CukedoctorConverter
//     - new CukedoctorConverterImpl(List<Feature> features, DocumentAttributes attrs)
//     - new CukedoctorConverterImpl(List<Feature> features, DocumentAttributes attrs, CukedoctorConfig cukedoctorConfig)
//     - new CukedoctorConverterImpl(List<Feature> features, DocumentAttributes attrs, CukedoctorConfig cukedoctorConfig, CukedoctorDocumentBuilder docBuilder)
//     - CukedoctorConverterImpl#getDocumentAttributes() : DocumentAttributes
//     - CukedoctorConverterImpl#getFeatures() : List<Feature>
//     - CukedoctorConverterImpl#getDocumentation() : String
//     - CukedoctorConverterImpl#renderDocumentation() : String
//     - CukedoctorConverterImpl#getDocumentationTitle() : String
//     - CukedoctorConverterImpl#renderAttributes() : CukedoctorConverter
//     - CukedoctorConverterImpl#addCustomPdfTheme() : CukedoctorConverter
//     - CukedoctorConverterImpl#addCustomCss() : CukedoctorConverter
//     - CukedoctorConverterImpl#renderSummary() : CukedoctorConverter
//     - CukedoctorConverterImpl#renderFeatures(List<Feature> features) : CukedoctorConverter
//     - CukedoctorConverterImpl#renderFeatures() : CukedoctorConverter
//     - CukedoctorConverterImpl#setFilename(String filename) : CukedoctorConverter
//     - CukedoctorConverterImpl#getFilename() : String
//     - CukedoctorConverterImpl#saveDocumentation() : CukedoctorConverter
// cukedoctor-converter/src/main/java/com/github/cukedoctor/i18n/I18nLoader.java   (package com.github.cukedoctor.i18n)
//   class I18nLoader extends ResourceBundle.Control
//     - static I18nLoader#instance(List<Feature> features) : I18nLoader
//     - static I18nLoader#newInstance(List<Feature> features) : I18nLoader
//     - I18nLoader#getMessage(String key) : String
//     - I18nLoader#getMessage(String key, Object... params) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/markup/Asciidoc.java   (package com.github.cukedoctor.markup)
//   enum Asciidoc implements Markup
//     - Asciidoc.{SIDEBAR_BLOCK}
//     - [package-private] new Asciidoc(String markup)
//     - Asciidoc#toString() : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/parser/FeatureParser.java   (package com.github.cukedoctor.parser)
//   class FeatureParser
//     - static FeatureParser#parse(String json) : List<Feature>
//     - static FeatureParser#parse(List<String> paths) : List<Feature>
//     - static FeatureParser#parse(String... paths) : List<Feature>
//     - static FeatureParser#findAndParse(String basePath) : List<Feature>
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/AbstractBaseRenderer.java   (package com.github.cukedoctor.renderer)
//   class AbstractBaseRenderer
//     - protected AbstractBaseRenderer.i18n : I18nLoader
//     - protected AbstractBaseRenderer.docBuilder : CukedoctorDocumentBuilder
//     - protected AbstractBaseRenderer.documentAttributes : DocumentAttributes
//     - protected AbstractBaseRenderer.cukedoctorConfig : CukedoctorConfig
//     - protected new AbstractBaseRenderer()
//     - AbstractBaseRenderer#setI18n(I18nLoader i18n) : void
//     - AbstractBaseRenderer#setDocumentBuilder(CukedoctorDocumentBuilder documentBuilder) : void
//     - AbstractBaseRenderer#setDocumentAttributes(DocumentAttributes documentAttributes) : void
//     - AbstractBaseRenderer#setCukedoctorConfig(CukedoctorConfig cukedoctorConfig) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/BaseRenderer.java   (package com.github.cukedoctor.renderer)
//   interface BaseRenderer
//     - BaseRenderer#setI18n(I18nLoader i18nProvider) : void
//     - BaseRenderer#setDocumentBuilder(CukedoctorDocumentBuilder documentBuilder) : void
//     - BaseRenderer#setDocumentAttributes(DocumentAttributes documentAttributes) : void
//     - BaseRenderer#setCukedoctorConfig(CukedoctorConfig cukedoctorConfig) : void
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorExamplesRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorExamplesRenderer extends AbstractBaseRenderer implements ExamplesRenderer
//     - CukedoctorExamplesRenderer#renderScenarioExamples(Scenario scenario) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorFeatureRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorFeatureRenderer extends AbstractBaseRenderer implements FeatureRenderer
//     - [package-private] CukedoctorFeatureRenderer.scenarioRenderer : ScenarioRenderer
//     - new CukedoctorFeatureRenderer()
//     - new CukedoctorFeatureRenderer(DocumentAttributes documentAttributes)
//     - new CukedoctorFeatureRenderer(CukedoctorConfig cukedoctorConfig)
//     - CukedoctorFeatureRenderer#renderFeature(Feature feature) : String
//     - protected CukedoctorFeatureRenderer#renderDescription(CukedoctorDocumentBuilder builder, String description) : void
//     - CukedoctorFeatureRenderer#renderFeatures(List<Feature> features) : String
//     - protected CukedoctorFeatureRenderer#renderFeatureScenarios(Feature feature, CukedoctorDocumentBuilder builder) : String
//     - protected CukedoctorFeatureRenderer#renderFeatureSectionId(Feature feature) : String
//     - protected CukedoctorFeatureRenderer#renderFeatureId(Feature feature) : String
//     - protected CukedoctorFeatureRenderer#renderFeatureScenario(Scenario scenario, Feature feature, CukedoctorDocumentBuilder builder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorHeaderRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorHeaderRenderer extends AbstractBaseRenderer implements HeaderRenderer
//     - CukedoctorHeaderRenderer#renderDocumentHeader(DocumentAttributes documentAttributes) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorScenarioRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorScenarioRenderer extends AbstractBaseRenderer implements ScenarioRenderer
//     - [package-private] CukedoctorScenarioRenderer.tagsRenderer : TagsRenderer
//     - [package-private] CukedoctorScenarioRenderer.examplesRenderer : ExamplesRenderer
//     - [package-private] CukedoctorScenarioRenderer.stepsRenderer : StepsRenderer
//     - new CukedoctorScenarioRenderer()
//     - new CukedoctorScenarioRenderer(CukedoctorConfig cukedoctorConfig)
//     - CukedoctorScenarioRenderer#renderScenario(Scenario scenario, Feature feature) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorStepsRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorStepsRenderer extends AbstractBaseRenderer implements StepsRenderer
//     - new CukedoctorStepsRenderer()
//     - new CukedoctorStepsRenderer(CukedoctorConfig cukedoctorConfig)
//     - CukedoctorStepsRenderer#renderSteps(List<Step> steps, Scenario scenario, Feature feature) : String
//     - [package-private] CukedoctorStepsRenderer#renderOutput(Step step) : void
//     - [package-private] CukedoctorStepsRenderer#renderStepTime(Result result) : String
//     - [package-private] CukedoctorStepsRenderer#renderStepTable(Step step) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorSummaryRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorSummaryRenderer extends AbstractBaseRenderer implements SummaryRenderer
//     - new CukedoctorSummaryRenderer()
//     - new CukedoctorSummaryRenderer(CukedoctorConfig cukedoctorConfig)
//     - CukedoctorSummaryRenderer#renderSummary(List<Feature> features) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorTagsRenderer.java   (package com.github.cukedoctor.renderer)
//   class CukedoctorTagsRenderer extends AbstractBaseRenderer implements TagsRenderer
//     - CukedoctorTagsRenderer#renderScenarioTags(Feature feature, Scenario scenario) : String
//     - protected CukedoctorTagsRenderer#isCukedoctorTag(Tag tag) : boolean
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/ExamplesRenderer.java   (package com.github.cukedoctor.spi)
//   interface ExamplesRenderer extends BaseRenderer
//     - ExamplesRenderer#renderScenarioExamples(Scenario scenario) : String
//     - ExamplesRenderer#renderScenarioExamples(Scenario scenario, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/FeatureRenderer.java   (package com.github.cukedoctor.spi)
//   interface FeatureRenderer extends BaseRenderer
//     - FeatureRenderer#renderFeature(Feature feature) : String
//     - FeatureRenderer#renderFeature(Feature feature, CukedoctorDocumentBuilder documentBuilder) : String
//     - FeatureRenderer#renderFeatures(List<Feature> features) : String
//     - FeatureRenderer#renderFeatures(List<Feature> features, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/HeaderRenderer.java   (package com.github.cukedoctor.spi)
//   interface HeaderRenderer extends BaseRenderer
//     - HeaderRenderer#renderDocumentHeader(DocumentAttributes cukedoctorAttributes) : String
//     - HeaderRenderer#renderDocumentHeader(DocumentAttributes cukedoctorAttributes, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/ScenarioRenderer.java   (package com.github.cukedoctor.spi)
//   interface ScenarioRenderer extends BaseRenderer
//     - ScenarioRenderer#renderScenario(Scenario scenario, Feature feature) : String
//     - ScenarioRenderer#renderScenario(Scenario scenario, Feature feature, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/StepsRenderer.java   (package com.github.cukedoctor.spi)
//   interface StepsRenderer extends BaseRenderer
//     - StepsRenderer#renderSteps(List<Step> steps, Scenario scenario, Feature feature) : String
//     - StepsRenderer#renderSteps(List<Step> steps, Scenario scenario, Feature feature, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/SummaryRenderer.java   (package com.github.cukedoctor.spi)
//   interface SummaryRenderer extends BaseRenderer
//     - SummaryRenderer#renderSummary(List<Feature> features) : String
//     - SummaryRenderer#renderSummary(List<Feature> features, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/TagsRenderer.java   (package com.github.cukedoctor.spi)
//   interface TagsRenderer extends BaseRenderer
//     - TagsRenderer#renderScenarioTags(Feature feature, Scenario scenario) : String
//     - TagsRenderer#renderScenarioTags(Feature feature, Scenario scenario, CukedoctorDocumentBuilder documentBuilder) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/Assert.java   (package com.github.cukedoctor.util)
//   class Assert implements Serializable
//     - static Assert#notNull(Object object) : boolean
//     - static Assert#isNull(Object object) : boolean
//     - static Assert#not(boolean assertion) : boolean
//     - static Assert#hasText(String text) : boolean
//     - static Assert#contains(String textToSearch, String substring) : boolean
//     - static Assert#notEmpty(Collection<?> collection) : boolean
//     - static Assert#hasElements(Object[] array) : boolean
//     - static Assert#hasElements(Collection<?> collection) : boolean
//     - static Assert#notEmpty(Map<?, ?> map) : boolean
//     - static Assert#notNull(Object[] array) : boolean
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/DefaultImplementationInstantiationException.java   (package com.github.cukedoctor.util)
//   class DefaultImplementationInstantiationException extends RuntimeException
//     - new DefaultImplementationInstantiationException(Class<?> clazz, Throwable t)
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/FileUtil.java   (package com.github.cukedoctor.util)
//   class FileUtil
//     - static FileUtil.ADOC_FILE_EXTENSION : Pattern
//     - static FileUtil#findJsonFile(String path) : String
//     - static FileUtil#findJsonFiles(String startDir) : List<String>
//     - static FileUtil#findFiles(String startDir, final String suffix) : List<String>
//     - static FileUtil#findFiles(String startDir, final String suffix, final boolean singleResult) : List<String>
//     - static FileUtil#findFiles(String startDir, final String suffix, final boolean singleResult, final String relativePath) : List<String>
//     - static FileUtil#saveFile(String name, String data) : File
//     - static FileUtil#loadFile(String path) : File
//     - static FileUtil#removeFile(String path) : boolean
//     - static FileUtil#removeDir(String path) : void
//     - static FileUtil#copyFileFromClassPath(String source, String dest) : File
//     - static FileUtil#copyFile(String source, String dest) : File
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/Formatter.java   (package com.github.cukedoctor.util)
//   class Formatter
//     - static Formatter#formatTime(Long time) : String
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/ObjectUtil.java   (package com.github.cukedoctor.util)
//   class ObjectUtil
//     - static ObjectUtil#getFieldValue(Object obj, String fieldName) : Object
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/ServiceLoaderUtil.java   (package com.github.cukedoctor.util)
//   class ServiceLoaderUtil<R extends BaseRenderer>
//     - new ServiceLoaderUtil()
//     - new ServiceLoaderUtil(Iterable<R> services)
//     - new ServiceLoaderUtil(Function<Class<R>, Iterator<R>> loader)
//     - ServiceLoaderUtil#load(Class<R> service, Class<? extends R> defaultImplementation, CukedoctorConfig cukedoctorConfig, Class<? extends R>... except) : R
//     - ServiceLoaderUtil#initialise(Class<R> service, Class<? extends R> defaultImplementation, I18nLoader i18n, DocumentAttributes attributes, CukedoctorConfig cukedoctorConfig, Class<? extends R>... except) : R
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/StringUtil.java   (package com.github.cukedoctor.util)
//   class StringUtil
//     - static StringUtil#trimAllLines(String text) : String
//     - [package-private] static StringUtil#countLeadingWhitespace(String text) : int
//     - [package-private] static StringUtil#trimStart(String text, int count) : String
//     - [package-private] static StringUtil#trimEnd(String text) : String
//     - static StringUtil#normaliseLineEndings(String s) : String
// cukedoctor-converter/src/test/java/com/github/cukedoctor/util/MetaCuke.java   (package com.github.cukedoctor.util)
//   class MetaCuke
//     - new MetaCuke()
//     - MetaCuke#setUp() : void
//     - MetaCuke#addFeature(String featureText) : void
//     - MetaCuke#runCucumber(Class<T> stepDefs) : void
//     - MetaCuke#runCucumber(String stepDefinitionPath) : void
//     - MetaCuke#getReport() : File
//     - MetaCuke#tearDown() : void
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorExtensionRegistry.java   (package com.github.cukedoctor.extension)
//   class CukedoctorExtensionRegistry implements ExtensionRegistry
//     - static CukedoctorExtensionRegistry.CUKEDOCTOR_EXTENSION_GROUP_NAME : String
//     - static CukedoctorExtensionRegistry.DISABLE_ALL_EXT_KEY : String
//     - static CukedoctorExtensionRegistry.FILTER_DISABLE_EXT_KEY : String
//     - static CukedoctorExtensionRegistry.THEME_DISABLE_EXT_KEY : String
//     - static CukedoctorExtensionRegistry.MINMAX_DISABLE_EXT_KEY : String
//     - static CukedoctorExtensionRegistry.STYLE_DISABLE_EXT_KEY : String
//     - static CukedoctorExtensionRegistry.FOOTER_DISABLE_EXT_KEY : String
//     - CukedoctorExtensionRegistry#register(Asciidoctor asciidoctor) : void
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorFilterExtension.java   (package com.github.cukedoctor.extension)
//   class CukedoctorFilterExtension extends Postprocessor
//     - CukedoctorFilterExtension#process(Document document, String output) : String
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorFooterExtension.java   (package com.github.cukedoctor.extension)
//   class CukedoctorFooterExtension extends Postprocessor
//     - CukedoctorFooterExtension#process(Document document, String output) : String
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorMinMaxExtension.java   (package com.github.cukedoctor.extension)
//   class CukedoctorMinMaxExtension extends BlockMacroProcessor
//     - CukedoctorMinMaxExtension#process(StructuralNode parent, String target, Map<String, Object> map) : Object
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorScriptExtension.java   (package com.github.cukedoctor.extension)
//   class CukedoctorScriptExtension extends Postprocessor
//     - CukedoctorScriptExtension#process(Document document, String output) : String
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorStyleExtension.java   (package com.github.cukedoctor.extension)
//   class CukedoctorStyleExtension extends Postprocessor
//     - static CukedoctorStyleExtension.BASE_DIR : String
//     - static CukedoctorStyleExtension.CUKEDOCTOR_CUSTOMIZATION_DIR : String
//     - CukedoctorStyleExtension#process(Document document, String output) : String
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorThemeExtension.java   (package com.github.cukedoctor.extension)
//   class CukedoctorThemeExtension extends Postprocessor
//     - CukedoctorThemeExtension#process(Document document, String output) : String
// cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/util/FileUtil.java   (package com.github.cukedoctor.extension.util)
//   class FileUtil
//     - static FileUtil.ADOC_FILE_EXTENSION : Pattern
//     - static FileUtil#saveFile(String name, String data) : File
//     - static FileUtil#loadFile(String path) : File
//     - static FileUtil#removeFile(String path) : boolean
//     - static FileUtil#copyFile(String source, String dest) : File
//     - static FileUtil#findFiles(String startDir, final String suffix) : List<String>
//     - static FileUtil#findFiles(String startDir, final String suffix, final boolean singleResult) : List<String>
//     - static FileUtil#copyFileFromClassPath(String source, String dest) : File
//     - static FileUtil#readFileContent(File target) : String
//     - static FileUtil#loadTestFile(String fileName) : File
//     - static FileUtil#removeSpecialChars(String content) : String

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/Cukedoctor.java ----
package com.github.cukedoctor;

import static com.github.cukedoctor.util.Assert.hasElements;

import com.github.cukedoctor.api.CukedoctorConverter;
import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.converter.CukedoctorConverterImpl;
import java.util.List;

/**
 * Created by pestano on 10/06/15.
 *
 * <p>Factory of Cukedoctor converter
 */
public class Cukedoctor {

  private Cukedoctor() {}

  /**
   * @param features used to generate the documentation
   * @param attrs document attributes
   * @param cukedoctorConfig Cukedoctor configuration
   * @param docBuilder helper for building AsciiDoc documents with Cukedoctor conventions
   * @return a Cukedoctor converter instance
   */
  public static CukedoctorConverter instance(
      List<Feature> features,
      DocumentAttributes attrs,
      CukedoctorConfig cukedoctorConfig,
      CukedoctorDocumentBuilder docBuilder) {

    if (!hasElements(features)) {
      throw new RuntimeException("No features found");
    }

    CukedoctorConverter instance =
        new CukedoctorConverterImpl(features, attrs, cukedoctorConfig, docBuilder);

    // by default use documentTitle as filename
    instance.setFilename(instance.getDocumentationTitle().replace(" ", "_") + ".adoc");

    return instance;
  }

  /**
   * @param features used to generate the documentation
   * @param attrs document attributes
   * @param cukedoctorConfig Cukedoctor configuration
   * @return a Cukedoctor converter instance
   */
  public static CukedoctorConverter instance(
      List<Feature> features, DocumentAttributes attrs, CukedoctorConfig cukedoctorConfig) {
    return instance(
        features, attrs, cukedoctorConfig, CukedoctorDocumentBuilder.Factory.newInstance());
  }

  /**
   * @param features used to generate the documentation
   * @param attrs document attributes
   * @return a Cukedoctor converter instance
   */
  public static CukedoctorConverter instance(List<Feature> features, DocumentAttributes attrs) {
    return instance(features, attrs, getDefaultConfig());
  }

  /**
   * @param features used to generate the documentation
   * @param docBuilder helper for building AsciiDoc documents with Cukedoctor conventions
   * @return a Cukedoctor converter instance
   */
  public static CukedoctorConverter instance(
      List<Feature> features, CukedoctorDocumentBuilder docBuilder) {
    return instance(features, getDefaultDocumentAttributes(), getDefaultConfig(), docBuilder);
  }

  /**
   * @param features used to generate the documentation
   * @return a Cukedoctor converter instance
   */
  public static CukedoctorConverter instance(List<Feature> features) {

    return instance(features, getDefaultDocumentAttributes());
  }

  public static DocumentAttributes getDefaultDocumentAttributes() {
    return null;
  }

  public static CukedoctorConfig getDefaultConfig() {
    return new CukedoctorConfig();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/CukedoctorConverter.java ----
package com.github.cukedoctor.api;

import com.github.cukedoctor.api.model.Feature;
import java.util.List;

/** Created by pestano on 02/06/15. */
public interface CukedoctorConverter {

  DocumentAttributes getDocumentAttributes();

  List<Feature> getFeatures();

  String getDocumentation();

  /** @return a string representation of the current document in Asciidoctor format */
  String renderDocumentation();

  String getDocumentationTitle();

  /**
   * @param features the features to render
   * @return underlying Converter instance
   * @deprecated Use an appropriate instance of FeatureRenderer to render the document features only
   *     e.g. CukedoctorFeatureRenderer
   */
  @Deprecated(forRemoval = true)
  CukedoctorConverter renderFeatures(List<Feature> features);

  /**
   * @return underlying Converter instance
   * @deprecated Use an appropriate instance of FeatureRenderer to render the document features only
   *     e.g. CukedoctorFeatureRenderer
   */
  @Deprecated(forRemoval = true)
  CukedoctorConverter renderFeatures();

  /**
   * @return underlying Converter instance
   * @deprecated Use an appropriate instance of HeaderRenderer to render the document attributes
   *     only e.g. CukedoctorHeaderRenderer
   */
  @Deprecated(forRemoval = true)
  CukedoctorConverter renderAttributes();

  /**
   * @deprecated Use an appropriate instance of SummaryRenderer to render the document summary only
   *     e.g. CukedoctorSummaryRenderer
   * @return underlying Converter instance
   */
  @Deprecated(forRemoval = true)
  CukedoctorConverter renderSummary();

  /**
   * set output file name without extension (should always be .adoc or other asciidoc compatible
   * extensions) If no filename is set then Documentation title (first H1 section) will be used as
   * filename (underline will be used to remove spaces) The filename is used mainly for asciidoc
   * docinfo creation.
   *
   * @param filename name to be set
   * @return underlying Converter instance
   */
  CukedoctorConverter setFilename(String filename);

  String getFilename();

  CukedoctorConverter addCustomCss();

  CukedoctorConverter addCustomPdfTheme();

  /**
   * Saves the documentation into disk using {@link CukedoctorConverter#getFilename()} as name (also
   * path). Note that
   *
   * @see CukedoctorConverter#renderDocumentation() will be called and used as content to save the
   *     file.
   * @return underlying Converter instance
   */
  CukedoctorConverter saveDocumentation();
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/CukedoctorDocumentBuilder.java ----
package com.github.cukedoctor.api;

import com.github.cukedoctor.api.builder.AttributesBuilder;
import com.github.cukedoctor.builder.CukedoctorDocumentBuilderImpl;
import io.github.robwin.markup.builder.MarkupDocBuilder;

/** Created by pestano on 17/02/16. */
public interface CukedoctorDocumentBuilder extends MarkupDocBuilder {

  AttributesBuilder attributes();

  CukedoctorDocumentBuilder sideBarBlock(String text);

  CukedoctorDocumentBuilder append(Object... text);

  CukedoctorDocumentBuilder textLine(String text);

  CukedoctorDocumentBuilder sectionTitleLevel5(String title);

  CukedoctorDocumentBuilder title(String title);

  CukedoctorDocumentBuilder nestTitle();

  CukedoctorDocumentBuilder unNestTitle();

  CukedoctorDocumentBuilder titleThenNest(String title);

  void clear();

  CukedoctorDocumentBuilder createNestedBuilder();

  CukedoctorDocumentBuilder createPeerBuilder();

  class Factory {
    private Factory() {}

    private static CukedoctorDocumentBuilder instance;

    public static synchronized CukedoctorDocumentBuilder instance() {
      if (instance == null) {
        instance = new CukedoctorDocumentBuilderImpl();
      }
      return instance;
    }

    public static synchronized CukedoctorDocumentBuilder newInstance() {
      instance = null;
      return instance();
    }
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/DocumentAttributes.java ----
package com.github.cukedoctor.api;

import static com.github.cukedoctor.util.ObjectUtil.getFieldValue;

import com.github.cukedoctor.util.Constants;
import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Created by pestano on 04/06/15. Document overall configuration */
public class DocumentAttributes {

  private static final Logger log = LoggerFactory.getLogger(DocumentAttributes.class);

  private String docTitle = "Living Documentation";
  private String backend = "html5";
  private String docType = "book";
  private String toc = "right";
  private String icons = "font";
  private String tocLevels = "3";
  private Boolean linkCss = null;
  private Boolean sectAnchors = true;
  private Boolean sectLink = true;
  private Boolean numbered = null;
  private Boolean docInfo = true;
  private String sourceHighlighter = "highlightjs";
  private String revNumber;
  private Boolean hardBreaks = true;
  private String pdfStyle;
  private String chapterLabel = "Chapter";
  private String versionLabel = "Version";
  private String stem = null;
  private Boolean allowUriRead = null;
  private Boolean dataUri = null;

  public DocumentAttributes() {}

  public DocumentAttributes docTitle(String docTitle) {
    this.docTitle = docTitle;
    return this;
  }

  public DocumentAttributes backend(String backend) {
    this.backend = backend;
    return this;
  }

  public DocumentAttributes docType(String docType) {
    this.docType = docType;
    return this;
  }

  public DocumentAttributes toc(String toc) {
    this.toc = toc;
    return this;
  }

  public DocumentAttributes tocLevels(String tocLevels) {
    this.tocLevels = tocLevels;
    return this;
  }

  public DocumentAttributes icons(String icons) {
    this.icons = icons;
    return this;
  }

  public DocumentAttributes chapterLabel(String chapterLabel) {
    this.chapterLabel = chapterLabel;
    return this;
  }

  public DocumentAttributes versionLabel(String versionLabel) {
    this.versionLabel = versionLabel;
    return this;
  }

  public DocumentAttributes sectAnchors(Boolean sectAnchors) {
    this.sectAnchors = sectAnchors;
    return this;
  }

  public DocumentAttributes sectLink(Boolean sectLink) {
    this.sectLink = sectLink;
    return this;
  }

  public DocumentAttributes numbered(Boolean numbered) {
    this.numbered = numbered;
    return this;
  }

  public DocumentAttributes linkCss(Boolean linkCss) {
    this.linkCss = linkCss;
    return this;
  }

  public DocumentAttributes docInfo(Boolean docInfo) {
    this.docInfo = docInfo;
    return this;
  }

  public DocumentAttributes sourceHighlighter(String sourceHighlighter) {
    this.sourceHighlighter = sourceHighlighter;
    return this;
  }

  public DocumentAttributes revNumber(String docVersion) {
    this.revNumber = docVersion;
    return this;
  }

  public DocumentAttributes hardBreaks(Boolean hardBreaks) {
    this.hardBreaks = hardBreaks;
    return this;
  }

  public DocumentAttributes pdfStyle(String pdfStyle) {
    this.pdfStyle = pdfStyle;
    return this;
  }

  public DocumentAttributes stem(String stem) {
    this.stem = stem;
    return this;
  }

  public DocumentAttributes allowUriRead(Boolean allowUriRead) {
    this.allowUriRead = allowUriRead;
    return this;
  }

  public DocumentAttributes dataUri(Boolean dataUri) {
    this.dataUri = dataUri;
    return this;
  }

  public String getBackend() {
    return backend;
  }

  public String getDocTitle() {
    return docTitle;
  }

  public String getDocType() {
    return docType;
  }

  public String getToc() {
    return toc;
  }

  public String getIcons() {
    return icons;
  }

  public String getTocLevels() {
    return tocLevels;
  }

  public String getChapterLabel() {
    return chapterLabel;
  }

  public String getVersionLabel() {
    return versionLabel;
  }

  public String getSourceHighlighter() {
    return sourceHighlighter;
  }

  public String getRevNumber() {
    return revNumber;
  }

  public String getPdfStyle() {
    return pdfStyle;
  }

  public Boolean isSectAnchors() {
    return sectAnchors;
  }

  public Boolean isSectLink() {
    return sectLink;
  }

  public Boolean isNumbered() {
    return numbered;
  }

  public Boolean isLinkCss() {
    return linkCss;
  }

  public Boolean isDocInfo() {
    return docInfo;
  }

  public Boolean isHardBreaks() {
    return hardBreaks;
  }

  public String getStem() {
    return stem;
  }

  public Boolean isAllowUriRead() {
    return allowUriRead;
  }

  public Boolean isDataUri() {
    return dataUri;
  }

  // setters needed by snakeyml

  public void setPdfStyle(String pdfStyle) {
    this.pdfStyle = pdfStyle;
  }

  public void setDocTitle(String docTitle) {
    this.docTitle = docTitle;
  }

  public void setBackend(String backend) {
    this.backend = backend;
  }

  public void setDocType(String docType) {
    this.docType = docType;
  }

  public void setToc(String toc) {
    this.toc = toc;
  }

  public void setIcons(String icons) {
    this.icons = icons;
  }

  public void setTocLevels(String tocLevels) {
    this.tocLevels = tocLevels;
  }

  public void setChapterLabel(String chapterLabel) {
    this.chapterLabel = chapterLabel;
  }

  public void setVersionLabel(String versionLabel) {
    this.versionLabel = versionLabel;
  }

  public void setLinkCss(Boolean linkCss) {
    this.linkCss = linkCss;
  }

  public void setSectAnchors(Boolean sectAnchors) {
    this.sectAnchors = sectAnchors;
  }

  public void setSectLink(Boolean sectLink) {
    this.sectLink = sectLink;
  }

  public void setNumbered(Boolean numbered) {
    this.numbered = numbered;
  }

  public void setDocInfo(Boolean docInfo) {
    this.docInfo = docInfo;
  }

  public void setSourceHighlighter(String sourceHighlighter) {
    this.sourceHighlighter = sourceHighlighter;
  }

  public void setRevNumber(String revNumber) {
    this.revNumber = revNumber;
  }

  public void setHardBreaks(Boolean hardBreaks) {
    this.hardBreaks = hardBreaks;
  }

  public void setStem(String stem) {
    this.stem = stem;
  }

  public void setAllowUriRead(Boolean allowUriRead) {
    this.allowUriRead = allowUriRead;
  }

  public void setDataUri(Boolean dataUri) {
    this.dataUri = dataUri;
  }

  public Map<String, Object> toMap() {
    return createAttributesMap();
  }

  private Map<String, Object> createAttributesMap() {
    Map<String, Object> attributesMap = new HashMap<>();
    // fields can be added by instrumenting java class (e.g. jacoco or logger)
    List<String> ignoredFieldNames = Arrays.asList("$jacocodata", "log");
    for (Field field : getClass().getDeclaredFields()) {
      try {
        String fieldName = field.getName();
        Object fieldValue = getFieldValue(this, fieldName);
        if (fieldValue != null && !ignoredFieldNames.contains(fieldName.toLowerCase())) {
          Constants.Attributes.Name asciidocAttrName =
              Constants.Attributes.Name.valueOf(fieldName.toUpperCase());
          attributesMap.put(asciidocAttrName.getName(), fieldValue.toString());
        }
      } catch (Exception e) {
        log.warn("Could not get field value of attribute: {}", field.getName(), e);
      }
    }
    return attributesMap;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/ScenarioResults.java ----
package com.github.cukedoctor.api;

import com.github.cukedoctor.api.model.Scenario;
import java.util.List;

/** Created by pestano on 04/06/15. */
public class ScenarioResults {
  final List<Scenario> passedScenarios;
  final List<Scenario> failedScenarios;

  public ScenarioResults(List<Scenario> passedScenarios, List<Scenario> failedScenarios) {
    this.passedScenarios = passedScenarios;
    this.failedScenarios = failedScenarios;
  }

  public Integer getNumberOfScenariosPassed() {
    return passedScenarios.size();
  }

  public Integer getNumberOfScenariosFailed() {
    return failedScenarios.size();
  }

  public List<Scenario> getPassedScenarios() {
    return passedScenarios;
  }

  public List<Scenario> getFailedScenarios() {
    return failedScenarios;
  }

  public Integer getNumberOfScenarios() {
    return getNumberOfScenariosFailed() + getNumberOfScenariosPassed();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/StepResults.java ----
package com.github.cukedoctor.api;

import com.github.cukedoctor.api.model.Status;
import com.github.cukedoctor.api.model.Step;
import com.github.cukedoctor.util.Formatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/** Created by pestano on 04/06/15. */
public class StepResults {

  private final List<Step> allSteps;
  private final Map<Status, AtomicInteger> statusCounter;
  private final long totalDuration;

  public StepResults(
      List<Step> allSteps, Map<Status, AtomicInteger> statusCounter, long totalDuration) {
    this.allSteps = allSteps;
    this.statusCounter = statusCounter;
    this.totalDuration = totalDuration;
  }

  public int getNumberOfSteps() {
    return allSteps.size();
  }

  public int getNumberOfPasses() {
    return statusCounter.get(Status.passed).intValue();
  }

  public int getNumberOfFailures() {
    return statusCounter.get(Status.failed).intValue();
  }

  public int getNumberOfUndefined() {
    return statusCounter.get(Status.undefined).intValue();
  }

  public int getNumberOfPending() {
    return statusCounter.get(Status.pending).intValue();
  }

  public int getNumberOfSkipped() {
    return statusCounter.get(Status.skipped).intValue();
  }

  public int getNumberOfMissing() {
    return statusCounter.get(Status.missing).intValue();
  }

  public long getTotalDuration() {
    return totalDuration;
  }

  public String getTotalDurationAsString() {
    return Formatter.formatTime(totalDuration);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/builder/AttributesBuilder.java ----
package com.github.cukedoctor.api.builder;

import io.github.robwin.markup.builder.asciidoc.AsciiDocBuilder;

/** Created by pestano on 17/02/16. */
public interface AttributesBuilder {

  AttributesBuilder toc(String value);

  AttributesBuilder backend(String value);

  AttributesBuilder docTitle(String value);

  AttributesBuilder docType(String value);

  AttributesBuilder icons(String value);

  AttributesBuilder numbered(Boolean value);

  AttributesBuilder linkcss(Boolean value);

  AttributesBuilder sectAnchors(Boolean value);

  AttributesBuilder sectLink(Boolean value);

  AttributesBuilder docInfo(Boolean value);

  AttributesBuilder hardBreaks(Boolean value);

  AttributesBuilder sourceHighlighter(String value);

  AttributesBuilder revNumber(String value);

  AttributesBuilder tocLevels(String value);

  AttributesBuilder pdfStyle(String value);

  AttributesBuilder chapterLabel(String value);

  AttributesBuilder versionLabel(String value);

  AttributesBuilder stem(String value);

  AttributesBuilder allowUriRead(Boolean value);

  AttributesBuilder dataUri(Boolean value);

  AsciiDocBuilder asciiDocBuilder();
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Argument.java ----
package com.github.cukedoctor.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Created by pestano on 04/06/15. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Argument {

  private String val;

  public String getVal() {
    return val;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Comment.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Assert.hasText;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Optional;

/** Created by pestano on 19/02/16. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Comment {

  private String value;
  private Integer line;

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  public Integer getLine() {
    return line;
  }

  public void setLine(Integer line) {
    this.line = line;
  }

  public Optional<String> getLanguage() {
    return extractPattern("language: ");
  }

  protected Optional<String> extractPattern(String pattern) {
    int indexOfLanguage = value.indexOf(pattern);
    if (hasText(value) && indexOfLanguage != -1) {
      return Optional.of(value.substring(indexOfLanguage + pattern.length()).trim());
    }

    return Optional.empty();
  }

  public Optional<String> getOrder() {
    return extractPattern("order: ");
  }

  @Override
  public String toString() {
    return value;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/DocString.java ----
package com.github.cukedoctor.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

/** Created by rafael-pestano on 01/07/2015. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocString {

  private String value;

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  @JsonProperty("content_type")
  private String contentType;

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String value) {
    this.contentType = value;
  }

  public boolean isDiscrete() {
    return Objects.equals(contentType, "asciidoc");
  }

  @Override
  public String toString() {
    return value;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Embedding.java ----
package com.github.cukedoctor.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Embedding {
  private String data;
  private String mimeType;
  private String name;

  public String getData() {
    return data;
  }

  public void setData(String data) {
    this.data = data;
  }

  @JsonProperty("mime_type")
  public String getMimeType() {
    return mimeType;
  }

  @JsonProperty("mime_type")
  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Example.java ----
package com.github.cukedoctor.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Created by pestano on 21/06/15. */
@JsonIgnoreProperties(value = {"description", "keyword", "line", "id", "comments"})
public class Example {

  private String name;
  private Row[] rows;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Row[] getRows() {
    return rows;
  }

  public void setRows(Row[] rows) {
    this.rows = rows;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Feature.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Assert.notEmpty;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.github.cukedoctor.api.ScenarioResults;
import com.github.cukedoctor.api.StepResults;
import com.github.cukedoctor.util.Assert;
import com.github.cukedoctor.util.Constants;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import org.slf4j.LoggerFactory;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Feature implements Comparable<Feature> {

  private static final org.slf4j.Logger log = LoggerFactory.getLogger(Feature.class);

  private String id;
  private String name;
  private String uri;
  private String description;
  private String keyword;
  private List<Scenario> elements = new ArrayList<>();
  private final List<Scenario> scenarios = new ArrayList<>();
  private List<Tag> tags = new ArrayList<>();
  private StepResults stepResults;
  private ScenarioResults scenarioResults;
  private List<Comment> comments;
  @JsonIgnore private String language;

  @JsonIgnore private Integer order;

  @JsonIgnore
  private boolean
      backgroundRendered; // backgrounds runs for each scenario so we will render it only in the
  // first one

  public Feature() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUri() {
    return this.uri;
  }

  public void setUri(String uri) {
    this.uri = uri;
  }

  public boolean hasTags() {
    return notEmpty(tags);
  }

  public boolean hasScenarios() {
    return !elements.isEmpty();
  }

  public Status getStatus() {
    return notEmpty(scenarioResults.getFailedScenarios()) ? Status.failed : Status.passed;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getKeyword() {
    return keyword;
  }

  public void setKeyword(String keyword) {
    this.keyword = keyword;
  }

  public List<Scenario> getElements() {
    return elements;
  }

  public void setElements(List<Scenario> elements) {
    this.elements = elements;
  }

  public List<Tag> getTags() {
    return tags;
  }

  public void setTags(List<Tag> tags) {
    this.tags = tags;
  }

  public StepResults getStepResults() {
    return stepResults;
  }

  public ScenarioResults getScenarioResults() {
    return scenarioResults;
  }

  public List<Comment> getComments() {
    return comments;
  }

  public void setComments(List<Comment> comments) {
    this.comments = comments;
  }

  public boolean isBackgroundRendered() {
    return backgroundRendered;
  }

  public void setBackgroundRendered(boolean backgroundRendered) {
    this.backgroundRendered = backgroundRendered;
  }

  /**
   * @return total number of scenarios
   * @deprecated use {@link Feature#getScenarioResults()}
   */
  @Deprecated(forRemoval = true)
  public Integer getNumberOfScenarios() {
    int result;
    List<Scenario> elementList = new ArrayList<>();
    for (Scenario element : scenarios) {
      if (!element.hasExamples()) {
        elementList.add(element);
      }
    }
    result = elementList.size();
    return result;
  }

  public Integer getNumberOfSteps() {
    return stepResults.getNumberOfSteps();
  }

  public Integer getNumberOfPasses() {
    return stepResults.getNumberOfPasses();
  }

  public Integer getNumberOfFailures() {
    return stepResults.getNumberOfFailures();
  }

  public Integer getNumberOfPending() {
    return stepResults.getNumberOfPending();
  }

  public Integer getNumberOfSkipped() {
    return stepResults.getNumberOfSkipped();
  }

  public Integer getNumberOfMissing() {
    return stepResults.getNumberOfMissing();
  }

  public Integer getNumberOfUndefined() {
    return stepResults.getNumberOfUndefined();
  }

  public String getDurationOfSteps() {
    return stepResults.getTotalDurationAsString();
  }

  public Integer getNumberOfScenariosPassed() {
    return scenarioResults.getNumberOfScenariosPassed();
  }

  public Integer getNumberOfScenariosFailed() {
    return scenarioResults.getNumberOfScenariosFailed();
  }

  public List<Scenario> getScenarios() {
    return scenarios; // scenario & scenario outline
  }

  public void initScenarios() {
    if (elements != null) {
      scenarios.addAll(elements);
    }
  }

  public void processSteps() {
    if (!isCucumberFeature()) {
      return;
    }
    List<Step> allSteps = new ArrayList<>();
    Map<Status, AtomicInteger> statusCounter = new EnumMap<>(Status.class);
    for (Status status : Status.values()) {
      statusCounter.put(status, new AtomicInteger(0));
    }
    List<Scenario> passedScenarios = new ArrayList<>();
    List<Scenario> failedScenarios = new ArrayList<>();
    long totalDuration = 0L;

    for (Scenario scenario : scenarios) {
      if (scenario.hasExamples()) {
        continue;
      }
      calculateScenarioStats(passedScenarios, failedScenarios, scenario);
      if (scenario.hasSteps()) {
        for (Step step : scenario.getSteps()) {
          allSteps.add(step);
          statusCounter.get(step.getStatus()).incrementAndGet();
          totalDuration += step.getDuration();
        }
      }
    }
    scenarioResults = new ScenarioResults(passedScenarios, failedScenarios);
    stepResults = new StepResults(allSteps, statusCounter, totalDuration);
  }

  private void calculateScenarioStats(
      List<Scenario> passedScenarios, List<Scenario> failedScenarios, Scenario element) {
    if (element.isBackground()) {
      return; // background scenarios are not considered as scenrario
    }
    if (element.getStatus() == Status.passed) {
      passedScenarios.add(element);
    } else if (element.getStatus() == Status.failed) {
      failedScenarios.add(element);
    }
  }

  public boolean isCucumberFeature() {
    return this.getName() != null
        && this.getKeyword() != null
        && (this.elements != null && !this.elements.isEmpty());
  }

  public String getLanguage() {

    if (language == null && comments != null) {
      this.language = stringExtractedFrom(comments, comment -> comment.getLanguage().orElse(null));
    }

    if (language == null && hasTags()) {
      this.language = stringExtractedFrom(getTags(), tag -> tag.getLanguage().orElse(null));
    }

    if (language == null) {
      this.language = "";
    }

    return language;
  }

  public int getOrder() {
    if (order == null && comments != null) {
      this.order = tryOrderExtractedFrom(comments, comment -> comment.getOrder().orElse(null));
    }

    if (order == null && hasTags()) {
      this.order = tryOrderExtractedFrom(getTags(), tag -> tag.getOrder().orElse(null));
    }

    if (order == null) {
      this.order = Integer.MAX_VALUE;
    }

    return order;
  }

  private <T> String stringExtractedFrom(List<T> elements, Function<T, String> extractor) {
    return elements.stream().map(extractor).filter(Assert::hasText).findFirst().orElse(null);
  }

  private <T> Integer tryOrderExtractedFrom(List<T> elements, Function<T, String> extractor) {
    String orderAsString = stringExtractedFrom(elements, extractor);
    try {
      return Integer.parseInt(orderAsString);
    } catch (Exception e) {
      log.debug(
          "Could not get order of feature {} from {} cause: {}",
          name,
          orderAsString,
          e.getMessage());
      return null;
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }

    Feature feature = (Feature) o;

    return Objects.equals(id, feature.id);
  }

  @Override
  public int hashCode() {
    return name != null ? name.hashCode() : 42;
  }

  public boolean hasIgnoreDocsTag() {
    if (hasTags()) {
      for (Tag tag : tags) {
        if (Constants.SKIP_DOCS.equalsIgnoreCase(tag.getName())) {
          return true;
        }
      }
    }
    return false;
  }

  @Override
  public String toString() {
    return name;
  }

  @Override
  public int compareTo(Feature other) {
    int result = Integer.compare(getOrder(), other.getOrder());

    // same order or no-order use name
    if (result == 0) {
      result = name.compareTo(other.getName());
    }

    return result;
  }

  public Scenario getScenarioByName(String name) {

    if (hasText(name) && hasScenarios()) {
      for (Scenario scenario : scenarios) {
        if (hasText(scenario.getName()) && scenario.getName().trim().equals(name)) {
          return scenario;
        }
      }
    }
    return null;
  }

  public boolean hasTag(String pattern) {
    return extractTag(pattern).isPresent();
  }

  public Optional<String> extractTag(String pattern) {
    if (!hasTags()) {
      return Optional.empty();
    }
    return getTags().stream()
        .map(tag -> tag.extractPattern(pattern))
        .filter(Optional::isPresent)
        .map(Optional::get)
        .findFirst();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Match.java ----
package com.github.cukedoctor.api.model;

import java.util.List;

public class Match {

  private String location;
  private List<Argument> arguments;

  public Match() {}

  public Match(String location) {
    this.location = location;
  }

  public List<Argument> getArguments() {
    return arguments;
  }

  public String getLocation() {
    return location;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Output.java ----
package com.github.cukedoctor.api.model;

/** Created by rafael-pestano on 08/03/2016. */
public class Output {

  private String value;

  public Output(String value) {
    this.value = value;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  @Override
  public String toString() {
    return value;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Result.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Constants.getProp;
import static com.github.cukedoctor.util.Constants.newLine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.cukedoctor.config.GlobalConfig;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Result {

  private Status status;

  @JsonProperty("error_message")
  private String errorMessage;

  private Long duration;

  public Result() {}

  public Result(Status status) {
    this.status = status;
  }

  public Status getStatus() {
    return status;
  }

  public void setStatus(Status status) {
    this.status = status;
  }

  public Long getDuration() {
    return duration == null ? 0L : duration;
  }

  public void setDuration(Long duration) {
    this.duration = duration;
  }

  public String getErrorMessage() {
    if (errorMessage != null) {
      Integer errorMessageLength = getProp("ERROR_MESSAGE_SIZE", Integer.class);
      if (errorMessageLength == null) {
        errorMessageLength = GlobalConfig.getInstance().getLayoutConfig().getErrorMessageLength();
      }
      if (errorMessage.length() > errorMessageLength) {
        errorMessage = errorMessage.substring(0, errorMessageLength) + "..." + newLine();
      }
    }
    return errorMessage;
  }

  public void setErrorMessage(String errorMessage) {
    this.errorMessage = errorMessage;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Row.java ----
package com.github.cukedoctor.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"line", "id", "comments"})
public class Row {

  private String[] cells;

  public Row() {}

  public String[] getCells() {
    return cells;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Scenario.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Assert.hasText;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.github.cukedoctor.util.Constants;
import java.util.List;

/** represents a scenario is most of the cases but can be also a background */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Scenario {

  private String name;
  private String description;
  private String keyword;
  private List<Step> steps;
  private List<Tag> tags;
  private Type type;
  private List<Example> examples;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getKeyword() {
    return keyword;
  }

  public void setKeyword(String keyword) {
    this.keyword = keyword;
  }

  public List<Step> getSteps() {
    return steps;
  }

  public void setSteps(List<Step> steps) {
    this.steps = steps;
  }

  public List<Tag> getTags() {
    return tags;
  }

  public void setTags(List<Tag> tags) {
    this.tags = tags;
  }

  public Type getType() {
    return type;
  }

  public void setType(Type type) {
    this.type = type;
  }

  public List<Example> getExamples() {
    return examples;
  }

  public void setExamples(List<Example> examples) {
    this.examples = examples;
  }

  public boolean isBackground() {
    return Type.background.equals(type);
  }

  public Status getStatus() {
    if (hasSteps()) {
      for (Step step : steps) {
        if (!step.isPassing()) { // if one or more steps are not passing, its considered a failed
          // scenario
          return Status.failed;
        }
      }
    }
    return Status.passed;
  }

  public boolean hasSteps() {
    return steps != null && !steps.isEmpty();
  }

  public boolean hasExamples() {
    return examples != null && !examples.isEmpty();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    Scenario element = (Scenario) o;

    if (!name.equals(element.name)) return false;
    return type == element.type;
  }

  @Override
  public int hashCode() {
    return type.hashCode();
  }

  public boolean hasTags() {
    return tags != null && !tags.isEmpty();
  }

  public boolean hasIgnoreDocsTag() {
    if (hasTags()) {
      for (Tag tag : tags) {
        if (Constants.SKIP_DOCS.equalsIgnoreCase(tag.getName())) {
          return true;
        }
      }
    }
    return false;
  }

  public Step getStepByName(String stepName) {
    if (hasText(stepName) && hasSteps()) {
      for (Step step : steps) {
        if (step.getName().trim().equals(stepName.trim())) {
          return step;
        }
      }
    }
    return null;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/ScenarioTotalizations.java ----
package com.github.cukedoctor.api.model;

import java.util.List;

/** Created by pestano on 19/02/16. */
public class ScenarioTotalizations {

  private int totalPassedScenarios = 0;
  private int totalFailedScenarios = 0;
  private int totalScenarios = 0;
  private int totalPassedSteps = 0;
  private int totalFailedSteps = 0;
  private int totalSkippedSteps = 0;
  private int totalPendingSteps = 0;
  private int totalMissingSteps = 0;
  private int totalUndefinedSteps = 0;
  private int totalSteps = 0;
  private long totalDuration = 0;

  public ScenarioTotalizations() {}

  public ScenarioTotalizations(List<Feature> features) {
    for (Feature feature : features) {
      addFeatureTotals(feature);
    }
  }

  public void addFeatureTotals(Feature feature) {
    totalPassedScenarios += feature.getScenarioResults().getNumberOfScenariosPassed();
    totalFailedScenarios += feature.getScenarioResults().getNumberOfScenariosFailed();
    totalScenarios += feature.getScenarioResults().getNumberOfScenarios();
    totalPassedSteps += feature.getStepResults().getNumberOfPasses();
    totalFailedSteps += feature.getStepResults().getNumberOfFailures();
    totalSkippedSteps += feature.getStepResults().getNumberOfSkipped();
    totalPendingSteps += feature.getStepResults().getNumberOfPending();
    totalMissingSteps += feature.getStepResults().getNumberOfMissing();
    totalUndefinedSteps += feature.getStepResults().getNumberOfUndefined();
    totalSteps += feature.getNumberOfSteps();
    totalDuration += feature.getStepResults().getTotalDuration();
  }

  public int getTotalPassedScenarios() {
    return totalPassedScenarios;
  }

  public int getTotalFailedScenarios() {
    return totalFailedScenarios;
  }

  public int getTotalScenarios() {
    return totalScenarios;
  }

  public int getTotalPassedSteps() {
    return totalPassedSteps;
  }

  public int getTotalFailedSteps() {
    return totalFailedSteps;
  }

  public int getTotalSkippedSteps() {
    return totalSkippedSteps;
  }

  public int getTotalPendingSteps() {
    return totalPendingSteps;
  }

  public int getTotalMissingSteps() {
    return totalMissingSteps;
  }

  public int getTotalUndefinedSteps() {
    return totalUndefinedSteps;
  }

  public int getTotalSteps() {
    return totalSteps;
  }

  public long getTotalDuration() {
    return totalDuration;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Status.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Constants.Markup.bold;
import static com.github.cukedoctor.util.Constants.Markup.style;

import com.fasterxml.jackson.annotation.JsonFormat;

/** Created by pestano on 04/06/15. */
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum Status {
  passed,
  failed,
  skipped,
  pending,
  undefined,
  missing;

  public static String getStatusColor(Status status) {
    switch (status) {
      case passed:
        {
          return style("green", bold(passed.name()));
        }
      case failed:
        {
          return style("red", bold(failed.name()));
        }
      default:
        return "";
    }
  }

  public static String getStatusIcon(Status status) {
    switch (status) {
      case passed:
        {
          return "icon:thumbs-up[role=\"green\",title=\"Passed\"]";
        }
      case failed:
        {
          return "icon:thumbs-down[role=\"red\",title=\"Failed\"]";
        }
      case skipped:
        {
          return "icon:thumbs-down[role=\"purple\",title=\"Skipped\"]";
        }
      case pending:
        {
          return "icon:thumbs-down[role=\"maroon\",title=\"Pending\"]";
        }
      case undefined:
        {
          return "icon:thumbs-down[role=\"yellow\",title=\"Undefined\"]";
        }
      case missing:
        {
          return "icon:thumbs-down[role=\"blue\",title=\"Missing\"]";
        }
      default:
        return "";
    }
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Step.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Assert.hasElements;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonRawValue;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Step {

  private static final Logger log = LoggerFactory.getLogger(Step.class);

  private String name;
  private String keyword;
  private String line;
  private Result result;
  private Row[] rows;
  private Match match;
  private List<Comment> comments;

  @JsonProperty("doc_string")
  private DocString docString;

  private List<Output> output;
  private List<Embedding> embeddings;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getKeyword() {
    return keyword;
  }

  public void setKeyword(String keyword) {
    this.keyword = keyword;
  }

  public String getLine() {
    return line;
  }

  public void setLine(String line) {
    this.line = line;
  }

  public Result getResult() {
    return result;
  }

  public void setResult(Result result) {
    this.result = result;
  }

  public Row[] getRows() {
    return rows;
  }

  public void setRows(Row[] rows) {
    this.rows = rows;
  }

  public Match getMatch() {
    return match;
  }

  public void setMatch(Match match) {
    this.match = match;
  }

  @JsonRawValue
  public List<Output> getOutput() {
    return output;
  }

  public void setOutput(List<Output> output) {
    this.output = output;
  }

  public List<Comment> getComments() {
    return comments;
  }

  public void setComments(List<Comment> comments) {
    this.comments = comments;
  }

  public DocString getDocString() {
    return docString;
  }

  public void setDocString(DocString docString) {
    this.docString = docString;
  }

  public List<Embedding> getEmbeddings() {
    return embeddings;
  }

  public void setEmbeddings(List<Embedding> embeddings) {
    this.embeddings = embeddings;
  }

  public Long getDuration() {
    if (result == null) {
      return 1L;
    } else {
      return result.getDuration();
    }
  }

  public Status getStatus() {
    if (result == null || result.getStatus() == null) {
      log.warn("Line {}: Step is missing Result: {}:{}", line, keyword, name);
      return Status.missing;
    } else {
      return result.getStatus();
    }
  }

  public boolean isFailling() {
    return getStatus().equals(Status.failed);
  }

  public boolean isMissing() {
    return getStatus().equals(Status.missing);
  }

  public boolean isPassing() {
    return getStatus().equals(Status.passed);
  }

  public boolean isPendding() {
    return getStatus().equals(Status.pending);
  }

  public boolean isUndefined() {
    return getStatus().equals(Status.undefined);
  }

  public boolean isSkipped() {
    return getStatus().equals(Status.skipped);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    Step step = (Step) o;

    if (!name.equals(step.name)) return false;
    return match.equals(step.match);
  }

  @Override
  public int hashCode() {
    return name.hashCode();
  }

  public boolean hasComments() {
    return hasElements(comments);
  }

  public boolean hasDiscreteComment() {
    if (hasComments()) {
      for (Comment comment : comments) {
        if (comment.getValue().contains("cukedoctor-discrete")) {
          return true;
        }
      }
    }
    return false;
  }

  @Override
  public String toString() {
    return name;
  }

  public boolean hasOutput() {
    return output != null && !output.isEmpty();
  }

  public boolean hasEmbeddings() {
    return embeddings != null && !embeddings.isEmpty();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Tag.java ----
package com.github.cukedoctor.api.model;

import static com.github.cukedoctor.util.Assert.hasText;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Optional;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Tag {

  private String name;

  public Tag() {}

  public Tag(String name) {
    this.name = name;
  }

  public Optional<String> extractPattern(String pattern) {
    int indexOfOrder = name.indexOf(pattern);
    if (hasText(name) && indexOfOrder != -1) {
      return Optional.of(name.substring(indexOfOrder + pattern.length()).trim());
    }

    return Optional.empty();
  }

  public String getName() {
    return name;
  }

  public boolean isOrder() {
    return getOrder().isPresent();
  }

  public Optional<String> getOrder() {
    return extractPattern("@order-");
  }

  public boolean isDiscrete() {
    return extractPattern("@asciidoc").isPresent();
  }

  public boolean isLanguage() {
    return getLanguage().isPresent();
  }

  public Optional<String> getLanguage() {
    return extractPattern("@language-");
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/api/model/Type.java ----
package com.github.cukedoctor.api.model;

import com.fasterxml.jackson.annotation.JsonFormat;

/** Created by pestano on 04/06/15. */
@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum Type {
  scenario,
  scenario_outline,
  background
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/builder/AttributesBuilderImpl.java ----
package com.github.cukedoctor.builder;

import static com.github.cukedoctor.util.Assert.hasText;

import com.github.cukedoctor.api.builder.AttributesBuilder;
import com.github.cukedoctor.util.Constants;
import io.github.robwin.markup.builder.asciidoc.AsciiDocBuilder;

/** Created by pestano on 17/02/16. */
public class AttributesBuilderImpl implements AttributesBuilder {

  private final AsciiDocBuilder docBuilder;

  public AttributesBuilderImpl(AsciiDocBuilder docBuilder) {
    this.docBuilder = docBuilder;
  }

  @Override
  public AttributesBuilder toc(String value) {
    docBuilder.textLine(Constants.Attributes.toc(value));
    return this;
  }

  @Override
  public AttributesBuilder backend(String value) {
    docBuilder.textLine(Constants.Attributes.backend(value));
    return this;
  }

  @Override
  public AttributesBuilder docTitle(String value) {
    docBuilder.textLine(Constants.Attributes.docTitle(value));
    return this;
  }

  @Override
  public AttributesBuilder docType(String value) {
    docBuilder.textLine(Constants.Attributes.docType(value));
    return this;
  }

  @Override
  public AttributesBuilder icons(String value) {
    docBuilder.textLine(Constants.Attributes.icons(value));
    return this;
  }

  @Override
  public AttributesBuilder numbered(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.numbered(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder linkcss(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.linkcss(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder sectAnchors(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.sectAnchors(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder sectLink(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.sectLink(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder docInfo(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.docInfo(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder hardBreaks(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.hardBreaks(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder sourceHighlighter(String value) {
    docBuilder.textLine(Constants.Attributes.sourceHighlighter(value));
    return this;
  }

  @Override
  public AttributesBuilder tocLevels(String value) {
    docBuilder.textLine(Constants.Attributes.tocLevels(value));
    return this;
  }

  @Override
  public AttributesBuilder chapterLabel(String value) {
    docBuilder.textLine(Constants.Attributes.chapterLabel(value));
    return this;
  }

  @Override
  public AttributesBuilder versionLabel(String value) {
    docBuilder.textLine(Constants.Attributes.versionLabel(value));
    return this;
  }

  @Override
  public AttributesBuilder pdfStyle(String value) {
    if (!hasText(value)) {
      return this;
    }
    docBuilder.textLine(Constants.Attributes.pdfStyle(value));
    return this;
  }

  @Override
  public AttributesBuilder stem(String value) {
    if (!hasText(value)) {
      return this;
    }
    docBuilder.textLine(Constants.Attributes.stem(value));
    return this;
  }

  @Override
  public AttributesBuilder allowUriRead(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.allowUriRead(value));
    }

    return this;
  }

  @Override
  public AttributesBuilder dataUri(Boolean value) {
    if (value != null) {
      docBuilder.textLine(Constants.Attributes.dataUri(value));
    }

    return this;
  }

  @Override
  public AsciiDocBuilder asciiDocBuilder() {
    return docBuilder;
  }

  @Override
  public AttributesBuilder revNumber(String value) {
    if (hasText(value)) {
      docBuilder.textLine(Constants.Attributes.revNumber(value));
    } else {
      // verify system property
      String revNumberSysProp = System.getProperty("docVersion");
      if (revNumberSysProp != null) {
        docBuilder.textLine(Constants.Attributes.revNumber(revNumberSysProp));
      }
    }
    return this;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/builder/CukedoctorDocumentBuilderImpl.java ----
package com.github.cukedoctor.builder;

import static com.github.cukedoctor.util.Assert.hasElements;
import static com.github.cukedoctor.util.Assert.hasText;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.builder.AttributesBuilder;
import com.github.cukedoctor.markup.Asciidoc;
import com.github.cukedoctor.util.Constants;
import io.github.robwin.markup.builder.asciidoc.AsciiDocBuilder;

/** Created by pestano on 17/02/16. */
public class CukedoctorDocumentBuilderImpl extends AsciiDocBuilder
    implements CukedoctorDocumentBuilder {

  private final int initialTitleNestingLevel;
  private AttributesBuilder attrsBuilder;
  private int currentTitleNestingLevel;

  public CukedoctorDocumentBuilderImpl() {
    this(0);
  }

  private CukedoctorDocumentBuilderImpl(int initialTitleNestingLevel) {
    this.initialTitleNestingLevel = initialTitleNestingLevel;
    initialiseTitleNesting();
  }

  @Override
  public AttributesBuilder attributes() {
    if (attrsBuilder == null) {
      attrsBuilder = new AttributesBuilderImpl(this);
    }
    return attrsBuilder;
  }

  @Override
  public CukedoctorDocumentBuilder sideBarBlock(String text) {
    delimitedTextLine(Asciidoc.SIDEBAR_BLOCK, text);
    return this;
  }

  @Override
  public CukedoctorDocumentBuilder append(Object... text) {
    if (hasElements(text)) {
      for (Object o : text) {
        if (o.equals(Constants.newLine()) || hasText(o.toString())) {
          documentBuilder.append(o);
        }
      }
    }
    return this;
  }

  @Override
  public CukedoctorDocumentBuilder textLine(String text) {
    if (Constants.newLine().equals(text) || hasText(text)) {
      super.textLine(text);
    }
    return this;
  }

  @Override
  public CukedoctorDocumentBuilder sectionTitleLevel5(String title) {
    // Implementation derived from AsciiDocBuilder.sectionTitleLevel4(String title)
    this.documentBuilder.append("====== ").append(title).append(this.newLine);
    return this;
  }

  @Override
  public CukedoctorDocumentBuilder title(String title) {
    switch (currentTitleNestingLevel) {
      case 0:
        documentTitle(title);
        break;
      case 1:
        sectionTitleLevel1(title);
        break;
      case 2:
        sectionTitleLevel2(title);
        break;
      case 3:
        sectionTitleLevel3(title);
        break;
      case 4:
        sectionTitleLevel4(title);
        break;
      case 5:
        sectionTitleLevel5(title);
        break;
    }

    return this;
  }

  @Override
  public CukedoctorDocumentBuilder nestTitle() {
    checkNestingOverflow();

    currentTitleNestingLevel += 1;
    return this;
  }

  public CukedoctorDocumentBuilder unNestTitle() {
    if (currentTitleNestingLevel == initialTitleNestingLevel)
      throw new NestingUnderflowException(initialTitleNestingLevel);

    currentTitleNestingLevel -= 1;
    return this;
  }

  @Override
  public CukedoctorDocumentBuilder titleThenNest(String title) {
    return title(title).nestTitle();
  }

  public void clear() {
    documentBuilder = new StringBuilder();
    initialiseTitleNesting();
  }

  @Override
  public CukedoctorDocumentBuilder createNestedBuilder() {
    checkNestingOverflow();

    return new CukedoctorDocumentBuilderImpl(currentTitleNestingLevel + 1);
  }

  @Override
  public CukedoctorDocumentBuilder createPeerBuilder() {
    return new CukedoctorDocumentBuilderImpl(currentTitleNestingLevel);
  }

  private void checkNestingOverflow() {
    if (currentTitleNestingLevel == 5) throw new NestingOverflowException();
  }

  private void initialiseTitleNesting() {
    currentTitleNestingLevel = initialTitleNestingLevel;
  }

  public static class NestingOverflowException extends RuntimeException {
    public NestingOverflowException() {
      super(
          "Nesting is currently at Section Title Level 5 (the deepest AsciiDoc allows). You cannot"
              + " nest further titles below this level.");
    }
  }

  public static class NestingUnderflowException extends RuntimeException {
    public NestingUnderflowException(int currentLevel) {
      super(
          String.format(
              "Nesting is current at Level %s, the top-most allowed for this instance. You cannot"
                  + " un-nest above this level.",
              currentLevel));
    }
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/config/CukedoctorConfig.java ----
package com.github.cukedoctor.config;

import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.DISABLE_ALL_EXT_KEY;
import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.MINMAX_DISABLE_EXT_KEY;
import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Constants.getBooleanProperty;
import static com.github.cukedoctor.util.Constants.getProp;
import static java.lang.System.getProperty;

import com.github.cukedoctor.converter.CukedoctorConverterImpl;
import com.github.cukedoctor.util.Constants;
import java.io.Serializable;
import java.util.List;

/**
 * Created by pestano on 22/06/15.
 *
 * <p>Cukedoctor configuration, each Cukedoctor Converter ({@link
 * com.github.cukedoctor.Cukedoctor#instance(List)}) instance holds a config instance.
 *
 * <p>For Documentation based attributes see {@link com.github.cukedoctor.api.DocumentAttributes}
 */
public class CukedoctorConfig implements Serializable {

  private Integer errorMessageSize; // stacktrace error messages size to show when a step fails
  private String introChapterDir; // base dir to search for intro chapter cukedoctor-intro.adoc file
  private String customizationDir; // base dir to search for cukedoctor.css and pdf theme files
  private String introChapterRelativePath;
  private Boolean hideFeaturesSection;
  private Boolean hideStepTime;
  private Boolean hideSummarySection;
  private Boolean hideScenarioKeyword;
  private Boolean hideTags;
  private boolean disableMinMaxExtension;

  public CukedoctorConfig() {
    errorMessageSize = getProp("ERROR_MESSAGE_SIZE", Integer.class);
    if (errorMessageSize == null) {
      errorMessageSize = GlobalConfig.getInstance().getLayoutConfig().getErrorMessageLength();
    }

    introChapterDir = getProperty("INTRO_CHAPTER_DIR");
    if (!hasText(introChapterDir)) {
      introChapterDir = Constants.BASE_DIR;
    }

    customizationDir = getProperty("CUKEDOCTOR_CUSTOMIZATION_DIR");
    if (!hasText(customizationDir)) {
      customizationDir = Constants.BASE_DIR;
    }

    hideSummarySection = getBooleanProperty("HIDE_SUMMARY_SECTION");
    if (hideSummarySection == null) {
      hideSummarySection = GlobalConfig.getInstance().getLayoutConfig().isHideSummarySection();
    }

    hideFeaturesSection = getBooleanProperty("HIDE_FEATURES_SECTION");
    if (hideFeaturesSection == null) {
      hideFeaturesSection = GlobalConfig.getInstance().getLayoutConfig().isHideFeaturesSection();
    }

    hideStepTime = getBooleanProperty("HIDE_STEP_TIME");
    if (hideStepTime == null) {
      hideStepTime = GlobalConfig.getInstance().getLayoutConfig().isHideStepTime();
    }

    hideScenarioKeyword = getBooleanProperty("HIDE_SCENARIO_KEYWORD");
    if (hideScenarioKeyword == null) {
      hideScenarioKeyword = GlobalConfig.getInstance().getLayoutConfig().isHideScenarioKeyword();
    }

    hideTags = getBooleanProperty("HIDE_TAGS");
    if (hideTags == null) {
      hideTags = GlobalConfig.getInstance().getLayoutConfig().isHideTags();
    }

    introChapterRelativePath = getProperty("INTRO_CHAPTER_RELATIVE_PATH");

    disableMinMaxExtension =
        (getProperty(MINMAX_DISABLE_EXT_KEY) != null || getProperty(DISABLE_ALL_EXT_KEY) != null);
  }

  public Integer getErrorMessageSize() {
    return errorMessageSize;
  }

  public String getIntroChapterDir() {
    return introChapterDir;
  }

  public String getCustomizationDir() {
    return customizationDir;
  }

  public Boolean isHideFeaturesSection() {
    return hideFeaturesSection;
  }

  public Boolean isHideStepTime() {
    return hideStepTime;
  }

  public boolean isHideSummarySection() {
    return hideSummarySection;
  }

  public Boolean isHideScenarioKeyword() {
    return hideScenarioKeyword;
  }

  public Boolean isHideTags() {
    return hideTags;
  }

  public Boolean isDisableMinMaxExtension() {
    return disableMinMaxExtension;
  }

  /**
   * Path to be used as relative when looking for introChapterAdoc see {@link
   * CukedoctorConverterImpl#renderIntro()}. used by com.github.cukedoctor.util.{@link
   * com.github.cukedoctor.util.FileUtil#findFiles(String, String, boolean, String)}
   *
   * @return the relative path to the intro chapter
   */
  public String getIntroChapterRelativePath() {
    return introChapterRelativePath;
  }

  public CukedoctorConfig setCustomizationDir(String customizationDir) {
    this.customizationDir = customizationDir;
    return this;
  }

  public CukedoctorConfig setDisableMinMaxExtension(Boolean disableMinMaxExtension) {
    this.disableMinMaxExtension = disableMinMaxExtension;
    return this;
  }

  public CukedoctorConfig setHideScenarioKeyword(Boolean hideScenarioKeyword) {
    this.hideScenarioKeyword = hideScenarioKeyword;
    return this;
  }

  public CukedoctorConfig setErrorMessageSize(Integer errorMessageSize) {
    this.errorMessageSize = errorMessageSize;
    return this;
  }

  public CukedoctorConfig setIntroChapterDir(String introChapterDir) {
    this.introChapterDir = introChapterDir;
    return this;
  }

  public CukedoctorConfig setIntroChapterRelativePath(String introChapterRelativePath) {
    this.introChapterRelativePath = introChapterRelativePath;
    return this;
  }

  public CukedoctorConfig setHideFeaturesSection(Boolean hideFeaturesSection) {
    this.hideFeaturesSection = hideFeaturesSection;
    return this;
  }

  public CukedoctorConfig setHideStepTime(Boolean hideStepTime) {
    this.hideStepTime = hideStepTime;
    return this;
  }

  public CukedoctorConfig setHideSummarySection(Boolean hideSummarySection) {
    this.hideSummarySection = hideSummarySection;
    return this;
  }

  public CukedoctorConfig setHideTags(Boolean hideTags) {
    this.hideTags = hideTags;
    return this;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/config/GlobalConfig.java ----
package com.github.cukedoctor.config;

import com.github.cukedoctor.api.DocumentAttributes;
import java.io.InputStream;
import org.yaml.snakeyaml.Yaml;

/**
 * Created by pestano on 20/10/16.
 *
 * <p>Cukedoctor default configuration loaded from a global cukedoctor.yaml file.
 *
 * <p>It holds (global) static configuration which is used in {@link CukedoctorConfig}
 */
public class GlobalConfig {

  private static GlobalConfig instance;

  private DocumentAttributes documentAttributes;

  private LayoutConfig layoutConfig;

  private GlobalConfig() {}

  public static GlobalConfig getInstance() {
    if (instance == null) {
      instance = createInstance();
    }

    return instance;
  }

  public static GlobalConfig newInstance() {

    return createInstance();
  }

  private static GlobalConfig createInstance() {
    GlobalConfig globalConfig = null;

    // try to instance user provided cukedoctor.yml
    InputStream customConfiguration =
        Thread.currentThread().getContextClassLoader().getResourceAsStream("cukedoctor.yml");
    if (customConfiguration != null) {
      globalConfig = new Yaml().loadAs(customConfiguration, GlobalConfig.class);
    }

    if (globalConfig == null) {
      // default config
      globalConfig =
          new Yaml()
              .loadAs(
                  GlobalConfig.class.getResourceAsStream("/config/cukedoctor.yml"),
                  GlobalConfig.class);
    }
    return globalConfig;
  }

  public DocumentAttributes getDocumentAttributes() {
    return documentAttributes;
  }

  public void setDocumentAttributes(DocumentAttributes documentAttributes) {
    this.documentAttributes = documentAttributes;
  }

  public LayoutConfig getLayoutConfig() {
    return layoutConfig;
  }

  public void setLayoutConfig(LayoutConfig layoutConfig) {
    this.layoutConfig = layoutConfig;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/config/LayoutConfig.java ----
package com.github.cukedoctor.config;

/**
 * Created by pestano on 23/10/16.
 *
 * <p>Documentation layout configuration
 */
public class LayoutConfig {

  private boolean hideFeaturesSection;

  private boolean hideSummarySection;

  private boolean hideStepTime;

  private boolean hideScenarioKeyword;

  private boolean hideTags;

  private Integer errorMessageLength; // stacktrace error messages size to show when a step fails

  public boolean isHideFeaturesSection() {
    return hideFeaturesSection;
  }

  public void setHideFeaturesSection(boolean hideFeaturesSection) {
    this.hideFeaturesSection = hideFeaturesSection;
  }

  public boolean isHideSummarySection() {
    return hideSummarySection;
  }

  public void setHideSummarySection(boolean hideSummarySection) {
    this.hideSummarySection = hideSummarySection;
  }

  public boolean isHideStepTime() {
    return hideStepTime;
  }

  public void setHideStepTime(boolean hideStepTime) {
    this.hideStepTime = hideStepTime;
  }

  public boolean isHideScenarioKeyword() {
    return hideScenarioKeyword;
  }

  public void setHideScenarioKeyword(boolean hideScenarioKeyword) {
    this.hideScenarioKeyword = hideScenarioKeyword;
  }

  public boolean isHideTags() {
    return hideTags;
  }

  public void setHideTags(boolean hideTags) {
    this.hideTags = hideTags;
  }

  public Integer getErrorMessageLength() {
    return errorMessageLength;
  }

  public void setErrorMessageLength(Integer errorMessageLength) {
    this.errorMessageLength = errorMessageLength;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/converter/CukedoctorConverterImpl.java ----
package com.github.cukedoctor.converter;

import static com.github.cukedoctor.util.Assert.hasElements;
import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Assert.notNull;
import static com.github.cukedoctor.util.Constants.Markup.bold;
import static com.github.cukedoctor.util.Constants.newLine;

import com.github.cukedoctor.api.CukedoctorConverter;
import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.i18n.I18nLoader;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import com.github.cukedoctor.renderer.CukedoctorHeaderRenderer;
import com.github.cukedoctor.renderer.CukedoctorSummaryRenderer;
import com.github.cukedoctor.spi.FeatureRenderer;
import com.github.cukedoctor.spi.HeaderRenderer;
import com.github.cukedoctor.spi.SummaryRenderer;
import com.github.cukedoctor.util.Constants;
import com.github.cukedoctor.util.FileUtil;
import com.github.cukedoctor.util.ServiceLoaderUtil;
import java.util.Collections;
import java.util.List;

/** Created by pestano on 02/06/15. */
public class CukedoctorConverterImpl implements CukedoctorConverter {

  private final List<Feature> features;
  private final DocumentAttributes documentAttributes;
  private String filename;
  private final CukedoctorDocumentBuilder docBuilder;
  private final I18nLoader i18n;
  private SummaryRenderer summaryRenderer;
  private FeatureRenderer featureRenderer;
  private HeaderRenderer headerRenderer;
  private final CukedoctorConfig cukedoctorConfig;

  public CukedoctorConverterImpl(List<Feature> features, DocumentAttributes attrs) {
    this(features, attrs, new CukedoctorConfig());
  }

  public CukedoctorConverterImpl(
      List<Feature> features, DocumentAttributes attrs, CukedoctorConfig cukedoctorConfig) {
    this(features, attrs, cukedoctorConfig, CukedoctorDocumentBuilder.Factory.newInstance());
  }

  public CukedoctorConverterImpl(
      List<Feature> features,
      DocumentAttributes attrs,
      CukedoctorConfig cukedoctorConfig,
      CukedoctorDocumentBuilder docBuilder) {
    this.cukedoctorConfig = cukedoctorConfig;
    this.features = features;
    Collections.sort(this.features);
    this.documentAttributes = attrs;
    this.docBuilder = docBuilder;
    i18n = I18nLoader.newInstance(features);
    loadRenderers();
  }

  private void loadRenderers() {
    headerRenderer =
        new ServiceLoaderUtil<HeaderRenderer>()
            .initialise(
                HeaderRenderer.class,
                CukedoctorHeaderRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
    summaryRenderer =
        new ServiceLoaderUtil<SummaryRenderer>()
            .initialise(
                SummaryRenderer.class,
                CukedoctorSummaryRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
    featureRenderer =
        new ServiceLoaderUtil<FeatureRenderer>()
            .initialise(
                FeatureRenderer.class,
                CukedoctorFeatureRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
  }

  public DocumentAttributes getDocumentAttributes() {
    return documentAttributes;
  }

  public List<Feature> getFeatures() {
    return features;
  }

  public String getDocumentation() {
    return docBuilder.toString();
  }

  /** @return a String representation of generated documentation */
  public synchronized String renderDocumentation() {
    System.setProperty(Constants.STOP_WATCH, String.valueOf(System.currentTimeMillis()));
    docBuilder.clear();
    addCustomPdfTheme(); // needs to be added before renderAttributes because it adds pdf-style doc
    // attr
    renderAttributes();
    docBuilder.newLine();
    docBuilder.title(bold(getDocumentationTitle()));
    renderIntro();
    if (!cukedoctorConfig.isHideSummarySection()) {
      renderSummary();
    } else {
      docBuilder.newLine();
    }
    renderFeatures(features);

    return docBuilder.toString();
  }

  private void renderIntro() {
    List<String> files =
        FileUtil.findFiles(
            cukedoctorConfig.getIntroChapterDir(),
            "cukedoctor-intro.adoc",
            true,
            cukedoctorConfig.getIntroChapterRelativePath());
    if (!files.isEmpty()) {
      String introPath = files.get(0);
      introPath = introPath.replace("\\", "/");
      docBuilder.append("include::", introPath, "[leveloffset=+1]", newLine(), newLine());
    }
  }

  public String getDocumentationTitle() {
    if (documentAttributes != null && hasText(documentAttributes.getDocTitle())) {
      return documentAttributes.getDocTitle();
    } else {
      return Constants.DOCUMENT_TITLE;
    }
  }

  public CukedoctorConverter renderAttributes() {
    docBuilder.append(
        headerRenderer.renderDocumentHeader(documentAttributes, docBuilder.createPeerBuilder()));
    return this;
  }

  public CukedoctorConverter addCustomPdfTheme() {
    if (notNull(documentAttributes)
        && documentAttributes.getBackend() != null
        && documentAttributes.getBackend().equalsIgnoreCase("pdf")) {
      // name must be filename-theme.yml
      String pdfThemeName = "cukedoctor-pdf.yml";
      // search theme.yml
      List<String> files =
          FileUtil.findFiles(cukedoctorConfig.getCustomizationDir(), pdfThemeName, true);
      if (hasElements(files)) {
        String themePath = files.get(0);
        themePath = themePath.replace("\\", "/");
        documentAttributes.pdfStyle(themePath);
      }
    }
    return this;
  }

  @Override
  public CukedoctorConverter addCustomCss() {
    return this;
  }

  public CukedoctorConverter renderSummary() {
    docBuilder.textLine(summaryRenderer.renderSummary(features, docBuilder.createNestedBuilder()));
    return this;
  }

  public CukedoctorConverter renderFeatures(List<Feature> features) {
    docBuilder.append((featureRenderer.renderFeatures(features, docBuilder.createNestedBuilder())));
    return this;
  }

  @Override
  public CukedoctorConverter renderFeatures() {
    return this.renderFeatures(features);
  }

  @Override
  public CukedoctorConverter setFilename(String filename) {
    if (filename == null) {
      filename = getDocumentationTitle();
    }
    if (!filename.contains(".")) {
      filename = filename + ".adoc";
    }
    filename = filename.replace(" ", "_"); // remove blank spaces with underline

    if (!FileUtil.ADOC_FILE_EXTENSION.matcher(filename).matches()) {
      throw new RuntimeException(
          "Invalid filename extension for file: "
              + filename
              + ". Valid formats are: ad, adoc, asciidoc and asc");
    }

    this.filename = filename;
    return this;
  }

  @Override
  public String getFilename() {
    return filename;
  }

  public CukedoctorConverter saveDocumentation() {
    FileUtil.saveFile(filename, renderDocumentation());
    return this;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/i18n/I18nLoader.java ----
package com.github.cukedoctor.i18n;

import static com.github.cukedoctor.util.Assert.hasText;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.util.Constants;
import com.github.cukedoctor.util.FileUtil;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.MessageFormat;
import java.util.List;
import java.util.Locale;
import java.util.MissingResourceException;
import java.util.PropertyResourceBundle;
import java.util.ResourceBundle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class is responsible for internationalization.
 *
 * <p>It uses features language to determine in which language the documentation will be generated.
 * Created by pestano on 19/02/16.
 */
public class I18nLoader extends ResourceBundle.Control {

  private static I18nLoader instance;
  private static final Logger log = LoggerFactory.getLogger(I18nLoader.class);

  private ResourceBundle bundle;

  private I18nLoader() {}

  public static synchronized I18nLoader instance(List<Feature> features) {
    if (instance == null) {
      instance = new I18nLoader();
      instance.init(features);
    }
    return instance;
  }

  public static synchronized I18nLoader newInstance(List<Feature> features) {
    instance = null;
    return instance(features);
  }

  public String getMessage(String key) {
    try {
      return bundle.getString(key);
    } catch (MissingResourceException e) {
      return "??" + key + "??";
    }
  }

  public String getMessage(String key, Object... params) {
    return MessageFormat.format(getMessage(key), params);
  }

  private void init(List<Feature> features) {
    String lang = resolveFeatureLanguage(features);
    if (!hasText(lang)) {
      lang = "en";
    }
    if (lang != null && bundle == null) {
      InputStream stream = findCukedoctorProperties(Constants.BASE_DIR);
      if (stream == null) {
        String bundleName = toBundleName("/i18n/cukedoctor", Locale.forLanguageTag(lang));
        String resourceName = toResourceName(bundleName, "properties");
        stream = I18nLoader.class.getResourceAsStream(resourceName);
      }
      try {
        bundle = new PropertyResourceBundle(new InputStreamReader(stream, StandardCharsets.UTF_8));
      } catch (Exception e) {
        log.warn(
            "No resource bundle found for language {}. Using 'cukedoctor_en.properties' as default"
                + " bundle.",
            lang);
        try {
          bundle =
              new PropertyResourceBundle(
                  new InputStreamReader(
                      I18nLoader.class.getResourceAsStream("/i18n/cukedoctor_en.properties"),
                      StandardCharsets.UTF_8));
        } catch (Exception e1) {
          throw new RuntimeException("Could not find cukedoctor resource bundle", e1);
        }
      }
    }
  }

  private String resolveFeatureLanguage(List<Feature> features) {
    if (features != null) {
      for (Feature feature : features) {
        if (hasText(feature.getLanguage())) {
          return feature.getLanguage();
        }
      }
    }
    return null;
  }

  /** looks for a file named cukedoctor.properties using @baseDir as starting point */
  private InputStream findCukedoctorProperties(String baseDir) {
    List<String> files = FileUtil.findFiles(baseDir, "cukedoctor.properties", true);
    if (!files.isEmpty()) {
      String path = files.get(0);
      log.trace("Loading cukedoctor resource bundle from: {}", path);
      File file = new File(path);
      try {
        return new FileInputStream(file);
      } catch (Exception e) {
        log.warn("Could not load resource bundle from target folder", e);
      }
    }
    return null;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/markup/Asciidoc.java ----
package com.github.cukedoctor.markup;

import io.github.robwin.markup.builder.Markup;

/** Created by pestano on 17/02/16. */
public enum Asciidoc implements Markup {
  SIDEBAR_BLOCK("****");

  private final String markup;

  Asciidoc(String markup) {
    this.markup = markup;
  }

  @Override
  public String toString() {
    return markup;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/parser/FeatureParser.java ----
package com.github.cukedoctor.parser;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.util.FileUtil;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Created by pestano on 04/06/15. */
public class FeatureParser {
  private static final Logger log = LoggerFactory.getLogger(FeatureParser.class);

  private FeatureParser() {}

  /**
   * @param json absolute path to cucumber json output file
   * @return list of cucumber features found in json output files
   */
  public static List<Feature> parse(String json) {
    List<Feature> features = null;
    try (InputStreamReader is =
        new InputStreamReader(new FileInputStream(json), StandardCharsets.UTF_8)) {
      features = new ObjectMapper().readValue(is, new TypeReference<>() {});
      Iterator<Feature> it = features.iterator();
      while (it.hasNext()) {
        Feature feature = it.next();
        if (!feature.isCucumberFeature()) {
          log.warn("json: {} is NOT a Cucumber feature result file and will be ignored", json);
          it.remove();
        } else {
          feature.initScenarios();
          feature.processSteps();
        }
      }

    } catch (FileNotFoundException e) {
      log.warn("Could not find json file: {}", json);
    } catch (JsonMappingException e) {
      log.warn("Could not map json file: {}", json);
    } catch (JsonParseException e) {
      log.warn("Could not parse json file: {}", json);
    } catch (IOException e) {
      log.warn("Could not read json file: {}", json);
    }

    return features;
  }

  /**
   * @param paths absolute paths to cucumber json output files
   * @return list of cucumber features found in json output files
   */
  public static List<Feature> parse(List<String> paths) {
    List<Feature> features = new ArrayList<>();

    for (String path : paths) {
      List<Feature> result = parse(path);
      if (result != null) {
        features.addAll(result);
      }
    }
    return features;
  }

  /**
   * @param paths absolute paths to cucumber json output files
   * @return list of cucumber features found in json output files
   */
  public static List<Feature> parse(String... paths) {
    List<Feature> features = new ArrayList<>();

    for (String path : paths) {
      List<Feature> result = parse(path);
      if (result != null) {
        features.addAll(result);
      }
    }

    return features;
  }

  /**
   * @param basePath relative or absolute path to a directory containing cucumber json output files
   * @return list of cucumber features found in json output files
   */
  public static List<Feature> findAndParse(String basePath) {
    List<String> paths = FileUtil.findJsonFiles(basePath);
    return parse(paths);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/AbstractBaseRenderer.java ----
package com.github.cukedoctor.renderer;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.config.GlobalConfig;
import com.github.cukedoctor.i18n.I18nLoader;

/** Created by pestano on 26/02/16. */
public abstract class AbstractBaseRenderer {

  protected I18nLoader i18n;
  protected CukedoctorDocumentBuilder docBuilder;
  protected DocumentAttributes documentAttributes;
  protected CukedoctorConfig cukedoctorConfig;

  protected AbstractBaseRenderer() {
    i18n = I18nLoader.instance(null);
    docBuilder = CukedoctorDocumentBuilder.Factory.newInstance();
    documentAttributes = GlobalConfig.getInstance().getDocumentAttributes();
    cukedoctorConfig = new CukedoctorConfig();
  }

  public void setI18n(I18nLoader i18n) {
    this.i18n = i18n;
  }

  /**
   * @param documentBuilder document builder
   * @deprecated Use renderX calls that pass the documentBuilder as a parameter instead
   */
  @Deprecated(forRemoval = true)
  public void setDocumentBuilder(CukedoctorDocumentBuilder documentBuilder) {
    this.docBuilder = documentBuilder;
  }

  public void setDocumentAttributes(DocumentAttributes documentAttributes) {
    this.documentAttributes = documentAttributes;
  }

  public void setCukedoctorConfig(CukedoctorConfig cukedoctorConfig) {
    this.cukedoctorConfig = cukedoctorConfig;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/BaseRenderer.java ----
package com.github.cukedoctor.renderer;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.i18n.I18nLoader;

/** Created by pestano on 27/02/16. */
public interface BaseRenderer {

  void setI18n(I18nLoader i18nProvider);

  /**
   * @param documentBuilder the instance to use
   * @deprecated Use renderX calls that pass the documentBuilder as a parameter instead
   */
  @Deprecated(forRemoval = true)
  void setDocumentBuilder(CukedoctorDocumentBuilder documentBuilder);

  void setDocumentAttributes(DocumentAttributes documentAttributes);

  void setCukedoctorConfig(CukedoctorConfig cukedoctorConfig);
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorExamplesRenderer.java ----
package com.github.cukedoctor.renderer;

import static com.github.cukedoctor.util.Constants.Markup.table;
import static com.github.cukedoctor.util.Constants.Markup.tableCol;
import static com.github.cukedoctor.util.Constants.newLine;

import com.github.cukedoctor.api.model.Example;
import com.github.cukedoctor.api.model.Row;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.spi.ExamplesRenderer;

/** Created by pestano on 28/02/16. */
public class CukedoctorExamplesRenderer extends AbstractBaseRenderer implements ExamplesRenderer {

  @Override
  public String renderScenarioExamples(Scenario scenario) {
    docBuilder.clear();
    if (scenario.hasExamples()) {
      docBuilder.newLine();
      for (Example example : scenario.getExamples()) {
        docBuilder.append(
            "."
                + (example.getName() == null || "".equals(example.getName())
                    ? "Example"
                    : example.getName()),
            newLine());
        docBuilder.append(
            "[cols=\"" + example.getRows()[0].getCells().length + "*\", options=\"header\"]",
            newLine());
        docBuilder.append(table(), newLine());
        Row header = example.getRows()[0];
        for (String col : header.getCells()) {
          docBuilder.append(tableCol(), col, newLine());
        }

        for (int i = 1; i < example.getRows().length; i++) {
          for (String cell : example.getRows()[i].getCells()) {
            docBuilder.append(tableCol(), cell, newLine());
          }
        }
        docBuilder.append(table(), newLine(), newLine());
      }
    }
    return docBuilder.toString();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorFeatureRenderer.java ----
package com.github.cukedoctor.renderer;

import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Assert.isNull;
import static com.github.cukedoctor.util.Assert.not;
import static com.github.cukedoctor.util.Assert.notNull;
import static com.github.cukedoctor.util.Constants.Markup.bold;
import static com.github.cukedoctor.util.Constants.newLine;
import static com.github.cukedoctor.util.StringUtil.trimAllLines;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.spi.FeatureRenderer;
import com.github.cukedoctor.spi.ScenarioRenderer;
import com.github.cukedoctor.util.ServiceLoaderUtil;
import java.util.List;

/** Created by pestano on 27/02/16. */
public class CukedoctorFeatureRenderer extends AbstractBaseRenderer implements FeatureRenderer {

  ScenarioRenderer scenarioRenderer;

  public CukedoctorFeatureRenderer() {}

  public CukedoctorFeatureRenderer(DocumentAttributes documentAttributes) {
    setDocumentAttributes(documentAttributes);
  }

  public CukedoctorFeatureRenderer(CukedoctorConfig cukedoctorConfig) {
    this.cukedoctorConfig = cukedoctorConfig;
  }

  @Override
  public String renderFeature(Feature feature) {
    loadDependentRenderers();
    CukedoctorDocumentBuilder builder = docBuilder.createPeerBuilder();
    if (feature.hasIgnoreDocsTag()) {
      return "";
    }
    builder.textLine(renderFeatureSectionId(feature));
    builder.title(bold(feature.getName())).newLine();

    if (notNull(documentAttributes) && hasText(documentAttributes.getBackend())) {
      String backend = documentAttributes.getBackend();
      if ((backend.toLowerCase().contains("html") || backend.toLowerCase().contains("all"))
          && !cukedoctorConfig.isDisableMinMaxExtension()) {
        // used by minimax extension @see com.github.cukedoctor.extension.CukedoctorMinMaxExtension
        builder.append("ifndef::backend-pdf[]").append(newLine());
        builder.append("minmax::", renderFeatureId(feature)).append("[]").newLine();
        builder.append("endif::[]").append(newLine());
      }
    }
    if (hasText(feature.getDescription())) {
      final String description = trimAllLines(feature.getDescription()).replace("\\", "");
      renderDescription(builder, description);
    }

    if (feature.hasScenarios()) {
      builder.append(renderFeatureScenarios(feature, builder));
    }

    return builder.toString();
  }

  protected void renderDescription(CukedoctorDocumentBuilder builder, String description) {
    builder.sideBarBlock(description);
  }

  @Override
  public String renderFeatures(List<Feature> features) {
    loadDependentRenderers();
    docBuilder.clear();
    if (!cukedoctorConfig.isHideFeaturesSection()) {
      docBuilder.titleThenNest(bold(i18n.getMessage("title.features"))).newLine();
    }
    for (Feature feature : features) {
      docBuilder.append(renderFeature(feature));
    }
    return docBuilder.toString();
  }

  protected String renderFeatureScenarios(Feature feature, CukedoctorDocumentBuilder builder) {
    StringBuilder sb = new StringBuilder();
    for (Scenario scenario : feature.getScenarios()) {
      sb.append(renderFeatureScenario(scenario, feature, builder));
    }
    feature.setBackgroundRendered(false);
    return sb.toString();
  }

  protected String renderFeatureSectionId(Feature feature) {
    if (isNull(feature) || not(hasText(feature.getName()))) {
      return "";
    }
    return "[[" + renderFeatureId(feature) + ", " + feature.getName() + "]]";
  }

  protected String renderFeatureId(Feature feature) {
    // Anchor must not have blanks neither commas to work
    return feature.getName().replace(",", "").replace("'", "-").replace(" ", "-");
  }

  protected String renderFeatureScenario(
      Scenario scenario, Feature feature, CukedoctorDocumentBuilder builder) {
    if (scenarioRenderer == null) {
      loadDependentRenderers();
    }
    return scenarioRenderer.renderScenario(scenario, feature, builder.createNestedBuilder());
  }

  private void loadDependentRenderers() {
    scenarioRenderer =
        new ServiceLoaderUtil<ScenarioRenderer>()
            .initialise(
                ScenarioRenderer.class,
                CukedoctorScenarioRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorHeaderRenderer.java ----
package com.github.cukedoctor.renderer;

import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.spi.HeaderRenderer;

/**
 * Created by rmpestano on 27/04/20.
 *
 * @since 2.2
 */
public class CukedoctorHeaderRenderer extends AbstractBaseRenderer implements HeaderRenderer {

  @Override
  public String renderDocumentHeader(DocumentAttributes documentAttributes) {
    docBuilder.clear();

    if (documentAttributes == null) {
      return "";
    }

    return docBuilder
        .attributes()
        .toc(documentAttributes.getToc())
        .backend(documentAttributes.getBackend())
        .docTitle(documentAttributes.getDocTitle())
        .docType(documentAttributes.getDocType())
        .icons(documentAttributes.getIcons())
        .numbered(documentAttributes.isNumbered())
        .linkcss(documentAttributes.isLinkCss())
        .sectAnchors(documentAttributes.isSectAnchors())
        .sectLink(documentAttributes.isSectLink())
        .docInfo(documentAttributes.isDocInfo())
        .sourceHighlighter(documentAttributes.getSourceHighlighter())
        .tocLevels(documentAttributes.getTocLevels())
        .revNumber(documentAttributes.getRevNumber())
        .hardBreaks(documentAttributes.isHardBreaks())
        .chapterLabel(documentAttributes.getChapterLabel())
        .versionLabel(documentAttributes.getVersionLabel())
        .stem(documentAttributes.getStem())
        .allowUriRead(documentAttributes.isAllowUriRead())
        .pdfStyle(documentAttributes.getPdfStyle())
        .dataUri(documentAttributes.isDataUri())
        .asciiDocBuilder()
        .toString();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorScenarioRenderer.java ----
package com.github.cukedoctor.renderer;

import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Assert.notNull;
import static com.github.cukedoctor.util.StringUtil.trimAllLines;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.api.model.Status;
import com.github.cukedoctor.api.model.Step;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.spi.ExamplesRenderer;
import com.github.cukedoctor.spi.ScenarioRenderer;
import com.github.cukedoctor.spi.StepsRenderer;
import com.github.cukedoctor.spi.TagsRenderer;
import com.github.cukedoctor.util.ServiceLoaderUtil;
import java.util.List;

/** Created by pestano on 27/02/16. */
public class CukedoctorScenarioRenderer extends AbstractBaseRenderer implements ScenarioRenderer {

  TagsRenderer tagsRenderer;

  ExamplesRenderer examplesRenderer;

  StepsRenderer stepsRenderer;

  public CukedoctorScenarioRenderer() {}

  public CukedoctorScenarioRenderer(CukedoctorConfig cukedoctorConfig) {
    this.cukedoctorConfig = cukedoctorConfig;
  }

  private void loadDependentRenderers() {
    tagsRenderer =
        new ServiceLoaderUtil<TagsRenderer>()
            .initialise(
                TagsRenderer.class,
                CukedoctorTagsRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
    examplesRenderer =
        new ServiceLoaderUtil<ExamplesRenderer>()
            .initialise(
                ExamplesRenderer.class,
                CukedoctorExamplesRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
    stepsRenderer =
        new ServiceLoaderUtil<StepsRenderer>()
            .initialise(
                StepsRenderer.class,
                CukedoctorStepsRenderer.class,
                i18n,
                documentAttributes,
                cukedoctorConfig);
  }

  @Override
  public String renderScenario(Scenario scenario, Feature feature) {
    loadDependentRenderers();
    docBuilder.clear();
    if (scenario.hasIgnoreDocsTag()) {
      return "";
    }

    if (scenario.isBackground() && feature.isBackgroundRendered()) {
      return "";
    }

    if (!feature.isBackgroundRendered() && scenario.isBackground()) {
      feature.setBackgroundRendered(true);
      StringBuilder backgroundTitle = new StringBuilder(scenario.getKeyword());
      if (!Status.passed.equals(scenario.getStatus())) {
        backgroundTitle.append(" ").append(Status.getStatusIcon(Status.failed));
      }
      docBuilder.title(backgroundTitle.toString().replace("\\", ""));
    }

    if (hasText(scenario.getName())) {
      StringBuilder scenarioTitle = new StringBuilder();
      if (cukedoctorConfig.isHideScenarioKeyword()) {
        scenarioTitle.append(scenario.getName());
      } else {
        scenarioTitle.append(scenario.getKeyword()).append(": ").append(scenario.getName());
      }

      if (notNull(scenario.getStatus()) && !Status.passed.equals(scenario.getStatus())) {
        scenarioTitle.append(" ").append(Status.getStatusIcon(Status.failed));
      }

      docBuilder.title(scenarioTitle.toString());
    }

    if (!cukedoctorConfig.isHideTags()) {
      docBuilder.append(renderScenarioTags(scenario, feature));
    }

    if (hasText(scenario.getDescription())) {
      docBuilder.textLine(trimAllLines(scenario.getDescription()).replace("\\", "")).newLine();
    } else {
      docBuilder.textLine("").newLine();
    }

    if (scenario.hasExamples()) {
      docBuilder.append(renderScenarioExamples(scenario));
      return docBuilder.toString(); // or a scenario has examples or it has steps
    }

    if (scenario.hasSteps()) {
      docBuilder.append(renderScenarioSteps(scenario.getSteps(), scenario, feature));
    }
    return docBuilder.toString();
  }

  private String renderScenarioSteps(List<Step> scenarioSteps, Scenario scenario, Feature feature) {
    return stepsRenderer.renderSteps(
        scenarioSteps, scenario, feature, docBuilder.createNestedBuilder());
  }

  private String renderScenarioExamples(Scenario scenario) {
    return examplesRenderer.renderScenarioExamples(scenario, docBuilder.createNestedBuilder());
  }

  private String renderScenarioTags(Scenario scenario, Feature feature) {
    return tagsRenderer.renderScenarioTags(feature, scenario, docBuilder.createPeerBuilder());
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorStepsRenderer.java ----
package com.github.cukedoctor.renderer;

import static com.github.cukedoctor.api.CukedoctorDocumentBuilder.Factory.newInstance;
import static com.github.cukedoctor.util.Assert.hasElements;
import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Assert.notNull;
import static com.github.cukedoctor.util.Constants.Markup.exampleBlock;
import static com.github.cukedoctor.util.Constants.Markup.listing;
import static com.github.cukedoctor.util.Constants.Markup.table;
import static com.github.cukedoctor.util.Constants.Markup.tableCol;
import static com.github.cukedoctor.util.Constants.newLine;
import static java.lang.Boolean.*;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Comment;
import com.github.cukedoctor.api.model.DocString;
import com.github.cukedoctor.api.model.Embedding;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Output;
import com.github.cukedoctor.api.model.Result;
import com.github.cukedoctor.api.model.Row;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.api.model.Status;
import com.github.cukedoctor.api.model.Step;
import com.github.cukedoctor.api.model.Tag;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.spi.StepsRenderer;
import com.github.cukedoctor.util.Constants;
import com.github.cukedoctor.util.Formatter;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/** Created by pestano on 28/02/16. */
public class CukedoctorStepsRenderer extends AbstractBaseRenderer implements StepsRenderer {

  public CukedoctorStepsRenderer() {}

  public CukedoctorStepsRenderer(CukedoctorConfig cukedoctorConfig) {
    this.cukedoctorConfig = cukedoctorConfig;
  }

  @Override
  public String renderSteps(List<Step> steps, Scenario scenario, Feature feature) {
    docBuilder.clear();

    docBuilder.textLine("==========");
    for (Step step : steps) {
      docBuilder.append(parseKeyword(step.getKeyword()), "::", newLine());
      docBuilder.append(step.getName() + " ", Status.getStatusIcon(step.getStatus()));
      if (FALSE.equals(cukedoctorConfig.isHideStepTime())) {
        docBuilder.append(renderStepTime(step.getResult()));
      }

      docBuilder.append(renderStepTable(step));

      if (notNull(step.getDocString()) && hasText(step.getDocString().getValue())) {
        if (step.getDocString().isDiscrete()
            || step.hasDiscreteComment()
            || isDiscrete(scenario)
            || isDiscrete(feature)) {
          // discrete step renders inside a sidebar block and has [discrete] class on every line
          renderDiscreteSidebarBlock(step.getDocString());

        } else {
          renderListingBlock(step.getDocString());
        }
      }

      if (step.getResult() != null
          && !Status.passed.equals(step.getStatus())
          && step.getResult().getErrorMessage() != null) {
        docBuilder.append(newLine(), "IMPORTANT: ", step.getResult().getErrorMessage(), newLine());
      }
      renderOutput(step);
      renderAttachments(step);
      enrichStep(step);
    }
    docBuilder.textLine("==========").newLine();

    return docBuilder.toString();
  }

  private String parseKeyword(String keyword) {
    return keyword.replace("*", "And");
  }

  private boolean isDiscrete(Scenario scenario) {
    if (!scenario.hasTags()) {
      return false;
    }
    return isDiscrete(scenario.getTags());
  }

  private boolean isDiscrete(Feature feature) {
    if (!feature.hasTags()) {
      return false;
    }
    return isDiscrete(feature.getTags());
  }

  private boolean isDiscrete(Iterable<Tag> tags) {
    for (Tag tag : tags) {
      if (tag.isDiscrete()) {
        return true;
      }
    }

    return false;
  }

  void renderOutput(Step step) {
    if (step.hasOutput()) {
      docBuilder.textLine(listing());
      for (Output output : step.getOutput()) {
        docBuilder.textLine(output.getValue());
      }
      docBuilder.textLine(listing());
    }
  }

  private void renderAttachments(Step step) {
    if (!step.hasEmbeddings()) {
      return;
    }

    // HACK to pass an int by ref
    AtomicInteger notNamedCount = new AtomicInteger(1);
    for (Embedding attachment : step.getEmbeddings()) {
      if (!shouldRenderAttachment(attachment)) {
        continue;
      }
      renderAttachmentTitle(attachment, notNamedCount);
      renderAttachmentContent(attachment);
    }
  }

  private boolean shouldRenderAttachment(Embedding attachment) {
    return hasText(attachment.getMimeType()) && attachment.getMimeType().startsWith("text/");
  }

  private void renderAttachmentContent(Embedding attachment) {
    docBuilder.textLine("[%collapsible]");
    docBuilder.textLine(exampleBlock());

    if (hasText(attachment.getData())) {
      docBuilder.textLine(getAttachmentContent(attachment));
    }

    docBuilder.textLine(exampleBlock());
  }

  private String getAttachmentContent(Embedding attachment) {
    // HACK When using the JSON formatter, there is no way to tell if the attachment has been
    // base64-encoded
    // or not. In this implementation, we assume that anything that could be base64-encoded actually
    // is.
    //
    // The new message formatter
    // (https://github.com/cucumber/cucumber/blob/master/messages/messages.proto)
    // provides an explicit content_encoding field to make this unambiguous. Until we adopt it, the
    // hack
    // remains.

    // Additionally, we assume UTF-8 encoding. An enterprising contributor may wish to parse the
    // mime type
    // to check if a charset parameter has been specified.
    try {
      return new String(Base64.getDecoder().decode(attachment.getData()), StandardCharsets.UTF_8);
    } catch (IllegalArgumentException e) {
      return attachment.getData();
    }
  }

  private void renderAttachmentTitle(Embedding attachment, AtomicInteger notNamedCount) {
    docBuilder.newLine();
    docBuilder.append(".");
    docBuilder.textLine(getAttachmentTitle(attachment, notNamedCount));
  }

  private String getAttachmentTitle(Embedding attachment, AtomicInteger notNamedCount) {
    if (hasText(attachment.getName())) {
      return attachment.getName();
    }

    return "Attachment " + notNamedCount.getAndIncrement();
  }

  private void renderListingBlock(DocString docString) {
    if (docString.getContentType() != null && !docString.getContentType().equals("")) {
      docBuilder.append("[source,", docString.getContentType(), "]", newLine());
    }
    docBuilder.append(listing(), newLine(), newLine());
    docBuilder.append(docString.getValue().replace("\n", newLine()));
    docBuilder.append(newLine(), newLine(), listing(), newLine());
  }

  private void renderDiscreteSidebarBlock(DocString docString) {
    docBuilder.append("******", newLine(), newLine());

    String[] lines =
        docString
            .getValue()
            .replace("****", "*****")
            .replace(exampleBlock(), exampleBlock() + "=")
            .split("\\n");

    // every line that starts with \n and not contains pipe(|) will have discrete class
    // pipe is skipped because it denotes table cells in asciidoc and putting
    // a discrete class will break tables
    // also includes are skipped
    // regex try:("^(?=.*^\\n)(?!\\n\\|).*$")
    boolean isListing = false; // control if line is inside a listing
    boolean isTable = false; // control if line is inside a table

    for (String line : lines) {

      if (!isListing) {
        line = line.replace("\r", "");
      }
      if (isListing) {
        if (line.contains("----")) {
          // end listing
          isListing = false;
        }
        docBuilder.textLine(line);
        continue;
      }

      if (line.contains("----")) {
        isListing = true;
        docBuilder.textLine(line);
        continue;
      }

      // do not add discrete to callouts
      if (line.startsWith("<") && line.endsWith(">")) {
        docBuilder.textLine(line);
        continue;
      }
      // do not add discrete to complex blocks otherwise it will produce invalid markup like below:
      // [discrete] [IMPORTANT] [discrete] ======
      if (line.startsWith("======")) {
        docBuilder.textLine(line);
        continue;
      }

      if (isTable) {
        // skip discrete class when within a table
        docBuilder.textLine(line);
        if (line.contains(table())) {
          isTable = false; // end table
        }
        continue;
      }

      // skips discrete class for table col (it must add discrete to table itself)
      if (line.contains(table())) {
        isTable = true;
      }
      // not inside a table neither listing then add discrete class to line
      docBuilder.textLine(Constants.DISCRETE).textLine(line);
    }
    docBuilder.append(newLine(), newLine(), "******", newLine());
  }

  private void enrichStep(Step step) {
    if (step != null && step.hasComments()) {
      int numComments = step.getComments().size();
      for (Comment comment : step.getComments()) {
        if (hasText(comment.getValue())
            && (comment.getValue().contains("{") && comment.getValue().contains("}"))) {
          String line = comment.getValue();
          // do not add new line for listing, complex blocks, callouts
          if (comment.getValue().contains("[source")
              || line.contains("====")
              || line.contains(Constants.Markup.listing())
              || (line.startsWith("<") && line.endsWith(">"))) {
            docBuilder.textLine(
                line.replace("\n", newLine())
                    .replace("#{", "")
                    .replace("# {", "")
                    .replace("}", ""));
          } else {
            docBuilder.textLine(
                line.replace("\n", newLine())
                    .replace("#{", newLine())
                    .replace("# {", newLine())
                    .replace("}", ""));
          }
        }
        // add new line to last comment
        if (step.getComments().indexOf(comment) == numComments - 1) {
          docBuilder.newLine();
        }
      }
    }
  }

  String renderStepTime(Result result) {
    if (result == null || result.getDuration() == null) {
      return "";
    }
    return " [small right]#(" + Formatter.formatTime(result.getDuration()) + ")#";
  }

  String renderStepTable(Step step) {
    // TODO convert to AsciidocBuilder
    CukedoctorDocumentBuilder builder = newInstance();
    builder.newLine();
    if (hasElements(step.getRows())) {
      builder.newLine();
      builder
          .append("[cols=\"" + step.getRows()[0].getCells().length + "*\", options=\"header\"]")
          .newLine();
      builder.textLine(table());
      Row header = step.getRows()[0];
      for (String col : header.getCells()) {
        builder.append(tableCol(), col).newLine();
      }

      for (int i = 1; i < step.getRows().length; i++) {
        for (String cell : step.getRows()[i].getCells()) {
          builder.append(tableCol(), cell).newLine();
        }
      }
      builder.textLine(table());
      builder.newLine();
    }

    return builder.toString();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorSummaryRenderer.java ----
package com.github.cukedoctor.renderer;

import static com.github.cukedoctor.util.Constants.Markup.bold;
import static com.github.cukedoctor.util.Constants.Markup.h2;
import static com.github.cukedoctor.util.Constants.Markup.table;
import static com.github.cukedoctor.util.Constants.Markup.tableCol;
import static com.github.cukedoctor.util.Constants.newLine;

import com.github.cukedoctor.api.ScenarioResults;
import com.github.cukedoctor.api.StepResults;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.ScenarioTotalizations;
import com.github.cukedoctor.api.model.Status;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.spi.SummaryRenderer;
import com.github.cukedoctor.util.Formatter;
import java.util.List;

/** Created by pestano on 26/02/16. */
public class CukedoctorSummaryRenderer extends AbstractBaseRenderer implements SummaryRenderer {

  private ScenarioTotalizations scenarioTotalizationsCache;

  public CukedoctorSummaryRenderer() {}

  public CukedoctorSummaryRenderer(CukedoctorConfig cukedoctorConfig) {
    this.cukedoctorConfig = cukedoctorConfig;
  }

  @Override
  public String renderSummary(List<Feature> features) {
    docBuilder.clear();

    calculateTotalizations(features);
    docBuilder.textLine(h2(bold(i18n.getMessage("title.summary"))));

    // TODO convert to AsciidocMarkupBuilder
    docBuilder
        .append(
            "[cols=\"12*^m\", options=\"header,footer\"]",
            newLine(),
            "|===",
            newLine()
                + "3+|"
                + i18n.getMessage("title.scenario")
                + "s 7+|"
                + i18n.getMessage("summary.steps")
                + " 2+|",
            i18n.getMessage("title.features"),
            ": ",
            features.size() + "",
            newLine(),
            newLine() + "|[green]#*",
            i18n.getMessage("result.passed"),
            "*#",
            newLine(),
            "|[red]#*",
            i18n.getMessage("result.failed"),
            "*#",
            newLine(),
            "|Total",
            newLine(),
            "|[green]#*",
            i18n.getMessage("result.passed"),
            "*#",
            newLine(),
            "|[red]#*",
            i18n.getMessage("result.failed"),
            "*#",
            newLine(),
            "|[purple]#*",
            i18n.getMessage("result.skipped"),
            "*#",
            newLine(),
            "|[maroon]#*",
            i18n.getMessage("result.pending"),
            "*#",
            newLine(),
            "|[yellow]#*",
            i18n.getMessage("result.undefined"),
            "*#",
            newLine(),
            "|[blue]#*",
            i18n.getMessage("result.missing"),
            "*#",
            newLine(),
            "|Total",
            newLine(),
            "|" + i18n.getMessage("summary.duration"),
            newLine(),
            "|Status")
        .newLine();

    for (Feature feature : features) {
      // TODO convert to AsciidocMarkupBuilder
      docBuilder.append(
          newLine(),
          "12+^",
          tableCol(),
          "*<<",
          feature.getName().replace(",", "").replace(" ", "-"),
          ">>*",
          newLine());
      StepResults stepResults = feature.getStepResults();
      ScenarioResults scenarioResults = feature.getScenarioResults();

      docBuilder.append(tableCol(), scenarioResults.getNumberOfScenariosPassed(), newLine());
      docBuilder.append(tableCol(), scenarioResults.getNumberOfScenariosFailed(), newLine());
      docBuilder.append(tableCol(), scenarioResults.getNumberOfScenarios(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfPasses(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfFailures(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfSkipped(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfPending(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfUndefined(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfMissing(), newLine());
      docBuilder.append(tableCol(), stepResults.getNumberOfSteps(), newLine());
      docBuilder.append(tableCol(), stepResults.getTotalDurationAsString(), newLine());
      docBuilder.append(tableCol(), Status.getStatusColor(feature.getStatus()), newLine());
    }
    renderTotalsRow();
    docBuilder.textLine(table());
    return docBuilder.toString();
  }

  private void calculateTotalizations(List<Feature> features) {
    if (scenarioTotalizationsCache == null) {
      scenarioTotalizationsCache = new ScenarioTotalizations(features);
    }
  }

  // should be only called inside renderSummary()
  private void renderTotalsRow() {
    docBuilder
        .append("12+^|*" + i18n.getMessage("summary.total") + "*", newLine())
        .append(
            tableCol(),
            scenarioTotalizationsCache.getTotalPassedScenarios(),
            tableCol(),
            scenarioTotalizationsCache.getTotalFailedScenarios())
        .append(tableCol(), scenarioTotalizationsCache.getTotalScenarios())
        .append(
            tableCol(),
            scenarioTotalizationsCache.getTotalPassedSteps(),
            tableCol(),
            scenarioTotalizationsCache.getTotalFailedSteps())
        .append(
            tableCol(),
            scenarioTotalizationsCache.getTotalSkippedSteps(),
            tableCol(),
            scenarioTotalizationsCache.getTotalPendingSteps())
        .append(
            tableCol(),
            scenarioTotalizationsCache.getTotalUndefinedSteps(),
            tableCol(),
            scenarioTotalizationsCache.getTotalMissingSteps())
        .append(
            tableCol(),
            scenarioTotalizationsCache.getTotalSteps(),
            " 2+",
            tableCol(),
            Formatter.formatTime(scenarioTotalizationsCache.getTotalDuration()));
    docBuilder.newLine();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/renderer/CukedoctorTagsRenderer.java ----
package com.github.cukedoctor.renderer;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.api.model.Tag;
import com.github.cukedoctor.spi.TagsRenderer;
import java.util.HashSet;
import java.util.List;

/** Created by pestano on 28/02/16. */
public class CukedoctorTagsRenderer extends AbstractBaseRenderer implements TagsRenderer {

  @Override
  public String renderScenarioTags(Feature feature, Scenario scenario) {
    docBuilder.clear();

    int expectedSize =
        (feature.hasTags() ? feature.getTags().size() : 0)
            + (scenario.hasTags() ? scenario.getTags().size() : 0);
    if (expectedSize == 0) return "";

    HashSet<String> tagNames = new HashSet<>(expectedSize);
    extractTagNames(tagNames, feature.getTags());
    extractTagNames(tagNames, scenario.getTags());
    if (tagNames.isEmpty()) return "";

    docBuilder.clear();
    StringBuilder tags = new StringBuilder("[small]#tags: ");
    for (String tagName : tagNames) {
      tags.append(tagName).append(",");
    }

    if (tags.indexOf(",") != -1) { // delete last comma
      tags.deleteCharAt(tags.lastIndexOf(","));
    }

    tags.append("#");
    docBuilder.textLine(tags.toString());
    docBuilder.newLine();
    return docBuilder.toString();
  }

  private void extractTagNames(HashSet<String> tagNames, List<Tag> tags) {
    if (tags == null) return;

    for (Tag tag : tags) {
      if (!isCukedoctorTag(tag)) {
        tagNames.add(tag.getName());
      }
    }
  }

  protected boolean isCukedoctorTag(Tag tag) {
    return tag.isOrder() || tag.isLanguage() || tag.isDiscrete();
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/ExamplesRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.renderer.BaseRenderer;

/** Created by pestano on 28/02/16. */
public interface ExamplesRenderer extends BaseRenderer {

  /**
   * @param scenario the scenario containing the examples
   * @return the renderer {@link String}
   * @deprecated Use renderScenarioExamples(Scenario, CukedoctorDocumentBuilder) instead
   */
  @Deprecated(forRemoval = true)
  String renderScenarioExamples(Scenario scenario);

  default String renderScenarioExamples(
      Scenario scenario, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderScenarioExamples(scenario);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/FeatureRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.renderer.BaseRenderer;
import java.util.List;

/** Created by pestano on 24/02/16. */
public interface FeatureRenderer extends BaseRenderer {

  /**
   * @param feature the feature to render
   * @return the rendered {@link String}
   * @deprecated Use renderFeature(Feature, CukedoctorDocumentBuilder) instead
   */
  @Deprecated(forRemoval = true)
  String renderFeature(Feature feature);

  default String renderFeature(Feature feature, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderFeature(feature);
  }

  /**
   * @param features the features to render
   * @return the rendered {@link String}
   * @deprecated Use renderFeatures(List&lt;Feature&gt;, CukedoctorDocumentBuilder) instead
   */
  @Deprecated(forRemoval = true)
  String renderFeatures(List<Feature> features);

  default String renderFeatures(List<Feature> features, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderFeatures(features);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/HeaderRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.renderer.BaseRenderer;

/**
 * Created by rmpestano on 27/04/20.
 *
 * <p>This renderer is responsible for generating the documentation header such as attributes
 */
public interface HeaderRenderer extends BaseRenderer {

  /**
   * @deprecated Use renderDocumentHeader(DocumentAttributes, CukedoctorDocumentBuilder) instead
   * @param cukedoctorAttributes cukedoctor attributes
   * @return the rendered {@link String}
   */
  @Deprecated(forRemoval = true)
  String renderDocumentHeader(DocumentAttributes cukedoctorAttributes);

  default String renderDocumentHeader(
      DocumentAttributes cukedoctorAttributes, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderDocumentHeader(cukedoctorAttributes);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/ScenarioRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.renderer.BaseRenderer;

/** Created by pestano on 24/02/16. */
public interface ScenarioRenderer extends BaseRenderer {

  /**
   * @param scenario scenario to render
   * @param feature the feature containing the scenario
   * @return the renderer scenario
   * @deprecated Use renderScenario(Scenario, Feature, CukedoctorDocumentBuilder) instead
   */
  @Deprecated(forRemoval = true)
  String renderScenario(Scenario scenario, Feature feature);

  default String renderScenario(
      Scenario scenario, Feature feature, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderScenario(scenario, feature);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/StepsRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.api.model.Step;
import com.github.cukedoctor.renderer.BaseRenderer;
import java.util.List;

/** Created by pestano on 28/02/16. */
public interface StepsRenderer extends BaseRenderer {

  /**
   * @param steps the steps to render
   * @param scenario scenario containing the steps
   * @param feature the feature containing the scenario
   * @return the renderer {@link String}
   * @deprecated Use renderSteps(List&lt;Step&gt;, Scenario, Feature, CukedoctorDocumentBuilder)
   *     instead
   */
  @Deprecated(forRemoval = true)
  String renderSteps(List<Step> steps, Scenario scenario, Feature feature);

  default String renderSteps(
      List<Step> steps,
      Scenario scenario,
      Feature feature,
      CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderSteps(steps, scenario, feature);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/SummaryRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.renderer.BaseRenderer;
import java.util.List;

/** Created by pestano on 24/02/16. */
public interface SummaryRenderer extends BaseRenderer {

  /**
   * @param features the features to render
   * @return the rendered {@link String}
   * @deprecated Use renderSummary(List&lt;Feature&gt;, CukedoctorDocumentBuilder) instead
   */
  @Deprecated(forRemoval = true)
  String renderSummary(List<Feature> features);

  default String renderSummary(List<Feature> features, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderSummary(features);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/spi/TagsRenderer.java ----
package com.github.cukedoctor.spi;

import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.api.model.Scenario;
import com.github.cukedoctor.renderer.BaseRenderer;

/** Created by pestano on 28/02/16. */
public interface TagsRenderer extends BaseRenderer {

  /**
   * @param feature the feature containing the tags
   * @param scenario the scenario containing the tags
   * @return the rendered {@link String}
   * @deprecated Use renderScenarioTags(Scenario, CukedoctorDocumentBuilder) instead
   */
  @Deprecated(forRemoval = true)
  String renderScenarioTags(Feature feature, Scenario scenario);

  default String renderScenarioTags(
      Feature feature, Scenario scenario, CukedoctorDocumentBuilder documentBuilder) {
    setDocumentBuilder(documentBuilder);
    return renderScenarioTags(feature, scenario);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/Assert.java ----
package com.github.cukedoctor.util;

import java.io.Serializable;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/** Created by rafael-pestano on 26/06/2015. */
public class Assert implements Serializable {

  private Assert() {}

  /**
   * @param object to assert
   * @return TRUE assertion when given objects is not null, FALSE otherwise
   */
  public static boolean notNull(Object object) {

    return object != null;
  }

  /**
   * @param object to assert
   * @return TRUE assertion when given objects is null, FALSE otherwise
   */
  public static boolean isNull(Object object) {

    return object == null;
  }

  /**
   * @param assertion expression to be negated
   * @return just negates the assertion
   */
  public static boolean not(boolean assertion) {

    return !assertion;
  }

  /**
   * @param text to assert
   * @return TRUE when given text has any character, FALSE otherwise
   */
  public static boolean hasText(String text) {
    return notNull(text) && text.trim().length() > 0;
  }

  /**
   * @param textToSearch complete text
   * @param substring text to search in textToSearch param
   * @return TRUE when given text contains the given substring, FALSE otherwise
   */
  public static boolean contains(String textToSearch, String substring) {
    return notNull(textToSearch) && textToSearch.contains(substring);
  }

  /**
   * @param collection collection to check emptiness
   * @return TRUE when given collection has elements; that is, it must not be {@code null} and must
   *     have at least one element. @return FALSE otherwise
   */
  public static boolean notEmpty(Collection<?> collection) {
    return notNull(collection) && !collection.isEmpty();
  }

  /**
   * @param array to check elements
   * @return TRUE when given array has at least one not null element; FALSE otherwise
   */
  public static boolean hasElements(Object[] array) {
    return Optional.ofNullable(array)
        .map(objects -> Arrays.stream(objects).anyMatch(Objects::nonNull))
        .orElse(false);
  }

  /**
   * @param collection to check elements
   * @return TRUE when given array has at least one not null element; FALSE otherwise
   */
  public static boolean hasElements(Collection<?> collection) {
    return Optional.ofNullable(collection)
        .map(objects -> objects.stream().anyMatch(Objects::nonNull))
        .orElse(false);
  }

  /**
   * @param map to check emptiness
   * @return TRUE if given Map has entries; that is, it must not be {@code null} and must have at
   *     least one entry. Queue FALSE otherwise
   */
  public static boolean notEmpty(Map<?, ?> map) {
    if (map == null) {
      return false;
    }
    return hasElements(map.entrySet().toArray());
  }

  /**
   * Assert that an array has no null elements. Note: Does not complain if the array is empty!
   *
   * <pre class="code">
   * Assert.noNullElements(array, &quot;The array must have non-null elements&quot;);
   * </pre>
   *
   * @param array the array
   * @return TRUE when given array has no null elements; FALSE otherwise
   */
  public static boolean notNull(Object[] array) {
    if (array != null) {
      for (Object element : array) {
        if (element == null) {
          return false;
        }
      }
    }
    return true;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/DefaultImplementationInstantiationException.java ----
package com.github.cukedoctor.util;

public class DefaultImplementationInstantiationException extends RuntimeException {
  public DefaultImplementationInstantiationException(Class<?> clazz, Throwable t) {
    super(String.format("Failed to instantiate '%s'", clazz.getName()), t);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/FileUtil.java ----
package com.github.cukedoctor.util;

import static com.github.cukedoctor.util.Assert.hasText;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Created by pestano on 02/06/15. */
public class FileUtil {

  private static final Logger log = LoggerFactory.getLogger(FileUtil.class);
  public static final Pattern ADOC_FILE_EXTENSION =
      Pattern.compile("([^\\s]+(\\.(?i)(ad|adoc|asciidoc|asc))$)");

  private FileUtil() {}

  /**
   * @param path full path to the json feature result
   * @return absolute path to to json result file
   */
  public static String findJsonFile(String path) {

    if (path == null) {
      path = "";
    }

    File f = new File(path);
    if (f.exists()) {
      return f.getAbsolutePath();
    }

    // relative path
    if (path.startsWith("/")) { // remove slash to use relative paths
      path = path.substring(1);
    }

    return Paths.get(path.trim()).toAbsolutePath().toString();
  }

  /**
   * @param startDir initial directory to scan for features
   * @return all found json files path that represent cucumber features
   */
  public static List<String> findJsonFiles(String startDir) {
    return findFiles(startDir, ".json");
  }

  public static List<String> findFiles(String startDir, final String suffix) {
    return findFiles(startDir, suffix, false);
  }

  public static List<String> findFiles(
      String startDir, final String suffix, final boolean singleResult) {
    return findFiles(startDir, suffix, singleResult, null);
  }

  public static List<String> findFiles(
      String startDir, final String suffix, final boolean singleResult, final String relativePath) {
    final List<String> foundPaths = new ArrayList<>();
    if (startDir == null) {
      startDir = "";
    }

    Path startPath = Paths.get(startDir);

    if (!Files.exists(startPath)) {
      if (startDir.startsWith("/")) { // try to find using relative paths
        startDir = startDir.substring(1);
        startPath = Paths.get(startDir);
      }

      if (!Files.exists(startPath)) {
        startPath = Paths.get("");
      }
    }

    try {
      Files.walkFileTree(
          startPath,
          new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(final Path file, final BasicFileAttributes attrs)
                throws IOException {
              final String fileName = file.getFileName().toString();
              if (fileName.endsWith(suffix)) {
                if (hasText(relativePath)) {
                  boolean isFile = file.toFile().isFile();
                  Path computedPath =
                      Paths.get(relativePath)
                          .relativize(
                              isFile ? file.getParent().toAbsolutePath() : file.toAbsolutePath());
                  if (isFile) {
                    foundPaths.add(computedPath + "/" + file.toFile().getName());
                  } else {
                    foundPaths.add(computedPath.toString());
                  }

                } else {
                  foundPaths.add(file.toAbsolutePath().toString());
                }
                if (singleResult) {
                  return FileVisitResult.TERMINATE;
                }
              }
              if (attrs.isDirectory()) {
                return super.visitFile(file, attrs);
              } else {
                return FileVisitResult.SKIP_SUBTREE;
              }
            }
          });
    } catch (IOException e) {
      log.warn("Problems scanning {} files in path: {}", suffix, startDir, e);
    }
    return foundPaths;
  }

  /**
   * Saves a file into filesystem. Note that name can be saved as absolute (if it has a leading
   * slash) or relative to current path. EX: /target/name.adoc will save the file into
   *
   * @param name file name
   * @param data file content
   * @return the path of saved file
   */
  public static File saveFile(String name, String data) {
    if (name == null) {
      name = "";
    }
    String fullyQualifiedName = name;

    // if filename is not absolute use current path as base dir
    if (!new File(fullyQualifiedName).isAbsolute()) {
      fullyQualifiedName = Paths.get("").toAbsolutePath() + "/" + name;
    }
    try {
      // create subdirs (if there any)
      if (fullyQualifiedName.contains("/")) {
        File f = new File(fullyQualifiedName.substring(0, fullyQualifiedName.lastIndexOf("/")));
        f.mkdirs();
      }
      File file = new File(fullyQualifiedName);
      file.createNewFile();
      FileUtils.write(file, data, "UTF-8");
      log.info("Wrote: {}", file.getAbsolutePath());
      return file;
    } catch (IOException e) {
      log.error("Could not create file {}", name, e);
      return null;
    }
  }

  public static File loadFile(String path) {
    if (path == null) {
      path = File.separator;
    }

    File f = new File(path);
    if (f.exists()) {
      return f.getAbsoluteFile();
    }

    if (!path.startsWith("/")) {
      path = File.separator + path;
    }

    return new File(Paths.get("").toAbsolutePath() + path.trim());
  }

  public static boolean removeFile(String path) {
    File fileToRemove = loadFile(path);
    try {
      Files.delete(fileToRemove.toPath());
      return true;
    } catch (IOException e) {
      log.error("could not delete path {}", path);
      return false;
    }
  }

  public static void removeDir(String path) throws IOException {
    File directoryToRemove = loadFile(path);
    FileUtils.deleteDirectory(directoryToRemove);
  }

  /**
   * @param source resource from classpath
   * @param dest dest path
   * @return copied file
   */
  public static File copyFileFromClassPath(String source, String dest) {
    if (source != null && dest != null) {
      try {
        InputStream in = FileUtil.class.getResourceAsStream(source);
        return saveFile(dest, IOUtils.toString(in, StandardCharsets.UTF_8));
      } catch (IOException e) {
        log.error("Could not copy source file: {} to dest file: {}", source, dest, e);
      }
    }
    return null;
  }

  /**
   * @param source file path
   * @param dest dest path
   * @return copied file
   */
  public static File copyFile(String source, String dest) {

    if (source != null && dest != null) {
      File sourcefile = new File(source);
      if (!sourcefile.exists()) {
        log.warn("File {} not found.", sourcefile.getAbsolutePath());
        return null;
      }
      try {
        InputStream in = new FileInputStream(source);
        return saveFile(dest, IOUtils.toString(in, StandardCharsets.UTF_8));
      } catch (IOException e) {
        log.error("Could not copy source file: {} to dest file: {}", source, dest, e);
      }
    }
    return null;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/Formatter.java ----
package com.github.cukedoctor.util;

import org.joda.time.Period;
import org.joda.time.format.PeriodFormatter;
import org.joda.time.format.PeriodFormatterBuilder;

/** Created by pestano on 07/06/15. */
public class Formatter {

  private static final PeriodFormatter TIME_FORMATTER =
      new PeriodFormatterBuilder()
          .appendDays()
          .appendSuffix("d")
          .appendSeparator(" ")
          .appendHours()
          .appendSuffix("h")
          .appendSeparator(" ")
          .minimumPrintedDigits(2)
          .appendMinutes()
          .appendSuffix("m")
          .appendSeparator(" ")
          .minimumPrintedDigits(2)
          .appendSeconds()
          .appendSuffix("s")
          .appendSeparator(" ")
          .minimumPrintedDigits(3)
          .appendMillis()
          .appendSuffix("ms")
          .toFormatter();

  private Formatter() {}

  public static String formatTime(Long time) {
    return TIME_FORMATTER.print(new Period(0, time / 1000000));
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/ObjectUtil.java ----
package com.github.cukedoctor.util;

import java.lang.reflect.Field;

public class ObjectUtil {

  private ObjectUtil() {}

  public static Object getFieldValue(Object obj, String fieldName)
      throws NoSuchFieldException, IllegalAccessException {
    Field field = obj.getClass().getDeclaredField(fieldName);
    field.setAccessible(true);
    return field.get(obj);
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/ServiceLoaderUtil.java ----
package com.github.cukedoctor.util;

import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.i18n.I18nLoader;
import com.github.cukedoctor.renderer.BaseRenderer;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.ServiceLoader;
import java.util.function.Function;

public final class ServiceLoaderUtil<R extends BaseRenderer> {
  private final Function<Class<R>, Iterator<R>> loader;

  public ServiceLoaderUtil() {
    this(c -> ServiceLoader.load(c).iterator());
  }

  public ServiceLoaderUtil(Iterable<R> services) {
    this(x -> services.iterator());
  }

  public ServiceLoaderUtil(Function<Class<R>, Iterator<R>> loader) {
    this.loader = loader;
  }

  @SafeVarargs
  public final R load(
      Class<R> service,
      Class<? extends R> defaultImplementation,
      CukedoctorConfig cukedoctorConfig,
      Class<? extends R>... except) {
    HashSet<Class<?>> exceptions = new HashSet<>(Arrays.asList(except));

    Iterator<R> services = loader.apply(service);
    while (services.hasNext()) {
      R candidate = services.next();
      if (!exceptions.contains(candidate.getClass())) {
        candidate.setCukedoctorConfig(cukedoctorConfig);
        return candidate;
      }
    }

    try {
      R defaultImpl = defaultImplementation.getDeclaredConstructor().newInstance();
      defaultImpl.setCukedoctorConfig(cukedoctorConfig);
      return defaultImpl;
    } catch (Throwable t) {
      throw new DefaultImplementationInstantiationException(defaultImplementation, t);
    }
  }

  @SafeVarargs
  public final R initialise(
      Class<R> service,
      Class<? extends R> defaultImplementation,
      I18nLoader i18n,
      DocumentAttributes attributes,
      CukedoctorConfig cukedoctorConfig,
      Class<? extends R>... except) {
    R renderer = load(service, defaultImplementation, cukedoctorConfig, except);
    renderer.setDocumentAttributes(attributes);
    renderer.setI18n(i18n);
    renderer.setCukedoctorConfig(cukedoctorConfig);
    return renderer;
  }
}

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/StringUtil.java ----
package com.github.cukedoctor.util;

import static com.github.cukedoctor.util.Assert.hasText;
import static com.github.cukedoctor.util.Constants.newLine;

public class StringUtil {

  private StringUtil() {}

  public static String trimAllLines(String text) {
    if (!hasText(text)) {
      return text;
    }

    StringBuilder trimmedDescription = new StringBuilder();
    String[] lines = normaliseLineEndings(text).split(newLine());
    boolean shouldTrim = true;
    boolean foundFirstNotEmptyLine = false;
    int leadingWhitespaceCharsToTrim = 0;
    for (int i = 0; i < lines.length; i++) {
      String line = lines[i];

      if (!foundFirstNotEmptyLine && line != null && !line.isEmpty()) {
        leadingWhitespaceCharsToTrim = countLeadingWhitespace(line);
        foundFirstNotEmptyLine = true;
      }

      line = trimStart(line, leadingWhitespaceCharsToTrim);

      if (line.trim().startsWith(Constants.Markup.listing())) {
        // enable trimming on end listing
        shouldTrim = !shouldTrim; // remove trimming on start listing
      }

      if (shouldTrim) {
        trimmedDescription.append(trimEnd(line));
      } else {
        trimmedDescription.append(line);
      }

      if (i < lines.length - 1) {
        trimmedDescription.append(newLine());
      }
    }

    return trimmedDescription.toString();
  }

  static int countLeadingWhitespace(String text) {
    if (text == null) return 0;

    int i = 0;
    while (i < text.length()) {
      char c = text.charAt(i);
      if (c != ' ' && c != '\t') {
        break;
      }

      i += Character.charCount(c);
    }

    return i;
  }

  static String trimStart(String text, int count) {
    if (count < 1) return text;

    if (text == null) return null;

    int i = 0;
    while (i < text.length() && i < count) {
      char c = text.charAt(i);
      if (c != ' ' && c != '\t') {
        break;
      }

      i += Character.charCount(c);
    }

    return text.substring(i);
  }

  static String trimEnd(String text) {
    if (text == null) return null;

    // https://stackoverflow.com/a/48053234
    return text.replaceFirst("\\s++$", "");
  }

  public static String normaliseLineEndings(String s) {
    if (s == null) return null;

    return s.replaceAll("\\r\\n|\\r|\\n", System.lineSeparator());
  }
}

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/util/MetaCuke.java ----
package com.github.cukedoctor.util;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.util.LinkedList;

public class MetaCuke {
  private final LinkedList<File> featureFiles = new LinkedList<>();
  private final File featureDirectory;
  private File reportFile;

  public MetaCuke() throws IOException {
    featureDirectory = Files.createTempDirectory("Features").toFile();
    featureDirectory.deleteOnExit();
  }

  public void setUp() throws IOException {
    featureFiles.clear();
    reportFile = createTempFile("Report", ".json");
  }

  public void addFeature(String featureText) throws IOException {
    File featureFile = createTempFile("Scenario", ".feature");
    writeFeatureToFile(featureText, featureFile);
    featureFiles.add(featureFile);
  }

  public <T> void runCucumber(Class<T> stepDefs) {
    runCucumber(stepDefs.getPackage().getName());
  }

  public void runCucumber(String stepDefinitionPath) {
    io.cucumber.core.cli.Main.run(
        new String[] {
          "--glue",
          stepDefinitionPath,
          // The below lines are helpful for debugging, but severely confuse general test output
          //  "--plugin",
          //  "pretty",
          "--plugin",
          "json:" + reportFile.getAbsolutePath(),
          featureDirectory.getAbsolutePath(),
        },
        Thread.currentThread().getContextClassLoader());
  }

  public File getReport() {
    return reportFile;
  }

  public void tearDown() throws IOException {
    for (File feature : featureFiles) {
      Files.deleteIfExists(feature.toPath());
    }

    Files.deleteIfExists(reportFile.toPath());
  }

  private File createTempFile(String prefix, String suffix) throws IOException {
    File tempFile = File.createTempFile(prefix, suffix, featureDirectory);
    tempFile.deleteOnExit();
    return tempFile;
  }

  private static void writeFeatureToFile(String featureText, File featureFile) throws IOException {
    FileWriter fileWriter = new FileWriter(featureFile);
    BufferedWriter bufferedWriter = new BufferedWriter(fileWriter);
    bufferedWriter.write(featureText);
    bufferedWriter.close();
    fileWriter.close();
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorExtensionRegistry.java ----
package com.github.cukedoctor.extension;

import org.asciidoctor.Asciidoctor;
import org.asciidoctor.extension.ExtensionGroup;
import org.asciidoctor.jruby.extension.spi.ExtensionRegistry;

/** {@link ExtensionRegistry} for Cukedoctor */
public class CukedoctorExtensionRegistry implements ExtensionRegistry {

  /** Cukedoctor group name for declaring extensions to asciidoctor. */
  public static final String CUKEDOCTOR_EXTENSION_GROUP_NAME = "com.github.cukedoctor";
  /** Key for disabling all extensions */
  public static final String DISABLE_ALL_EXT_KEY = "cukedoctor.disable-extensions";
  /** Key for disabling filter extension */
  public static final String FILTER_DISABLE_EXT_KEY = "cukedoctor.disable.filter";
  /** Key for disabling theme extension */
  public static final String THEME_DISABLE_EXT_KEY = "cukedoctor.disable.theme";
  /** Key for disabling min-max extension */
  public static final String MINMAX_DISABLE_EXT_KEY = "cukedoctor.disable.minmax";
  /** Key for disabling style extension */
  public static final String STYLE_DISABLE_EXT_KEY = "cukedoctor.disable.style";
  /** Key for disabling footer extension */
  public static final String FOOTER_DISABLE_EXT_KEY = "cukedoctor.disable.footer";

  @Override
  public void register(Asciidoctor asciidoctor) {
    // null means extension is enabled (by default)
    if (System.getProperty(DISABLE_ALL_EXT_KEY) != null) {
      return;
    }

    ExtensionGroup cukedoctorExtensionGroup =
        asciidoctor.createGroup(CUKEDOCTOR_EXTENSION_GROUP_NAME);
    cukedoctorExtensionGroup.postprocessor(CukedoctorScriptExtension.class);

    if (System.getProperty(FILTER_DISABLE_EXT_KEY) == null) {
      cukedoctorExtensionGroup.postprocessor(CukedoctorFilterExtension.class);
    }
    if (System.getProperty(MINMAX_DISABLE_EXT_KEY) == null) {
      cukedoctorExtensionGroup.blockMacro("minmax", CukedoctorMinMaxExtension.class);
    }

    if (System.getProperty(THEME_DISABLE_EXT_KEY) == null) {
      cukedoctorExtensionGroup.postprocessor(CukedoctorThemeExtension.class);
    }

    if (System.getProperty(FOOTER_DISABLE_EXT_KEY) == null) {
      cukedoctorExtensionGroup.postprocessor(CukedoctorFooterExtension.class);
    }
    if (System.getProperty(STYLE_DISABLE_EXT_KEY) == null) {
      cukedoctorExtensionGroup.postprocessor(CukedoctorStyleExtension.class);
    }

    cukedoctorExtensionGroup.register();
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorFilterExtension.java ----
package com.github.cukedoctor.extension;

import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.FILTER_DISABLE_EXT_KEY;

import org.asciidoctor.ast.Document;
import org.asciidoctor.extension.Postprocessor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

/** Created by pestano on 20/07/15. adds search box to rendered html documentation */
public class CukedoctorFilterExtension extends Postprocessor {

  @Override
  public String process(Document document, String output) {
    if (document.isBasebackend("html") && System.getProperty(FILTER_DISABLE_EXT_KEY) == null) {
      org.jsoup.nodes.Document doc = Jsoup.parse(output, "UTF-8");

      Elements sect1 = doc.getElementsByClass("sect1");
      if (!sect1.isEmpty()) {
        Element contentElement = doc.getElementsByClass("sect1").get(0);
        contentElement.before(
            "<span style=\"float:right\">\n"
                + "\t<input value=\"Filter...\" onclick=\"this.value=''\" title=\"Filter features"
                + " by title\" onblur=\"searchFeature(this.value);\"/>\n"
                + "</span>");
      }
      return doc.html();
    } else {
      return output;
    }
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorFooterExtension.java ----
package com.github.cukedoctor.extension;

import java.text.DateFormat;
import java.util.Date;
import java.util.PropertyResourceBundle;
import java.util.ResourceBundle;
import org.asciidoctor.ast.Document;
import org.asciidoctor.extension.Postprocessor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Created by pestano on 20/07/15. adds search box to rendered html documentation */
public class CukedoctorFooterExtension extends Postprocessor {

  private static final Logger log = LoggerFactory.getLogger(CukedoctorFooterExtension.class);

  private static final DateFormat dateFormat =
      DateFormat.getDateTimeInstance(DateFormat.DEFAULT, DateFormat.DEFAULT);

  @Override
  public String process(Document document, String output) {
    if (document.isBasebackend("html") && System.getProperty("cukedoctor.disable.footer") == null) {
      String stopWatch = System.getProperty("cukedoctor.stopwatch");
      double generationTimeInSeconds = 0;
      String documentationDate = dateFormat.format(new Date());
      String cukedoctorVersion = "";
      try {
        ResourceBundle bundle =
            new PropertyResourceBundle(
                CukedoctorFooterExtension.class.getResourceAsStream(
                    "/cukedoctor-extension.properties"));
        cukedoctorVersion = bundle.getString("cukedoctor.version");
      } catch (Exception e) {
        log.warn("Could not find bundle cukedoctor-extension");
      }

      if (stopWatch != null && !"".equals(stopWatch)) {
        long begin;
        try {
          begin = Long.parseLong(stopWatch);
          generationTimeInSeconds = (System.currentTimeMillis() - begin) / 1000.0;
        } catch (NumberFormatException e) {
          log.warn("cannot parse long from <{}>", stopWatch);
        }
      }
      org.jsoup.nodes.Document doc = Jsoup.parse(output, "UTF-8");
      Element contentElement = doc.getElementById("footer");
      contentElement.attr("style", "color:gray;font-size:11px");
      contentElement
          .text("Generated by ")
          .append(
              "<a href=https://github.com/rmpestano/cukedoctor target=\"_blank\"> Cukedoctor "
                  + cukedoctorVersion
                  + "</a>");
      contentElement.append(" - " + documentationDate);
      contentElement.append(
          "<span style=\"float:right;font-size:11px\"> Execution time: "
              + generationTimeInSeconds
              + " seconds</span>");
      return doc.html();
    } else {
      return output;
    }
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorMinMaxExtension.java ----
package com.github.cukedoctor.extension;

import java.util.Map;
import org.asciidoctor.ast.StructuralNode;
import org.asciidoctor.extension.BlockMacroProcessor;

/** Created by pestano on 20/07/15. */
public class CukedoctorMinMaxExtension extends BlockMacroProcessor {

  @Override
  public Object process(StructuralNode parent, String target, Map<String, Object> map) {
    if (!parent.getDocument().isBasebackend("pdf")) {
      String minMax =
          "<span class=\"fa fa-minus-square fa-fw\""
              + " style=\"cursor:pointer;float:right;margin-top:-30px\" "
              + " title=\"Minimize\" onclick=\"hideFeatureScenarios('"
              + target
              + "');document.getElementById('hidden-"
              + target
              + "').style.display = 'inline';this.style.display = 'none'\">  </span>\n\n"
              + "<span id=\"hidden-"
              + target
              + "\""
              + " class=\"fa fa-plus-square fa-fw\""
              + " style=\"cursor:pointer;float:right;display:none;margin-top:-30px\""
              + " title=\"Maximize feature\" onclick=\"showFeatureScenarios('"
              + target
              + "');"
              + "this.style.display = 'none'\">  </span>";
      return createBlock(parent, "pass", minMax);
    } else {
      return null;
    }
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorScriptExtension.java ----
package com.github.cukedoctor.extension;

import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.FILTER_DISABLE_EXT_KEY;
import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.MINMAX_DISABLE_EXT_KEY;
import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.THEME_DISABLE_EXT_KEY;

import org.asciidoctor.ast.Document;
import org.asciidoctor.extension.Postprocessor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;

/** Created by pestano on 20/07/15. adds javascript functions to html documentation */
public class CukedoctorScriptExtension extends Postprocessor {

  private static final Boolean HIDE_FEATURES_SECTION =
      System.getProperty("HIDE_FEATURES_SECTION") == null
          ? Boolean.FALSE
          : Boolean.valueOf(System.getProperty("HIDE_FEATURES_SECTION"));

  @Override
  public String process(Document document, String output) {
    if (document.isBasebackend("html")) {
      org.jsoup.nodes.Document doc = Jsoup.parse(output, "UTF-8");

      Element contentElement = doc.getElementById("footer");
      if (contentElement == null) {
        return output;
      }
      if (System.getProperty(FILTER_DISABLE_EXT_KEY) == null) {
        addSearchScript(contentElement);
      }
      if (System.getProperty(MINMAX_DISABLE_EXT_KEY) == null) {
        addMinMaxScript(contentElement);
      }
      if (System.getProperty(THEME_DISABLE_EXT_KEY) == null) {
        addThemeScript(contentElement);
      }
      return doc.html();

    } else {
      return output;
    }
  }

  private void addThemeScript(Element contentElement) {
    String themeScript =
        " <script type=\"text/javascript\">  \n"
            + "\n"
            + "document.addEventListener(\"DOMContentLoaded\", function(event) { \n"
            + "  themefy();\n"
            + "});\n"
            + "\tfunction themefy() {\n"
            + " \t\t\t\t\t\tvar theme = getThemeFromQueryParameters() || 'asciidoctor';\n"
            + " \t\t\t\t\t\tvar themeLink = document.createElement('link');\n"
            + "\t\t\t\t\t if('asciidoctor' !== theme) { \t\t\t\t\t\tthemeLink.rel ="
            + " 'stylesheet';\n"
            + " \t\t\t\t\t\tthemeLink.id = 'asciidoctor-style';\n"
            + " \t\t\t\t\t\tthemeLink.href = 'themes/' + theme + '.css';\n"
            + " \t\t\t\t\t\t document.head.appendChild(themeLink);\n"
            + "\t\t\t\t }}\n"
            + "\n"
            + "\n"
            + "\tfunction getThemeFromQueryParameters() {\n"
            + "\t\tvar query = location.search.substr(1);\n"
            + "\t\tvar result = 'asciidoctor';\n"
            + "\tquery.split(\"&\").forEach(function (part) {\n"
            + "\t\t\t\t// part can be empty\n"
            + "\t\t\t\tif (part) {\n"
            + "\t\t\t\t\tvar item = part.split(\"=\");\n"
            + "\t\t\t\t\tvar key = item[0];\n"
            + "\t\t\t\tvar value = item[1];\n"
            + "\t\t\t\tif (typeof value !== 'undefined') {\n"
            + "\t\t\t\t\t\tif(key == 'theme'){\n"
            + "\t\t\t\t\t\t\t\tresult = value;\n"
            + "\t\t\t\t\t\t\t\t}\n"
            + "\t\t\t}\n"
            + "\t\t}\n"
            + " \t});\n"
            + "\tif(!result){\n"
            + "\t\tresult = 'asciidoctor';\n"
            + "\t\t\n"
            + "\t}\n"
            + "\tdocument.getElementById('themes').value = result;  \n"
            + "\tvar els = document.querySelector('select[name=\"select\"] option[value=\"' +"
            + " result + '\"]');  \n"
            + "\tif(els){\n"
            + "    els.selected = true;\n"
            + "\t}\treturn result;\n"
            + "}\n"
            + " \n"
            + "</script>      ";

    contentElement.after(themeScript);
  }

  private void addMinMaxScript(Element contentElement) {
    String minMaxScript =
        HIDE_FEATURES_SECTION
            ? getMinMaxScriptForDocWithoutFeaturesSection()
            : "<script type=\"text/javascript\">\n"
                + "\tfunction showFeatureScenarios(featureId){\n"
                + "\t\tvar element = document.getElementById(featureId).parentNode;\n"
                + "\t\tfor (var i = 0; i < element.childNodes.length; i++) {\n"
                + "    \t\tif (element.childNodes[i].className == \"sect3\" ||"
                + " element.childNodes[i].className == \"fa fa-minus-square fa-fw\") {\n"
                + "      \t\t     element.childNodes[i].style.display = 'inline';\n"
                + "    \t\t\t}\n"
                + "    \t\tif (element.childNodes[i].className == \"sidebarblock\") {\n"
                + "      \t\t     element.childNodes[i].style.display = 'block';\n"
                + "    \t\t\t}\t\t\t        \n"
                + "\t\t}\n"
                + "\t\t \n"
                + " \t\tdocument.getElementById(featureId).children[0].click();\n"
                + "\t}\n"
                + "\n"
                + "\tfunction hideFeatureScenarios(featureId){\n"
                + "\t\tvar element = document.getElementById(featureId).parentNode;\n"
                + "\t\tfor (var i = 0; i < element.childNodes.length; i++) {\n"
                + "    \t\tif (element.childNodes[i].className == \"sect3\" ||"
                + " element.childNodes[i].className == \"sidebarblock\") { \n"
                + "      \t\t     element.childNodes[i].style.display = 'none';\t   \t\t    \n"
                + "                 \t}\n"
                + "\t\t      \n"
                + "\t\t}\n"
                + "\t   document.getElementById(featureId).children[0].click();\n"
                + " \t}\n"
                + "\n"
                + "</script>";

    contentElement.after(minMaxScript);
  }

  private String getMinMaxScriptForDocWithoutFeaturesSection() {
    return "<script type=\"text/javascript\">\n"
        + "function showFeatureScenarios(featureId){\n"
        + "\t\tvar element = document.getElementById(featureId).parentNode;\n"
        + "\t\tfor (var i = 0; i < element.childNodes.length; i++) {\n"
        + "    \t\tif (element.childNodes[i].className == \"sectionbody\") {\n"
        + "\t\t     var secChild = element.childNodes[i];\t\n"
        + "\t\t     for (var j = 0; j < secChild.childNodes.length; j++) {\n"
        + "                             if(secChild.childNodes[j].className == \"sect2\" ||"
        + " secChild.childNodes[j].className == \"sectionbody\" || "
        + " secChild.childNodes[j].className == \"fa fa-minus-square fa-fw\") {\n"
        + "\t      \t\t     secChild.childNodes[j].style.display = 'inline';\n"
        + "\t\t\t }\n"
        + "\t\t\tif (secChild.childNodes[j].className == \"sidebarblock\") {\n"
        + "      \t\t             secChild.childNodes[j].style.display = 'block';\n"
        + "    \t\t\t   }\n"
        + "\t\t\t}\t\n"
        + "    \t\t }\n"
        + "    \t\t\t\t\t        \n"
        + "\t\t}\n"
        + "\t\t \n"
        + " \t\tdocument.getElementById(featureId).children[0].click();\n"
        + "\t}\n"
        + "\n"
        + "\tfunction hideFeatureScenarios(featureId){\n"
        + "\t\tvar element = document.getElementById(featureId).parentNode;\n"
        + "\t\tfor (var i = 0; i < element.childNodes.length; i++) {\n"
        + "\t\tif (element.childNodes[i].className == \"sectionbody\") {\n"
        + "\t\t    var secChild = element.childNodes[i];\n"
        + "                     for (var j = 0; j < secChild.childNodes.length; j++) {\n"
        + "                             if(secChild.childNodes[j].className == \"sect2\" ||"
        + " secChild.childNodes[j].className == \"sectionbody\" ||"
        + " secChild.childNodes[j].className == \"sidebarblock\") {\n"
        + "\t      \t\t     secChild.childNodes[j].style.display = 'none';\n"
        + "\t\t\t }\n"
        + "\t\t\t}\n"
        + "                   }\t\n"
        + "     \n"
        + "\t\t}\n"
        + "\t   document.getElementById(featureId).children[0].click();\n"
        + " \t}</script>";
  }

  private void addSearchScript(Element contentElement) {
    String searchScripts =
        "<script type = \"text/javascript\" >\n"
            + "var allLevel2ListItems = null;\n"
            + "\n"
            + "function searchFeature(criteria) {\n"
            + "    if (criteria != null && criteria.length >= 3) {\n"
            + "        var sect2List = document.getElementsByClassName(\"sect2\");\n"
            + "        var firstMatch = null;\n"
            + "        if (sect2List != null) {\n"
            + "            for (var i = 0; i < sect2List.length; i++) {\n"
            + "                var h3 = null;\n"
            + "                for (var j = 0; j < sect2List[i].childNodes.length; j++) {\n"
            + "                    if (sect2List[i].childNodes[j].tagName &&"
            + " sect2List[i].childNodes[j].tagName.toUpperCase() == \"H3\") {\n"
            + "                        h3 = sect2List[i].childNodes[j];\n"
            + "                        break;\n"
            + "                    }\n"
            + "                }\n"
            + "                if (h3 != null && h3.id != null) {\n"
            + "                    if (h3.id.toLowerCase().replaceAll('-','"
            + " ').indexOf(criteria.toLowerCase()) == -1) {\n"
            + "                        sect2List[i].style.display = 'none';\n"
            + "                    } else {//match\n"
            + "                        sect2List[i].style.display = 'inline';\n"
            + "                        if (firstMatch == null) {\n"
            + "                            //used to scroll to after search\n"
            + "                            firstMatch = h3;\n"
            + "                        }\n"
            + "                        //filter toc\n"
            + "                        filterToc(criteria);\n"
            + "                    }\n"
            + "                }\n"
            + "            }//end for\n"
            + "\n"
            + "        }//sect2List != null\n"
            + "        if (firstMatch != null) {\n"
            + "            animate(document.body, \"scrollTop\", \"\", 0, firstMatch.offsetTop,"
            + " 200, true);\n"
            + "        }\n"
            + "\n"
            + "\n"
            + "    }//end criteria.length >=3\n"
            + "    else {//clear search\n"
            + "        clearSearch();\n"
            + "    }\n"
            + "}\n"
            + "\n"
            + "function clearSearch() {\n"
            + "    var sect2List = document.getElementsByClassName(\"sect2\");\n"
            + "    if (sect2List != null) {\n"
            + "        for (var i = 0; i < sect2List.length; i++) {\n"
            + "            sect2List[i].style.display = 'inline';\n"
            + "        }//end for\n"
            + "    }//end elements != null\n"
            + "\n"
            + "    if (allLevel2ListItems == null) {\n"
            + "        collectallLevel2IListItens();\n"
            + "    }\n"
            + "    for (var z = 0; z < allLevel2ListItems.length; z++) {\n"
            + "        allLevel2ListItems[z].style.display = 'inline';\n"
            + "    }\n"
            + "    if (document.getElementById('input-search')) {\n"
            + "        document.getElementById('input-search').value = 'Filter...';\n"
            + "    }\n"
            + "}\n"
            + "\n"
            + "function filterToc(criteria) {\n"
            + "    if (allLevel2ListItems == null) {\n"
            + "        collectallLevel2IListItens();\n"
            + "    }\n"
            + "    for (var z = 0; z < allLevel2ListItems.length; z++) {\n"
            + "        if (allLevel2ListItems[z].childNodes[0].tagName &&"
            + " allLevel2ListItems[z].childNodes[0].tagName.toLowerCase() == \"a\") {\n"
            + "            if"
            + " (allLevel2ListItems[z].childNodes[0].getAttribute(\"href\").toLowerCase().replaceAll('-','"
            + " ').substring(1).indexOf(criteria.toLowerCase()) !== -1) {\n"
            + "                allLevel2ListItems[z].style.display = 'inline';\n"
            + "            } else {\n"
            + "                allLevel2ListItems[z].style.display = 'none';\n"
            + "            }\n"
            + "        }\n"
            + "    }//end for allListItens\n"
            + "}\n"
            + "\n"
            + "function animate(elem, style, unit, from, to, time, prop) {\n"
            + "    if (!elem) return;\n"
            + "    var start = new Date().getTime(),\n"
            + "        timer = setInterval(function () {\n"
            + "            var step = Math.min(1, (new Date().getTime() - start) / time);\n"
            + "            if (prop) {\n"
            + "                elem[style] = (from + step * (to - from)) + unit;\n"
            + "            } else {\n"
            + "                elem.style[style] = (from + step * (to - from)) + unit;\n"
            + "            }\n"
            + "            if (step == 1) clearInterval(timer);\n"
            + "        }, 25);\n"
            + "    elem.style[style] = from + unit;\n"
            + "}\n"
            + "\n"
            + "function collectallLevel2IListItens() {\n"
            + "    allLevel2ListItems = new Array();\n"
            + "    var uls = document.getElementsByClassName('sectlevel2');\n"
            + "    for (var i = 0; i < uls.length; i++) {\n"
            + "        for (var j = 0; j < uls[i].childNodes.length; j++) {\n"
            + "            if (uls[i].childNodes[j].tagName) {\n"
            + "                if (uls[i].childNodes[j].tagName.toLowerCase() == 'li') {\n"
            + "                    allLevel2ListItems.push(uls[i].childNodes[j]);\n"
            + "                }\n"
            + "\n"
            + "            }\n"
            + "\n"
            + "\n"
            + "        } //end for uls child\n"
            + "    }//end for uls\n"
            + "\n"
            + "}\n"
            + "</script>";
    if (HIDE_FEATURES_SECTION) {
      searchScripts =
          searchScripts
              .replace("sectlevel2", "sectlevel1")
              .replace("sect2", "sect1")
              .replace("H3", "H2");
    }
    contentElement.after(searchScripts);
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorStyleExtension.java ----
package com.github.cukedoctor.extension;

import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.STYLE_DISABLE_EXT_KEY;

import com.github.cukedoctor.extension.util.FileUtil;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import org.apache.commons.io.IOUtils;
import org.asciidoctor.ast.Document;
import org.asciidoctor.extension.Postprocessor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Created by pestano on 20/07/15. extends html document styles */
public class CukedoctorStyleExtension extends Postprocessor {

  private static final Logger log = LoggerFactory.getLogger(CukedoctorStyleExtension.class);

  /** Base directory, either {@code target} or {@code bin} depending on the execution context. */
  public static final String BASE_DIR =
      Files.exists(Paths.get("target"))
          ? Paths.get("target").toString()
          : Files.exists(Paths.get("bin")) ? Paths.get("bin").toString() : Paths.get("").toString();

  /**
   * Customization directory, default or overloaded by customizing {@code
   * CUKEDOCTOR_CUSTOMIZATION_DIR}.
   */
  public static final String CUKEDOCTOR_CUSTOMIZATION_DIR =
      getProperty("CUKEDOCTOR_CUSTOMIZATION_DIR") == null
          ? BASE_DIR
          : getProperty("CUKEDOCTOR_CUSTOMIZATION_DIR");

  @Override
  public String process(Document document, String output) {
    if (document.isBasebackend("html")) {
      org.jsoup.nodes.Document doc = Jsoup.parse(output, "UTF-8");
      if (System.getProperty(STYLE_DISABLE_EXT_KEY) == null) {
        Element contentElement = doc.getElementById("footer");
        addFooterStyle(contentElement);
        addCukedoctorCss(doc);
      }
      return doc.html();
    } else {
      return output;
    }
  }

  private void addFooterStyle(Element contentElement) {
    String styleClass =
        " <style>  \n"
            + "\n"
            + "#content:padding:0!important;\n"
            + ".sidebarblock, .sectionbody, .content{\n"
            + "overflow:auto!important;\n"
            + "}\n"
            + "div.sidebarblock {overflow-y:hidden;overflow-x:auto}\n"
            + " body .exampleblock > .content{ background:#fff}";
    contentElement.after(styleClass);
  }

  private void addCukedoctorCss(org.jsoup.nodes.Document document) {
    List<String> files = FileUtil.findFiles(CUKEDOCTOR_CUSTOMIZATION_DIR, "cukedoctor.css", true);
    if (!files.isEmpty()) {
      String themePath = files.get(0);
      themePath = themePath.replace("\\", "/");
      try {
        String customCss = IOUtils.toString(new FileInputStream(themePath), StandardCharsets.UTF_8);
        Elements head = document.getElementsByTag("head");
        head.append(" <style> " + customCss + "</style>");
      } catch (IOException e) {
        log.error("Could not copy cukedoctor css from: {}", themePath, e);
      }
    }
  }

  private static String getProperty(String property) {
    if (System.getProperty(property) == null) {
      return null;
    }
    return System.getProperty(property);
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/CukedoctorThemeExtension.java ----
package com.github.cukedoctor.extension;

import static com.github.cukedoctor.extension.CukedoctorExtensionRegistry.THEME_DISABLE_EXT_KEY;

import com.github.cukedoctor.extension.util.FileUtil;
import java.io.File;
import org.asciidoctor.ast.Document;
import org.asciidoctor.extension.Postprocessor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;

/** Created by pestano on 20/07/15. adds search box to rendered html documentation */
public class CukedoctorThemeExtension extends Postprocessor {

  @Override
  public String process(Document document, String output) {
    if (document.isBasebackend("html") && System.getProperty(THEME_DISABLE_EXT_KEY) == null) {
      Object docDir = document.getAttributes().get("docdir");
      if (docDir != null && new File(docDir.toString()).exists()) {
        File themeDir = new File(docDir + "/themes/");
        boolean created;
        created = themeDir.mkdir();
        if (created) {
          FileUtil.copyFile("/themes/asciidoctor.css", docDir + "/themes/asciidoctor.css");
          FileUtil.copyFile("/themes/colony.css", docDir + "/themes/colony.css");
          FileUtil.copyFile("/themes/foundation.css", docDir + "/themes/foundation.css");
          FileUtil.copyFile("/themes/github.css", docDir + "/themes/github.css");
          FileUtil.copyFile("/themes/iconic.css", docDir + "/themes/iconic.css");
          FileUtil.copyFile("/themes/maker.css", docDir + "/themes/maker.css");
          FileUtil.copyFile("/themes/readthedocs.css", docDir + "/themes/readthedocs.css");
          FileUtil.copyFile("/themes/rocket-panda.css", docDir + "/themes/rocket-panda.css");
          FileUtil.copyFile("/themes/rubygems.css", docDir + "/themes/rubygems.css");
        }
      }

      org.jsoup.nodes.Document doc = Jsoup.parse(output, "UTF-8");
      Object tocPosition = document.getDocument().getAttributes().get("toc-position");
      boolean isTocRight = tocPosition != null && tocPosition.toString().equalsIgnoreCase("right");
      Element contentElement = doc.getElementsByAttributeValue("id", "header").get(0);
      contentElement.before(
          "<div name=\"themes\" id=\"themes\" style=\""
              + ""
              + (!isTocRight ? "float:right;" : "")
              + "width:150px;font-size:10px;position:relative;top:0;right:0px\"><b>Theme:&nbsp;</b>\n"
              + "<select style=\"width:100px;font-size:10px;\" name=\"select\""
              + " onchange=\"window.location.href ="
              + " window.location.href.substring(0,window.location.href.indexOf('?')) + '?theme='+"
              + " this.value\">\n"
              + "  <option value=\"asciidoctor\" selected>Asciidoctor</option> \n"
              + "  <option value=\"colony\">Colony</option>\n"
              + "  <option value=\"foundation\" >Foundation</option>\n"
              + "  <option value=\"github\">Github</option>\n"
              + "  <option value=\"iconic\">Iconic</option>\n"
              + "  <option value=\"maker\">Maker</option>\n"
              + "  <option value=\"rocket-panda\">Rocket Panda</option>\n"
              + "  <option value=\"readthedocs\">Read the Docs</option>\n"
              + "  <option value=\"rubygems\">Rubygems</option>\n"
              + "</select>\n"
              + "</div>");
      return doc.html();

    } else {
      return output;
    }
  }
}

// ---- cukedoctor-extension/src/main/java/com/github/cukedoctor/extension/util/FileUtil.java ----
package com.github.cukedoctor.extension.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Created by pestano on 02/06/15. */
public class FileUtil {

  private static final Logger log = LoggerFactory.getLogger(FileUtil.class);

  /** Pattern for Asciidoc files extension */
  public static final Pattern ADOC_FILE_EXTENSION =
      Pattern.compile("([^\\s]+(\\.(?i)(ad|adoc|asciidoc|asc))$)");

  /**
   * Saves a file into filesystem. Note that name can be saved as absolute (if it has a leading
   * slash) or relative to current path. EX: /target/name.adoc will save the file into
   *
   * @param name file name
   * @param data file content
   * @return saved file
   */
  public static File saveFile(String name, String data) {
    if (name == null) {
      name = "";
    }
    String fullyQualifiedName = name;

    // if filename is not absolute use current path as base dir
    if (!new File(fullyQualifiedName).isAbsolute()) {
      fullyQualifiedName = Paths.get("").toAbsolutePath() + "/" + name;
    }
    try {
      // create subdirs (if there any)
      if (fullyQualifiedName.contains("/")) {
        File f = new File(fullyQualifiedName.substring(0, fullyQualifiedName.lastIndexOf("/")));
        f.mkdirs();
      }
      File file = new File(fullyQualifiedName);
      file.createNewFile();
      FileUtils.write(file, data, "UTF-8");
      log.info("Wrote: {}", file.getAbsolutePath());
      return file;
    } catch (IOException e) {
      log.error("Could not create file {}", name, e);
      return null;
    }
  }

  /**
   * Gets a file from its path, either relative or absolute.
   *
   * @param path path of the file
   * @return the {@link File} to load.
   */
  public static File loadFile(String path) {
    if (path == null) {
      path = File.separator;
    }

    File f = new File(path);
    if (f.exists()) {
      return f.getAbsoluteFile();
    }

    if (!path.startsWith("/")) {
      path = File.separator + path;
    }
    return new File(Paths.get("").toAbsolutePath() + path.trim());
  }

  /**
   * Deletes a file from filesystem.
   *
   * @param path the path to delete
   * @return {@code true} or {@code false} depending on the outcome of the deletion
   */
  public static boolean removeFile(String path) {
    File fileToRemove = loadFile(path);
    try {
      Files.delete(fileToRemove.toPath());
      return true;
    } catch (IOException e) {
      log.error("could not delete path {}", path);
      return false;
    }
  }

  /**
   * Copy source file to dest file.
   *
   * @param source initial file
   * @param dest copied file
   * @return the dest file copied.
   */
  public static File copyFile(String source, String dest) {

    if (source != null && dest != null) {
      try (InputStream in = FileUtil.class.getResourceAsStream(source)) {
        return saveFile(dest, IOUtils.toString(in, StandardCharsets.UTF_8));
      } catch (IOException e) {
        log.error("Could not copy source file: {} to dest file: {}", dest, e);
      }
    }
    return null;
  }

  /**
   * List files with a given suffix. Search starts from startDir.
   *
   * @param startDir the directory to start searching files
   * @param suffix suffix to lookup in fies names
   * @return the list of files found.
   */
  public static List<String> findFiles(String startDir, final String suffix) {
    return findFiles(startDir, suffix, false);
  }

  /**
   * List files with a given suffix. Search starts from startDir. Leaves the option to stop
   * searching when a file has been found.
   *
   * @param startDir the directory to start searching files
   * @param suffix suffix to lookup in fies names
   * @param singleResult flag to determine if result is returned once a first file has been found.
   * @return the list of files found.
   */
  public static List<String> findFiles(
      String startDir, final String suffix, final boolean singleResult) {
    final List<String> absolutePaths = new ArrayList<>();
    if (startDir == null) {
      startDir = "";
    }

    Path startPath = Paths.get(startDir);

    if (!Files.exists(startPath) && startDir.startsWith("/")) {
      // try to find using relative paths
      startDir = startDir.substring(1);
      startPath = Paths.get(startDir);
    }

    if (!Files.exists(startPath)) {
      startPath = Paths.get("");
    }

    try {
      Files.walkFileTree(
          startPath,
          new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(final Path file, final BasicFileAttributes attrs)
                throws IOException {
              final String fileName = file.getFileName().toString();
              if (fileName.endsWith(suffix)) {
                absolutePaths.add(file.toAbsolutePath().toString());
                if (singleResult) {
                  return FileVisitResult.TERMINATE;
                }
              }
              if (attrs.isDirectory()) {
                return super.visitFile(file, attrs);
              } else {
                return FileVisitResult.SKIP_SUBTREE;
              }
            }
          });
    } catch (IOException e) {
      log.warn("Problems scanning {} files in path: {}", suffix, startDir, e);
    }
    return absolutePaths;
  }

  /**
   * @param source resource from classpath
   * @param dest dest path
   * @return copied file
   */
  public static File copyFileFromClassPath(String source, String dest) {
    if (source != null && dest != null) {
      try {
        InputStream in = FileUtil.class.getResourceAsStream(source);
        return saveFile(dest, IOUtils.toString(in, StandardCharsets.UTF_8));
      } catch (IOException e) {
        log.error("Could not copy source file: {} to dest file: {}", source, dest, e);
      }
    }
    return null;
  }

  /**
   * Parses content of a file into a string.
   *
   * @param target the file to parse
   * @return the content of the file.
   */
  public static String readFileContent(File target) {
    StringBuilder content = new StringBuilder();
    try (InputStream openStream = Files.newInputStream(target.toPath())) {
      try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(openStream))) {
        String line;
        while ((line = bufferedReader.readLine()) != null) {
          content.append(line);
        }
      } catch (Exception e) {
        log.warn("Could not read file content: {}", target);
      }
    } catch (Exception e) {
      log.warn("Could not read file content: {}", target);
    }

    return content.toString();
  }

  /**
   * Loads a test file from the {@code target/test-classes} directory.
   *
   * @param fileName the name of the file to load
   * @return the {@link File} instance.
   */
  public static File loadTestFile(String fileName) {
    return new File(Paths.get("").toAbsolutePath() + "/target/test-classes/" + fileName);
  }

  /**
   * Cleans content from spaces, new lines and tabulations.
   *
   * @param content the content to clean
   * @return the clean content.
   */
  public static String removeSpecialChars(String content) {
    return content.replace(" ", "").replace("\n", "").replace("\t", "");
  }
}

```
---
# PARAMETER TYPES
```java
// (no custom parameter types — use the built-ins: {int} {long} {float} {double} {word} {string} {biginteger} {bigdecimal} {})
```
---
# REGISTERED STEPS
```java
// 29 step bindings already registered — do NOT redefine any of these:
@Given("a Step has logged a string in Cucumber-JVM {double}.{int}")    // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has attached plain text as a string with a title in Cucumber-JVM {double}.{int}") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has attached plain text as a byte array with a title in Cucumber-JVM {double}.{int}") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has attached a string in CucumberJS {double}.{int}")    // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has attached plain text as a string in CucumberJS {double}.{int}") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has attached plain text as a buffer in CucumberJS {double}.{int}") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has logged a string and attached a plain text string with a title") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has three plain text attachments, two without a title") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("a Step has logged an image\\/png attachment")                  // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("I am hiding step timings")                                     // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Given("all Cukedoctor extensions are disabled")                       // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@When("I convert the Feature")                                         // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@Then("it will be rendered as")                                        // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java
@When("^I convert their json test output using cukedoctor converter$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/ConverterSteps.java
@Then("^I should have awesome living documentation$")                  // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/ConverterSteps.java
@When("^I convert docstring enriched json output activated with a step comment using cukedoctor converter$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/EnrichmentSteps.java
@When("^I convert enriched feature json output using cukedoctor$")     // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/EnrichmentSteps.java
@And("^The following asciidoc document is on your application classpath$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/IntroChapterSteps.java
@When("^Bdd tests results are converted into documentation by Cukedoctor$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/IntroChapterSteps.java
@Then("^Resulting documentation should have the provided introduction chapter$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/IntroChapterSteps.java
@When("^I convert them using default order$")                          // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java
@Then("^Features should be ordered by name in resulting documentation$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java
@When("^I convert them using comment order$")                          // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java
@Then("^Features should be ordered respecting order comment$")         // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java
@When("^I convert them using tag order$")                              // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java
@Then("^Features should be ordered respecting order tag$")             // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java
@When("^I render the feature$")                                        // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/TagRenderingSteps.java
@Then("^the tags displayed under each scenario should not have duplicates$") // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/TagRenderingSteps.java
@Then("Cukedoctor tags should not be rendered in documentation")       // cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/TagRenderingSteps.java
```
---
# EXISTING STEP DEFINITIONS (for call style — do not copy their coverage)
```java
// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/AttachmentSteps.java ----
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import com.github.cukedoctor.util.StringUtil;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

public class AttachmentSteps {
  private String renderedDocument;

  private String disableExtensions;
  private String hideStepTime;
  private URL featureFile;

  public AttachmentSteps() {}

  @Before
  public void before() {
    disableExtensions = System.getProperty("cukedoctor.disable-extensions");
    hideStepTime = System.getProperty("HIDE_STEP_TIME");
    renderedDocument = null;
    featureFile = null;
  }

  @After
  public void after() {
    // Assumed defaults across the test suite
    // There is no "after all" hook in Cucumber-JVM, so somewhat wastefully they go here
    resetProperty("cukedoctor.disable-extensions", disableExtensions);
    resetProperty("HIDE_STEP_TIME", hideStepTime);
  }

  private void resetProperty(String name, String value) {
    if (value == null) {
      System.clearProperty(name);
    } else {
      System.setProperty(name, value);
    }
  }

  @Given("a Step has logged a string in Cucumber-JVM {double}.{int}")
  public void a_Step_has_logged_a_string_in_Cucumber_JVM(Double double1, Integer int1) {
    featureFile =
        getFeatureUrl("/com/github/cukedoctor/json-output/cucumber-jvm-6-7-0-log-string.json");
  }

  @Given("a Step has attached plain text as a string with a title in Cucumber-JVM {double}.{int}")
  public void a_Step_has_attached_plain_text_as_a_string_with_a_title_in_Cucumber_JVM(
      Double double1, Integer int1) {
    featureFile =
        getFeatureUrl(
            "/com/github/cukedoctor/json-output/cucumber-jvm-6-7-0-attach-string-string-string.json");
  }

  @Given(
      "a Step has attached plain text as a byte array with a title in Cucumber-JVM {double}.{int}")
  public void a_Step_has_attached_plain_text_as_a_byte_array_with_a_title_in_Cucumber_JVM(
      Double double1, Integer int1) {
    featureFile =
        getFeatureUrl(
            "/com/github/cukedoctor/json-output/cucumber-jvm-6-7-0-attach-bytearray-string-string.json");
  }

  @Given("a Step has attached a string in CucumberJS {double}.{int}")
  public void a_Step_has_attached_a_string_in_CucumberJS(Double double1, Integer int1) {
    featureFile =
        getFeatureUrl("/com/github/cukedoctor/json-output/cucumber-js-6-0-5-attach-string.json");
  }

  @Given("a Step has attached plain text as a string in CucumberJS {double}.{int}")
  public void a_Step_has_attached_plain_text_as_a_string_in_CucumberJS(
      Double double1, Integer int1) {
    featureFile =
        getFeatureUrl(
            "/com/github/cukedoctor/json-output/cucumber-js-6-0-5-attach-string-string.json");
  }

  @Given("a Step has attached plain text as a buffer in CucumberJS {double}.{int}")
  public void a_Step_has_attached_plain_text_as_a_buffer_in_CucumberJS(
      Double double1, Integer int1) {
    featureFile =
        getFeatureUrl(
            "/com/github/cukedoctor/json-output/cucumber-js-6-0-5_attach-buffer-string.json");
  }

  @Given("a Step has logged a string and attached a plain text string with a title")
  public void a_Step_has_logged_a_string_and_attached_a_plain_text_string_with_a_title() {
    featureFile = getFeatureUrl("/com/github/cukedoctor/json-output/log-and-attach.json");
  }

  @Given("a Step has three plain text attachments, two without a title")
  public void a_Step_has_three_plain_text_attachments_two_without_a_title() {
    featureFile = getFeatureUrl("/com/github/cukedoctor/json-output/multiple-attachments.json");
  }

  @Given("a Step has logged an image\\/png attachment")
  public void a_Step_has_logged_an_image_png_attachment() {
    featureFile = getFeatureUrl("/com/github/cukedoctor/json-output/not-plain-text.json");
  }

  @Given("I am hiding step timings")
  public void i_am_hiding_step_timings() {
    System.setProperty("HIDE_STEP_TIME", "true");
  }

  @Given("all Cukedoctor extensions are disabled")
  public void all_cukedoctor_extensions_are_disabled() {
    System.setProperty("cukedoctor.disable-extensions", "true");
  }

  @When("I convert the Feature")
  public void i_convert_the_feature() {
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    assertThat(features).isNotNull().hasSize(1);
    renderedDocument = new CukedoctorFeatureRenderer().renderFeatures(features);
  }

  @Then("it will be rendered as")
  public void it_will_be_rendered_as(String expectedDocument) {
    assetDocumentEquals(expectedDocument);
  }

  public void assetDocumentEquals(String expectedDocument) {
    assertEquals(
        StringUtil.normaliseLineEndings(expectedDocument),
        StringUtil.normaliseLineEndings(renderedDocument));
  }

  private URL getFeatureUrl(String path) {
    URL featureFile = getClass().getResource(path);
    assertThat(featureFile).isNotNull();
    return featureFile;
  }
}

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/ConverterSteps.java ----
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.Cukedoctor;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.util.Constants;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

/** Created by pestano on 06/03/16. */
public class ConverterSteps {

  String documentation;

  @When("^I convert their json test output using cukedoctor converter$")
  public void I_convert_their_json_output_report_using_cukedoctor_converter(String docstring) {
    URL featureFile = getClass().getResource("/com/github/cukedoctor/json-output/simple.json");
    assertThat(featureFile).isNotNull();
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    assertThat(features).isNotNull().hasSize(2);
    documentation = Cukedoctor.instance(features).renderDocumentation();
  }

  @Then("^I should have awesome living documentation$")
  public void I_should_have_awesome_living_documentation(String expected) {
    // remove include cause its resolved by asciidoctor converter
    assertThat(
            documentation
                .replaceAll("\r", "")
                .replace(
                    "include::" + "" + Constants.home() + "cukedoctor-intro.adoc[leveloffset=+1]",
                    ""))
        .isEqualTo(expected.replaceAll("\r", ""));
  }
}

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/EnrichmentSteps.java ----
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.api.model.Feature;

import com.github.cukedoctor.parser.FeatureParser;

import com.github.cukedoctor.util.MetaCuke;
import io.cucumber.java.After;
import io.cucumber.java.Before;

import io.cucumber.java.en.When;
import java.io.IOException;
import java.net.URL;
import java.util.List;

/** Created by pestano on 11/03/16. */
public class EnrichmentSteps {
  private final MetaCuke metaCuke = new MetaCuke();

  public EnrichmentSteps() throws IOException {}

  @Before
  public void before() throws IOException {
    metaCuke.setUp();
  }

  @After
  public void after() throws IOException {
    metaCuke.tearDown();
  }

  @When(
      "^I convert docstring enriched json output activated with a step comment using cukedoctor"
          + " converter$")
  public void
      I_convert_docstring_enriched_json_output_activated_with_a_step_comment_using_cukedoctor_converter() {
    getFeatureFixture("/json-output/enrichment/table-and-source-step-comment.json");
  }

  @When("^I convert enriched feature json output using cukedoctor$")
  public void I_convert_enriched_feature_json_output_using_cukedoctor() {
    getFeatureFixture("/json-output/enrichment/calc.json");
  }

  private void getFeatureFixture(String fixturePath) {
    URL featureFile = getClass().getResource(fixturePath);
    assertThat(featureFile).isNotNull();
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    assertThat(features).isNotNull().hasSize(1);

  }
}

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/IntroChapterSteps.java ----
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.Cukedoctor;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.util.Constants;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

/** Created by pestano on 06/03/16. */
public class IntroChapterSteps {

  String documentation;

  String introChapterContent;

  @And("^The following asciidoc document is on your application classpath$")
  public void I_convert_their_json_output_report_using_cukedoctor_converter(String docstring) {
    introChapterContent = docstring;
    URL featureFile = getClass().getResource("/com/github/cukedoctor/json-output/simple.json");
    assertThat(featureFile).isNotNull();
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    assertThat(features).isNotNull().hasSize(2);
    documentation = Cukedoctor.instance(features).renderDocumentation();
  }

  @When("^Bdd tests results are converted into documentation by Cukedoctor$")
  public void Bdd_tests_results_are_converted_into_documentation_by_Cukedoctor() {}

  @Then("^Resulting documentation should have the provided introduction chapter$")
  public void I_should_have_awesome_living_documentation(String expected) {

    assertThat(
            documentation
                .replace(
                    "include::" + Constants.home() + "cukedoctor-intro.adoc[leveloffset=+1]",
                    // need to add a '=' because of leveloffset intro chapter have
                    introChapterContent.replace("= *Introduction*", "== *Introduction*"))
                .replaceAll("\r", ""))
        .isEqualTo(expected.replaceAll("\r", ""));
  }
}

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/OrderingSteps.java ----
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.Cukedoctor;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.builder.CukedoctorDocumentBuilderImpl;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;

import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

/** Created by pestano on 05/03/16. */
public class OrderingSteps {

  String documentation;

  @When("^I convert them using default order$")
  public void I_convert_the_using_default_order() {
    URL featureFile = getClass().getResource("/com/github/cukedoctor/json-output/non-ordered.json");
    assertThat(featureFile).isNotNull();
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    assertThat(features).isNotNull().hasSize(2);
    documentation =
        new CukedoctorFeatureRenderer((DocumentAttributes) null)
            .renderFeatures(features, new CukedoctorDocumentBuilderImpl().createNestedBuilder());
  }

  @Then("^Features should be ordered by name in resulting documentation$")
  public void Features_should_be_ordered_by_name_in_resulting_documentation(String expected) {
    assertThat(documentation.replaceAll("\r", ""))
        .isNotNull()
        .contains(expected.replaceAll("\r", ""));
  }

  @When("^I convert them using comment order$")
  public void I_convert_them__using_comment_order() {
    convert("/com/github/cukedoctor/json-output/ordered-comments.json");
  }

  @Then("^Features should be ordered respecting order comment$")
  public void Features_should_be_ordered_respecting_order_comment(String expected) {
    assertFeaturesShouldBeOrdered(expected);
  }

  @When("^I convert them using tag order$")
  public void I_convert_them__using_tag_order() {
    convert("/com/github/cukedoctor/json-output/ordered-tags.json");
  }

  @Then("^Features should be ordered respecting order tag$")
  public void Features_should_be_ordered_respecting_order_tag(String expected) {
    assertFeaturesShouldBeOrdered(expected);
  }

  private void convert(String featureFilePath) {
    URL featureFile = getClass().getResource(featureFilePath);
    assertThat(featureFile).isNotNull();
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    assertThat(features).isNotNull().hasSize(2);
    documentation = Cukedoctor.instance(features).renderDocumentation();
  }

  private void assertFeaturesShouldBeOrdered(String expected) {
    assertThat(documentation.replaceAll("\r", ""))
        .isNotNull()
        .contains(expected.replaceAll("\r", ""));
  }
}

// ---- cukedoctor-converter/src/test/java/com/github/cukedoctor/bdd/cukedoctor/TagRenderingSteps.java ----
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.builder.CukedoctorDocumentBuilderImpl;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

public class TagRenderingSteps {

  String documentation;

  @When("^I render the feature$")
  public void I_render_the_feature() {
    URL featureFile =
        getClass().getResource("/com/github/cukedoctor/json-output/tag-rendering.json");
    assertThat(featureFile).isNotNull();
    List<Feature> features = FeatureParser.parse(featureFile.getPath());
    documentation =
        new CukedoctorFeatureRenderer((DocumentAttributes) null)
            .renderFeatures(features, new CukedoctorDocumentBuilderImpl().createNestedBuilder());
  }

  @Then("^the tags displayed under each scenario should not have duplicates$")
  public void the_tags_displayed_under_each_scenario_should_not_have_duplicates(String expected) {
    assertThat(documentation.replaceAll("\r", ""))
        .isNotNull()
        .contains(expected.replaceAll("\r", ""));
  }

  @Then("Cukedoctor tags should not be rendered in documentation")
  public void Cukedoctor_tags_should_not_be_rendered_in_documentation(String expected) {
    assertThat(documentation.replaceAll("\r", ""))
        .isNotNull()
        .contains(expected.replaceAll("\r", ""));
  }
}

```
---
# SHARED CONTEXT  (how step classes get the driver, context and page objects)
```java
// Dependency injection: none declared
// Existing step classes take no injected collaborators (no-arg constructors).

// No shared context class was found. Fields of a step class are per-scenario and
// visible only to steps in that class.
```
---
# CONSTANTS
```java
// ===== PUBLIC SURFACE INDEX (auto-extracted; import by the package shown) =====
// cukedoctor-converter/src/main/java/com/github/cukedoctor/util/Constants.java   (package com.github.cukedoctor.util)
//   class Constants
//     - static Constants.SKIP_DOCS : String
//     - static Constants.BASE_DIR : String
//     - static Constants.STOP_WATCH : String
//     - static Constants.DISCRETE : String
//     - static Constants.DOCUMENT_TITLE : String
//     - static Constants#newLine() : String
//     - static Constants#home() : String
//     - static Constants#getProp(String property, Class<T> type) : T
//     - static Constants#getBooleanProperty(String property) : Boolean
//   public abstract static class Markup
//     - static Constants.Markup#bold(String value) : String
//     - static Constants.Markup#style(String style, String value) : String
//     - static Constants.Markup#h1(String value) : String
//     - static Constants.Markup#h2(String value) : String
//     - static Constants.Markup#h3(String value) : String
//     - static Constants.Markup#h4(String value) : String
//     - static Constants.Markup#table() : String
//     - static Constants.Markup#tableCol() : String
//     - static Constants.Markup#listing() : String
//     - static Constants.Markup#exampleBlock() : String
//   public abstract static class Attributes
//     - static Constants.Attributes#toc(String value) : String
//     - static Constants.Attributes#tocLevels(String value) : String
//     - static Constants.Attributes#icons(String value) : String
//     - static Constants.Attributes#numbered(boolean numbered) : String
//     - static Constants.Attributes#hardBreaks(boolean hardBreaks) : String
//     - static Constants.Attributes#linkcss(boolean linkcss) : String
//     - static Constants.Attributes#sectAnchors(boolean sectAnchors) : String
//     - static Constants.Attributes#sectLink(boolean sectLink) : String
//     - static Constants.Attributes#backend(String backend) : String
//     - static Constants.Attributes#revNumber(String revNumber) : String
//     - static Constants.Attributes#docTitle(String docTitle) : String
//     - static Constants.Attributes#docType(String docType) : String
//     - static Constants.Attributes#docInfo(boolean docInfo) : String
//     - static Constants.Attributes#sourceHighlighter(String sourceHighlighter) : String
//     - static Constants.Attributes#pdfStyle(String pdfStyle) : String
//     - static Constants.Attributes#versionLabel(String versionLabel) : String
//     - static Constants.Attributes#chapterLabel(String chapterLabel) : String
//     - static Constants.Attributes#stem(String stem) : String
//     - static Constants.Attributes#allowUriRead(boolean allowUriRead) : String
//     - static Constants.Attributes#dataUri(Boolean value) : String
//   public enum Name
//     - [package-private] Constants.Attributes.Name.name : String
//     - [package-private] new Constants.Attributes.Name(String name)
//     - Constants.Attributes.Name#getName() : String

// ---- cukedoctor-converter/src/main/java/com/github/cukedoctor/util/Constants.java ----
package com.github.cukedoctor.util;

import static com.github.cukedoctor.util.Constants.Attributes.Name.ALLOWURIREAD;
import static com.github.cukedoctor.util.Constants.Attributes.Name.BACKEND;
import static com.github.cukedoctor.util.Constants.Attributes.Name.CHAPTERLABEL;
import static com.github.cukedoctor.util.Constants.Attributes.Name.DATAURI;
import static com.github.cukedoctor.util.Constants.Attributes.Name.DOCINFO;
import static com.github.cukedoctor.util.Constants.Attributes.Name.DOCTITLE;
import static com.github.cukedoctor.util.Constants.Attributes.Name.DOCTYPE;
import static com.github.cukedoctor.util.Constants.Attributes.Name.HARDBREAKS;
import static com.github.cukedoctor.util.Constants.Attributes.Name.ICONS;
import static com.github.cukedoctor.util.Constants.Attributes.Name.LINKCSS;
import static com.github.cukedoctor.util.Constants.Attributes.Name.NUMBERED;
import static com.github.cukedoctor.util.Constants.Attributes.Name.PDFSTYLE;
import static com.github.cukedoctor.util.Constants.Attributes.Name.REVNUMBER;
import static com.github.cukedoctor.util.Constants.Attributes.Name.SECTANCHORS;
import static com.github.cukedoctor.util.Constants.Attributes.Name.SECTLINK;
import static com.github.cukedoctor.util.Constants.Attributes.Name.SOURCEHIGHLIGHTER;
import static com.github.cukedoctor.util.Constants.Attributes.Name.STEM;
import static com.github.cukedoctor.util.Constants.Attributes.Name.TOC;
import static com.github.cukedoctor.util.Constants.Attributes.Name.TOCLEVELS;
import static com.github.cukedoctor.util.Constants.Attributes.Name.VERSIONLABEL;
import static java.lang.System.getProperty;

import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Paths;

/** Created by pestano on 04/06/15. */
public abstract class Constants {
  private Constants() {}

  public static final String SKIP_DOCS = "@skipDocs";
  public static final String BASE_DIR =
      Files.exists(Paths.get("target"))
          ? Paths.get("target").toString()
          : Files.exists(Paths.get("bin")) ? Paths.get("bin").toString() : Paths.get("").toString();

  public static final String STOP_WATCH = "cukedoctor.stopwatch";

  public static final String DISCRETE = "[discrete]";

  public static final String DOCUMENT_TITLE =
      getProperty("DOCUMENT_TITLE") == null ? "Documentation" : getProperty("DOCUMENT_TITLE");

  public static String newLine() {
    return System.getProperty("line.separator");
  }

  public static String home() {
    var path = FileSystems.getDefault().getPath(".").toAbsolutePath();
    String homeDir = Thread.currentThread().getContextClassLoader().getResource("").getPath();
    if (!homeDir.endsWith("/")) {
      homeDir += "/";
    }

    if (isWindows() && homeDir.startsWith("/")) {
      homeDir = homeDir.substring(1);
    }

    return homeDir;
  }

  private static boolean isWindows() {
    return System.getProperty("os.name").toLowerCase().startsWith("windows");
  }

  public abstract static class Markup {

    private Markup() {}

    public static String bold(String value) {
      return "*" + value + "*";
    }

    public static String style(String style, String value) {
      return "[" + style + "]#" + value + "#";
    }

    public static String h1(String value) {
      return "= " + value;
    }

    public static String h2(String value) {
      return "== " + value;
    }

    public static String h3(String value) {
      return "=== " + value;
    }

    public static String h4(String value) {
      return "==== " + value;
    }

    public static String table() {
      return "|===";
    }

    public static String tableCol() {
      return "|";
    }

    public static String listing() {
      return "----";
    }

    public static String exampleBlock() {
      return "=====";
    }
  }

  public abstract static class Attributes {

    public enum Name {
      TOC("toc"),
      TOCLEVELS("toclevels"),
      ICONS("icons"),
      NUMBERED("numbered"),
      HARDBREAKS("hardbreaks"),
      LINKCSS("linkcss"),
      SECTANCHORS("sectanchors"),
      SECTLINK("sectlink"),
      BACKEND("backend"),
      REVNUMBER("revnumber"),
      DOCTITLE("doctitle"),
      DOCTYPE("doctype"),
      DOCINFO("docinfo"),
      SOURCEHIGHLIGHTER("source-highlighter"),
      PDFSTYLE("pdf-style"),
      VERSIONLABEL("version-label"),
      CHAPTERLABEL("chapter-label"),
      STEM("stem"),
      ALLOWURIREAD("allow-uri-read"),
      DATAURI("data-uri");

      final String name;

      Name(String name) {
        this.name = name;
      }

      public String getName() {
        return name;
      }
    }

    private static String toAdocAttr(String attrName, Object attrValue) {
      if (attrValue == null || "".equals(attrValue.toString().trim())) {
        return "";
      }
      StringBuilder adocAttr = new StringBuilder();
      adocAttr.append(":");
      if (Boolean.class.isAssignableFrom(attrValue.getClass())) {
        boolean bool = Boolean.parseBoolean(attrValue.toString());
        if (!bool) {
          adocAttr.append("!");
        }
        adocAttr.append(attrName).append(":");
      } else {
        adocAttr.append(attrName).append(":").append(" ").append(attrValue);
      }
      return adocAttr.toString();
    }

    public static String toc(String value) {
      return toAdocAttr(TOC.name, value);
    }

    public static String tocLevels(String value) {
      return toAdocAttr(TOCLEVELS.name, value);
    }

    public static String icons(String value) {
      return toAdocAttr(ICONS.name, value);
    }

    public static String numbered(boolean numbered) {
      return toAdocAttr(NUMBERED.name, numbered);
    }

    public static String hardBreaks(boolean hardBreaks) {
      return toAdocAttr(HARDBREAKS.name, hardBreaks);
    }

    public static String linkcss(boolean linkcss) {
      return toAdocAttr(LINKCSS.name, linkcss);
    }

    public static String sectAnchors(boolean sectAnchors) {
      return toAdocAttr(SECTANCHORS.name, sectAnchors);
    }

    public static String sectLink(boolean sectLink) {
      return toAdocAttr(SECTLINK.name, sectLink);
    }

    public static String backend(String backend) {
      return toAdocAttr(BACKEND.name, backend);
    }

    public static String revNumber(String revNumber) {
      return toAdocAttr(REVNUMBER.name, revNumber);
    }

    public static String docTitle(String docTitle) {
      return toAdocAttr(DOCTITLE.name, docTitle);
    }

    public static String docType(String docType) {
      return toAdocAttr(DOCTYPE.name, docType);
    }

    public static String docInfo(boolean docInfo) {
      return toAdocAttr(DOCINFO.name, docInfo);
    }

    public static String sourceHighlighter(String sourceHighlighter) {
      return toAdocAttr(SOURCEHIGHLIGHTER.name, sourceHighlighter);
    }

    public static String pdfStyle(String pdfStyle) {
      return toAdocAttr(PDFSTYLE.name, pdfStyle);
    }

    public static String versionLabel(String versionLabel) {
      return toAdocAttr(VERSIONLABEL.name, versionLabel);
    }

    public static String chapterLabel(String chapterLabel) {
      return toAdocAttr(CHAPTERLABEL.name, chapterLabel);
    }

    public static String stem(String stem) {
      return toAdocAttr(STEM.name, stem);
    }

    public static String allowUriRead(boolean allowUriRead) {
      return toAdocAttr(ALLOWURIREAD.name, allowUriRead);
    }

    public static String dataUri(Boolean value) {
      return toAdocAttr(DATAURI.name, value);
    }
  }

  public static <T> T getProp(String property, Class<T> type) {
    if (property == null) {
      return null;
    }
    return type.cast(getProperty(property));
  }

  public static Boolean getBooleanProperty(String property) {
    String value = getProperty(property);
    if (value == null) {
      return null;
    }
    return Boolean.valueOf(getProperty(property));
  }
}

// ---- cukedoctor-converter/src/main/resources/config/cukedoctor.yml ----  (data file named in test code)
layoutConfig:
  hideFeaturesSection: false
  hideSummarySection: false
  hideStepTime: false
  hideScenarioKeyword: false
  hideTags: false
  errorMessageLength: 500
documentAttributes:
  docTitle: "Living Documentation"
  backend: "html5"
  docType: "book"
  toc: "right"
  icons: "font"
  tocLevels: 3
  sectAnchors: true
  sectLink: true
  docInfo: true
  pdfStyle:
  sourceHighlighter: "highlightjs"
  hardBreaks: true
  chapterLabel: "Chapter"
  versionLabel: "Version"

// ---- cukedoctor-converter/src/main/resources/i18n/cukedoctor_en.properties ----  (data file named in test code)
title.features = Features
title.summary = Summary
title.scenario = Scenario

summary.steps = Steps
summary.total = Totals
summary.duration = Duration

#result
result.passed = Passed
result.failed = Failed
result.skipped = Skipped
result.pending = Pending
result.undefined= Undefined
result.missing = Missing

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/cucumber-js-6-0-5-attach-string-string.json ----  (data file named in test code)
[
  {
    "keyword": "Feature",
    "name": "Attachments",
    "line": 1,
    "id": "attachments",
    "tags": [],
    "uri": "features\\attachments.feature",
    "elements": [
      {
        "id": "attachments;cucumber-jvm-6.0.5-attach-string,-string",
        "keyword": "Scenario",
        "line": 3,
        "name": "Cucumber JS 6.0.5 attach String, String",
        "tags": [],
        "type": "scenario",
        "steps": [
          {
            "arguments": [],
            "keyword": "Given ",
            "line": 5,
            "name": "a Step that performs attach String, String",
            "match": {
              "location": "step-definitions\\attachments.ts:7"
            },
            "result": {
              "status": "passed",
              "duration": 2000000
            },
            "embeddings": [
              {
                "data": "She sells sea shells on the sea shore",
                "mime_type": "text/plain"
              }
            ]
          }
        ]
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/cucumber-js-6-0-5-attach-string.json ----  (data file named in test code)
[
  {
    "keyword": "Feature",
    "name": "Attachments",
    "line": 1,
    "id": "attachments",
    "tags": [],
    "uri": "features\\attachments.feature",
    "elements": [
      {
        "id": "attachments;cucumber-jvm-6.0.5-attach-string",
        "keyword": "Scenario",
        "line": 3,
        "name": "Cucumber JS 6.0.5 attach String",
        "tags": [],
        "type": "scenario",
        "steps": [
          {
            "arguments": [],
            "keyword": "Given ",
            "line": 5,
            "name": "a Step that performs attach String",
            "match": {
              "location": "step-definitions\\attachments.ts:3"
            },
            "result": {
              "status": "passed",
              "duration": 2000000
            },
            "embeddings": [
              {
                "data": "She sells sea shells on the sea shore",
                "mime_type": "text/plain"
              }
            ]
          }
        ]
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/cucumber-js-6-0-5_attach-buffer-string.json ----  (data file named in test code)
[
  {
    "keyword": "Feature",
    "name": "Attachments",
    "line": 1,
    "id": "attachments",
    "tags": [],
    "uri": "features\\attachments.feature",
    "elements": [
      {
        "id": "attachments;cucumber-jvm-6.0.5-attach-buffer,-string",
        "keyword": "Scenario",
        "line": 3,
        "name": "Cucumber JS 6.0.5 attach Buffer, String",
        "tags": [],
        "type": "scenario",
        "steps": [
          {
            "arguments": [],
            "keyword": "Given ",
            "line": 5,
            "name": "a Step that performs attach Buffer, String",
            "match": {
              "location": "step-definitions\\attachments.ts:11"
            },
            "result": {
              "status": "passed",
              "duration": 1000000
            },
            "embeddings": [
              {
                "data": "U2hlIHNlbGxzIHNlYSBzaGVsbHMgb24gdGhlIHNlYSBzaG9yZQ==",
                "mime_type": "text/plain"
              }
            ]
          }
        ]
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/cucumber-jvm-6-7-0-attach-bytearray-string-string.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "start_timestamp": "2020-09-28T13:39:09.469Z",
        "before": [
          {
            "result": {
              "duration": 4000000,
              "status": "passed"
            },
            "match": {
              "location": "org.example.StepDefinitions.before(io.cucumber.java.Scenario)"
            }
          }
        ],
        "line": 3,
        "name": "Cucumber JVM 6.7.0 scenario.attach(ByteArray, String, String)",
        "description": "",
        "id": "attachments;cucumber-jvm-6.7.0-scenario.attach(bytearray--string--string)",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "embeddings": [
              {
                "data": "U2hlIHNlbGxzIHNlYSBzaGVsbHMgb24gdGhlIHNlYSBzaG9yZQ\u003d\u003d",
                "mime_type": "text/plain",
                "name": "Byte[] plain text"
              }
            ],
            "result": {
              "duration": 5000000,
              "status": "passed"
            },
            "line": 5,
            "name": "a Step that performs scenario.attach(ByteArray, String, String)",
            "match": {
              "location": "org.example.StepDefinitions.attach_byte_array_string_string()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Attachments",
    "description": "",
    "id": "attachments",
    "keyword": "Feature",
    "uri": "classpath:org/example/Test.feature",
    "tags": []
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/cucumber-jvm-6-7-0-attach-string-string-string.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "start_timestamp": "2020-09-28T13:36:46.433Z",
        "before": [
          {
            "result": {
              "duration": 2000000,
              "status": "passed"
            },
            "match": {
              "location": "org.example.StepDefinitions.before(io.cucumber.java.Scenario)"
            }
          }
        ],
        "line": 3,
        "name": "Cucumber JVM 6.7.0 scenario.attach(String, String, String)",
        "description": "",
        "id": "attachments;cucumber-jvm-6.7.0-scenario.attach(string--string--string)",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "embeddings": [
              {
                "data": "U2hlIHNlbGxzIHNlYSBzaGVsbHMgb24gdGhlIHNlYSBzaG9yZQ\u003d\u003d",
                "mime_type": "text/plain",
                "name": "String plain text"
              }
            ],
            "result": {
              "duration": 4000000,
              "status": "passed"
            },
            "line": 5,
            "name": "a Step that performs scenario.attach(String, String, String)",
            "match": {
              "location": "org.example.StepDefinitions.attach_string_string_string()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Attachments",
    "description": "",
    "id": "attachments",
    "keyword": "Feature",
    "uri": "classpath:org/example/Test.feature",
    "tags": []
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/cucumber-jvm-6-7-0-log-string.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "start_timestamp": "2020-09-28T13:41:17.991Z",
        "before": [
          {
            "result": {
              "duration": 4000000,
              "status": "passed"
            },
            "match": {
              "location": "org.example.StepDefinitions.before(io.cucumber.java.Scenario)"
            }
          }
        ],
        "line": 3,
        "name": "Cucumber JVM 6.7.0 scenario.log(String)",
        "description": "",
        "id": "attachments;cucumber-jvm-6.7.0-scenario.log(bytearray)",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "output": [
              "She sells sea shells on the sea shore"
            ],
            "result": {
              "duration": 5000000,
              "status": "passed"
            },
            "line": 5,
            "name": "a Step that performs scenario.log(String)",
            "match": {
              "location": "org.example.StepDefinitions.log_string()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Attachments",
    "description": "",
    "id": "attachments",
    "keyword": "Feature",
    "uri": "classpath:org/example/Test.feature",
    "tags": []
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/log-and-attach.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "start_timestamp": "2020-09-28T13:41:17.991Z",
        "before": [
          {
            "result": {
              "duration": 4000000,
              "status": "passed"
            },
            "match": {
              "location": "org.example.StepDefinitions.before(io.cucumber.java.Scenario)"
            }
          }
        ],
        "line": 3,
        "name": "Log and attach",
        "description": "",
        "id": "attachments;cucumber-jvm-6.7.0-scenario.log(bytearray)",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "embeddings": [
              {
                "data": "U2hlIHNlbGxzIHNlYSBzaGVsbHMgb24gdGhlIHNlYSBzaG9yZQ\u003d\u003d",
                "mime_type": "text/plain",
                "name": "String plain text"
              }
            ],
            "output": [
              "Peter Piper picked a peck of pickled peppers"
            ],
            "result": {
              "duration": 5000000,
              "status": "passed"
            },
            "line": 5,
            "name": "a Step that logs and attaches",
            "match": {
              "location": "org.example.StepDefinitions.log_string()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Attachments",
    "description": "",
    "id": "attachments",
    "keyword": "Feature",
    "uri": "classpath:org/example/Test.feature",
    "tags": []
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/multiple-attachments.json ----  (data file named in test code)
[
  {
    "keyword": "Feature",
    "name": "Attachments",
    "line": 1,
    "id": "attachments",
    "tags": [],
    "uri": "features\\attachments.feature",
    "elements": [
      {
        "id": "attachments;cucumber-jvm-6.0.5-attach-string,-string",
        "keyword": "Scenario",
        "line": 3,
        "name": "Multiple attachments",
        "tags": [],
        "type": "scenario",
        "steps": [
          {
            "arguments": [],
            "keyword": "Given ",
            "line": 5,
            "name": "a Step that has multiple attachments",
            "match": {
              "location": "step-definitions\\attachments.ts:7"
            },
            "result": {
              "status": "passed",
              "duration": 2000000
            },
            "embeddings": [
              {
                "data": "First attachment",
                "mime_type": "text/plain"
              },
              {
                "data": "U2Vjb25kIEF0dGFjaG1lbnQ\u003d",
                "mime_type": "text/plain",
                "name": "Second"
              },
              {
                "data": "Third attachment",
                "mime_type": "text/plain"
              }
            ]
          }
        ]
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/non-ordered.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "line": 3,
        "name": "Scenario feature 1",
        "description": "",
        "id": "feature1;scenario-feature-1",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 647746576,
              "status": "passed"
            },
            "line": 5,
            "name": "scenario step",
            "match": {
              "location": "SimpleSteps.scenario_step()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Feature1",
    "description": "",
    "id": "feature1",
    "keyword": "Feature",
    "uri": "com/github/cukedoctor/bdd/sample/simple1.feature"
  },
  {
    "line": 1,
    "elements": [
      {
        "line": 3,
        "name": "Scenario feature 2",
        "description": "",
        "id": "feature2;scenario-feature-2",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 58615,
              "status": "passed"
            },
            "line": 5,
            "name": "scenario step",
            "match": {
              "location": "SimpleSteps.scenario_step()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Feature2",
    "description": "",
    "id": "feature2",
    "keyword": "Feature",
    "uri": "com/github/cukedoctor/bdd/sample/simple2.feature"
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/not-plain-text.json ----  (data file named in test code)
[
  {
    "keyword": "Feature",
    "name": "Attachments",
    "line": 1,
    "id": "attachments",
    "tags": [],
    "uri": "features\\attachments.feature",
    "elements": [
      {
        "id": "attachments;cucumber-jvm-6.0.5-attach-string",
        "keyword": "Scenario",
        "line": 3,
        "name": "Attaching an image",
        "tags": [],
        "type": "scenario",
        "steps": [
          {
            "arguments": [],
            "keyword": "Given ",
            "line": 5,
            "name": "a Step that attaches an image",
            "match": {
              "location": "step-definitions\\attachments.ts:3"
            },
            "result": {
              "status": "passed",
              "duration": 2000000
            },
            "embeddings": [
              {
                "data": "U2hlIHNlbGxzIHNlYSBzaGVsbHMgb24gdGhlIHNlYSBzaG9yZQ==",
                "mime_type": "image/png"
              }
            ]
          }
        ]
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/ordered-comments.json ----  (data file named in test code)
[
  {
    "comments": [
      {
        "line": 1,
        "value": "# order: 2"
      }
    ],
    "line": 2,
    "elements": [
      {
        "line": 4,
        "name": "Scenario feature 1",
        "description": "",
        "id": "feature1;scenario-feature-1",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 313437628,
              "status": "passed"
            },
            "line": 6,
            "name": "scenario step",
            "match": {
              "location": "SimpleSteps.scenario_step()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Feature1",
    "description": "",
    "id": "feature1",
    "keyword": "Feature",
    "uri": "com/github/cukedoctor/bdd/sample/simple1.feature"
  },
  {
    "comments": [
      {
        "line": 1,
        "value": "# order: 1"
      }
    ],
    "line": 2,
    "elements": [
      {
        "line": 4,
        "name": "Scenario feature 2",
        "description": "",
        "id": "feature2;scenario-feature-2",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 58498,
              "status": "passed"
            },
            "line": 6,
            "name": "scenario step",
            "match": {
              "location": "SimpleSteps.scenario_step()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Feature2",
    "description": "",
    "id": "feature2",
    "keyword": "Feature",
    "uri": "com/github/cukedoctor/bdd/sample/simple2.feature"
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/ordered-tags.json ----  (data file named in test code)
[
  {
    "line": 2,
    "elements": [
      {
        "start_timestamp": "2020-04-17T15:02:48.477Z",
        "line": 4,
        "name": "Scenario feature 1",
        "description": "",
        "id": "feature1;scenario-feature-1",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 1998800,
              "status": "passed"
            },
            "line": 6,
            "name": "scenario step",
            "match": {
              "location": "org.example.StepDefinitions.scenarioStep()"
            },
            "keyword": "Given "
          }
        ],
        "tags": [
          {
            "name": "@order-2"
          }
        ]
      }
    ],
    "name": "Feature1",
    "description": "",
    "id": "feature1",
    "keyword": "Feature",
    "uri": "classpath:org/example/1.feature",
    "tags": [
      {
        "name": "@order-2",
        "type": "Tag",
        "location": {
          "line": 1,
          "column": 1
        }
      }
    ]
  },
  {
    "line": 2,
    "elements": [
      {
        "start_timestamp": "2020-04-17T15:02:48.583Z",
        "line": 4,
        "name": "Scenario feature 2",
        "description": "",
        "id": "feature2;scenario-feature-2",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "status": "passed"
            },
            "line": 6,
            "name": "scenario step",
            "match": {
              "location": "org.example.StepDefinitions.scenarioStep()"
            },
            "keyword": "Given "
          }
        ],
        "tags": [
          {
            "name": "@order-1"
          }
        ]
      }
    ],
    "name": "Feature2",
    "description": "",
    "id": "feature2",
    "keyword": "Feature",
    "uri": "classpath:org/example/2.feature",
    "tags": [
      {
        "name": "@order-1",
        "type": "Tag",
        "location": {
          "line": 1,
          "column": 1
        }
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/simple.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "line": 3,
        "name": "Scenario feature 1",
        "description": "",
        "id": "feature1;scenario-feature-1",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 647746576,
              "status": "passed"
            },
            "line": 5,
            "name": "scenario step",
            "match": {
              "location": "SimpleSteps.scenario_step()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Feature1",
    "description": "",
    "id": "feature1",
    "keyword": "Feature",
    "uri": "com/github/cukedoctor/bdd/sample/simple1.feature"
  },
  {
    "line": 1,
    "elements": [
      {
        "line": 3,
        "name": "Scenario feature 2",
        "description": "",
        "id": "feature2;scenario-feature-2",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 58615,
              "status": "passed"
            },
            "line": 5,
            "name": "scenario step",
            "match": {
              "location": "SimpleSteps.scenario_step()"
            },
            "keyword": "Given "
          }
        ]
      }
    ],
    "name": "Feature2",
    "description": "",
    "id": "feature2",
    "keyword": "Feature",
    "uri": "com/github/cukedoctor/bdd/sample/simple2.feature"
  }
]

// ---- cukedoctor-converter/src/test/resources/com/github/cukedoctor/json-output/tag-rendering.json ----  (data file named in test code)
[
  {
    "line": 2,
    "elements": [
      {
        "start_timestamp": "2020-04-18T06:52:50.150Z",
        "line": 5,
        "name": "Scenario feature 1",
        "description": "",
        "id": "feature1;scenario-feature-1",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 1998200,
              "status": "passed"
            },
            "line": 7,
            "name": "scenario step",
            "match": {
              "location": "org.example.StepDefinitions.scenarioStep()"
            },
            "keyword": "Given "
          }
        ],
        "tags": [
          {
            "name": "@someTag"
          },
          {
            "name": "@otherTag"
          }
        ]
      },
      {
        "start_timestamp": "2020-04-18T06:52:50.366Z",
        "line": 10,
        "name": "Scenario feature 2",
        "description": "",
        "id": "feature1;scenario-feature-2",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "status": "passed"
            },
            "line": 12,
            "name": "scenario step",
            "match": {
              "location": "org.example.StepDefinitions.scenarioStep()"
            },
            "keyword": "Given "
          }
        ],
        "tags": [
          {
            "name": "@someTag"
          },
          {
            "name": "@someTag"
          },
          {
            "name": "@otherTag"
          }
        ]
      }
    ],
    "name": "Feature1",
    "description": "",
    "id": "feature1",
    "keyword": "Feature",
    "uri": "classpath:org/example/1.feature",
    "tags": [
      {
        "name": "@someTag",
        "type": "Tag",
        "location": {
          "line": 1,
          "column": 1
        }
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/json-output/enrichment/calc.json ----  (data file named in test code)
[
  {
    "id": "calculator",
    "description": "",
    "name": "Calculator",
    "keyword": "Feature",
    "line": 1,
    "elements": [
      {
        "id": "calculator;adding-numbers",
        "description": "You can use *asciidoc markup* in _feature_ #description#.\r\n\r\nNOTE: This is a very important feature!",
        "name": "Adding numbers",
        "keyword": "Scenario",
        "line": 3,
        "steps": [
          {
            "result": {
              "duration": 114654615,
              "status": "passed"
            },
            "name": "I have numbers 1 and 2",
            "keyword": "Given ",
            "line": 9,
            "match": {
              "arguments": [
                {
                  "val": "1",
                  "offset": 15
                },
                {
                  "val": "2",
                  "offset": 21
                }
              ],
              "location": "CalcStepDef.I_have_number_x_and_y(int,int)"
            },
            "comments": [
              {
                "value": "#{IMPORTANT: Asciidoc markup inside *steps* must be surrounded by *curly brackets*.}",
                "line": 8
              }
            ]
          },
          {
            "result": {
              "duration": 17640,
              "status": "passed"
            },
            "name": "I sum the numbers",
            "keyword": "When ",
            "line": 13,
            "match": {
              "location": "CalcStepDef.I_sum_the_number()"
            },
            "comments": [
              {
                "value": "# {NOTE: Steps comments are placed *before* each steps so this comment is for the *WHEN* step.}",
                "line": 11
              }
            ]
          },
          {
            "result": {
              "duration": 1369185,
              "status": "passed"
            },
            "name": "I should have 3 as result",
            "keyword": "Then ",
            "line": 18,
            "match": {
              "arguments": [
                {
                  "val": "3",
                  "offset": 14
                }
              ],
              "location": "CalcStepDef.I_should_have_result(int)"
            },
            "comments": [
              {
                "value": "# {* this is a list of itens inside a feature step}",
                "line": 15
              },
              {
                "value": "# {* there is no multiline comment in gherkin}",
                "line": 16
              },
              {
                "value": "# {** second level list item}",
                "line": 17
              }
            ]
          }
        ],
        "type": "scenario"
      }
    ],
    "uri": "src/test/resources/features/calc.feature"
  }
]

// ---- cukedoctor-converter/src/test/resources/json-output/enrichment/table-and-source-content-type.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "start_timestamp": "2020-04-18T11:57:01.454Z",
        "line": 3,
        "name": "Render source code",
        "description": "",
        "id": "enrich-feature;render-source-code",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 2002900,
              "status": "passed"
            },
            "line": 5,
            "name": "the following source code in docstrings",
            "match": {
              "location": "org.example.StepDefinitions.theFollowingSourceCodeInDocstrings(java.lang.String)"
            },
            "keyword": "Given ",
            "doc_string": {
              "content_type": "asciidoc",
              "line": 6,
              "value": "[source, java]\n-----\npublic int sum(int x, int y){\n    int result \u003d x + y;\n    return result; (1)\n}\n-----\n\u003c1\u003e We can have callouts in living documentation"
            }
          }
        ]
      },
      {
        "start_timestamp": "2020-04-18T11:57:01.581Z",
        "line": 17,
        "name": "Render table",
        "description": "",
        "id": "enrich-feature;render-table",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "status": "passed"
            },
            "line": 19,
            "name": "the following table",
            "match": {
              "location": "org.example.StepDefinitions.theFollowingTable(java.lang.String)"
            },
            "keyword": "Given ",
            "doc_string": {
              "content_type": "asciidoc",
              "line": 20,
              "value": "|\u003d\u003d\u003d\n\n| Cell in column 1, row 1 | Cell in column 2, row 1\n| Cell in column 1, row 2 | Cell in column 2, row 2\n| Cell in column 1, row 3 | Cell in column 2, row 3\n\n|\u003d\u003d\u003d"
            }
          }
        ]
      }
    ],
    "name": "Discrete class feature",
    "description": "",
    "id": "discrete-class-feature",
    "keyword": "Feature",
    "uri": "classpath:org/example/content-type.feature",
    "tags": []
  }
]

// ---- cukedoctor-converter/src/test/resources/json-output/enrichment/table-and-source-feature-tag.json ----  (data file named in test code)
[
  {
    "line": 2,
    "elements": [
      {
        "start_timestamp": "2020-04-18T12:03:33.906Z",
        "line": 4,
        "name": "Render source code",
        "description": "",
        "id": "enrich-feature;render-source-code",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 11993400,
              "status": "passed"
            },
            "line": 6,
            "name": "the following source code in docstrings",
            "match": {
              "location": "org.example.StepDefinitions.theFollowingSourceCodeInDocstrings(java.lang.String)"
            },
            "keyword": "Given ",
            "doc_string": {
              "line": 7,
              "value": "[source, java]\n-----\npublic int sum(int x, int y){\n    int result \u003d x + y;\n    return result; (1)\n}\n-----\n\u003c1\u003e We can have callouts in living documentation"
            }
          }
        ],
        "tags": [
          {
            "name": "@asciidoc"
          }
        ]
      },
      {
        "start_timestamp": "2020-04-18T12:03:34.152Z",
        "line": 18,
        "name": "Render table",
        "description": "",
        "id": "enrich-feature;render-table",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 998900,
              "status": "passed"
            },
            "line": 20,
            "name": "the following table",
            "match": {
              "location": "org.example.StepDefinitions.theFollowingTable(java.lang.String)"
            },
            "keyword": "Given ",
            "doc_string": {
              "line": 21,
              "value": "|\u003d\u003d\u003d\n\n| Cell in column 1, row 1 | Cell in column 2, row 1\n| Cell in column 1, row 2 | Cell in column 2, row 2\n| Cell in column 1, row 3 | Cell in column 2, row 3\n\n|\u003d\u003d\u003d"
            }
          }
        ],
        "tags": [
          {
            "name": "@asciidoc"
          }
        ]
      }
    ],
    "name": "Discrete class feature",
    "description": "",
    "id": "discrete-class-feature",
    "keyword": "Feature",
    "uri": "classpath:org/example/feature-tag.feature",
    "tags": [
      {
        "name": "@asciidoc",
        "type": "Tag",
        "location": {
          "line": 1,
          "column": 1
        }
      }
    ]
  }
]

// ---- cukedoctor-converter/src/test/resources/json-output/enrichment/table-and-source-scenario-tag.json ----  (data file named in test code)
[
  {
    "line": 1,
    "elements": [
      {
        "start_timestamp": "2020-04-18T12:06:16.747Z",
        "line": 4,
        "name": "Render source code",
        "description": "",
        "id": "enrich-feature;render-source-code",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "duration": 2998400,
              "status": "passed"
            },
            "line": 6,
            "name": "the following source code in docstrings",
            "match": {
              "location": "org.example.StepDefinitions.theFollowingSourceCodeInDocstrings(java.lang.String)"
            },
            "keyword": "Given ",
            "doc_string": {
              "line": 7,
              "value": "[source, java]\n-----\npublic int sum(int x, int y){\n    int result \u003d x + y;\n    return result; (1)\n}\n-----\n\u003c1\u003e We can have callouts in living documentation"
            }
          }
        ],
        "tags": [
          {
            "name": "@asciidoc"
          }
        ]
      },
      {
        "start_timestamp": "2020-04-18T12:06:16.879Z",
        "line": 19,
        "name": "Render table",
        "description": "",
        "id": "enrich-feature;render-table",
        "type": "scenario",
        "keyword": "Scenario",
        "steps": [
          {
            "result": {
              "status": "passed"
            },
            "line": 21,
            "name": "the following table",
            "match": {
              "location": "org.example.StepDefinitions.theFollowingTable(java.lang.String)"
            },
            "keyword": "Given ",
            "doc_string": {
              "line": 22,
              "value": "|\u003d\u003d\u003d\n\n| Cell in column 1, row 1 | Cell in column 2, row 1\n| Cell in column 1, row 2 | Cell in column 2, row 2\n| Cell in column 1, row 3 | Cell in column 2, row 3\n\n|\u003d\u003d\u003d"
            }
          }
        ],
        "tags": [
          {
            "name": "@asciidoc"
          }
        ]
      }
    ],
    "name": "Discrete class feature",
    "description": "",
    "id": "discrete-class-feature",
    "keyword": "Feature",
    "uri": "classpath:org/example/scenario-tag.feature",
    "tags": []
  }
]

// ---- cukedoctor-converter/src/test/resources/json-output/enrichment/table-and-source-step-comment.json ----  (data file named in test code)
[
  {
    "id": "discrete-class-feature",
    "description": "",
    "name": "Discrete class feature",
    "keyword": "Feature",
    "line": 1,
    "elements": [
      {
        "id": "discrete-class-feature;render-source-code",
        "description": "",
        "name": "Render source code",
        "keyword": "Scenario",
        "line": 3,
        "steps": [
          {
            "result": {
              "duration": 267743605,
              "status": "passed"
            },
            "name": "the following source code in docstrings",
            "keyword": "Given ",
            "line": 6,
            "doc_string": {
              "value": "[source, java]\r\n-----\r\npublic int sum(int x, int y){\r\n    int result \u003d x + y;\r\n    return result; \u003c1\u003e\r\n}\r\n-----\r\n\u003c1\u003e We can have callouts in living documentation\u003e",
              "line": 7,
              "content_type": ""
            },
            "match": {
              "location": "DiscreteSteps.the_following_source_code(String)"
            },
            "comments": [
              {
                "value": "# cukedoctor-discrete",
                "line": 5
              }
            ]
          }
        ],
        "type": "scenario"
      },
      {
        "id": "discrete-class-feature;render-table",
        "description": "",
        "name": "Render table",
        "keyword": "Scenario",
        "line": 18,
        "steps": [
          {
            "result": {
              "duration": 57731,
              "status": "passed"
            },
            "name": "the following table",
            "keyword": "Given ",
            "line": 21,
            "doc_string": {
              "value": "|\u003d\u003d\u003d\r\n\r\n| Cell in column 1, row 1 | Cell in column 2, row 1\r\n| Cell in column 1, row 2 | Cell in column 2, row 2\r\n| Cell in column 1, row 3 | Cell in column 2, row 3\r\n\r\n|\u003d\u003d\u003d",
              "line": 22,
              "content_type": ""
            },
            "match": {
              "location": "DiscreteSteps.the_following_table(String)"
            },
            "comments": [
              {
                "value": "# cukedoctor-discrete",
                "line": 20
              }
            ]
          }
        ],
        "type": "scenario"
      }
    ],
    "uri": "com/github/cukedoctor/bdd/sample/discrete.feature"
  }
]

// ---- cukedoctor-extension/src/main/resources/cukedoctor-extension.properties ----  (data file named in test code)
cukedoctor.version=${project.version}

```
---
# TASK — write the missing step definitions for this Gherkin feature
```gherkin
@order-2
Feature: Enrich features
  ====
  [quote]
  ____
  In order to have awesome _living documentation_
  As a bdd developer
  I want to render asciidoc markup inside my features.
  ____
  ====

  https://asciidoctor.org/docs/what-is-asciidoc/[Asciidoc^] markup can be used in feature *DocStrings*. To do so you can enable it by using *@asciidoc* tag at `feature` or `scenario` level.

  [IMPORTANT]
  =====
  Adding @asciidoc tag at *feature level* will make cukedoctor interpret `all features docstrings` as Asciidoc markup.

  Adding @asciidoc at *scenario level* will make cukedoctor interpret `all steps docstrings` as asciidoc markup.

  TIP: To enable asciidoc markup in a *single step* you can use `asciidoc` as https://relishapp.com/cucumber/cucumber/docs/gherkin/doc-strings#docstring-with-interesting-content-type[docstring content type^].
  =====

  NOTE: Feature and scenario descriptions are automatically interpreted as Asciidoc markup without the need for adding the feature tag.


  Scenario: DocString enrichment activated by the content type
  Asciidoc markup can be used in feature *DocStrings*. To do so you can enable it by using the content type *[asciidoc]* in the DocString.

    Given The following two features:
"""
Feature: Discrete class feature

  Scenario: Render source code

    Given the following source code in docstrings
\"\"\"asciidoc
  [source, java]
  -----
  public int sum(int x, int y){
  int result = x + y;
  return result; (1)
  }
  -----
  <1> We can have callouts in living documentation
\"\"\"

  Scenario: Render table

    Given the following table
 \"\"\"asciidoc
  |===

  | Cell in column 1, row 1 | Cell in column 2, row 1
  | Cell in column 1, row 2 | Cell in column 2, row 2
  | Cell in column 1, row 3 | Cell in column 2, row 3

  |===
\"\"\"
"""

    When I convert enriched docstring with asciidoc content type using cukedoctor converter

    Then DocString asciidoc output must be rendered in my documentation
"""asciidoc
== *Features*

[[Discrete-class-feature, Discrete class feature]]
=== *Discrete class feature*

==== Scenario: Render source code

==========
Given ::
the following source code in docstrings icon:thumbs-up[role="green",title="Passed"] [small right]#(002ms)#
******

[discrete]
[source, java]
-----
public int sum(int x, int y){
    int result = x + y;
    return result; (1)
}
-----
[discrete]
<1> We can have callouts in living documentation


******
==========

==== Scenario: Render table

==========
Given ::
the following table icon:thumbs-up[role="green",title="Passed"] [small right]#(000ms)#
******

[discrete]
|===
| Cell in column 1, row 1 | Cell in column 2, row 1
| Cell in column 1, row 2 | Cell in column 2, row 2
| Cell in column 1, row 3 | Cell in column 2, row 3
|===


******
==========


"""

  Scenario: DocString enrichment activated by a feature tag
  Asciidoc markup can be used in feature *DocStrings*. You can enable this by applying the tag [@asciidoc] to the feature. Note this enables the enrichment for all DocStrings within the feature.

    Given The following two features:
"""
@asciidoc
Feature: Discrete class feature

  Scenario: Render source code

    Given the following source code in docstrings
\"\"\"
  [source, java]
  -----
  public int sum(int x, int y){
  int result = x + y;
  return result; (1)
  }
  -----
  <1> We can have callouts in living documentation
\"\"\"

  Scenario: Render table

    Given the following table
 \"\"\"
  |===

  | Cell in column 1, row 1 | Cell in column 2, row 1
  | Cell in column 1, row 2 | Cell in column 2, row 2
  | Cell in column 1, row 3 | Cell in column 2, row 3

  |===
\"\"\"
"""

    When I convert enriched docstring with asciidoc feature tag using cukedoctor converter

    Then DocString asciidoc output must be rendered in my documentation
"""asciidoc
== *Features*

[[Discrete-class-feature, Discrete class feature]]
=== *Discrete class feature*

==== Scenario: Render source code

==========
Given ::
the following source code in docstrings icon:thumbs-up[role="green",title="Passed"] [small right]#(011ms)#
******

[discrete]
[source, java]
-----
public int sum(int x, int y){
    int result = x + y;
    return result; (1)
}
-----
[discrete]
<1> We can have callouts in living documentation


******
==========

==== Scenario: Render table

==========
Given ::
the following table icon:thumbs-up[role="green",title="Passed"] [small right]#(000ms)#
******

[discrete]
|===
| Cell in column 1, row 1 | Cell in column 2, row 1
| Cell in column 1, row 2 | Cell in column 2, row 2
| Cell in column 1, row 3 | Cell in column 2, row 3
|===


******
==========


"""

  Scenario: DocString enrichment activated by a scenario tag
  Asciidoc markup can be used in feature *DocStrings*. You can enable this by applying the tag [@asciidoc] to the scenario. Note this enables the enrichment for all DocStrings within the scenario.

    Given The following two features:
"""
Feature: Discrete class feature

  @asciidoc
  Scenario: Render source code

    Given the following source code in docstrings
\"\"\"
  [source, java]
  -----
  public int sum(int x, int y){
  int result = x + y;
  return result; (1)
  }
  -----
  <1> We can have callouts in living documentation
\"\"\"

  @asciidoc
  Scenario: Render table

    Given the following table
 \"\"\"
  |===

  | Cell in column 1, row 1 | Cell in column 2, row 1
  | Cell in column 1, row 2 | Cell in column 2, row 2
  | Cell in column 1, row 3 | Cell in column 2, row 3

  |===
\"\"\"
"""

    When I convert enriched docstring with asciidoc scenario tag using cukedoctor converter


    Then DocString asciidoc output must be rendered in my documentation
"""asciidoc
== *Features*

[[Discrete-class-feature, Discrete class feature]]
=== *Discrete class feature*

==== Scenario: Render source code

==========
Given ::
the following source code in docstrings icon:thumbs-up[role="green",title="Passed"] [small right]#(002ms)#
******

[discrete]
[source, java]
-----
public int sum(int x, int y){
    int result = x + y;
    return result; (1)
}
-----
[discrete]
<1> We can have callouts in living documentation


******
==========

==== Scenario: Render table

==========
Given ::
the following table icon:thumbs-up[role="green",title="Passed"] [small right]#(000ms)#
******

[discrete]
|===
| Cell in column 1, row 1 | Cell in column 2, row 1
| Cell in column 1, row 2 | Cell in column 2, row 2
| Cell in column 1, row 3 | Cell in column 2, row 3
|===


******
==========


"""


    Scenario: Whitespace in descriptions
      Features and Scenarios can have multi-line descriptions. In a feature file, these may be indented.
      Cukedoctor uses the indentation of the first line non-blank line of the description to determine the difference
      between the indentation _of_ the description in a feature file and your desired indentation _within_ the the
      description itself.

    Given the feature:
"""
  Feature: Feature One


    This is the description for Feature One. The first non-blank line of this description in the feature file began with four whitespace characters.
      Therefore, cukedoctor will ignore up to the first four
whitespace characters
  in all other lines in the same description,
    if any are present.


This includes
  further lines
    in a different
      paragraph
        in the same description.



    Scenario: Scenario One

    This is the description for Scenario One. The first non-blank line of this description in the feature file began with four whitespace characters.
      Therefore, cukedoctor will ignore up to the first four
whitespace characters
  in all other lines in the same description,
    if any are present.


This includes
  further lines
    in a different
      paragraph
        in the same description.



    Scenario: Scenario Two
This scenario has no indentation. You don't have to use it, after all.
      Indentation in subsequent lines is therefore fully preserved.

"""
  When I convert it
  Then it should be rendered in AsciiDoc as
"""asciidoc
== *Features*

[[Feature-One, Feature One]]
=== *Feature One*

****
This is the description for Feature One. The first non-blank line of this description in the feature file began with four whitespace characters.
  Therefore, cukedoctor will ignore up to the first four
whitespace characters
in all other lines in the same description,
if any are present.


This includes
further lines
in a different
  paragraph
    in the same description.
****

==== Scenario: Scenario One
This is the description for Scenario One. The first non-blank line of this description in the feature file began with four whitespace characters.
  Therefore, cukedoctor will ignore up to the first four
whitespace characters
in all other lines in the same description,
if any are present.


This includes
further lines
in a different
  paragraph
    in the same description.

==== Scenario: Scenario Two
This scenario has no indentation. You don't have to use it, after all.
      Indentation in subsequent lines is therefore fully preserved.

"""
```
