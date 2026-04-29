import { useEffect, useState } from 'react';

interface Props {
  trackCount: number;
  totalMinutes: number;
  artistName?: string;
  tagline?: string;
}

const LQIP = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAARACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDPjssnIqylkfSoIr9Uq3FqSZFcE5TO2MIliPTcpk0yawAWrH9oDZwari3uVPNYc0mXGJk3FoVNFOuLvdxRXVFysZOEbmd3qaPqKKK0lsZw3NBf9WKbJ9yiiuXqdSM6X71FFFdS2OZ7n//Z';

export default function HeroMasthead({
  trackCount,
  totalMinutes,
  artistName = 'Mike Eatmon',
  tagline = 'Live with purpose and joy.',
}: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const isWide = window.innerWidth >= 1024;
    const src = isWide
      ? '/hero/hero-2400.jpg'
      : window.innerWidth >= 600
      ? '/hero/hero-1600.jpg'
      : '/hero/hero-900.jpg';

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = src;
  }, []);

  return (
    <header className="hero-masthead">
      {/* LQIP base layer — paints instantly before high-res loads */}
      <div
        className="hero-lqip"
        style={{ backgroundImage: `url(${LQIP})` }}
        aria-hidden
      />

      {/* Responsive hero photograph — YouTube channel banner */}
      <picture className={`hero-photo${imageLoaded ? ' hero-photo--loaded' : ''}`}>
        <source media="(min-width: 1024px)" srcSet="/hero/hero-2400.jpg" />
        <source media="(min-width: 600px)" srcSet="/hero/hero-1600.jpg" />
        <img
          src="/hero/hero-900.jpg"
          alt=""
          loading="eager"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
        />
      </picture>

      {/* Multi-layer gradient overlay */}
      <div className="hero-overlay" aria-hidden />
      {/* Soft radial vignette */}
      <div className="hero-vignette" aria-hidden />

      {/* Composed masthead lockup */}
      <div className="hero-content">
        <div className="hero-flourish hero-flourish--top" aria-hidden>
          <span className="hero-flourish-line" />
          <span className="hero-flourish-mark">◇</span>
          <span className="hero-flourish-line" />
        </div>

        <img
          src="/brand/wordmark.png"
          alt="PurposeJoy"
          className="hero-wordmark"
        />

        <div className="hero-artist-row">
          <span className="hero-artist-divider" aria-hidden />
          <span className="hero-artist-name">{artistName}</span>
          <span className="hero-artist-divider" aria-hidden />
        </div>

        <p className="hero-tagline">{tagline}</p>

        <div className="hero-meta-row">
          <span className="hero-meta-stat">
            <span className="hero-meta-num">{trackCount}</span>
            <span className="hero-meta-label">Originals</span>
          </span>
          <span className="hero-meta-divider" aria-hidden>·</span>
          <span className="hero-meta-stat">
            <span className="hero-meta-num">{totalMinutes}</span>
            <span className="hero-meta-label">Minutes</span>
          </span>
        </div>

        <div className="hero-flourish hero-flourish--bottom" aria-hidden>
          <span className="hero-flourish-star">✦</span>
        </div>
      </div>

      {/* Scroll affordance */}
      <div className="hero-scroll-cue" aria-hidden>
        <span className="hero-scroll-cue-line" />
      </div>
    </header>
  );
}
