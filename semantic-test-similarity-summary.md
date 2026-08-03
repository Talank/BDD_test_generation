# Research Summary: Semantic Similarity in Test Cases

Here's my findings on how we can improve the checking of semantic similarity between two test cases rather that just asking a LLM:

## 1. Dynamic Execution
* **Differential Code Coverage:** Runs both tests independently and checks if they hit the exact same backend lines/branches of application code. C8 is a tool that can help with this in nodejs. We can also try mutation analysis here.
* **Trade-off:** **High accuracy**, but execution is slow and need to first properly setup the environment of each repo we are experimenting on.

## 2. Static Code Analysis
* **AST Normalization:** Parses executable code into Abstract Syntax Trees, strips variable names/comments, and compares tree structures.
* **Trade-off:** **Fast, don't need to setup** but misses identical behavior written using different selectors or functions which completely defeats our purpose.

## 3. Run a voting round from LLMs
* **Jury board:** Instead of having the answer from one LLM, run it with a bunch of LLMs until we have a majority of first-to-ahead-by-k.
* **Trade-off:** **More reliablity behind the final answer** but the probablistic nature of the LLM still remains, no determinism is introduced.
---
