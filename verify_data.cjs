const { Lunar } = require('lunar-javascript');

const date = new Date('2026-01-04T12:00:00'); // Noon to avoid timezone edge cases
const d = Lunar.fromDate(date);

console.log('--- 2026-01-04 Check ---');
console.log('Date:', date.toISOString());
console.log('GanZhi Year:', d.getYearInGanZhi());
console.log('GanZhi Month:', d.getMonthInGanZhi());
console.log('GanZhi Day:', d.getDayInGanZhi());
console.log('Lunar Month:', d.getMonthInChinese());
console.log('Lunar Day:', d.getDayInChinese());
console.log('Wealth:', d.getPositionCai()); // Cai Shen
console.log('Joy:', d.getPositionXi()); // Xi Shen
console.log('Noble (Yang):', d.getPositionYangGui());
console.log('Noble (Yin):', d.getPositionYinGui());
console.log('Chong:', d.getDayChongDesc());
console.log('Sha:', d.getDaySha());
console.log('Peng Zu Gan:', d.getPengZuGan());
console.log('Peng Zu Zhi:', d.getPengZuZhi());
console.log('Yi:', d.getYi().join(', ')); // Check if .getYi exists in this version
console.log('DayYi:', d.getDayYi().join(', '));
console.log('Ji:', d.getJi().join(', '));
console.log('DayJi:', d.getDayJi().join(', '));
