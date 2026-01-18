# 🏗️ Complete Project Explanation - Swades AI

## Overview

Swades AI is a production-ready AI-powered customer support system that uses a **multi-agent architecture** to intelligently route and handle customer queries. Think of it as a smart customer service system where different AI agents specialize in different areas (orders, billing, general support) and can fetch real data from a database.

---

## 🎯 What Problem Does This Solve?

In traditional customer support:
- Customers have to navigate through menus to reach the right department
- Support agents need to manually look up information
- Context gets lost when transferred between departments

**Our Solution:**
- AI automatically understands what the customer needs
- Routes to the right specialized agent
- Agents fetch real-time data automatically
- Maintains conversation context throughout

---

## 🏛️ Architecture Breakdown

### 1. Monorepo Structure (Turborepo)

We organized the code as a **monorepo** - one repository containing multiple related packages:

```
swades-ai/
├── apps/
│   ├── backend/       # Hono API server
│   └── frontend/      # React UI
├── packages/
│   ├── db/           # Database (Prisma + SQLite)
│   └── api/          # Shared types
```

**Why Monorepo?**
- Share code between frontend and backend easily
- Single source of truth for types
- Build and deploy everything together
- Better developer experience

**Turborepo Benefits:**
- Intelligent caching of builds
- Parallel execution of tasks
- Efficient dependency management

### 2. Backend Architecture (Hono.dev)

**Why Hono?**
- Ultra-fast web framework (faster than Express)
- TypeScript-first design
- Built-in middleware support
- Edge runtime compatible
- Perfect for modern APIs

**Structure:**
```
apps/backend/
├── src/
│   ├── index.ts              # Main entry point
│   ├── load-env.ts           # Environment variable loader
│   ├── routes/               # API endpoints
│   │   ├── chat.ts           # Chat endpoints
│   │   ├── agents.ts         # Agent info endpoints
│   │   ├── users.ts          # User endpoints
│   │   └── health.ts         # Health check
│   ├── services/             # Business logic
│   │   ├── chatService.ts    # Chat orchestration
│   │   └── agents/           # AI agents
│   │       ├── baseAgent.ts  # Base agent class
│   │       ├── routerAgent.ts
│   │       ├── supportAgent.ts
│   │       ├── orderAgent.ts
│   │       ├── billingAgent.ts
│   │       └── mockAgent.ts  # For testing
│   └── middleware/           # Request processing
│       ├── errorHandler.ts   # Error handling
│       └── rateLimiter.ts    # Rate limiting
```

**Controller-Service Pattern:**
- **Routes (Controllers)**: Handle HTTP requests, validate input, send responses
- **Services**: Contain business logic, orchestrate agents, manage data
- **Agents**: Implement AI intelligence, call tools, generate responses

### 3. Frontend Architecture (React + Vite)

**Why This Stack?**
- React: Industry-standard, component-based
- Vite: Lightning-fast development server
- TypeScript: Type safety prevents bugs

**Key Components:**
```
apps/frontend/src/
├── App.tsx                   # Main app component
├── components/
│   ├── ChatInterface.tsx     # Chat UI with streaming
│   └── ConversationList.tsx  # Sidebar with conversations
└── index.css                 # Styling
```

**Features:**
- Real-time streaming message display
- Typing indicators with random "thinking" words
- Conversation history in sidebar
- Responsive design
- Error handling

### 4. Database Design (Prisma + SQLite)

**Why SQLite?**
- Zero configuration needed
- Perfect for development and demos
- File-based (easy to backup)
- Can easily migrate to PostgreSQL for production

**Schema:**
```prisma
User
├── id, email, name
└── conversations[]

Conversation
├── id, title, userId
└── messages[]

Message
├── id, role (USER/ASSISTANT), content
├── agentType (ROUTER/SUPPORT/ORDER/BILLING)
└── metadata (for tool results)

Order
├── orderNumber, status, total, items
├── userId
└── delivery (1-to-1)

Delivery
├── trackingId, status, carrier
└── estimatedDelivery, deliveredAt

Invoice
├── invoiceNumber, amount, status
├── userId
└── refunds[] (1-to-many)

Refund
├── amount, status, reason
└── processedAt
```

**Relationships:**
- User has many Conversations
- Conversation has many Messages
- User has many Orders and Invoices
- Order has one Delivery
- Invoice has many Refunds

---

## 🤖 Multi-Agent System - The Core Innovation

### How It Works

1. **User sends a message** → "Where is my order ORD-002?"

2. **Router Agent analyzes** → Classifies intent as "order"

