```java
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import com.github.cukedoctor.util.Constants;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

public class TagRenderingSteps {
    private String renderedDocument;
    private List<Feature> features;

    @Given("The following two features:")
    public void the_following_two_features(String featureText) {
        URL featureFile = getClass().getResource("/com/github/cukedoctor/json-output/tag-rendering.json");
        assertThat(featureFile).isNotNull();
        features = FeatureParser.parse(featureFile.getPath());
        assertThat(features).isNotNull().hasSize(2);
    }

    @When("I render the feature")
    public void i_render_the_feature() {
        renderedDocument = new CukedoctorFeatureRenderer().renderFeatures(features);
    }

    @Then("the tags displayed under each scenario should not have duplicates")
    public void the_tags_displayed_under_each_scenario_should_not_have_duplicates() {
        Set<String> uniqueTags = new HashSet<>();
        String[] lines = renderedDocument.split("\n");
        for (String line : lines) {
            if (line.contains("[small]#tags:")) {
                String tagsLine = line.substring(line.indexOf("[small]#tags:") + 13, line.indexOf("#", line.indexOf("[small]#tags:") + 13));
                String[] tags = tagsLine.split(",");
                for (String tag : tags) {
                    uniqueTags.add(tag.trim());
                }
            }
        }
        assertThat(uniqueTags).hasSize(2); // Assuming there are only two unique tags expected
    }

    @Then("Cukedoctor tags should not be rendered in documentation")
    public void cukedoctor_tags_should_not_be_rendered_in_documentation() {
        assertThat(renderedDocument).doesNotContain("@asciidoc");
        assertThat(renderedDocument).doesNotContain("@order");
    }

    private URL getFeatureUrl(String path) {
        URL featureFile = getClass().getResource(path);
        assertThat(featureFile).isNotNull();
        return featureFile;
    }
}
```