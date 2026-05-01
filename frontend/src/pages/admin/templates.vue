<template>
  <view class="templates-page">
    <view class="page-header">
      <text class="title">服务模板库</text>
      <view class="add-btn" @tap="showForm = true; resetForm()">
        <text>+ 新增模板</text>
      </view>
    </view>

    <view class="template-list">
      <view v-if="templates.length === 0" class="empty">
        <text>暂无服务模板，点击"新增模板"创建</text>
      </view>
      <view v-for="tpl in templates" :key="tpl.id" class="template-card" @tap="editTemplate(tpl)">
        <view class="card-top">
          <view class="key-badge">{{ tpl.key || '-' }}</view>
          <view class="info">
            <text class="name">{{ tpl.name }}</text>
            <text class="desc">{{ tpl.description }}</text>
          </view>
          <view class="price">{{ formatPrice(tpl.unit_price) }}<text class="unit">/月</text></view>
        </view>
        <view class="card-bottom">
          <view class="category-badge">{{ tpl.category === 'setup' ? '启动费' : '月度服务' }}</view>
          <view class="delete-btn" @tap.stop="deleteTemplate(tpl.id)">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Add/Edit Modal -->
    <view class="modal-overlay" v-if="showForm" @tap="showForm = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingId ? '编辑模板' : '新增模板' }}</text>
          <text class="modal-close" @tap="showForm = false">×</text>
        </view>
        <view class="modal-body">
          <view class="field">
            <text class="label">服务名称 *</text>
            <input class="input" v-model="form.name" placeholder="如：内容策划" />
          </view>
          <view class="field row-group">
            <view class="field half">
              <text class="label">标识字母</text>
              <input class="input" v-model="form.key" placeholder="A" />
            </view>
            <view class="field half">
              <text class="label">类别</text>
              <picker :value="categoryIndex" :range="['月度服务', '启动费']" @change="onCategoryChange">
                <view class="input picker">{{ categoryIndex === 0 ? '月度服务' : '启动费' }}</view>
              </picker>
            </view>
          </view>
          <view class="field">
            <text class="label">月费单价（元）</text>
            <input class="input" type="number" v-model.number="form.unit_price" placeholder="2000" />
          </view>
          <view class="field">
            <text class="label">服务描述</text>
            <textarea class="textarea" v-model="form.description" placeholder="详细描述这项服务包含什么内容" />
          </view>
          <view class="save-btn" @tap="saveTemplate">
            <text>{{ saving ? '保存中...' : '保存' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { request } from '../../api/request';
import { formatPrice } from '../../utils/price-calculator';

const templates = ref<any[]>([]);
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const categoryIndex = ref(0);

const form = reactive({
  name: '',
  key: '',
  description: '',
  unit_price: 0,
  category: 'monthly',
});

onMounted(() => { loadTemplates(); });

async function loadTemplates() {
  try {
    templates.value = await request<any[]>('/templates');
  } catch (err) {
    console.error(err);
  }
}

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.key = '';
  form.description = '';
  form.unit_price = 0;
  form.category = 'monthly';
  categoryIndex.value = 0;
}

function editTemplate(tpl: any) {
  editingId.value = tpl.id;
  form.name = tpl.name;
  form.key = tpl.key;
  form.description = tpl.description;
  form.unit_price = tpl.unit_price;
  form.category = tpl.category;
  categoryIndex.value = tpl.category === 'setup' ? 1 : 0;
  showForm.value = true;
}

function onCategoryChange(e: any) {
  categoryIndex.value = e.detail.value;
  form.category = e.detail.value === 0 ? 'monthly' : 'setup';
}

async function saveTemplate() {
  if (!form.name) {
    uni.showToast({ title: '请输入服务名称', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await request(`/templates/${editingId.value}`, { method: 'PUT', data: form });
    } else {
      await request('/templates', { method: 'POST', data: form });
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    showForm.value = false;
    await loadTemplates();
  } catch (err: any) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate(id: number) {
  try {
    await request(`/templates/${id}`, { method: 'DELETE' });
    uni.showToast({ title: '已删除', icon: 'success' });
    await loadTemplates();
  } catch (err: any) {
    uni.showToast({ title: err.message, icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.templates-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  .title { font-size: 40rpx; font-weight: 700; }
  .add-btn {
    background: #1a1a1a;
    color: #fff;
    padding: 16rpx 32rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
  }
}

.empty {
  text-align: center;
  padding: 120rpx 0;
  color: #999;
  font-size: 28rpx;
}

.template-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.key-badge {
  width: 52rpx;
  height: 52rpx;
  border-radius: 12rpx;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.info {
  flex: 1;
  .name { display: block; font-size: 28rpx; font-weight: 600; }
  .desc { display: block; font-size: 22rpx; color: #999; margin-top: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.price {
  font-size: 32rpx;
  font-weight: 700;
  flex-shrink: 0;
  .unit { font-size: 22rpx; color: #999; font-weight: normal; }
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f0f0f0;
}

.category-badge {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
  color: #666;
}

.delete-btn {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  background: #fee;
  color: #e74c3c;
  font-size: 22rpx;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.modal-content {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  width: 100%;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #eee;
  .modal-title { font-size: 32rpx; font-weight: 700; }
  .modal-close { font-size: 48rpx; color: #999; }
}
.modal-body { padding: 32rpx; padding-bottom: 60rpx; }

.field { margin-bottom: 24rpx; }
.label { display: block; font-size: 24rpx; color: #666; margin-bottom: 8rpx; }
.input {
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  width: 100%;
  box-sizing: border-box;
}
.textarea {
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  min-height: 120rpx;
  width: 100%;
  box-sizing: border-box;
}
.row-group { display: flex; gap: 16rpx; }
.half { flex: 1; }
.picker { display: flex; align-items: center; }

.save-btn {
  background: #1a1a1a;
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  margin-top: 16rpx;
}
</style>
