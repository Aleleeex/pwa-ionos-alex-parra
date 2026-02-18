import type { WeatherData } from '../types/weather';
import { getWeatherInfo } from '../types/weather';

interface Props {
    cityName?: string;
    data?: WeatherData | null;
    loading?: boolean;
    error?: string | null;
}

export function CityCard({ cityName, data, loading, error }: Props) {
    if (loading) {
        return (
            <div className="glass-card city-card city-card--loading">
                <div className="city-card-name">{cityName}</div>
                <div className="city-card-spinner">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="glass-card city-card city-card--error">
                <div className="city-card-name">{cityName}</div>
                <div className="city-card-error-msg">Sin datos</div>
            </div>
        );
    }

    const { location, current } = data;
    const { label, icon } = getWeatherInfo(current.weatherCode, current.isDay);

    return (
        <div className="glass-card city-card">
            <div className="city-card-header">
                <div>
                    <div className="city-card-name">{location.name}</div>
                    <div className="city-card-country">{location.country}</div>
                </div>
                <span className="city-card-icon" role="img" aria-label={label}>{icon}</span>
            </div>

            <div className="city-card-temp">
                {current.temperature}<span className="city-card-unit">°C</span>
            </div>

            <div className="city-card-desc">{label}</div>

            <div className="city-card-stats">
                <span title="Humedad">💧 {current.humidity}%</span>
                <span title="Viento">💨 {current.windSpeed} km/h</span>
            </div>
        </div>
    );
}
