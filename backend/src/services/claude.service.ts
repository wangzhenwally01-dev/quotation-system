import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { QuotationConfig, SetupFeeItem, MonthlyServiceItem } from '../types';
import { getSystemPrompt, buildUserPrompt } from '../prompts/quotation-generator';
import { getDb } from '../database/db';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
  baseURL: config.anthropicBaseUrl,
});

/**
 * Normalize config JSON: ensure new fields exist for backward compatibility.
 * Handles old-format configs (single setup_fee, no category on services, etc.)
 */
export function normalizeConfig(raw: any): QuotationConfig {
  const cfg = { ...raw } as QuotationConfig;

  // Convert legacy single setup_fee to setup_fees array
  if (!cfg.setup_fees && cfg.setup_fee) {
    cfg.setup_fees = [{
      id: 'setup_default',
      name: cfg.setup_fee.name,
      description: cfg.setup_fee.description,
      unit_price: cfg.setup_fee.unit_price,
      per_account: cfg.setup_fee.per_account,
      mandatory: cfg.setup_fee.mandatory,
      customizable_price: cfg.setup_fee.customizable_price,
      category: 'one_time',
    }];
  }

  // Ensure each monthly service has required new fields
  if (cfg.monthly_services) {
    cfg.monthly_services = cfg.monthly_services.map((s, i) => ({
      category: 'core' as const,
      group_name: '基础服务',
      pricing_mode: 'fixed' as const,
      ...s,
    }));
  }

  // Separate optional_addons from monthly_services if not already present
  if (!cfg.optional_addons) {
    cfg.optional_addons = [];
    if (cfg.monthly_services) {
      const core: MonthlyServiceItem[] = [];
      const addons: MonthlyServiceItem[] = [];
      for (const s of cfg.monthly_services) {
        if (s.category === 'optional_addon') {
          addons.push(s);
        } else {
          core.push(s);
        }
      }
      cfg.monthly_services = core;
      cfg.optional_addons = addons;
    }
  }

  // Ensure display.layout exists
  if (!cfg.display) {
    cfg.display = { primary_color: '#1a1a1a', accent_color: '#e67e22', currency_symbol: '¥', show_yearly_toggle: false };
  }
  if (!cfg.display.layout) {
    cfg.display.layout = {
      service_group_style: 'cards',
      package_columns: Math.min(cfg.packages?.length || 3, 4),
      show_step_numbers: true,
      section_order: ['setup_fees', 'monthly_services', 'optional_addons', 'packages', 'recommendation'],
    };
  }

  return cfg;
}

export async function generateQuotationConfig(
  client: {
    company_name: string;
    contact_name?: string | null;
    industry?: string | null;
    target_audience?: string | null;
    current_status?: string | null;
    goals?: string | null;
    budget_range?: string | null;
    notes?: string | null;
  },
  styleKey?: string,
  customSystemPrompt?: string,
  schemeType?: string,
): Promise<QuotationConfig> {
  let systemPrompt: string;
  if (customSystemPrompt) {
    systemPrompt = customSystemPrompt;
  } else if (styleKey) {
    const db = getDb();
    const template = db.prepare('SELECT system_prompt FROM prompt_templates WHERE style_key = ?').get(styleKey) as any;
    if (template) {
      systemPrompt = template.system_prompt;
    } else {
      systemPrompt = getSystemPrompt(styleKey);
    }
  } else {
    systemPrompt = getSystemPrompt();
  }

  const response = await anthropic.messages.create({
    model: config.anthropicModel,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: 'user', content: buildUserPrompt(client, styleKey, schemeType) },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from response
  let jsonStr = text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  if (!jsonStr.startsWith('{')) {
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return normalizeConfig(parsed);
  } catch (e) {
    throw new Error('Claude 返回的 JSON 格式解析失败: ' + text.substring(0, 300));
  }
}
