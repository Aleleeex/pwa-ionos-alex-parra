import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { WeatherCard } from './components/WeatherCard';
import { CityCard } from './components/CityCard';
import { useFamousCities, useSearchWeather } from './hooks/useWeather';

function App() {
    const { cities, cityNames } = useFamousCities();
    const { searchResult, isLoading, error, isFromCache, search } = useSearchWeather();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <>
            <div className="app-bg" aria-hidden="true" />
            <main className="app-container">

                {/* Header */}
                <header className="app-header">
                    <div>
                        <p className="app-title">Weather<span>PWA</span></p>
                        <p className="app-subtitle">Clima en tiempo real con soporte offline</p>
                    </div>
                </header>

                {/* Offline banner */}
                {!isOnline && (
                    <div className="offline-banner" role="alert">
                        <span>Sin conexión</span>
                        <span>Mostrando datos almacenados localmente</span>
                    </div>
                )}

                {/* Search */}
                <SearchBar onSearch={search} isLoading={isLoading} />

                {/* Search result */}
                {(isLoading || error || searchResult) && (
                    <section className="search-result-section">
                        <h2 className="section-title">Resultado de búsqueda</h2>

                        {isLoading && (
                            <div className="glass-card">
                                <div className="state-container">
                                    <div className="spinner" role="status" aria-label="Cargando" />
                                    <p className="state-title">Obteniendo datos del clima...</p>
                                </div>
                            </div>
                        )}

                        {!isLoading && error && (
                            <div className="glass-card error-card">
                                <div className="state-container">
                                    <span className="state-icon">⚠️</span>
                                    <p className="state-title">No se pudo obtener el clima</p>
                                    <p className="state-subtitle">{error}</p>
                                </div>
                            </div>
                        )}

                        {!isLoading && !error && searchResult && (
                            <WeatherCard data={searchResult} isFromCache={isFromCache} />
                        )}
                    </section>
                )}

                {/* Famous cities grid */}
                <section>
                    <h2 className="section-title">Ciudades destacadas</h2>
                    <div className="cities-grid">
                        {cityNames.map(cityName => {
                            const state = cities[cityName];
                            return (
                                <CityCard
                                    key={cityName}
                                    cityName={cityName}
                                    data={state.data}
                                    loading={state.loading}
                                    error={state.error}
                                />
                            );
                        })}
                    </div>
                </section>

            </main>
        </>
    );
}

export default App;
