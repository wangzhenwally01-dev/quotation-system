<template>
  <view class="packages" v-if="packages.length > 0">
    <view class="packages-header">
      <text class="or-title">或者直接选套餐</text>
    </view>
    <view class="package-list" :style="{ gridTemplateColumns: `repeat(${props.columns || packages.length}, 1fr)` }">
      <view
        v-for="pkg in packages"
        :key="pkg.id"
        class="package-card"
        :class="{ active: selectedPackageId === pkg.id, recommended: pkg.id === recommendation?.package_id }"
        :style="selectedPackageId === pkg.id ? { borderColor: primaryColor } : pkg.id === recommendation?.package_id ? { borderColor: accentColor } : {}"
        @tap="$emit('select', pkg.id)"
      >
        <view class="badge-row" v-if="pkg.badge">
          <text class="badge" :style="{ background: accentColor }">{{ pkg.badge }}</text>
        </view>
        <text class="pkg-name">{{ pkg.name }}</text>
        <text class="pkg-desc">{{ pkg.description }}</text>
        <view class="price-row">
          <text class="pkg-price">¥{{ calculatePackagePrice(pkg) }}</text>
          <text class="pkg-unit">/月</text>
        </view>
        <view class="service-list">
          <text v-for="sId in pkg.enabled_services" :key="sId" class="service-item">
            · {{ getServiceName(sId) }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { PackageConfig, MonthlyServiceConfig, RecommendationConfig } from '../../types/quotation';

const props = defineProps<{
  packages: PackageConfig[];
  selectedPackageId: string | null;
  monthlyServices: MonthlyServiceConfig[];
  recommendation?: RecommendationConfig;
  accentColor?: string;
  primaryColor?: string;
  columns?: number;
}>();

defineEmits<{
  select: [packageId: string];
}>();

function getServiceName(id: string) {
  return props.monthlyServices.find(s => s.id === id)?.name || id;
}

function calculatePackagePrice(pkg: PackageConfig) {
  return pkg.enabled_services.reduce((sum, sId) => {
    const service = props.monthlyServices.find(s => s.id === sId);
    return sum + (service?.unit_price || 0);
  }, 0);
}
</script>

<style>
.packages {
  margin-bottom: 24rpx;
}

.packages-header {
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}

.or-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.package-list {
  display: grid;
  gap: 16rpx;
}

.package-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 18rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
}

.package-card.active {
  background: #fafafa;
}

.badge-row {
  text-align: center;
  margin-bottom: 8rpx;
}

.badge {
  background: #e67e22;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 600;
}

.pkg-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4rpx;
  text-align: center;
}

.pkg-desc {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-bottom: 16rpx;
  line-height: 1.5;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 16rpx;
  justify-content: center;
}

.pkg-price {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.pkg-unit {
  font-size: 22rpx;
  color: #999;
}

.service-list .service-item {
  display: block;
  font-size: 20rpx;
  color: #666;
  line-height: 1.8;
}
</style>
