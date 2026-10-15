```java
package com.github.cukedoctor.bdd;

import com.github.cukedoctor.api.model.Feature;
import com.github.cukedoctor.parser.FeatureParser;
import com.github.cukedoctor.util.FileUtil;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class CukedoctorMainSteps {

    private String outputFilePath;
    private String jsonPath;
    private String title;
    private String generatedContent;

    @Given("A Cucumber json execution file is are already generated")
    public void a_cucumber_json_execution_file_is_are_already_generated() {
        // Assuming the file is already generated in the specified path
        jsonPath = "target/test-classes/json-output/one_passing_one_failing.json";
    }

    @When("I execute CukedoctorMain with args {string} {string} and {string}")
    public void i_execute_cukedoctor_main_with_args(String outputArg, String pathArg, String titleArg) {
        outputFilePath = outputArg.split(" ")[1]; // Extracting the output file name
        jsonPath = pathArg.split(" ")[1]; // Extracting the path to the json file
        title = titleArg.split(" ")[1]; // Extracting the title

        // Execute CukedoctorMain
        CukedoctorMain main = new CukedoctorMain();
        main.execute(new String[]{
                "-o", outputFilePath,
                "-p", jsonPath,
                "-t", title
        });

        // Read the generated content
        generatedContent = FileUtil.readFileContent(new File(outputFilePath));
    }

    @Then("A file named {string} should be generated with the following content:")
    public void a_file_named_should_be_generated_with_the_following_content(String expectedFileName, String expectedContent) throws Exception {
        // Check if the file exists
        File generatedFile = new File(outputFilePath);
        Assert.assertTrue("File should be generated", generatedFile.exists());

        // Read the content of the generated file
        String actualContent = new String(Files.readAllBytes(Paths.get(generatedFile.getPath())));

        // Compare the actual content with the expected content
        Assert.assertEquals("Content should match", expectedContent.trim(), actualContent.trim());
    }

    @Given("Cucumber multiple json execution files are already generate")
    public void cucumber_multiple_json_execution_files_are_already_generate() {
        // Assuming multiple files are already generated in the specified path
        jsonPath = "target/test-classes/json-output/";
    }

    @When("I execute CukedoctorMain with args {string} {string} and {string}")
    public void i_execute_cukedoctor_main_with_args_multiple_files(String outputArg, String pathArg, String titleArg) {
        outputFilePath = outputArg.split(" ")[1]; // Extracting the output file name
        jsonPath = pathArg.split(" ")[1]; // Extracting the path to the json files
        title = titleArg.split(" ")[1]; // Extracting the title

        // Execute CukedoctorMain
        CukedoctorMain main = new CukedoctorMain();
        main.execute(new String[]{
                "-o", outputFilePath,
                "-p", jsonPath,
                "-t", title
        });

        // Read the generated content
        generatedContent = FileUtil.readFileContent(new File(outputFilePath));
    }

    @Then("A file named {string} should be generated with the following content:")
    public void a_file_named_should_be_generated_with_the_following_content_multiple_files(String expectedFileName, String expectedContent) throws Exception {
        // Check if the file exists
        File generatedFile = new File(outputFilePath);
        Assert.assertTrue("File should be generated", generatedFile.exists());

        // Read the content of the generated file
        String actualContent = new String(Files.readAllBytes(Paths.get(generatedFile.getPath())));

        // Compare the actual content with the expected content
        Assert.assertEquals("Content should match", expectedContent.trim(), actualContent.trim());
    }
}
```