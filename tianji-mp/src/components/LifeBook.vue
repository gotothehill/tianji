<template>
  <view class="life-book-container animate-fade-in">
    <view class="page-header">
      <view class="title-row">
        <view class="brand-dot"></view>
        <text class="page-title">{{ labels.headerTitle }}</text>
      </view>
      <text class="page-sub">{{ labels.headerSub }}</text>
    </view>

    <view class="tab-bar">
      <view class="tab-btn" :class="{ active: activeSection === 'basic' }" @click="activeSection = 'basic'">
        <text>{{ labels.tabBasic }}</text>
      </view>
      <view class="tab-btn" :class="{ active: activeSection === 'ai' }" @click="activeSection = 'ai'">
        <text>{{ labels.tabAI }}</text>
        <text class="pro-badge">{{ labels.pro }}</text>
      </view>
    </view>

    <view v-if="activeSection === 'basic'" class="basic-section">
      <view class="grid-2">
        <view class="card life-card">
          <view class="card-title">
            <view class="accent"></view>
            <text>{{ labels.lifeTitle }}</text>
          </view>
          <view class="row-between">
            <text class="label">{{ labels.dayMaster }}</text>
            <text class="value">{{ dayMaster }}</text>
          </view>
          <view class="row-between">
            <text class="label">{{ labels.energy }}</text>
            <text class="badge">{{ strengthBadge }}</text>
          </view>
          <view class="divider"></view>
          <text class="desc">{{ brief.personality }}</text>
        </view>

        <view class="card direct-card">
          <view class="card-title">
            <view class="accent green"></view>
            <text>{{ labels.directTitle }}</text>
          </view>
          <view class="direct-block">
            <text class="direct-label">{{ labels.coreYong }}</text>
            <text class="direct-value">{{ yongShenText }}</text>
          </view>
          <text class="direct-desc">
            <text class="direct-strong">{{ labels.guidePrefix }}</text>{{ directGuide }}
          </text>
        </view>
      </view>

      <view class="grid-2">
        <view class="card">
          <view class="card-title">
            <view class="icon-dot amber"></view>
            <text>{{ labels.careerTitle }}</text>
          </view>
          <text class="desc">{{ brief.career }}</text>
          <view class="tip-box">{{ labels.careerTip }}</view>
        </view>

        <view class="card">
          <view class="card-title">
            <view class="icon-dot rose"></view>
            <text>{{ labels.loveTitle }}</text>
          </view>
          <text class="desc">{{ brief.love }}</text>
          <view class="tip-box">{{ labels.loveTip }}</view>
        </view>
      </view>

      <view class="upsell-card" @click="activeSection = 'ai'">
        <view>
          <text class="upsell-title">{{ labels.upsellTitle }}</text>
          <text class="upsell-desc">{{ labels.upsellDesc }}</text>
        </view>
        <view class="upsell-icon">?</view>
      </view>
    </view>

    <view v-else class="ai-section">
      <view class="ai-card">
        <view class="ai-header">
          <view class="ai-title-row">
            <view class="ai-dot"></view>
            <text class="ai-title">{{ labels.aiTitle }}</text>
          </view>
          <view class="ai-status">
            <text :class="['ai-badge', hasApiKey ? 'ok' : 'warn']">
              {{ hasApiKey ? labels.aiConnected : labels.aiMissing }}
            </text>
            <button
              v-if="reportContent && hasApiKey"
              class="btn-ghost"
              :disabled="loading"
              @click="generateReport"
            >
              {{ labels.aiRetry }}
            </button>
          </view>
        </view>

        <view v-if="loading" class="loading-state">
          <view class="spinner"></view>
          <text class="loading-text">{{ labels.aiGenerating }}</text>
        </view>

        <view v-else-if="!reportContent" class="empty-state">
          <view v-if="!hasApiKey" class="config-box">
            <text class="config-title">{{ labels.aiConfigTitle }}</text>
            <text class="config-desc">{{ labels.aiConfigDesc }}</text>
            <view class="config-code">{{ labels.aiConfigCode }}</view>
          </view>
          <text class="empty-desc">{{ labels.aiGenerateDesc }}</text>
          <text v-if="errorMsg" class="error-text">{{ errorMsg }}</text>
          <button
            class="btn-generate"
            :disabled="loading || !hasApiKey"
            @click="generateReport"
          >
            {{ labels.aiGenerateBtn }}
          </button>
        </view>

        <view v-else class="report-content">
          <view class="report-header">
            <text class="rh-title">{{ labels.reportTitle }}</text>
            <text class="rh-date">{{ reportDate }}</text>
          </view>
          <view class="markdown-body">
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
          <view class="report-footer">{{ labels.disclaimer }}</view>
          <view class="actions">
            <button class="btn-secondary" @click="copyText">{{ labels.aiCopy }}</button>
            <button class="btn-outline" :disabled="loading || !hasApiKey" @click="generateReport">{{ labels.aiRetry }}</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { BaziChart } from '@/models';
