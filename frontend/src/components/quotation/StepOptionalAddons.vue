<template>
  <view class="step-addons" v-if="addons.length > 0">
    <view class="step-header">
      <text class="step-num" :style="{ background: accentColor }">{{ stepNumber }}</text>
      <text class="step-title">增值服务（按需选择）</text>
    </view>

    <view
      v-for="addon in addons"
      :key="addon.id"
      class="addon-card"
      :class="{ enabled: isEnabled(addon.id) }"
      :style="isEnabled(addon.id) ? { borderColor: accentColor } : {}"
    >
      <view class="card-content" @tap="$emit('toggle', addon.id)">
        <view class="left">
          <view class="key-badge" :style="isEnabled(addon.id) ? { background: accentColor } : {}">{{ addon.key }}</view>
          <view class="info">
            <text class="name">{{ addon.name }}</text>
            <text class="desc">{{ addon.description }}</text>
            <text class="pricing-mode" v-if="addon.unit_label">
              {{ addon.pricing_mode === 'per_unit' ? '按' + addon.unit_label + '计费' : addon.pricing_mode === 'per_account' ? '按人头计费' : '固定费用' }}
            </text>
          </view>
        </view>
        <view class="right">
          <text class="price">¥{{ addon.unit_price }}</text>
          <text class="unit">/{{ addon.unit_label || '项' }}</text>
          <view class="toggle" :class="{ on: isEnabled(addon.id) }" :style="isEnabled(addon.id) ? { background: accentColor } : {}">
            <view class="toggle-dot"></view>
          </view>
        </view>
      </view>

      <!-- Quantity selector for per_unit addons -->
      <view class="quantity-row" v-if="isEnabled(addon.id) && addon.pricing_mode === 'per_unit'">
        <text class="qty-label">数量</text>
        <view class="stepper">
          <view class="qty-btn" @tap="$emit('setQuantity', addon.id, (addonQuantities[addon.id] || 1) - 1)">
            <text>-</text>
          </view>
          <text class="qty-count">{{ addonQuantities[addon.id] || 1 }}</text>
          <view class="qty-btn plus" :style="{ background: accentColor }" @tap="$emit('setQuantity', addon.id, (addonQuantities[addon.id] || 1) + 1)">
            <text>+</text>
          </view>
        </view>
        <text class="subtotal">小计：¥{{ formatPrice(addon.unit_price * (addonQuantities[addon.id] || 1)) }}</text>
      </view>

      <!-- Per account calculation -->
      <view class="quantity-row" v-if="isEnabled(addon.id) && addon.pricing_mode === 'per_account' && executiveCount > 1">
        <text class="subtotal">合计：¥{{ addon.unit_price }} × {{ executiveCount }}人 = ¥{{ formatPrice(addon.unit_price * executiveCount) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { MonthlyServiceConfig } from '../../types/quotation';
import { formatPrice } from '../../utils/price-calculator';

const props = defineProps<{
  addons: MonthlyServiceConfig[];
  enabledAddonIds: string[];
  addonQuantities: Record<string, number>;
  executiveCount: number;
  stepNumber?: number;
  accentColor?: string;
}>();

defineEmits<{
  toggle: [addonId: string];
  setQuantity: [addonId: string, qty: number];
}>();

function isEnabled(id: string) {
  return props.enabledAddonIds.includes(id);
}
</script>

<style>
.step-addons {
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

.addon-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
}

.addon-card.enabled {
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

.addon-card.enabled .key-badge {
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

.info .pricing-mode {
  display: block;
  font-size: 20rpx;
  color: #e67e22;
  margin-top: 6rpx;
  font-weight: 600;
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

.quantity-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.qty-label {
  font-size: 24rpx;
  color: #666;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.qty-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 12rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.qty-btn.plus {
  color: #fff;
}

.qty-count {
  width: 60rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
}

.subtotal {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
  margin-left: auto;
}
</style>
