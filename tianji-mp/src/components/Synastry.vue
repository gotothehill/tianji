<template>
  <view class="synastry-container animate-fade-in">
    <view class="page-header">
      <view class="header-title">
        <text class="header-icon">{{ labels.heartIcon }}</text>
        <text class="page-title">{{ labels.title }}</text>
      </view>
      <text class="page-sub">{{ labels.subtitle }}</text>
    </view>

    <view v-if="!hasProfiles" class="empty-state">
      <text class="empty-text">{{ labels.noProfiles }}</text>
    </view>

    <view v-else class="content">
      <view class="selection-panel">
        <view class="selector">
          <text class="selector-label">{{ labels.profileA }}</text>
          <picker :range="profileAOptions" range-key="label" :value="profileAIndex" @change="onProfileAChange">
            <view class="selector-input">
              <view class="selector-row">
                <text class="selector-text">{{ profileAOptions[profileAIndex]?.label || labels.selectProfile }}</text>
                <text class="selector-hint">{{ labels.selectHint }}</text>
              </view>
            </view>
          </picker>
          <view v-if="chartA" class="dm-card dm-card-a">
            <text class="dm-label">{{ labels.dayMaster }}</text>
            <view class="dm-main">
              <view class="dm-badge dm-a">{{ chartA.pillars.day.gan }}</view>
              <text class="dm-desc">{{ dayMasterInfoA }}</text>
            </view>
          </view>
        </view>

        <view class="score-chip">
          <text class="score-value">{{ scoreValue }}</text>
          <text class="score-label">{{ labels.scoreLabel }}</text>
        </view>

        <view class="selector">
          <text class="selector-label">{{ labels.profileB }}</text>
          <picker :range="profileBOptions" range-key="label" :value="profileBIndex" @change="onProfileBChange">
            <view class="selector-input">
              <view class="selector-row">
                <text class="selector-text">{{ profileBOptions[profileBIndex]?.label || labels.selectProfile }}</text>
                <text class="selector-hint">{{ labels.selectHint }}</text>
              </view>
            </view>
          </picker>
          <view v-if="chartB" class="dm-card dm-card-b">
            <text class="dm-label">{{ labels.dayMaster }}</text>
            <view class="dm-main dm-main-right">
              <text class="dm-desc">{{ dayMasterInfoB }}</text>
              <view class="dm-badge dm-b">{{ chartB.pillars.day.gan }}</view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="analysis" class="analysis-section">
        <view class="analysis-grid">
          <view class="analysis-card">
            <view class="card-head">
              <view class="icon-dot purple"></view>
              <text class="card-title">{{ labels.linkTitle }}</text>
            </view>
            <view class="line-list">
              <view :class="['line-item', analysis.isGanHe ? 'line-on' : 'line-off']">
                <text class="line-icon">{{ analysis.isGanHe ? labels.checkIcon : labels.dotIcon }}</text>
                <text>{{ labels.ganHe }}</text>
              </view>
              <view :class="['line-item', analysis.isZhiHe ? 'line-on' : 'line-off']">
                <text class="line-icon">{{ analysis.isZhiHe ? labels.checkIcon : labels.dotIcon }}</text>
                <text>{{ labels.zhiHe }}</text>
              </view>
            </view>
            <text class="card-desc">{{ analysis.linkDesc }}</text>
          </view>

          <view class="analysis-card">
            <view class="card-head">
              <view class="icon-dot indigo"></view>
              <text class="card-title">{{ labels.relationTitle }}</text>
            </view>
            <text class="card-value">{{ analysis.relationType }}</text>
            <text class="card-desc">{{ analysis.relationDesc }}</text>
          </view>

          <view class="analysis-card">
            <view class="card-head">
              <view class="icon-dot amber"></view>
              <text class="card-title">{{ labels.complementTitle }}</text>
            </view>
            <view class="bar-row">
              <view v-for="i in 2" :key="i" :class="['bar', i <= analysis.complementScore ? 'bar-on' : 'bar-off']"></view>
            </view>
            <text class="card-desc">{{ analysis.complementDesc }}</text>
          </view>

          <view class="analysis-card">
            <view class="card-head">
              <view :class="['icon-dot', analysis.isZhiChong ? 'rose' : 'emerald']"></view>
              <text class="card-title">{{ labels.riskTitle }}</text>
            </view>
            <view :class="['risk-box', analysis.isZhiChong ? 'risk-high' : 'risk-low']">
              <text class="risk-title">{{ analysis.isZhiChong ? labels.riskWarn : labels.riskSafe }}</text>
              <text class="risk-desc">{{ analysis.riskDesc }}</text>
            </view>
          </view>
        </view>

        <view v-if="!reportContent" class="ai-unlock">
          <view class="ai-topline"></view>
          <text class="ai-title">{{ labels.aiUnlockTitle }}</text>
          <view v-if="loading" class="loading-panel">
            <view class="spinner"></view>
            <text class="loading-text">{{ labels.aiGenerating }}</text>
          </view>
          <view v-else>
            <text class="ai-desc">
              {{ labels.aiDescPrefix }}
              <text class="ai-desc-strong">{{ analysis.relationType }}</text>
              {{ labels.aiDescMid }}
              <text class="ai-desc-strong">{{ labels.aiDescStrong }}</text>
              {{ labels.aiDescTail }}
            </text>
            <text v-if="errorMsg" class="error-text">{{ errorMsg }}</text>
            <button class="btn-generate" :disabled="loading || !hasApiKey" @click="generateSynastry(false)">
              {{ loading ? labels.aiGeneratingShort : labels.aiGenerate }}
            </button>
            <text v-if="!hasApiKey" class="ai-warn">{{ labels.aiNeedKey }}</text>
          </view>
        </view>

        <view v-else class="ai-report">
          <view class="report-header">
            <text class="report-title">{{ labels.reportTitle }}</text>
          </view>
          <view class="report-body">
            <view v-for="(block, idx) in reportBlocks" :key="idx" :class="['md-block', 'md-' + block.type]">
              <text v-if="block.prefix" class="md-prefix">{{ block.prefix }}</text>
              <text
                v-for="(seg, sidx) in block.segments"
                :key="sidx"
                :class="['md-seg', seg.bold ? 'md-bold' : '']"
              >
                {{ seg.text }}
              </text>
            </view>
          </view>
          <view v-if="hasApiKey" class="report-actions">
            <button class="btn-generate" :disabled="loading" @click="generateSynastry(true)">
              {{ loading ? labels.aiGeneratingShort : labels.aiRetry }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { BaziChart, UserProfile } from '@/models';
import * as AI from '@/services/aiService';
import * as Storage from '@/services/storageService';
import * as Astrology from '@/services/astrologyService';

type ProfileOption = { id: string; label: string };

const props = defineProps<{
  chart: BaziChart | null;
  profileId: string | null;
}>();

const labels = {
  heartIcon: '\u2764',
  title: '\u5929\u673a\u00b7\u53cc\u4eba\u5408\u76d8',
  subtitle: '\u57fa\u4e8e\u300a\u4e09\u547d\u901a\u4f1a\u300b\u7684\u6df1\u5ea6\u5173\u7cfb\u5339\u914d\u5206\u6790',
  noProfiles: '\u6682\u65e0\u6863\u6848\uff0c\u8bf7\u5148\u521b\u5efa\u6863\u6848\u518d\u8fdb\u884c\u5408\u76d8\u3002',
  selectProfile: '\u9009\u62e9\u6863\u6848...',
  selectHint: '\u25be',
  profileA: '\u7532\u65b9\uff08\u4e3b\u661f\uff09',
  profileB: '\u4e59\u65b9\uff08\u5bf9\u8c61\uff09',
  dayMaster: '\u65e5\u5143',
  scoreLabel: 'Score',
  scorePlaceholder: '\u21bb',
  male: '\u7537',
  female: '\u5973',
  emptyValue: '--',
  dmSuffix: '\u547d',
  checkIcon: '\u2714',
  dotIcon: '\u2022',
  linkTitle: '\u7f18\u5206\u94fe\u63a5',
  ganHe: '\u5929\u5e72\u76f8\u5408\uff08\u7cbe\u795e\uff09',
  zhiHe: '\u5730\u652f\u76f8\u5408\uff08\u751f\u6d3b\uff09',
  linkStrong: '\u53cc\u65b9\u516b\u5b57\u663e\u793a\u51fa\u8f83\u5f3a\u7684\u5438\u5f15\u529b\u4fe1\u53f7\uff0c\u7f18\u5206\u8f83\u6df1\u3002',
  linkWeak: '\u5408\u76d8\u4fe1\u53f7\u4e0d\u660e\u663e\uff0c\u540e\u5929\u76f8\u5904\u4e0e\u7ecf\u8425\u66f4\u4e3a\u5173\u952e\u3002',
  relationTitle: '\u76f8\u5904\u6a21\u5f0f',
  complementTitle: '\u4e94\u884c\u4e92\u8865',
  riskTitle: '\u6f5c\u5728\u963b\u788d',
  riskWarn: '\u65e5\u652f\u76f8\u51b2',
  riskSafe: '\u5e76\u65e0\u51b2\u514b',
  riskHigh: '\u53cc\u65b9\u751f\u6d3b\u4e60\u60ef\u6216\u4ef7\u503c\u89c2\u5bb9\u6613\u6709\u78b0\u649e\uff0c\u9700\u8981\u66f4\u591a\u5305\u5bb9\u4e0e\u6c9f\u901a\u3002',
  riskLow: '\u592b\u59bb\u5bab\u7a33\u5b9a\uff0c\u6682\u65e0\u660e\u663e\u51b2\u7a81\u4fe1\u53f7\uff0c\u662f\u5f88\u597d\u7684\u57fa\u7840\u3002',
  relationFriend: '\u6bd4\u52ab (Friend)',
  relationOutput: '\u98df\u4f24 (Output)',
  relationWealth: '\u8d22\u661f (Wealth)',
  relationResource: '\u5370\u67ad (Resource)',
  relationPower: '\u5b98\u6740 (Power)',
  relationFallback: '\u5408\u4f5c (Partner)',
  relationFriendDesc: '\u53cc\u65b9\u6027\u8d28\u76f8\u540c\uff0c\u5bb9\u6613\u4ea7\u751f\u5171\u9e23\uff0c\u4f46\u4e5f\u5bb9\u6613\u5404\u6267\u5df1\u89c1\uff0c\u9700\u5b66\u4f1a\u9000\u8ba9\u3002',
  relationOutputDesc: '\u7532\u65b9\u4e3b\u52a8\u4ed8\u51fa\uff0c\u4e59\u65b9\u53d7\u5bb3\u8f83\u591a\uff0c\u9700\u76f8\u4e92\u611f\u6069\u4e0e\u5e73\u8861\u3002',
  relationWealthDesc: '\u7532\u65b9\u5f80\u5f80\u5360\u4e3b\u5bfc\u5730\u4f4d\uff0c\u9700\u6ce8\u610f\u7ed9\u4e88\u4e59\u65b9\u8db3\u591f\u7684\u7a7a\u95f4\u4e0e\u5c0a\u91cd\u3002',
  relationResourceDesc: '\u4e59\u65b9\u5bb9\u6613\u6210\u4e3a\u7532\u65b9\u7684\u652f\u6301\u8005\uff0c\u89c6\u5728\u5173\u7cfb\u4e2d\u80fd\u7ed9\u4e88\u6e29\u6696\u4e0e\u652f\u6491\u3002',
  relationPowerDesc: '\u4e59\u65b9\u5bb9\u6613\u7ed9\u7532\u65b9\u5e26\u6765\u538b\u529b\uff0c\u65e2\u80fd\u7ea6\u675f\u4e5f\u80fd\u4fc3\u6210\u6210\u957f\uff0c\u9700\u5e73\u8861\u754c\u9650\u3002',
  relationFallbackDesc: '\u5173\u7cfb\u66f4\u4fa7\u91cd\u5408\u4f5c\uff0c\u7ed3\u6784\u4f18\u52bf\u8981\u9760\u540e\u5929\u7ecf\u8425\u3002',
  complementStrong: '\u4e94\u884c\u9ad8\u5ea6\u4e92\u8865\uff0c\u4e92\u4e3a\u8d35\u4eba\uff0c\u7efc\u5408\u52a8\u80fd\u5f88\u5f3a\u3002',
  complementMedium: '\u4e94\u884c\u90e8\u5206\u4e92\u8865\uff0c\u5173\u7cfb\u6709\u4e00\u5b9a\u4e92\u52a9\u4f5c\u7528\u3002',
  complementLow: '\u4e94\u884c\u4e92\u8865\u6027\u4e00\u822c\uff0c\u9700\u8981\u66f4\u591a\u540e\u5929\u7ecf\u8425\u3002',
  aiUnlockTitle: '\u89e3\u9501\u300a\u53cc\u4eba\u6df1\u5ea6\u5408\u76d8\u62a5\u544a\u300b',
  aiDescPrefix: '\u867d\u7136\u201c',
  aiDescMid: '\u201d\u5173\u7cfb\u5df2\u5b9a\uff0c\u4f46\u7ec6\u8282\u51b3\u5b9a\u6210\u8d25\u3002\u5929\u673a\u5148\u751f\u5c06\u4e3a\u60a8\u6df1\u5ea6\u89e3\u6790',
  aiDescStrong: '\u672a\u6765 5 \u5e74\u7684\u8d8b\u52bf\u540c\u6b65\u6027\u4e0e\u4e13\u5c5e\u5316\u89e3\u9526\u56ca',
  aiDescTail: '\u3002',
  aiGenerate: '\u751f\u6210\u5408\u76d8\u62a5\u544a',
  aiRetry: '\u91cd\u65b0\u751f\u6210',
  aiGenerating: 'AI \u6b63\u5728\u63a8\u6f14\u4e2d...',
  aiGeneratingShort: '\u63a8\u6f14\u4e2d...',
  aiNeedKey: '\u9700\u914d\u7f6e API Key',
  reportTitle: 'AI \u6df1\u5ea6\u5408\u76d8\u62a5\u544a',
};

const loading = ref(false);
const errorMsg = ref('');
const activeTaskKey = ref<string | null>(null);
const allProfiles = ref<UserProfile[]>([]);
const profileAId = ref(props.profileId || '');
const profileBId = ref('');
const reportContent = ref('');
const hasApiKey = computed(() => !!import.meta.env.VITE_OPENAI_API_KEY);
const hasProfiles = computed(() => allProfiles.value.length > 0);

onMounted(() => {
  allProfiles.value = Storage.getProfiles();
});

watch(() => props.profileId, (id) => {
  if (id && id !== profileAId.value) {
    profileAId.value = id;
  }
});

const profileAOptions = computed<ProfileOption[]>(() => {
  const options = allProfiles.value.map(p => ({
    id: p.id,
    label: `${p.name} (${p.gender === 1 ? labels.male : labels.female}) - ${p.birthDate}`
  }));
  return [{ id: '', label: labels.selectProfile }, ...options];
});

const profileBOptions = computed<ProfileOption[]>(() => {
  const options = allProfiles.value
    .filter(p => p.id !== profileAId.value)
    .map(p => ({
      id: p.id,
      label: `${p.name} (${p.gender === 1 ? labels.male : labels.female}) - ${p.birthDate}`
    }));
  return [{ id: '', label: labels.selectProfile }, ...options];
});

const profileAIndex = computed(() => {
  const idx = profileAOptions.value.findIndex(o => o.id === profileAId.value);
  return idx >= 0 ? idx : 0;
});

const profileBIndex = computed(() => {
  const idx = profileBOptions.value.findIndex(o => o.id === profileBId.value);
  return idx >= 0 ? idx : 0;
});

const onProfileAChange = (event: any) => {
  const idx = Number(event.detail?.value ?? 0);
  profileAId.value = profileAOptions.value[idx]?.id || '';
  if (profileAId.value && profileAId.value === profileBId.value) {
    profileBId.value = '';
  }
};

const onProfileBChange = (event: any) => {
  const idx = Number(event.detail?.value ?? 0);
  profileBId.value = profileBOptions.value[idx]?.id || '';
};

const profileA = computed(() => allProfiles.value.find(p => p.id === profileAId.value) || null);
const profileB = computed(() => allProfiles.value.find(p => p.id === profileBId.value) || null);

const chartA = computed(() => (profileA.value ? Astrology.calculateBazi(profileA.value) : null));
const chartB = computed(() => (profileB.value ? Astrology.calculateBazi(profileB.value) : null));

const WUXING_MAP: Record<string, string> = {
  '\u7532': '\u6728',
  '\u4e59': '\u6728',
  '\u4e19': '\u706b',
  '\u4e01': '\u706b',
  '\u620a': '\u571f',
  '\u5df1': '\u571f',
  '\u5e9a': '\u91d1',
  '\u8f9b': '\u91d1',
  '\u58ec': '\u6c34',
  '\u7678': '\u6c34',
};

const ELEMENTS = ['\u6728', '\u706b', '\u571f', '\u91d1', '\u6c34'];

const dayMasterInfoA = computed(() => {
  if (!chartA.value) return labels.emptyValue;
  const element = WUXING_MAP[chartA.value.pillars.day.gan] || labels.emptyValue;
  const strength = chartA.value.wuxing.details?.strength || labels.emptyValue;
  return `${element}${labels.dmSuffix} / ${strength}`;
});

const dayMasterInfoB = computed(() => {
  if (!chartB.value) return labels.emptyValue;
  const element = WUXING_MAP[chartB.value.pillars.day.gan] || labels.emptyValue;
  const strength = chartB.value.wuxing.details?.strength || labels.emptyValue;
  return `${element}${labels.dmSuffix} / ${strength}`;
});

const analysis = computed(() => {
  if (!chartA.value || !chartB.value) return null;

  const ga = chartA.value.pillars.day.gan;
  const gb = chartB.value.pillars.day.gan;
  const za = chartA.value.pillars.day.zhi;
  const zb = chartB.value.pillars.day.zhi;

  const GAN_HE = [
    ['\u7532', '\u5df1'],
    ['\u4e59', '\u5e9a'],
    ['\u4e19', '\u8f9b'],
    ['\u4e01', '\u58ec'],
    ['\u620a', '\u7678'],
  ];
  const ZHI_HE = [
    ['\u5b50', '\u4e11'],
    ['\u5bc5', '\u4ea5'],
    ['\u536f', '\u620c'],
    ['\u8fb0', '\u9149'],
    ['\u5df3', '\u7533'],
    ['\u5348', '\u672a'],
  ];
  const ZHI_CHONG = [
    ['\u5b50', '\u5348'],
    ['\u4e11', '\u672a'],
    ['\u5bc5', '\u7533'],
    ['\u536f', '\u9149'],
    ['\u8fb0', '\u620c'],
    ['\u5df3', '\u4ea5'],
  ];

  const isGanHe = GAN_HE.some(pair => pair.includes(ga) && pair.includes(gb));
  const isZhiHe = ZHI_HE.some(pair => pair.includes(za) && pair.includes(zb));
  const isZhiChong = ZHI_CHONG.some(pair => pair.includes(za) && pair.includes(zb));

  const wa = WUXING_MAP[ga];
  const wb = WUXING_MAP[gb];
  const idxA = ELEMENTS.indexOf(wa);
  const idxB = ELEMENTS.indexOf(wb);

  let relationType = labels.relationFallback;
  let relationDesc = labels.relationFallbackDesc;

  if (idxA !== -1 && idxB !== -1) {
    if (idxA === idxB) {
      relationType = labels.relationFriend;
      relationDesc = labels.relationFriendDesc;
    } else if ((idxA + 1) % 5 === idxB) {
      relationType = labels.relationOutput;
      relationDesc = labels.relationOutputDesc;
    } else if ((idxA + 2) % 5 === idxB) {
      relationType = labels.relationWealth;
      relationDesc = labels.relationWealthDesc;
    } else if ((idxB + 1) % 5 === idxA) {
      relationType = labels.relationResource;
      relationDesc = labels.relationResourceDesc;
    } else if ((idxB + 2) % 5 === idxA) {
      relationType = labels.relationPower;
      relationDesc = labels.relationPowerDesc;
    }
  }

  const aNeeds = (chartA.value.wuxing.details?.yongShen || '').split('/');
  const bNeeds = (chartB.value.wuxing.details?.yongShen || '').split('/');
  const aStrongest = [...chartA.value.wuxing.scores].sort((a, b) => b.value - a.value)[0]?.name || '';
  const bStrongest = [...chartB.value.wuxing.scores].sort((a, b) => b.value - a.value)[0]?.name || '';

  const bProvidesWhatANeeds = aNeeds.some(n => n && bStrongest && n.includes(bStrongest));
  const aProvidesWhatBNeeds = bNeeds.some(n => n && aStrongest && n.includes(aStrongest));

  let complementScore = 0;
  if (bProvidesWhatANeeds) complementScore += 1;
  if (aProvidesWhatBNeeds) complementScore += 1;

  let complementDesc = labels.complementLow;
  if (complementScore === 2) complementDesc = labels.complementStrong;
  else if (complementScore === 1) complementDesc = labels.complementMedium;

  let score = 60;
  if (isGanHe) score += 15;
  if (isZhiHe) score += 15;
  if (isZhiChong) score -= 10;
  if (complementScore === 2) score += 10;
  else if (complementScore === 1) score += 5;
  score = Math.min(99, Math.max(40, score));

  const linkDesc = (isGanHe || isZhiHe) ? labels.linkStrong : labels.linkWeak;
  const riskDesc = isZhiChong ? labels.riskHigh : labels.riskLow;

  return {
    score,
    isGanHe,
    isZhiHe,
    isZhiChong,
    relationType,
    relationDesc,
    complementDesc,
    complementScore,
    linkDesc,
    riskDesc,
  };
});

const scoreValue = computed(() => (analysis.value ? String(analysis.value.score) : labels.scorePlaceholder));

const loadCachedReport = () => {
  if (!profileAId.value || !profileBId.value) {
    reportContent.value = '';
    return;
  }
  const cached = Storage.getSynastryReport(profileAId.value, profileBId.value);
  reportContent.value = cached || '';
};

const attachPendingTask = () => {
  if (!profileAId.value || !profileBId.value) return;
  const currentA = profileAId.value;
  const currentB = profileBId.value;
  const task = AI.getSynastryTask(currentA, currentB);
  if (!task) return;
  const taskKey = `${currentA}__${currentB}`;
  if (activeTaskKey.value === taskKey) return;
  activeTaskKey.value = taskKey;
  loading.value = true;
  errorMsg.value = '';
  task.promise
    .then((content) => {
      Storage.saveSynastryReport(currentA, currentB, content);
      if (profileAId.value === currentA && profileBId.value === currentB) {
        reportContent.value = content;
      }
    })
    .catch((e: any) => {
      const msg = e?.message || e?.errMsg || labels.emptyValue;
      errorMsg.value = `${labels.aiGenerate}: ${msg}`;
    })
    .finally(() => {
      if (activeTaskKey.value === taskKey) {
        loading.value = false;
        activeTaskKey.value = null;
      }
    });
};

watch(() => [profileAId.value, profileBId.value], () => {
  loadCachedReport();
  attachPendingTask();
  errorMsg.value = '';
}, { immediate: true });

const generateSynastry = async (force: boolean) => {
  if (!chartA.value || !chartB.value || !profileAId.value || !profileBId.value) return;
  if (!hasApiKey.value) return;

  if (!force) {
    const cached = Storage.getSynastryReport(profileAId.value, profileBId.value);
    if (cached) {
      reportContent.value = cached;
      return;
    }
  }

  const currentA = profileAId.value;
  const currentB = profileBId.value;
  loading.value = true;
  errorMsg.value = '';
  try {
    const content = await AI.ensureSynastryTask(currentA, currentB, chartA.value, chartB.value, 'couple');
    Storage.saveSynastryReport(currentA, currentB, content);
    if (profileAId.value === currentA && profileBId.value === currentB) {
      reportContent.value = content;
    }
  } catch (e: any) {
    const msg = e?.message || e?.errMsg || labels.emptyValue;
    errorMsg.value = `${labels.aiGenerate}: ${msg}`;
  } finally {
    loading.value = false;
  }
};

type ReportSegment = { text: string; bold?: boolean };

type ReportBlock = {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'rating' | 'verdict' | 'spacer';
  segments: ReportSegment[];
  prefix?: string;
};

const RATING_KEY = '\u5929\u673a\u8bc4\u5206';
const VERDICT_KEY = '\u5929\u673a\u5224\u8bed';
const BULLET_PREFIX = '\u2022 ';
const H2_PREFIX = '\u25cf ';
const H3_PREFIX = '\u25e6 ';
const RATING_PREFIX = '\u2605 ';
const VERDICT_PREFIX = '\u2730 ';

const parseSegments = (line: string): ReportSegment[] => {
  const segments: ReportSegment[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ text: match[1], bold: true });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) });
  }
  if (!segments.length) {
    segments.push({ text: line });
  }
  return segments;
};

