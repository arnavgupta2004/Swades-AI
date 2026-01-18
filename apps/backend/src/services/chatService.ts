import prisma from '@swades-ai/db';
import OpenAI from 'openai';
import { RouterAgent, IntentType } from './agents/routerAgent';
import { SupportAgent } from './agents/supportAgent';
import { OrderAgent } from './agents/orderAgent';
import { BillingAgent } from './agents/billingAgent';
import type { AgentType } from '@swades-ai/db';

export class ChatService {
  private routerAgent: RouterAgent;
  private supportAgent: SupportAgent;
  private orderAgent: OrderAgent;
  private billingAgent: BillingAgent;

  constructor() {
    this.routerAgent = new RouterAgent();
    this.supportAgent = new SupportAgent();
    this.orderAgent = new OrderAgent();
    this.billingAgent = new BillingAgent();
  }

  async processMessage(
    userId: string,
    conversationId: string | null,
    message: string
  ): Promise<{ response: string; agentType: AgentType; conversationId: string }> {
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    if (!conversation) {
      // Create new conversation with a simple title
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title,
          messages: {
            create: {
              role: 'USER',
              content: message,
            },
          },
        },
        include: { messages: true },
      });
    } else {
      // Add user message to existing conversation
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: message,
        },
      });
    }

    // Get conversation history for context
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages for context
    });

    const conversationHistory = history.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }));

    // Route to appropriate agent
    const intent: IntentType = await this.routerAgent.classifyIntent(message);
    let response;

    switch (intent) {
      case 'support':
        response = await this.supportAgent.process(message, conversationHistory);
        break;
      case 'order':
        response = await this.orderAgent.process(message, conversationHistory);
        break;
      case 'billing':
        response = await this.billingAgent.process(message, conversationHistory);
        break;
      default:
        // Fallback to support agent for unknown intents
        response = await this.supportAgent.process(message, conversationHistory);
        response.agentType = 'ROUTER'; // Mark as routed but unclassified
    }

    // Save assistant response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: response.content,
        agentType: response.agentType,
        metadata: response.metadata,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      response: response.content,
      agentType: response.agentType,
      conversationId: conversation.id,
    };
  }

  async *streamMessage(
    userId: string,
    conversationId: string | null,
    message: string
  ): AsyncGenerator<string, void, unknown> {
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    if (!conversation) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title,
          messages: {
            create: {
              role: 'USER',
              content: message,
            },
          },
        },
        include: { messages: true },
      });
    } else {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: message,
        },
      });
    }

    // Get conversation history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const conversationHistory = history.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }));

    // Route to appropriate agent
    const intent: IntentType = await this.routerAgent.classifyIntent(message);
    
    // Determine which agent to use
    let agent: SupportAgent | OrderAgent | BillingAgent;
    let agentType: AgentType;

    switch (intent) {
      case 'support':
        agent = this.supportAgent;
        agentType = 'SUPPORT';
        break;
      case 'order':
        agent = this.orderAgent;
        agentType = 'ORDER';
        break;
      case 'billing':
        agent = this.billingAgent;
        agentType = 'BILLING';
        break;
      default:
        agent = this.supportAgent;
        agentType = 'ROUTER';
    }

    // Use the agent's process method, but we need to implement streaming differently
    // For now, we'll use a simplified streaming approach
    const systemPrompt = agent['getSystemPrompt']();
    const tools = agent['getTools']();
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Stream the response
    let fullResponse = '';

    try {
      const stream = await client.chat.completions.create({
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
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          yield content;
        }

        // Handle tool calls if needed (simplified - would need more complex handling)
        if (chunk.choices[0]?.delta?.tool_calls) {
          // Tool calls need special handling in streaming - for now, skip
        }
      }

      // Save the complete response
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: fullResponse,
          agentType,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      return null;
    }

    return conversation;
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      return false;
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return true;
  }
}