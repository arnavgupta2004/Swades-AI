# Quick Setup Guide

## Prerequisites

1. **Node.js 18+** - Install Node.js from nodejs.org
2. **pnpm** - Install pnpm: `npm install -g pnpm`
3. **Google Gemini API Key** - Get free key from https://makersuite.google.com/app/apikey

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Database - SQLite (auto-created)
DATABASE_URL="file:./packages/db/prisma/data.db"

# AI - Get free key at https://makersuite.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key-here"

# Optional: Enable mock mode for testing without API
MOCK_MODE="false"

PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

**How to get your free Gemini API key:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste into `.env`

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Create database and push schema
pnpm db:push

# Seed database with sample data
pnpm db:seed
```

The seed script will output user IDs. Note these down for reference:
- `john.doe@example.com` - User ID will be printed
- `jane.smith@example.com` - User ID will be printed

### 4. Start Development Servers

From the root directory:

```bash
pnpm dev
```

This will start both:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

Or start them separately:

```bash
# Terminal 1: Backend
cd apps/backend
pnpm dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev
```

### 5. Test the Application

1. Open http://localhost:5173 in your browser
2. The frontend will automatically fetch the user ID for `john.doe@example.com`
3. Try asking questions like:
   - "Where is my order ORD-002?"
   - "I need a refund for invoice INV-002"
   - "What are your support hours?"
   - "Track my delivery"

## Troubleshooting

### Database Issues

- The SQLite database is auto-created in `packages/db/prisma/data.db`
- If issues occur, delete `data.db` and run `pnpm db:push` again

### Gemini API Issues

- Verify your API key is correct (from https://makersuite.google.com/app/apikey)
- Gemini has a generous free tier (no credit card needed)
- If you hit rate limits, enable mock mode: `MOCK_MODE="true"` in `.env`

### Port Already in Use

- Change `PORT` in `.env` for backend
- Change port in `vite.config.ts` for frontend

### Module Not Found Errors

- Run `pnpm install` again
- Clear node_modules: `rm -rf node_modules apps/*/node_modules packages/*/node_modules`
- Reinstall: `pnpm install`

## Sample Data

The seed script creates:

### Users
- `john.doe@example.com` - John Doe
- `jane.smith@example.com` - Jane Smith

### Orders
- `ORD-001` - Delivered order
- `ORD-002` - In transit order
- `ORD-003` - Processing order
- `ORD-004` - Cancelled order

### Invoices
- `INV-001` - Paid invoice
- `INV-002` - Paid invoice (with refund)
- `INV-003` - Pending invoice

### Sample Conversations
- Order tracking inquiry
- Billing question

You can query these in the chat interface!