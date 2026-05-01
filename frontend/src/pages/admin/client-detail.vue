<template>
  <view class="client-detail" v-if="client">
    <!-- Top Bar with Back -->
    <view class="top-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-arrow">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="top-title">{{ client.company_name }}</text>
      <view class="badge" :class="client.status">
        <text>{{ client.status === 'active' ? '活跃' : '已归档' }}</text>
      </view>
    </view>

    <!-- Client Info Card -->
    <view class="info-card">
      <view class="info-grid">
        <view class="info-item" v-if="client.contact_name">
          <text class="info-label">联系人</text>
          <text class="info-value">{{ client.contact_name }}</text>
        </view>
        <view class="info-item" v-if="client.contact_phone">
          <text class="info-label">电话</text>
          <text class="info-value">{{ client.contact_phone }}</text>
        </view>
        <view class="info-item" v-if="client.industry">
          <text class="info-label">行业</text>
          <text class="info-value">{{ client.industry }}</text>
        </view>
        <view class="info-item" v-if="client.budget_range">
          <text class="info-label">预算</text>
          <text class="info-value">{{ client.budget_range }}</text>
        </view>
        <view class="info-item full" v-if="client.goals">
          <text class="info-label">目标</text>
          <text class="info-value">{{ client.goals }}</text>
        </view>
        <view class="info-item full" v-if="client.current_status">
          <text class="info-label">当前情况</text>
          <text class="info-value">{{ client.current_status }}</text>
        </view>
      </view>
    </view>

    <!-- AI Generation -->
    <view class="ai-section">
      <text class="ai-label">方案页面设计风格</text>
      <view class="style-selector">
        <view
          v-for="s in designStyles"
          :key="s.key"
          class="style-chip"
          :class="{ active: selectedDesignStyle === s.key }"
          @tap="selectedDesignStyle = s.key"
        >
          <text class="style-name">{{ s.name }}</text>
        </view>
      </view>
      <view class="action-btn orange" :class="{ disabled: generating }" @tap="generateQuotation">
        <text>{{ generating ? 'AI生成中...' : 'AI生成报价' }}</text>
      </view>
      <view v-if="generating" class="generating-hint">
        <view class="mini-spinner"></view>
        <text class="hint-text">正在生成报价方案，预计需要30秒...</text>
      </view>
    </view>

    <!-- Quotation List -->
    <view class="section" v-if="client.quotations?.length">
      <text class="section-title">报价单 ({{ client.quotations.length }})</text>
      <view
        v-for="q in client.quotations"
        :key="q.id"
        class="quotation-card"
        :class="{ selected: selectedQuotationId === q.id }"
        @tap="selectQuotation(q)"
      >
        <view class="q-top">
          <text class="q-title">{{ q.title || '报价单 #' + q.version }}</text>
          <view class="q-badge" :class="q.status">
            <text>{{ statusLabel(q.status) }}</text>
          </view>
        </view>
        <text class="q-meta">V{{ q.version }} · {{ formatDate(q.created_at) }}</text>

        <!-- Expanded Actions (only for selected) -->
        <view class="q-actions" v-if="selectedQuotationId === q.id">
          <view class="q-btn" @tap.stop="editQuotation(q.id)">
            <text>编辑配置</text>
          </view>
          <view class="q-btn orange-btn" @tap.stop="publishQuotation(q.id)" v-if="q.status === 'draft'">
            <text>发布报价</text>
          </view>
          <view class="q-btn danger-btn" @tap.stop="deleteQuotation(q.id)">
            <text>删除</text>
          </view>
        </view>

        <!-- Share Link (only for published) -->
        <view class="share-section" v-if="selectedQuotationId === q.id && q.status === 'published'">
          <view class="share-row">
            <text class="share-label">客户报价链接（微信内可直接打开）</text>
          </view>
          <view class="link-box">
            <text class="link-text">{{ getShareUrl(q.share_token) }}</text>
          </view>
          <view class="share-btns">
            <view class="q-btn" @tap.stop="copyLink(q.share_token)">
              <text>复制链接</text>
            </view>
            <view class="q-btn orange-btn" @tap.stop="previewH5(q.share_token)">
              <text>预览报价页</text>
            </view>
          </view>
          <text class="share-tip">将链接发送给客户，客户在微信中打开即可选择服务和查看价格</text>
        </view>

        <!-- Inline Preview Config -->
        <view class="inline-preview" v-if="selectedQuotationId === q.id && previewConfig && previewingId === q.id">
          <view class="pv-divider"></view>
          <text class="pv-title">{{ previewConfig.client_summary }}</text>

          <!-- Setup Fees (supports both old single and new array format) -->
          <view class="pv-section" v-if="previewSetupFees.length > 0">
            <text class="pv-label">启动费</text>
            <view v-for="fee in previewSetupFees" :key="fee.id" class="pv-row">
              <view class="pv-left">
                <view class="pv-info">
                  <text class="pv-name">{{ fee.name }}</text>
                  <text class="pv-desc">{{ fee.description }}</text>
                </view>
              </view>
              <text class="pv-price">{{ formatPrice(fee.unit_price) }}{{ fee.per_account ? '/账号' : '' }}</text>
            </view>
          </view>

          <!-- Monthly Services (only core) -->
          <view class="pv-section" v-if="previewCoreServices.length > 0">
            <text class="pv-label">月度服务</text>
            <view v-for="(s, idx) in previewCoreServices" :key="s.id" class="pv-row">
              <view class="pv-left">
                <text class="pv-key">{{ idx + 1 }}</text>
                <view class="pv-info">
                  <text class="pv-name">{{ s.name }}</text>
                  <text class="pv-desc">{{ (s.description || '').substring(0, 30) }}{{ (s.description || '').length > 30 ? '...' : '' }}</text>
                </view>
              </view>
              <text class="pv-price">{{ formatPrice(s.unit_price) }}/月</text>
            </view>
          </view>

          <!-- Optional Addons -->
          <view class="pv-section" v-if="previewAddons.length > 0">
            <text class="pv-label">增值服务</text>
            <view v-for="a in previewAddons" :key="a.id" class="pv-row">
              <view class="pv-left">
                <view class="pv-info">
                  <text class="pv-name">{{ a.name }}</text>
                  <text class="pv-desc">{{ (a.description || '').substring(0, 30) }}</text>
                </view>
              </view>
              <text class="pv-price">{{ formatPrice(a.unit_price) }}{{ a.pricing_mode === 'per_unit' ? '/' + (a.unit_label || '次') : a.pricing_mode === 'per_account' ? '/账号/月' : '/月' }}</text>
            </view>
          </view>

          <!-- Packages -->
          <view class="pv-section" v-if="previewConfig.packages?.length">
            <text class="pv-label">推荐套餐</text>
            <view v-for="p in previewConfig.packages" :key="p.id" class="pv-row">
              <view class="pv-left">
                <text class="pv-name">{{ p.name }}</text>
                <text class="pv-badge" v-if="p.badge">{{ p.badge }}</text>
              </view>
              <text class="pv-price">{{ formatPrice(calcPkgPrice(p)) }}/月</text>
            </view>
          </view>

          <view class="pv-section" v-if="previewConfig.recommendation?.reason">
            <text class="pv-label">AI推荐理由</text>
            <text class="pv-reason">{{ previewConfig.recommendation.reason }}</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../api/request';