import { ensureLifeBookTask, getLifeBookTask } from '@/services/aiService';
import { getLifeBookReport, saveLifeBookReport } from '@/services/storageService';

const props = defineProps<{
  chart: BaziChart | null;
  profileId: string | null;
}>();

const labels = {
  headerTitle: '\u5929\u673a\u00b7\u4eba\u751f\u5168\u606f\u547d\u4e66',
  headerSub: '\u878d\u5408\u53e4\u6cd5\u5b50\u5e73\u4e0e\u73b0\u4ee3\u5927\u6570\u636e\u7684\u7efc\u5408\u547d\u8fd0\u63a8\u6f14',
  tabBasic: '\u57fa\u7840\u547d\u7406\uff08\u4e94\u884c/\u683c\u5c40\uff09',
  tabAI: 'AI \u6df1\u5ea6\u63a8\u6f14',
  pro: 'Pro',
  lifeTitle: '\u547d\u9020\u683c\u5c40',
  dayMaster: '\u5143\u795e\uff08\u65e5\u4e3b\uff09',
  energy: '\u80fd\u91cf\u5f3a\u5f31',
  directTitle: '\u5929\u673a\u76f4\u65ad',
  coreYong: '\u6838\u5fc3\u7528\u795e',
  guidePrefix: '\u5f00\u8fd0\u6307\u5357\uff1a',
  guideStart: '\u5efa\u8bae\u591a\u4eb2\u8fd1',
  guideMid: '\u4e94\u884c\u76f8\u5173\u7684\u4eba\u4e8b\u7269\u3002\u5728\u505a\u51b3\u7b56\u65f6\uff0c\u5b9c\u4fdd\u6301',
  guideWeak: '\u4f4e\u8c03\u5185\u655b\uff0c\u4e09\u601d\u540e\u884c\u3002',
  guideStrong: '\u79ef\u6781\u8fdb\u53d6\uff0c\u501f\u529b\u4f7f\u529b\u3002',
  careerTitle: '\u4e8b\u4e1a\u4e0e\u8d22\u5bcc',
  loveTitle: '\u60c5\u611f\u4e0e\u5a5a\u59fb',
  careerTip: '\u002a \u6b64\u4e3a\u57fa\u4e8e\u559c\u7528\u795e\u7684\u901a\u7528\u5efa\u8bae\uff0c\u7cbe\u51c6\u804c\u4e1a\u89c4\u5212\u8bf7\u67e5\u770b\u4e0b\u65b9 AI \u62a5\u544a\u3002',
  loveTip: '\u002a \u6b64\u4e3a\u57fa\u4e8e\u65e5\u652f\u4e0e\u914d\u5076\u661f\u7684\u7b80\u6279\uff0c\u5408\u76d8\u5206\u6790\u8bf7\u4f7f\u7528\u201c\u53cc\u4eba\u5408\u76d8\u201d\u529f\u80fd\u3002',
  upsellTitle: '\u60f3\u77e5\u9053\u66f4\u8be6\u7ec6\u7684\u6d41\u5e74\u8fd0\u52bf\uff1f',
  upsellDesc: '\u89e3\u9501 AI \u6df1\u5ea6\u63a8\u6f14\uff0c\u5305\u542b\u672a\u6765 3 \u5e74\u5177\u4f53\u5409\u51f6\u5206\u6790...',
  aiTitle: '\u5929\u673a\u00b7AI \u547d\u7406\u5927\u5e08',
  aiConnected: 'AI \u670d\u52a1\u5df2\u8fde\u63a5',
  aiMissing: '\u672a\u68c0\u6d4b\u5230 API \u914d\u7f6e',
  aiConfigTitle: '\u914d\u7f6e\u8bf4\u660e\uff1a',
  aiConfigDesc: '\u8bf7\u5728\u9879\u76ee\u6839\u76ee\u5f55\u7684 .env.local \u4e2d\u914d\u7f6e\u4ee5\u4e0b\u53d8\u91cf\uff0c\u914d\u7f6e\u540e\u9700\u91cd\u542f\u5f00\u53d1\u670d\u52a1\uff1a',
  aiConfigCode: 'VITE_OPENAI_API_KEY=sk-xxx...\\nVITE_OPENAI_BASE_URL=https://api.openai.com/v1\\nVITE_OPENAI_MODEL=gpt-4o',
  aiGenerateDesc: '\u5929\u673a\u5927\u5e08\u5c06\u878d\u5408\u53e4\u7c4d\u667a\u6167\u4e0e\u73b0\u4ee3\u7b97\u6cd5\uff0c\u4e3a\u60a8\u751f\u6210 3000 \u5b57\u6df1\u5ea6\u547d\u8fd0\u63a8\u6f14\u62a5\u544a\u3002',
  aiGenerateBtn: '\u5f00\u59cb\u516b\u5b57\u63a8\u6f14',
  aiGenerating: '\u5929\u673a\u63a8\u6f14\u4e2d...',
  aiRetry: '\u91cd\u65b0\u63a8\u6f14',
  aiCopy: '\u590d\u5236\u5168\u6587',
  reportTitle: '\u547d\u4e66',
  disclaimer: 'AI \u751f\u6210\u5185\u5bb9\u4ec5\u4f9b\u5a31\u4e50\u53c2\u8003\uff0c\u8bf7\u76f8\u4fe1\u79d1\u5b66\uff0c\u7406\u6027\u5bf9\u5f85\u3002',
  emptyValue: '--'
};


