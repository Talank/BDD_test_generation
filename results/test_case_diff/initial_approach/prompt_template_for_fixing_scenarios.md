You are fixing a Gherkin scenario that is inadequate or ambiguous for
automated code generation.

Goal: revise the scenario so a code generator could implement it without
guessing, while preserving the original intent.

Check for and fix:

-   Missing preconditions or implicit state (what must exist before the
    scenario runs)
-   Vague actions (who does what, with which inputs)
-   Unverifiable outcomes ("Then it works", "the user is happy"). Make
    every Then observable and checkable.
-   Missing or placeholder test data (use concrete values or Examples
    tables)
-   Ambiguous terms or inconsistent naming of the same thing
-   Steps that combine multiple actions or assertions

Rules:

-   Make minimal changes. Do not add new features or behavior beyond
    what the scenario implies.
-   If you must assume something to fill a gap, state it explicitly as
    an assumption.
-   If a gap cannot be resolved without domain knowledge, flag it
    instead of inventing an answer.

Return only the Revised scenario

Original scenario:

Developer written step-definitions:
