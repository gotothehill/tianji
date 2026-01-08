import citiesData from './cities-lite.json';

export interface City {
    name: string;
    subcountry: string;
    country: string;
    longitude: number;
    latitude: number;
    alternatenames?: string;
}

const FULL_CITIES_URL = 'https://meta-oss-bj.genimeta.com/h5/files/world-cities.json';
const CITY_FILE_KEY = 'TJ_CITY_FULL_FILE';
const RESULT_LIMIT = 20;

let citiesCache: City[] | null = null;
let indexedCache: { city: City; name: string; sub: string; country: string; alt: string; all: string }[] | null = null;
let isLoading = false;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFileSystem = () => {
    try {
        return uni.getFileSystemManager();
    } catch (e) {
        return null;
    }
};

const fileExists = async (filePath: string): Promise<boolean> => {
    const fs = getFileSystem();
    if (!fs) return false;
    return new Promise(resolve => {
        fs.access({
            path: filePath,
            success: () => resolve(true),
            fail: () => resolve(false)
        });
    });
};

const readFileText = async (filePath: string): Promise<string> => {
    const fs = getFileSystem();
    if (!fs) throw new Error('File system unavailable');
    return new Promise((resolve, reject) => {
        fs.readFile({
            filePath,
            encoding: 'utf8',
            success: res => resolve(res.data as string),
            fail: err => reject(err)
        });
    });
};

const downloadCitiesFile = async (): Promise<string> => {
    const downloadRes = await new Promise<UniApp.DownloadSuccessCallbackResult>((resolve, reject) => {
        uni.downloadFile({
            url: FULL_CITIES_URL,
            success: resolve,
            fail: reject
        });
    });

    if (!downloadRes.tempFilePath || downloadRes.statusCode !== 200) {
        throw new Error('Download cities failed');
    }

    const saved = await new Promise<UniApp.SaveFileSuccessCallbackResult>((resolve, reject) => {
        uni.saveFile({
            tempFilePath: downloadRes.tempFilePath,
            success: resolve,
            fail: reject
        });
    });

    uni.setStorageSync(CITY_FILE_KEY, saved.savedFilePath);
    return saved.savedFilePath;
};

const ensureCitiesFile = async (): Promise<string | null> => {
    let filePath = uni.getStorageSync(CITY_FILE_KEY) as string;
    if (filePath && await fileExists(filePath)) {
        return filePath;
    }
    try {
        filePath = await downloadCitiesFile();
        return filePath;
    } catch (e) {
        return null;
    }
};

const loadCities = async (): Promise<City[]> => {
    if (citiesCache) return citiesCache;
    if (isLoading) {
        while (isLoading) {
            await sleep(80);
        }
        return citiesCache || [];
    }

    isLoading = true;
    try {
        const filePath = await ensureCitiesFile();
        if (!filePath) {
            throw new Error('No city file');
        }
        const content = await readFileText(filePath);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            citiesCache = parsed as City[];
        } else {
            throw new Error('Invalid cities data');
        }
    } catch (e) {
        citiesCache = citiesData as City[];
    } finally {
        isLoading = false;
    }

    if (!indexedCache && citiesCache) {
        indexedCache = citiesCache.map((city) => {
            const name = (city.name || '').toLowerCase();
            const sub = (city.subcountry || '').toLowerCase();
            const country = (city.country || '').toLowerCase();
            const alt = (city.alternatenames || '').toLowerCase();
            const all = `${name} ${alt} ${sub} ${country}`;
            return { city, name, sub, country, alt, all };
        });
    }

    return citiesCache || [];
};

export const preloadCities = async (): Promise<boolean> => {
    const filePath = await ensureCitiesFile();
    return !!filePath;
};

const scoreField = (field: string, query: string, weight: number) => {
    if (!field) return null;
    if (field === query) return weight - 1;
    if (field.startsWith(query)) return weight;
    const idx = field.indexOf(query);
    if (idx === -1) return null;
    return weight + 1 + Math.min(idx, 20) / 100;
};

export const searchCities = async (query: string): Promise<City[]> => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    await loadCities();
    if (!indexedCache) return [];

    const tokens = q.split(/\\s+/).filter(Boolean);
    const results: { city: City; score: number }[] = [];

    for (let i = 0; i < indexedCache.length; i += 1) {
        const item = indexedCache[i];
        if (tokens.length > 1) {
            let allOk = true;
            for (let t = 0; t < tokens.length; t += 1) {
                if (!item.all.includes(tokens[t])) {
                    allOk = false;
                    break;
                }
            }
            if (!allOk) continue;
        }

        let best: number | null = null;
        const scores = [
            scoreField(item.name, q, 0),
            scoreField(item.alt, q, 0.5),
            scoreField(item.sub, q, 2),
            scoreField(item.country, q, 3)
        ];
        for (let s = 0; s < scores.length; s += 1) {
            const val = scores[s];
            if (val === null) continue;
            if (best === null || val < best) best = val;
        }
        if (best === null) continue;

        if (results.length < RESULT_LIMIT) {
            results.push({ city: item.city, score: best });
        } else {
            let worstIdx = 0;
            for (let r = 1; r < results.length; r += 1) {
                if (results[r].score > results[worstIdx].score) worstIdx = r;
            }
            if (best < results[worstIdx].score) {
                results[worstIdx] = { city: item.city, score: best };
            }
        }
    }

    results.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.city.name.length - b.city.name.length;
    });

    return results.map(item => item.city);
};
