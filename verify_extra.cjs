const { Lunar } = require('lunar-javascript');

const date = new Date('2026-01-04T12:00:00');
const d = Lunar.fromDate(date);

console.log('--- Extra Data Check ---');
console.log('Na Yin:', d.getYearNaYin(), d.getMonthNaYin(), d.getDayNaYin()); // Verify methods
console.log('Day Ji Shen:', d.getDayJiShen().join(', '));
console.log('Day Xiong Sha:', d.getDayXiongSha().join(', '));

console.log('--- Hours ---');
// Lunar hours 0-11 (Zi to Hai)
for (let i = 0; i < 12; i++) {
    // Hours logic in Chinese calendar usually 0=Zi(23-1), 1=Chou(1-3)...
    // The library might handle this via .getTime(i) or similar? 
    // Usually .getTimes() returns list? No.
    // Let's try to get specific time.
    // d is Lunar object. Does it have hour iterator?
    // Usually we construct a Lunar item or just infer.
    // Actually `d.getTimeZhi()` gets current.
    // There isn't a simple "get all hours" on a Lunar Day object usually, we iterate.
}

// Check documentation/methods via instance inspection in node
console.log('d keys:', Object.keys(d).filter(k => k.startsWith('get')));
// We can't see methods in keys for class instances usually.

// Trying specific hour retrieval if known
try {
    // Common pattern in this lib is convert to EightChar or just manual check
    // But wait, user said "Lunar display has these", implying the lib has them easily.
    // Standard `lunar-javascript` has `Lunar.getTime(i)`? No, `d` is a specific moment.
    // But we want the whole day's hours.
    // We can create new Lunar objects for specific hours? Or simpler:
    // The logic for hour luck:
    // Input: Day Gan/Zhi + Hour Zhi.
} catch (e) { console.log(e.message); }
