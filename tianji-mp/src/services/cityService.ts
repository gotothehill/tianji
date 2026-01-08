import citiesData from './cities-lite.json';

export interface City {
    name: string;
    subcountry: string;
    country: string;
    longitude: number;
    latitude: number;
}

// Local cache (in-memory)
let citiesCache: City[] = citiesData as City[];

// Load cities (Synchronous import for lite version in MP)
const loadCities = async (): Promise<City[]> => {
    return citiesCache;
};

export const searchCities = async (query: string): Promise<City[]> => {
    if (!query || query.length < 2) return [];

    const cities = await loadCities();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const scored = cities.map((city) => {
        const name = (city.name || '').toLowerCase();
        const sub = (city.subcountry || '').toLowerCase();
        const country = (city.country || '').toLowerCase();

        let score = 99;
        if (name.startsWith(q)) score = 0;
        else if (name.includes(q)) score = 1;
        else if (sub.includes(q)) score = 2;
        else if (country.includes(q)) score = 3;
        else return null;

        return { city, score };
    }).filter(Boolean) as { city: City; score: number }[];

    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 20).map(item => item.city);
};
