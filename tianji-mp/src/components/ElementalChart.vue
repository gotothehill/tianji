<template>
  <view class="elemental-container animate-fade-in">
    
    <!-- Top Row -->
    <view class="cards-grid">
        
        <!-- DM Strength (Gauge) -->
        <view class="card gauge-card">
            <view class="card-header">
                <text class="icon">📊</text>
                <text class="title">日元旺衰</text>
            </view>
            
            <view class="gauge-wrapper">
                 <view class="gauge-arc-bg"></view>
                 <view class="gauge-needle" :style="{ transform: `rotate(${gaugeAngle}deg)` }"></view>
                 <view class="gauge-cover"></view>
            </view>
            
            <view class="gauge-text">
                <text class="percent">{{ details.percentage }}<text class="unit">%</text></text>
                <view :class="['strength-tag', strengthClass]">{{ details.strength }}</view>
            </view>
            <text class="subtext">同党 vs 异党能量比</text>
        </view>
        
        <!-- Radar Balance -->
        <view class="card radar-card">
            <view class="card-header">
                <text class="icon">📡</text>
                <text class="title">五行分布</text>
            </view>
            <view class="radar-wrapper">
                <canvas
                  :canvas-id="canvasId"
                  :id="canvasId"
                  class="radar-canvas"
                  :style="{ width: radarSize + 'px', height: radarSize + 'px' }"
                  :width="radarSize"
                  :height="radarSize"
                ></canvas>
            </view>
        </view>

        <!-- Yong Shen -->
        <view class="card yong-shen-card">
            <view class="ys-header">
                <text>🛡 喜用神建议</text>
            </view>
            <view class="ys-content">
                <view v-for="(s, i) in yongShenList" :key="i" class="ys-tag">
                    {{ s }}
                </view>
            </view>
            <view class="ys-footer">
                建议亲近上述五行对应的颜色、方位。
            </view>
        </view>
        
    </view>

    <!-- Energy Bars -->
    <view class="card bars-card">
        <view class="card-header">
            <text class="icon">⚡</text>
            <text class="title">五行能量量化</text>
        </view>
        
        <view class="bars-list">
            <view v-for="score in wuxing.scores" :key="score.name" class="bar-item">
                <view class="bar-top">
                    <view class="bar-label">
                        <text class="bar-icon" :style="{color: score.color}">●</text>
                        <text>{{ score.name }}</text>
                    </view>
                    <view class="bar-val-group">
                         <text class="bar-num">{{ score.value }}</text>
                         <text class="bar-percent">{{ getRealRatio(score.value) }}%</text>
                    </view>
                </view>
                <view class="progress-bg">
                    <view class="progress-fill" :style="{ width: getVisualPercent(score.value) + '%', backgroundColor: score.color }"></view>
                </view>
            </view>
        </view>
    </view>

    <!-- Analysis Text -->
    <view class="card text-card">
        <view class="text-content">
            <view class="ai-icon-box">
                <text>📝</text>
            </view>
            <view class="ai-text-box">
                <view class="ai-title">AI 综合评语</view>
                <text class="ai-desc">{{ summaryClean }}</text>
                <view v-if="details.strength !== '中和'" class="ai-alert">
                    <text>⚠ {{ details.strength === '偏旺' ? '日主过旺，宜克泄耗，忌印比。' : '日主偏弱，宜印比帮身，忌克泄。' }}</text>
                </view>
            </view>
        </view>
    </view>

  </view>
 </template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick, getCurrentInstance } from 'vue';
import type { BaziChart } from '@/models';

const props = defineProps<{
  wuxing: BaziChart['wuxing']
}>();

const radarSize = ref(220);
const instance = getCurrentInstance();
const canvasId = `wuxingRadar_${Math.random().toString(36).slice(2)}`;

const details = computed(() => props.wuxing.details || {
    percentage: 50,
    strength: '中和',
    yongShen: '无',
    sameParty: 50,
    otherParty: 50
});

