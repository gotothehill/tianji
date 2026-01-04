import { Lunar, Solar } from 'lunar-javascript';

console.log("Lunar Type:", typeof Lunar);
console.log("Lunar Keys:", Object.keys(Lunar || {}));
try {
    const d = Lunar.fromDate(new Date());
    console.log("Date created:", d.toFullString());
} catch (e) {
    console.log("Error creating date:", e);
}
