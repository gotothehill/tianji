import { UserProfile, BaziChart, PillarData, DaYunData, LiuNianData } from '../types';
import { Solar, Lunar } from 'lunar-javascript';

// --- Internal Lookup Tables & Helpers ---

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const ZHI_HIDDEN: Record<string, string[]> = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
  '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'], '午': ['丁', '己'], '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'], '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
};

const SHI_SHEN_MAP: Record<string, string> = {
  'Same+': '比肩', 'Same-': '劫财',
  'Output+': '食神', 'Output-': '伤官',
  'Wealth+': '偏财', 'Wealth-': '正财',
  'Power+': '七杀', 'Power-': '正官',
  'Resource+': '偏印', 'Resource-': '正印'
};

const ELEMENTS = ['木', '火', '土', '金', '水'];

const getGod = (dm: string, target: string): string => {
  if (!dm || !target) return '';
  const meWuxing = WUXING_MAP[dm];
  const targetWuxing = WUXING_MAP[target];

  if (!meWuxing || !targetWuxing) return '';

  const meIdx = ELEMENTS.indexOf(meWuxing);
  const otherIdx = ELEMENTS.indexOf(targetWuxing);

  let relation = '';
  if (meIdx === otherIdx) relation = 'Same';
  else if ((meIdx + 1) % 5 === otherIdx) relation = 'Output';
  else if ((meIdx + 2) % 5 === otherIdx) relation = 'Wealth';
  else if ((otherIdx + 1) % 5 === meIdx) relation = 'Resource';
  else if ((otherIdx + 2) % 5 === meIdx) relation = 'Power';

  const meIndex = GAN.indexOf(dm);
  const targetIndex = GAN.indexOf(target);
  // Even index = Yang (甲0, 丙2...), Odd index = Yin (乙1, 丁3...)
  const samePolarity = (meIndex % 2) === (targetIndex % 2);
  const polaritySuffix = samePolarity ? '+' : '-';

  return SHI_SHEN_MAP[relation + polaritySuffix] || '';
};

// Chang Sheng Logic
const CHANG_SHENG_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const CHANG_SHENG_START: Record<string, number> = {
  '甲': 11, '乙': 6, '丙': 2, '丁': 9, '戊': 2, '己': 9, '庚': 5, '辛': 0, '壬': 8, '癸': 3
};

const getChangSheng = (gan: string, zhi: string): string => {
  const ganIdx = GAN.indexOf(gan);
  const zhiIdx = ZHI.indexOf(zhi);
  if (ganIdx === -1 || zhiIdx === -1) return '';

  const startZhi = CHANG_SHENG_START[gan];
  const isYang = ganIdx % 2 === 0;

  let offset;
  if (isYang) {
    offset = (zhiIdx - startZhi + 12) % 12;
  } else {
    offset = (startZhi - zhiIdx + 12) % 12;
  }
  return CHANG_SHENG_STAGES[offset];
};

