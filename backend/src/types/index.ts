export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  admin_id: number;
  company_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  industry: string | null;
  target_audience: string | null;
  current_status: string | null;
  goals: string | null;
  budget_range: string | null;
  notes: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: number;
  client_id: number;
  admin_id: number;
  config_json: string;
  title: string | null;
  status: 'draft' | 'published' | 'expired';
  version: number;
  share_token: string;
  share_url: string | null;
  ai_generated_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Config sub-types ---

export interface SchemeTypeConfig {
  id: string;
  name: string;
  description: string;
}

export interface ExecutiveCountConfig {
  default: number;
  min: number;
  max: number;
  discount_tiers: { count: number; rate: number; label: string }[];
}

// Legacy single setup fee (kept for backward compatibility)
export interface SetupFeeConfig {
  name: string;
  description: string;
  unit_price: number;
  per_account: boolean;
  mandatory: boolean;
  customizable_price: boolean;
}

// New: flexible setup fee item (supports multiple)
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

export interface MonthlyServiceItem {
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

export interface DisplayConfig {
  primary_color: string;
  accent_color: string;
  currency_symbol: string;
  show_yearly_toggle: boolean;
  design_style?: 'default' | 'frosted' | 'cute' | 'tech' | 'business';
  layout?: {
    service_group_style: 'cards' | 'table' | 'list';
    package_columns: number;
    show_step_numbers: boolean;
    section_order: string[];
  };
}

// --- Main config ---

export interface QuotationConfig {
  client_summary: string;
  scheme_type?: SchemeTypeConfig;
  executive_count: ExecutiveCountConfig;
  setup_fee: SetupFeeConfig;
  setup_fees?: SetupFeeItem[];
  monthly_services: MonthlyServiceItem[];
  packages: PackageConfig[];
  recommendation: RecommendationConfig;
  display: DisplayConfig;
  optional_addons?: MonthlyServiceItem[];
}