// --- Personality Dictionary ---
const DM_PERSONALITY: Record<string, string> = {
  '\u7532': '\u7532\u6728\u4e3a\u53c2\u5929\u5927\u6811\uff0c\u6027\u8d28\u521a\u5065\u3002\u60a8\u6027\u683c\u76f4\u723d\uff0c\u4ec1\u6148\u5584\u826f\uff0c\u5bcc\u6709\u8d23\u4efb\u611f\uff0c\u4f46\u4e0d\u4ec5\u6709\u4e9b\u56fa\u6267\uff0c\u4e0d\u5584\u8f6c\u5f2f\u3002',
  '\u4e59': '\u4e59\u6728\u4e3a\u82b1\u8349\u4e4b\u6728\uff0c\u6027\u8d28\u67d4\u987a\u3002\u60a8\u9002\u5e94\u529b\u5f3a\uff0c\u5584\u4e8e\u53d8\u901a\uff0c\u5fc3\u601d\u7ec6\u817b\uff0c\u4f46\u6709\u65f6\u7531\u4e8e\u592a\u5728\u610f\u4ed6\u4eba\u770b\u6cd5\u800c\u7f3a\u4e4f\u4e3b\u89c1\u3002',
  '\u4e19': '\u4e19\u706b\u4e3a\u592a\u9633\u4e4b\u706b\uff0c\u70ed\u60c5\u5954\u653e\u3002\u60a8\u5145\u6ee1\u6d3b\u529b\uff0c\u6177\u6168\u5927\u65b9\uff0c\u4e50\u4e8e\u52a9\u4eba\uff0c\u4f46\u6027\u6025\u6613\u6012\uff0c\u597d\u9762\u5b50\u3002',
  '\u4e01': '\u4e01\u706b\u4e3a\u706f\u70db\u4e4b\u706b\uff0c\u6e29\u548c\u6447\u66f3\u3002\u60a8\u5916\u8868\u6e29\u548c\uff0c\u5185\u5fc3\u70ed\u60c5\uff0c\u6d1e\u5bdf\u529b\u5f3a\uff0c\u5bcc\u6709\u727a\u7272\u7cbe\u795e\uff0c\u4f46\u591a\u6101\u5584\u611f\u3002',
  '\u620a': '\u620a\u571f\u4e3a\u57ce\u5899\u4e4b\u571f\uff0c\u539a\u91cd\u7a33\u56fa\u3002\u60a8\u8bda\u5b9e\u5b88\u4fe1\uff0c\u5bbd\u539a\u5305\u5bb9\uff0c\u6c89\u7a33\u8e0f\u5b9e\uff0c\u4f46\u6709\u65f6\u8fc7\u4e8e\u4fdd\u5b88\uff0c\u7f3a\u4e4f\u53d8\u901a\u3002',
  '\u5df1': '\u5df1\u571f\u4e3a\u7530\u56ed\u4e4b\u571f\uff0c\u6ecb\u517b\u4e07\u7269\u3002\u60a8\u591a\u624d\u591a\u827a\uff0c\u5185\u655b\u542b\u84c4\uff0c\u505a\u4e8b\u6709\u6761\u7406\uff0c\u4f46\u6709\u65f6\u7591\u5fc3\u8f83\u91cd\u3002',
  '\u5e9a': '\u5e9a\u91d1\u4e3a\u5200\u5251\u4e4b\u91d1\uff0c\u521a\u6bc5\u679c\u65ad\u3002\u60a8\u7231\u618e\u5206\u660e\uff0c\u8bb2\u4e49\u6c14\uff0c\u597d\u6253\u62b1\u4e0d\u5e73\uff0c\u4f46\u6027\u683c\u521a\u5f3a\uff0c\u5bb9\u6613\u5f97\u7f6a\u4eba\u3002',
  '\u8f9b': '\u8f9b\u91d1\u4e3a\u73e0\u7389\u4e4b\u91d1\uff0c\u6e29\u6da6\u79c0\u6c14\u3002\u60a8\u81ea\u5c0a\u5fc3\u5f3a\uff0c\u7231\u60dc\u7fbd\u6bdb\uff0c\u53e3\u624d\u6781\u4f73\uff0c\u4f46\u6709\u65f6\u865a\u8363\u5fc3\u8f83\u91cd\u3002',
  '\u58ec': '\u58ec\u6c34\u4e3a\u6c5f\u6cb3\u4e4b\u6c34\uff0c\u5954\u6d41\u4e0d\u606f\u3002\u60a8\u806a\u660e\u667a\u6167\uff0c\u80f8\u6000\u5bbd\u5e7f\uff0c\u5584\u4e8e\u5e94\u53d8\uff0c\u4f46\u6709\u65f6\u4efb\u6027\u653e\u7eb5\uff0c\u96be\u4ee5\u7ea6\u675f\u3002',
  '\u7678': '\u7678\u6c34\u4e3a\u96e8\u9732\u4e4b\u6c34\uff0c\u6ecb\u6da6\u4e07\u7269\u3002\u60a8\u6027\u683c\u6e29\u67d4\uff0c\u5e73\u9759\u5185\u655b\uff0c\u5bcc\u6709\u60f3\u8c61\u529b\uff0c\u4f46\u6709\u65f6\u5bb9\u6613\u60b2\u89c2\uff0c\u60c5\u7eea\u6ce2\u52a8\u5927\u3002',
};

