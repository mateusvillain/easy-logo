import { useEffect, useRef, useState } from 'react';
import type { Logo } from '@easy-logo/logos';
import { CheckIcon, CopyIcon, DownloadIcon } from './icons';

export type Variant = 'symbol' | 'wordmark';

export function LogoCard({ logo, variant }: { logo: Logo; variant: Variant }) {
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(copyTimeout.current), []);

  const svg = variant === 'wordmark' && logo.wordmarkSvg ? logo.wordmarkSvg : logo.svg;

  async function handleCopy() {
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = variant === 'wordmark' ? `${logo.slug}-wordmark.svg` : `${logo.slug}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <li className="card">
      <div
        className={`card-preview ${variant === 'wordmark' ? 'card-preview-wordmark' : ''}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
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
