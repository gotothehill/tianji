const { Lunar } = require('lunar-javascript');

const date = new Date('2026-01-04T00:00:00');
const d = Lunar.fromDate(date); // Zi hour
console.log('Hour 0 (Zi):', d.getTimeInGanZhi());
// console.log('TianShen:', d.getTimeTianShen()); // Methods might vary
// console.log('Luck:', d.getTimeTianShenLuck());

// Check if these methods exist in keys or are on prototype
// We can try to invoke.
try {
    console.log('TianShen:', d.getTimeTianShen());
    console.log('Luck:', d.getTimeTianShenLuck());
} catch (e) { console.log('Error 1:', e.message); }

try {
    // Maybe getShiShen?
    // In Lunar, time info is often separate class 'LunarTime' in other ports, but in JS it's usually on Lunar object.
    // Let's iterate hours by shifting date
} catch (e) { }

console.log('--- Iteration ---');
for (let h = 0; h < 24; h += 2) {
    const tmpDate = new Date('2026-01-04T00:00:00');
    tmpDate.setHours(h);
    const tmpLunar = Lunar.fromDate(tmpDate);
    // Try to get luck
    // Note: getTianShenLuck might assume "Yellow/Black Path" (Huang Dao / Hei Dao)
    try {
        const luck = tmpLunar.getTimeTianShenLuck();
        const shen = tmpLunar.getTimeTianShen();
        console.log(`Hour ${h}: ${tmpLunar.getTimeZhi()} - ${shen} (${luck})`);
    } catch (e) { }
}
