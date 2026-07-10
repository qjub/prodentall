// Úvodná (landing) stránka projektu — dátovo riadená (landing.json / siteConfig).
// Modulárna: App ju zobrazí len ak je `landingEnabled`. Obsah = zoznam blokov
// (`cfg.blocks`) v poradí. V EDIT režime vpravo pribudne blokový editor + Export.

import LandingBlock from './LandingBlock.jsx';
import LandingEditor from './LandingEditor.jsx';
import './Landing.css';

export default function Landing({ cfg, edit = false, onOpenTour, onChange, onExport }) {
  const { brand, mainSiteUrl, background, theme, logoHeight, font, blocks, defaultTourSrc } = cfg;

  // pozadie celej stránky
  const pageStyle =
    background.type === 'image' && background.image
      ? { backgroundImage: `url(${background.image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
      : { background: background.color };

  // farby ako CSS premenné (prebijú predvolené z Landing.css)
  const themeVars = {
    '--navy': theme.headerBg,
    '--gold': theme.accent,
    '--card-bg': theme.cardBg,
    '--card-text': theme.cardText,
    '--ink': theme.textColor,
    '--logo-h': `${logoHeight}px`,
    '--font': font,
  };

  return (
    <div className={`landing ${edit ? 'is-edit' : ''}`} style={{ ...pageStyle, ...themeVars }}>
      {/* Hlavička: len logo na strede */}
      <header className="landing__header">
        <div className="landing__bar">
          {mainSiteUrl ? (
            <a href={mainSiteUrl} className="landing__logo" title={brand.name}>
              {brand.logo ? <img src={brand.logo} alt={brand.name} /> : <span className="landing__logo-txt">{brand.name}</span>}
            </a>
          ) : (
            <span className="landing__logo">
              {brand.logo ? <img src={brand.logo} alt={brand.name} /> : <span className="landing__logo-txt">{brand.name}</span>}
            </span>
          )}
        </div>
      </header>

      {/* Obsah — bloky v poradí */}
      <main className="landing__content">
        {blocks.length === 0 && edit && (
          <p className="landing__empty">Prázdna stránka — vpravo v editore pridaj prvý blok.</p>
        )}
        {blocks.map((block) => (
          <LandingBlock key={block.id} block={block} defaultTourSrc={defaultTourSrc} onOpenTour={onOpenTour} />
        ))}
      </main>

      {/* EDIT panel */}
      {edit && <LandingEditor cfg={cfg} onChange={onChange} onExport={onExport} />}
    </div>
  );
}
