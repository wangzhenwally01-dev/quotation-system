import { defineStore } from 'pinia';
import type { QuotationConfig, PriceBreakdown, SetupFeeItem, MonthlyServiceConfig } from '../../types/quotation';
import { calculateBreakdown } from '../../utils/price-calculator';
import { request } from '../../api/request';

export const useQuotationStore = defineStore('quotation', {
  state: () => ({
    config: null as QuotationConfig | null,
    executiveCount: 1,
    enabledServices: [] as string[],
    enabledSetupFees: [] as string[],
    enabledAddons: [] as string[],
    addonQuantities: {} as Record<string, number>,
    selectedPackageId: null as string | null,
    loading: false,
    shareToken: '',
    companyName: '',
    title: '',
  }),

  getters: {
    setupFees(state): SetupFeeItem[] {
      if (!state.config) return [];
      if (state.config.setup_fees && state.config.setup_fees.length > 0) {
        return state.config.setup_fees;
      }
      // Fallback: wrap legacy single setup_fee
      if (state.config.setup_fee) {
        return [{
          id: 'setup_default',
          name: state.config.setup_fee.name,
          description: state.config.setup_fee.description,
          unit_price: state.config.setup_fee.unit_price,
          per_account: state.config.setup_fee.per_account,
          mandatory: state.config.setup_fee.mandatory,
          customizable_price: state.config.setup_fee.customizable_price,
          category: 'one_time',
        }];
      }
      return [];
    },

    coreServices(state): MonthlyServiceConfig[] {
      return state.config?.monthly_services?.filter(s => (s.category || 'core') === 'core') || [];
    },

    optionalAddons(state): MonthlyServiceConfig[] {
      return state.config?.optional_addons || [];
    },

    discountRate(state): number {
      if (!state.config) return 1;
      const tiers = [...state.config.executive_count.discount_tiers].sort((a, b) => b.count - a.count);
      const tier = tiers.find(t => state.executiveCount >= t.count);
      return tier ? tier.rate : 1;
    },

    enabledServiceSet(state): Set<string> {
      return new Set(state.enabledServices);
    },

    enabledSetupFeeSet(state): Set<string> {
      return new Set(state.enabledSetupFees);
    },

    enabledAddonSet(state): Set<string> {
      return new Set(state.enabledAddons);
    },

    priceBreakdown(state): PriceBreakdown | null {
      if (!state.config) return null;
      return calculateBreakdown(
        state.config,
        this.executiveCount,
        this.enabledServiceSet,
        this.enabledSetupFeeSet,
        this.enabledAddonSet,
        state.addonQuantities,
      );
    },

    currentDiscountLabel(state): string {
      if (!state.config) return '';
      const tiers = [...state.config.executive_count.discount_tiers].sort((a, b) => b.count - a.count);
      const tier = tiers.find(t => state.executiveCount >= t.count);
      return tier ? tier.label : '';
    },
  },

  actions: {
    async fetchQuotation(token: string) {
      this.loading = true;
      try {
        const res = await request<{
          config: QuotationConfig;
          title: string;
          company_name: string;
        }>(`/public/quotation/${token}`, { auth: false });

        this.config = res.config;
        this.shareToken = token;
        this.companyName = res.company_name;
        this.title = res.title;

        // Initialize defaults
        this.executiveCount = res.config.executive_count.default || 1;

        // Initialize enabled services from core services only
        this.enabledServices = this.coreServices
          .filter(s => s.enabled_by_default)
          .map(s => s.id);

        // Initialize mandatory setup fees as enabled
        this.enabledSetupFees = this.setupFees
          .filter(f => f.mandatory)
          .map(f => f.id);

        // Initialize default-enabled addons
        this.enabledAddons = this.optionalAddons
          .filter(a => a.enabled_by_default)
          .map(a => a.id);

        // Initialize addon quantities
        this.addonQuantities = {};
        for (const addon of this.optionalAddons) {
          this.addonQuantities[addon.id] = 1;
        }
      } finally {
        this.loading = false;
      }
    },

    setExecutiveCount(count: number) {
      if (!this.config) return;
      const { min, max } = this.config.executive_count;
      this.executiveCount = Math.max(min, Math.min(max, count));
    },

    incrementExecutive() {
      this.setExecutiveCount(this.executiveCount + 1);
    },

    decrementExecutive() {
      this.setExecutiveCount(this.executiveCount - 1);
    },

    toggleService(serviceId: string) {
      const idx = this.enabledServices.indexOf(serviceId);
      if (idx >= 0) {
        this.enabledServices.splice(idx, 1);
      } else {
        this.enabledServices.push(serviceId);
      }
      this.selectedPackageId = null;
    },

    toggleSetupFee(feeId: string) {
      const idx = this.enabledSetupFees.indexOf(feeId);
      if (idx >= 0) {
        // Don't allow disabling mandatory fees
        const fee = this.setupFees.find(f => f.id === feeId);
        if (fee?.mandatory) return;
        this.enabledSetupFees.splice(idx, 1);
      } else {
        this.enabledSetupFees.push(feeId);
      }
    },

    toggleAddon(addonId: string) {
      const idx = this.enabledAddons.indexOf(addonId);
      if (idx >= 0) {
        this.enabledAddons.splice(idx, 1);
      } else {
        this.enabledAddons.push(addonId);
      }
    },

    setAddonQuantity(addonId: string, qty: number) {
      this.addonQuantities[addonId] = Math.max(1, qty);
    },

    selectPackage(packageId: string) {
      if (!this.config) return;
      const pkg = this.config.packages.find(p => p.id === packageId);
      if (!pkg) return;

      if (this.selectedPackageId === packageId) {
        this.selectedPackageId = null;
      } else {
        this.selectedPackageId = packageId;
        // Only set core services from package, not addons
        this.enabledServices = pkg.enabled_services.filter(id =>
          this.coreServices.some(s => s.id === id)
        );
      }
    },
  },
});
