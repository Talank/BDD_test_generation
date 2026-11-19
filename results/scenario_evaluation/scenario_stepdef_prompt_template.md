Fix this Gherkin scenario so it matches its step definitions. Keep the original intent.

Compare each step with its step-definition code, and fix the problems that may include the following:

1. Wrong keyword: use Given for setup, When for the action, Then for the check.
2. Hidden actions: if the code does more than the step says (extra clicks,
   submit, waits), show it in the step text or add steps.
3. Hidden checks in Given/When: if setup or action code also asserts
   something, move that check into its own Then step.
4. Vague Then: say exactly what the code checks. Every Then must be
   observable.
5. Hidden counts: if the code checks an exact number ("exactly once",
   "exactly 3"), put it in the step.
6. Dependence on another scenario or file: merge the scenarios or add the
   missing setup steps so this one runs on its own.




Return only the revised scenario.

Original scenario:
{{scenario}}

Developer written step-definitions:
{{step_definitions}}