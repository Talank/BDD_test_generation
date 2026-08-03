import { ManualProvider } from './manual.mjs';
import { OpenAIProvider } from './openai.mjs';
import { CommandProvider } from './command.mjs';
import { MockProvider } from './mock.mjs';

export function createProvider(config) {
  const options = config.provider;
  switch (options.type) {
    case 'manual': return new ManualProvider({ ...options, caseId: config.caseId });
    case 'openai': return new OpenAIProvider(options);
    case 'command': return new CommandProvider(options);
    case 'mock': return new MockProvider(options);
    default: throw new Error(`Unsupported provider: ${options.type}`);
  }
}