// Shen Sha Logic
const calculateShenSha = (zhi: string, dayGan: string, dayZhi: string, yearZhi: string): string[] => {
  const list: string[] = [];

  // Tian Yi
  const tianYiMap: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '辛': ['午', '寅']
  };
  if (tianYiMap[dayGan]?.includes(zhi)) list.push('天乙贵人');

  // Wen Chang
  const wenChangMap: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
    '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
  };
  if (wenChangMap[dayGan] === zhi) list.push('文昌贵人');

  // Lu Shen
  const luShenMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
  };
  if (luShenMap[dayGan] === zhi) list.push('禄神');

  // Tao Hua (Year or Day)
  const checkTaoHua = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '酉') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '卯') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '子') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '午') return true;
    return false;
  };
  if (checkTaoHua(yearZhi, zhi) || checkTaoHua(dayZhi, zhi)) list.push('桃花');

  // Yi Ma (Year or Day)
  const checkYiMa = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '寅') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '申') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '巳') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '亥') return true;
    return false;
  };
  if (checkYiMa(yearZhi, zhi) || checkYiMa(dayZhi, zhi)) list.push('驿马');

  // Hua Gai (Year or Day)
  const checkHuaGai = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '辰') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '戌') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '未') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '丑') return true;
    return false;
  };
  if (checkHuaGai(yearZhi, zhi) || checkHuaGai(dayZhi, zhi)) list.push('华盖');

  // Jiang Xing (Year or Day)
  const checkJiangXing = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '子') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '午') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '卯') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '酉') return true;
    return false;
  };
  if (checkJiangXing(yearZhi, zhi) || checkJiangXing(dayZhi, zhi)) list.push('将星');

  // Yang Ren (Day Gan)
  const yangRenMap: Record<string, string> = {
    '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
    '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥'
  };
  if (yangRenMap[dayGan] === zhi) list.push('羊刃');

  // Jie Sha (Year or Day)
  const checkJieSha = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '巳') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '亥') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '申') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '寅') return true;
    return false;
  };
  if (checkJieSha(yearZhi, zhi) || checkJieSha(dayZhi, zhi)) list.push('劫煞');

  // Tai Sui
  if (zhi === yearZhi) list.push('太岁');

  // Sui Po
  const clashes: Record<string, string> = {
    '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
    '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
  };
  if (clashes[yearZhi] === zhi) list.push('岁破');

  // Gu Chen / Gua Su (Year Branch)
  let gu = '', gua = '';
  if (['亥', '子', '丑'].includes(yearZhi)) { gu = '寅'; gua = '戌'; }
  else if (['寅', '卯', '辰'].includes(yearZhi)) { gu = '巳'; gua = '丑'; }
  else if (['巳', '午', '未'].includes(yearZhi)) { gu = '申'; gua = '辰'; }
  else if (['申', '酉', '戌'].includes(yearZhi)) { gu = '亥'; gua = '未'; }
  if (zhi === gu) list.push('孤辰');
  if (zhi === gua) list.push('寡宿');

  return Array.from(new Set(list));
};

// --- Wuxing Energy Calculation Logic ---
const calculateWuxingEnergy = (
  pillars: { gan: string, zhi: string }[],
  monthZhi: string
) => {
  const scores: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  const STEM_SCORE = 10;
  const BRANCH_SCORE = 10;
  const MONTH_WEIGHT = 2.5;

  const seasonWeights: Record<string, Record<string, number>> = {
    '寅': { '木': 1.5, '火': 1.2, '土': 0.8, '金': 0.8, '水': 1.0 },
    '卯': { '木': 1.5, '火': 1.2, '土': 0.8, '金': 0.8, '水': 1.0 },
    '辰': { '土': 1.3, '金': 1.1, '木': 1.1, '水': 0.8, '火': 0.9 },
    '巳': { '火': 1.5, '土': 1.2, '金': 0.8, '水': 0.8, '木': 1.0 },
    '午': { '火': 1.5, '土': 1.2, '金': 0.8, '水': 0.8, '木': 1.0 },
    '未': { '土': 1.3, '金': 1.1, '火': 1.1, '水': 0.8, '木': 0.9 },
    '申': { '金': 1.5, '水': 1.2, '木': 0.8, '火': 0.8, '土': 1.0 },
    '酉': { '金': 1.5, '水': 1.2, '木': 0.8, '火': 0.8, '土': 1.0 },
    '戌': { '土': 1.3, '金': 1.1, '火': 0.9, '水': 0.8, '木': 0.8 },
    '亥': { '水': 1.5, '木': 1.2, '火': 0.8, '土': 0.8, '金': 1.0 },
    '子': { '水': 1.5, '木': 1.2, '火': 0.8, '土': 0.8, '金': 1.0 },
    '丑': { '土': 1.3, '金': 1.1, '水': 1.1, '火': 0.8, '木': 0.8 },
  };

  const weights = seasonWeights[monthZhi] || { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 };

  pillars.forEach(p => {
    const wuxing = WUXING_MAP[p.gan];
    if (wuxing && weights[wuxing]) scores[wuxing] += STEM_SCORE * weights[wuxing];
  });

  pillars.forEach((p, idx) => {
    const isMonth = idx === 1;
    const multiplier = isMonth ? MONTH_WEIGHT : 1.0;

    const hiddenStems = ZHI_HIDDEN[p.zhi] || [];
    const totalHidden = hiddenStems.length;

    hiddenStems.forEach((hGan, hIdx) => {
      const wx = WUXING_MAP[hGan];
      let subWeight = 0;
      if (totalHidden === 1) subWeight = 1.0;
      else if (totalHidden === 2) subWeight = hIdx === 0 ? 0.7 : 0.3;
      else subWeight = hIdx === 0 ? 0.6 : 0.2;

      if (wx && weights[wx]) scores[wx] += (BRANCH_SCORE * subWeight * multiplier) * weights[wx];
    });
  });

  return scores;
};

