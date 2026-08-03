export class OpenAIProvider {
  constructor(options = {}) {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = options.model ?? process.env.OPENAI_MODEL;
    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is required for the OpenAI provider.');
    if (!this.model) throw new Error('provider.model or OPENAI_MODEL is required for the OpenAI provider.');
  }

  async generate({ prompt }) {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, input: prompt }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;

    const text = (data.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text')
      .map((item) => item.text)
      .join('\n')
      .trim();

    if (!text) throw new Error('OpenAI returned no output text.');
    return text;
  }
}
