<template>
  <view class="timeline-container animate-fade-in">

    <!-- Navigation -->
    <view class="nav-bar">
      <view 
        class="nav-btn" 
        :class="{ active: viewMode === 'fortune' }"
        @click="viewMode = 'fortune'"
      >
        <text class="nav-icon">☀</text>
        <text>今日必读</text>
      </view>
       <view 
        class="nav-btn" 
        :class="{ active: viewMode === 'dayun' }"
        @click="viewMode = 'dayun'"
      >
        <text class="nav-icon">📈</text>
        <text>一生大运</text>
      </view>
    </view>

    <!-- View 1: Fortune -->
    <view v-if="viewMode === 'fortune'" class="fortune-view">
        <view v-if="!lunarData" class="loading-box">
             <view v-if="errorMsg" class="error-msg">
                 <text>⚠ 万年历加载失败: {{ errorMsg }}</text>
             </view>
             <view v-else class="loading-text">
                 <text>↻ 正在计算星历数据...</text>
             </view>
        </view>
        
        <block v-else>
            <!-- Hero Card -->
            <view class="hero-card">
                 <view class="hero-top">
                     <view class="hero-info">
                         <view class="tags-row">
                             <text class="tag-glass">{{ lunarData.ganZhiYear }}年</text>
                             <text class="tag-glass">{{ lunarData.ganZhiMonth }}月</text>
                             <text v-if="lunarData.zhiXing" class="tag-amber">{{ lunarData.zhiXing }}日</text>
                         </view>
                         <view class="date-big">{{ lunarData.cnMonth }}月{{ lunarData.cnDay }}</view>
                         <view class="date-sub">{{ nowDateStr }} {{ weekDayStr }}</view>
                     </view>
                     <view class="hero-ganzhi">
                         <text class="ganzhi-main">{{ lunarData.ganZhiDay }}</text>
                         <text class="ganzhi-sub">当日干支</text>
                     </view>
                 </view>
                 
                 <view class="yiji-box">
                     <view class="yiji-col border-r">
                         <view class="yiji-title green"><text class="dot green-dot"></text> 宜 (Do)</view>
                         <text class="yiji-content">{{ lunarData.yi.join(' ') }}</text>
                     </view>
                     <view class="yiji-col">
                         <view class="yiji-title red"><text class="dot red-dot"></text> 忌 (Don't)</view>
                         <text class="yiji-content">{{ lunarData.ji.join(' ') }}</text>
                     </view>
                 </view>
            </view>
            
            <!-- Lucky Directions -->
            <view class="card">
                <view class="card-header"><text class="icon">🧭</text> <text>吉神方位</text></view>
                <view class="dir-grid">
                    <view class="dir-item">
                        <text class="dir-label">财神</text>
                        <text class="dir-val">{{ lunarData.wealthPos }}</text>
                    </view>
                     <view class="dir-item">
                        <text class="dir-label">喜神</text>
                        <text class="dir-val">{{ lunarData.joyPos }}</text>
                    </view>
                     <view class="dir-item">
                        <text class="dir-label">贵人</text>
                        <text class="dir-val">{{ lunarData.noblePos }}</text>
                    </view>
                </view>
            </view>
            
            <!-- 12 Hours -->
            <view class="card">
                <view class="card-header"><text class="icon">🕒</text> <text>十二时辰吉凶</text></view>
                <scroll-view scroll-x class="hours-scroll">
                    <view class="hours-flex">
                        <view v-for="(h, idx) in lunarData.hours" :key="idx" 
                              class="hour-item" :class="{ 'lucky-hour': h.luck === '吉' }">
                            <text class="hour-zhi">{{ h.zhi }}时</text>
                            <text class="hour-time">{{ h.time }}</text>
                            <text class="hour-tag" :class="h.luck === '吉' ? 'tag-green' : 'tag-red'">
                                {{ h.god }} {{ h.luck }}
                            </text>
                        </view>
                    </view>
                </scroll-view>
            </view>
            
            <!-- Gods List -->
            <view class="card">
                <view class="gods-grid">
                    <view class="gods-col">
                         <view class="gods-head green-txt">✨ 吉神</view>
                         <view class="gods-tags">
                             <text v-for="g in (lunarData.jiShen || []).slice(0,8)" :key="g" class="god-tag green-bg">{{ g }}</text>
                         </view>
                    </view>
                     <view class="gods-col">
                         <view class="gods-head red-txt">⚠ 凶神</view>
                         <view class="gods-tags">
                             <text v-for="g in (lunarData.xiongSha || []).slice(0,8)" :key="g" class="god-tag red-bg">{{ g }}</text>
                         </view>
                    </view>
                </view>
            </view>
            
            <!-- Chong Sha & Peng Zu -->
            <view class="grid-2">
                <view class="card">
                    <view class="card-header-sm">⚠ 今日冲煞</view>
                    <view class="row-between"><text class="gray">日破</text><text class="bold">{{ lunarData.chong }}</text></view>
                    <view class="divider"></view>
                    <view class="row-between"><text class="gray">煞方</text><text class="bold">{{ lunarData.sha }}</text></view>
                </view>
                 <view class="card">
                    <view class="card-header-sm">📜 彭祖百忌</view>
                    <view class="peng-item"><text class="indigo">{{ lunarData.ganZhiDay[0] }}:</text> {{ lunarData.pengZuGan }}</view>
                    <view class="peng-item"><text class="indigo">{{ lunarData.ganZhiDay[1] }}:</text> {{ lunarData.pengZuZhi }}</view>
                </view>
            </view>
            
            <!-- AI Guide -->
            <view class="card ai-card">
                <view class="ai-header">
                    <view class="ai-head-left">
                        <text class="icon">✨</text>
                        <text class="ai-title">AI 每日指南</text>
                    </view>
                </view>
                <view v-if="isGenerating" class="ai-loading">
                    <view class="spinner-sm"></view>
                    <text class="gray">正在请求天机先生...</text>
                </view>
                <view v-else-if="aiGuide" class="ai-content">
                    <view v-for="(item, idx) in aiGuideItems" :key="idx" class="ai-item">
                        <text class="ai-label">{{ item.label }}</text>
                        <text class="ai-text" space="nbsp">{{ item.text }}</text>
                    </view>
                </view>
                <view v-else class="ai-empty">
                    <text class="gray-desc">结合今日黄历、八字命盘，生成个性化操作指引。</text>
                    <button class="btn-secondary" @click="handleGenerateGuide">生成今日指引</button>
                </view>
            </view>
            
        </block>
    </view>

    <!-- View 2: Da Yun -->
    <view v-if="viewMode === 'dayun'" class="dayun-view">
        <scroll-view scroll-x class="dayun-scroll">
            <view class="dayun-flex">
                <view 
                    v-for="(yun, idx) in chart?.daYun" 
                    :key="idx"
                    class="dayun-item"
                    :class="{ active: selectedDaYunIndex === idx }"
                    @click="handleDayunSelect(idx)"
                >
                    <text class="dy-age">{{ yun.startAge }}岁</text>
                    <view class="dy-ganzhi">
                        <text class="dy-god">{{ yun.ganGod }}</text>
                        <text class="dy-char">{{ yun.gan }}</text>
                        <text class="dy-char">{{ yun.zhi }}</text>
                    </view>
                    <text class="dy-year">{{ yun.startYear }}</text>
                </view>
            </view>
        </scroll-view>
        
        <!-- Details -->
        <view v-if="selectedDaYun" class="card detail-card">
            <view class="detail-header">
                <view class="dh-left">
                    <text class="dh-title">{{ selectedDaYun.gan }}{{ selectedDaYun.zhi }}大运</text>
                    <text class="dh-sub">大运详情</text>
                </view>
                <text class="dh-range">{{ selectedDaYun.startYear }} - {{ selectedDaYun.startYear + 9 }}</text>
            </view>
            
            <view class="liunian-grid">
                <view 
                    v-for="(year, idx) in selectedDaYun.liuNian" 
                    :key="idx" 
                    class="ln-item"
                    :class="{ active: selectedYear?.year === year.year }"
                    @click="selectedYear = year"
                >
                     <view class="ln-top">
                         <text class="mono">{{ year.year }}</text>
                         <text class="age-badge">{{ year.age }}岁</text>
                     </view>
                     <view class="ln-mid">
                         <text class="ln-god">{{ year.ganGod }}</text>
                         <text class="ln-gz">{{ year.gan }}{{ year.zhi }}</text>
                     </view>
                </view>
            </view>
            
            <view v-if="selectedYear" class="info-year-box animate-fade-in">
                 <view class="iy-header">
                     <text class="iy-gz">{{ selectedYear.gan }}{{ selectedYear.zhi }}</text>
                     <text class="iy-year">{{ selectedYear.year }}年</text>
                     <text class="iy-god-tag">{{ selectedYear.ganGod }}年</text>
                 </view>
                 <view class="iy-desc">
                     {{ TEN_GOD_INFO[selectedYear.ganGod] }}
                 </view>
            </view>
        </view>
    </view>
    
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { BaziChart, DaYunData, LiuNianData } from '@/models';
import { Lunar } from 'lunar-javascript';
import { generateDailyGuide, DailyFortuneAPI } from '@/services/aiService';

const props = defineProps<{
  chart: BaziChart | undefined | null
}>();

const viewMode = ref<'fortune' | 'dayun'>('fortune');
const selectedDaYunIndex = ref(0);
const selectedYear = ref<LiuNianData | null>(null);
const now = ref(new Date());

const lunarData = ref<any>(null);
const errorMsg = ref<string | null>(null);
const aiGuide = ref<string | null>(null);
const isGenerating = ref(false);

const TEN_GOD_INFO: Record<string, string> = {
  '比肩': '兄弟朋友助力，利合作盟友。但亦有竞争夺财之象，忌独断专行。',
  '劫财': '个性刚强，易冲动破财。虽然人脉广，但不利积蓄，需防小人争斗。',
  '食神': '福气临门，衣食无忧，心情舒畅。利于才艺创作与享受生活，诸事平顺。',
  '伤官': '思维活跃，才华横溢。但易变动工作或招惹口舌是非，利创新，忌傲慢。',
  '正财': '财运稳定，多为工薪正途之财。利积蓄守成，男命此时利于姻缘建立。',
  '偏财': '意外之财，投资获利机会多。财路宽广但也易大起大落，忌贪婪冒进。',
  '正官': '事业升迁，名誉地位提升。利于考试、求职与升职，女命利夫运。',
  '七杀': '压力增大，挑战与机遇并存。虽有魄力开拓但易生意外或疾病，宜守忌攻。',
  '正印': '贵人提拔，利名声学业。生活安逸稳定，少劳苦，多得长辈庇护。',
  '偏印': '思想独特，灵感丰富。利于冷门偏业或学术研究，但性格多孤僻，防孤独。'
};

const TIMING_MAP = ['23-01', '01-03', '03-05', '05-07', '07-09', '09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];
const SHI_CHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const DIRECTION_MAP: Record<string, string> = {
  '坎': '正北', '离': '正南', '震': '正东', '兑': '正西',
  '巽': '东南', '坤': '西南', '艮': '东北', '乾': '西北',
  '中': '中宫'
};

type AiGuideItem = {
    label: string;
    text: string;
};

type AiGuideKey = 'quote' | 'wealth' | 'career' | 'love' | 'caution' | 'lucky' | 'other';

const buildZhLabel = (...codes: number[]) => String.fromCharCode(...codes);
const AI_GUIDE_LABELS: { key: AiGuideKey; label: string }[] = [
    { key: 'quote', label: buildZhLabel(0x4eca, 0x65e5, 0x4e00, 0x8a00) },
    { key: 'wealth', label: buildZhLabel(0x8d22, 0x8fd0, 0x65b9, 0x4f4d) },
    { key: 'career', label: buildZhLabel(0x4e8b, 0x4e1a, 0x673a, 0x7f18) },
    { key: 'love', label: buildZhLabel(0x60c5, 0x611f, 0x4eba, 0x9645) },
    { key: 'caution', label: buildZhLabel(0x907f, 0x9669, 0x6307, 0x5357) },
    { key: 'lucky', label: buildZhLabel(0x5929, 0x673a, 0x9526, 0x56ca) }
];

const normalizeAiKey = (raw: string): AiGuideKey => {
    const cleaned = raw
        .replace(/\*\*/g, '')
        .replace(/[\uFF1A:]+$/, '')
        .replace(/^[\u3010\uFF08\[\(]+|[\u3011\uFF09\]\)]+$/g, '')
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '')
        .toLowerCase();
    if (!cleaned) return 'other';
    if (cleaned.includes('quote') || cleaned.includes('\u4eca\u65e5')) return 'quote';
    if (cleaned.includes('wealth') || cleaned.includes('\u8d22')) return 'wealth';
    if (cleaned.includes('career') || cleaned.includes('\u4e8b\u4e1a')) return 'career';
    if (cleaned.includes('love') || cleaned.includes('\u60c5') || cleaned.includes('\u611f\u60c5')) return 'love';
    if (cleaned.includes('caution') || cleaned.includes('\u907f') || cleaned.includes('\u6ce8\u610f')) return 'caution';
    if (cleaned.includes('lucky') || cleaned.includes('\u5e78\u8fd0') || cleaned.includes('\u989c\u8272') || cleaned.includes('\u9526\u56ca')) return 'lucky';
    return 'other';
};
const nowDateStr = computed(() => now.value.toLocaleDateString());
const weekDayStr = computed(() => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.value.getDay()]);
const aiGuideItems = computed<AiGuideItem[]>(() => {
    if (!aiGuide.value) return [];
    const parsed: Partial<Record<AiGuideKey, string>> = {};
    const extras: string[] = [];
    let currentKey: AiGuideKey | null = null;
    const appendValue = (key: AiGuideKey, text: string) => {
        if (!text) return;
        if (parsed[key]) {
            parsed[key] = `${parsed[key]}\n${text}`;
        } else {
            parsed[key] = text;
        }
    };
    aiGuide.value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => line.replace(/^>+\s*/, '').replace(/^#+\s*/, '').replace(/^[\-\*\u2022\d\.\)\s]+/, '').replace(/\*\*/g, '').trim())
        .forEach((line) => {
            if (!line) return;
            const labelMatch = line.match(/^(.{1,12}?)[\uFF1A:]\s*(.+)$/);
            if (labelMatch) {
                const label = labelMatch[1].trim();
                const text = labelMatch[2].trim();
                if (!text) return;
                const key = normalizeAiKey(label);
                if (key === 'other') {
                    extras.push(text);
                    currentKey = null;
                    return;
                }
                currentKey = key;
                appendValue(key, text);
                return;
            }

            if (currentKey) {
                appendValue(currentKey, line);
                return;
            }

            extras.push(line);
        });

    if (extras.length) {
        const extraText = extras.join('\n');
        if (parsed.lucky) {
            parsed.lucky = `${parsed.lucky}\n${extraText}`;
        } else {
            parsed.lucky = extraText;
        }
    }

    const items: AiGuideItem[] = [];
    AI_GUIDE_LABELS.forEach((item) => {
        const value = parsed[item.key];
        if (value) {
            items.push({ label: item.label, text: value });
        }
    });
    return items;
});

const sessionIdentity = computed(() => {
    if (!props.chart) return null;
    const todayStr = `${now.value.getFullYear()}-${now.value.getMonth() + 1}-${now.value.getDate()}`;
    const safeId = (props.chart.meta.solarDate + props.chart.meta.gender).replace(/[^a-zA-Z0-9]/g, '');
    return { id: safeId, date: todayStr };
});

const loadDailyGuide = async () => {
    if (!sessionIdentity.value) return;
    const cached = await DailyFortuneAPI.get(sessionIdentity.value.id, sessionIdentity.value.date);
    if (cached) {
        aiGuide.value = cached;
    }
};

const loadLunar = async () => {
    try {
        const d = Lunar.fromDate(now.value);
        if (!d) return;

        const hoursList = [];
        const startOfDay = new Date(now.value);
        startOfDay.setHours(0, 0, 0, 0);

        for (let i = 0; i < 12; i++) {
            const h = i * 2;
            const tmpDate = new Date(startOfDay);
            tmpDate.setHours(h);
            const tmpLunar = Lunar.fromDate(tmpDate);

            const god = tmpLunar.getTimeTianShen ? tmpLunar.getTimeTianShen() : '';
            const luck = tmpLunar.getTimeTianShenLuck ? tmpLunar.getTimeTianShenLuck() : '';

            hoursList.push({
                zhi: SHI_CHEN[i],
                time: TIMING_MAP[i],
                god,
                luck
            });
        }

        const mapDir = (val: string) => DIRECTION_MAP[val] || val;

        const data = {
            ganZhiYear: d.getYearInGanZhi(),
            ganZhiMonth: d.getMonthInGanZhi(),
            ganZhiDay: d.getDayInGanZhi(),
            cnMonth: d.getMonthInChinese(),
            cnDay: d.getDayInChinese(),
            yi: d.getDayYi(),
            ji: d.getDayJi(),
            zhiXing: d.getZhiXing(),
            jiShen: d.getDayJiShen(),
            xiongSha: d.getDayXiongSha(),
            wealthPos: mapDir(d.getPositionCai()),
            joyPos: mapDir(d.getPositionXi()),
            noblePos: mapDir(d.getPositionYangGui()),
            chong: d.getDayChongDesc(),
            sha: d.getDaySha(),
            pengZuGan: d.getPengZuGan(),
            pengZuZhi: d.getPengZuZhi(),
            hours: hoursList
        };
        lunarData.value = data;
        await loadDailyGuide();
    } catch (e: any) {
        console.error('Lunar error', e);
        errorMsg.value = e.message;
    }
};

onMounted(() => {
    loadLunar();
    if (props.chart?.daYun) {
        const currentYear = new Date().getFullYear();
        const idx = props.chart.daYun.findIndex(dy => currentYear >= dy.startYear && currentYear <= (dy.startYear + 9));
        if(idx >= 0) {
            selectedDaYunIndex.value = idx;
            const yn = props.chart.daYun[idx].liuNian.find(y => y.year === currentYear);
            if(yn) selectedYear.value = yn;
        }
    }
});

const selectedDaYun = computed(() => {
    return props.chart?.daYun ? props.chart.daYun[selectedDaYunIndex.value] : null;
});

const handleDayunSelect = (idx: number) => {
    selectedDaYunIndex.value = idx;
    selectedYear.value = null;
};

const handleGenerateGuide = async () => {
    if (!props.chart || !lunarData.value || !sessionIdentity.value || isGenerating.value) return;
    isGenerating.value = true;
    try {
        const result = await generateDailyGuide(props.chart, {
            ganZhiYear: lunarData.value.ganZhiYear,
            ganZhiMonth: lunarData.value.ganZhiMonth,
            ganZhiDay: lunarData.value.ganZhiDay,
            cnMonth: lunarData.value.cnMonth,
            cnDay: lunarData.value.cnDay,
            jiShen: lunarData.value.jiShen,
            naYin: lunarData.value.naYin,
            chong: lunarData.value.chong
        });
        aiGuide.value = result;
        await DailyFortuneAPI.save(sessionIdentity.value.id, sessionIdentity.value.date, result);
    } catch (e: any) {
        uni.showToast({ title: 'AI指引失败: ' + (e.message || '请检查配置'), icon: 'none' });
    } finally {
        isGenerating.value = false;
    }
};

</script>

<style scoped>
.timeline-container {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    width: 100%;
    box-sizing: border-box;
}
.animate-fade-in { animation: fadeIn 0.5s; opacity: 1; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Nav */
.nav-bar {
    display: flex;
    background: #f1f5f9;
    padding: 8rpx;
    border-radius: 16rpx;
}
.nav-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 16rpx;
    font-size: 28rpx;
    color: #64748b;
    border-radius: 12rpx;
}
.nav-btn.active {
    background: #fff;
    color: #7c3aed;
    font-weight: bold;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
}

/* Fortune View */
.loading-box {
    padding: 32rpx;
    background: #fffbeb;
    border-radius: 16rpx;
    text-align: center;
    color: #b45309;
}
.hero-card {
    background: linear-gradient(135deg, #7c3aed, #4338ca);
    border-radius: 24rpx;
    padding: 24rpx;
    color: #fff;
    margin-bottom: 24rpx;
    width: 100%;
    box-sizing: border-box;
}
.hero-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;
}
.tags-row { display: flex; gap: 8rpx; margin-bottom: 8rpx; }
.tag-glass { background: rgba(255,255,255,0.2); padding: 4rpx 12rpx; border-radius: 8rpx; font-size: 20rpx; }
.tag-amber { background: rgba(251, 191, 36, 0.9); color: #78350f; padding: 4rpx 12rpx; border-radius: 8rpx; font-size: 20rpx; font-weight: bold; }
.date-big { font-size: 48rpx; font-weight: bold; font-family: serif; }
.date-sub { font-size: 24rpx; opacity: 0.8; }
.ganzhi-main { font-size: 64rpx; font-weight: 900; font-family: serif; display: block; line-height: 1; margin-bottom: 8rpx; text-transparent: transparent; background-clip: text; -webkit-background-clip: text; background-image: linear-gradient(to bottom, #fff, #ddd6fe); color: white; }
.ganzhi-sub { font-size: 20rpx; opacity: 0.8; letter-spacing: 2rpx; text-transform: uppercase; text-align: center; font-weight: bold; color: #ddd6fe; display: block; }

.yiji-box {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border-radius: 16rpx;
    display: flex;
    border: 1px solid rgba(255,255,255,0.1);
}
.yiji-col { flex: 1; padding: 16rpx; }
.border-r { border-right: 1px solid rgba(255,255,255,0.1); }
.yiji-title { font-size: 24rpx; font-weight: bold; margin-bottom: 8rpx; display: flex; align-items: center; gap: 8rpx; }
.green { color: #6ee7b7; }
.red { color: #fda4af; }
.dot { width: 12rpx; height: 12rpx; border-radius: 50%; }
.green-dot { background: #6ee7b7; }
.red-dot { background: #fda4af; }
.yiji-content { font-size: 22rpx; opacity: 0.9; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card { background: #fff; border-radius: 24rpx; padding: 24rpx; margin-bottom: 24rpx; border: 1px solid #f1f5f9; box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.02); width: 100%; box-sizing: border-box; }
.card-header { display: flex; gap: 12rpx; font-weight: bold; color: #334155; margin-bottom: 16rpx; font-size: 28rpx; align-items: center; }
.icon { font-size: 32rpx; }

.dir-grid { display: flex; gap: 12rpx; }
.dir-item { flex: 1; background: #f8fafc; padding: 16rpx; border-radius: 12rpx; text-align: center; border: 1px solid #f1f5f9; }
.dir-label { font-size: 20rpx; color: #94a3b8; display: block; margin-bottom: 4rpx; }
.dir-val { font-weight: bold; color: #334155; font-size: 28rpx; }

.hours-scroll { width: 100%; white-space: nowrap; }
.hours-flex { display: flex; gap: 16rpx; padding-bottom: 8rpx; }
.hour-item { 
    display: inline-flex; flex-direction: column; align-items: center; 
    width: 120rpx; background: #f8fafc; padding: 12rpx; 
    border-radius: 12rpx; border: 1px solid #f1f5f9; 
    flex-shrink: 0;
}
.lucky-hour { background: #ecfdf5; border-color: #d1fae5; }
.hour-zhi { font-weight: bold; color: #334155; font-size: 24rpx; margin-bottom: 4rpx; }
.hour-time { font-size: 20rpx; color: #94a3b8; margin-bottom: 8rpx; transform: scale(0.9); }
.hour-tag { font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 6rpx; font-weight: bold; }
.tag-green { background: #d1fae5; color: #047857; }
.tag-red { background: #ffe4e6; color: #be123c; }

.gods-grid { display: flex; gap: 24rpx; }
.gods-col { flex: 1; }
.gods-head { font-size: 24rpx; font-weight: bold; margin-bottom: 12rpx; }
.green-txt { color: #059669; }
.red-txt { color: #e11d48; }
.gods-tags { display: flex; flex-wrap: wrap; gap: 8rpx; }
.god-tag { font-size: 20rpx; padding: 4rpx 10rpx; border-radius: 6rpx; }
.green-bg { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
.red-bg { background: #ffe4e6; color: #be123c; border: 1px solid #ffe4e6; }

.grid-2 { display: flex; gap: 16rpx; }
.grid-2 .card { flex: 1; margin-bottom: 0; }
.card-header-sm { font-size: 24rpx; font-weight: bold; color: #334155; margin-bottom: 12rpx; }
.row-between { display: flex; justify-content: space-between; font-size: 24rpx; margin-bottom: 8rpx; }
.gray { color: #94a3b8; }
.bold { font-weight: bold; color: #1e293b; }
.divider { height: 1px; background: #f1f5f9; margin: 8rpx 0; }
.peng-item { font-size: 22rpx; background: #f8fafc; padding: 8rpx; border-radius: 8rpx; color: #475569; margin-bottom: 4rpx; }
.indigo { color: #4f46e5; font-weight: bold; margin-right: 4rpx; }
.gray-desc { font-size: 22rpx; color: #94a3b8; margin-top: 8rpx; }

/* DaYun View */
.dayun-scroll { width: 100%; white-space: nowrap; margin-bottom: 24rpx; }
.dayun-flex { display: flex; gap: 16rpx; padding: 8rpx; }
.dayun-item {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: space-between;
    width: 140rpx; height: 200rpx; background: #fff; border: 1px solid #f1f5f9;
    border-radius: 16rpx; padding: 16rpx; transition: all 0.2s;
    flex-shrink: 0;
}
.dayun-item.active { background: #7c3aed; border-color: #7c3aed; box-shadow: 0 4rpx 12rpx rgba(124, 58, 237, 0.3); transform: translateY(-4rpx); }
.dy-age { font-size: 20rpx; color: #94a3b8; }
.dayun-item.active .dy-age { color: #ddd6fe; }
.dy-ganzhi { display: flex; flex-direction: column; align-items: center; }
.dy-god { font-size: 18rpx; color: #64748b; margin-bottom: 4rpx; }
.dayun-item.active .dy-god { color: #ddd6fe; }
.dy-char { font-size: 36rpx; font-weight: 900; color: #1e293b; line-height: 1.1; font-family: serif; }
.dayun-item.active .dy-char { color: #fff; }
.dy-year { font-size: 20rpx; color: #94a3b8; }
.dayun-item.active .dy-year { color: #ddd6fe; }

.detail-card { margin-top: 0; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; padding-bottom: 16rpx; border-bottom: 1px solid #f1f5f9; }
.dh-title { font-weight: bold; color: #1e293b; font-size: 32rpx; margin-right: 8rpx; }
.dh-sub { font-size: 24rpx; color: #64748b; }
.dh-range { font-size: 24rpx; font-family: monospace; background: #f1f5f9; padding: 4rpx 12rpx; border-radius: 8rpx; color: #64748b; }

.liunian-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12rpx; margin-bottom: 24rpx; }
.ln-item { 
    background: #fff; border: 1px solid #f1f5f9; border-radius: 12rpx; padding: 12rpx 8rpx; 
    text-align: center; cursor: pointer;
}
.ln-item.active { border-color: #8b5cf6; background: #f5f3ff; }
.ln-top { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.mono { font-family: monospace; font-size: 18rpx; color: #94a3b8; }
.age-badge { font-size: 18rpx; background: #f1f5f9; padding: 0 4rpx; border-radius: 4rpx; color: #64748b; }
.ln-item.active .age-badge { background: #ddd6fe; color: #5b21b6; }
.ln-mid { display: flex; flex-direction: column; align-items: center; }
.ln-god { font-size: 18rpx; color: #94a3b8; margin-bottom: 2rpx; transform: scale(0.9); }
.ln-item.active .ln-god { color: #7c3aed; font-weight: bold; }
.ln-gz { font-size: 28rpx; font-weight: 900; color: #1e293b; font-family: serif; }
.ln-item.active .ln-gz { color: #4c1d95; }

.info-year-box { background: #f8fafc; padding: 16rpx; border-radius: 12rpx; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
.iy-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.iy-gz { font-size: 36rpx; font-weight: 900; font-family: serif; color: #1e293b; }
.iy-year { font-size: 24rpx; color: #64748b; font-family: monospace; }
.iy-god-tag { background: #f5f3ff; color: #7c3aed; font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 6rpx; font-weight: bold; }
.iy-desc { font-size: 24rpx; color: #475569; line-height: 1.5; }

/* AI Guide */
.ai-card { border: 1px dashed #ddd6fe; background: #f8fafc; }
.ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.ai-head-left { display: flex; align-items: center; gap: 8rpx; color: #4c1d95; font-weight: bold; }
.ai-title { font-size: 28rpx; }
.btn-mini {
    background: #7c3aed; color: #fff; border-radius: 999rpx; padding: 8rpx 20rpx;
    font-size: 24rpx; line-height: 1; border: none;
}
.btn-mini[disabled] { opacity: 0.6; }
.ai-loading { display: flex; align-items: center; gap: 12rpx; color: #64748b; }
.spinner-sm {
    width: 28rpx; height: 28rpx; border-radius: 50%;
    border: 4rpx solid #ddd6fe; border-top-color: #7c3aed; animation: spin 1s linear infinite;
}
.ai-content { display: flex; flex-direction: column; gap: 8rpx; color: #334155; }
.ai-item { display: flex; gap: 12rpx; align-items: flex-start; }
.ai-label {
    min-width: 120rpx;
    background: #ede9fe;
    color: #5b21b6;
    font-size: 22rpx;
    font-weight: bold;
    padding: 4rpx 10rpx;
    border-radius: 8rpx;
    text-align: center;
    flex-shrink: 0;
}
.ai-text { flex: 1; font-size: 24rpx; line-height: 1.6; color: #334155; }
.ai-empty { display: flex; flex-direction: column; gap: 16rpx; color: #94a3b8; }
.btn-secondary {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12rpx;
    color: #4c1d95; padding: 12rpx 16rpx; font-size: 26rpx;
}

</style>
