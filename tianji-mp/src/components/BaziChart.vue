<template>
  <view class="space-y-6 animate-in" v-if="hasChart">
    <!-- Header Meta Info -->
    <view class="meta-grid">
      <view class="meta-item" v-for="(item, i) in metaItems" :key="i">
        <text class="meta-label">{{ item.label }}</text>
        <text :class="['meta-value', item.highlight ? 'highlight' : '']">{{ item.value || '-' }}</text>
      </view>
    </view>

    <!-- Three Palaces -->
    <view class="palaces-row">
      <view class="palace-item" v-for="(item, i) in palaceItems" :key="i">
        <text class="palace-label">{{ item.label }}</text>
        <text class="palace-value">{{ item.value }}</text>
      </view>
    </view>

    <!-- Bazi Matrix -->
    <view class="bazi-container" id="bazi-container">
      <!-- Pillars -->
      <view v-if="pillars.length" class="pillars-grid">
        <view 
          v-for="(pillar, idx) in pillars" 
          :key="idx" 
          class="pillar-card"
          :class="{'highlight-pillar': idx === 2}"
          @click="handlePillarClick(idx)"
        >
          <view class="pillar-title" :class="idx === 2 ? 'title-highlight' : ''">{{ titles[idx] }}</view>
          
          <view class="pillar-content">
            <view class="god-text">{{ pillar.ganGod }}</view>
            <view class="stem-text">{{ pillar.gan }}</view>
            <view
              class="branch-text"
              :class="idx === 2 ? 'branch-highlight' : ''"
              :id="'pillar-zhi-' + idx"
            >
              {{ pillar.zhi }}
            </view>
            
            <view class="hidden-stems">
                <view v-for="(gan, hIdx) in pillar.hiddenGan" :key="hIdx" class="hidden-row">
                    <text class="hidden-god">{{ pillar.zhiGod[hIdx] || '-' }}</text>
                    <text class="hidden-gan">{{ gan }}</text>
                </view>
            </view>
          </view>

          <view class="pillar-footer">
            <view class="footer-row">
              <text class="footer-label">纳音</text>
              <text class="nayin-text">{{ pillar.naYin }}</text>
            </view>
             <view class="footer-row">
              <text class="footer-label">运·长生</text>
              <text class="footer-val">{{ pillar.xingYun }}</text>
            </view>
             <view class="footer-row">
              <text class="footer-label">坐·长生</text>
              <text class="footer-val">{{ pillar.selfXingYun }}</text>
            </view>
            <view v-if="pillar.kongWang" class="kongwang-tag">空亡</view>
          </view>
        </view>
      </view>
      <view v-else class="pillars-empty">
        四柱数据为空，请检查命盘计算结果。
      </view>
      
      <!-- Relationships Canvas -->
      <canvas
        v-if="canvasWidth > 0 && canvasHeight > 0"
        canvas-id="relationCanvas"
        id="relationCanvas"
        class="relation-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>

    </view>
  </view>
  <view v-else class="pillars-empty">
    命盘数据为空，请检查档案信息或重新生成。
  </view>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, getCurrentInstance, watch } from 'vue';
import type { BaziChart } from '@/models';

const props = defineProps<{
  chart: BaziChart
}>();

const chartValue = computed(() => {
    const maybeRef = props.chart as any;
    return maybeRef && maybeRef.value ? maybeRef.value : props.chart;
});

const hasChart = computed(() => !!chartValue.value && !!chartValue.value.pillars);

const pillars = computed(() => {
    if(!chartValue.value) return [];
    return [
        chartValue.value.pillars.year,
        chartValue.value.pillars.month,
        chartValue.value.pillars.day,
        chartValue.value.pillars.hour
    ];
});

const titles = ['年柱', '月柱', '日柱', '时柱'];

// Meta Info
const metaItems = computed(() => {
    if (!chartValue.value) return [];
    return [
        { label: '公历', value: chartValue.value.meta.solarDate },
        { label: '农历', value: chartValue.value.meta.lunarDate },
        { label: '真太阳时', value: chartValue.value.meta.trueSolarTime, highlight: true },
        { label: '起运', value: chartValue.value.meta.qiYunInfo, highlight: true },
        { label: '性别/生肖', value: `${chartValue.value.meta.gender} / ${chartValue.value.meta.sign}` }
    ];
});

// Palaces
const palaceItems = computed(() => {
    if (!chartValue.value) return [];
    return [
        { label: '胎元', value: chartValue.value.hidden.taiYuan },
        { label: '命宫', value: chartValue.value.hidden.mingGong },
        { label: '身宫', value: chartValue.value.hidden.shenGong }
    ];
});

