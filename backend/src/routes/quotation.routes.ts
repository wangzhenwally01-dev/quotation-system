import { Router, Request, Response } from 'express';
import { getDb } from '../database/db';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { generateQuotationConfig, normalizeConfig } from '../services/claude.service';
import { nanoid } from 'nanoid';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const quotations = db.prepare(`
    SELECT q.*, c.company_name, c.contact_name
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    WHERE q.admin_id = ?
    ORDER BY q.created_at DESC
  `).all(req.adminId);
  res.json(quotations);
});

router.post('/generate', async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { client_id, style, scheme_type, design_style } = req.body;
  if (!client_id) {
    res.status(400).json({ error: '请指定客户' });
    return;
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND admin_id = ?').get(client_id, req.adminId) as any;
  if (!client) {
    res.status(404).json({ error: '客户不存在' });
    return;
  }

  try {
    const configJson = await generateQuotationConfig(client, style, undefined, scheme_type);
    // Inject design_style into display if provided
    if (design_style && configJson.display) {
      configJson.display.design_style = design_style;
    }
    const shareToken = nanoid(12);

    const maxVersion = (db.prepare('SELECT MAX(version) as v FROM quotations WHERE client_id = ?').get(client_id) as any).v || 0;

    const result = db.prepare(`
      INSERT INTO quotations (client_id, admin_id, config_json, title, version, share_token, ai_generated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(client_id, req.adminId, JSON.stringify(configJson), configJson.client_summary, maxVersion + 1, shareToken);

    db.save();
    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(quotation);
  } catch (error: any) {
    console.error('AI generation failed:', error);
    res.status(500).json({ error: 'AI生成失败: ' + (error.message || '未知错误') });
  }
});

router.get('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const quotation = db.prepare(`
    SELECT q.*, c.company_name, c.contact_name
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    WHERE q.id = ? AND q.admin_id = ?
  `).get(req.params.id, req.adminId);

  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }
  res.json({
    ...quotation,
    config_json: JSON.stringify(normalizeConfig(JSON.parse(quotation.config_json))),
  });
});

// Update quotation config (manual edit by admin)
router.put('/:id/config', (req: AuthRequest, res) => {
  const db = getDb();
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId) as any;
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  const { config_json, title } = req.body;
  if (!config_json) {
    res.status(400).json({ error: '配置数据不能为空' });
    return;
  }

  // Validate JSON
  try {
    JSON.parse(typeof config_json === 'string' ? config_json : JSON.stringify(config_json));
  } catch {
    res.status(400).json({ error: '配置JSON格式错误' });
    return;
  }

  const configStr = typeof config_json === 'string' ? config_json : JSON.stringify(config_json);
  db.prepare(`
    UPDATE quotations SET
      config_json = ?,
      title = COALESCE(?, title),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND admin_id = ?
  `).run(configStr, title || null, req.params.id, req.adminId);

  db.save();
  const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId) as any;
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  db.prepare('DELETE FROM quotation_views WHERE quotation_id = ?').run(req.params.id);
  db.prepare('DELETE FROM quotations WHERE id = ?').run(req.params.id);
  db.save();
  res.json({ success: true });
});

router.post('/:id/publish', (req: AuthRequest, res) => {
  const db = getDb();
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId) as any;
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  const shareUrl = `${process.env.H5_BASE_URL || 'http://localhost:5173'}/pages/h5/quotation?t=${quotation.share_token}`;

  db.prepare(`
    UPDATE quotations SET status = 'published', share_url = ?, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(shareUrl, req.params.id);

  db.save();
  res.json({ share_url: shareUrl, share_token: quotation.share_token });
});

router.post('/:id/regenerate', async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { style, scheme_type } = req.body || {};
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ? AND admin_id = ?').get(req.params.id, req.adminId) as any;
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(quotation.client_id) as any;
  if (!client) {
    res.status(404).json({ error: '关联客户不存在' });
    return;
  }

  try {
    const configJson = await generateQuotationConfig(client, style, undefined, scheme_type);

    db.prepare(`
      UPDATE quotations SET config_json = ?, title = ?, ai_generated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(configJson), configJson.client_summary, req.params.id);

    db.save();
    const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: '重新生成失败: ' + error.message });
  }
});

// Public endpoint (no auth) - for H5 quotation page
const publicRouter = Router();

publicRouter.get('/quotation/:token', (req: Request, res: Response) => {
  const db = getDb();
  const quotation = db.prepare(`
    SELECT q.id, q.config_json, q.status, q.title, c.company_name
    FROM quotations q
    JOIN clients c ON q.client_id = c.id
    WHERE q.share_token = ?
  `).get(req.params.token) as any;

  if (!quotation || quotation.status !== 'published') {
    res.status(404).json({ error: '报价单不存在或已过期' });
    return;
  }

  // Record view
  db.prepare('INSERT INTO quotation_views (quotation_id, view_ip, user_agent) VALUES (?, ?, ?)').run(
    quotation.id, req.ip, req.get('user-agent')
  );
  db.save();

  res.json({
    config: normalizeConfig(JSON.parse(quotation.config_json)),
    title: quotation.title,
    company_name: quotation.company_name,
  });
});

export { publicRouter };
export default router;
