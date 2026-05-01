<template>
  <view class="step-executive">
    <view class="step-header">
      <text class="step-num" :style="{ background: accentColor }">1</text>
      <text class="step-title">高管人数</text>
    </view>

    <view class="executive-card">
      <view class="card-content">
        <view class="info">
          <text class="name">参与高管数量</text>
          <text class="desc">每位高管独立账号，单独计算</text>
        </view>
        <view class="stepper">
          <view class="btn minus" :class="{ disabled: executiveCount <= config.min }" @tap="decrement">
            <text>-</text>
          </view>
          <text class="count">{{ executiveCount }}</text>
          <view class="btn plus" :style="{ background: accentColor }" :class="{ disabled: executiveCount >= config.max }" @tap="increment">
            <text>+</text>
          </view>
        </view>
      </view>

      <view class="discount-tiers" v-if="config.discount_tiers.length > 1">
        <text class="discount-label">多人优惠</text>
        <view class="tier-list">
          <view
            v-for="tier in config.discount_tiers"
            :key="tier.count"
            class="tier-chip"
            :class="{ active: executiveCount >= tier.count && tier.count > 1, current: isCurrentTier(tier) }"
            :style="isCurrentTier(tier) ? { background: accentColor, color: '#fff' } : {}"
          >
            <text>{{ tier.label }}</text>
          </view>
        </view>
      </view>

      <view class="discount-info" v-if="discountRate < 1">
        <text class="discount-text">
          <text class="highlight" :style="{ color: accentColor }">{{ executiveCount }}人同时合作</text>
          <text> · 享受 </text>
          <text class="highlight" :style="{ color: accentColor }">{{ Math.round((1 - discountRate) * 100) }}% 折扣优惠</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ExecutiveCountConfig } from '../../types/quotation';

const props = defineProps<{
  executiveCount: number;
  config: ExecutiveCountConfig;
  discountRate: number;
  accentColor?: string;
}>();

const emit = defineEmits<{
  'update:executiveCount': [value: number];
}>();

function increment() {
  if (props.executiveCount < props.config.max) {
    emit('update:executiveCount', props.executiveCount + 1);
  }
}

function decrement() {
  if (props.executiveCount > props.config.min) {
    emit('update:executiveCount', props.executiveCount - 1);
  }
}

function isCurrentTier(tier: any) {
  return props.executiveCount >= tier.count && tier.count > 1;
}
</script>

<style>
.step-executive {
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

.executive-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info .name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.info .desc {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.stepper .btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
}

.stepper .btn.minus {
  background: #f0f0f0;
  color: #333;
}

.stepper .btn.plus {
  background: #1a1a1a;
  color: #fff;
}

.stepper .btn.disabled {
  opacity: 0.3;
}

.stepper .count {
  width: 80rpx;
  text-align: center;
  font-size: 48rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.discount-tiers {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.discount-label {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.tier-list {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.tier-chip {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  background: #f5f5f5;
  color: #999;
}

.tier-chip.active {
  background: #fff3e0;
  color: #e67e22;
}

.tier-chip.current {
  background: #e67e22;
  color: #fff;
  font-weight: 600;
}

.discount-info {
  margin-top: 16rpx;
}

.discount-text {
  font-size: 24rpx;
  color: #666;
}

.highlight {
  color: #e67e22;
  font-weight: 600;
}
</style>
