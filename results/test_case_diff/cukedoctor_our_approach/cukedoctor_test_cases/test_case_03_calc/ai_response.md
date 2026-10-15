```java
package com.github.cukedoctor.bdd.cukedoctor;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.renderer.CukedoctorFeatureRenderer;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.net.URL;
import java.util.List;

public class CalculatorSteps {
    private int number1;
    private int number2;
    private int result;
    private String documentation;

    @Given("I have numbers {int} and {int}")
    public void I_have_numbers(int num1, int num2) {
        this.number1 = num1;
        this.number2 = num2;
    }

    @When("I sum the numbers")
    public void I_sum_the_numbers() {
        this.result = number1 + number2;
    }

    @Then("I should have {int} as result")
    public void I_should_have_as_result(int expectedResult) {
        assertThat(result).isEqualTo(expectedResult);
    }

    @Given("I have numbers {int} and {int}")
    public void I_have_numbers_for_subtraction(int num1, int num2) {
        this.number1 = num1;
        this.number2 = num2;
    }

    @When("I subtract the numbers")
    public void I_subtract_the_numbers() {
        this.result = number1 - number2;
    }
}
```