import { BaseAgent, AgentTool } from './baseAgent';
import type { AgentType } from '@swades-ai/db';
import prisma from '@swades-ai/db';

export class OrderAgent extends BaseAgent {
  constructor() {
    super('ORDER');
  }

  getSystemPrompt(): string {
    return `You are a specialized order support agent. You help customers with:
- Order status inquiries
- Order tracking information
- Order modifications and cancellations
- Delivery updates

Use the available tools to fetch real-time order and delivery information.
Always provide accurate and up-to-date information.`;
  }

  getTools(): AgentTool[] {
    return [
      {
        name: 'fetch_order_details',
        description:
          'Fetch detailed information about a specific order including status, items, and total amount.',
        parameters: {
          type: 'object',
          properties: {
            orderNumber: {
              type: 'string',
              description: 'The order number to fetch details for (e.g., ORD-001)',
            },
            userId: {
              type: 'string',
              description: 'The ID of the user who placed the order',
            },
          },
          required: ['orderNumber'],
        },
      },
      {
        name: 'check_delivery_status',
        description:
          'Check the current delivery status and tracking information for an order.',
        parameters: {
          type: 'object',
          properties: {
            orderNumber: {
              type: 'string',
              description: 'The order number to check delivery status for',
            },
            trackingId: {
              type: 'string',
              description: 'The tracking ID (optional, will be found if not provided)',
            },
          },
          required: ['orderNumber'],
        },
      },
    ];
  }

  protected async callTool(toolName: string, args: any): Promise<any> {
    if (toolName === 'fetch_order_details') {
      const { orderNumber, userId } = args;

      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          delivery: true,
        },
      });

      if (!order) {
        return {
          error: `Order ${orderNumber} not found`,
        };
      }

      if (userId && order.userId !== userId) {
        return {
          error: 'Order not found for this user',
        };
      }

      return {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          delivery: order.delivery
            ? {
                status: order.delivery.status,
                trackingId: order.delivery.trackingId,
                carrier: order.delivery.carrier,
                estimatedDelivery: order.delivery.estimatedDelivery?.toISOString(),
                deliveredAt: order.delivery.deliveredAt?.toISOString(),
              }
            : null,
        },
      };
    }

    if (toolName === 'check_delivery_status') {
      const { orderNumber, trackingId } = args;

      let delivery;
      if (trackingId) {
        delivery = await prisma.delivery.findUnique({
          where: { trackingId },
          include: { order: true },
        });
      } else {
        const order = await prisma.order.findUnique({
          where: { orderNumber },
          include: { delivery: true },
        });
        delivery = order?.delivery;
      }

      if (!delivery) {
        return {
          error: 'Delivery information not found',
        };
      }

      return {
        delivery: {
          status: delivery.status,
          trackingId: delivery.trackingId,
          carrier: delivery.carrier,
          estimatedDelivery: delivery.estimatedDelivery?.toISOString(),
          deliveredAt: delivery.deliveredAt?.toISOString(),
          orderNumber: trackingId ? (delivery as any).order?.orderNumber : orderNumber,
        },
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}