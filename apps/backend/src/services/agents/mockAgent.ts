import type { AgentType } from '@swades-ai/db';
import { AgentResponse } from './baseAgent';

// Mock responses for demo purposes when API quota is exceeded
export class MockAgent {
  static async getMockResponse(
    message: string,
    agentType: AgentType
  ): Promise<AgentResponse> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    const lowerMessage = message.toLowerCase();

    // Order-related queries
    if (lowerMessage.includes('order') || lowerMessage.match(/ord-\d+/i)) {
      const orderNumber = message.match(/ORD-\d+/i)?.[0] || 'ORD-002';
      return {
        content: `I found your order ${orderNumber}! It's currently in transit with FedEx. Your tracking number is TRACK-67890, and the estimated delivery date is January 25, 2024. You can track your package on the FedEx website.`,
        agentType: 'ORDER',
      };
    }

    // Billing-related queries
    if (lowerMessage.includes('refund') || lowerMessage.includes('invoice') || lowerMessage.match(/inv-\d+/i)) {
      const invoiceNumber = message.match(/INV-\d+/i)?.[0] || 'INV-002';
      return {
        content: `I can see your invoice ${invoiceNumber} for $149.50. Your refund request has been processed successfully and was completed on January 20, 2024. The refund amount of $149.50 should appear in your account within 5-7 business days.`,
        agentType: 'BILLING',
      };
    }

    // Support queries
    if (lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return {
        content: `I'm here to help! I can assist you with:\n- Order tracking and delivery status\n- Billing inquiries and refunds\n- Product information\n- Account questions\n\nWhat would you like help with today?`,
        agentType: 'SUPPORT',
      };
    }

    // General greeting
    if (lowerMessage.match(/^(hi|hello|hey|greetings)/i)) {
      return {
        content: `Hello! Welcome to Swades AI Customer Support. I'm here to help you with orders, billing, and general support questions. What can I assist you with today?`,
        agentType: 'SUPPORT',
      };
    }

    // Default response
    return {
      content: `Thank you for your message. I'm here to help with:\n- Order tracking (try "Where is order ORD-002?")\n- Billing questions (try "Check refund for INV-002")\n- General support\n\nHow can I assist you?`,
      agentType: 'SUPPORT',
    };
  }
}
