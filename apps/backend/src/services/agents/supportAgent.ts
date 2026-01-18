import { BaseAgent, AgentTool } from './baseAgent';
import type { AgentType } from '@swades-ai/db';
import prisma from '@swades-ai/db';

export class SupportAgent extends BaseAgent {
  constructor() {
    super('SUPPORT');
  }

  getSystemPrompt(): string {
    return `You are a helpful customer support agent. You assist customers with:
- General inquiries and FAQs
- Product information and troubleshooting
- Account-related questions
- Technical support

Use the conversation history tool to access previous conversations for context.
Always be friendly, professional, and helpful.`;
  }

  getTools(): AgentTool[] {
    return [
      {
        name: 'query_conversation_history',
        description:
          'Query the conversation history for a specific user to understand context and previous interactions.',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The ID of the user whose conversation history to retrieve',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of previous messages to retrieve',
              default: 10,
            },
          },
          required: ['userId'],
        },
      },
    ];
  }

  protected async callTool(toolName: string, args: any): Promise<any> {
    if (toolName === 'query_conversation_history') {
      const { userId, limit = 10 } = args;

      const conversations = await prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              role: true,
              content: true,
              agentType: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5, // Get last 5 conversations
      });

      return {
        conversations: conversations.map((conv) => ({
          id: conv.id,
          title: conv.title,
          messageCount: conv.messages.length,
          messages: conv.messages.reverse(), // Reverse to show chronological order
        })),
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}