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
// Start Branch Index (in ZHI array) for Chang Sheng
// Based on Fire/Earth Same Palace (Huo Tu Tong Gong)
const CHANG_SHENG_START: Record<string, number> = {
  '甲': 11, // Hai
  '乙': 6,  // Wu
  '丙': 2,  // Yin
  '丁': 9,  // You
  '戊': 2,  // Yin (Fire/Earth Same Palace)
  '己': 9,  // You (Fire/Earth Same Palace)
  '庚': 5,  // Si
  '辛': 0,  // Zi
  '壬': 8,  // Shen
  '癸': 3   // Mao
};

const getChangSheng = (gan: string, zhi: string): string => {
  const ganIdx = GAN.indexOf(gan);
  const zhiIdx = ZHI.indexOf(zhi);
  if (ganIdx === -1 || zhiIdx === -1) return '';
  
  const startZhi = CHANG_SHENG_START[gan];
  const isYang = ganIdx % 2 === 0; // Even is Yang in our array (0=甲)
  
  let offset;
  if (isYang) {
    // Forward
    offset = (zhiIdx - startZhi + 12) % 12;
  } else {
    // Backward
    offset = (startZhi - zhiIdx + 12) % 12;
  }
  return CHANG_SHENG_STAGES[offset];
};

// Shen Sha Logic
const calculateShenSha = (zhi: string, dayGan: string, dayZhi: string, yearZhi: string): string[] => {
  const list: string[] = [];

  // --- Noble Stars (Ji Shen) ---

  // 1. Tian Yi Gui Ren (Nobleman) - Based on Day Gan
  const tianYiMap: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '辛': ['午', '寅']
  };
  if (tianYiMap[dayGan]?.includes(zhi)) list.push('天乙贵人');

  // 2. Wen Chang (Academic) - Based on Day Gan
  const wenChangMap: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', 
    '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
  };
  if (wenChangMap[dayGan] === zhi) list.push('文昌贵人');

  // 3. Lu Shen (Thriving/Salary) - Based on Day Gan
  const luShenMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
  };
  if (luShenMap[dayGan] === zhi) list.push('禄神');

  // --- Peach Blossom & Mobility ---

  // 4. Tao Hua (Peach Blossom) - Based on Year Zhi or Day Zhi
  const checkTaoHua = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '酉') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '卯') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '子') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '午') return true;
    return false;
  };
  if (checkTaoHua(yearZhi, zhi) || checkTaoHua(dayZhi, zhi)) list.push('桃花');

  // 5. Yi Ma (Traveling Horse) - Based on Year Zhi or Day Zhi
  const checkYiMa = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '寅') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '申') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '巳') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '亥') return true;
    return false;
  };
  if (checkYiMa(yearZhi, zhi) || checkYiMa(dayZhi, zhi)) list.push('驿马');

  // --- Art & Power Stars ---

  // 6. Hua Gai (Elegant Seal/Art) - Based on Year Zhi or Day Zhi
  const checkHuaGai = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '辰') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '戌') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '未') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '丑') return true;
    return false;
  };
  if (checkHuaGai(yearZhi, zhi) || checkHuaGai(dayZhi, zhi)) list.push('华盖');

  // 7. Jiang Xing (General Star) - Based on Year Zhi or Day Zhi
  const checkJiangXing = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '子') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '午') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '卯') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '酉') return true;
    return false;
  };
  if (checkJiangXing(yearZhi, zhi) || checkJiangXing(dayZhi, zhi)) list.push('将星');

  // --- Aggressive/Negative Stars ---

  // 8. Yang Ren (Goat Blade) - Based on Day Gan
  const yangRenMap: Record<string, string> = {
    '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
    '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥'
  };
  if (yangRenMap[dayGan] === zhi) list.push('羊刃');

  // 9. Jie Sha (Robbery Sha) - Based on Year Zhi or Day Zhi
  const checkJieSha = (baseZhi: string, targetZhi: string) => {
    if (['申', '子', '辰'].includes(baseZhi) && targetZhi === '巳') return true;
    if (['寅', '午', '戌'].includes(baseZhi) && targetZhi === '亥') return true;
    if (['亥', '卯', '未'].includes(baseZhi) && targetZhi === '申') return true;
    if (['巳', '酉', '丑'].includes(baseZhi) && targetZhi === '寅') return true;
    return false;
  };
  if (checkJieSha(yearZhi, zhi) || checkJieSha(dayZhi, zhi)) list.push('劫煞');

  // --- Year Related (Sui Sha) ---

  // 10. Tai Sui (Grand Duke) - Matches Year Zhi
  if (zhi === yearZhi) list.push('太岁');

  // 11. Sui Po (Year Breaker) - Clashes Year Zhi
  const clashes: Record<string, string> = {
    '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
    '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
  };
  if (clashes[yearZhi] === zhi) list.push('岁破');

  // 12. Gu Chen (Solitary) & 13. Gua Su (Widow) - Based on Year Branch (San Hui)
  let gu = '', gua = '';
  if (['亥', '子', '丑'].includes(yearZhi)) { gu = '寅'; gua = '戌'; }
  else if (['寅', '卯', '辰'].includes(yearZhi)) { gu = '巳'; gua = '丑'; }
  else if (['巳', '午', '未'].includes(yearZhi)) { gu = '申'; gua = '辰'; }
  else if (['申', '酉', '戌'].includes(yearZhi)) { gu = '亥'; gua = '未'; }

  if (zhi === gu) list.push('孤辰');
  if (zhi === gua) list.push('寡宿');

  return Array.from(new Set(list)); // Deduplicate
};

