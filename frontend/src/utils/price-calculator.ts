import type { QuotationConfig, PriceBreakdown, ServiceLineItem, SetupFeeItem, MonthlyServiceConfig } from '../types/quotation';

export function calculateBreakdown(
  config: QuotationConfig,
  executiveCount: number,
  enabledServiceIds: Set<string>,
  enabledSetupFeeIds: Set<string>,
  enabledAddonIds: Set<string>,
  addonQuantities: Record<string, number>,
): PriceBreakdown {
  // 1. Calculate discount rate
  const tiers = [...config.executive_count.discount_tiers].sort((a, b) => b.count - a.count);
  const applicableTier = tiers.find(t => executiveCount >= t.count);
  const discountRate = applicableTier ? applicableTier.rate : 1.0;

  // 2. Setup fees (supports both old single and new array format)
  const setupFees = config.setup_fees || [];
  let setupFeeTotal = 0;
  for (const fee of setupFees) {
    if (!enabledSetupFeeIds.has(fee.id)) continue;
    if (fee.per_account) {
      setupFeeTotal += fee.unit_price * executiveCount;
    } else {
      setupFeeTotal += fee.unit_price;
    }
  }
  // Fallback: if no setup_fees array or all disabled, use legacy single setup_fee
  if (setupFeeTotal === 0 && setupFees.length === 0 && config.setup_fee) {
    setupFeeTotal = config.setup_fee.unit_price * executiveCount;
  }

  // 3. Monthly core services
  const breakdown: ServiceLineItem[] = (config.monthly_services || []).map(service => {
    const enabled = enabledServiceIds.has(service.id);
    return {
      id: service.id,
      name: service.name,
      unit_price: service.unit_price,
      enabled,
      monthly_per_person: enabled ? service.unit_price : 0,
      monthly_total: enabled ? service.unit_price * executiveCount : 0,
    };
  });

  const monthlySubtotal = breakdown.reduce((sum, item) => sum + item.monthly_per_person, 0);
  const monthlyPerPerson = monthlySubtotal;
  const monthlyTotal = Math.round(monthlySubtotal * executiveCount * discountRate);

  // 4. Optional addons
  const addonBreakdown: ServiceLineItem[] = (config.optional_addons || []).map(addon => {
    const enabled = enabledAddonIds.has(addon.id);
    const qty = addonQuantities[addon.id] || 1;
    let lineTotal = 0;
    if (enabled) {
      if (addon.pricing_mode === 'per_account') {
        lineTotal = addon.unit_price * executiveCount;
      } else if (addon.pricing_mode === 'per_unit') {
        lineTotal = addon.unit_price * qty;
      } else {
        lineTotal = addon.unit_price;
      }
    }
    return {
      id: addon.id,
      name: addon.name,
      unit_price: addon.unit_price,
      enabled,
      monthly_per_person: enabled ? addon.unit_price : 0,
      monthly_total: lineTotal,
    };
  });

  const addonTotal = addonBreakdown.reduce((sum, item) => sum + item.monthly_total, 0);

  const grandTotal = setupFeeTotal + monthlyTotal + addonTotal;

  return {
    setupFeeTotal,
    monthlySubtotal,
    monthlyPerPerson,
    executiveDiscount: discountRate,
    monthlyTotal,
    addonTotal,
    grandTotal,
    breakdown,
    addonBreakdown,
  };
}

export function formatPrice(amount: number, symbol: string = '¥'): string {
  return `${symbol}${amount.toLocaleString('zh-CN')}`;
}
