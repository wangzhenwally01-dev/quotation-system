<template>
  <view class="dashboard">
    <view class="dashboard-header">
      <text class="title">客户管理</text>
      <view class="header-actions">
        <view class="add-btn" @tap="goCreate">
          <text>+ 新建</text>
        </view>
      </view>
    </view>

    <view class="search-bar">
      <input class="search-input" type="text" placeholder="搜索客户..." @input="onSearchInput" @confirm="loadClients" />
    </view>

    <view class="client-list">
      <view v-if="clients.length === 0 && !loading" class="empty">
        <text>暂无客户，点击"新建"添加</text>
      </view>
      <view v-for="client in clients" :key="client.id" class="client-card" @tap="goDetail(client.id)">
        <view class="card-top">
          <text class="company">{{ client.company_name }}</text>
          <view class="card-actions">
            <view class="badge" :class="client.status">
              <text>{{ client.status === 'active' ? '活跃' : '已归档' }}</text>
            </view>
            <view class="delete-btn" @tap.stop="deleteClient(client.id, client.company_name)">
              <text>删除</text>
            </view>
          </view>
        </view>
        <view class="card-info">
          <text class="info-item" v-if="client.industry">行业：{{ client.industry }}</text>
          <text class="info-item" v-if="client.contact_name">联系人：{{ client.contact_name }}</text>
          <text class="info-item" v-if="client.budget_range">预算：{{ client.budget_range }}</text>
        </view>
        <view class="card-bottom">
          <text class="time">{{ formatDate(client.created_at) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { request } from '../../api/request';

const clients = ref<any[]>([]);
const search = ref('');
const loading = ref(false);

function onSearchInput(e: any) {
  search.value = e.detail.value;
}

onMounted(() => {
  loadClients();
});

async function loadClients() {
  loading.value = true;
  try {
    const res = await request<{ clients: any[] }>('/clients', {
      data: { search: search.value },
    });
    clients.value = res.clients;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function goCreate() {
  uni.navigateTo({ url: '/pages/admin/client-create' });
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/admin/client-detail?id=${id}` });
}

function deleteClient(id: number, name: string) {
  uni.showModal({
    title: '删除客户',
    content: `确定删除「${name}」？该客户的所有报价单也将被归档。`,
    confirmColor: '#e74c3c',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await request(`/clients/${id}`, { method: 'DELETE' });
        uni.showToast({ title: '已删除', icon: 'success' });
        await loadClients();
      } catch (err: any) {
        uni.showToast({ title: err.message || '删除失败', icon: 'none' });
      }
    },
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
</script>

<style>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.dashboard-header .title {
  font-size: 40rpx;
  font-weight: 700;
}

.dashboard-header .add-btn {
  background: #1a1a1a;
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.header-actions {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.search-bar {
  margin-bottom: 24rpx;
}

.search-input {
  display: block;
  width: 100%;
  background: #fff;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: 2rpx solid #eee;
  box-sizing: border-box;
  pointer-events: auto !important;
  touch-action: manipulation;
  -webkit-appearance: none;
  appearance: none;
}

.empty {
  text-align: center;
  padding: 120rpx 0;
  color: #999;
  font-size: 28rpx;
}

.client-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.card-top .company {
  font-size: 32rpx;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.badge {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.archived {
  background: #f5f5f5;
  color: #999;
}

.delete-btn {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  background: #fee;
  color: #e74c3c;
  font-size: 22rpx;
}

.card-info {
  margin-bottom: 12rpx;
}

.card-info .info-item {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
}

.card-bottom .time {
  font-size: 22rpx;
  color: #ccc;
}
</style>
