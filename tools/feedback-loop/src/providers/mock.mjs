export class MockProvider {
  constructor(options = {}) {
    this.responses = options.responses ?? [];
  }

  async generate({ attempt }) {
    const response = this.responses[attempt - 1];
    if (response == null) throw new Error(`No mock response configured for attempt ${attempt}.`);
    return response;
  }
}
