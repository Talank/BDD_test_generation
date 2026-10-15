```java
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.api.DocumentAttributes;
import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.builder.CukedoctorDocumentBuilderImpl;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import com.github.cukedoctor.util.MetaCuke;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.net.URL;
import java.util.List;

public class CukedoctorConverterSteps {
    private final MetaCuke metaCuke = new MetaCuke();
    private String documentation;

    public CukedoctorConverterSteps() throws Exception {}

    @Given("The following two features:")
    public void the_following_two_features(String featureText) throws Throwable {
        assertThat(featureText).isNotNull();
        metaCuke.addFeature(featureText);
    }

    @When("I convert their json test output using cukedoctor converter")
    public void i_convert_their_json_test_output_using_cukedoctor_converter() {
        metaCuke.runCucumber("com.github.cukedoctor.bdd.cukedoctor");
        List<Feature> features = FeatureParser.parse(metaCuke.getReport().getAbsolutePath());
        documentation =
                new CukedoctorFeatureRenderer((DocumentAttributes) null)
                        .renderFeatures(features, new CukedoctorDocumentBuilderImpl().createNestedBuilder());
    }

    @Then("I should have awesome living documentation")
    public void i_should_have_awesome_living_documentation(String expected) {
        assertThat(documentation.replaceAll("\r", "")).contains(expected.replaceAll("\r", ""));
    }
}
```