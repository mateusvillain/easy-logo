import { useEffect, useRef, useState } from 'react';
import type { Logo } from '@easy-logo/logos';
import { CheckIcon, CopyIcon, DownloadIcon } from './icons';
import { fetchSvgText, svgUrl, type Variant } from './svgAssets';

export type { Variant };

export function LogoCard({ logo, variant }: { logo: Logo; variant: Variant }) {
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(copyTimeout.current), []);

  const url = svgUrl(logo.slug, variant);
  if (!url) return null;

  async function handleCopy() {
    if (!url) return;
    const text = fetchSvgText(url);
    try {
      // ClipboardItem accepts a promise, keeping the write inside the user
      // gesture — required by Safari, where an awaited fetch first would fail.
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': text.then((svg) => new Blob([svg], { type: 'text/plain' })),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(await text);
    }
    setCopied(true);
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = variant === 'wordmark' ? `${logo.slug}-wordmark.svg` : `${logo.slug}.svg`;
    anchor.click();
  }

  return (
    <li className="card">
      <div className={`card-preview ${variant === 'wordmark' ? 'card-preview-wordmark' : ''}`}>
        <img src={url} alt={`${logo.title} logo`} loading="lazy" />
      </div>
      <span className="card-title" title={logo.title}>
        {logo.title}
        {variant === 'wordmark' && <span className="card-variant">Logo</span>}
      </span>
      <div className="card-actions">
        <button
          type="button"
          className="button"
          onClick={handleCopy}
          aria-label={`Copy ${logo.title} SVG code`}
          title="Copy SVG code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={handleDownload}
          aria-label={`Download ${logo.title} SVG file`}
          title="Download SVG file"
        >
          <DownloadIcon />
        </button>
      </div>
    </li>
  );
}
