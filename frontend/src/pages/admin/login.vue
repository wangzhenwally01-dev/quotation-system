<template>
  <view class="login-page">
    <view class="login-header">
      <text class="brand">报价管理系统</text>
      <text class="subtitle">管理员登录</text>
    </view>

    <view class="login-form">
      <view class="field">
        <text class="label">用户名</text>
      </view>
      <view class="input-box">
        <input class="login-input" type="text" placeholder="请输入用户名" @input="onUsernameInput" />
      </view>
      <view class="field">
        <text class="label">密码</text>
      </view>
      <view class="input-box">
        <input class="login-input" type="text" :password="true" placeholder="请输入密码" @input="onPasswordInput" />
      </view>
      <view class="login-btn" @tap="login">
        <text>{{ loading ? '登录中...' : '登录' }}</text>
      </view>
      <text class="error-msg" v-if="errorMsg">{{ errorMsg }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { request } from '../../api/request';

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

function onUsernameInput(e: any) {
  username.value = e.detail.value;
}

function onPasswordInput(e: any) {
  password.value = e.detail.value;
}

async function login() {
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await request<{ token: string; admin: any }>('/auth/login', {
      method: 'POST',
      data: { username: username.value, password: password.value },
      auth: false,
    });
    uni.setStorageSync('token', res.token);
    uni.setStorageSync('admin', JSON.stringify(res.admin));
    // Also store in localStorage for H5 compatibility
    try { localStorage.setItem('token', res.token); } catch {}
    try { localStorage.setItem('admin', JSON.stringify(res.admin)); } catch {}
    uni.redirectTo({ url: '/pages/admin/dashboard' });
  } catch (err: any) {
    errorMsg.value = err.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style>
.login-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 80rpx 48rpx;
  box-sizing: border-box;
}
.login-header { margin-bottom: 80rpx; }
.login-header .brand { display: block; font-size: 44rpx; font-weight: 700; color: #1a1a1a; margin-bottom: 12rpx; }
.login-header .subtitle { font-size: 28rpx; color: #999; }
.field { margin-bottom: 12rpx; }
.field .label { font-size: 26rpx; color: #666; line-height: 1.5; }
.input-box { position: relative; z-index: 10; margin-bottom: 24rpx; }
.login-input {
  display: block; width: 100%; height: 96rpx; line-height: 96rpx;
  background: #ffffff; border-radius: 16rpx; padding: 0 24rpx;
  font-size: 30rpx; color: #1a1a1a; border: 2rpx solid #eeeeee;
  box-sizing: border-box; outline: none;
  -webkit-appearance: none; appearance: none;
  pointer-events: auto !important; touch-action: manipulation;
}
.login-input:focus { border-color: #1a1a1a; }
.login-btn {
  margin-top: 48rpx; background: #1a1a1a; color: #ffffff;
  text-align: center; padding: 28rpx; border-radius: 16rpx;
  font-size: 30rpx; font-weight: 600;
}
.login-btn:active { opacity: 0.8; }
.error-msg { display: block; text-align: center; color: #e74c3c; font-size: 26rpx; margin-top: 24rpx; }
</style>
