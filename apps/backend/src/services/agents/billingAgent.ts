import { BaseAgent, AgentTool } from './baseAgent';
import type { AgentType } from '@swades-ai/db';
import prisma from '@swades-ai/db';

export class BillingAgent extends BaseAgent {
  constructor() {
    super('BILLING');
  }

  getSystemPrompt(): string {
    return `You are a specialized billing support agent. You help customers with:
- Invoice inquiries and details
- Payment issues and status
- Refund requests and status
- Subscription queries
- Billing disputes

Use the available tools to fetch real-time invoice and refund information.
Always provide accurate financial information.`;
  }

  getTools(): AgentTool[] {
    return [
      {
        name: 'get_invoice_details',
        description:
          'Fetch detailed information about a specific invoice including amount, status, items, and due date.',
        parameters: {
          type: 'object',
          properties: {
            invoiceNumber: {
              type: 'string',
              description: 'The invoice number to fetch details for (e.g., INV-001)',
            },
            userId: {
              type: 'string',
              description: 'The ID of the user whose invoice to retrieve',
            },
          },
          required: ['invoiceNumber'],
        },
      },
      {
        name: 'check_refund_status',
        description:
          'Check the status of a refund request for a specific invoice.',
        parameters: {
          type: 'object',
          properties: {
            invoiceNumber: {
              type: 'string',
              description: 'The invoice number associated with the refund',
            },
            refundId: {
              type: 'string',
              description: 'The refund ID (optional, will find all refunds if not provided)',
            },
          },
          required: ['invoiceNumber'],
        },
      },
    ];
  }

  protected async callTool(toolName: string, args: any): Promise<any> {
    if (toolName === 'get_invoice_details') {
      const { invoiceNumber, userId } = args;

      const invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
        include: {
          refunds: true,
        },
      });

      if (!invoice) {
        return {
          error: `Invoice ${invoiceNumber} not found`,
        };
      }

      if (userId && invoice.userId !== userId) {
        return {
          error: 'Invoice not found for this user',
        };
      }

      return {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          status: invoice.status,
          items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
          dueDate: invoice.dueDate?.toISOString(),
          paidAt: invoice.paidAt?.toISOString(),
          createdAt: invoice.createdAt.toISOString(),
          refunds: invoice.refunds.map((refund) => ({
            id: refund.id,
            amount: refund.amount,
            status: refund.status,
            reason: refund.reason,
            processedAt: refund.processedAt?.toISOString(),
          })),
        },
      };
    }

    if (toolName === 'check_refund_status') {
      const { invoiceNumber, refundId } = args;

      const invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
        include: {
          refunds: refundId
            ? {
                where: { id: refundId },
              }
            : true,
        },
      });

      if (!invoice) {
        return {
          error: `Invoice ${invoiceNumber} not found`,
        };
      }

      if (invoice.refunds.length === 0) {
        return {
          message: 'No refunds found for this invoice',
          refunds: [],
        };
      }

      return {
        invoiceNumber: invoice.invoiceNumber,
        refunds: invoice.refunds.map((refund) => ({
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason,
          processedAt: refund.processedAt?.toISOString(),
          createdAt: refund.createdAt.toISOString(),
        })),
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}