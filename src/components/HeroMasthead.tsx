import { useEffect, useState } from 'react';

interface Props {
  trackCount: number;
  totalMinutes: number;
}

export default function HeroMasthead({ trackCount, totalMinutes }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const isWide = window.innerWidth >= 768;
    const src = isWide ? '/hero/sunrise-2400.jpg' : '/hero/sunrise-1200.jpg';

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src = src;
  }, []);

  return (
    <header className="hero-masthead">
      {/* Hero photograph — full-bleed, dimmed */}
      <div
        className={`hero-photo${imageLoaded ? ' hero-photo--loaded' : ''}`}
        aria-hidden
      >
        <picture>
          <source
            media="(min-width: 768px)"
            srcSet="/hero/sunrise-2400.jpg"
          />
          <img
            src="/hero/sunrise-1200.jpg"
            alt=""
            loading="eager"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
          />
        </picture>
      </div>

      {/* Gradient overlay for text legibility */}
      <div className="hero-overlay" aria-hidden />

      {/* Composed masthead — wordmark + tagline + meta */}
      <div className="hero-masthead-content">
        <div className="hero-flourish-top" aria-hidden>
          <span className="hero-flourish-line"></span>
          <span className="hero-flourish-diamond">◇</span>
          <span className="hero-flourish-line"></span>
        </div>

        <img
          src="/brand/wordmark.png"
          alt="PurposeJoy"
          className="hero-wordmark"
        />

        <p className="hero-artist">Mike Eatmon</p>
        <p className="hero-tagline">Live with purpose and joy.</p>

        <div className="hero-flourish-bottom" aria-hidden>
          <span className="hero-flourish-star">✦</span>
          <span className="hero-meta-text">
            {trackCount} Originals · {totalMinutes} Minutes
          </span>
          <span className="hero-flourish-star">✦</span>
        </div>
      </div>
    </header>
  );
}
