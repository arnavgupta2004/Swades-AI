// This file MUST run before any other imports to load .env
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// Load .env from project root
const envPath = resolve(projectRoot, '.env');
console.log('Loading .env from:', envPath);
const result = config({ path: envPath });

// Resolve DATABASE_URL relative path to absolute path
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
  const dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (!dbPath.startsWith('/')) {
    // Relative path - resolve from project root
    const absoluteDbPath = resolve(projectRoot, dbPath);
    process.env.DATABASE_URL = `file:${absoluteDbPath}`;
  }
}

if (result.error) {
  console.error('Failed to load .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NOT SET');
  console.log('MOCK_MODE:', process.env.MOCK_MODE || 'false');
}