const reportBlocks = computed<ReportBlock[]>(() => {
  if (!reportContent.value) return [];
  const blocks: ReportBlock[] = [];
  const lines = reportContent.value.split(/\r?\n/);

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      if (blocks.length && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer', segments: [] });
      }
      return;
    }

    let type: ReportBlock['type'] = 'p';
    let text = line;
    let prefix = '';

    if (/^###\s+/.test(line)) {
      type = 'h3';
      text = line.replace(/^###\s+/, '');
      prefix = H3_PREFIX;
    } else if (/^##\s+/.test(line)) {
      type = 'h2';
      text = line.replace(/^##\s+/, '');
      prefix = H2_PREFIX;
    } else if (/^#\s+/.test(line)) {
      type = 'h1';
      text = line.replace(/^#\s+/, '');
    } else if (line.startsWith(RATING_KEY)) {
      type = 'rating';
      prefix = RATING_PREFIX;
    } else if (line.startsWith(VERDICT_KEY)) {
      type = 'verdict';
      prefix = VERDICT_PREFIX;
    } else if (/^[-*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line)) {
      type = 'li';
      text = line.replace(/^[-*]\s+/, '').replace(/^\d+[\.)]\s+/, '');
      prefix = BULLET_PREFIX;
    }

    let segments = parseSegments(text);
    if (type === 'rating' || type === 'verdict') {
      const label = type === 'rating' ? RATING_KEY : VERDICT_KEY;
      const rest = text.replace(label, '').replace(/^[:\uff1a]\s*/, '');
      segments = [
        { text: `${label}\uff1a`, bold: true },
        { text: rest ? ` ${rest}` : '' }
      ];
    }

    blocks.push({ type, segments, prefix });
  });

  return blocks;
});
</script>

