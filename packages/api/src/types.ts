import { z } from 'zod';

// Chat types
export const SendMessageSchema = z.object({
  userId: z.string(),
  conversationId: z.string().nullable().optional(),
  message: z.string().min(1),
  stream: z.boolean().optional().default(false),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;

export const MessageResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    conversationId: z.string(),
    message: z.string(),
    agentType: z.string(),
  }),
});

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      content: z.string(),
      agentType: z.string().nullable(),
      createdAt: z.string(),
    })
  ),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const AgentSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
});

export type Agent = z.infer<typeof AgentSchema>;