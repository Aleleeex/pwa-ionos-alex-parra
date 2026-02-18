import type { WeatherData } from '../types/weather';
import { getWeatherInfo } from '../types/weather';
import { ForecastRow } from './ForecastRow';

interface WeatherCardProps {
    data: WeatherData;
    isFromCache: boolean;
}

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function WeatherCard({ data, isFromCache }: WeatherCardProps) {
    const { location, current, forecast, fetchedAt } = data;
    const { label, icon } = getWeatherInfo(current.weatherCode, current.isDay);

    return (
        <>
            <div className="glass-card weather-card">
                <div className="weather-card-header">
                    <div className="weather-location">
                        <h1 className="weather-city">{location.name}</h1>
                        <p className="weather-country">{location.country}</p>
                    </div>
                    <div className="weather-updated">
                        {isFromCache && (
                            <div className="cached-badge">Caché</div>
                        )}
                        <div>Actualizado {formatTime(fetchedAt)}</div>
                    </div>
                </div>

                <div className="weather-main">
                    <div
                        className="weather-icon-large"
                        role="img"
                        aria-label={label}
                    >
                        {icon}
                    </div>
                    <div className="weather-temp-block">
                        <div className="weather-temp">
                            {current.temperature}<sup>°C</sup>
                        </div>
                        <div className="weather-description">{label}</div>
                        <div className="weather-feels">
                            Sensación térmica: {current.feelsLike}°C
                        </div>
                    </div>
                </div>

                <div className="weather-stats">
                    <div className="stat-item">
                        <span className="stat-icon">💧</span>
                        <span className="stat-label">Humedad</span>
                        <span className="stat-value">{current.humidity}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">💨</span>
                        <span className="stat-label">Viento</span>
                        <span className="stat-value">{current.windSpeed} km/h</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">{current.isDay ? '🌅' : '🌃'}</span>
                        <span className="stat-label">Período</span>
                        <span className="stat-value">{current.isDay ? 'Día' : 'Noche'}</span>
                    </div>
                </div>
            </div>

            <div className="glass-card forecast-section">
                <h2 className="forecast-title">Próximos 3 días</h2>
                <div className="forecast-list">
                    {forecast.map((day) => (
                        <ForecastRow key={day.date} day={day} />
                    ))}
                </div>
            </div>
        </>
    );
}
