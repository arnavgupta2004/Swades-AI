// Environment variables are loaded by load-env.ts before this file runs
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