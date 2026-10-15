```java
package com.github.cukedoctor.example.bdd;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.cucumber.datatable.DataTable;

public class CalculatorSteps {

    @Given("I have numbers {int} and {int}")
    public void i_have_numbers(int num1, int num2, String docString) {
        // UNMAPPED: Given I have numbers 1 and 2
    }

    @When("I sum the numbers")
    public void i_sum_the_numbers(String listItems) {
        // UNMAPPED: When I sum the numbers
    }

    @Then("I should have {int} as result")
    public void i_should_have_as_result(int result) {
        // UNMAPPED: Then I should have 3 as result
    }

    @Given("I have numbers {int} and {int}")
    public void i_have_numbers_subtract(int num1, int num2) {
        // UNMAPPED: Given I have numbers 2 and 1
    }

    @When("I subtract the numbers")
    public void i_subtract_the_numbers() {
        // UNMAPPED: When I subtract the numbers
    }

    @Then("I should have {int} as result")
    public void i_should_have_as_result_subtract(int result) {
        // UNMAPPED: Then I should have 1 as result
    }
}
```