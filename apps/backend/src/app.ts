// Separate app creation from server startup for Vercel compatibility
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
    origin: process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:5173',
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

export default app;
