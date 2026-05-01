<template>
  <view class="client-create">
    <view class="page-header">
      <text class="title">新建客户</text>
    </view>

    <view class="form">
      <view class="field required">
        <text class="label">公司名称</text>
      </view>
      <view class="input-box">
        <input class="form-input" type="text" placeholder="必填" @input="form.company_name = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">联系人</text>
      </view>
      <view class="input-box">
        <input class="form-input" type="text" placeholder="客户联系人姓名" @input="form.contact_name = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">联系电话</text>
      </view>
      <view class="input-box">
        <input class="form-input" type="text" placeholder="手机号" @input="form.contact_phone = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">行业</text>
      </view>
      <view class="input-box">
        <input class="form-input" type="text" placeholder="如：科技、金融、消费品" @input="form.industry = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">目标受众</text>
      </view>
      <view class="input-box">
        <textarea class="form-textarea" placeholder="客户的目标用户群体" @input="form.target_audience = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">当前情况</text>
      </view>
      <view class="input-box">
        <textarea class="form-textarea" placeholder="客户目前的短视频运营状况" @input="form.current_status = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">客户目标</text>
      </view>
      <view class="input-box">
        <textarea class="form-textarea" placeholder="客户期望达成的目标" @input="form.goals = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">预算范围</text>
      </view>
      <view class="input-box">
        <input class="form-input" type="text" placeholder="如：1-3万/月" @input="form.budget_range = $event.detail.value" />
      </view>

      <view class="field">
        <text class="label">备注</text>
      </view>
      <view class="input-box">
        <textarea class="form-textarea" placeholder="其他需要了解的信息" @input="form.notes = $event.detail.value" />
      </view>

      <view class="submit-btn" @tap="submit">
        <text>{{ submitting ? '创建中...' : '创建客户 & AI生成报价' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { request } from '../../api/request';

const submitting = ref(false);
const form = reactive({
  company_name: '',
  contact_name: '',
  contact_phone: '',
  industry: '',
  target_audience: '',
  current_status: '',
  goals: '',
  budget_range: '',
  notes: '',
});

async function submit() {
  if (!form.company_name) {
    uni.showToast({ title: '请输入公司名称', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const client = await request<any>('/clients', { method: 'POST', data: form });
    uni.showToast({ title: '客户创建成功', icon: 'success' });
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/admin/client-detail?id=${client.id}` });
    }, 1000);
  } catch (err: any) {
    uni.showToast({ title: err.message || '创建失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style>
.client-create {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
  box-sizing: border-box;
}
.page-header { margin-bottom: 32rpx; }
.page-header .title { font-size: 40rpx; font-weight: 700; }
.field { margin-bottom: 8rpx; }
.field .label { font-size: 26rpx; color: #666; line-height: 1.5; }
.field.required .label::before { content: '*'; color: #e74c3c; margin-right: 4rpx; }
.input-box { position: relative; z-index: 10; margin-bottom: 24rpx; }
.form-input {
  display: block; width: 100%; height: 88rpx; line-height: 88rpx;
  background: #ffffff; border-radius: 12rpx; padding: 0 24rpx;
  font-size: 28rpx; color: #1a1a1a; border: 2rpx solid #eeeeee;
  box-sizing: border-box; outline: none;
  -webkit-appearance: none; appearance: none;
  pointer-events: auto !important; touch-action: manipulation;
}
.form-textarea {
  display: block; width: 100%; min-height: 160rpx;
  background: #ffffff; border-radius: 12rpx; padding: 20rpx 24rpx;
  font-size: 28rpx; color: #1a1a1a; border: 2rpx solid #eeeeee;
  box-sizing: border-box; outline: none;
  -webkit-appearance: none; appearance: none;
  pointer-events: auto !important; touch-action: manipulation;
}
.form-input:focus, .form-textarea:focus { border-color: #1a1a1a; }
.submit-btn {
  margin-top: 48rpx; background: #1a1a1a; color: #fff;
  text-align: center; padding: 28rpx; border-radius: 16rpx;
  font-size: 30rpx; font-weight: 600;
}
.submit-btn:active { opacity: 0.8; }
</style>
