<template>
  <view class="config-editor">
    <view class="page-header">
      <text class="title">编辑报价配置</text>
      <text class="subtitle">{{ companyName }} - {{ quotationTitle }}</text>
    </view>

    <view v-if="loading" class="loading">加载中...</view>

    <view v-else-if="config" class="editor-content">
      <!-- Setup Fee -->
      <view class="section">
        <text class="section-title">启动费设置</text>
        <view class="edit-card">
          <view class="field">
            <text class="label">服务名称</text>
            <input class="form-input" type="text" :value="config.setup_fee.name" @input="config.setup_fee.name = $event.detail.value" />
          </view>
          <view class="field">
            <text class="label">服务描述</text>
            <textarea class="form-textarea" :value="config.setup_fee.description" @input="config.setup_fee.description = $event.detail.value" />
          </view>
          <view class="field row">
            <text class="label">单价（元/账号）</text>
            <input class="form-input price-input" type="number" :value="String(config.setup_fee.unit_price)" @input="config.setup_fee.unit_price = Number($event.detail.value)" />
          </view>
        </view>
      </view>

      <!-- Monthly Services -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">月度服务项目</text>
          <view class="add-btn" @tap="addService">
            <text>+ 新增</text>
          </view>
        </view>

        <view v-for="(service, index) in config.monthly_services" :key="index" class="edit-card service-card">
          <view class="card-header">
            <input class="key-input" type="text" :value="service.key" @input="service.key = $event.detail.value" placeholder="A" />
            <text class="service-index">#{{ index + 1 }}</text>
            <view class="delete-btn" @tap="removeService(index)">
              <text>删除</text>
            </view>
          </view>
          <view class="field">
            <text class="label">服务名称</text>
            <input class="form-input" type="text" :value="service.name" @input="service.name = $event.detail.value" />
          </view>
          <view class="field">
            <text class="label">服务描述</text>
            <textarea class="form-textarea" :value="service.description" @input="service.description = $event.detail.value" />
          </view>
          <view class="field row">
            <text class="label">月费单价（元/月）</text>
            <input class="form-input price-input" type="number" :value="String(service.unit_price)" @input="service.unit_price = Number($event.detail.value)" />
          </view>
          <view class="field row">
            <text class="label">默认开启</text>
            <switch :checked="service.enabled_by_default" @change="service.enabled_by_default = $event.detail.value" />
          </view>
        </view>
      </view>

      <!-- Packages -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">套餐组合</text>
          <view class="add-btn" @tap="addPackage">
            <text>+ 新增</text>
          </view>
        </view>

        <view v-for="(pkg, index) in config.packages" :key="index" class="edit-card package-card">
          <view class="card-header">
            <text class="package-name">套餐 {{ index + 1 }}</text>
            <view class="delete-btn" @tap="removePackage(index)">
              <text>删除</text>
            </view>
          </view>
          <view class="field">
            <text class="label">套餐名称</text>
            <input class="form-input" type="text" :value="pkg.name" @input="pkg.name = $event.detail.value" />
          </view>
          <view class="field">
            <text class="label">套餐描述</text>
            <input class="form-input" type="text" :value="pkg.description" @input="pkg.description = $event.detail.value" />
          </view>
          <view class="field">
            <text class="label">角标文字（如：最受欢迎）</text>
            <input class="form-input" type="text" :value="pkg.badge" @input="pkg.badge = $event.detail.value" />
          </view>
          <view class="field">
            <text class="label">包含服务</text>
            <view class="checkbox-list">
              <view
                v-for="service in config.monthly_services"
                :key="service.id"
                class="checkbox-item"
                :class="{ checked: pkg.enabled_services.includes(service.id) }"
                @tap="togglePackageService(pkg, service.id)"
              >
                <text class="checkbox-key">{{ service.key }}</text>
                <text>{{ service.name }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Discount Tiers -->
      <view class="section">
        <text class="section-title">折扣规则</text>
        <view v-for="(tier, index) in config.executive_count.discount_tiers" :key="index" class="edit-card tier-card">
          <view class="tier-row">
            <view class="field half">
              <text class="label">人数 ≥</text>
              <input class="form-input" type="number" :value="String(tier.count)" @input="tier.count = Number($event.detail.value)" />
            </view>
            <view class="field half">
              <text class="label">折扣率（如0.9=9折）</text>
              <input class="form-input" type="number" step="0.05" :value="String(tier.rate)" @input="tier.rate = Number($event.detail.value)" />
            </view>
            <view class="field half">
              <text class="label">标签</text>
              <input class="form-input" type="text" :value="tier.label" @input="tier.label = $event.detail.value" />
            </view>
          </view>
        </view>
        <view class="add-btn small" @tap="addTier">
          <text>+ 新增折扣层级</text>
        </view>
      </view>

      <!-- Recommendation -->
      <view class="section">
        <text class="section-title">AI推荐设置</text>
        <view class="edit-card">
          <view class="field">
            <text class="label">推荐套餐</text>
            <picker :value="selectedPackageIndex" :range="config.packages.map(p => p.name)" @change="onRecommendChange">
              <view class="picker-btn">{{ config.recommendation?.package_id ? getConfigPackageName(config.recommendation.package_id) : '请选择' }}</view>
            </picker>
          </view>
          <view class="field">
            <text class="label">推荐理由</text>
            <textarea class="form-textarea" :value="config.recommendation.reason" @input="config.recommendation.reason = $event.detail.value" />
          </view>
        </view>
      </view>

      <!-- Save Button -->
      <view class="save-btn" @tap="saveConfig">
        <text>{{ saving ? '保存中...' : '保存配置' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../api/request';
import type { QuotationConfig, MonthlyServiceConfig, PackageConfig, DiscountTier } from '../../types/quotation';

const config = ref<QuotationConfig | null>(null);
const loading = ref(true);
const saving = ref(false);
const companyName = ref('');
const quotationTitle = ref('');
let quotationId = '';

onLoad((query) => {
  quotationId = query?.id || '';
  if (quotationId) loadQuotation();
});

async function loadQuotation() {
  loading.value = true;
  try {
    const res = await request<any>(`/quotations/${quotationId}`);
    config.value = JSON.parse(res.config_json);
    companyName.value = res.company_name;
    quotationTitle.value = res.title || '';
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function addService() {
  if (!config.value) return;
  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idx = config.value.monthly_services.length;
  config.value.monthly_services.push({
    id: 'service_' + Date.now(),
    key: keys[idx] || String(idx + 1),
    name: '新服务',
    description: '服务描述',
    unit_price: 1000,
    enabled_by_default: false,
    mandatory: false,
  });
}

function removeService(index: number) {
  if (!config.value) return;
  const removed = config.value.monthly_services.splice(index, 1)[0];
  // Remove from packages
  config.value.packages.forEach(pkg => {
    pkg.enabled_services = pkg.enabled_services.filter(id => id !== removed.id);
  });
}

function addPackage() {
  if (!config.value) return;
  config.value.packages.push({
    id: 'pkg_' + Date.now(),
    name: '新套餐',
    description: '套餐描述',
    enabled_services: [],
    badge: '',
  });
}

function removePackage(index: number) {
  if (!config.value) return;
  config.value.packages.splice(index, 1);
}

function togglePackageService(pkg: PackageConfig, serviceId: string) {
  const idx = pkg.enabled_services.indexOf(serviceId);
  if (idx >= 0) {
    pkg.enabled_services.splice(idx, 1);
  } else {
    pkg.enabled_services.push(serviceId);
  }
}

function addTier() {
  if (!config.value) return;
  config.value.executive_count.discount_tiers.push({ count: 5, rate: 0.7, label: '五人 7折' });
}

function getConfigPackageName(id: string) {
  return config.value?.packages.find(p => p.id === id)?.name || id;
}

const selectedPackageIndex = ref(0);
function onRecommendChange(e: any) {
  if (!config.value) return;
  const idx = e.detail.value;
  config.value.recommendation.package_id = config.value.packages[idx]?.id || '';
}

async function saveConfig() {
  if (!config.value) return;
  saving.value = true;
  try {
    await request(`/quotations/${quotationId}/config`, {
      method: 'PUT',
      data: { config_json: config.value, title: config.value.client_summary },
    });
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}
</script>

<style>
.config-editor {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 160rpx;
}

.page-header {
  margin-bottom: 32rpx;
}
.page-header .title { display: block; font-size: 40rpx; font-weight: 700; }
.page-header .subtitle { display: block; font-size: 24rpx; color: #999; margin-top: 8rpx; }

.loading { text-align: center; padding: 120rpx 0; color: #999; font-size: 28rpx; }

.section { margin-bottom: 40rpx; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16rpx;
  display: block;
}
.section-header .section-title { margin-bottom: 0; }

.add-btn {
  background: #1a1a1a;
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
}
.add-btn.small { display: inline-block; margin-top: 12rpx; }

.edit-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.key-input {
  width: 80rpx;
  height: 56rpx;
  background: #1a1a1a;
  color: #fff;
  border-radius: 12rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  pointer-events: auto !important;
  touch-action: manipulation;
  -webkit-appearance: none;
  appearance: none;
}

.service-index { color: #999; font-size: 24rpx; }
.package-name { font-size: 28rpx; font-weight: 600; flex: 1; }

.delete-btn {
  margin-left: auto;
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  background: #fee;
  color: #e74c3c;
  font-size: 22rpx;
}

.field {
  margin-bottom: 20rpx;
}
.field.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.field.half { flex: 1; margin-right: 12rpx; }

.label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}
.field.row .label { margin-bottom: 0; }

.form-input {
  display: block;
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #1a1a1a;
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto !important;
  touch-action: manipulation;
}
.form-input:focus { border-color: #1a1a1a; }
.price-input { width: 200rpx !important; text-align: right; font-weight: 700; }

.form-textarea {
  display: block;
  width: 100%;
  min-height: 100rpx;
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #1a1a1a;
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto !important;
  touch-action: manipulation;
}
.form-textarea:focus { border-color: #1a1a1a; }

.checkbox-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 8rpx;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border-radius: 10rpx;
  background: #f5f5f5;
  font-size: 24rpx;
  color: #666;
  border: 2rpx solid transparent;
}
.checkbox-item.checked {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}
.checkbox-key {
  font-weight: 700;
}

.tier-row {
  display: flex;
  gap: 12rpx;
}

.picker-btn {
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
}

.save-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  color: #fff;
  text-align: center;
  padding: 28rpx;
  font-size: 30rpx;
  font-weight: 600;
  z-index: 100;
}
</style>
