import type { ForecastDay } from '../types/weather';
import { getWeatherInfo } from '../types/weather';

interface ForecastRowProps {
    day: ForecastDay;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ForecastRow({ day }: ForecastRowProps) {
    const date = new Date(day.date + 'T12:00:00');
    const dayName = DAY_NAMES[date.getDay()];
    const { label, icon } = getWeatherInfo(day.weatherCode, true);

    return (
        <div className="forecast-row">
            <span className="forecast-day">{dayName}</span>
            <span className="forecast-icon" role="img" aria-label={label}>{icon}</span>
            <span className="forecast-desc">{label}</span>
            <div className="forecast-temps">
                <span className="forecast-max">{day.maxTemp}°</span>
                <span className="forecast-min">{day.minTemp}°</span>
            </div>
        </div>
    );
}