// --- Career/Wealth Dictionary based on Yong Shen (Favored Element) ---
const CAREER_ADVICE: Record<string, string> = {
  '\u6728': '\u4e94\u884c\u559c\u6728\uff0c\u5b9c\u4ece\u4e8b\u4e0e\u201c\u751f\u957f\u3001\u6559\u80b2\u3001\u6587\u521b\u3001\u6728\u6750\u201d\u76f8\u5173\u7684\u884c\u4e1a\u3002\u5982\u6559\u80b2\u754c\u3001\u51fa\u7248\u4e1a\u3001\u5bb6\u5177\u88c5\u6f62\u3001\u82b1\u5349\u56ed\u827a\u3001\u670d\u88c5\u8bbe\u8ba1\u7b49\u3002\u4e1c\u65b9\u4e3a\u60a8\u5409\u7965\u65b9\u4f4d\u3002',
  '\u706b': '\u4e94\u884c\u559c\u706b\uff0c\u5b9c\u4ece\u4e8b\u4e0e\u201c\u53d1\u5149\u3001\u53d1\u70ed\u3001\u80fd\u6e90\u3001\u79d1\u6280\u201d\u76f8\u5173\u7684\u884c\u4e1a\u3002\u5982\u4e92\u8054\u7f51\u3001\u5149\u7535\u3001\u9910\u996e\u3001\u6f14\u827a\u754c\u3001\u7f8e\u5bb9\u7f8e\u53d1\u3001\u5fc3\u7406\u54a8\u8be2\u7b49\u3002\u5357\u65b9\u4e3a\u60a8\u5409\u7965\u65b9\u4f4d\u3002',
  '\u571f': '\u4e94\u884c\u559c\u571f\uff0c\u5b9c\u4ece\u4e8b\u4e0e\u201c\u571f\u5730\u3001\u7a33\u56fa\u3001\u627f\u8f7d\u3001\u4e2d\u95f4\u4eba\u201d\u76f8\u5173\u7684\u884c\u4e1a\u3002\u5982\u623f\u5730\u4ea7\u3001\u5efa\u7b51\u3001\u4ed3\u50a8\u3001\u519c\u7267\u3001\u4e2d\u4ecb\u987e\u95ee\u3001\u884c\u653f\u7ba1\u7406\u7b49\u3002\u672c\u5730\u6216\u4e2d\u5fc3\u5730\u5e26\u4e3a\u5409\u7965\u65b9\u4f4d\u3002',
  '\u91d1': '\u4e94\u884c\u559c\u91d1\uff0c\u5b9c\u4ece\u4e8b\u4e0e\u201c\u51b3\u65ad\u3001\u91d1\u5c5e\u3001\u91d1\u878d\u3001\u6b66\u804c\u201d\u76f8\u5173\u7684\u884c\u4e1a\u3002\u5982\u91d1\u878d\u8bc1\u5238\u3001\u73e0\u5b9d\u4e94\u91d1\u3001\u6c7d\u8f66\u673a\u68b0\u3001\u519b\u8b66\u6267\u6cd5\u3001\u5916\u79d1\u533b\u751f\u7b49\u3002\u897f\u65b9\u4e3a\u60a8\u5409\u7965\u65b9\u4f4d\u3002',
  '\u6c34': '\u4e94\u884c\u559c\u6c34\uff0c\u5b9c\u4ece\u4e8b\u4e0e\u201c\u6d41\u52a8\u3001\u5bd2\u51b7\u3001\u667a\u6167\u3001\u6e05\u6d01\u201d\u76f8\u5173\u7684\u884c\u4e1a\u3002\u5982\u8d38\u6613\u8fd0\u8f93\u3001\u822a\u6d77\u3001\u6c34\u5229\u6e05\u6d01\u3001\u51b7\u51bb\u98df\u54c1\u3001\u65c5\u6e38\u5bfc\u6e38\u3001\u8bb0\u8005\u5a92\u4f53\u7b49\u3002\u5317\u65b9\u4e3a\u60a8\u5409\u7965\u65b9\u4f4d\u3002',
};

