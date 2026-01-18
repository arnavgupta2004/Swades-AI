# ⚡ Quick Start - Deploy to Vercel

## 🎯 Quick Deployment Steps

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 2. Setup PostgreSQL Database

**Option A: Vercel Postgres (Easiest)**
1. Create project on Vercel
2. Go to **Storage** tab → **Create Database** → **Postgres**
3. Copy the connection string

**Option B: External Service (Free)**
- **Supabase**: https://supabase.com (sign up → create project → get connection string)
- **Neon**: https://neon.tech (sign up → create project → get connection string)

### 3. Update Database Schema for PostgreSQL

Run this once to prepare the schema:

```bash
# Backup current SQLite schema
cp packages/db/prisma/schema.prisma packages/db/prisma/schema.sqlite.backup

# Copy PostgreSQL schema
cp packages/db/prisma/schema.postgresql.prisma packages/db/prisma/schema.prisma

# Generate Prisma client
pnpm db:generate
```

### 4. Deploy on Vercel

**Via Dashboard:**
1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `pnpm vercel-build`
   - **Output Directory**: `apps/frontend/dist`
   - **Install Command**: `pnpm install`
5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   GEMINI_API_KEY=your-key
   MOCK_MODE=false
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Click **Deploy**

**Via CLI:**
```bash
npm i -g vercel
vercel login
vercel
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
vercel env add FRONTEND_URL
vercel --prod
```

### 5. Setup Database (After First Deploy)

Once deployed, set up your PostgreSQL database:

```bash
# Push schema to database
DATABASE_URL="your-postgres-connection-string" pnpm db:push

# Seed with sample data
DATABASE_URL="your-postgres-connection-string" pnpm db:seed
```

**Or use Vercel's built-in terminal:**
1. Go to your Vercel project
2. Click **Deployments** → Select latest deployment
3. Click **Functions** → Open terminal
4. Run the commands above

### 6. Update FRONTEND_URL

After deployment, Vercel gives you a URL like `https://your-project.vercel.app`. 

1. Go to **Settings** → **Environment Variables**
2. Add/Update `FRONTEND_URL` with your actual URL
3. Redeploy

---

## ✅ Verify It Works

1. Visit your app: `https://your-project.vercel.app`
2. Check health: `https://your-project.vercel.app/api/health`
3. Test chat interface
4. Check logs in Vercel dashboard

---

## 🔧 Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `GEMINI_API_KEY` - From https://makersuite.google.com/app/apikey
- ✅ `FRONTEND_URL` - Your Vercel app URL (https://...)
- ✅ `MOCK_MODE` - `false` for production
- ✅ `NODE_ENV` - `production`

---

## 🐛 Common Issues

### Build Fails: "Cannot find module"
→ Make sure `vercel-build` script runs `pnpm install` first

### Database Error: "Prisma Client not initialized"
→ Run `pnpm db:generate` during build (included in `vercel-build`)

### 404 on API Routes
→ Check `vercel.json` rewrites are correct
→ Verify `apps/backend/api/index.ts` exists

### CORS Errors
→ Update `FRONTEND_URL` in environment variables
→ Should match your Vercel URL exactly

---

## 📚 Full Documentation

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

---

**That's it! Your app should be live on Vercel! 🚀**
