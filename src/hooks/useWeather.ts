import { useState, useEffect, useCallback } from 'react';
import type { WeatherData, GeoLocation } from '../types/weather';

// ─── LocalStorage keys ───────────────────────────────────────────────────────
const LS_SEARCH_KEY = 'weather_search_city';
const LS_SEARCH_DATA_KEY = 'weather_search_data';

// ─── API helpers ─────────────────────────────────────────────────────────────
async function geocodeCity(city: string): Promise<GeoLocation> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al buscar la ciudad');
    const data = await res.json() as {
        results?: Array<{ name: string; country: string; latitude: number; longitude: number }>;
    };
    if (!data.results || data.results.length === 0) {
        throw new Error(`No se encontró la ciudad "${city}"`);
    }
    const r = data.results[0];
    return { name: r.name, country: r.country, latitude: r.latitude, longitude: r.longitude };
}

async function fetchWeather(location: GeoLocation): Promise<WeatherData> {
    const { latitude, longitude } = location;
    const url = [
        `https://api.open-meteo.com/v1/forecast`,
        `?latitude=${latitude}&longitude=${longitude}`,
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day`,
        `&daily=weather_code,temperature_2m_max,temperature_2m_min`,
        `&timezone=auto&forecast_days=4`,
    ].join('');

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener el clima');

    const data = await res.json() as {
        current: {
            temperature_2m: number;
            apparent_temperature: number;
            relative_humidity_2m: number;
            wind_speed_10m: number;
            weather_code: number;
            is_day: number;
        };
        daily: {
            time: string[];
            weather_code: number[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
        };
    };

    const forecast = data.daily.time.slice(1, 4).map((date, i) => ({
        date,
        maxTemp: Math.round(data.daily.temperature_2m_max[i + 1]),
        minTemp: Math.round(data.daily.temperature_2m_min[i + 1]),
        weatherCode: data.daily.weather_code[i + 1],
    }));

    return {
        location,
        current: {
            temperature: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day === 1,
        },
        forecast,
        fetchedAt: Date.now(),
    };
}

export async function fetchCityWeather(city: string): Promise<WeatherData> {
    const location = await geocodeCity(city);
    return fetchWeather(location);
}

// ─── Hook: múltiples ciudades famosas ─────────────────────────────────────────
const FAMOUS_CITIES = ['Nueva York', 'Londres', 'Tokio', 'París', 'Dubái'];

export interface CityWeatherState {
    data: WeatherData | null;
    loading: boolean;
    error: string | null;
}

export function useFamousCities() {
    const [cities, setCities] = useState<Record<string, CityWeatherState>>(() =>
        Object.fromEntries(FAMOUS_CITIES.map(c => [c, { data: null, loading: true, error: null }]))
    );

    useEffect(() => {
        FAMOUS_CITIES.forEach(city => {
            fetchCityWeather(city)
                .then(data => {
                    setCities(prev => ({ ...prev, [city]: { data, loading: false, error: null } }));
                })
                .catch(err => {
                    const message = err instanceof Error ? err.message : 'Error';
                    setCities(prev => ({ ...prev, [city]: { data: null, loading: false, error: message } }));
                });
        });
    }, []);

    return { cities, cityNames: FAMOUS_CITIES };
}

// ─── Hook: búsqueda manual con persistencia en LocalStorage ──────────────────
export function useSearchWeather() {
    const [searchResult, setSearchResult] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFromCache, setIsFromCache] = useState(false);

    // Restore last search from localStorage on mount
    useEffect(() => {
        const cachedRaw = localStorage.getItem(LS_SEARCH_DATA_KEY);
        if (cachedRaw) {
            try {
                const cached = JSON.parse(cachedRaw) as WeatherData;
                setSearchResult(cached);
                setIsFromCache(true);
            } catch {
                // ignore malformed cache
            }
        }
    }, []);

    const search = useCallback(async (city: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCityWeather(city);
            setSearchResult(data);
            setIsFromCache(false);
            localStorage.setItem(LS_SEARCH_DATA_KEY, JSON.stringify(data));
            localStorage.setItem(LS_SEARCH_KEY, city);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { searchResult, isLoading, error, isFromCache, search };
}
