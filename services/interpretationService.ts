import { BaziChart } from '../types';

// --- Personality Dictionary ---
const DM_PERSONALITY: Record<string, string> = {
    '甲': '甲木为参天大树，性质刚健。您性格直爽，仁慈善良，富有责任感，但不仅有些固执，不善转弯。',
    '乙': '乙木为花草之木，性质柔顺。您适应力强，善于变通，心思细腻，但有时由于太在意他人看法而缺乏主见。',
    '丙': '丙火为太阳之火，热情奔放。您充满活力，慷慨大方，乐于助人，但性急易怒，好面子。',
    '丁': '丁火为灯烛之火，温和摇曳。您外表温和，内心热情，洞察力强，富有牺牲精神，但多愁善感。',
    '戊': '戊土为城墙之土，厚重稳固。您诚实守信，宽厚包容，沉稳踏实，但有时过于保守，缺乏变通。',
    '己': '己土为田园之土，滋养万物。您多才多艺，内敛含蓄，做事有条理，但有时疑心较重。',
    '庚': '庚金为刀剑之金，刚毅果断。您爱憎分明，讲义气，好打抱不平，但性格刚强，容易得罪人。',
    '辛': '辛金为珠玉之金，温润秀气。您自尊心强，爱惜羽毛，口才极佳，但有时虚荣心较重。',
    '壬': '壬水为江河之水，奔流不息。您聪明智慧，胸怀宽广，善于应变，但有时任性放纵，难以约束。',
    '癸': '癸水为雨露之水，滋润万物。您性格温柔，平静内敛，富有想象力，但有时容易悲观，情绪波动大。'
};

// --- Career/Wealth Dictionary based on Yong Shen (Favored Element) ---
const CAREER_ADVICE: Record<string, string> = {
    '木': '五行喜木，宜从事与“生长、教育、文创、木材”相关的行业。如教育界、出版业、家具装潢、花卉园艺、服装设计等。东方为您吉祥方位。',
    '火': '五行喜火，宜从事与“发光、发热、能源、科技”相关的行业。如互联网、光电、餐饮、演艺界、美容美发、心理咨询等。南方为您吉祥方位。',
    '土': '五行喜土，宜从事与“土地、稳固、承载、中间人”相关的行业。如房地产、建筑、仓储、农牧、中介顾问、行政管理等。本地或中心地带为吉祥方位。',
    '金': '五行喜金，宜从事与“决断、金属、金融、武职”相关的行业。如金融证券、珠宝五金、汽车机械、军警执法、外科医生等。西方为您吉祥方位。',
    '水': '五行喜水，宜从事与“流动、寒冷、智慧、清洁”相关的行业。如贸易运输、航海、水利清洁、冷冻食品、旅游导游、记者媒体等。北方为您吉祥方位。'
};

// --- Love/Relationships Dictionary ---
// Simple logic checking Day Branch (Spouse Palace)
const RELATIONSHIP_ADVICE = (dayBranch: string, gender: string | number): string => {
    // Basic simplified interpretations
    const PEACH_BLOSSOMS = ['子', '午', '卯', '酉'];
    const TRAVEL_STARS = ['寅', '申', '巳', '亥'];
    const STORAGE_STARS = ['辰', '戌', '丑', '未'];

    let advice = '配偶宫平静，感情生活趋于平淡稳定，宜细水长流。';

    if (PEACH_BLOSSOMS.includes(dayBranch)) {
        advice = '日支坐桃花，配偶通常长相俊美，风流倜傥，异性缘佳。需防感情风波，宜多沟通建立信任。';
    } else if (TRAVEL_STARS.includes(dayBranch)) {
        advice = '日支坐驿马，配偶大多来自远方，或婚后生活多变动奔波。相处宜多包容，距离产生美。';
    } else if (STORAGE_STARS.includes(dayBranch)) {
        advice = '日支坐库，配偶性格敦厚沉稳，善于持家理财，但有时较为内向或固执。是过日子的好手。';
    }

    return advice;
};

// --- Main Interpretation Function ---
export const getBriefInterpretation = (chart: BaziChart) => {
    const dayGan = chart.pillars.day.gan;
    const dayBranch = chart.pillars.day.zhi;
    const yongShenRaw = chart.wuxing.details?.yongShen || '';
    // Extract first favored element (e.g. "火 / 土" -> "火")
    const primaryYongShen = yongShenRaw.split('/')[0]?.trim().substring(0, 1) || '木';
    // Map wuxing char directly if possible, else default
    const careerKey = ['木', '火', '土', '金', '水'].find(k => k === primaryYongShen) || '木';

    // Personality
    const personality = DM_PERSONALITY[dayGan] || "性格温和，待人友善。";

    // Career
    const career = CAREER_ADVICE[careerKey];

    // Love
    const love = RELATIONSHIP_ADVICE(dayBranch, chart.meta.gender);

    return {
        personality,
        career,
        love
    };
};