<style scoped>
.synastry-container {
  padding: 24rpx;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.animate-fade-in { animation: fadeIn 0.5s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.page-header { text-align: center; display: flex; flex-direction: column; gap: 8rpx; }
.header-title { display: flex; align-items: center; justify-content: center; gap: 10rpx; }
.header-icon { font-size: 28rpx; color: #f43f5e; }
.page-title { font-size: 36rpx; font-weight: bold; color: #1e293b; }
.page-sub { font-size: 24rpx; color: #94a3b8; }

.empty-state { padding: 48rpx 24rpx; text-align: center; }
.empty-text { font-size: 26rpx; color: #94a3b8; }

.selection-panel {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-items: flex-start;
  justify-content: space-between;
}

.selector {
  flex: 1;
  min-width: 220rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.selector-label { font-size: 20rpx; color: #94a3b8; text-transform: uppercase; }
.selector-input {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16rpx;
  padding: 16rpx;
}
.selector-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.selector-text { font-size: 24rpx; color: #475569; flex: 1; }
.selector-hint {
  width: 32rpx; height: 32rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #eef2ff; color: #6366f1; font-size: 20rpx; font-weight: bold;
}

.dm-card {
  border-radius: 18rpx;
  padding: 16rpx;
  border: 1px solid #e2e8f0;
}
.dm-card-a { background: linear-gradient(135deg, #eef2ff, #ffffff); }
.dm-card-b { background: linear-gradient(135deg, #fdf2f8, #ffffff); text-align: right; }
.dm-label { font-size: 20rpx; color: #94a3b8; text-transform: uppercase; }
.dm-main { display: flex; align-items: center; gap: 12rpx; margin-top: 8rpx; }
.dm-main-right { justify-content: flex-end; }
.dm-badge {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: bold; font-size: 28rpx;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.12);
}
.dm-a { background: #6366f1; }
.dm-b { background: #ec4899; }
.dm-desc { font-size: 22rpx; color: #64748b; }

.score-chip {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fb7185, #7c3aed);
  color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(124, 58, 237, 0.25);
  margin-top: 24rpx;
}
.score-value { font-size: 36rpx; font-weight: bold; }
.score-label { font-size: 18rpx; opacity: 0.9; letter-spacing: 1rpx; }

.analysis-section { display: flex; flex-direction: column; gap: 24rpx; }
.analysis-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.analysis-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.card-head { display: flex; align-items: center; gap: 8rpx; }
.icon-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.icon-dot.purple { background: #a855f7; }
.icon-dot.indigo { background: #6366f1; }
.icon-dot.amber { background: #f59e0b; }
.icon-dot.rose { background: #fb7185; }
.icon-dot.emerald { background: #34d399; }
.card-title { font-size: 22rpx; color: #475569; font-weight: bold; }
.card-value { font-size: 28rpx; font-weight: bold; color: #1e293b; }
.card-desc { font-size: 22rpx; color: #64748b; line-height: 1.5; }

.line-list { display: flex; flex-direction: column; gap: 6rpx; }
.line-item { display: flex; align-items: center; gap: 8rpx; font-size: 22rpx; }
.line-icon { width: 20rpx; text-align: center; }
.line-on { color: #6d28d9; font-weight: bold; }
.line-off { color: #94a3b8; }

.bar-row { display: flex; gap: 8rpx; }
.bar { width: 28rpx; height: 8rpx; border-radius: 999rpx; }
.bar-on { background: #fbbf24; }
.bar-off { background: #e2e8f0; }

.risk-box {
  border-radius: 16rpx;
  padding: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.risk-high { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }
.risk-low { background: #ecfdf5; border: 1px solid #bbf7d0; color: #047857; }
.risk-title { font-size: 22rpx; font-weight: bold; }
.risk-desc { font-size: 20rpx; }

.loading-panel { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 24rpx; }
.spinner {
  width: 64rpx; height: 64rpx;
  border: 6rpx solid #f3e8ff; border-top-color: #f43f5e;
  border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 24rpx; color: #64748b; }

.ai-unlock {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx 24rpx 24rpx;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  text-align: center;
}
.ai-topline {
  position: absolute;
  top: 0; left: 0; right: 0; height: 6rpx;
  background: linear-gradient(90deg, #fb7185, #7c3aed);
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
}
.ai-title { font-size: 30rpx; font-weight: bold; color: #1e293b; }
.ai-desc { font-size: 24rpx; color: #64748b; line-height: 1.6; }
.ai-desc-strong { font-weight: bold; color: #be123c; }
.ai-warn { font-size: 22rpx; color: #f59e0b; }
.error-text { font-size: 22rpx; color: #dc2626; }
.btn-generate {
  background: linear-gradient(135deg, #f43f5e, #7c3aed);
  color: #fff;
  border-radius: 999rpx;
  padding: 18rpx 32rpx;
  font-size: 26rpx;
  align-self: center;
  box-shadow: 0 8rpx 18rpx rgba(124, 58, 237, 0.25);
}
.btn-generate[disabled] { opacity: 0.5; }

.ai-report {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.report-header { display: flex; justify-content: space-between; align-items: center; }
.report-title { font-size: 26rpx; font-weight: bold; color: #1e293b; }
.btn-sm { font-size: 22rpx; background: #f1f5f9; color: #64748b; padding: 6rpx 18rpx; border-radius: 999rpx; }

.report-body { display: flex; flex-direction: column; }
.report-actions { display: flex; justify-content: center; }
.md-block { margin-bottom: 12rpx; }
.md-spacer { height: 12rpx; }
.md-h1 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8rpx; }
.md-h1 text { font-size: 30rpx; font-weight: bold; color: #be123c; }
.md-h2 { display: flex; align-items: center; gap: 8rpx; margin-top: 10rpx; }
.md-h2 text { font-size: 28rpx; font-weight: bold; color: #1e293b; }
.md-h3 { display: flex; align-items: center; gap: 8rpx; }
.md-h3 text { font-size: 26rpx; font-weight: bold; color: #475569; }
.md-p text, .md-li text { font-size: 24rpx; color: #475569; line-height: 1.7; }
.md-li { padding-left: 8rpx; }
.md-rating, .md-verdict {
  padding: 10rpx 14rpx;
  border-radius: 14rpx;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.md-rating text { color: #be123c; font-size: 24rpx; }
.md-verdict text { color: #334155; font-size: 24rpx; }
.md-prefix { color: #f43f5e; font-size: 24rpx; margin-right: 4rpx; }
.md-seg { font-size: 24rpx; color: inherit; }
.md-bold { font-weight: 700; color: #be123c; }
.md-li .md-bold { color: #be123c; }
</style>
