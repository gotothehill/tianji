<template>
  <view v-if="rel" class="zodiac-card">
    <!-- Header -->
    <view class="header">
      <view class="avatar">
        {{ animal }}
      </view>
      <view>
        <view class="title">生肖分析 · {{ animal }}</view>
        <view class="subtitle">年支: {{ yearZhi }}</view>
      </view>
    </view>

    <view class="grid-container">
      <!-- Lucky / Affinity Section -->
      <view class="section-card red-theme">
        <view class="section-header red-text">
          <text class="icon-text">❤</text>
          <text>缘分相合</text>
        </view>

        <view class="list-container">
          <view class="list-item">
            <view class="label-container" @click="showTooltip('三合', '明合。代表志同道合、配合默契，是极好的合作与婚配组合。')">
                <text class="label-text red-label">三合</text>
                <text class="info-icon">i</text>
            </view>
            <view class="tags">
                <view v-for="a in rel.sanHe" :key="a" class="tag red-tag">{{ a }}</view>
            </view>
          </view>
          <view class="list-item">
            <view class="label-container" @click="showTooltip('六合', '暗合。代表互为贵人，私下关系好，互相扶持，如胶似漆。')">
                <text class="label-text red-label">六合</text>
                <text class="info-icon">i</text>
            </view>
             <view class="tags">
                <view v-for="a in rel.liuHe" :key="a" class="tag red-tag">{{ a }}</view>
            </view>
          </view>
          <view class="list-item">
            <view class="label-container" @click="showTooltip('三会', '同党。同气相求，力量最大，往往代表亲戚朋友或同乡互助。')">
                <text class="label-text red-label">三会</text>
                <text class="info-icon">i</text>
            </view>
             <view class="tags">
                <view v-for="a in rel.sanHui" :key="a" class="tag red-tag">{{ a }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- Unlucky / Caution Section -->
      <view class="section-card gray-theme">
        <view class="section-header amber-text">
          <text class="icon-text">⚠</text>
          <text class="gray-title">需要注意</text>
        </view>

        <view class="list-container">
           <view class="list-item">
             <view class="label-container" @click="showTooltip('相冲', '五行对立。代表动荡、冲突、意见不合，容易导致分离或变动。')">
                <text class="label-text gray-label">相冲</text>
                <text class="info-icon">i</text>
            </view>
             <view class="tags">
                <view v-for="a in rel.chong" :key="a" class="tag gray-tags">{{ a }}</view>
            </view>
          </view>
          <view class="list-item">
             <view class="label-container" @click="showTooltip('相刑', '互为折磨。代表纠结、难受、精神压力，或法律、身体上的小麻烦。')">
                <text class="label-text gray-label">相刑</text>
                <text class="info-icon">i</text>
            </view>
             <view class="tags">
                <view v-for="a in rel.xing" :key="a" class="tag gray-tags">{{ a }}</view>
            </view>
          </view>
           <view class="list-item">
             <view class="label-container" @click="showTooltip('相害', '互相伤害。代表小人破坏、背后使坏，或者亲人之间的不和睦。')">
                <text class="label-text gray-label">相害</text>
                <text class="info-icon">i</text>
            </view>
             <view class="tags">
                <view v-for="a in rel.hai" :key="a" class="tag gray-tags">{{ a }}</view>
            </view>
          </view>
           <view class="list-item">
             <view class="label-container" @click="showTooltip('相破', '破坏干扰。代表内部破坏，好事多磨，通常指人际关系裂痕。')">
                <text class="label-text gray-label">相破</text>
                <text class="info-icon">i</text>
            </view>
             <view class="tags">
                <view v-for="a in rel.po" :key="a" class="tag gray-tags">{{ a }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Footer Tip -->
    <view class="footer-tip">
      <text class="bulb-icon">💡</text>
      <text>提示：生肖相合仅供参考，人际交往更看重性格契合与沟通，切勿迷信。</text>
    </view>

  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  yearZhi: string
}>();

const ZHI_TO_ANIMAL: Record<string, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

const ZODIAC_RELATIONS: Record<string, any> = {
  '子': { 
    sanHe: ['龙', '猴'], liuHe: ['牛'], sanHui: ['猪', '牛'],
    chong: ['马'], xing: ['兔'], hai: ['羊'], po: ['鸡']
  },
  '丑': { 
    sanHe: ['蛇', '鸡'], liuHe: ['鼠'], sanHui: ['猪', '鼠'],
    chong: ['羊'], xing: ['羊', '狗'], hai: ['马'], po: ['龙']
  },
  '寅': { 
    sanHe: ['马', '狗'], liuHe: ['猪'], sanHui: ['兔', '龙'],
    chong: ['猴'], xing: ['蛇', '猴'], hai: ['蛇'], po: ['猪']
  },
  '卯': { 
    sanHe: ['猪', '羊'], liuHe: ['狗'], sanHui: ['虎', '龙'],
    chong: ['鸡'], xing: ['鼠'], hai: ['龙'], po: ['马']
  },
  '辰': { 
    sanHe: ['鼠', '猴'], liuHe: ['鸡'], sanHui: ['虎', '兔'],
    chong: ['狗'], xing: ['龙'], hai: ['兔'], po: ['牛']
  },
  '巳': { 
    sanHe: ['鸡', '牛'], liuHe: ['猴'], sanHui: ['马', '羊'],
    chong: ['猪'], xing: ['虎', '猴'], hai: ['虎'], po: ['猴']
  },
  '午': { 
    sanHe: ['虎', '狗'], liuHe: ['羊'], sanHui: ['蛇', '羊'],
    chong: ['鼠'], xing: ['午'], hai: ['牛'], po: ['兔']
  },
  '未': { 
    sanHe: ['猪', '兔'], liuHe: ['马'], sanHui: ['蛇', '马'],
    chong: ['牛'], xing: ['牛', '狗'], hai: ['鼠'], po: ['狗']
  },
  '申': { 
    sanHe: ['鼠', '龙'], liuHe: ['蛇'], sanHui: ['鸡', '狗'],
    chong: ['虎'], xing: ['虎', '蛇'], hai: ['猪'], po: ['蛇']
  },
  '酉': { 
    sanHe: ['蛇', '牛'], liuHe: ['龙'], sanHui: ['猴', '狗'],
    chong: ['兔'], xing: ['酉'], hai: ['狗'], po: ['鼠']
  },
  '戌': { 
    sanHe: ['虎', '马'], liuHe: ['兔'], sanHui: ['猴', '鸡'],
    chong: ['龙'], xing: ['牛', '羊'], hai: ['鸡'], po: ['羊']
  },
  '亥': { 
    sanHe: ['兔', '羊'], liuHe: ['虎'], sanHui: ['鼠', '牛'],
    chong: ['蛇'], xing: ['亥'], hai: ['猴'], po: ['虎']
  }
};

const animal = computed(() => ZHI_TO_ANIMAL[props.yearZhi] || '');
// Check if yearZhi exists in relations
const rel = computed(() => ZODIAC_RELATIONS[props.yearZhi] || null);

const showTooltip = (title: string, content: string) => {
    uni.showModal({
        title: title,
        content: content,
        showCancel: false,
        confirmText: '了解'
    });
};

</script>

<style scoped>
.zodiac-card {
    background: #fff;
    border-radius: 24rpx;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
    padding: 24rpx;
}

.header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 999rpx;
    background: #4f46e5;
    color: white;
    font-size: 40rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 6rpx rgba(0,0,0,0.1);
}

