import OpenAI from 'openai';
import type { AgentType } from '@swades-ai/db';

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  protected openai: OpenAI;
  protected agentType: AgentType;

  constructor(agentType: AgentType) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      throw new Error(
        'OPENAI_API_KEY is missing or not set. Please set it in your .env file.'
      );
    }
    this.openai = new OpenAI({
      apiKey,
    });
    this.agentType = agentType;
  }

  abstract getSystemPrompt(): string;
  abstract getTools(): AgentTool[];

  protected async callTool(toolName: string, args: any): Promise<any> {
    throw new Error(`Tool ${toolName} not implemented`);
  }

  async process(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    toolResults?: Record<string, any>
  ): Promise<AgentResponse> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Include tool results if available
    if (toolResults) {
      for (const [toolName, result] of Object.entries(toolResults)) {
        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolName,
        } as any);
      }
    }

    const tools = this.getTools();
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools: tools.length > 0 ? tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })) : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('No response from agent');
    }

    // Handle tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolResults: Record<string, any> = {};
      
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        toolResults[toolCall.id] = await this.callTool(toolName, args);
      }

      // Call again with tool results
      return this.process(userMessage, conversationHistory, toolResults);
    }

    return {
      content: message.content || '',
      agentType: this.agentType,
    };
  }
}