// --- End Helpers ---

export const calculateBazi = (profile: UserProfile): BaziChart => {
  const [year, month, day] = profile.birthDate.split('-').map(Number);
  const [hour, minute] = profile.birthTime.split(':').map(Number);

  // Initialize Solar Time
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  
  // Convert to Lunar with Longitude correction (True Solar Time)
  const lunar = Lunar.fromSolar(solar);
  
  // Manual offset for display
  const offsetMinutes = (profile.longitude - 120) * 4;
  const trueTimeDate = new Date(year, month - 1, day, hour, minute);
  trueTimeDate.setMinutes(trueTimeDate.getMinutes() + offsetMinutes);
  const trueTimeStr = `${trueTimeDate.getHours().toString().padStart(2, '0')}:${trueTimeDate.getMinutes().toString().padStart(2, '0')}`;

  const eightChar = lunar.getEightChar();
  eightChar.setSect(1); // Standard sect

  // Retrieve Pillars as Strings
  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan();
  const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan();
  const timeZhi = eightChar.getTimeZhi();

  const dayGanName = dayGan; // It's already a string

  // Helper to build pillar data
  const buildPillar = (gan: string, zhi: string, naYin: string, kongWang: boolean, isDay: boolean = false): PillarData => {
      const hiddenGans = ZHI_HIDDEN[zhi] || [];
      const stars = calculateShenSha(zhi, dayGanName, dayZhi, yearZhi);
      
      // Add Kong Wang as a Shen Sha for the table
      if (kongWang) stars.push('空亡');

      return {
        gan: gan,
        zhi: zhi,
        ganGod: isDay ? '日主' : getGod(dayGanName, gan),
        zhiGod: hiddenGans.map(hidden => getGod(dayGanName, hidden)),
        hiddenGan: hiddenGans,
        naYin: naYin,
        xingYun: getChangSheng(dayGanName, zhi), // DM relative to Zhi
        selfXingYun: getChangSheng(gan, zhi), // Stem relative to Zhi (Self-Sitting)
        kongWang: kongWang,
        shenSha: stars, 
      };
  };

  // Xun Kong
  const dayXunKong = lunar.getDayXunKong();

  const pillars = {
    year: buildPillar(
        yearGan, 
        yearZhi, 
        String(eightChar.getYearNaYin()), 
        dayXunKong.indexOf(yearZhi) > -1
    ),
    month: buildPillar(
        monthGan, 
        monthZhi, 
        String(eightChar.getMonthNaYin()), 
        dayXunKong.indexOf(monthZhi) > -1
    ),
    day: buildPillar(
        dayGan, 
        dayZhi, 
        String(eightChar.getDayNaYin()), 
        false, 
        true
    ),
    hour: buildPillar(
        timeGan, 
        timeZhi, 
        String(eightChar.getTimeNaYin()),
        dayXunKong.indexOf(timeZhi) > -1
    )
  };

  // Generate DaYun
  const yun = eightChar.getYun(profile.gender); 
  const daYunList: DaYunData[] = [];
  const daYunArr = yun.getDaYun();
  
  const loopLimit = daYunArr.length < 9 ? daYunArr.length : 9;

  for(let i=0; i<loopLimit; i++) {
    const dy = daYunArr[i];
    const liuNianList: LiuNianData[] = [];
    
    const liuNianArr = dy.getLiuNian();
    
    for(let j=0; j<liuNianArr.length; j++) {
        const ln = liuNianArr[j];
        const gz = ln.getGanZhi(); 
        
        liuNianList.push({
            year: ln.getYear(),
            age: ln.getAge(),
            gan: gz.substring(0,1),
            zhi: gz.substring(1,2),
            ganGod: '流',
            zhiGod: '年'
        });
    }

    const dyGanZhi = dy.getGanZhi(); 

    daYunList.push({
        startAge: dy.getStartAge(),
        startYear: dy.getStartYear(),
        gan: dyGanZhi.substring(0,1),
        zhi: dyGanZhi.substring(1,2),
        ganGod: '运', 
        zhiGod: '神',
        naYin: '', 
        liuNian: liuNianList
    });
  }

  const wuxingScores = [
    { name: '木', value: 30, color: '#4ade80' },
    { name: '火', value: 45, color: '#f87171' },
    { name: '土', value: 10, color: '#fbbf24' },
    { name: '金', value: 5, color: '#94a3b8' },
    { name: '水', value: 10, color: '#60a5fa' },
  ];

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
    },
    hidden: {
        taiYuan: String(eightChar.getTaiYuan()),
        mingGong: String(eightChar.getMingGong()),
        shenGong: String(eightChar.getShenGong())
    },
    wuxing: {
        scores: wuxingScores,
        summary: '日元状态需结合月令判定。'
    },
    daYun: daYunList
  };
};