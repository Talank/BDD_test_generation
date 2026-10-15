```java
package com.github.cukedoctor.sectionlayout.bdd;

import com.github.cukedoctor.Cukedoctor;
import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.sectionlayout.bdd.inception.InceptionStepDefs;
import com.github.cukedoctor.util.MetaCuke;
import com.github.cukedoctor.util.StringUtil;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.After;
import org.junit.Before;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

import static org.junit.Assert.assertEquals;

public class IntegrationStepDefs {
    private final MetaCuke metaCuke = new MetaCuke();
    private final File introDirectory;
    private String renderedDocument;
    private boolean hideScenarioKeyword;

    public IntegrationStepDefs() throws IOException {
        introDirectory = Files.createTempDirectory("Intro").toFile();
        introDirectory.deleteOnExit();
    }

    @Before
    public void before() throws IOException {
        metaCuke.setUp();
        renderedDocument = null;
    }

    @After
    public void after() throws IOException {
        metaCuke.tearDown();
    }

    @Given("I have the Feature {string}")
    public void i_have_the_feature(String featureText) throws IOException {
        metaCuke.addFeature(featureText);
    }

    @Given("I am showing the Features Section")
    public void i_am_showing_the_features_section() {
        System.clearProperty("HIDE_FEATURES_SECTION");
    }

    @Given("I am hiding step timings")
    public void i_am_hiding_step_timings() {
        System.setProperty("HIDE_STEP_TIME", "true");
    }

    @Given("all Cukedoctor extensions are disabled")
    public void all_cukedoctor_extensions_are_disabled() {
        System.setProperty("cukedoctor.disable-extensions", "true");
    }

    @Given("I have disabled the scenario keyword")
    public void i_have_disabled_the_scenario_keyword() {
        hideScenarioKeyword = true;
    }

    @When("I run Cukedoctor")
    public void i_run_cukedoctor() {
        runCucumber();
        List<Feature> features = parseFeatures();
        renderFeatures(features);
    }

    @Then("they will be rendered as")
    public void they_will_be_rendered_as(String expectedDocument) {
        assetDocumentEquals(expectedDocument);
    }

    private void runCucumber() {
        metaCuke.runCucumber(InceptionStepDefs.class);
    }

    public void assetDocumentEquals(String expectedDocument) {
        assertEquals(
                StringUtil.normaliseLineEndings(expectedDocument),
                StringUtil.normaliseLineEndings(renderedDocument));
    }

    public List<Feature> parseFeatures() {
        return FeatureParser.parse(metaCuke.getReport().getAbsolutePath());
    }

    public void renderFeatures(List<Feature> features) {
        renderedDocument =
                Cukedoctor.instance(features, new DocumentAttributes(), getConfig()).renderDocumentation();
    }

    private CukedoctorConfig getConfig() {
        return new CukedoctorConfig()
                .setHideSummarySection(true)
                .setIntroChapterDir(introDirectory.getAbsolutePath())
                .setIntroChapterRelativePath(introDirectory.getAbsolutePath())
                .setHideScenarioKeyword(hideScenarioKeyword);
    }
}
```