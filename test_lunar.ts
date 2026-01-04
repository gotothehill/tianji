import { Lunar } from 'lunar-javascript';

try {
    const d = Lunar.fromDate(new Date());
    console.log("Lunar Test Success:", d.toFullString());
} catch (e) {
    console.error("Lunar Test Failed:", e);
}
