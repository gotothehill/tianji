export interface UserProfile {
    id: string;
    name: string;
    gender: 0 | 1;
    birthDate: string;
    birthTime: string;
    longitude: number;
    notes: string;
    reports?: {
        lifeBook?: {
            content: string;
            timestamp: number;
        };
        synastry?: Record<string, {
            content: string;
            timestamp: number;
        }>;
    };
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
        trueSolarTime: string;
        gender: string;
        sign: string;
        qiYunInfo?: string;
    };
    hidden: {
        taiYuan: string;
        mingGong: string;
        shenGong: string;
    };
    wuxing: {
        scores: { name: string; value: number; color: string }[];
        summary: string;
        details?: {
            dmWuxing: string;
            strength: string;
            percentage: number;
            yongShen: string;
            sameParty: number;
            otherParty: number;
        };
    };
    daYun: DaYunData[];
}

export interface PillarData {
    gan: string;
    zhi: string;
    ganGod: string;
    zhiGod: string[];
    hiddenGan: string[];
    naYin: string;
    xingYun: string;
    selfXingYun: string;
    kongWang: boolean;
    shenSha: string[];
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
    SYNASTRY = 'synastry',
    AI = 'ai',
    AI_CHAT = 'ai_chat',
}
