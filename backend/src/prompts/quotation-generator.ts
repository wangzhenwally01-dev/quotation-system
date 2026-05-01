// Base system prompt — always used as foundation
const BASE_SYSTEM_PROMPT = `你是一个报价配置生成器。你的唯一任务是输出一个JSON对象。不要输出任何解释、分析、前言或后记。

输出规则：
1. 你的回复必须以 { 开头，以 } 结尾
2. 不要输出任何其他文字
3. 不要用markdown代码块包裹
4. 直接输出原始JSON

业务背景：
- 我们是提供各类企业服务的公司（包括高管IP打造、出海营销、品牌策划等）
- 服务 = 一次性启动费（可多项）+ 月度服务费（按月）+ 可选增值项（特殊项目单独收费）
- 多人同时签约享受阶梯折扣
- 月度服务包含若干子项，客户可自由选择开关，也可选择推荐套餐一键配置

输出的JSON必须符合此结构：
{
  "client_summary": "方案标题，根据客户行业和需求定制",
  "scheme_type": {
    "id": "方案类型英文标识",
    "name": "方案类型中文名",
    "description": "方案类型简述"
  },
  "executive_count": {
    "default": 1,
    "min": 1,
    "max": 10,
    "discount_tiers": [
      {"count": 1, "rate": 1.0, "label": "单人"},
      {"count": 2, "rate": 0.9, "label": "双人 9折"}
    ]
  },
  "setup_fees": [
    {
      "id": "唯一英文标识",
      "name": "启动服务名称",
      "description": "包含的具体服务内容",
      "unit_price": 5000,
      "per_account": true,
      "mandatory": true,
      "customizable_price": false,
      "category": "one_time"
    }
  ],
  "monthly_services": [
    {
      "id": "英文标识",
      "key": "A",
      "name": "服务名称",
      "description": "详细描述，针对客户行业定制",
      "unit_price": 3000,
      "enabled_by_default": true,
      "mandatory": false,
      "category": "core",
      "group_name": "基础服务",
      "pricing_mode": "fixed",
      "unit_label": "月"
    }
  ],
  "optional_addons": [
    {
      "id": "英文标识",
      "key": "X",
      "name": "特殊项目名称",
      "description": "描述这项增值服务的内容和适用场景",
      "unit_price": 5000,
      "enabled_by_default": false,
      "mandatory": false,
      "category": "optional_addon",
      "group_name": "增值服务",
      "pricing_mode": "per_unit",
      "unit_label": "次"
    }
  ],
  "packages": [
    {
      "id": "英文标识",
      "name": "套餐名称",
      "description": "套餐描述",
      "enabled_services": ["包含的月度服务id"],
      "badge": ""
    }
  ],
  "recommendation": {
    "package_id": "推荐套餐的id",
    "reason": "为这个客户定制的推荐理由",
    "highlight_services": ["重点服务的id"]
  },
  "display": {
    "primary_color": "#1a1a1a",
    "accent_color": "#e67e22",
    "currency_symbol": "¥",
    "show_yearly_toggle": false,
    "layout": {
      "service_group_style": "cards",
      "package_columns": 3,
      "show_step_numbers": true,
      "section_order": ["setup_fees", "monthly_services", "optional_addons", "packages", "recommendation"]
    }
  }
}

字段说明：
- setup_fees：一次性启动费用项，可以有多项（如账号定位费、设备采购费、培训费等）。必选项 mandatory=true，可选项 mandatory=false
- monthly_services：月度常规服务，数量根据行业和业务灵活决定（建议3-8项）。key 按顺序从 A 开始
- optional_addons：可选增值项，指那些可能产生额外费用的特殊服务（如现场指导、差旅、定制内容制作等）。pricing_mode 支持 fixed（固定价）、per_account（按人头）、per_unit（按次/按场）
- packages：套餐组合，数量灵活（建议2-4项），每个套餐包含部分月度服务
- 每项服务描述要针对客户行业定制化，体现专业度
- recommendation.reason 要具体说明为什么推荐这个套餐，结合客户情况

特殊项目判断规则：
- 如果服务需要人员到场（如现场指导、拍摄），应作为 optional_addons
- 如果服务涉及差旅或额外成本，应作为 optional_addons
- 如果某项服务可能按次或按项目收费，应作为 optional_addons
- 标准的月度持续服务放在 monthly_services 中`;