const client = ref<any>(null);
const generating = ref(false);
const selectedQuotationId = ref<number | null>(null);
const previewingId = ref(0);
const previewConfig = ref<any>(null);
const selectedDesignStyle = ref('default');
let clientId = '';

const designStyles = [
  { key: 'default', name: '默认' },
  { key: 'frosted', name: '黑白毛玻璃' },
  { key: 'cute', name: '动画可爱' },
  { key: 'tech', name: '科技' },
  { key: 'business', name: '商务' },
];

// Backward-compatible getters for preview
const previewSetupFees = computed(() => {
  if (!previewConfig.value) return [];
  // New format: setup_fees array
  if (previewConfig.value.setup_fees?.length) return previewConfig.value.setup_fees;
  // Old format: single setup_fee
  if (previewConfig.value.setup_fee) {
    return [{ id: 'setup_default', ...previewConfig.value.setup_fee }];
  }
  return [];
});

const previewCoreServices = computed(() => {
  if (!previewConfig.value?.monthly_services) return [];
  return previewConfig.value.monthly_services.filter(
    (s: any) => !s.category || s.category === 'core'
  );
});

const previewAddons = computed(() => {
  if (!previewConfig.value) return [];
  // New format: optional_addons array
  if (previewConfig.value.optional_addons?.length) return previewConfig.value.optional_addons;
  // Old format: check monthly_services for addon category
  return (previewConfig.value.monthly_services || []).filter(
    (s: any) => s.category === 'optional_addon'
  );
});

