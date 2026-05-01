import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database/db';
import { config } from '../config';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '请输入用户名和密码' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
  if (!admin) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = jwt.sign({ adminId: admin.id }, config.jwtSecret, { expiresIn: '7d' });
  res.json({
    token,
    admin: { id: admin.id, username: admin.username, display_name: admin.display_name },
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const admin = db.prepare('SELECT id, username, display_name, phone FROM admins WHERE id = ?').get(req.adminId);
  if (!admin) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json(admin);
});

export default router;
