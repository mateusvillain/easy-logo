import { useDeferredValue, useMemo, useState } from 'react';
import { searchLogos, logos } from '@easy-logo/logos';
import { LogoCard } from './LogoCard';

export function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchLogos(deferredQuery), [deferredQuery]);

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">
          Easy Logo
        </h1>
        <p className="header-subtitle">
          Search {logos.length} brand logos. Download the SVG or copy the code.
        </p>
      </header>

      <div className="search-bar">
        <input
          type="search"
          className="search"
          placeholder="Search brands… e.g. GitHub, Nike, Spotify"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
          aria-label="Search brand logos"
        />
      </div>

      <main>
        {results.length === 0 ? (
          <p className="empty">
            No logos found for “{deferredQuery}”. Try another brand name.
          </p>
        ) : (
          <ul className="grid">
            {results.map((logo) => (
              <LogoCard key={logo.slug} logo={logo} />
            ))}
          </ul>
        )}
      </main>

      <footer className="footer">
        <p>
          Logos from{' '}
          <a href="https://simpleicons.org" target="_blank" rel="noreferrer">
            Simple Icons
          </a>{' '}
          (CC0). All trademarks belong to their respective owners.
        </p>
      </footer>
    </div>
  );
}
