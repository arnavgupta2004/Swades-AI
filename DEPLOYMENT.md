# 🚀 Deployment Guide - Vercel

This guide will help you deploy Swades AI to Vercel.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Database** - You'll need a PostgreSQL database (see options below)

---

## 🗄️ Database Setup

**Important:** SQLite won't work on Vercel (serverless functions don't have persistent file storage). You need to use PostgreSQL.

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Click on **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose a region and click **Create**
5. Copy the connection string (you'll need this)

### Option 2: External PostgreSQL Database

You can use:
- **Supabase** (free tier): https://supabase.com
- **Neon** (free tier): https://neon.tech
- **Railway** (free tier): https://railway.app
- Any PostgreSQL hosting service

---

## 📦 Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## 🔧 Step 2: Update Database Schema for PostgreSQL

Update `packages/db/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Note:** You'll need to convert the schema back to PostgreSQL types. Here's what needs changing:

1. **Enum types** - PostgreSQL supports native enums:
```prisma
enum AgentType {
  ROUTER
  SUPPORT
  ORDER
  BILLING
}

enum MessageRole {
  USER
  ASSISTANT
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  IN_TRANSIT
  DELIVERED
  CANCELLED
}

enum DeliveryStatus {
  PENDING
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

enum RefundStatus {
  PENDING
  PROCESSING
  COMPLETED
  REJECTED
}
```

2. **JSON types** - Use `Json` type instead of `String`:
```prisma
model Order {
  items Json  // Instead of String
}

model Invoice {
  items Json  // Instead of String
}
```

3. **Optional fields** - Keep nullable types as-is

**Quick Migration Script:**

Run these commands:

```bash
# 1. Update schema.prisma (see changes above)
cd packages/db

# 2. Generate Prisma client for PostgreSQL
pnpm prisma generate

# 3. Push schema to your PostgreSQL database
DATABASE_URL="your-postgres-connection-string" pnpm prisma db push

# 4. Seed the database
DATABASE_URL="your-postgres-connection-string" pnpm db:seed
```

---

## ⚙️ Step 3: Deploy on Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New" → "Project"**
3. **Import your GitHub repository**
4. **Configure the project:**

   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root of monorepo)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `apps/frontend/dist`
   - **Install Command**: `pnpm install`

5. **Add Environment Variables:**

   Click **Environment Variables** and add:

   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   GEMINI_API_KEY=your-gemini-api-key
   MOCK_MODE=false
   NODE_ENV=production
   FRONTEND_URL=https://your-project.vercel.app
   ```

6. **Click "Deploy"**

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd /path/to/swades-ai
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? swades-ai
# - Directory? ./
# - Override settings? No (or customize)

# Add environment variables
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
vercel env add MOCK_MODE
vercel env add FRONTEND_URL

# Deploy to production
vercel --prod
```

---

## 🔐 Step 4: Configure Environment Variables

In your Vercel project settings, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your PostgreSQL connection string | ✅ Yes |
| `GEMINI_API_KEY` | Your Gemini API key | ✅ Yes |
| `MOCK_MODE` | `false` for production | ❌ Optional |
| `NODE_ENV` | `production` | ✅ Yes |
| `FRONTEND_URL` | Your Vercel deployment URL | ✅ Yes |

**How to get your Vercel URL:**
- After deployment, Vercel will show you the URL
- Format: `https://your-project.vercel.app`
- Add this to `FRONTEND_URL`

**For Gemini API Key:**
- Get from: https://makersuite.google.com/app/apikey

---

## 🏗️ Step 5: Configure Monorepo on Vercel

Vercel automatically detects monorepos, but you may need to configure:

1. **Go to Project Settings → General**
2. **Root Directory**: Leave as `./` (root)
3. **Build & Development Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `cd ../.. && pnpm build`
   - **Output Directory**: `apps/frontend/dist`
   - **Install Command**: `pnpm install`

3. **For Serverless Functions**:
   - Vercel will automatically detect `apps/backend/api/index.ts`
   - Make sure it's using Node.js 20.x runtime

---

## ✅ Step 6: Verify Deployment

After deployment:

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Check health endpoint**: `https://your-project.vercel.app/api/health`
3. **Test the chat interface**
4. **Check Vercel logs** for any errors

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Problem**: `Cannot find module '@swades-ai/db'`

**Solution**: Make sure `pnpm install` runs from the root directory. Update build command:
```json
"buildCommand": "cd ../.. && pnpm install && pnpm build"
```

### Issue: API Routes Not Working

**Problem**: 404 on `/api/*` routes

**Solution**: 
1. Check `vercel.json` rewrites are correct
2. Verify `apps/backend/api/index.ts` exists
3. Check Vercel function logs

### Issue: Database Connection Error

**Problem**: `Prisma Client initialization error`

**Solution**:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Make sure PostgreSQL is accessible (not IP-restricted)
3. Check connection string format: `postgresql://user:pass@host:5432/db?sslmode=require`

### Issue: CORS Errors

**Problem**: Frontend can't call API

**Solution**:
1. Update `FRONTEND_URL` in environment variables
2. In `src/app.ts`, check CORS origin matches your Vercel URL
3. Use `process.env.VERCEL_URL` for automatic detection

### Issue: Prisma Client Not Generated

**Problem**: `@prisma/client did not initialize`

**Solution**:
1. Add to `package.json` root scripts:
   ```json
   "vercel-build": "pnpm install && pnpm db:generate && pnpm build"
   ```
2. Or add to build command: `pnpm install && cd packages/db && pnpm prisma generate && cd ../../ && pnpm build`

---

## 🔄 Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main`
- Create preview deployments for pull requests
- Run builds automatically

---

## 📊 Monitoring

**Vercel Dashboard provides:**
- Function logs
- Build logs
- Analytics
- Environment variables management

**Check Logs:**
1. Go to your project on Vercel
2. Click **Deployments**
3. Click on a deployment
4. Click **Functions** tab to see serverless function logs
5. Click **Runtime Logs** for runtime errors

---

## 🎯 Production Checklist

Before going live:

- [ ] Database migrated to PostgreSQL
- [ ] Environment variables set in Vercel
- [ ] `FRONTEND_URL` points to production URL
- [ ] `MOCK_MODE=false` for real AI responses
- [ ] Health endpoint working: `/api/health`
- [ ] All API routes responding correctly
- [ ] Frontend loading properly
- [ ] Chat interface functional
- [ ] Database seeded with sample data
- [ ] CORS configured correctly
- [ ] Error handling working
- [ ] Rate limiting enabled

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment variables** - All secrets in Vercel dashboard
3. **Enable rate limiting** - Already implemented
4. **Use HTTPS** - Vercel provides automatically
5. **Database connection** - Use SSL: `?sslmode=require`
6. **API keys** - Store in Vercel environment variables only

---

## 📝 Database Migration Script

If you need to convert SQLite data to PostgreSQL:

```bash
# Export from SQLite
sqlite3 packages/db/prisma/data.db .dump > backup.sql

# Then manually migrate data to PostgreSQL
# Or use a migration tool like pgloader
```

---

## 🚀 Quick Deploy Command

```bash
# One command deploy (after setup)
vercel --prod
```

---

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Check build logs
3. Verify environment variables
4. Test API endpoints manually
5. Check database connectivity

---

**Good luck with your deployment! 🎉**
