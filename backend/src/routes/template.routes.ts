import { Router } from 'express';
import { getDb } from '../database/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Get all service templates
router.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const templates = db.prepare(
    'SELECT * FROM service_templates WHERE admin_id = ? ORDER BY sort_order ASC'
  ).all(req.adminId);
  res.json(templates);
});

// Create service template
router.post('/', (req: AuthRequest, res) => {
  const db = getDb();
  const { name, key, description, unit_price, category } = req.body;
  if (!name) {
    res.status(400).json({ error: '服务名称不能为空' });
    return;
  }

  const maxSort = (db.prepare(
    'SELECT MAX(sort_order) as s FROM service_templates WHERE admin_id = ?'
  ).get(req.adminId) as any)?.s || 0;

  const result = db.prepare(`
    INSERT INTO service_templates (admin_id, name, key, description, unit_price, category, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.adminId, name, key || '', description || '', unit_price || 0, category || 'monthly', maxSort + 1);

  db.save();
  const template = db.prepare('SELECT * FROM service_templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(template);
});

// Update service template
router.put('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM service_templates WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId);
  if (!existing) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }

  const { name, key, description, unit_price, category, sort_order } = req.body;
  db.prepare(`
    UPDATE service_templates SET
      name = COALESCE(?, name),
      key = COALESCE(?, key),
      description = COALESCE(?, description),
      unit_price = COALESCE(?, unit_price),
      category = COALESCE(?, category),
      sort_order = COALESCE(?, sort_order),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND admin_id = ?
  `).run(name, key, description, unit_price, category, sort_order, req.params.id, req.adminId);

  db.save();
  const template = db.prepare('SELECT * FROM service_templates WHERE id = ?').get(req.params.id);
  res.json(template);
});

// Delete service template
router.delete('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM service_templates WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId);
  if (!existing) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  db.prepare('DELETE FROM service_templates WHERE id = ? AND admin_id = ?').run(req.params.id, req.adminId);
  db.save();
  res.json({ success: true });
});

export default router;
