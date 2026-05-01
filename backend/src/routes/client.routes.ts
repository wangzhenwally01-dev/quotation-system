import { Router } from 'express';
import { getDb } from '../database/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const { page = '1', pageSize = '20', search = '' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let whereClause = 'WHERE c.admin_id = ?';
  const params: any[] = [req.adminId];

  if (search) {
    whereClause += ' AND (c.company_name LIKE ? OR c.contact_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM clients c ${whereClause}`).get(...params) as any).count;
  const clients = db.prepare(`
    SELECT c.*
    FROM clients c
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ clients, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/', (req: AuthRequest, res) => {
  const db = getDb();
  const { company_name, contact_name, contact_phone, industry, target_audience, current_status, goals, budget_range, notes } = req.body;
  if (!company_name) {
    res.status(400).json({ error: '公司名称不能为空' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO clients (admin_id, company_name, contact_name, contact_phone, industry, target_audience, current_status, goals, budget_range, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.adminId, company_name, contact_name || null, contact_phone || null, industry || null, target_audience || null, current_status || null, goals || null, budget_range || null, notes || null);

  db.save();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

router.get('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId);
  if (!client) {
    res.status(404).json({ error: '客户不存在' });
    return;
  }

  const quotations = db.prepare(`
    SELECT id, title, status, version, share_token, share_url, ai_generated_at, published_at, created_at
    FROM quotations WHERE client_id = ? ORDER BY version DESC
  `).all(req.params.id);

  res.json({ ...client as object, quotations });
});

router.put('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId);
  if (!existing) {
    res.status(404).json({ error: '客户不存在' });
    return;
  }

  const { company_name, contact_name, contact_phone, industry, target_audience, current_status, goals, budget_range, notes, status } = req.body;

  db.prepare(`
    UPDATE clients SET
      company_name = COALESCE(?, company_name),
      contact_name = COALESCE(?, contact_name),
      contact_phone = COALESCE(?, contact_phone),
      industry = COALESCE(?, industry),
      target_audience = COALESCE(?, target_audience),
      current_status = COALESCE(?, current_status),
      goals = COALESCE(?, goals),
      budget_range = COALESCE(?, budget_range),
      notes = COALESCE(?, notes),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND admin_id = ?
  `).run(company_name, contact_name, contact_phone, industry, target_audience, current_status, goals, budget_range, notes, status, req.params.id, req.adminId);

  db.save();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(client);
});

router.delete('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId);
  if (!existing) {
    res.status(404).json({ error: '客户不存在' });
    return;
  }

  db.prepare("UPDATE clients SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  db.save();
  res.json({ success: true });
});

export default router;
