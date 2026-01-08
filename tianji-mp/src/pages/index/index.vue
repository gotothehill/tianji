<template>
  <view class="container">
    
    <!-- Top Nav -->
    <view class="navbar">
       <view class="nav-left" @click="showSidebar = true">
           <text class="menu-icon">☰</text>
       </view>
       <view class="nav-title">
           <text class="brand">天机·星盘 Lite</text>
       </view>
       <view class="nav-right"></view>
    </view>
    
    <!-- Sidebar Drawer -->
    <view class="drawer-mask" v-if="showSidebar" @click="showSidebar = false"></view>
    <view class="drawer" :class="{ open: showSidebar }">
        <view class="drawer-header">
            <text class="drawer-title">我的档案</text>
            <view class="add-btn" @click="openCreateModal">
                <text>+ 新建</text>
            </view>
        </view>
        <scroll-view scroll-y class="drawer-list">
            <view 
                v-for="p in profiles" 
                :key="p.id" 
                class="drawer-item"
                :class="{ active: activeProfileId === p.id }"
                @click="selectProfile(p.id)"
            >
                <text class="item-name">{{ p.name }}</text>
                <view class="item-actions">
                    <text class="del-icon" @click.stop="handleDelete(p.id)">🗑</text>
                </view>
            </view>
        </scroll-view>
    </view>
    
    <!-- Content Area -->
    <scroll-view v-if="activeTab !== 'ai_chat'" scroll-y class="main-content">
        <block v-if="activeProfile && baziChart">
            <!-- Header Info -->
            <view class="profile-header">
                <view class="ph-top">
                    <text class="ph-name">{{ activeProfile.name }}</text>
                    <text class="ph-gender" :class="activeProfile.gender === 1 ? 'male' : 'female'">{{ activeProfile.gender === 1 ? '乾造' : '坤造' }}</text>
                </view>
                <text class="ph-birth">{{ activeProfile.birthDate }} {{ activeProfile.birthTime }}</text>
            </view>
            
            <!-- Tabs -->
            <scroll-view scroll-x class="tabs-scroll" :enable-flex="true">
                <view class="tabs-row">
                    <view 
                        v-for="tab in tabs" 
                        :key="tab.key" 
                        class="tab-item"
                        :class="{ active: activeTab === tab.key }"
                        @click="activeTab = tab.key"
                    >
                        {{ tab.label }}
                    </view>
                </view>
            </scroll-view>
            
            <!-- Tab Content -->
            <view class="tab-panel" :class="{ 'tab-panel-chat': activeTab === 'ai_chat' }">
                <BaziChart v-if="activeTab === 'chart'" :chart="baziChart" />
                <ElementalChart v-if="activeTab === 'chart'" :wuxing="baziChart.wuxing" />
                <ZodiacAnalysis v-if="activeTab === 'chart'" :yearZhi="baziChart.pillars.year.zhi" />
                
                <Timeline v-if="activeTab === 'timeline'" :chart="baziChart" />
                
                <ShenShaTable v-if="activeTab === 'shen_sha'" :chart="baziChart" />
                
                <LifeBook v-if="activeTab === 'life_book'" :chart="baziChart" :profileId="activeProfileId" />
                <Synastry v-if="activeTab === 'synastry'" :chart="baziChart" :profileId="activeProfileId" />
                <AIChat v-if="activeTab === 'ai_chat'" :chart="baziChart" :profileId="activeProfileId" />
            </view>
        </block>
        
        <block v-else>
            <view class="empty-screen">
                <text class="empty-icon-lg">🧭</text>
                <text class="empty-text">请选择或新建档案以开始</text>
                <button class="btn-create-lg" @click="openCreateModal">新建排盘</button>
            </view>
        </block>
    </scroll-view>

    <view v-else class="main-content main-content--chat">
        <block v-if="activeProfile && baziChart">
            <!-- Header Info -->
            <view class="profile-header">
                <view class="ph-top">
                    <text class="ph-name">{{ activeProfile.name }}</text>
                    <text class="ph-gender" :class="activeProfile.gender === 1 ? 'male' : 'female'">{{ activeProfile.gender === 1 ? '乾造' : '坤造' }}</text>
                </view>
                <text class="ph-birth">{{ activeProfile.birthDate }} {{ activeProfile.birthTime }}</text>
            </view>
            
            <!-- Tabs -->
            <scroll-view scroll-x class="tabs-scroll" :enable-flex="true">
                <view class="tabs-row">
                    <view 
                        v-for="tab in tabs" 
                        :key="tab.key" 
                        class="tab-item"
                        :class="{ active: activeTab === tab.key }"
                        @click="activeTab = tab.key"
                    >
                        {{ tab.label }}
                    </view>
                </view>
            </scroll-view>
            
            <!-- Tab Content -->
            <view class="tab-panel tab-panel-chat">
                <AIChat :chart="baziChart" :profileId="activeProfileId" />
            </view>
        </block>
        
        <block v-else>
            <view class="empty-screen">
                <text class="empty-icon-lg">🧭</text>
                <text class="empty-text">请选择或新建档案以开始</text>
                <button class="btn-create-lg" @click="openCreateModal">新建排盘</button>
            </view>
        </block>
    </view>
    
    <!-- Create Modal (Simple Overlay) -->
    <view v-if="showCreateForm" class="modal-mask">
        <view class="modal-card">
            <view class="modal-head">新建档案</view>
            <view class="form-item">
                <text class="label">姓名</text>
                <input class="input" v-model="newProfile.name" placeholder="请输入姓名" />
            </view>
            <view class="form-item">
                <text class="label">性别</text>
                <view class="radio-group">
                    <view class="radio-btn" :class="{ checked: newProfile.gender === 1 }" @click="newProfile.gender = 1">乾造 (男)</view>
                    <view class="radio-btn female" :class="{ checked: newProfile.gender === 0 }" @click="newProfile.gender = 0">坤造 (女)</view>
                </view>
            </view>
             <view class="form-row">
                <view class="form-item half">
                    <text class="label">日期</text>
                    <picker mode="date" :value="newProfile.birthDate" @change="onDateChange">
                        <view class="input picker-view">{{ newProfile.birthDate || '选择日期' }}</view>
                    </picker>
                </view>
                <view class="form-item half">
                    <text class="label">时间</text>
                     <picker mode="time" :value="newProfile.birthTime" @change="onTimeChange">
                        <view class="input picker-view">{{ newProfile.birthTime || '选择时间' }}</view>
                    </picker>
                </view>
            </view>
            <view class="form-item">
                <text class="label">出生城市 (搜不到请手动输入经度)</text>
                <view class="city-input-wrap">
                    <input
                        class="input city-input"
                        v-model="cityQuery"
                        @input="onCityInput"
                        @focus="onCityFocus"
                        placeholder="输入城市名搜索"
                    />
                    <view v-if="isSearchingCity" class="city-loading"></view>
                </view>
                <!-- City Suggestions -->
                <scroll-view scroll-y v-if="showCityDropdown && cityResults.length > 0" class="city-suggestions">
                    <view v-for="(city, idx) in cityResults" :key="idx" class="city-item" @click="selectCity(city)">
                        <text class="city-name">{{ city.name }}</text>
                        <text class="city-sub">{{ city.subcountry }}, {{ city.country }}</text>
                    </view>
                </scroll-view>
            </view>
            <view class="form-item">
                 <text class="label">经度</text>
                 <input class="input" type="digit" v-model="newProfile.longitude" />
            </view>
            
            <view class="modal-actions">
                <button class="btn-cancel" @click="showCreateForm = false">取消</button>
                <button class="btn-confirm" @click="createProfile">开始排盘</button>
            </view>
        </view>
    </view>
    
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as Storage from '@/services/storageService';
import * as Astrology from '@/services/astrologyService';
import { searchCities, type City } from '@/services/cityService';
import type { UserProfile } from '@/models';

