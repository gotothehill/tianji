<template>
  <view class="shensha-container animate-fade-in">
    <view class="card">
        <view class="card-header">
            <text class="icon">⭐</text>
            <text>神煞一览</text>
        </view>
        
        <scroll-view scroll-x class="table-scroll">
            <view class="table">
                <view class="thead">
                    <view class="tr">
                        <view class="th sticky-col">名</view>
                        <view class="th" v-for="p in pillars" :key="p.name">{{ p.name }}</view>
                    </view>
                </view>
                <view class="tbody">
                    <view v-if="presentShenSha.length === 0" class="tr">
                         <view class="td col-span">未检测到主要神煞</view>
                    </view>
                    <view v-for="name in presentShenSha" :key="name" class="tr" @click="handleRowClick(name)">
                        <view class="td sticky-col">
                            <view class="badge" :class="getBadgeType(name)">{{ name }}</view>
                        </view>
                        <view v-for="p in pillars" :key="p.name" class="td center">
                            <view v-if="p.data.shenSha.includes(name)" class="dot" :class="getDotType(name)"></view>
                            <text v-else class="dash">-</text>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>
        
        <view class="tips">
            <text>点击行可查看详细解释</text>
        </view>
    </view>
    
    <!-- Explanations List -->
    <view class="card">
        <view class="card-header"><text class="icon">ℹ</text> <text>神煞详解</text></view>
        <view class="explain-list">
             <view v-for="name in presentShenSha" :key="name" class="explain-item">
                 <view class="item-head">
                     <text class="badge-sm" :class="getBadgeType(name)">{{ name }}</text>
                 </view>
                 <view class="item-body">
                     <text class="desc-main">{{ getInfo(name).desc }}</text>
                     <view class="pillar-details">
                         <block v-for="p in pillars" :key="p.key">
                             <view v-if="p.data.shenSha.includes(name) && getInfo(name)[p.key]" class="pd-row">
                                 <text class="pd-label">【{{ p.name }}柱】</text>
                                 <text class="pd-val">{{ getInfo(name)[p.key] }}</text>
                             </view>
                         </block>
                     </view>
                 </view>
             </view>
        </view>
    </view>
    
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BaziChart } from '@/models';

const props = defineProps<{
  chart: BaziChart
}>();

const pillars = computed(() => {
    if(!props.chart) return [];
    return [
        { name: '年', data: props.chart.pillars.year, key: 'year' },
        { name: '月', data: props.chart.pillars.month, key: 'month' },
        { name: '日', data: props.chart.pillars.day, key: 'day' },
        { name: '时', data: props.chart.pillars.hour, key: 'hour' },
    ];
});

const presentShenSha = computed(() => {
    if(!props.chart) return [];
    const all = [
        ...props.chart.pillars.year.shenSha,
        ...props.chart.pillars.month.shenSha,
        ...props.chart.pillars.day.shenSha,
        ...props.chart.pillars.hour.shenSha,
    ];
    return Array.from(new Set(all)).sort();
});

