import fuzzysort from 'fuzzysort';

export interface City {
    name: string;
    country: string;
    subcountry: string;
    latitude: number;
    longitude: number;
    alternatenames?: string;
}

let citiesCache: City[] | null = null;
let isLoading = false;

export const loadCities = async (): Promise<City[]> => {
    if (citiesCache) return citiesCache;
    if (isLoading) {
        // Simple polling if already loading
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return citiesCache || [];
    }

    isLoading = true;
    try {
        const response = await fetch('/data/world-cities.json');
        if (!response.ok) {
            throw new Error('Failed to load cities data');
        }
        citiesCache = await response.json();
    } catch (e) {
        console.error(e);
        citiesCache = [];
    } finally {
        isLoading = false;
    }
    return citiesCache || [];
};

export const searchCities = async (query: string): Promise<City[]> => {
    if (!query || query.trim().length < 2) return [];

    const cities = await loadCities();

    // Prepare for fuzzysort (create a key including alternate names for better matching)
    // To optimize, we could pre-process this, but doing it on the fly for thousands of cities might be heavy.
    // Let's use fuzzysort on the raw objects using keys.

    const results = fuzzysort.go(query, cities, {
        keys: ['name', 'alternatenames', 'subcountry', 'country'],
        scoreFn: (a) => Math.max(
            a[0] ? a[0].score : -1000,
            a[1] ? a[1].score : -1000,
            a[2] ? a[2].score - 100 : -1000, // slightly lower priority for region
            a[3] ? a[3].score - 200 : -1000  // lower priority for country
        ),
        limit: 20, // Limit results
        threshold: -10000,
    });

    return results.map(res => res.obj);
};
