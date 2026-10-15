```java
package com.github.cukedoctor.sectionlayout.bdd;

import com.github.cukedoctor.Cukedoctor;
import com.github.cukedoctor.api.CukedoctorDocumentBuilder;
import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.config.CukedoctorConfig;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.sectionlayout.SectionFeatureRenderer;
import com.github.cukedoctor.util.MetaCuke;
import com.github.cukedoctor.util.StringUtil;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

import static org.junit.Assert.assertEquals;

public class SectionStepDefs {
    private final MetaCuke metaCuke = new MetaCuke();
    private final File introDirectory;
    private String renderedDocument;

    public SectionStepDefs() throws IOException {
        introDirectory = Files.createTempDirectory("Intro").toFile();
        introDirectory.deleteOnExit();
    }

    @Given("I have the Feature")
    public void i_have_the_feature(String featureText) {
        metaCuke.addFeature(featureText);
    }

    @Given("I am hiding step timings")
    public void i_am_hiding_step_timings() {
        System.setProperty("HIDE_STEP_TIMINGS", "true");
    }

    @Given("all Cukedoctor extensions are disabled")
    public void all_cukedoctor_extensions_are_disabled() {
        System.setProperty("cukedoctor.disable.extensions", "true");
    }

    @When("I convert the Feature")
    public void i_convert_the_feature() {
        runCucumber();
        List<Feature> features = parseFeatures();
        runCukedoctor(features);
    }

    @Then("it will be rendered as")
    public void it_will_be_rendered_as(String expectedDocument) {
        assertDocumentEquals(expectedDocument);
    }

    @Then("they will be rendered as")
    public void they_will_be_rendered_as(String expectedDocument) {
        assertDocumentEquals(expectedDocument);
    }

    private void runCucumber() {
        metaCuke.runCucumber(SectionStepDefs.class);
    }

    private List<Feature> parseFeatures() {
        return FeatureParser.parse(metaCuke.getReport().getAbsolutePath());
    }

    private void runCukedoctor(List<Feature> features) {
        CukedoctorConfig config = getConfig();
        renderedDocument = Cukedoctor.instance(features, new DocumentAttributes(), config).renderDocumentation();
    }

    private CukedoctorConfig getConfig() {
        return new CukedoctorConfig()
                .setHideSummarySection(true)
                .setIntroChapterDir(introDirectory.getAbsolutePath())
                .setIntroChapterRelativePath(introDirectory.getAbsolutePath());
    }

    private void assertDocumentEquals(String expectedDocument) {
        assertEquals(
                StringUtil.normaliseLineEndings(expectedDocument),
                StringUtil.normaliseLineEndings(renderedDocument));
    }
}
```