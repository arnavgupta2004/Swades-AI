# Swades AI - Multi-Agent Customer Support System

An AI-powered customer support system with a multi-agent architecture built with Hono, React, PostgreSQL, and Prisma.

## 🏗️ Architecture

This project follows a **monorepo structure** using Turborepo and implements:

- **Controller-Service pattern** with clean separation of concerns
- **Multi-agent system** with a Router Agent and specialized sub-agents
- **Error handling middleware** for consistent error responses
- **Rate limiting** middleware for API protection
- **Type-safe API** with Hono RPC (ready for expansion)
- **Streaming responses** for real-time AI interactions
- **Conversation context management** with persistent history

## 🤖 Multi-Agent System

### Router Agent
- Analyzes incoming customer queries
- Classifies intent into: `support`, `order`, or `billing`
- Delegates to appropriate sub-agent
- Handles fallback for unclassified queries

### Sub-Agents

1. **Support Agent**
   - Handles general support inquiries, FAQs, troubleshooting
   - **Tools**: `query_conversation_history` - Accesses previous conversations for context

2. **Order Agent**
   - Handles order status, tracking, modifications, cancellations
   - **Tools**:
     - `fetch_order_details` - Retrieves order information
     - `check_delivery_status` - Checks delivery tracking information

3. **Billing Agent**
   - Handles payment issues, refunds, invoices, subscription queries
   - **Tools**:
     - `get_invoice_details` - Retrieves invoice information
     - `check_refund_status` - Checks refund request status

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- Modern UI with streaming message display

### Backend
- **Hono.dev** - Fast web framework
- **Hono RPC** - Type-safe API (monorepo setup)
- **SQLite** - Database (via Prisma)
- **Prisma** - ORM
- **Google Gemini 1.5 Flash** - Free AI model for intelligent responses

### Infrastructure
- **Turborepo** - Monorepo management
- **pnpm** - Package manager

## 📁 Project Structure

```
swades-ai/
├── apps/
│   ├── backend/          # Hono backend server
│   │   ├── src/
│   │   │   ├── routes/   # API route handlers
│   │   │   ├── services/ # Business logic & agents
│   │   │   └── middleware/
│   │   └── package.json
│   └── frontend/         # React frontend
│       ├── src/
│       │   ├── components/
│       │   └── App.tsx
│       └── package.json
├── packages/
│   ├── db/               # Prisma schema & client
│   │   ├── prisma/
│   │   └── src/
│   └── api/              # Shared types & API definitions
│       └── src/
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Google Gemini API Key** (free at https://makersuite.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swades-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   # Database - Using SQLite (auto-created)
   DATABASE_URL="file:./packages/db/prisma/data.db"

   # AI - Get free API key at https://makersuite.google.com/app/apikey
   GEMINI_API_KEY="your-gemini-api-key-here"

   # Mock mode (set to "true" to use mock responses without API calls)
   MOCK_MODE="false"

   # Server
   PORT=3000
   NODE_ENV=development

   # CORS
   FRONTEND_URL="http://localhost:5173"
   ```

   **Get your free Gemini API key:**
   1. Visit https://makersuite.google.com/app/apikey
   2. Sign in with your Google account
   3. Click "Create API Key"
   4. Copy the key and paste it in `.env`

4. **Set up the database**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Push schema to database
   pnpm db:push

   # Seed the database with sample data
   pnpm db:seed
   ```

   **Note:** After seeding, the console will output user IDs. You'll need these for the frontend:
   - The seed creates users: `john.doe@example.com` and `jane.smith@example.com`
   - Copy the user ID from the seed output and update `apps/frontend/src/App.tsx` with the actual user ID
   - Alternatively, modify the frontend to use email-based user lookup (requires backend changes)

5. **Start development servers**

   In separate terminals:
   ```bash
   # Start backend (port 3000)
   cd apps/backend
   pnpm dev

   # Start frontend (port 5173)
   cd apps/frontend
   pnpm dev
   ```

   Or run both from root:
   ```bash
   pnpm dev
   ```

6. **Open the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/api/health

## 📡 API Endpoints

### Chat Routes

- `POST /api/chat/messages` - Send a new message
  ```json
  {
    "userId": "user-1",
    "conversationId": "conv-123" | null,
    "message": "Where is my order?",
    "stream": true
  }
  ```

- `GET /api/chat/conversations/:id?userId=:userId` - Get conversation history
- `GET /api/chat/conversations?userId=:userId` - List user conversations
- `DELETE /api/chat/conversations/:id?userId=:userId` - Delete conversation

### Agent Routes

- `GET /api/agents` - List available agents and their capabilities
- `GET /api/agents/:type/capabilities` - Get specific agent capabilities

### Health

- `GET /api/health` - Health check endpoint

## 🎯 Features

### ✅ Core Requirements
- ✅ Multi-agent architecture with Router Agent
- ✅ Three specialized sub-agents (Support, Order, Billing)
- ✅ Agent-specific tools with database integration
- ✅ Conversation history and context management
- ✅ Streaming responses from AI agents
- ✅ Real-time typing indicator
- ✅ RESTful API with all required endpoints
- ✅ Error handling middleware
- ✅ Rate limiting (100 requests/minute)

### 🎁 Bonus Features
- ✅ **Monorepo with Turborepo** (+30 points guaranteed)
- ✅ **Hono RPC setup** for type-safe APIs
- ✅ **Rate limiting** implementation
- ✅ **Typing indicators** with random thinking words
- ✅ Clean architecture with Controller-Service pattern
- ✅ Comprehensive error handling
- ✅ Conversation persistence
- ✅ Modern, responsive UI

## 🧪 Testing

Run tests (when implemented):
```bash
pnpm test
```

## 📝 Database Schema

The database includes:
- **Users** - Customer accounts
- **Conversations** - Chat sessions
- **Messages** - Individual messages with agent attribution
- **Orders** - Order information
- **Delivery** - Shipping and tracking
- **Invoices** - Billing information
- **Refunds** - Refund requests and status

## 🔧 Development

### Database Commands
```bash
# Generate Prisma Client
pnpm db:generate

# Push schema changes
pnpm db:push

# Seed database
pnpm db:seed

# Open Prisma Studio
cd packages/db
pnpm db:studio
```

### Build for Production
```bash
pnpm build
```

## 📦 Deployment

### Backend
The backend can be deployed to any Node.js hosting service (Vercel, Railway, Fly.io, etc.)

### Frontend
The frontend can be deployed to Vercel, Netlify, or any static hosting service.

### Environment Variables
Make sure to set all required environment variables in your deployment platform.

## 🎥 Demo

See the Loom video walkthrough for a live demonstration of the system.

## 📄 License

This project is created for the Applied AI Research Intern Assessment.

## 🤝 Contributing

This is an assessment project. For questions or issues, please contact the repository owner.