// Components
import BaziChart from '@/components/BaziChart.vue';
import ElementalChart from '@/components/ElementalChart.vue';
import ZodiacAnalysis from '@/components/ZodiacAnalysis.vue';
import Timeline from '@/components/Timeline.vue';
import ShenShaTable from '@/components/ShenShaTable.vue';
import AIChat from '@/components/AIChat.vue';
import LifeBook from '@/components/LifeBook.vue';
import Synastry from '@/components/Synastry.vue';

defineOptions({
    components: {
        BaziChart,
        ElementalChart,
        ZodiacAnalysis,
        Timeline,
        ShenShaTable,
        AIChat,
        LifeBook,
        Synastry
    }
});

// Keep explicit reference so the compiler includes the component module.
const _keepBaziChart = BaziChart;

// State
const profiles = ref<UserProfile[]>([]);
const activeProfileId = ref<string | null>(null);
const showSidebar = ref(false);
const showCreateForm = ref(false);
const activeTab = ref('chart');

const tabs = [
    { key: 'chart', label: '命盘' },
    { key: 'timeline', label: '运程' },
    { key: 'shen_sha', label: '神煞' },
    { key: 'life_book', label: '命书' },
    { key: 'synastry', label: '合盘' },
    { key: 'ai_chat', label: '天问' },
];

const newProfile = ref<Partial<UserProfile>>({
    name: '',
    gender: 1,
    birthDate: '1990-01-01',
    birthTime: '12:00',
    longitude: 116.40
});