// Built-in style presets — appended to system prompt when selected
export const STYLE_PRESETS: Record<string, { name: string; description: string; suffix: string; pricingHint: string }> = {
  professional: {
    name: '商务专业',
    description: '严谨专业的商务风格，强调ROI和数据驱动',
    suffix: `风格要求：
- 所有文案使用专业商务用语，强调投资回报率(ROI)、转化率、增长数据
- 服务描述突出专业方法论和量化效果
- 套餐命名体现专业度（如：基础版/专业版/旗舰版）
- 推荐理由侧重数据论证和商业价值
- 定价区间偏中高端
- display 主色调用深蓝(#1E3A5F)或深灰(#2D3436)`,
    pricingHint: '定价偏中高端，强调ROI和数据化效果',
  },
  creative: {
    name: '活力创意',
    description: '年轻有活力的创意风格，强调创意和爆款',
    suffix: `风格要求：
- 文案活泼有趣，使用当下流行语和创意表达
- 服务描述突出创意策划能力和爆款打造能力
- 套餐命名有创意感（如：灵感版/爆款版/全能版）
- 推荐理由侧重创意潜力和爆款可能性
- 定价区间偏亲民
- display 主色调用亮色如橙色(#FF6B35)或紫色(#6C5CE7)`,
    pricingHint: '定价偏亲民，强调创意和爆款潜力',
  },
  premium: {
    name: '高端定制',
    description: '高端奢华风格，强调专属定制和VIP服务',
    suffix: `风格要求：
- 文案高端大气，使用"专属""定制""VIP"等尊贵用语
- 服务描述突出一对一专属定制和高端资源
- 套餐命名体现尊贵感（如：臻享版/尊贵版/至尊版）
- 推荐理由侧重专属价值和稀缺资源
- 定价区间偏高端
- display 主色调用黑色(#0A0A0A)配金色(#C9A96E)或深紫(#2D1B69)`,
    pricingHint: '定价偏高端，强调专属定制和尊贵服务',
  },
  starter: {
    name: '轻量入门',
    description: '轻量低门槛风格，强调低风险试水',
    suffix: `风格要求：
- 文案轻松亲切，降低决策门槛，强调"低风险""试水""快速见效"
- 服务描述突出简单易上手、快速启动
- 套餐命名体现轻松感（如：体验版/起步版/畅享版）
- 推荐理由侧重低门槛和快速验证效果
- 定价区间偏低端
- display 主色调用清新色如绿色(#00B894)或蓝色(#0984E3)`,
    pricingHint: '定价偏低，强调低门槛和快速验证',
  },
  annual: {
    name: '年付优惠',
    description: '按年付费模式，总价优惠更大',
    suffix: `风格要求：
- 强调年付优惠，鼓励长期合作
- display 中 show_yearly_toggle 设为 true
- 套餐同时展示月付价和年付价（年付打8折）
- 推荐理由侧重长期合作价值和年付节省金额
- 定价区间适中
- display 主色调用稳重色如深蓝(#2C3E50)或墨绿(#1B5E20)`,
    pricingHint: '展示年付选项，鼓励长期合作',
  },
};

export function getSystemPrompt(styleKey?: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt + '\n\n' + BASE_SYSTEM_PROMPT.split('输出的JSON必须符合此结构：')[0];
  }

  const style = styleKey ? STYLE_PRESETS[styleKey] : null;
  let prompt = BASE_SYSTEM_PROMPT;

  if (style) {
    prompt += '\n\n' + style.suffix;
  }

  return prompt;
}

export function getPricingHint(styleKey?: string): string {
  const style = styleKey ? STYLE_PRESETS[styleKey] : null;
  return style?.pricingHint || '根据客户预算和行业合理定价';
}

export function buildUserPrompt(client: {
  company_name: string;
  contact_name?: string | null;
  industry?: string | null;
  target_audience?: string | null;
  current_status?: string | null;
  goals?: string | null;
  budget_range?: string | null;
  notes?: string | null;
}, styleKey?: string, schemeType?: string): string {
  const pricingHint = getPricingHint(styleKey);

  let prompt = `客户信息：
- 公司：${client.company_name}
- 联系人：${client.contact_name || '未提供'}
- 行业：${client.industry || '未提供'}
- 目标受众：${client.target_audience || '未提供'}
- 当前情况：${client.current_status || '未提供'}
- 客户目标：${client.goals || '未提供'}
- 预算：${client.budget_range || '未提供'}
- 备注：${client.notes || '无'}`;

  if (schemeType) {
    prompt += `\n- 方案类型：${schemeType}`;
  }

  prompt += `\n\n定价指导：${pricingHint}

请根据以上信息直接输出JSON配置。注意：
1. 预算高则定价上浮、推全套；预算低则定价贴近下限、推入门/标准
2. 科技/金融等复杂行业启动费偏高，消费品/生活类偏低
3. 服务描述要针对客户行业定制
4. 推荐理由要具体，结合客户预算和目标
5. 根据行业特点判断哪些服务可能产生额外费用（如现场指导、差旅、定制内容等），放入 optional_addons
6. 根据业务复杂度决定启动费数量（简单业务1项，复杂业务可多项）`;

  return prompt;
}