onLoad((query) => {
  clientId = query?.id || '';
  if (clientId) loadClient();
});

async function loadClient() {
  try {
    client.value = await request(`/clients/${clientId}`);
  } catch (err: any) {
    if (err.message !== '未登录') {
      uni.showToast({ title: '加载失败', icon: 'none' });
    }
  }
}

function goBack() {
  uni.navigateBack();
}

async function generateQuotation() {
  if (generating.value) return;
  generating.value = true;
  try {
    await request('/quotations/generate', {
      method: 'POST',
      data: {
        client_id: parseInt(clientId),
        style: 'professional',
        design_style: selectedDesignStyle.value,
      },
    });
    uni.showToast({ title: '报价生成成功', icon: 'success', duration: 1500 });
    await loadClient();
    // Auto-expand the newest quotation
    if (client.value?.quotations?.length) {
      const newest = client.value.quotations[0];
      selectQuotation(newest);
    }
  } catch (err: any) {
    uni.showToast({ title: err.message || '生成失败，请重试', icon: 'none', duration: 3000 });
  } finally {
    generating.value = false;
  }
}

function selectQuotation(q: any) {
  if (selectedQuotationId.value === q.id) {
    selectedQuotationId.value = null;
    previewingId.value = 0;
    previewConfig.value = null;
    return;
  }
  selectedQuotationId.value = q.id;
  previewConfig.value = null;
  previewingId.value = 0;
  previewQuotation(q.id);
}

async function previewQuotation(id: number) {
  if (previewingId.value === id) {
    previewingId.value = 0;
    return;
  }
  try {
    const res = await request<any>(`/quotations/${id}`);
    previewConfig.value = JSON.parse(res.config_json);
    previewingId.value = id;
  } catch (err: any) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
}

async function deleteQuotation(id: number) {
  uni.showModal({
    title: '删除报价',
    content: '确定删除这份报价单？删除后不可恢复。',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await request(`/quotations/${id}`, { method: 'DELETE' });
        uni.showToast({ title: '已删除', icon: 'success' });
        if (selectedQuotationId.value === id) {
          selectedQuotationId.value = null;
          previewConfig.value = null;
          previewingId.value = 0;
        }
        await loadClient();
      } catch (err: any) {
        uni.showToast({ title: err.message || '删除失败', icon: 'none' });
      }
    },
  });
}

async function publishQuotation(id: number) {
  try {
    await request(`/quotations/${id}/publish`, { method: 'POST' });
    uni.showToast({ title: '已发布', icon: 'success' });
    await loadClient();
  } catch (err: any) {
    uni.showToast({ title: err.message, icon: 'none' });
  }
}

function calcPkgPrice(pkg: any) {
  const services = previewCoreServices.value;
  return (pkg.enabled_services || []).reduce((sum: number, sId: string) => {
    const s = services.find((ms: any) => ms.id === sId);
    return sum + (s?.unit_price || 0);
  }, 0);
}

function editQuotation(id: number) {
  uni.navigateTo({ url: `/pages/admin/quotation-edit?id=${id}` });
}

function getShareUrl(token: string) {
  const baseUrl = window?.location?.origin || 'http://localhost:5173';
  return `${baseUrl}/pages/h5/quotation?t=${token}`;
}

function copyLink(token: string) {
  const url = getShareUrl(token);
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制，可发给客户', icon: 'success' }),
  });
}

function previewH5(token: string) {
  const url = getShareUrl(token);
  window.open(url, '_blank');
}

function formatPrice(amount: number) {
  return '¥' + amount.toLocaleString('zh-CN');
}

function statusLabel(status: string) {
  return { draft: '草稿', published: '已发布', expired: '已过期' }[status] || status;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
</script>

<style>
.client-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 80rpx;
  box-sizing: border-box;
}

/* Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding: 16rpx 0;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 16rpx;
  border-radius: 10rpx;
  background: #fff;
}
.back-arrow { font-size: 32rpx; color: #333; }
.back-text { font-size: 26rpx; color: #333; }
.top-title { flex: 1; font-size: 32rpx; font-weight: 700; }

/* Client Info */
.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.info-item.full { grid-column: span 2; }
.info-label { display: block; font-size: 22rpx; color: #999; margin-bottom: 2rpx; }
.info-value { font-size: 26rpx; color: #333; }
.badge {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}
.badge.active { background: #e8f5e9; color: #2e7d32; }
.badge.archived { background: #f5f5f5; color: #999; }

/* AI Section */
.ai-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.ai-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
  font-weight: 600;
}
.style-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 18rpx;
}
.style-chip {
  padding: 12rpx 20rpx;
  border-radius: 10rpx;
  background: #f5f5f5;
  border: 2rpx solid transparent;
}
.style-chip.active {
  background: #1a1a1a;
  border-color: #1a1a1a;
}
.style-chip.active .style-name { color: #fff; }
.style-name { font-size: 24rpx; color: #333; }

.action-btn.orange {
  background: #e67e22;
  border: none;
  border-radius: 14rpx;
  padding: 24rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}
.action-btn.disabled { opacity: 0.5; }

.generating-hint {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 14rpx;
  padding: 14rpx 18rpx;
  background: #fff8f0;
  border-radius: 10rpx;
}
.mini-spinner {
  width: 26rpx;
  height: 26rpx;
  border: 3rpx solid #f0e0d0;
  border-top-color: #e67e22;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
.hint-text { font-size: 22rpx; color: #e67e22; }

/* Quotation List */
.section { margin-bottom: 32rpx; }
.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.quotation-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  border: 2rpx solid transparent;
  transition: border-color 0.2s;
}
.quotation-card.selected {
  border-color: #1a1a1a;
}
.q-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}
.q-title { font-size: 28rpx; font-weight: 600; }
.q-badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}
.q-badge.draft { background: #fff3e0; color: #e67e22; }
.q-badge.published { background: #e8f5e9; color: #2e7d32; }
.q-badge.expired { background: #f5f5f5; color: #999; }
.q-meta {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.q-actions {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}
.q-btn {
  padding: 12rpx 22rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  background: #f5f5f5;
  color: #333;
}
.q-btn.orange-btn {
  background: #e67e22;
  color: #fff;
}
.q-btn.danger-btn {
  background: #fee;
  color: #e74c3c;
}

/* Share Section */
.share-section {
  margin-top: 12rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #f0f0f0;
}
.share-row { margin-bottom: 8rpx; }
.share-label {
  font-size: 22rpx;
  color: #999;
  font-weight: 600;
}
.link-box {
  background: #f8f8f8;
  padding: 14rpx 18rpx;
  border-radius: 8rpx;
  margin-bottom: 10rpx;
}
.link-text {
  font-size: 22rpx;
  color: #333;
  word-break: break-all;
}
.share-btns {
  display: flex;
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.share-tip {
  display: block;
  font-size: 20rpx;
  color: #999;
  line-height: 1.5;
}

/* Inline Preview */
.inline-preview {
  margin-top: 12rpx;
}
.pv-divider {
  height: 2rpx;
  background: #f0f0f0;
  margin-bottom: 16rpx;
}
.pv-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}
.pv-section {
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.pv-section:last-child { border-bottom: none; }
.pv-label {
  display: block;
  font-size: 22rpx;
  color: #e67e22;
  margin-bottom: 8rpx;
  font-weight: 600;
}
.pv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4rpx 0;
}
.pv-left {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
}
.pv-key {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  background: #1a1a1a;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pv-info { flex: 1; }
.pv-name {
  font-size: 26rpx;
  color: #333;
  display: block;
}
.pv-desc {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-top: 2rpx;
}
.pv-price {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex-shrink: 0;
}
.pv-badge {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  background: #e67e22;
  color: #fff;
  margin-left: 8rpx;
}
.pv-reason {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.7;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
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
  border-bottom: 1rpx solid #eee;
}
.modal-title { font-size: 32rpx; font-weight: 700; }
.modal-close { font-size: 48rpx; color: #999; }
.modal-body { padding: 32rpx; padding-bottom: 60rpx; max-height: 70vh; }
</style>