const cityQuery = ref('');
const cityResults = ref<City[]>([]);
const isSearchingCity = ref(false);
const showCityDropdown = ref(false);
let isSelectingCity = false;
let searchTimer: any = null;

// Derived
const activeProfile = computed(() => profiles.value.find(p => p.id === activeProfileId.value));
const baziChart = computed(() => activeProfile.value ? Astrology.calculateBazi(activeProfile.value as UserProfile) : null);

// Lifecycle
onMounted(() => {
    loadProfiles();
});

const loadProfiles = () => {
    const list = Storage.getProfiles();
    profiles.value = list;
    const savedId = Storage.getActiveProfileId();
    if (savedId && list.find(p => p.id === savedId)) {
        activeProfileId.value = savedId;
    } else if (list.length > 0) {
        activeProfileId.value = list[0].id;
        Storage.setActiveProfileId(list[0].id);
    } else {
        showCreateForm.value = true;
    }
};

const selectProfile = (id: string) => {
    activeProfileId.value = id;
    Storage.setActiveProfileId(id);
    showSidebar.value = false;
};

const openCreateModal = () => {
    newProfile.value = {
        name: '',
        gender: 1,
        birthDate: '1990-01-01',
        birthTime: '12:00',
        longitude: 116.40
    };
    cityQuery.value = '';
    cityResults.value = [];
    isSearchingCity.value = false;
    showCityDropdown.value = false;
    isSelectingCity = false;
    showCreateForm.value = true;
    showSidebar.value = false;
};

const handleDelete = (id: string) => {
    uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定吗？',
        success: (res) => {
            if (res.confirm) {
                Storage.deleteProfile(id);
                loadProfiles();
            }
        }
    });
};

const onDateChange = (e: any) => {
    newProfile.value.birthDate = e.detail.value;
};
const onTimeChange = (e: any) => {
    newProfile.value.birthTime = e.detail.value;
};

const onCityInput = (e: any) => {
    const val = e.detail.value;
    cityQuery.value = val;
    if (searchTimer) clearTimeout(searchTimer);
    if (isSelectingCity) {
        isSelectingCity = false;
        return;
    }
    if (!val || val.length < 2) {
        cityResults.value = [];
        showCityDropdown.value = false;
        isSearchingCity.value = false;
        return;
    }
    isSearchingCity.value = true;
    searchTimer = setTimeout(async () => {
        const res = await searchCities(val);
        cityResults.value = res;
        isSearchingCity.value = false;
        showCityDropdown.value = res.length > 0;
    }, 300);
};

const selectCity = (city: City) => {
    newProfile.value.longitude = city.longitude;
    cityQuery.value = `${city.name}, ${city.country}`;
    cityResults.value = [];
    showCityDropdown.value = false;
    isSelectingCity = true;
};

const onCityFocus = () => {
    if (cityResults.value.length > 0) {
        showCityDropdown.value = true;
    }
};


const createProfile = () => {
    if (!newProfile.value.name) {
        uni.showToast({ title: '请输入姓名', icon: 'none' });
        return;
    }
    
    const p: UserProfile = {
        id: Date.now().toString(), // Simple ID
        name: newProfile.value.name!,
        gender: newProfile.value.gender as 0|1,
        birthDate: newProfile.value.birthDate!,
        birthTime: newProfile.value.birthTime!,
        longitude: newProfile.value.longitude!,
        notes: ''
    };
    
    Storage.saveProfile(p);
    loadProfiles();
    activeProfileId.value = p.id;
    Storage.setActiveProfileId(p.id);
    showCreateForm.value = false;
};

</script>

<style>
/* Global Styles */
.container {
    display: flex; flex-direction: column; min-height: 100vh; height: 100vh; background: #f8fafc;
    width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden;
}

