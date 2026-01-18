# Quick Setup Guide

## Prerequisites

1. **PostgreSQL** - Make sure PostgreSQL is installed and running
2. **Node.js 18+** - Install Node.js from nodejs.org
3. **pnpm** - Install pnpm: `npm install -g pnpm`
4. **OpenAI API Key** - Get from https://platform.openai.com/api-keys

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/swades_ai?schema=public"
OPENAI_API_KEY="your-openai-api-key-here"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

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

### Database Connection Issues

- Make sure PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` format
- Ensure the database exists: `createdb swades_ai` (if needed)

### OpenAI API Issues

- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure the API key has access to GPT-4

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