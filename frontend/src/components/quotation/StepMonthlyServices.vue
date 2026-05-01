<template>
  <view class="step-monthly">
    <view class="step-header">
      <text class="step-num" :style="{ background: accentColor }">3</text>
      <text class="step-title">月度服务（按需叠加）</text>
    </view>

    <view
      v-for="service in services"
      :key="service.id"
      class="service-card"
      :class="{ enabled: isEnabled(service.id), highlighted: isHighlighted(service.id) }"
      :style="isEnabled(service.id) ? { borderColor: accentColor } : isHighlighted(service.id) ? { borderColor: accentColor + '80' } : {}"
      @tap="toggle(service.id)"
    >
      <view class="card-content">
        <view class="left">
          <view class="key-badge" :style="isEnabled(service.id) ? { background: accentColor } : {}">{{ service.key }}</view>
          <view class="info">
            <text class="name">{{ service.name }}</text>
            <text class="desc">{{ service.description }}</text>
          </view>
        </view>
        <view class="right">
          <text class="price">¥{{ service.unit_price }}</text>
          <text class="unit">/月</text>
          <view class="toggle" :class="{ on: isEnabled(service.id) }" :style="isEnabled(service.id) ? { background: accentColor } : {}">
            <view class="toggle-dot"></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { MonthlyServiceConfig } from '../../types/quotation';

const props = defineProps<{
  services: MonthlyServiceConfig[];
  enabledServices: string[];
  highlightServices?: string[];
  accentColor?: string;
}>();

const emit = defineEmits<{
  'toggle': [serviceId: string];
}>();

function isEnabled(id: string) {
  return props.enabledServices.includes(id);
}

function isHighlighted(id: string) {
  return props.highlightServices?.includes(id) || false;
}

function toggle(id: string) {
  emit('toggle', id);
}
</script>

<style>
.step-monthly {
  margin-bottom: 24rpx;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 0 8rpx;
}

.step-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  background: #1a1a1a;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.service-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
}

.service-card.enabled {
  background: #fafafa;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  flex: 1;
  margin-right: 20rpx;
}

.key-badge {
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
  color: #666;
  flex-shrink: 0;
}

.service-card.enabled .key-badge {
  color: #fff;
}

.info .name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6rpx;
}

.info .desc {
  display: block;
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}

.right .price {
  font-size: 28rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.right .unit {
  font-size: 20rpx;
  color: #999;
}

.toggle {
  width: 48rpx;
  height: 28rpx;
  border-radius: 14rpx;
  background: #ddd;
  position: relative;
}

.toggle.on {
  background: #34c759;
}

.toggle-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.15);
}

.toggle.on .toggle-dot {
  transform: translateX(20rpx);
}
</style>