// --- Love/Relationships Dictionary ---
// Simple logic checking Day Branch (Spouse Palace)
const RELATIONSHIP_ADVICE = (dayBranch: string, gender: string | number): string => {
  // Basic simplified interpretations
  const PEACH_BLOSSOMS = ['\u5b50', '\u5348', '\u536f', '\u9149'];
  const TRAVEL_STARS = ['\u5bc5', '\u7533', '\u5df3', '\u4ea5'];
  const STORAGE_STARS = ['\u8fb0', '\u620c', '\u4e11', '\u672a'];

  let advice = '\u914d\u5076\u5bab\u5e73\u9759\uff0c\u611f\u60c5\u751f\u6d3b\u8d8b\u4e8e\u5e73\u6de1\u7a33\u5b9a\uff0c\u5b9c\u7ec6\u6c34\u957f\u6d41\u3002';

  if (PEACH_BLOSSOMS.includes(dayBranch)) {
    advice = '\u65e5\u652f\u5750\u6843\u82b1\uff0c\u914d\u5076\u901a\u5e38\u957f\u76f8\u4fca\u7f8e\uff0c\u98ce\u6d41\u501c\u50a5\uff0c\u5f02\u6027\u7f18\u4f73\u3002\u9700\u9632\u611f\u60c5\u98ce\u6ce2\uff0c\u5b9c\u591a\u6c9f\u901a\u5efa\u7acb\u4fe1\u4efb\u3002';
  } else if (TRAVEL_STARS.includes(dayBranch)) {
    advice = '\u65e5\u652f\u5750\u9a7f\u9a6c\uff0c\u914d\u5076\u5927\u591a\u6765\u81ea\u8fdc\u65b9\uff0c\u6216\u5a5a\u540e\u751f\u6d3b\u591a\u53d8\u52a8\u5954\u6ce2\u3002\u76f8\u5904\u5b9c\u591a\u5305\u5bb9\uff0c\u8ddd\u79bb\u4ea7\u751f\u7f8e\u3002';
  } else if (STORAGE_STARS.includes(dayBranch)) {
    advice = '\u65e5\u652f\u5750\u5e93\uff0c\u914d\u5076\u6027\u683c\u6566\u539a\u6c89\u7a33\uff0c\u5584\u4e8e\u6301\u5bb6\u7406\u8d22\uff0c\u4f46\u6709\u65f6\u8f83\u4e3a\u5185\u5411\u6216\u56fa\u6267\u3002\u662f\u8fc7\u65e5\u5b50\u7684\u597d\u624b\u3002';
  }

  return advice;
};

