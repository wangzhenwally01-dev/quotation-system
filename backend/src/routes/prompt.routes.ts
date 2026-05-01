import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { STYLE_PRESETS } from '../prompts/quotation-generator';

const router = Router();
router.use(authMiddleware);

// List all prompt templates + built-in styles
router.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const templates = db.prepare('SELECT * FROM prompt_templates WHERE admin_id = ? ORDER BY created_at DESC').all(req.adminId);

  // Combine built-in styles with custom templates
  const builtIn = Object.entries(STYLE_PRESETS).map(([key, val]) => ({
    id: 0,
    style_key: key,
    name: val.name,
    description: val.description,
    system_prompt: '',
    pricing_hint: val.pricingHint,
    is_default: 1,
    source: 'builtin',
  }));

  const custom = (templates as any[]).map(t => ({
    ...t,
    source: 'custom',
  }));

  res.json({ built_in: builtIn, custom });
});

// Create custom prompt template
router.post('/', (req: AuthRequest, res) => {
  const db = getDb();
  const { name, style_key, description, system_prompt, pricing_hint } = req.body;

  if (!name || !style_key || !system_prompt) {
    res.status(400).json({ error: '名称、标识和提示词不能为空' });
    return;
  }

  // Check unique style_key
  const existing = db.prepare('SELECT id FROM prompt_templates WHERE style_key = ? AND admin_id = ?').get(style_key, req.adminId);
  if (existing) {
    res.status(400).json({ error: '标识已存在，请使用不同的标识' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO prompt_templates (admin_id, name, style_key, description, system_prompt, pricing_hint)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.adminId, name, style_key, description || '', system_prompt, pricing_hint || '');

  db.save();
  const template = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(template);
});

// Update prompt template
router.put('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const { name, description, system_prompt, pricing_hint } = req.body;

  const template = db.prepare('SELECT * FROM prompt_templates WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId) as any;
  if (!template) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }

  db.prepare(`
    UPDATE prompt_templates SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      system_prompt = COALESCE(?, system_prompt),
      pricing_hint = COALESCE(?, pricing_hint),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND admin_id = ?
  `).run(name || null, description !== undefined ? description : null, system_prompt || null, pricing_hint !== undefined ? pricing_hint : null, req.params.id, req.adminId);

  db.save();
  const updated = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete prompt template
router.delete('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const template = db.prepare('SELECT * FROM prompt_templates WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId);
  if (!template) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }

  db.prepare('DELETE FROM prompt_templates WHERE id = ? AND admin_id = ?').run(req.params.id, req.adminId);
  db.save();
  res.json({ success: true });
});

export default router;
