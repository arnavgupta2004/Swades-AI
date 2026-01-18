import { BaseAgent } from './baseAgent';
import type { AgentType } from '@swades-ai/db';

export type IntentType = 'support' | 'order' | 'billing' | 'unknown';

export class RouterAgent extends BaseAgent {
  constructor() {
    super('ROUTER');
  }

  getSystemPrompt(): string {
    return `You are a routing agent that classifies customer queries into one of these categories:
1. support - General support inquiries, FAQs, troubleshooting, product questions
2. order - Order status, tracking, modifications, cancellations
3. billing - Payment issues, refunds, invoices, subscription queries

Analyze the user's query and determine the most appropriate category. Respond with only the category name (support, order, or billing).`;
  }

  getTools(): never[] {
    return [];
  }

  async classifyIntent(userMessage: string): Promise<IntentType> {
    const response = await this.process(userMessage, []);
    const content = response.content.toLowerCase().trim();

    if (content.includes('support')) return 'support';
    if (content.includes('order')) return 'order';
    if (content.includes('billing')) return 'billing';

    return 'unknown';
  }
}