// --- Main Interpretation Function ---
const getBriefInterpretation = (chart: BaziChart) => {
  const dayGan = chart.pillars.day.gan;
  const dayBranch = chart.pillars.day.zhi;
  const yongShenRaw = chart.wuxing.details?.yongShen || '';

  // Extract first favored element (e.g. "?/?" -> "?")
  const primaryYongShen = yongShenRaw.split('/')[0]?.trim().substring(0, 1) || '\u6728';
  const careerKey = ['\u6728', '\u706b', '\u571f', '\u91d1', '\u6c34'].find(k => k === primaryYongShen) || '\u6728';

  const personality = DM_PERSONALITY[dayGan] || '\u6027\u683c\u6e29\u548c\uff0c\u5f85\u4eba\u53cb\u5584\u3002';
  const career = CAREER_ADVICE[careerKey];
  const love = RELATIONSHIP_ADVICE(dayBranch, chart.meta.gender);

  return {
    personality,
    career,
    love
  };
};

const activeSection = ref<'basic' | 'ai'>('basic');
const loading = ref(false);
const reportContent = ref('');
const reportTimestamp = ref(0);
const errorMsg = ref('');
const activeTaskProfile = ref<string | null>(null);
const hasApiKey = computed(() => !!import.meta.env.VITE_OPENAI_API_KEY);



const brief = computed(() => {
  if (!props.chart) {
    return { personality: labels.emptyValue, career: labels.emptyValue, love: labels.emptyValue };
  }
  return getBriefInterpretation(props.chart);
});

const dayMaster = computed(() => props.chart?.pillars.day.gan || labels.emptyValue);
const strengthBadge = computed(() => {
  if (!props.chart?.wuxing.details) return labels.emptyValue;
  const strength = props.chart.wuxing.details.strength || labels.emptyValue;
  const percentage = props.chart.wuxing.details.percentage;
  return typeof percentage === 'number' ? `${strength} (${percentage}%)` : strength;
});

const yongShenText = computed(() => props.chart?.wuxing.details?.yongShen || labels.emptyValue);
const yongShenMain = computed(() => {
  const raw = yongShenText.value;
  return raw.split('/')[0]?.trim() || labels.emptyValue;
});

const directGuide = computed(() => {
  if (!props.chart?.wuxing.details?.yongShen) return labels.emptyValue;
  const strength = props.chart.wuxing.details.strength || '';
  const tail = strength.includes('\u5f31') ? labels.guideWeak : labels.guideStrong;
  return `${labels.guideStart}${yongShenMain.value}${labels.guideMid}${tail}`;
});

const reportDate = computed(() => {
  if (!reportTimestamp.value) return '';
  return new Date(reportTimestamp.value).toLocaleDateString();
});

type ReportSegment = { text: string; bold?: boolean };
type ReportBlock = {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'rating' | 'verdict' | 'spacer';
  segments: ReportSegment[];
  prefix?: string;
};
const RATING_LABEL = '\u5929\u673a\u8bc4\u5206\uff1a';
const VERDICT_LABEL = '\u5929\u673a\u5224\u8bed\uff1a';
const BULLET_PREFIX = '\u2022 ';
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
    } else if (/^##\s+/.test(line)) {
      type = 'h2';
      text = line.replace(/^##\s+/, '');
    } else if (/^#\s+/.test(line)) {
      type = 'h1';
      text = line.replace(/^#\s+/, '');
    } else if (line.startsWith(RATING_LABEL)) {
      type = 'rating';
      text = line;
      prefix = RATING_PREFIX;
    } else if (line.startsWith(VERDICT_LABEL)) {
      type = 'verdict';
      text = line;
      prefix = VERDICT_PREFIX;
    } else if (/^[-*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line)) {
      type = 'li';
      text = line.replace(/^[-*]\s+/, '').replace(/^\d+[\.)]\s+/, '');
      prefix = BULLET_PREFIX;
    }

    let segments = parseSegments(text);
    if (type === 'rating' || type === 'verdict') {
      const label = type === 'rating' ? RATING_LABEL : VERDICT_LABEL;
      const rest = text.slice(label.length).trim();
      segments = [
        { text: label, bold: true },
        { text: rest ? ` ${rest}` : '' }
      ];
    }

    blocks.push({ type, segments, prefix });
  });

  return blocks;
});

const loadReport = () => {
  if (!props.profileId) return;
  const saved = getLifeBookReport(props.profileId);
  if (saved) {
    reportContent.value = saved;
    reportTimestamp.value = Date.now();
  }
};

