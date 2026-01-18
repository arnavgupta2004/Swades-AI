import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import prisma from '@swades-ai/db';
import { HTTPException } from 'hono/http-exception';

export const userRoutes = new Hono();

// Helper endpoint to get or create user by email (for demo purposes)
// GET /api/users/by-email?email=john.doe@example.com
userRoutes.get('/by-email', async (c) => {
  const email = c.req.query('email');

  if (!email) {
    throw new HTTPException(400, { message: 'email query parameter is required' });
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create user if doesn't exist (for demo purposes)
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
      },
    });
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});