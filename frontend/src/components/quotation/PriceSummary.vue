<template>
  <view class="price-summary" v-if="breakdown">
    <view class="summary-header">
      <text class="title">报价汇总</text>
    </view>

    <view class="summary-card">
      <view class="row" v-if="executiveCount > 1">
        <text class="label">高管人数</text>
        <text class="value">{{ executiveCount }} 人</text>
      </view>

      <view class="row" v-if="discountRate < 1">
        <text class="label">多人折扣</text>
        <text class="value discount" :style="{ color: accentColor }">{{ Math.round(discountRate * 100) }}折 (-{{ Math.round((1 - discountRate) * 100) }}%)</text>
      </view>

      <view class="row">
        <text class="label">启动费（一次性）</text>
        <text class="value">{{ formatPrice(breakdown.setupFeeTotal) }}</text>
      </view>

      <view class="row">
        <text class="label">月度服务费 · 单账号</text>
        <text class="value">{{ formatPrice(breakdown.monthlyPerPerson) }}/月</text>
      </view>

      <view class="row" v-if="executiveCount > 1">
        <text class="label">月度服务费 · 合计</text>
        <text class="value">{{ formatPrice(breakdown.monthlyTotal) }}/月</text>
      </view>

      <view class="row" v-if="breakdown.addonTotal > 0">
        <text class="label">增值服务费</text>
        <text class="value" :style="{ color: accentColor }">{{ formatPrice(breakdown.addonTotal) }}</text>
      </view>

      <view class="divider"></view>

      <view class="row total">
        <text class="label">首月总费用</text>
        <text class="value total-value" :style="{ color: primaryColor }">{{ formatPrice(breakdown.grandTotal) }}</text>
      </view>
    </view>

    <view class="action-btn" :style="{ background: primaryColor }" @tap="$emit('generate')">
      <text class="btn-text">生成报价单文档</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { PriceBreakdown } from '../../types/quotation';
import { formatPrice } from '../../utils/price-calculator';

defineProps<{
  breakdown: PriceBreakdown;
  executiveCount: number;
  discountRate: number;
  accentColor?: string;
  primaryColor?: string;
}>();

defineEmits<{
  generate: [];
}>();
</script>

<style>
.price-summary {
  margin-bottom: 40rpx;
}

.summary-header {
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.summary-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.value {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.discount {
  color: #e67e22;
}

.divider {
  height: 1rpx;
  background: #eee;
  margin: 12rpx 0;
}

.total .label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.total-value {
  font-size: 36rpx;
  font-weight: 700;
}

.action-btn {
  margin-top: 24rpx;
  border-radius: 16rpx;
  padding: 28rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