3. **Delegates to Order Agent** → Specialized in order queries

4. **Order Agent processes**:
   - Understands the query needs order details
   - Calls `fetch_order_details` tool
   - Tool queries the database
   - Tool returns data to agent
   - Agent formulates a natural response

5. **Response sent to user** → "Your order ORD-002 is in transit..."

### Agent Details

#### Router Agent (Parent)
**Purpose:** Traffic controller for queries

**System Prompt:**
```
You are a router agent that classifies customer support queries.
Analyze the query and determine if it's about:
- support: General help, FAQs
- order: Order status, tracking, delivery
- billing: Payments, invoices, refunds
```

**No Tools** - Just classification

**Example Classifications:**
- "Hi" → support
- "Track my order" → order
- "Need a refund" → billing

#### Support Agent
**Purpose:** General customer service

**Tools:**
- `query_conversation_history`: Fetch previous messages for context

**Use Cases:**
- Greetings and general help
- FAQs about services
- Troubleshooting guidance

#### Order Agent
**Purpose:** Order management specialist

**Tools:**
1. `fetch_order_details(orderNumber, userId?)`
   - Queries Order table
   - Returns order status, items, total
   - Includes delivery information

2. `check_delivery_status(orderNumber, trackingId?)`
   - Queries Delivery table
   - Returns tracking info, carrier, ETA

**Use Cases:**
- "Where is my order?"
- "Track ORD-002"
- "When will my package arrive?"
- "Cancel my order"

#### Billing Agent
**Purpose:** Financial inquiries specialist

**Tools:**
1. `get_invoice_details(invoiceNumber, userId?)`
   - Queries Invoice table
   - Returns amount, status, items
   - Includes refund information

2. `check_refund_status(invoiceNumber, refundId?)`
   - Queries Refund table
   - Returns refund status and timeline

**Use Cases:**
- "Show my invoice"
- "Refund status for INV-002"
- "Payment issues"
- "Subscription billing"

### Tool Calling Mechanism

**How Tools Work:**

1. **Agent receives query** with tools enabled

2. **Gemini API decides** if it needs to call a tool

3. **Function call returned**:
```json
{
  "name": "fetch_order_details",
  "args": {
    "orderNumber": "ORD-002"
  }
}
```

4. **Agent executes tool**:
```typescript
const result = await prisma.order.findUnique({
  where: { orderNumber: "ORD-002" }
});
```

5. **Tool result sent back to AI**:
```json
{
  "order": {
    "orderNumber": "ORD-002",
    "status": "IN_TRANSIT",
    "total": 149.99,
    "delivery": {
      "trackingId": "TRACK-67890",
      "carrier": "FedEx",
      "estimatedDelivery": "2024-01-25"
    }
  }
}
```

6. **AI generates natural response**:
"Your order ORD-002 is currently in transit with FedEx. Your tracking number is TRACK-67890, and it should arrive by January 25, 2024."

---

## 🔌 API Design

### REST Endpoints

#### Chat Routes
```
POST /api/chat/messages
Body: { userId, conversationId?, message, stream? }
Response: Streaming text or JSON

GET /api/chat/conversations?userId=xxx
Response: List of conversations with message counts

GET /api/chat/conversations/:id?userId=xxx
Response: Full conversation with all messages

DELETE /api/chat/conversations/:id?userId=xxx
Response: { success: boolean }
```

#### Agent Routes
```
GET /api/agents
Response: List of all agents and their capabilities

GET /api/agents/:type/capabilities
Response: Specific agent's tools and description
```

#### User Routes
```
GET /api/users/by-email?email=xxx
Response: User object
```

#### Health Routes
```
GET /api/health
Response: { status: "ok", timestamp }
```

### Streaming Implementation

**Backend (Hono):**
```typescript
return stream(c, async (stream) => {
  for await (const chunk of chatService.streamMessage(...)) {
    await stream.write(chunk);
  }
});
```

**Frontend (React):**
```typescript
const response = await fetch('/api/chat/messages', {
  method: 'POST',
  body: JSON.stringify({ message, stream: true })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  setMessages(prev => updateLastMessage(prev, chunk));
}
```

---

## 🛡️ Error Handling & Middleware

### Error Handler Middleware
```typescript
// Catches all errors
app.onError((err, c) => {
  console.error('Error:', err);
  
  return c.json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  }, err.status || 500);
});
```

**Handles:**
- API errors (400, 404, 500)
- Database errors
- AI API errors (rate limits, timeouts)
- Validation errors

