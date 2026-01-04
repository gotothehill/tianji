
import { Solar, Lunar } from 'lunar-javascript';

// Mock Profile
const profile = {
    birthDate: '1990-01-01',
    birthTime: '12:00',
    gender: 1, // Male
    longitude: 116.40
};

console.log("--- Debugging Bazi Calculation ---");

try {
    const [year, month, day] = profile.birthDate.split('-').map(Number);
    const [hour, minute] = profile.birthTime.split(':').map(Number);

    console.log(`Input: ${year}-${month}-${day} ${hour}:${minute}, Gender: ${profile.gender}`);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = Lunar.fromSolar(solar);

    console.log(`Lunar: ${lunar.toString()}`);

    const eightChar = lunar.getEightChar();

    // Testing Sect Logic
    console.log("Setting Sect 1 (Default in my code)...");
    eightChar.setSect(1); // What does this do? 
    // 1: Year starts from Lunar New Year? 2: Year starts from Li Chun?
    // Bazi usually requires Year form Li Chun. Sect 2 is likely correct for Bazi.

    const yun = eightChar.getYun(Number(profile.gender));

    console.log("Yun Object Created.");
    console.log(`Start Year: ${yun.getStartYear()}`);
    console.log(`Start Month: ${yun.getStartMonth()}`);
    console.log(`Start Day: ${yun.getStartDay()}`);

    console.log(`Yun Year (Span): ${yun.getYear()}`);
    console.log(`Yun Month (Span): ${yun.getMonth()}`);
    console.log(`Yun Day (Span): ${yun.getDay()}`);

    console.log("Qi Yun Info Success!");

} catch (error: any) {
    console.error("!!! CAUGHT ERROR !!!");
    console.error(error);
    if (error.stack) console.error(error.stack);
}
