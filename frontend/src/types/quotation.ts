export interface DiscountTier {
  count: number;
  rate: number;
  label: string;
}

export interface ExecutiveCountConfig {
  default: number;
  min: number;
  max: number;
  discount_tiers: DiscountTier[];
}

export interface SetupFeeConfig {
  name: string;
  description: string;
  unit_price: number;
  per_account: boolean;
  mandatory: boolean;
  customizable_price: boolean;
}

export interface SetupFeeItem {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  per_account: boolean;
  mandatory: boolean;
  customizable_price: boolean;
  category: 'one_time' | 'custom';
}

export interface MonthlyServiceConfig {
  id: string;
  key: string;
  name: string;
  description: string;
  unit_price: number;
  enabled_by_default: boolean;
  mandatory: boolean;
  category: 'core' | 'optional_addon';
  group_name?: string;
  pricing_mode: 'fixed' | 'per_account' | 'per_unit';
  unit_label?: string;
}

export interface PackageConfig {
  id: string;
  name: string;
  description: string;
  enabled_services: string[];
  badge: string;
}

export interface RecommendationConfig {
  package_id: string;
  reason: string;
  highlight_services: string[];
}

export interface DisplayLayout {
  service_group_style: 'cards' | 'table' | 'list';
  package_columns: number;
  show_step_numbers: boolean;
  section_order: string[];
}

export interface DisplayConfig {
  primary_color: string;
  accent_color: string;
  currency_symbol: string;
  show_yearly_toggle: boolean;
  design_style?: 'default' | 'frosted' | 'cute' | 'tech' | 'business';
  layout?: DisplayLayout;
}

export interface SchemeTypeConfig {
  id: string;
  name: string;
  description: string;
}

export interface QuotationConfig {
  client_summary: string;
  scheme_type?: SchemeTypeConfig;
  executive_count: ExecutiveCountConfig;
  setup_fee: SetupFeeConfig;
  setup_fees?: SetupFeeItem[];
  monthly_services: MonthlyServiceConfig[];
  packages: PackageConfig[];
  recommendation: RecommendationConfig;
  display: DisplayConfig;
  optional_addons?: MonthlyServiceConfig[];
}

export interface ServiceLineItem {
  id: string;
  name: string;
  unit_price: number;
  enabled: boolean;
  monthly_per_person: number;
  monthly_total: number;
}

export interface PriceBreakdown {
  setupFeeTotal: number;
  monthlySubtotal: number;
  monthlyPerPerson: number;
  executiveDiscount: number;
  monthlyTotal: number;
  addonTotal: number;
  grandTotal: number;
  breakdown: ServiceLineItem[];
  addonBreakdown: ServiceLineItem[];
}
