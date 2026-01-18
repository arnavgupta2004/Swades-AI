import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ChatService } from '../services/chatService';
import { HTTPException } from 'hono/http-exception';

// Lazy initialization to avoid crashing if API key is missing at startup
let chatServiceInstance: ChatService | null = null;
function getChatService(): ChatService {
  if (!chatServiceInstance) {
    try {
      chatServiceInstance = new ChatService();
    } catch (error: any) {
      throw new HTTPException(500, { 
        message: error.message || 'Failed to initialize chat service. Please check your OPENAI_API_KEY in .env file.' 
      });
    }
  }
  return chatServiceInstance;
}

export const chatRoutes = new Hono();

// POST /api/chat/messages
chatRoutes.post(
  '/messages',
  zValidator(
    'json',
    z.object({
      userId: z.string(),
      conversationId: z.string().nullable().optional(),
      message: z.string().min(1),
      stream: z.boolean().optional().default(false),
    })
  ),
  async (c) => {
    const { userId, conversationId, message, stream } = c.req.valid('json');

    try {
      const chatService = getChatService();
      
      if (stream) {
        // Stream response using ReadableStream
        const readable = new ReadableStream({
          async start(controller) {
            try {
              const generator = chatService.streamMessage(userId, conversationId || null, message);
              for await (const chunk of generator) {
                controller.enqueue(new TextEncoder().encode(chunk));
              }
              controller.close();
            } catch (error: any) {
              console.error('Stream error:', error);
              controller.enqueue(new TextEncoder().encode(`Error: ${error.message}`));
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        });
      }

      // Non-streaming response
      const result = await chatService.processMessage(userId, conversationId || null, message);

      return c.json({
        success: true,
        data: {
          conversationId: result.conversationId,
          message: result.response,
          agentType: result.agentType,
        },
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      if (error.message?.includes('OPENAI_API_KEY')) {
        throw new HTTPException(500, { 
          message: 'OpenAI API key is missing. Please set OPENAI_API_KEY in your .env file.' 
        });
      }
      throw new HTTPException(500, { message: error.message || 'Internal server error' });
    }
  }
);

// GET /api/chat/conversations/:id
chatRoutes.get('/conversations/:id', async (c) => {
  const conversationId = c.req.param('id');
  const userId = c.req.query('userId');

  if (!userId) {
    throw new HTTPException(400, { message: 'userId query parameter is required' });
  }

  const chatService = getChatService();
  const conversation = await chatService.getConversation(conversationId, userId);

  if (!conversation) {
    throw new HTTPException(404, { message: 'Conversation not found' });
  }

  return c.json({
    success: true,
    data: conversation,
  });
});

// GET /api/chat/conversations
chatRoutes.get('/conversations', async (c) => {
  const userId = c.req.query('userId');

  if (!userId) {
    throw new HTTPException(400, { message: 'userId query parameter is required' });
  }

  const chatService = getChatService();
  const conversations = await chatService.getConversations(userId);

  return c.json({
    success: true,
    data: conversations,
  });
});

// DELETE /api/chat/conversations/:id
chatRoutes.delete('/conversations/:id', async (c) => {
  const conversationId = c.req.param('id');
  const userId = c.req.query('userId');

  if (!userId) {
    throw new HTTPException(400, { message: 'userId query parameter is required' });
  }

  const chatService = getChatService();
  const deleted = await chatService.deleteConversation(conversationId, userId);

  if (!deleted) {
    throw new HTTPException(404, { message: 'Conversation not found' });
  }

  return c.json({
    success: true,
    message: 'Conversation deleted',
  });
});