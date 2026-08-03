export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ManualResponseRequired extends Error {
  constructor({ requestFile, responseFile, attempt }) {
    super(`Manual LLM response required for attempt ${attempt}.`);
    this.name = 'ManualResponseRequired';
    this.requestFile = requestFile;
    this.responseFile = responseFile;
    this.attempt = attempt;
  }
}