const gaugeAngle = computed(() => {
    return (details.value.percentage / 100) * 180 - 90;
});

const strengthClass = computed(() => {
    const p = details.value.percentage;
    if (p >= 55) return 'strong';
    if (p < 35) return 'weak';
    return 'balanced';
});

const yongShenList = computed(() => {
    return details.value.yongShen.split('/').map(s => s.trim());
});

const summaryClean = computed(() => {
    return props.wuxing.summary.replace(/建议喜用神：.*$/, '');
});

// Helpers for bars
const maxScore = computed(() => Math.max(...props.wuxing.scores.map(s => s.value), 10));
const totalScore = computed(() => props.wuxing.scores.reduce((a, b) => a + b.value, 0) || 1);
const chartDomainMax = computed(() => maxScore.value * 1.2);

const getVisualPercent = (val: number) => {
    return Math.min(100, (val / chartDomainMax.value) * 100);
};
const getRealRatio = (val: number) => {
    return Math.round((val / totalScore.value) * 100);
};

const updateRadarSize = () => {
    const sys = uni.getSystemInfoSync();
    const maxSize = Math.min(260, sys.windowWidth - 80);
    radarSize.value = Math.max(180, maxSize);
};

const drawPolygon = (ctx: UniApp.CanvasContext, points: { x: number; y: number }[]) => {
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
};

