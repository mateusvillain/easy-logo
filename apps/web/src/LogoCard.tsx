import { useEffect, useRef, useState } from 'react';
import type { Logo } from '@easy-logo/logos';

export function LogoCard({ logo }: { logo: Logo }) {
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(copyTimeout.current), []);

  async function handleCopy() {
    await navigator.clipboard.writeText(logo.svg);
    setCopied(true);
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([logo.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${logo.slug}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <li className="card">
      <div
        className="card-preview"
        style={{ color: `#${logo.hex}` }}
        dangerouslySetInnerHTML={{ __html: logo.svg }}
      />
      <span className="card-title" title={logo.title}>
        {logo.title}
      </span>
      <div className="card-actions">
        <button
          type="button"
          className="button"
          onClick={handleCopy}
          aria-label={`Copy ${logo.title} SVG code`}
        >
          {copied ? 'Copied!' : 'Copy SVG'}
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={handleDownload}
          aria-label={`Download ${logo.title} SVG file`}
        >
          Download
        </button>
      </div>
    </li>
  );
}
