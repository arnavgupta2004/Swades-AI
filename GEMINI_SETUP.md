# 🚀 Switch to Gemini API - Setup Guide

The system has been updated to use **Google Gemini API** (free!) instead of OpenAI.

## Step 1: Get Your Free Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

## Step 2: Update Environment Variables

The `.env` file has been updated. Add your Gemini API key:

```bash
# Open .env and replace "your-gemini-api-key-here" with your actual key
GEMINI_API_KEY="paste-your-key-here"
MOCK_MODE="false"
```

## Step 3: Reinstall Dependencies

Run these commands to fix the pnpm store issue and install the Gemini SDK:

```bash
# From the project root
cd "/Users/arnavgupta/Documents/Arnav/Projects/Swades AI"

# Remove node_modules and lock file
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml

# Reinstall everything
pnpm install
```

## Step 4: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
pnpm dev
```

## What Changed?

✅ **Removed**: `openai` package  
✅ **Added**: `@google/generative-ai` package  
✅ **Updated**: All agents now use Gemini 1.5 Flash model  
✅ **Updated**: Environment variable from `OPENAI_API_KEY` to `GEMINI_API_KEY`  

## Mock Mode (Optional)

If you want to test without API calls, set `MOCK_MODE="true"` in `.env`. The system will return simulated responses.

## Benefits of Gemini

- ✅ **Free**: Generous free tier
- ✅ **Fast**: Gemini 1.5 Flash is optimized for speed
- ✅ **Smart**: Great at function calling and tool use
- ✅ **No Credit Card**: No payment method required for free tier

## Test It Out

After setup, try these messages:
- "Hi, I need help"
- "Where is my order ORD-002?"
- "I want a refund for invoice INV-002"

The agents will route your queries and use tools to fetch real data from the database!
