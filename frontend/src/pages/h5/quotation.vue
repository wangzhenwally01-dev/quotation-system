<template>
  <view class="quotation-page" :class="'theme-' + designStyle" :style="themeVars">
    <!-- Loading -->
    <view v-if="store.loading" class="loading-state">
      <view class="spinner"></view>
      <text class="loading-text">加载报价方案中...</text>
    </view>

    <!-- Error -->
    <view v-else-if="error" class="error-state">
      <text class="error-icon">!</text>
      <text class="error-text">{{ error }}</text>
    </view>

    <!-- Main Content -->
    <view v-else-if="store.config" class="content">
      <!-- Header -->
      <view class="page-header" :style="{ background: primaryColor }">
        <text class="company-name">{{ store.companyName }}</text>
        <text class="page-title">{{ store.config.client_summary }}</text>
        <text class="page-sub">根据您的需求定制</text>
      </view>

      <!-- Step 1: Executive Count -->
      <StepExecutiveCount
        :executiveCount="store.executiveCount"
        :config="store.config.executive_count"
        :discountRate="store.discountRate"
        :accentColor="accentColor"
        @update:executiveCount="store.setExecutiveCount"
      />

      <!-- Step 2: Setup Fees -->
      <StepSetupFee
        :setupFees="store.setupFees"
        :enabledFeeIds="store.enabledSetupFees"
        :executiveCount="store.executiveCount"
        :accentColor="accentColor"
        @toggleFee="store.toggleSetupFee"
      />

      <!-- Step 3: Monthly Core Services -->
      <StepMonthlyServices
        :services="store.coreServices"
        :enabledServices="store.enabledServices"
        :highlightServices="store.config.recommendation?.highlight_services"
        :accentColor="accentColor"
        @toggle="store.toggleService"
      />

      <!-- Step 4: Optional Addons -->
      <StepOptionalAddons
        :addons="store.optionalAddons"
        :enabledAddonIds="store.enabledAddons"
        :addonQuantities="store.addonQuantities"
        :executiveCount="store.executiveCount"
        :stepNumber="4"
        :accentColor="accentColor"
        @toggle="store.toggleAddon"
        @setQuantity="store.setAddonQuantity"
      />

      <!-- Packages -->
      <PackageShortcuts
        :packages="store.config.packages"
        :selectedPackageId="store.selectedPackageId"
        :monthlyServices="store.coreServices"
        :recommendation="store.config.recommendation"
        :accentColor="accentColor"
        :primaryColor="primaryColor"
        :columns="store.config.display?.layout?.package_columns"
        @select="store.selectPackage"
      />

      <!-- Price Summary -->
      <PriceSummary
        v-if="store.priceBreakdown"
        :breakdown="store.priceBreakdown"
        :executiveCount="store.executiveCount"
        :discountRate="store.discountRate"
        :accentColor="accentColor"
        :primaryColor="primaryColor"
        @generate="showDocument"
      />

      <!-- Recommendation -->
      <view class="recommendation" v-if="store.config.recommendation?.reason">
        <text class="rec-label" :style="{ background: accentColor }">AI推荐</text>
        <text class="rec-text">{{ store.config.recommendation.reason }}</text>
      </view>

      <!-- Footer -->
      <view class="footer">
        <text class="footer-text">此报价由AI根据您的需求智能生成</text>
      </view>

      <!-- Document Modal -->
      <view class="modal-overlay" v-if="showDocModal" @tap="showDocModal = false">
        <view class="modal-content" @tap.stop>
          <view class="modal-header" :style="{ background: primaryColor }">
            <text class="modal-title">报价单预览</text>
            <text class="modal-close" @tap="showDocModal = false">×</text>
          </view>
          <scroll-view scroll-y class="modal-body">
            <view class="doc-section">
              <text class="doc-title">{{ store.title || store.config.client_summary }}</text>
              <text class="doc-company">{{ store.companyName }}</text>
              <text class="doc-date">生成日期：{{ today }}</text>
            </view>

            <!-- Setup Fees -->
            <view class="doc-section" v-if="store.priceBreakdown">
              <text class="doc-subtitle">一、启动费用</text>
              <view v-for="fee in store.setupFees.filter(f => store.enabledSetupFees.includes(f.id))" :key="fee.id" class="doc-line">
                {{ fee.name }}：{{ formatPrice(fee.unit_price) }}{{ fee.per_account ? ' × ' + store.executiveCount + '人 = ' + formatPrice(fee.unit_price * store.executiveCount) : '' }}
              </view>
            </view>

            <!-- Monthly Services -->
            <view class="doc-section" v-if="store.priceBreakdown">
              <text class="doc-subtitle">二、月度服务</text>
              <view v-for="item in store.priceBreakdown.breakdown.filter(b => b.enabled)" :key="item.id" class="doc-line">
                {{ item.name }}：{{ formatPrice(item.unit_price) }}/月 × {{ store.executiveCount }}人 = {{ formatPrice(item.monthly_total) }}/月
              </view>
              <text class="doc-line total" v-if="store.discountRate < 1">
                多人优惠（{{ Math.round(store.discountRate * 100) }}折）后月度合计：{{ formatPrice(store.priceBreakdown?.monthlyTotal || 0) }}/月
              </text>
            </view>

            <!-- Optional Addons -->
            <view class="doc-section" v-if="store.priceBreakdown && store.priceBreakdown.addonTotal > 0">
              <text class="doc-subtitle">三、增值服务</text>
              <view v-for="item in store.priceBreakdown.addonBreakdown.filter(b => b.enabled)" :key="item.id" class="doc-line">
                {{ item.name }}：{{ formatPrice(item.monthly_total) }}
              </view>
            </view>

            <!-- Total -->
            <view class="doc-section">
              <text class="doc-subtitle">{{ store.priceBreakdown && store.priceBreakdown.addonTotal > 0 ? '四' : '三' }}、费用总计</text>
              <text class="doc-line">启动费：{{ formatPrice(store.priceBreakdown?.setupFeeTotal || 0) }}</text>
              <text class="doc-line">首月服务费：{{ formatPrice(store.priceBreakdown?.monthlyTotal || 0) }}</text>
              <text class="doc-line" v-if="store.priceBreakdown && store.priceBreakdown.addonTotal > 0">增值服务费：{{ formatPrice(store.priceBreakdown.addonTotal) }}</text>
              <text class="doc-line grand-total">首月总费用：{{ formatPrice(store.priceBreakdown?.grandTotal || 0) }}</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useQuotationStore } from '../../store/modules/quotation';