const SHEN_SHA_INFO: Record<string, any> = {
    '天乙贵人': {
        type: 'lucky',
        desc: '天乙贵人是命中最吉之神。若人遇之，主聪明智慧，出入近贵，逢凶化吉，多得贵人提拔。',
        year: '祖荫丰厚，少时易得长辈提拔，家境不错。',
        month: '父母兄弟得力，步入社会有贵人相助，适合公职。',
        day: '配偶贤良得力，中年运势平顺，遇难呈样。',
        hour: '晚年运佳，子女孝顺且有成就，老来享福。'
    },
    '文昌贵人': {
        type: 'lucky',
        desc: '文昌入命，主聪明过人，气质雅秀，举止温文，好学新知，具上进心，一生近官利贵。',
        year: '小时聪明敏捷，学业成绩优异，受师长喜爱。',
        month: '利于科考及文职工作，口才好，反应快。',
        day: '配偶有才气，自己也爱学习，中年利于进修。',
        hour: '晚年生活丰富，子女聪明，可能有艺术才华。'
    },
    '禄神': {
        type: 'lucky',
        desc: '禄为养命之源。命中得禄，主性格刚毅，财禄丰足，衣食无忧。忌被冲破，否则不吉。',
        year: '受祖上福荫，早年生活富裕，或者少年得志。',
        month: '兄弟姐妹得力，适合离家发展，或是白手起家。',
        day: '衣食无忧，配偶能干，中年财运稳健。',
        hour: '晚年吉祥，子女能养老，财运归库。'
    },
    '桃花': {
        type: 'peach',
        desc: '桃花主风流漂亮，异性缘佳，人际关系好。若桃花过重，则易招惹情感是非。',
        year: '长辈缘好，早恋倾向，或只有单纯的爱慕。',
        month: '人缘好，适合交际，青年时期异性缘旺。',
        day: '自坐桃花，配偶漂亮或有情调，但也易生感情波折。',
        hour: '墙外桃花，晚年仍有人气，或子女貌美，须防滥情。'
    },
    '驿马': {
        type: 'power',
        desc: '驿马主奔波远行，出国留学，或职业变动。吉则升迁，凶则劳碌奔波，背井离乡。',
        year: '祖籍变动，或少小离家，早年多奔波。',
        month: '青年时期工作多变动，或从事运输、外贸工作。',
        day: '内心不安分，配偶是异乡人，或婚后因公常出差。',
        hour: '晚年闲不住，或子女在远方发展，可能移民。'
    },
    '华盖': {
        type: 'art',
        desc: '华盖星主孤高，有才艺，喜钻研技艺或玄学。多见于僧道、艺术家、哲学家之命。',
        year: '祖上可能有宗教信仰，通过艺术或技艺成名。',
        month: '才华横溢，但性格可能孤傲，不善交际。',
        day: '内心孤独，对哲学宗教有兴趣，婚姻需多沟通。',
        hour: '晚年潜心修道或研究学问，精神生活丰富。'
    },
    '将星': {
        type: 'power',
        desc: '将星入命，主有领导才能，具有慑众之威，利于武职或管理，掌权柄。',
        year: '出身名门或长辈有权势，少有威严。',
        month: '有领导能力，从政或管理职，步步高升。',
        day: '个性刚强，能掌权，但过于强势可能伤人。',
        hour: '子孙有出息，晚年有威望，或者子女当官。'
    },
    '羊刃': {
        type: 'unlucky',
        desc: '羊刃性情刚烈，急躁冲动。吉则刚毅果断，凶则易惹是非、刑伤或血光之灾。',
        year: '祖业凋零，早年离家，身体易有小伤。',
        month: '性情刚毅，不服输，财运起伏大，利于武职。',
        day: '忌专权霸道，婚姻易生口角，身体需防手术。',
        hour: '晚年性格固执，子女难管教，防止意外伤害。'
    },
    '劫煞': {
        type: 'unlucky',
        desc: '劫煞主破财、生灾、被劫。若为忌神，则多主波折阻碍，需防小人。',
        year: '祖业难守，早年多病灾。',
        month: '工作压力大，易遇小人，需防财物损失。',
        day: '夫妻不和，中年易遭变故，需修身养性。',
        hour: '子女缘薄，或晚年多病痛。'
    },
    '空亡': {
        type: 'unlucky',
        desc: '空亡主事倍功半，六亲缘薄。年柱空亡祖业飘零，日柱空亡夫妻隔阂。但亦主心性空灵，利于修行。',
        year: '祖上无力，早年辛苦，与长辈缘分淡薄。',
        month: '手足无助，青年时期事业多做少成，内心迷茫。',
        day: '夫妻缘薄，或聚少离多，中年容易有失落感。',
        hour: '子女迟得或缘分浅，晚年容易孤独。'
    },
    '太岁': {
        type: 'power',
        desc: '太岁为当年岁君，不可犯之。入命主变动、压力。若为喜用则掌权，若为忌则生灾。',
        year: '本命年，主变动，情绪起伏。',
        month: '父母宫伏吟，需注父母健康。',
        day: '夫妻宫伏吟，感情反复。',
        hour: '子女宫伏吟，操心子女。'
    },
    '岁破': {
        type: 'unlucky',
        desc: '岁破即冲太岁，主破败、动荡、诸事不宜。当以此年为动荡之年，需谨慎行事。',
        year: '祖业变动，早年不稳定。',
        month: '环境变动大，搬家或换工作。',
        day: '婚姻不稳，配偶身体欠安。',
        hour: '晚年多奔波，或为子女操劳。'
    },
    '孤辰': {
        type: 'unlucky',
        desc: '男命忌孤辰，主性格孤僻，六亲缘薄，或是无子，多主孤独。',
        year: '少小离家或父母缘薄。',
        month: '兄弟无助，性格孤僻，不合群。',
        day: '夫妻沟通困难，易分居或冷战。',
        hour: '晚年孤独，子女不在身边。'
    },
    '寡宿': {
        type: 'unlucky',
        desc: '女命忌寡宿，主独守空房，夫缘浅薄，或与丈夫貌合神离。',
        year: '与父亲缘分浅，早年孤独。',
        month: '手足不亲，人际关系冷淡。',
        day: '夫妻缘薄，内心孤独，易独居。',
        hour: '晚年清静，或与子女疏远。'
    }
};