.navbar {
    height: 88rpx;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    border-bottom: 1px solid #f1f5f9;
}
.menu-icon { font-size: 40rpx; padding: 10rpx; color: #64748b; }
.nav-title { font-weight: bold; color: #334155; font-size: 32rpx; }
.nav-right { width: 60rpx; } /* Spacer */

/* Drawer */
.drawer-mask {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
}
.drawer {
    position: fixed; top: 0; bottom: 0; left: 0; width: 500rpx;
    background: #fff; z-index: 101;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    display: flex; flex-direction: column;
}
.drawer.open { transform: translateX(0); }

.drawer-header {
    padding: 32rpx; border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: center;
    background: #f8fafc;
}
.drawer-title { font-weight: bold; font-size: 32rpx; color: #334155; }
.add-btn { background: #7c3aed; color: #fff; padding: 8rpx 20rpx; border-radius: 999rpx; font-size: 24rpx; }

.drawer-list { flex: 1; padding: 16rpx; }
.drawer-item {
    padding: 24rpx; border-radius: 12rpx; margin-bottom: 8rpx;
    background: #fff; color: #475569; display: flex; justify-content: space-between;
}
.drawer-item.active { background: #f5f3ff; color: #7c3aed; font-weight: bold; }
.item-name { font-size: 28rpx; }
.del-icon { color: #cbd5e1; padding: 0 16rpx; }

/* Main Content */
.main-content {
    flex: 1; min-height: 0; padding: 24rpx; padding-bottom: 40rpx;
    width: 100%; box-sizing: border-box; overflow-x: hidden;
}
.main-content--chat {
    padding-bottom: 0; height: 100%;
    display: flex; flex-direction: column;
}


.profile-header {
    background: #fff; padding: 24rpx; border-radius: 24rpx;
    border: 1px solid #f1f5f9; margin-bottom: 24rpx;
}
.ph-top { display: flex; align-items: center; gap: 16rpx; margin-bottom: 8rpx; }
.ph-name { font-size: 36rpx; font-weight: bold; color: #1e293b; }
.ph-gender { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 999rpx; }
.male { background: #eff6ff; color: #2563eb; }
.female { background: #fdf2f8; color: #db2777; }
.ph-birth { font-size: 24rpx; color: #64748b; }

/* Tabs */
.tabs-scroll { white-space: nowrap; margin-bottom: 24rpx; }
.tabs-row { display: flex; gap: 16rpx; padding: 0 4rpx; }
.tab-item {
    padding: 12rpx 32rpx; border-radius: 999rpx; background: #fff; color: #64748b;
    font-size: 26rpx; border: 1px solid #f1f5f9;
}
.tab-item.active { background: #7c3aed; color: #fff; border-color: #7c3aed; box-shadow: 0 4rpx 10rpx rgba(124, 58, 237, 0.2); }

.tab-panel { min-height: 500rpx; width: 100%; box-sizing: border-box; }
.tab-panel-chat {
    flex: 1; min-height: 0; height: 100%;
    display: flex; flex-direction: column;
}


/* Empty States */
.empty-screen {
    height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.empty-icon-lg { font-size: 80rpx; margin-bottom: 32rpx; opacity: 0.3; }
.empty-text { color: #94a3b8; font-size: 28rpx; margin-bottom: 48rpx; }
.btn-create-lg { background: #7c3aed; color: #fff; border-radius: 999rpx; width: 300rpx; }

.empty-state { text-align: center; padding: 60rpx; color: #cbd5e1; }
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; display: block; }

/* Modal */
.modal-mask {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
    display: flex; align-items: center; justify-content: center;
}
.modal-card {
    background: #fff; width: 600rpx; border-radius: 24rpx; padding: 32rpx;
}
.modal-head { text-align: center; font-weight: bold; font-size: 32rpx; margin-bottom: 32rpx; color: #1e293b; }

.form-item { margin-bottom: 24rpx; position: relative; }
.form-row { display: flex; gap: 24rpx; }
.half { flex: 1; }
.label { font-size: 24rpx; color: #64748b; margin-bottom: 8rpx; display: block; }
.input {
    background: #f8fafc; padding: 0 20rpx; border-radius: 12rpx; font-size: 28rpx; color: #334155;
    border: 1px solid #e2e8f0; height: 72rpx; line-height: 72rpx; box-sizing: border-box;
}
.picker-view { color: #334155; }

.radio-group { display: flex; gap: 16rpx; }
.radio-btn {
    flex: 1; text-align: center; padding: 16rpx; background: #fff; border: 1px solid #e2e8f0;
    border-radius: 12rpx; color: #64748b; font-size: 26rpx;
}
.radio-btn.checked { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; font-weight: bold; }
.radio-btn.female.checked { background: #fdf2f8; color: #db2777; border-color: #fbcfe8; }

.city-input-wrap { position: relative; }
.city-input { padding-right: 56rpx; }
.city-loading {
    position: absolute; right: 16rpx; top: 50%;
    width: 24rpx; height: 24rpx; margin-top: -12rpx;
    border: 3rpx solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%;
    animation: spin 1s linear infinite;
}

.city-suggestions {
    position: absolute; top: 100%; left: 0; right: 0;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12rpx;
    max-height: 300rpx; z-index: 10; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.city-item { padding: 16rpx; border-bottom: 1px solid #f1f5f9; }
.city-name { display: block; font-size: 26rpx; color: #334155; font-weight: bold; }
.city-sub { font-size: 20rpx; color: #94a3b8; }

.modal-actions { display: flex; gap: 16rpx; margin-top: 32rpx; }
.btn-cancel { flex: 1; background: #f1f5f9; color: #64748b; font-size: 28rpx; }
.btn-confirm { flex: 1; background: #7c3aed; color: #fff; font-size: 28rpx; }

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

</style>
