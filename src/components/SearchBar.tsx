import { useState, type KeyboardEvent } from 'react';

interface SearchBarProps {
    onSearch: (city: string) => void;
    isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
    const [value, setValue] = useState('');

    const handleSearch = () => {
        const trimmed = value.trim();
        if (trimmed) {
            onSearch(trimmed);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="search-wrapper">
            <input
                id="city-search-input"
                className="search-input"
                type="text"
                placeholder="Buscar ciudad... (ej: Madrid, Lima, Bogotá)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoComplete="off"
                aria-label="Buscar ciudad"
            />
            <button
                id="city-search-btn"
                className="search-btn"
                onClick={handleSearch}
                disabled={isLoading || !value.trim()}
                aria-label="Buscar"
            >
                {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
        </div>
    );
}