### Rate Limiter Middleware
```typescript
// In-memory rate limiting
const rateLimiter = new Map();

app.use(async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Allow 10 requests per minute
  if (requests > 10) {
    return c.json({ error: 'Too many requests' }, 429);
  }
  
  await next();
});
```

**Purpose:**
- Prevent API abuse
- Protect AI API quotas
- Ensure fair usage

### CORS Middleware
```typescript
app.use('*', cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**Purpose:**
- Allow frontend to call backend
- Secure cross-origin requests

---

## 🎨 UI/UX Features

### Chat Interface
- **Message Display**: User messages on right, AI on left
- **Streaming**: Words appear in real-time
- **Typing Indicator**: Shows random "thinking" words
- **Error States**: Graceful error messages
- **Loading States**: Shows when processing

### Conversation List
- **All Conversations**: Listed by most recent
- **Message Count**: Shows number of messages
- **Last Message**: Preview of latest message
- **Click to Open**: Load full conversation
- **Delete Option**: Remove conversations

### Responsive Design
- Works on desktop and mobile
- Flexbox layout
- Clean, modern styling
- Accessible (keyboard navigation)

---

## 🚀 Development Features

### Environment Management
```bash
# .env file
DATABASE_URL="file:./packages/db/prisma/data.db"
GEMINI_API_KEY="your-key-here"
MOCK_MODE="false"  # Toggle for testing
PORT=3000
```

**load-env.ts:**
- Loads `.env` before any imports
- Validates required variables
- Provides helpful error messages

### Mock Mode
```typescript
if (MOCK_MODE === 'true') {
  // Use MockAgent - no API calls
  response = await MockAgent.getMockResponse(message, agentType);
} else {
  // Use real AI agents
  response = await agent.process(message, history);
}
```

**Benefits:**
- Demo without API costs
- Test without internet
- Consistent responses for testing
- Faster development

### Database Seeding
```typescript
// seed.ts creates sample data
- 2 Users (John Doe, Jane Smith)
- 4 Orders (different statuses)
- 3 Invoices (with refunds)
- 2 Sample conversations
```

**Purpose:**
- Immediate demo-ready data
- Consistent test scenarios
- No manual setup needed

---

## 🎁 Bonus Features Implemented

### 1. Monorepo with Turborepo ✅
- Efficient builds and caching
- Shared dependencies
- Parallel task execution
- Single command to run everything

### 2. Hono RPC Ready ✅
- `packages/api` for shared types
- Type-safe API calls (expandable)
- End-to-end TypeScript

### 3. Rate Limiting ✅
- Request throttling
- Per-IP tracking
- Configurable limits

### 4. Streaming with Typing Indicators ✅
- Real-time responses
- "Thinking...", "Processing...", "Analyzing..." indicators
- Smooth UX

### 5. Context Management ✅
- Last 20 messages kept in memory
- Passed to each agent call
- AI understands conversation flow

### 6. Mock Mode ✅
- No API calls for testing
- Intelligent mock responses
- Tool simulation

---

## 🔧 Technical Decisions & Why

### Why Google Gemini over OpenAI?
- **Free tier**: More generous than OpenAI
- **Function calling**: Excellent tool support
- **Speed**: Fast response times
- **Cost**: Better for development

### Why SQLite over PostgreSQL?
- **Zero config**: No server setup
- **Portable**: Single file database
- **Fast**: Great for demos
- **Easy migration**: Can switch to Postgres easily

### Why Hono over Express?
- **Performance**: 10x faster
- **TypeScript**: First-class support
- **Modern**: Built for edge runtimes
- **Lightweight**: Smaller bundle

### Why Turborepo over Nx/Lerna?
- **Simple**: Easy to configure
- **Fast**: Intelligent caching
- **Popular**: Good documentation
- **Maintained**: Active development

---

## 📊 Data Flow Example

**Complete flow for "Where is my order ORD-002?"**

1. **Frontend**: User types and clicks send
   ```typescript
   fetch('/api/chat/messages', {
     method: 'POST',
     body: JSON.stringify({
       userId: 'user123',
       message: 'Where is my order ORD-002?',
       stream: true
     })
   })
   ```

2. **Backend Route**: Receives request
   ```typescript
   chatRoutes.post('/messages', async (c) => {
     const { userId, message, stream } = await c.req.json();
     // Route to ChatService
   })
   ```

3. **ChatService**: Orchestrates process
   ```typescript
   async *streamMessage(userId, conversationId, message) {
     // 1. Create/get conversation
     // 2. Save user message
     // 3. Get conversation history
     // 4. Route to appropriate agent
   }
   ```

4. **RouterAgent**: Classifies intent
   ```typescript
   async classifyIntent(message) {
     // AI analyzes: "order" → ORDER intent
     return 'order';
   }
   ```

5. **OrderAgent**: Processes with tools
   ```typescript
   async process(message, history) {
     // AI sees: "need to call fetch_order_details"
     const result = await this.callTool('fetch_order_details', {
       orderNumber: 'ORD-002'
     });
     // AI generates response with data
   }
   ```

6. **Tool Execution**: Database query
   ```typescript
   const order = await prisma.order.findUnique({
     where: { orderNumber: 'ORD-002' },
     include: { delivery: true }
   });
   ```

7. **Response Generation**: AI creates answer
   ```
   "Your order ORD-002 is in transit with FedEx.
   Tracking: TRACK-67890.
   Estimated delivery: January 25, 2024."
   ```

8. **Streaming**: Word-by-word to frontend
   ```typescript
   for (const word of response.split(' ')) {
     yield word + ' ';
   }
   ```

9. **Frontend**: Displays in real-time
   ```typescript
   const chunk = decoder.decode(value);
   setMessages(prev => updateLastMessage(prev, chunk));
   ```

10. **Database**: Save assistant message
    ```typescript
    await prisma.message.create({
      conversationId: id,
      role: 'ASSISTANT',
      content: fullResponse,
      agentType: 'ORDER'
    });
    ```

---

## 🧪 Testing Scenarios

### Scenario 1: General Support
```
User: "Hi, I need help"
Router: → SUPPORT agent
Support: General greeting and available services
```

### Scenario 2: Order Tracking
```
User: "Where is my order ORD-002?"
Router: → ORDER agent
Order: Calls fetch_order_details
Response: "Order ORD-002 is in transit..."
```

### Scenario 3: Refund Inquiry
```
User: "Refund status for INV-002?"
Router: → BILLING agent
Billing: Calls check_refund_status
Response: "Refund for INV-002 was processed on..."
```

### Scenario 4: Context Awareness
```
User: "Show me order ORD-001"
Agent: [provides order info]
User: "Can I cancel it?"
Agent: [understands "it" refers to ORD-001]
```

---

## 🎓 Key Learnings & Concepts

### 1. Multi-Agent Architecture
- Specialized agents for specific domains
- Router pattern for delegation
- Tool-based augmentation

### 2. Function Calling / Tool Use
- AI decides when to fetch data
- Structured function parameters
- Combining AI reasoning with real data

### 3. Streaming Responses
- Better UX than waiting
- ReadableStream API
- Chunk-based processing

### 4. Type Safety
- End-to-end TypeScript
- Shared types across packages
- Compile-time error catching

### 5. Monorepo Management
- Code sharing strategies
- Dependency management
- Build optimization

---

## 🚀 Future Enhancements (If You Had More Time)

1. **Authentication & Authorization**
   - User login/signup
   - JWT tokens
   - Role-based access

2. **WebSocket Support**
   - Real-time bidirectional communication
   - Live agent status
   - Push notifications

3. **Admin Dashboard**
   - Monitor conversations
   - Analyze agent performance
   - User management

4. **Advanced Context Management**
   - Semantic search of conversation history
   - Summarization of long conversations
   - Context compaction strategies

5. **Testing**
   - Unit tests for agents
   - Integration tests for API
   - E2E tests with Playwright

6. **Deployment**
   - Docker containerization
   - CI/CD pipeline
   - Cloud deployment (Vercel/Railway)

7. **Analytics**
   - Agent routing metrics
   - Response time tracking
   - User satisfaction scoring

8. **More Agents**
   - Technical Support Agent
   - Sales Agent
   - Account Management Agent

---

## 📝 Summary

**What We Built:**
- ✅ Multi-agent AI system with Router + 3 specialized agents
- ✅ 6 tools across agents for real data fetching
- ✅ Full-stack application with modern tech stack
- ✅ RESTful API with streaming support
- ✅ Database with seeded sample data
- ✅ Clean architecture with proper error handling
- ✅ Production-ready features (rate limiting, CORS, etc.)
- ✅ Complete documentation and setup instructions

**Technical Highlights:**
- Monorepo with Turborepo
- Hono.dev backend (modern, fast)
- React + Vite frontend
- Prisma ORM with SQLite
- Google Gemini AI integration
- TypeScript throughout
- Streaming responses
- Context management

**This project demonstrates:**
- Understanding of AI agent architectures
- Ability to integrate AI with real applications
- Clean code organization
- Full-stack development skills
- Production-ready thinking

---

**You've built something impressive! Good luck with your interview! 🚀**
