import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databasePath: process.env.DATABASE_PATH || './data/quotation.db',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || undefined,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  h5BaseUrl: process.env.H5_BASE_URL || 'http://localhost:5173',
  adminInitPassword: process.env.ADMIN_INIT_PASSWORD || 'admin123',
};
