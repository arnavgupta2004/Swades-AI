// Vercel serverless function entry point for Hono
import { handle } from 'hono/vercel';
import app from '../src/app';

// Load environment variables (Vercel provides these automatically)
// But we still need to load any local ones during development
if (process.env.NODE_ENV !== 'production') {
  try {
    await import('dotenv/config');
  } catch {
    // dotenv not available, skip
  }
}

export default handle(app);