import StepExecutiveCount from '../../components/quotation/StepExecutiveCount.vue';
import StepSetupFee from '../../components/quotation/StepSetupFee.vue';
import StepMonthlyServices from '../../components/quotation/StepMonthlyServices.vue';
import StepOptionalAddons from '../../components/quotation/StepOptionalAddons.vue';
import PackageShortcuts from '../../components/quotation/PackageShortcuts.vue';
import PriceSummary from '../../components/quotation/PriceSummary.vue';
import { formatPrice } from '../../utils/price-calculator';

const store = useQuotationStore();
const error = ref('');
const showDocModal = ref(false);

const today = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
});

const primaryColor = computed(() => store.config?.display?.primary_color || '#1a1a1a');
const accentColor = computed(() => store.config?.display?.accent_color || '#e67e22');
const designStyle = computed(() => store.config?.display?.design_style || 'default');

const themeVars = computed(() => ({
  '--primary': primaryColor.value,
  '--accent': accentColor.value,
}));

function loadQuotation(token: string) {
  if (store.config || store.loading || error.value) return;
  store.fetchQuotation(token).catch((err) => {
    error.value = err.message || '加载失败';
  });
}

// Use both onLoad and onMounted to cover all platforms
onLoad((query) => {
  const token = query?.t;
  if (token) {
    loadQuotation(token);
  } else {
    error.value = '无效的报价链接';
  }
});