const getInfo = (name: string) => SHEN_SHA_INFO[name] || { type: 'unknown', desc: '暂无描述' };

const getBadgeType = (name: string) => {
    const t = getInfo(name).type;
    return {
        lucky: 'red',
        peach: 'pink',
        power: 'purple',
        art: 'indigo',
        unlucky: 'gray'
    }[t as string] || 'blue';
};

const getDotType = (name: string) => {
    return getBadgeType(name); // same color usage
};

const handleRowClick = (name: string) => {
    uni.showModal({
        title: name,
        content: getInfo(name).desc,
        showCancel: false
    });
};

</script>

<style scoped>
.shensha-container {
    display: flex; flex-direction: column; gap: 24rpx;
}
.animate-fade-in { animation: fadeIn 0.5s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.card { background: #fff; border-radius: 24rpx; padding: 24rpx; border: 1px solid #f1f5f9; box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.02); }
.card-header { font-weight: bold; color: #334155; margin-bottom: 24rpx; font-size: 28rpx; display: flex; gap: 8rpx; align-items: center; }

.table-scroll { width: 100%; }
.table { width: 100%; min-width: 600rpx; }
.tr { display: flex; border-bottom: 1px solid #f8fafc; }
.th, .td { padding: 16rpx 8rpx; font-size: 24rpx; flex: 1; text-align: center; }
.th { background: #f8fafc; color: #64748b; font-weight: bold; }
.center { display: flex; align-items: center; justify-content: center; }

.sticky-col { position: sticky; left: 0; background: #fff; z-index: 2; width: 160rpx; text-align: left; }
.th.sticky-col { background: #f8fafc; z-index: 3; }

.badge { display: inline-block; padding: 4rpx 12rpx; border-radius: 999rpx; font-size: 22rpx; border: 1px solid transparent; font-weight: bold; }
.red { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.pink { background: #fdf2f8; color: #be185d; border-color: #fbcfe8; }
.purple { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }
.indigo { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }
.gray { background: #f9fafb; color: #374151; border-color: #e5e7eb; }
.blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }

.dot { width: 16rpx; height: 16rpx; border-radius: 50%; border: 4rpx solid rgba(0,0,0,0.1); }
.dot.red { background: #ef4444; border-color: #fecaca; }
.dot.pink { background: #ec4899; border-color: #fbcfe8; }
.dot.purple { background: #a855f7; border-color: #e9d5ff; }
.dot.indigo { background: #6366f1; border-color: #c7d2fe; }
.dot.gray { background: #6b7280; border-color: #e5e7eb; }
.dot.blue { background: #3b82f6; border-color: #bfdbfe; }

.dash { color: #cbd5e1; }

.col-span { width: 100%; text-align: center; color: #94a3b8; padding: 32rpx; }
.tips { font-size: 20rpx; color: #94a3b8; text-align: center; margin-top: 16rpx; }

.explain-list { display: flex; flex-direction: column; gap: 16rpx; }
.explain-item { background: #f8fafc; padding: 16rpx; border-radius: 12rpx; display: flex; gap: 16rpx; border: 1px solid #f1f5f9; }
.item-head { flex-shrink: 0; }
.badge-sm { font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 6rpx; font-weight: bold; background: #fff; border: 1px solid #e2e8f0; }

.item-body { display: flex; flex-direction: column; gap: 8rpx; }
.desc-main { font-size: 24rpx; color: #334155; line-height: 1.5; font-weight: 500; }
.pillar-details { display: flex; flex-direction: column; gap: 4rpx; margin-top: 8rpx; padding-top: 8rpx; border-top: 1px solid #e2e8f0; }
.pd-row { display: flex; font-size: 22rpx; }
.pd-label { font-weight: bold; color: #64748b; }
.pd-val { color: #475569; }

</style>
