```java
package com.github.cukedoctor.multipage.bdd;

import com.github.cukedoctor.util.MetaCuke;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class MultipageLayoutSteps {

    private final MetaCuke metaCuke = new MetaCuke();
    private String outputFolder;

    public MultipageLayoutSteps() throws IOException {}

    @Given("the output folder is set to {string}")
    public void theOutputFolderIsSetTo(String folder) {
        this.outputFolder = folder;
    }

    @When("I run the cukedoctor-multipage-layout plugin")
    public void iRunTheCukedoctorMultipageLayoutPlugin() {
        // Assuming the MetaCuke class has a method to set the output folder
        // and run the Cukedoctor multipage layout plugin
        // This is a placeholder for the actual implementation
        // metaCuke.runCucumber(MultipageLayoutSteps.class);
    }

    @Then("I have the following files generated")
    public void iHaveTheFollowingFilesGenerated(DataTable dataTable) {
        List<String> expectedFiles = dataTable.asList();
        for (String fileName : expectedFiles) {
            File file = new File(outputFolder, fileName);
            assert Files.exists(file.toPath()) : "Expected file not found: " + file.getAbsolutePath();
        }
    }

    @Given("I set the :toc: {string} attribute")
    public void iSetTheTocAttribute(String tocValue) {
        // Assuming there's a way to set attributes in the context
        // This is a placeholder for the actual implementation
        // metaCuke.setTocAttribute(tocValue);
    }

    @Then("the generated pages have the \":toc:\" meta property set")
    public void theGeneratedPagesHaveTheTocMetaPropertySet() {
        // Assuming there's a way to verify the toc attribute in the generated pages
        // This is a placeholder for the actual implementation
        // assert tocAttributeIsSetInGeneratedPages();
    }
}
```