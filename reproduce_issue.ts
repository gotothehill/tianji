const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const YI_POOL = ['出行', '开市', '交易', '祭祀', '祈福', '求嗣', '动土', '安床', '纳畜', '入殓', '移徙', '立券', '栽种', '解除', '裁衣'];
const JI_POOL = ['嫁娶', '安葬', '掘井', '置产', '词讼', '破土', '行丧', '伐木', '作灶', '纳采', '入宅', '分居', '修造', '开仓'];
const DIRECTIONS = ['东南', '东北', '正南', '正北', '西南', '西北', '正东', '正西'];
const ZHI_XING = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];

function getLunarInfo(date: Date) {
    // 1. Year GanZhi
    let year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const day = date.getDate();

    // Approximation for LiChun (Start of Spring) ~Feb 4
    if (month < 1 || (month === 1 && day < 4)) {
        year -= 1;
    }

    const yearOffset = (year - 4) % 60;
    const yearGanIdx = Math.abs(yearOffset % 10);
    const yearZhiIdx = Math.abs(yearOffset % 12);
    const yearGanZhi = GAN[yearGanIdx] + ZHI[yearZhiIdx];

    // 2. Month GanZhi
    let solarMonthIdx = (month + 13 - 2) % 12; // Feb -> 0
    const startMonthGanIdx = (yearGanIdx % 5 + 1) * 2 % 10;
    const monthGanIdx = (startMonthGanIdx + solarMonthIdx) % 10;
    const trueMonthZhiIdx = (solarMonthIdx + 2) % 12;
    const monthGanZhi = GAN[monthGanIdx] + ZHI[trueMonthZhiIdx];

    // 3. Day GanZhi
    const baseDate = new Date(2000, 0, 1);
    const diffTime = date.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const baseOffset = 34;
    const dayOffset = (baseOffset + diffDays) % 60;
    // Handle negative modulo correctly in JS
    const dayGanIdx = ((dayOffset % 10) + 10) % 10;
    const dayZhiIdx = ((dayOffset % 12) + 12) % 12;

    const dayGanZhi = (GAN[dayGanIdx] || '甲') + (ZHI[dayZhiIdx] || '子');

    // 4. Misc
    const seed = Math.abs(year + month + day);
    const yi = YI_POOL.slice(seed % 5, (seed % 5) + 3);
    const ji = JI_POOL.slice(seed % 4, (seed % 4) + 2);
    const zhiXing = ZHI_XING[Math.abs(diffDays) % 12] || '平';

    // Directions
    const wealthPos = DIRECTIONS[(dayGanIdx * 3) % 8];
    const joyPos = DIRECTIONS[(dayGanIdx * 2 + 1) % 8];
    const noblePos = DIRECTIONS[(dayGanIdx * 4 + 2) % 8];

    // Chong
    const chongZhiIdx = (dayZhiIdx + 6) % 12;
    const chongDesc = `(${dayGanZhi})日 冲${ZHI[chongZhiIdx]}`;
    const sha = ['南', '东', '北', '西'][dayZhiIdx % 4];

    return {
        ganZhiYear,
        ganZhiMonth,
        ganZhiDay: dayGanZhi,
        yi,
        ji,
        zhiXing,
        wealthPos,
        joyPos,
        noblePos,
        chong: chongDesc,
        sha,
    };
}

try {
    const testDate = new Date('2026-01-04T12:00:00');
    console.log("Testing date:", testDate);
    const res = getLunarInfo(testDate);
    console.log("Result:", JSON.stringify(res, null, 2));
} catch (e) {
    console.error("CRASHED:", e);
}
