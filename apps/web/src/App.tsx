import { useDeferredValue, useMemo, useState } from 'react';
import { searchLogos, logos } from '@easy-logo/logos';
import { LogoCard, type Variant } from './LogoCard';
import { GitHubIcon } from './icons';

const REPO_URL = 'https://github.com/mateusvillain/easy-logo';

export function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const cards = useMemo(
    () =>
      searchLogos(deferredQuery).flatMap((logo) => {
        const variants: Variant[] = logo.wordmarkSvg ? ['symbol', 'wordmark'] : ['symbol'];
        return variants.map((variant) => ({ logo, variant }));
      }),
    [deferredQuery],
  );

  return (
    <div className="app">
      <a
        className="repo-link"
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Easy Logo repository on GitHub"
      >
        <GitHubIcon />
        GitHub
      </a>

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
        {cards.length === 0 ? (
          <p className="empty">
            No logos found for “{deferredQuery}”. Try another brand name.
          </p>
        ) : (
          <ul className="grid">
            {cards.map(({ logo, variant }) => (
              <LogoCard key={`${logo.slug}-${variant}`} logo={logo} variant={variant} />
            ))}
          </ul>
        )}
      </main>

      <footer className="footer">
        <p>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            Open source
          </a>{' '}
          under CC0. All trademarks belong to their respective owners.
        </p>
      </footer>
    </div>
  );
}
