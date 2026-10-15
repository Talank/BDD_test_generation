```java
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import com.github.cukedoctor.util.MetaCuke;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

public class OrderingSteps {

    String documentation;

    private final MetaCuke metaCuke = new MetaCuke();

    public OrderingSteps() throws Exception {}

    @Given("The following two features:")
    public void the_following_two_features(String featureText) throws Throwable {
        URL featureFile = getClass().getResource("/com/github/cukedoctor/json-output/non-ordered.json");
        assertThat(featureFile).isNotNull();
        List<Feature> features = FeatureParser.parse(featureFile.getPath());
        assertThat(features).isNotNull().hasSize(2);
        documentation = new CukedoctorFeatureRenderer().renderFeatures(features);
    }

    @When("I convert them using default order")
    public void i_convert_them_using_default_order() {
        // Assuming the features are already set up in the previous step
        // The conversion is done in the previous step, so nothing to do here
    }

    @Then("Features should be ordered by name in resulting documentation")
    public void features_should_be_ordered_by_name_in_resulting_documentation(String expected) {
        assertThat(documentation.replaceAll("\r", "")).isEqualTo(expected.replaceAll("\r", ""));
    }

    @Given("The following two features:")
    public void the_following_two_features_with_order(String featureText) throws Throwable {
        URL featureFile = getClass().getResource("/com/github/cukedoctor/json-output/ordered-tags.json");
        assertThat(featureFile).isNotNull();
        List<Feature> features = FeatureParser.parse(featureFile.getPath());
        assertThat(features).isNotNull().hasSize(2);
        documentation = new CukedoctorFeatureRenderer().renderFeatures(features);
    }

    @When("I convert them using tag order")
    public void i_convert_them_using_tag_order() {
        // Assuming the features are already set up in the previous step
        // The conversion is done in the previous step, so nothing to do here
    }

    @Then("Features should be ordered respecting order tag")
    public void features_should_be_ordered_respecting_order_tag(String expected) {
        assertThat(documentation.replaceAll("\r", "")).isEqualTo(expected.replaceAll("\r", ""));
    }
}
```