#!/bin/bash
# Script to prepare project for Vercel deployment

echo "🚀 Preparing Swades AI for Vercel deployment..."

# 1. Update schema to PostgreSQL
echo "📝 Updating Prisma schema for PostgreSQL..."
cd packages/db
cp prisma/schema.prisma prisma/schema.sqlite.prisma.backup
cp prisma/schema.postgresql.prisma prisma/schema.prisma

echo "✅ Schema updated to PostgreSQL"

# 2. Generate Prisma client
echo "🔧 Generating Prisma client..."
cd ../..
pnpm --filter @swades-ai/db prisma generate

echo "✅ Prisma client generated"

echo ""
echo "📋 Next steps:"
echo "1. Set up PostgreSQL database (Vercel Postgres, Supabase, etc.)"
echo "2. Get DATABASE_URL connection string"
echo "3. Push schema to database:"
echo "   DATABASE_URL='your-connection-string' pnpm --filter @swades-ai/db prisma db push"
echo "4. Seed database:"
echo "   DATABASE_URL='your-connection-string' pnpm --filter @swades-ai/db db:seed"
echo "5. Deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "✨ Ready for deployment!"