const simpleWuxingAnalysis = (scores: Record<string, number>, dayMaster: string): string => {
  const dmWuxing = WUXING_MAP[dayMaster];
  if (!dmWuxing) return '无法分析日元';

  const sameEnergy = scores[dmWuxing] || 0;
  const resourceWuxing = ELEMENTS[(ELEMENTS.indexOf(dmWuxing) - 1 + 5) % 5];
  const resourceEnergy = scores[resourceWuxing] || 0;

  const supportEnergy = sameEnergy + resourceEnergy;
  let totalEnergy = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalEnergy === 0) totalEnergy = 1;

  let strengthText = '';
  let yongShen = '';

  const ratio = supportEnergy / totalEnergy;

  if (ratio >= 0.55) {
    strengthText = '偏旺';
    yongShen = '食伤 / 财星 / 官杀';
  } else if (ratio < 0.35) {
    strengthText = '偏弱';
    yongShen = '印枭 / 比劫';
  } else {
    strengthText = '中和';
    yongShen = '随运而定';
  }

  return `日元 [${dayMaster}${dmWuxing}] 能量占比 ${(ratio * 100).toFixed(0)}%，判定为【${strengthText}】。\n建议喜用神：${yongShen}。`;
};

// --- End Helpers ---

export const calculateBazi = (profile: UserProfile): BaziChart => {
  try {
    const [year, month, day] = profile.birthDate.split('-').map(Number);
    const [hour, minute] = profile.birthTime.split(':').map(Number);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = Lunar.fromSolar(solar);

    const safeLongitude = isNaN(profile.longitude) ? 120 : profile.longitude;
    const offsetMinutes = (safeLongitude - 120) * 4;
    const trueTimeDate = new Date(year, month - 1, day, hour, minute);
    trueTimeDate.setMinutes(trueTimeDate.getMinutes() + offsetMinutes);
    const trueTimeStr = `${trueTimeDate.getHours().toString().padStart(2, '0')}:${trueTimeDate.getMinutes().toString().padStart(2, '0')}`;

    const eightChar = lunar.getEightChar();
    eightChar.setSect(1);

    const yearGan = eightChar.getYearGan();
    const yearZhi = eightChar.getYearZhi();
    const monthGan = eightChar.getMonthGan();
    const monthZhi = eightChar.getMonthZhi();
    const dayGan = eightChar.getDayGan();
    const dayZhi = eightChar.getDayZhi();
    const timeGan = eightChar.getTimeGan();
    const timeZhi = eightChar.getTimeZhi();

    const dayGanName = dayGan;

    const buildPillar = (gan: string, zhi: string, naYin: string, kongWang: boolean, isDay: boolean = false): PillarData => {
      const hiddenGans = ZHI_HIDDEN[zhi] || [];
      const stars = calculateShenSha(zhi, dayGanName, dayZhi, yearZhi);
      if (kongWang) stars.push('空亡');

      return {
        gan: gan,
        zhi: zhi,
        ganGod: isDay ? '日主' : getGod(dayGanName, gan),
        zhiGod: hiddenGans.map(hidden => getGod(dayGanName, hidden)),
        hiddenGan: hiddenGans,
        naYin: naYin,
        xingYun: getChangSheng(dayGanName, zhi),
        selfXingYun: getChangSheng(gan, zhi),
        kongWang: kongWang,
        shenSha: stars,
      };
    };

    const dayXunKong = lunar.getDayXunKong();

    const pillars = {
      year: buildPillar(yearGan, yearZhi, String(eightChar.getYearNaYin()), dayXunKong.indexOf(yearZhi) > -1),
      month: buildPillar(monthGan, monthZhi, String(eightChar.getMonthNaYin()), dayXunKong.indexOf(monthZhi) > -1),
      day: buildPillar(dayGan, dayZhi, String(eightChar.getDayNaYin()), false, true),
      hour: buildPillar(timeGan, timeZhi, String(eightChar.getTimeNaYin()), dayXunKong.indexOf(timeZhi) > -1)
    };

    // Fix: Force Number for gender
    const yun = eightChar.getYun(Number(profile.gender));
    const daYunList: DaYunData[] = [];
    const daYunArr = yun.getDaYun();
    const loopLimit = Math.min(daYunArr.length, 9);

    for (let i = 0; i < loopLimit; i++) {
      const dy = daYunArr[i];
      const liuNianList: LiuNianData[] = [];
      const liuNianArr = dy.getLiuNian();

      for (let j = 0; j < liuNianArr.length; j++) {
        const ln = liuNianArr[j];
        const gz = ln.getGanZhi();
        const lnGan = gz.substring(0, 1);
        const lnZhi = gz.substring(1, 2);

        liuNianList.push({
          year: ln.getYear(),
          age: ln.getAge(),
          gan: lnGan,
          zhi: lnZhi,
          ganGod: getGod(dayGanName, lnGan), // Real Gan God
          zhiGod: getGod(dayGanName, ZHI_HIDDEN[lnZhi]?.[0] || ''), // Real Zhi Main God
        });
      }

      const dyGanZhi = dy.getGanZhi();
      const dyGan = dyGanZhi.substring(0, 1);
      const dyZhi = dyGanZhi.substring(1, 2);

      daYunList.push({
        startAge: dy.getStartAge(),
        startYear: dy.getStartYear(),
        gan: dyGan,
        zhi: dyZhi,
        ganGod: getGod(dayGanName, dyGan), // Real Gan God
        zhiGod: getGod(dayGanName, ZHI_HIDDEN[dyZhi]?.[0] || ''), // Real Zhi Main God
        naYin: '', // lunar-javascript might not have easy DaYun NaYin, leave empty for now
        liuNian: liuNianList
      });
    }

    const pillarObjs = [
      { gan: yearGan, zhi: yearZhi },
      { gan: monthGan, zhi: monthZhi },
      { gan: dayGan, zhi: dayZhi },
      { gan: timeGan, zhi: timeZhi }
    ];

    const calculatedScores = calculateWuxingEnergy(pillarObjs, monthZhi);
    const getSafeScore = (val: number) => isNaN(val) ? 0 : Math.round(val);

    const wuxingScores = [
      { name: '木', value: getSafeScore(calculatedScores['木']), color: '#4ade80' },
      { name: '火', value: getSafeScore(calculatedScores['火']), color: '#f87171' },
      { name: '土', value: getSafeScore(calculatedScores['土']), color: '#fbbf24' },
      { name: '金', value: getSafeScore(calculatedScores['金']), color: '#94a3b8' },
      { name: '水', value: getSafeScore(calculatedScores['水']), color: '#60a5fa' },
    ];

    const summary = simpleWuxingAnalysis(calculatedScores, dayGan);

    let qiYunInfo = '计算中';
    try {
      qiYunInfo = `出生后 ${yun.getYear()}年 ${yun.getMonth()}月 ${yun.getDay()}天 起运`;
    } catch (e) {
      console.warn('QiYun Info Error', e);
      qiYunInfo = '起运时间计算异常';
    }

    return {
      pillars: pillars,
      meta: {
        solarDate: `${year}-${month}-${day} ${hour}:${minute}`,
        lunarDate: lunar.toString(),
        jieQiPrevious: `${lunar.getPrevJieQi().getName()} (${lunar.getPrevJieQi().getSolar().toYmd()})`,
        jieQiNext: `${lunar.getNextJieQi().getName()} (${lunar.getNextJieQi().getSolar().toYmd()})`,
        trueSolarTime: trueTimeStr,
        gender: profile.gender === 1 ? '乾造 (男)' : '坤造 (女)',
        sign: lunar.getYearShengXiao(),
        qiYunInfo: qiYunInfo,
      },
      hidden: {
        taiYuan: String(eightChar.getTaiYuan()),
        mingGong: String(eightChar.getMingGong()),
        shenGong: String(eightChar.getShenGong())
      },
      wuxing: {
        scores: wuxingScores,
        summary: summary
      },
      daYun: daYunList
    };
  } catch (error) {
    console.error("Bazi Calculation Error:", error);
    throw error;
  }
};