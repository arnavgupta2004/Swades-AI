import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from project root FIRST, before any other imports
// When running from apps/backend/src, go up 3 levels to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');
const envPath = resolve(projectRoot, '.env');
config({ path: envPath });

// Also try loading from current working directory as fallback
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
  config({ path: resolve(process.cwd(), '.env') });
}

// Fix DATABASE_URL if it's a relative path - MUST be done before Prisma imports!
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:./')) {
  const dbPath = process.env.DATABASE_URL.replace('file:./', '');
  const absoluteDbPath = resolve(projectRoot, dbPath);
  process.env.DATABASE_URL = `file:${absoluteDbPath}`;
  console.log('📁 Database path resolved to:', process.env.DATABASE_URL);
}

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { chatRoutes } from './routes/chat';
import { agentRoutes } from './routes/agents';
import { healthRoutes } from './routes/health';
import { userRoutes } from './routes/users';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use('/api/*', rateLimiter);

// Routes
app.route('/api/chat', chatRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/users', userRoutes);
app.route('/api', healthRoutes);

// Error handler (must be last)
app.onError(errorHandler);

const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});