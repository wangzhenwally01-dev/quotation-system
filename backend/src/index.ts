import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase, getDb } from './database/db';
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import quotationRoutes, { publicRouter } from './routes/quotation.routes';
import templateRoutes from './routes/template.routes';
import promptRoutes from './routes/prompt.routes';
import bcrypt from 'bcryptjs';

async function main() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  }));
  app.use(express.json());

  // Initialize database (async for sql.js)
  await initDatabase();
  const db = getDb();

  // Seed default admin if none exists
  const adminCount = (db.prepare('SELECT COUNT(*) as count FROM admins').get() as any).count;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync(config.adminInitPassword, 10);
    db.prepare('INSERT INTO admins (username, password_hash, display_name) VALUES (?, ?, ?)').run('admin', hash, '管理员');
    db.save();
    console.log(`默认管理员已创建: admin / ${config.adminInitPassword}`);
  }

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/quotations', quotationRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/prompts', promptRoutes);
  app.use('/api/public', publicRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.listen(config.port, () => {
    console.log(`报价系统后端已启动: http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});
