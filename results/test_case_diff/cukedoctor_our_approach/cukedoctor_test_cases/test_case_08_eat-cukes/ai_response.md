```java
package com.github.cukedoctor.example;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class CukeEatingSteps {

    private final Belly belly = new Belly();

    @Given("I have {int} cukes")
    public void i_have_cukes(int cukes) {
        belly.setCukes(cukes);
    }

    @When("I eat {int} cukes")
    public void i_eat_cukes(int cukes) {
        belly.setCukes(belly.getCukes() - cukes);
    }

    @Then("Am I hungry? {string}")
    public void am_i_hungry(String hungry) {
        boolean expectedHungry = Boolean.parseBoolean(hungry);
        assert belly.isHungry() == expectedHungry;
    }
}
```