const attachPendingTask = () => {
  if (!props.profileId) return;
  const currentId = props.profileId;
  const task = getLifeBookTask(currentId);
  if (!task) return;
  if (activeTaskProfile.value === currentId) return;
  activeTaskProfile.value = currentId;
  loading.value = true;
  errorMsg.value = '';
  task.promise
    .then((content) => {
      saveLifeBookReport(currentId, content);
      if (props.profileId === currentId) {
        reportContent.value = content;
        reportTimestamp.value = Date.now();
      }
    })
    .catch((e: any) => {
      const detail = e?.message || e?.errMsg || (typeof e === 'string' ? e : '请求失败');
      errorMsg.value = `${labels.aiGenerateBtn}: ${detail}`;
    })
    .finally(() => {
      if (activeTaskProfile.value === currentId) {
        loading.value = false;
        activeTaskProfile.value = null;
      }
    });
};

watch(() => props.profileId, () => {
  loadReport();
  attachPendingTask();
}, { immediate: true });

const generateReport = async () => {
  if (!props.chart || !props.profileId || loading.value) return;
  if (!hasApiKey.value) return;

  const currentId = props.profileId;
  loading.value = true;
  errorMsg.value = '';
  try {
    const content = await ensureLifeBookTask(currentId, props.chart);
    saveLifeBookReport(currentId, content);
    if (props.profileId === currentId) {
      reportContent.value = content;
      reportTimestamp.value = Date.now();
    }
  } catch (e: any) {
    console.error('[LifeBook] generate report failed', e);
    const detail = e?.message || e?.errMsg || (typeof e === 'string' ? e : '\u8bf7\u6c42\u5931\u8d25');
    errorMsg.value = `${labels.aiGenerateBtn}: ${detail}`;
  } finally {
    loading.value = false;
  }
};

const copyText = () => {
  if (!reportContent.value) return;
  uni.setClipboardData({
    data: reportContent.value,
    success: () => uni.showToast({ title: labels.aiCopy })
  });
};
</script>