// Relationship Logic
const ZHI_RELATIONS: Record<string, { clash: string[], combine: string[] }> = {
  '子': { clash: ['午'], combine: ['丑'] },
  '丑': { clash: ['未'], combine: ['子'] },
  '寅': { clash: ['申'], combine: ['亥'] },
  '卯': { clash: ['酉'], combine: ['戌'] },
  '辰': { clash: ['戌'], combine: ['酉'] },
  '巳': { clash: ['亥'], combine: ['申'] },
  '午': { clash: ['子'], combine: ['未'] },
  '未': { clash: ['丑'], combine: ['午'] },
  '申': { clash: ['寅'], combine: ['巳'] },
  '酉': { clash: ['卯'], combine: ['辰'] },
  '戌': { clash: ['辰'], combine: ['卯'] },
  '亥': { clash: ['巳'], combine: ['寅'] },
};

const canvasWidth = ref(0);
const canvasHeight = ref(0);
const clearTimer = ref<number | null>(null);
const instance = getCurrentInstance();

const getRelationship = (z1: string, z2: string): { type: 'clash' | 'combine' | null; label: string } => {
    const rel = ZHI_RELATIONS[z1];
    if (rel?.clash.includes(z2)) return { type: 'clash', label: '冲' };
    if (rel?.combine.includes(z2)) return { type: 'combine', label: '合' };
    return { type: null, label: '' };
};

const handlePillarClick = (idx: number) => {
    drawRelations(idx);
};

const clearCanvas = () => {
    if (!instance?.proxy || canvasWidth.value <= 0 || canvasHeight.value <= 0) return;
    const ctx = uni.createCanvasContext('relationCanvas', instance.proxy);
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    ctx.draw();
};

const drawRelations = async (sourceIndex: number) => {
    if (!instance?.proxy || pillars.value.length === 0) return;
    await nextTick();

    const query = uni.createSelectorQuery().in(instance.proxy);
    query.select('#bazi-container').boundingClientRect();
    pillars.value.forEach((_, i) => {
        query.select(`#pillar-zhi-${i}`).boundingClientRect();
    });

    query.exec((res: any[]) => {
        const container = res[0];
        if (!container) return;

        const rects = res.slice(1);
        if (rects.some((r: any) => !r)) return;

        canvasWidth.value = Math.round(container.width);
        canvasHeight.value = Math.round(container.height);

        const ctx = uni.createCanvasContext('relationCanvas', instance.proxy);
        ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

        const sourceRect = rects[sourceIndex];
        const sourceX = sourceRect.left - container.left + sourceRect.width / 2;
        const sourceY = sourceRect.top - container.top + sourceRect.height / 2;

        rects.forEach((targetRect: any, idx: number) => {
            if (idx === sourceIndex) return;

            const rel = getRelationship(pillars.value[sourceIndex].zhi, pillars.value[idx].zhi);
            if (!rel.type) return;

            const targetX = targetRect.left - container.left + targetRect.width / 2;
            const targetY = targetRect.top - container.top + targetRect.height / 2;
            const midX = (sourceX + targetX) / 2;
            const midY = (sourceY + targetY) / 2;
            const curveOffset = 16;
            const controlY = midY - curveOffset;

            const color = rel.type === 'clash' ? '#f43f5e' : '#10b981';
            if (typeof (ctx as any).setLineDash === 'function') {
                (ctx as any).setLineDash(rel.type === 'clash' ? [6, 4] : []);
            }
            ctx.setStrokeStyle(color);
            ctx.setLineWidth(2);
            ctx.beginPath();
            ctx.moveTo(sourceX, sourceY);
            ctx.quadraticCurveTo(midX, controlY, targetX, targetY);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(targetY - controlY, targetX - midX);
            const headLen = 8;
            const arrowX = targetX - Math.cos(angle) * 6;
            const arrowY = targetY - Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.setFillStyle(color);
            ctx.moveTo(targetX, targetY);
            ctx.lineTo(arrowX - Math.sin(angle) * headLen / 2, arrowY + Math.cos(angle) * headLen / 2);
            ctx.lineTo(arrowX + Math.sin(angle) * headLen / 2, arrowY - Math.cos(angle) * headLen / 2);
            ctx.closePath();
            ctx.fill();

            // Label
            const labelW = 24;
            const labelH = 16;
            ctx.setFillStyle('#ffffff');
            ctx.setStrokeStyle(color);
            ctx.setLineWidth(1);
            ctx.fillRect(midX - labelW / 2, controlY - labelH / 2, labelW, labelH);
            ctx.strokeRect(midX - labelW / 2, controlY - labelH / 2, labelW, labelH);
            ctx.setFillStyle(color);
            ctx.setFontSize(10);
            ctx.setTextAlign('center');
            ctx.setTextBaseline('middle');
            ctx.fillText(rel.label, midX, controlY);
        });

        ctx.draw();
    });

    if (clearTimer.value) clearTimeout(clearTimer.value);
    clearTimer.value = Number(setTimeout(() => {
        clearCanvas();
    }, 3000));
};