.title {
    font-size: 36rpx;
    font-weight: bold;
    color: #1f2937;
}

.subtitle {
    font-size: 24rpx;
    background: #f3f4f6;
    color: #6b7280;
    padding: 2rpx 8rpx;
    border-radius: 4rpx;
    display: inline-block;
    margin-top: 4rpx;
}

.grid-container {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.section-card {
    border-radius: 24rpx;
    padding: 20rpx;
    border: 1px solid transparent;
}
.red-theme {
    background: rgba(255, 241, 242, 0.6);
    border-color: #ffe4e6;
}
.gray-theme {
    background: #f9fafb;
    border-color: #f3f4f6;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
    font-weight: bold;
}
.red-text { color: #e11d48; }
.amber-text { color: #d97706; }
.gray-title { color: #374151; }

.list-container {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.list-item {
    display: flex;
    align-items: flex-start;
}

.label-container {
    display: flex;
    align-items: center;
    width: 100rpx;
    margin-top: 6rpx;
    flex-shrink: 0;
}

.label-text {
    font-size: 24rpx;
    font-weight: bold;
}
.red-label { color: #fb7185; }
.gray-label { color: #9ca3af; }

.info-icon {
    font-size: 20rpx;
    background: #e5e7eb;
    color: #6b7280;
    border-radius: 50%;
    width: 24rpx;
    height: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 4rpx;
    transform: scale(0.8);
}

.tags {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
}

.tag {
    display: inline-block;
    padding: 4rpx 16rpx;
    border-radius: 999rpx;
    font-size: 24rpx;
    font-weight: 500;
}
.red-tag { background: #fff; color: #f43f5e; border: 1px solid #ffe4e6; }
.gray-tags { background: #fff; color: #6b7280; border: 1px solid #e5e7eb; }

.footer-tip {
    margin-top: 24rpx;
    background: #fffbeb;
    color: #92400e;
    font-size: 22rpx;
    padding: 16rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
    border: 1px solid #fef3c7;
}

.bulb-icon { color: #f59e0b; }
</style>
