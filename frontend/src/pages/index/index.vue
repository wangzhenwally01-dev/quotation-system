<template>
  <view class="index-page">
    <text class="title">报价系统</text>
    <text class="subtitle">高管IP打造服务报价计算器</text>
    <view class="entry-btn" @tap="goLogin">
      <text>管理员入口</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  // If already logged in, redirect to dashboard
  try {
    const token = uni.getStorageSync('token') || localStorage.getItem('token');
    if (token) {
      uni.redirectTo({ url: '/pages/admin/dashboard' });
      return;
    }
  } catch {}
});

function goLogin() {
  uni.navigateTo({ url: '/pages/admin/login' });
}
</script>

<style>
.index-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: #fff;
  padding: 40rpx;
}

.title {
  font-size: 56rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 80rpx;
}

.entry-btn {
  background: #fff;
  color: #1a1a1a;
  padding: 24rpx 80rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
