import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Ensure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set. Please check your .env file.');
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  }
  
  console.log('📁 Prisma connecting to:', process.env.DATABASE_URL.substring(0, 50) + '...');
  
  try {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    return client;
  } catch (error) {
    console.error('❌ Failed to create Prisma client:', error);
    throw error;
  }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

let prisma: PrismaClient;

try {
  prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  throw error;
}

export default prisma;

export * from '@prisma/client';
export * from './types';