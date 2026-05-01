<template>
  <view class="step-setup">
    <view class="step-header">
      <text class="step-num" :style="{ background: accentColor }">2</text>
      <text class="step-title">启动费用</text>
    </view>

    <view v-for="fee in setupFees" :key="fee.id" class="setup-card" :class="{ enabled: isEnabled(fee.id), optional: !fee.mandatory }">
      <view class="card-top">
        <view class="info">
          <view class="name-row">
            <text class="name">{{ fee.name }}</text>
            <view class="badge mandatory" v-if="fee.mandatory" :style="{ background: accentColor }">必选</view>
            <view class="badge optional" v-else>可选</view>
          </view>
          <text class="desc">{{ fee.description }}</text>
        </view>
        <view class="right">
          <view class="price">
            <text class="amount">{{ formatPrice(fee.unit_price) }}</text>
            <text class="unit">{{ fee.per_account ? '元/账号' : '元' }}</text>
          </view>
          <view v-if="!fee.mandatory" class="toggle" :class="{ on: isEnabled(fee.id) }" :style="isEnabled(fee.id) ? { background: accentColor } : {}" @tap="$emit('toggleFee', fee.id)">
            <view class="toggle-dot"></view>
          </view>
        </view>
      </view>
      <view class="calc-row" v-if="isEnabled(fee.id) && fee.per_account && executiveCount > 1">
        <text class="calc-text">合计：{{ formatPrice(fee.unit_price) }} × {{ executiveCount }}人 = {{ formatPrice(fee.unit_price * executiveCount) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { SetupFeeItem } from '../../types/quotation';
import { formatPrice } from '../../utils/price-calculator';

const props = defineProps<{
  setupFees: SetupFeeItem[];
  enabledFeeIds: string[];
  executiveCount: number;
  accentColor?: string;
}>();

defineEmits<{
  toggleFee: [feeId: string];
}>();

function isEnabled(id: string) {
  return props.enabledFeeIds.includes(id);
}
</script>

<style>
.step-setup {
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

.setup-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
}

.setup-card.enabled {
  border-color: #1a1a1a;
}

.setup-card.optional {
  border-style: dashed;
}

.setup-card.optional.enabled {
  border-style: solid;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.info {
  flex: 1;
  margin-right: 24rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: #fff;
}

.badge.mandatory {
  background: #1a1a1a;
}

.badge.optional {
  background: #f0f0f0;
  color: #999;
}

.desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16rpx;
  flex-shrink: 0;
}

.price {
  text-align: right;
}

.amount {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.unit {
  font-size: 22rpx;
  color: #999;
}

.calc-row {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.calc-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
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
