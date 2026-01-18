# 🎥 Video Demo Script for Swades AI - Multi-Agent Customer Support System

## Duration: 3-5 minutes

---

## INTRODUCTION (30 seconds)

**[Show project in IDE]**

"Hi! I'm presenting Swades AI - an intelligent customer support system built with a multi-agent architecture. This project implements a router agent that analyzes customer queries and delegates them to specialized sub-agents, each with access to relevant tools to fetch real-time data from the database."

---

## ARCHITECTURE OVERVIEW (45 seconds)

**[Show project structure in IDE or file tree]**

"Let me walk you through the architecture:

1. **Monorepo Setup** - I've used Turborepo to manage a monorepo with multiple packages
   - `apps/backend` - Hono.dev API server
   - `apps/frontend` - React + Vite UI
   - `packages/db` - Prisma ORM with SQLite
   - `packages/api` - Shared types (ready for Hono RPC expansion)

2. **Controller-Service Pattern** - Clean separation with:
   - Routes handling HTTP requests
   - Services containing business logic
   - Agents implementing AI intelligence
   - Middleware for error handling and rate limiting"

---

## MULTI-AGENT SYSTEM (1 minute)

**[Show agent files in IDE]**

"The heart of this system is the multi-agent architecture:

**Router Agent** - The parent agent that:
- Analyzes incoming customer queries
- Classifies intent into: support, order, or billing
- Delegates to the appropriate specialized agent
- Handles fallback for unclassified queries

**Three Specialized Sub-Agents:**

1. **Support Agent** - Handles general inquiries, FAQs, and troubleshooting
   - Tool: `query_conversation_history` - Accesses previous conversations for context

2. **Order Agent** - Handles order status, tracking, and modifications
   - Tool: `fetch_order_details` - Retrieves order information from database
   - Tool: `check_delivery_status` - Gets real-time tracking information

3. **Billing Agent** - Handles payments, refunds, and invoices
   - Tool: `get_invoice_details` - Fetches invoice information
   - Tool: `check_refund_status` - Checks refund request status

Each agent uses **Google Gemini API** for natural language understanding and can call tools to fetch real data from the SQLite database."

---

## LIVE DEMO (1.5 minutes)

**[Open browser to http://localhost:5173]**

"Now let me show you the system in action:

### Demo 1: General Support Query
**[Type: "Hi, I need help"]**

"Watch how the router agent analyzes this general query and delegates to the Support Agent. You'll see the streaming response come through word by word."

**[Wait for response]**

"Notice the agent identified this as a support query and provided a helpful greeting with available services."

### Demo 2: Order Tracking Query
**[Type: "Where is my order ORD-002?"]**

"This query contains an order number. The router should identify this as an order-related query..."

**[Wait for response]**

"Perfect! The Order Agent:
1. Recognized this as an order query
2. Called the `fetch_order_details` tool
3. Retrieved real data from the database
4. Provided the order status, tracking number, and estimated delivery date

You can see the tool execution in the backend logs."

**[Show backend terminal with logs]**

"Here you can see:
- The agent classification
- The tool being called: `fetch_order_details`
- The data retrieved from the database
- The final response being generated"

### Demo 3: Billing Query
**[Type: "What's the status of my refund for invoice INV-002?"]**

"Now let's test the Billing Agent..."

**[Wait for response]**

"Excellent! The Billing Agent:
1. Identified this as a billing query
2. Called `check_refund_status` with the invoice number
3. Retrieved the refund information from the database
4. Provided complete details including refund amount, status, and processing date"

### Demo 4: Conversation History
**[Click on a previous conversation in the sidebar]**

"The system also maintains conversation context. All messages are persisted in the database, allowing agents to reference previous interactions."

---

## TECHNICAL FEATURES (45 seconds)

**[Show key files or diagrams]**

"Key technical implementations:

**1. API Endpoints** - RESTful design:
- `POST /api/chat/messages` - Send messages with streaming support
- `GET /api/chat/conversations` - List all conversations
- `GET /api/chat/conversations/:id` - Get conversation history
- `DELETE /api/chat/conversations/:id` - Delete conversation
- Plus agent capability endpoints

**2. Streaming Responses** - Real-time AI responses using:
- ReadableStream API on the backend
- Streaming fetch on the frontend
- Word-by-word display with typing indicators

**3. Error Handling** - Comprehensive middleware:
- Centralized error handler
- Graceful error messages
- Proper HTTP status codes

**4. Rate Limiting** - In-memory rate limiter to prevent abuse

**5. Database Design** - Well-structured schema with:
- Users, Conversations, Messages
- Orders with Delivery tracking
- Invoices with Refunds
- Proper relationships and constraints"

---

## BONUS FEATURES (30 seconds)

"I've also implemented several bonus features:

✅ **Monorepo with Turborepo** - Efficient builds and caching
✅ **Hono RPC Ready** - Shared API types package for end-to-end type safety
✅ **Rate Limiting** - Request throttling middleware
✅ **Streaming with Typing Indicator** - Enhanced UX with random "thinking" words
✅ **Context Management** - Last 20 messages kept for conversation continuity
✅ **Mock Mode** - Demo without API calls for testing

**[Show README.md]**

The README has complete setup instructions, architecture diagrams, and API documentation."

---

## TECH STACK (20 seconds)

"Quick tech stack overview:

**Frontend:** React, TypeScript, Vite
**Backend:** Hono.dev, Node.js
**Database:** SQLite with Prisma ORM
**AI:** Google Gemini API (free tier)
**Infrastructure:** Turborepo monorepo, pnpm
**Development:** TypeScript throughout, ESM modules"

---

## CONCLUSION (15 seconds)

"This project demonstrates:
- Multi-agent AI architecture
- Tool-based data retrieval
- Clean code organization with controller-service pattern
- Production-ready features like error handling and rate limiting
- Complete end-to-end implementation from database to UI

Thank you for watching! The code is available in the GitHub repository with full documentation."

---

## ALTERNATIVE SHORTER VERSION (2-3 minutes)

If you need a shorter video, focus on:
1. Quick intro (15s)
2. Architecture overview (30s)
3. Live demo of all 3 agents (1.5 min)
4. Highlight 2-3 bonus features (30s)
5. Quick tech stack + conclusion (15s)

---

## TIPS FOR RECORDING

1. **Before Recording:**
   - Clear your browser history/cookies for a clean demo
   - Restart the dev servers for clean logs
   - Have the queries pre-typed in a notepad to paste
   - Test everything once before recording

2. **During Recording:**
   - Speak clearly and at a moderate pace
   - Don't apologize for anything
   - If something goes wrong, pause and restart
   - Show enthusiasm - this is impressive work!

3. **What to Show on Screen:**
   - Start with IDE showing project structure
   - Switch to browser for demos
   - Show backend logs when explaining tool calls
   - End with README or architecture diagram

4. **Audio Quality:**
   - Use a good microphone if possible
   - Record in a quiet room
   - Do a 10-second test recording first

---

## KEY POINTS TO EMPHASIZE

✅ Multi-agent architecture (main requirement)
✅ Tool calling with real database queries
✅ Conversation context maintenance
✅ Streaming responses
✅ Clean architecture and error handling
✅ Bonus features (monorepo, rate limiting, etc.)
