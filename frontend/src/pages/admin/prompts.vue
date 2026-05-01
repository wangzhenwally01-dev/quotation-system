<template>
  <view class="prompts-page">
    <view class="page-header">
      <text class="title">AI报价风格管理</text>
      <view class="add-btn" @tap="showForm = true; resetForm()">
        <text>+ 自定义风格</text>
      </view>
    </view>

    <!-- Built-in Styles -->
    <text class="section-label">内置风格</text>
    <view class="style-list">
      <view v-for="s in builtInStyles" :key="s.style_key" class="style-card builtin">
        <view class="card-top">
          <view class="style-info">
            <text class="style-name">{{ s.name }}</text>
            <text class="style-desc">{{ s.description }}</text>
          </view>
          <view class="builtin-badge">内置</view>
        </view>
        <text class="pricing-hint" v-if="s.pricing_hint">定价策略：{{ s.pricing_hint }}</text>
      </view>
    </view>

    <!-- Custom Styles -->
    <text class="section-label" v-if="customStyles.length">自定义风格</text>
    <view class="style-list">
      <view v-for="s in customStyles" :key="s.id" class="style-card" @tap="editTemplate(s)">
        <view class="card-top">
          <view class="style-info">
            <text class="style-name">{{ s.name }}</text>
            <text class="style-key">{{ s.style_key }}</text>
            <text class="style-desc">{{ s.description || '暂无描述' }}</text>
          </view>
          <view class="delete-btn" @tap.stop="deleteTemplate(s.id)">
            <text>删除</text>
          </view>
        </view>
        <text class="pricing-hint" v-if="s.pricing_hint">定价策略：{{ s.pricing_hint }}</text>
        <view class="prompt-preview">
          <text class="preview-label">提示词预览：</text>
          <text class="preview-text">{{ s.system_prompt?.substring(0, 100) }}...</text>
        </view>
      </view>
    </view>

    <view v-if="!customStyles.length && !builtInStyles.length" class="empty">
      <text>加载中...</text>
    </view>

    <!-- Add/Edit Modal -->
    <view class="modal-overlay" v-if="showForm" @tap="showForm = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingId ? '编辑风格' : '新建自定义风格' }}</text>
          <text class="modal-close" @tap="showForm = false">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="field">
            <text class="label">风格名称 *</text>
            <input class="form-input" type="text" :value="form.name" @input="form.name = $event.detail.value" placeholder="如：科技极客风" />
          </view>
          <view class="field">
            <text class="label">标识（英文，唯一） *</text>
            <input class="form-input" type="text" :value="form.style_key" @input="form.style_key = $event.detail.value" :disabled="!!editingId" placeholder="如：tech_geek" />
          </view>
          <view class="field">
            <text class="label">描述</text>
            <input class="form-input" type="text" :value="form.description" @input="form.description = $event.detail.value" placeholder="简要说明这种风格的特点" />
          </view>
          <view class="field">
            <text class="label">定价策略提示</text>
            <input class="form-input" type="text" :value="form.pricing_hint" @input="form.pricing_hint = $event.detail.value" placeholder="如：定价偏高端，强调专业性" />
          </view>
          <view class="field">
            <text class="label">系统提示词 *（AI会根据此提示词生成报价）</text>
            <textarea class="form-textarea tall" :value="form.system_prompt" @input="form.system_prompt = $event.detail.value" placeholder="在此输入完整的系统提示词..." />
          </view>
          <view class="save-btn" @tap="saveTemplate">
            <text>{{ saving ? '保存中...' : '保存' }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { request } from '../../api/request';

const builtInStyles = ref<any[]>([]);
const customStyles = ref<any[]>([]);
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: '',
  style_key: '',
  description: '',
  pricing_hint: '',
  system_prompt: '',
});

onMounted(() => { loadTemplates(); });

async function loadTemplates() {
  try {
    const res = await request<{ built_in: any[]; custom: any[] }>('/prompts');
    builtInStyles.value = res.built_in;
    customStyles.value = res.custom;
  } catch (err) {
    console.error(err);
  }
}

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.style_key = '';
  form.description = '';
  form.pricing_hint = '';
  form.system_prompt = '';
}

function editTemplate(tpl: any) {
  editingId.value = tpl.id;
  form.name = tpl.name;
  form.style_key = tpl.style_key;
  form.description = tpl.description || '';
  form.pricing_hint = tpl.pricing_hint || '';
  form.system_prompt = tpl.system_prompt || '';
  showForm.value = true;
}

async function saveTemplate() {
  if (!form.name || !form.style_key || !form.system_prompt) {
    uni.showToast({ title: '请填写名称、标识和提示词', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await request(`/prompts/${editingId.value}`, { method: 'PUT', data: form });
    } else {
      await request('/prompts', { method: 'POST', data: form });
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
    await request(`/prompts/${id}`, { method: 'DELETE' });
    uni.showToast({ title: '已删除', icon: 'success' });
    await loadTemplates();
  } catch (err: any) {
    uni.showToast({ title: err.message, icon: 'none' });
  }
}
</script>

<style>
.prompts-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.page-header .title { font-size: 40rpx; font-weight: 700; }
.page-header .add-btn {
  background: #1a1a1a;
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.section-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  font-weight: 600;
  margin-bottom: 12rpx;
  margin-top: 8rpx;
}

.style-list { margin-bottom: 24rpx; }

.style-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.style-card.builtin {
  border-left: 6rpx solid #e67e22;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.style-info { flex: 1; }
.style-name { display: block; font-size: 28rpx; font-weight: 600; }
.style-key {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
  font-family: monospace;
}
.style-desc {
  display: block;
  font-size: 22rpx;
  color: #666;
  margin-top: 6rpx;
}

.builtin-badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  background: #fff3e0;
  color: #e67e22;
  flex-shrink: 0;
}

.pricing-hint {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  font-style: italic;
}

.prompt-preview {
  margin-top: 10rpx;
  padding: 12rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
}
.preview-label { font-size: 20rpx; color: #999; }
.preview-text { font-size: 20rpx; color: #666; }

.delete-btn {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  background: #fee;
  color: #e74c3c;
  font-size: 22rpx;
  flex-shrink: 0;
}

.empty {
  text-align: center;
  padding: 120rpx 0;
  color: #999;
  font-size: 28rpx;
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
}
.modal-title { font-size: 32rpx; font-weight: 700; }
.modal-close { font-size: 48rpx; color: #999; }
.modal-body { padding: 32rpx; padding-bottom: 60rpx; max-height: 75vh; }

.field { margin-bottom: 20rpx; }
.label { display: block; font-size: 24rpx; color: #666; margin-bottom: 8rpx; }

.form-input {
  display: block;
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #1a1a1a;
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto !important;
  touch-action: manipulation;
}
.form-input:focus { border-color: #1a1a1a; }

.form-textarea {
  display: block;
  width: 100%;
  min-height: 120rpx;
  background: #f8f8f8;
  border: 2rpx solid #eee;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #1a1a1a;
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto !important;
  touch-action: manipulation;
}
.form-textarea.tall { min-height: 300rpx; }
.form-textarea:focus { border-color: #1a1a1a; }

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
