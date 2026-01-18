import { Hono } from 'hono';
import { SupportAgent } from '../services/agents/supportAgent';
import { OrderAgent } from '../services/agents/orderAgent';
import { BillingAgent } from '../services/agents/billingAgent';
import type { AgentType } from '@swades-ai/db';

export const agentRoutes = new Hono();

// Lazy initialization to avoid crashing if API key is missing at startup
let supportAgentInstance: SupportAgent | null = null;
let orderAgentInstance: OrderAgent | null = null;
let billingAgentInstance: BillingAgent | null = null;

function getSupportAgent(): SupportAgent {
  if (!supportAgentInstance) {
    supportAgentInstance = new SupportAgent();
  }
  return supportAgentInstance;
}

function getOrderAgent(): OrderAgent {
  if (!orderAgentInstance) {
    orderAgentInstance = new OrderAgent();
  }
  return orderAgentInstance;
}

function getBillingAgent(): BillingAgent {
  if (!billingAgentInstance) {
    billingAgentInstance = new BillingAgent();
  }
  return billingAgentInstance;
}

// GET /api/agents
agentRoutes.get('/', (c) => {
  const supportAgent = getSupportAgent();
  const orderAgent = getOrderAgent();
  const billingAgent = getBillingAgent();
  
  return c.json({
    success: true,
    data: {
      agents: [
        {
          type: 'support',
          name: 'Support Agent',
          description: 'Handles general support inquiries, FAQs, and troubleshooting',
          capabilities: supportAgent.getTools().map((tool) => tool.name),
        },
        {
          type: 'order',
          name: 'Order Agent',
          description: 'Handles order status, tracking, modifications, and cancellations',
          capabilities: orderAgent.getTools().map((tool) => tool.name),
        },
        {
          type: 'billing',
          name: 'Billing Agent',
          description: 'Handles payment issues, refunds, invoices, and subscription queries',
          capabilities: billingAgent.getTools().map((tool) => tool.name),
        },
      ],
    },
  });
});

// GET /api/agents/:type/capabilities
agentRoutes.get('/:type/capabilities', (c) => {
  const type = c.req.param('type');

  let agent;
  let agentType: AgentType;

  switch (type) {
    case 'support':
      agent = getSupportAgent();
      agentType = 'SUPPORT';
      break;
    case 'order':
      agent = getOrderAgent();
      agentType = 'ORDER';
      break;
    case 'billing':
      agent = getBillingAgent();
      agentType = 'BILLING';
      break;
    default:
      return c.json({ success: false, error: 'Invalid agent type' }, 400);
  }

  return c.json({
    success: true,
    data: {
      type: type,
      agentType,
      tools: agent.getTools(),
      systemPrompt: agent['getSystemPrompt'](),
    },
  });
});