<style scoped>
.life-book-container {
  padding: 24rpx;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.animate-fade-in { animation: fadeIn 0.5s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.page-header { display: flex; flex-direction: column; gap: 8rpx; }
.title-row { display: flex; align-items: center; gap: 12rpx; }
.brand-dot { width: 20rpx; height: 20rpx; border-radius: 6rpx; background: #7c3aed; }
.page-title { font-size: 36rpx; font-weight: bold; color: #1e293b; }
.page-sub { font-size: 24rpx; color: #94a3b8; }

.tab-bar {
  display: flex;
  gap: 32rpx;
  border-bottom: 1px solid #e2e8f0;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding-bottom: 18rpx;
  font-size: 26rpx;
  color: #64748b;
}
.tab-btn.active {
  color: #7c3aed;
  border-bottom: 4rpx solid #7c3aed;
  font-weight: bold;
}
.pro-badge {
  font-size: 20rpx;
  background: #e0e7ff;
  color: #4338ca;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
}

.basic-section { display: flex; flex-direction: column; gap: 24rpx; }
.grid-2 { display: flex; flex-direction: column; gap: 24rpx; }

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1px solid #f1f5f9;
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.02);
}
.card-title { display: flex; align-items: center; gap: 12rpx; font-weight: bold; color: #334155; margin-bottom: 16rpx; }
.accent { width: 6rpx; height: 28rpx; background: #7c3aed; border-radius: 999rpx; }
.accent.green { background: #10b981; }

.row-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.label { font-size: 24rpx; color: #94a3b8; }
.value { font-size: 32rpx; font-weight: 900; color: #1e293b; font-family: serif; }
.badge { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 8rpx; background: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe; }
.divider { height: 1px; background: #f1f5f9; margin: 12rpx 0; }
.desc { font-size: 24rpx; color: #475569; line-height: 1.6; }

.direct-card { background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; border: none; }
.direct-card .card-title { color: #e2e8f0; }
.direct-block { margin-bottom: 16rpx; }
.direct-label { font-size: 20rpx; color: #94a3b8; text-transform: uppercase; letter-spacing: 2rpx; }
.direct-value { font-size: 36rpx; font-weight: bold; color: #6ee7b7; margin-top: 6rpx; }
.direct-desc { font-size: 24rpx; color: #e2e8f0; line-height: 1.6; }
.direct-strong { font-weight: bold; color: #fff; }

.icon-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.icon-dot.amber { background: #f59e0b; }
.icon-dot.rose { background: #f43f5e; }

.tip-box { margin-top: 16rpx; font-size: 22rpx; color: #94a3b8; background: #f8fafc; padding: 12rpx; border-radius: 12rpx; }

.upsell-card {
  background: linear-gradient(135deg, #ede9fe, #e0e7ff);
  border: 1px solid #c7d2fe;
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}
.upsell-title { font-weight: bold; color: #312e81; font-size: 28rpx; display: block; margin-bottom: 8rpx; }
.upsell-desc { font-size: 24rpx; color: #4c1d95; }
.upsell-icon { width: 56rpx; height: 56rpx; border-radius: 50%; background: #fff; color: #4c1d95; display: flex; align-items: center; justify-content: center; font-weight: bold; }

.ai-section { display: flex; flex-direction: column; }
.ai-card { background: #fff; border-radius: 24rpx; padding: 24rpx; border: 1px solid #f1f5f9; box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.02); }
.ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; gap: 16rpx; }
.ai-title-row { display: flex; align-items: center; gap: 12rpx; }
.ai-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #7c3aed; }
.ai-title { font-size: 28rpx; font-weight: bold; color: #4c1d95; }
.ai-status { display: flex; align-items: center; gap: 12rpx; }
.ai-badge { font-size: 20rpx; padding: 6rpx 12rpx; border-radius: 999rpx; }
.ai-badge.ok { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
.ai-badge.warn { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

.btn-ghost { font-size: 22rpx; color: #64748b; background: transparent; border: none; }
.btn-ghost[disabled] { opacity: 0.6; }

.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 48rpx 0; }
.spinner {
  width: 64rpx; height: 64rpx;
  border: 6rpx solid #ddd6fe; border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { color: #475569; font-size: 26rpx; }

.config-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 16rpx; padding: 16rpx; margin-bottom: 24rpx; }
.config-title { font-weight: bold; color: #b45309; margin-bottom: 8rpx; display: block; }
.config-desc { font-size: 22rpx; color: #b45309; margin-bottom: 8rpx; }
.config-code { font-size: 20rpx; color: #92400e; background: #fef3c7; padding: 12rpx; border-radius: 12rpx; white-space: pre-wrap; }

.empty-state { text-align: center; padding: 24rpx; display: flex; flex-direction: column; gap: 16rpx; }
.empty-desc { font-size: 24rpx; color: #64748b; }
.error-text { font-size: 22rpx; color: #dc2626; }
.btn-generate {
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  color: #fff;
  border-radius: 999rpx;
  padding: 20rpx 48rpx;
  font-size: 28rpx;
  box-shadow: 0 8rpx 20rpx rgba(124, 58, 237, 0.3);
}
.btn-generate[disabled] { opacity: 0.5; }

.report-content { display: flex; flex-direction: column; gap: 16rpx; }
.report-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #f1f5f9; padding-bottom: 12rpx; }
.rh-title { font-size: 32rpx; font-weight: bold; color: #1e293b; }
.rh-date { font-size: 22rpx; color: #94a3b8; }

.markdown-body { display: flex; flex-direction: column; }
.md-block { margin-bottom: 12rpx; }
.md-spacer { height: 12rpx; }
.md-h1 text { font-size: 30rpx; font-weight: bold; color: #1e293b; }
.md-h2 text { font-size: 28rpx; font-weight: bold; color: #6d28d9; }
.md-h3 text { font-size: 26rpx; font-weight: bold; color: #334155; }
.md-p text, .md-li text { font-size: 24rpx; color: #475569; line-height: 1.7; }
.md-li { padding-left: 10rpx; }
.md-rating, .md-verdict {
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.md-rating text { color: #6d28d9; font-size: 24rpx; }
.md-verdict text { color: #334155; font-size: 24rpx; }
.md-rating .md-bold { color: #6d28d9; }
.md-verdict .md-bold { color: #334155; }
.md-prefix { color: #7c3aed; font-size: 24rpx; margin-right: 6rpx; }
.md-seg { font-size: 24rpx; color: inherit; }
.md-bold { font-weight: 700; }
.md-p .md-bold, .md-li .md-bold { color: #1e293b; }

.report-footer { font-size: 20rpx; color: #94a3b8; text-align: center; padding-top: 12rpx; border-top: 1px solid #f1f5f9; }
.actions { display: flex; gap: 16rpx; }
.btn-secondary { flex: 1; background: #f1f5f9; color: #334155; font-size: 26rpx; border-radius: 12rpx; }
.btn-outline { flex: 1; background: transparent; border: 1px solid #e2e8f0; color: #64748b; font-size: 26rpx; border-radius: 12rpx; }
</style>
