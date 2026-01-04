export interface UserProfile {
  id: string;
  name: string;
  gender: 0 | 1; // 0: Female (Kun), 1: Male (Qian)
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  longitude: number; // For True Solar Time
  notes: string;
}

export interface BaziChart {
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData;
  };
  meta: {
    solarDate: string;
    lunarDate: string;
    jieQiPrevious: string;
    jieQiNext: string;
    trueSolarTime: string; // HH:mm
    gender: string;
    sign: string; // Zodiac
    qiYunInfo?: string; // Precise start of Da Yun
  };
  hidden: {
    taiYuan: string; // Life Conception
    mingGong: string; // Life Palace
    shenGong: string; // Body Palace
  };
  wuxing: {
    scores: { name: string; value: number; color: string }[];
    summary: string; // "Strong", "Weak", etc.
    details?: {
      dmWuxing: string; // '木'
      strength: string; // '偏旺'
      percentage: number; // 0-100
      yongShen: string; // '食神...'
      sameParty: number; // Energy score
      otherParty: number; // Energy score
    };
  };
  daYun: DaYunData[];
}

export interface PillarData {
  gan: string; // Heavenly Stem
  zhi: string; // Earthly Branch
  ganGod: string; // Ten Gods (Heaven)
  zhiGod: string[]; // Ten Gods (Hidden in Earth)
  hiddenGan: string[]; // Hidden Stems
  naYin: string; // Sound/Melody
  xingYun: string; // 12 Life Stages (Day Master relative to Branch)
  selfXingYun: string; // 12 Life Stages (Stem relative to Branch - Self Sitting)
  kongWang: boolean; // Empty/Death
  shenSha: string[]; // Gods and Evils
}

export interface DaYunData {
  startAge: number;
  startYear: number;
  gan: string;
  zhi: string;
  ganGod: string;
  zhiGod: string;
  naYin: string;
  liuNian: LiuNianData[];
}

export interface LiuNianData {
  year: number;
  age: number;
  gan: string;
  zhi: string;
  ganGod: string;
  zhiGod: string;
}

export enum TabType {
  CHART = 'chart',
  TIMELINE = 'timeline',
  LIFE_BOOK = 'life_book',
  SHEN_SHA = 'shen_sha',
  SYNASTRY = 'synastry', // Combined Chart
  AI = 'ai',
}