import prisma from '@swades-ai/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RouterAgent, IntentType } from './agents/routerAgent';
import { SupportAgent } from './agents/supportAgent';
import { OrderAgent } from './agents/orderAgent';
import { BillingAgent } from './agents/billingAgent';
import { MockAgent } from './agents/mockAgent';
import type { AgentType } from '@swades-ai/db';

// Enable mock mode if API quota is exceeded or for demo purposes
const MOCK_MODE = process.env.MOCK_MODE === 'true';

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

  /**
   * Resolve userId - if it's an email, find or create the user and return the actual user ID
   */
  private async resolveUserId(userId: string): Promise<string> {
    // Check if userId looks like an email
    if (userId.includes('@')) {
      // Find or create user by email
      let user = await prisma.user.findUnique({
        where: { email: userId },
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            email: userId,
            name: userId.split('@')[0],
          },
        });
      }

      return user.id;
    }

    // If it's already a user ID, verify it exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return userId;
  }

  async processMessage(
    userId: string,
    conversationId: string | null,
    message: string
  ): Promise<{ response: string; agentType: AgentType; conversationId: string }> {
    // Resolve userId (handle email addresses)
    const resolvedUserId = await this.resolveUserId(userId);

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
          userId: resolvedUserId,
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
    let response;
    
    try {
      if (MOCK_MODE) {
        // Use mock responses for demo
        const agentType: AgentType = message.toLowerCase().includes('order') ? 'ORDER' 
          : message.toLowerCase().includes('invoice') || message.toLowerCase().includes('refund') || message.toLowerCase().includes('billing') ? 'BILLING'
          : 'SUPPORT';
        response = await MockAgent.getMockResponse(message, agentType);
      } else {
        const intent: IntentType = await this.routerAgent.classifyIntent(message);

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
      }
    } catch (error: any) {
      // Check if it's a rate limit error and fall back to mock mode
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.log('[ChatService] Rate limit exceeded, falling back to mock mode');
        const agentType: AgentType = message.toLowerCase().includes('order') ? 'ORDER' 
          : message.toLowerCase().includes('invoice') || message.toLowerCase().includes('refund') || message.toLowerCase().includes('billing') ? 'BILLING'
          : 'SUPPORT';
        response = await MockAgent.getMockResponse(message, agentType);
      } else {
        throw error;
      }
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
    // Resolve userId (handle email addresses)
    const resolvedUserId = await this.resolveUserId(userId);

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
          userId: resolvedUserId,
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

    // Get the full response from agent (this properly handles tool calls)
    let fullResponse = '';
    let agentType: AgentType;

    try {
      if (MOCK_MODE) {
        // Use mock responses for demo
        const mockAgentType: AgentType = message.toLowerCase().includes('order') ? 'ORDER' 
          : message.toLowerCase().includes('invoice') || message.toLowerCase().includes('refund') || message.toLowerCase().includes('billing') ? 'BILLING'
          : 'SUPPORT';
        const mockResponse = await MockAgent.getMockResponse(message, mockAgentType);
        fullResponse = mockResponse.content;
        agentType = mockResponse.agentType;
      } else {
        // Route to appropriate agent and get complete response (handles tools properly)
        const intent: IntentType = await this.routerAgent.classifyIntent(message);
        
        // Determine which agent to use
        let agent: SupportAgent | OrderAgent | BillingAgent;

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

        console.log(`[ChatService] Routing to ${agentType} agent`);
        const agentResponse = await agent.process(message, conversationHistory);
        fullResponse = agentResponse.content;
        agentType = agentResponse.agentType;
      }
      
      // Stream the response word by word for a better UX
      const words = fullResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = i === words.length - 1 ? words[i] : words[i] + ' ';
        yield word;
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 30));
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
    } catch (error: any) {
      console.error('Streaming error:', error);
      
      // Check if it's a rate limit error and fall back to mock mode
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.log('[ChatService] Rate limit exceeded, falling back to mock mode');
        const mockAgentType: AgentType = message.toLowerCase().includes('order') ? 'ORDER' 
          : message.toLowerCase().includes('invoice') || message.toLowerCase().includes('refund') || message.toLowerCase().includes('billing') ? 'BILLING'
          : 'SUPPORT';
        const mockResponse = await MockAgent.getMockResponse(message, mockAgentType);
        fullResponse = mockResponse.content;
        agentType = mockResponse.agentType;
        
        // Stream the mock response
        const words = fullResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = i === words.length - 1 ? words[i] : words[i] + ' ';
          yield word;
          await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Save the mock response
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
      } else {
        throw error;
      }
    }
  }

  async getConversations(userId: string) {
    // Resolve userId (handle email addresses)
    const resolvedUserId = await this.resolveUserId(userId);
    
    return prisma.conversation.findMany({
      where: { userId: resolvedUserId },
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
    // Resolve userId (handle email addresses)
    const resolvedUserId = await this.resolveUserId(userId);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation || conversation.userId !== resolvedUserId) {
      return null;
    }

    return conversation;
  }

  async deleteConversation(conversationId: string, userId: string) {
    // Resolve userId (handle email addresses)
    const resolvedUserId = await this.resolveUserId(userId);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== resolvedUserId) {
      return false;
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return true;
  }
}