watch(() => props.chart, () => {
    clearCanvas();
});

</script>

<style scoped>
.space-y-6 { margin-bottom: 24rpx; }
.animate-in { animation: fadeIn 0.5s forwards; }
@keyframes fadeIn { to { opacity: 1; } }

.meta-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 24rpx;
}
.meta-item {
    background: rgba(255,255,255,0.6);
    padding: 12rpx;
    border-radius: 12rpx;
    border: 1px solid #f1f5f9;
    flex: 1 1 40%;
    display: flex;
    flex-direction: column;
}
.meta-label { font-size: 20rpx; color: #94a3b8; margin-bottom: 4rpx; }
.meta-value { font-size: 24rpx; color: #334155; font-weight: 500; }
.highlight { color: #7c3aed; }

.palaces-row {
    display: flex;
    justify-content: space-between;
    padding: 12rpx;
    background: #f8fafc;
    border-radius: 12rpx;
    margin-bottom: 24rpx;
}
.palace-item { display: flex; align-items: center; gap: 8rpx; }
.palace-label { font-size: 20rpx; color: #94a3b8; }
.palace-value { font-weight: bold; color: #334155; }

.bazi-container { position: relative; padding: 8rpx; }

.pillars-grid {
    display: flex;
    justify-content: space-between;
    gap: 8rpx;
}

.pillar-card {
    flex: 1;
    background: #fff;
    border-radius: 12rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #cbd5e1;
}

.highlight-pillar {
    border: 2px solid #a78bfa;
    box-shadow: 0 0 10rpx rgba(139, 92, 246, 0.2);
}

.pillar-title {
    width: 100%;
    text-align: center;
    font-size: 20rpx;
    padding: 6rpx 0;
    font-weight: bold;
    background: #f8fafc;
    color: #64748b;
}

.title-highlight { background: #f5f3ff; color: #6d28d9; }

.pillar-content {
    padding: 12rpx 8rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.god-text { font-size: 20rpx; color: #94a3b8; height: 32rpx; }
.stem-text { font-size: 36rpx; font-weight: 900; color: #1e293b; line-height: 1; margin-bottom: 8rpx; }
.branch-text { 
    font-size: 36rpx; 
    font-weight: 900; 
    color: #1e293b; 
    line-height: 1; 
    padding: 8rpx 0; 
    width: 100%; 
    text-align: center; 
    border-radius: 8rpx; 
}
.branch-highlight { color: #4c1d95; background: #f5f3ff; }

.hidden-stems { 
    margin-top: 8rpx; 
    width: 100%; 
    border-top: 1px solid #f1f5f9; 
    padding-top: 8rpx; 
}
.hidden-row { display: flex; justify-content: space-between; font-size: 18rpx; }
.hidden-god { color: #94a3b8; transform: scale(0.9); transform-origin: left; }
.hidden-gan { font-weight: bold; color: #475569; }

.pillar-footer {
    width: 100%;
    background: #f8fafc;
    padding: 6rpx;
    border-top: 1px solid #e2e8f0;
}
.footer-row { display: flex; justify-content: space-between; font-size: 18rpx; margin-bottom: 2rpx; }
.footer-label { color: #94a3b8; transform: scale(0.85); transform-origin: left; }
.footer-val { color: #334155; transform: scale(0.9); transform-origin: right; }
.nayin-text { color: #7c3aed; width: 80rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: right; transform: scale(0.9); transform-origin: right; }

.kongwang-tag {
    text-align: center;
    font-size: 18rpx;
    color: #f87171;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 999rpx;
    margin-top: 4rpx;
}

.relation-canvas {
    position: absolute;
    inset: 0;
    z-index: 40;
    pointer-events: none;
}
.pillars-empty {
    padding: 16rpx;
    text-align: center;
    color: #94a3b8;
    font-size: 24rpx;
}
</style>
