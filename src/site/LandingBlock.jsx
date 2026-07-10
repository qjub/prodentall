// Render jedného bloku úvodnej stránky (VIEW). Typy:
//   text     — nadpis / podnadpis / odsek
//   carousel — carusel vizualizácií (lightbox + stiahnutie)
//   button   — banner tlačidlo na spustenie prehliadky
//   cards    — karty bytov
//   variants — sekcia variantov: prepínač + obrázky + popis vybraného variantu

import { useState } from 'react';
import Carousel from './Carousel.jsx';

export default function LandingBlock({ block, defaultTourSrc, onOpenTour }) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'carousel':
      return block.slides.length ? (
        <section className="lblk lblk--carousel">
          <Carousel slides={block.slides} />
        </section>
      ) : null;
    case 'button':
      return <ButtonBlock block={block} defaultTourSrc={defaultTourSrc} onOpenTour={onOpenTour} />;
    case 'cards':
      return <CardsBlock block={block} onOpenTour={onOpenTour} />;
    case 'variants':
      return <VariantsBlock block={block} />;
    default:
      return null;
  }
}

function TextBlock({ block }) {
  if (!block.text) return null;
  const Tag = block.style === 'heading' ? 'h2' : block.style === 'subheading' ? 'h3' : 'p';
  return (
    <section className="lblk lblk--text">
      <Tag
        className={`lblk-text lblk-text--${block.style}`}
        style={{ textAlign: block.align, ...(block.color ? { color: block.color } : {}) }}
      >
        {block.text}
      </Tag>
    </section>
  );
}

function ButtonBlock({ block, defaultTourSrc, onOpenTour }) {
  if (!block.label) return null;
  const tour = block.tourSrc || defaultTourSrc;
  return (
    <section className="lblk lblk--button">
      <div className="landing__hero-cta-wrap">
        <button
          type="button"
          className={`landing__hero-cta ${block.image ? 'has-img' : ''}`}
          style={block.image ? { backgroundImage: `url(${block.image})` } : undefined}
          onClick={() => onOpenTour(tour)}
        >
          <span>{block.label}</span>
        </button>
      </div>
    </section>
  );
}

function CardsBlock({ block, onOpenTour }) {
  const bg = (img) => (img ? { backgroundImage: `url(${img})` } : undefined);
  return (
    <section className="lblk lblk--cards landing__byty">
      {block.title && (
        <h2 className="landing__byty-title" style={block.titleColor ? { color: block.titleColor } : undefined}>
          {block.title}
        </h2>
      )}
      <div className="landing__cards">
        {block.items.map((a) => {
          const clickable = Boolean(a.tourSrc);
          return (
            <article
              key={a.id}
              className={`apt-card ${clickable ? 'is-clickable' : 'is-soon'}`}
              onClick={clickable ? () => onOpenTour(a.tourSrc) : undefined}
            >
              <div className="apt-card__img" style={bg(a.image)}>
                {!a.image && <span className="apt-card__img-ph">{a.title}</span>}
              </div>
              <div className="apt-card__body">
                <h3 className="apt-card__title">{a.title}</h3>
                {a.meta && <p className="apt-card__meta">{a.meta}</p>}
                {clickable ? (
                  <span className="apt-card__action">Spustiť prehliadku →</span>
                ) : (
                  <span className="apt-card__soon">Pripravujeme</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function VariantsBlock({ block }) {
  const [active, setActive] = useState(0);
  const options = block.options || [];
  if (options.length === 0) return null;
  const idx = Math.min(active, options.length - 1);
  const opt = options[idx];
  return (
    <section className="lblk lblk--variants">
      {options.length > 1 && (
        <div className="lvar__switch">
          {options.map((o, k) => (
            <button
              key={o.id}
              type="button"
              className={`lvar__btn ${k === idx ? 'is-active' : ''}`}
              onClick={() => setActive(k)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {opt.slides.length > 0 && <Carousel key={opt.id} slides={opt.slides} />}
      {opt.text && <p className="lvar__desc">{opt.text}</p>}
    </section>
  );
}