onMounted(() => {
  if (error.value === '无效的报价链接') return;
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('t');
  if (token) {
    loadQuotation(token);
  } else if (!store.config && !error.value) {
    error.value = '无效的报价链接';
  }
});

function showDocument() {
  showDocModal.value = true;
}
</script>

<style>
.quotation-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100rpx;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 24rpx;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #eee;
  border-top-color: var(--primary, #1a1a1a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text, .error-text {
  font-size: 28rpx;
  color: #999;
}

.error-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #fee;
  color: #e74c3c;
  font-size: 48rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dynamic Header based on primary_color */
.page-header {
  margin: 0;
  padding: 48rpx 32rpx 40rpx;
  color: #fff;
}

.company-name {
  display: block;
  font-size: 24rpx;
  opacity: 0.7;
  margin-bottom: 12rpx;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.page-sub {
  display: block;
  font-size: 24rpx;
  opacity: 0.6;
}

.content > :not(.page-header):not(.modal-overlay):not(.modal-content):not(.footer) {
  margin-left: 24rpx;
  margin-right: 24rpx;
}

/* Recommendation */
.recommendation {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  margin: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.rec-label {
  display: inline-block;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.rec-text {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.7;
}

/* Footer */
.footer {
  text-align: center;
  padding: 40rpx 0 20rpx;
}

.footer-text {
  font-size: 22rpx;
  color: #ccc;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  width: 100%;
  max-height: 85vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  color: #fff;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 700;
}
.modal-close {
  font-size: 48rpx;
  color: rgba(255,255,255,0.7);
  line-height: 1;
}

.modal-body {
  padding: 32rpx;
  max-height: 70vh;
}

.doc-section {
  margin-bottom: 32rpx;
}

.doc-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}
.doc-company {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 4rpx;
}
.doc-date {
  display: block;
  font-size: 24rpx;
  color: #999;
}
.doc-subtitle {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  color: #333;
}
.doc-line {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

.doc-line.total {
  font-weight: 600;
  color: #333;
  margin-top: 8rpx;
}

.doc-line.grand-total {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--primary, #1a1a1a);
  margin-top: 12rpx;
}

/* ===== Design Style: Frosted Glass (黑白毛玻璃) ===== */
.theme-frosted .quotation-page,
.theme-frosted {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
}
.theme-frosted .page-header {
  background: linear-gradient(135deg, #111 0%, #333 100%) !important;
  backdrop-filter: blur(20rpx);
}
.theme-frosted .client-card,
.theme-frosted .package-card,
.theme-frosted .summary-card,
.theme-frosted .recommendation {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}
.theme-frosted .company-name,
.theme-frosted .page-title,
.theme-frosted .page-sub,
.theme-frosted .title,
.theme-frosted .pkg-name,
.theme-frosted .total .label,
.theme-frosted .pv-title {
  color: #fff;
}
.theme-frosted .pkg-desc,
.theme-frosted .rec-text,
.theme-frosted .label,
.theme-frosted .value,
.theme-frosted .pv-name,
.theme-frosted .pv-desc,
.theme-frosted .pv-price,
.theme-frosted .doc-subtitle,
.theme-frosted .doc-line,
.theme-frosted .doc-title {
  color: rgba(255, 255, 255, 0.85);
}
.theme-frosted .footer-text {
  color: rgba(255, 255, 255, 0.3);
}
.theme-frosted .divider {
  background: rgba(255, 255, 255, 0.1);
}

/* ===== Design Style: Cute (动画可爱) ===== */
.theme-cute {
  background: linear-gradient(180deg, #fff0f5 0%, #f0f8ff 50%, #f5f0ff 100%);
}
.theme-cute .page-header {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #a18cd1 100%) !important;
  border-radius: 0 0 40rpx 40rpx;
}
.theme-cute .client-card,
.theme-cute .package-card,
.theme-cute .summary-card,
.theme-cute .recommendation {
  border-radius: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.15);
}
.theme-cute .package-card.active {
  background: #fff5f8;
  border-color: #ff9a9e;
}
.theme-cute .badge {
  border-radius: 20rpx;
}
.theme-cute .rec-label {
  border-radius: 20rpx;
  background: linear-gradient(135deg, #ff9a9e, #a18cd1) !important;
}
.theme-cute .action-btn,
.theme-cute .btn-text {
  border-radius: 50rpx;
}
.theme-cute .spinner {
  border-top-color: #ff9a9e;
}
.theme-cute .doc-line.grand-total {
  color: #e75480;
}

/* ===== Design Style: Tech (科技) ===== */
.theme-tech {
  background: #0a0e17;
}
.theme-tech .page-header {
  background: linear-gradient(135deg, #0a0e17 0%, #1a1f35 50%, #0d1528 100%) !important;
  border-bottom: 2rpx solid rgba(0, 200, 255, 0.2);
}
.theme-tech .page-sub {
  color: rgba(0, 200, 255, 0.6);
}
.theme-tech .client-card,
.theme-tech .package-card,
.theme-tech .summary-card,
.theme-tech .recommendation {
  background: rgba(20, 28, 50, 0.9);
  border: 1rpx solid rgba(0, 200, 255, 0.15);
  box-shadow: 0 0 20rpx rgba(0, 200, 255, 0.05);
}
.theme-tech .company-name,
.theme-tech .page-title,
.theme-tech .title,
.theme-tech .pkg-name,
.theme-tech .total .label,
.theme-tech .pv-title {
  color: #e8edf5;
}
.theme-tech .pkg-desc,
.theme-tech .rec-text,
.theme-tech .label,
.theme-tech .value,
.theme-tech .pv-name,
.theme-tech .pv-desc,
.theme-tech .pv-price,
.theme-tech .doc-subtitle,
.theme-tech .doc-line,
.theme-tech .doc-title {
  color: rgba(200, 215, 240, 0.85);
}
.theme-tech .style-chip.active,
.theme-tech .action-btn.orange {
  background: linear-gradient(135deg, #00c8ff, #0066ff) !important;
}
.theme-tech .rec-label {
  background: linear-gradient(135deg, #00c8ff, #0066ff) !important;
}
.theme-tech .footer-text {
  color: rgba(200, 215, 240, 0.3);
}
.theme-tech .divider {
  background: rgba(0, 200, 255, 0.1);
}
.theme-tech .spinner {
  border-color: rgba(0, 200, 255, 0.15);
  border-top-color: #00c8ff;
}
.theme-tech .doc-line.grand-total {
  color: #00c8ff;
}

/* ===== Design Style: Business (商务) ===== */
.theme-business {
  background: #f0f2f5;
}
.theme-business .page-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%) !important;
}
.theme-business .company-name {
  color: rgba(255, 255, 255, 0.6);
}
.theme-business .page-title {
  font-weight: 800;
  letter-spacing: 2rpx;
}
.theme-business .client-card,
.theme-business .package-card,
.theme-business .summary-card,
.theme-business .recommendation {
  border-radius: 12rpx;
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.04);
}
.theme-business .package-card.active {
  border-color: #1e3a5f;
  border-width: 3rpx;
}
.theme-business .rec-label {
  background: #1e3a5f !important;
}
.theme-business .action-btn,
.theme-business .btn-text {
  border-radius: 8rpx;
}
.theme-business .total-value {
  color: #1e3a5f !important;
}
.theme-business .doc-line.grand-total {
  color: #1e3a5f;
}
.theme-business .divider {
  background: #e2e8f0;
}
</style>
