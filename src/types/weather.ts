// Weather condition codes from Open-Meteo WMO standard
export interface GeoLocation {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
}

export interface CurrentWeather {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
}

export interface ForecastDay {
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
}

export interface WeatherData {
    location: GeoLocation;
    current: CurrentWeather;
    forecast: ForecastDay[];
    fetchedAt: number;
}

export const WMO_CODES: Record<number, { label: string; icon: string; nightIcon?: string }> = {
    0: { label: 'Despejado', icon: '☀️', nightIcon: '🌙' },
    1: { label: 'Mayormente despejado', icon: '🌤️', nightIcon: '🌤️' },
    2: { label: 'Parcialmente nublado', icon: '⛅', nightIcon: '⛅' },
    3: { label: 'Nublado', icon: '☁️', nightIcon: '☁️' },
    45: { label: 'Niebla', icon: '🌫️' },
    48: { label: 'Niebla con escarcha', icon: '🌫️' },
    51: { label: 'Llovizna ligera', icon: '🌦️' },
    53: { label: 'Llovizna moderada', icon: '🌦️' },
    55: { label: 'Llovizna intensa', icon: '🌧️' },
    61: { label: 'Lluvia ligera', icon: '🌧️' },
    63: { label: 'Lluvia moderada', icon: '🌧️' },
    65: { label: 'Lluvia intensa', icon: '🌧️' },
    71: { label: 'Nieve ligera', icon: '🌨️' },
    73: { label: 'Nieve moderada', icon: '❄️' },
    75: { label: 'Nieve intensa', icon: '❄️' },
    77: { label: 'Granizo', icon: '🌨️' },
    80: { label: 'Chubascos ligeros', icon: '🌦️' },
    81: { label: 'Chubascos moderados', icon: '🌧️' },
    82: { label: 'Chubascos intensos', icon: '⛈️' },
    85: { label: 'Chubascos de nieve', icon: '🌨️' },
    86: { label: 'Chubascos de nieve', icon: '❄️' },
    95: { label: 'Tormenta', icon: '⛈️' },
    96: { label: 'Tormenta con granizo', icon: '⛈️' },
    99: { label: 'Tormenta severa', icon: '🌩️' },
};

export function getWeatherInfo(code: number, isDay = true) {
    const info = WMO_CODES[code] ?? { label: 'Desconocido', icon: '🌡️' };
    return {
        label: info.label,
        icon: (!isDay && info.nightIcon) ? info.nightIcon : info.icon,
    };
}