const drawRadar = async () => {
    if (!instance?.proxy) return;
    await nextTick();

    const size = radarSize.value;
    const ctx = uni.createCanvasContext(canvasId, instance.proxy);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const radius = size * 0.32;
    const angles = props.wuxing.scores.map((_, i) => (-90 + i * 72) * Math.PI / 180);

    // Grid rings
    ctx.setStrokeStyle('#e2e8f0');
    ctx.setLineWidth(1);
    for (let r = 1; r <= 4; r++) {
        const ringRadius = radius * (r / 4);
        const ringPoints = angles.map(a => ({
            x: center + ringRadius * Math.cos(a),
            y: center + ringRadius * Math.sin(a),
        }));
        drawPolygon(ctx, ringPoints);
    }

    // Axis lines
    angles.forEach(a => {
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(center + radius * Math.cos(a), center + radius * Math.sin(a));
        ctx.stroke();
    });

    // Data polygon
    const points = props.wuxing.scores.map((score, i) => {
        const ratio = Math.min(1, score.value / chartDomainMax.value);
        return {
            x: center + radius * ratio * Math.cos(angles[i]),
            y: center + radius * ratio * Math.sin(angles[i]),
        };
    });
    ctx.setFillStyle('rgba(139, 92, 246, 0.35)');
    ctx.setStrokeStyle('#8b5cf6');
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Points
    points.forEach(p => {
        ctx.beginPath();
        ctx.setFillStyle('#8b5cf6');
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Labels
    ctx.setFontSize(10);
    ctx.setFillStyle('#64748b');
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    const labelRadius = radius + 14;
    props.wuxing.scores.forEach((score, i) => {
        const lx = center + labelRadius * Math.cos(angles[i]);
        const ly = center + labelRadius * Math.sin(angles[i]);
        ctx.fillText(score.name, lx, ly);
    });

    ctx.draw();
};

onMounted(() => {
    updateRadarSize();
    drawRadar();
});

onUnmounted(() => {
    if (!instance?.proxy) return;
    const size = radarSize.value;
    const ctx = uni.createCanvasContext(canvasId, instance.proxy);
    ctx.clearRect(0, 0, size, size);
    ctx.draw();
});

watch(() => props.wuxing.scores, () => {
    drawRadar();
}, { deep: true });

watch(radarSize, () => {
    drawRadar();
});

</script>

<style scoped>
.elemental-container {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.cards-grid {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.card {
    background: #fff;
    border-radius: 24rpx;
    padding: 24rpx;
    border: 1px solid #f1f5f9;
    box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.02);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
}
.title { font-weight: bold; color: #334155; font-size: 28rpx; }

/* Radar */
.radar-card { padding-bottom: 16rpx; overflow: hidden; position: relative; }
.radar-wrapper { display: flex; justify-content: center; align-items: center; width: 100%; }
.radar-canvas { display: block; }

/* Gauge */
.gauge-card { align-items: center; text-align: center; }
.gauge-wrapper {
    position: relative;
    width: 300rpx;
    height: 150rpx;
    margin: 20rpx auto;
    overflow: hidden;
}
.gauge-arc-bg {
    width: 300rpx;
    height: 300rpx;
    background: #f1f5f9;
    border-radius: 50%;
}
.gauge-needle {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 6rpx;
    height: 140rpx;
    background: #334155;
    transform-origin: bottom center;
    transition: transform 1s ease-out;
}
.gauge-cover {
    position: absolute;
    bottom: -10rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 20rpx;
    height: 20rpx;
    background: #334155;
    border-radius: 50%;
}

.gauge-text { margin-top: -20rpx; z-index: 10; position: relative; }
.percent { font-size: 48rpx; font-weight: 900; color: #1e293b; }
.unit { font-size: 24rpx; font-weight: normal; color: #94a3b8; }
.strength-tag { 
    display: inline-block; 
    font-size: 22rpx; 
    padding: 4rpx 16rpx; 
    border-radius: 999rpx; 
    margin-top: 8rpx;
    border: 1px solid;
}
.strong { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; }
.weak { color: #d97706; background: #fffbeb; border-color: #fde68a; }
.balanced { color: #059669; background: #ecfdf5; border-color: #a7f3d0; }
.subtext { font-size: 20rpx; color: #94a3b8; margin-top: 12rpx; display: block; }

/* Yong Shen */
.yong-shen-card {
    background: linear-gradient(135deg, #7c3aed, #4338ca);
    color: white;
}
.ys-header { font-weight: bold; margin-bottom: 24rpx; opacity: 0.9; }
.ys-content { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 24rpx; }
.ys-tag { 
    background: rgba(255,255,255,0.2); 
    padding: 8rpx 20rpx; 
    border-radius: 12rpx; 
    font-size: 28rpx; 
    border: 1px solid rgba(255,255,255,0.1);
}
.ys-footer { font-size: 22rpx; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16rpx; }

/* Bars */
.bars-list { display: flex; flex-direction: column; gap: 24rpx; }
.bar-item { display: flex; flex-direction: column; gap: 8rpx; }
.bar-top { display: flex; justify-content: space-between; align-items: flex-end; }
.bar-label { display: flex; align-items: center; gap: 8rpx; font-size: 26rpx; font-weight: bold; color: #334155; }
.bar-val-group { text-align: right; }
.bar-num { font-size: 32rpx; font-weight: 900; color: #1e293b; margin-right: 4rpx; }
.bar-percent { font-size: 20rpx; color: #94a3b8; }
.progress-bg { height: 16rpx; background: #f1f5f9; border-radius: 999rpx; overflow: hidden; width: 100%; }
.progress-fill { height: 100%; border-radius: 999rpx; transition: width 1s ease-out; }

/* Text */
.text-content { display: flex; gap: 24rpx; }
.ai-icon-box { 
    width: 64rpx; height: 64rpx; 
    background: #fff; 
    border-radius: 50%; 
    display: flex; align-items: center; justify-content: center;
    border: 1px solid #f1f5f9;
}
.ai-text-box { flex: 1; }
.ai-title { font-weight: bold; color: #1e293b; margin-bottom: 8rpx; font-size: 28rpx; }
.ai-desc { font-size: 26rpx; color: #475569; line-height: 1.6; }
.ai-alert { margin-top: 16rpx; font-size: 24rpx; color: #d97706; background: #fffbeb; padding: 12rpx; border-radius: 12rpx; border: 1px solid #fde68a; }

.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>
