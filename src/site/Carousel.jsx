// Carusel vizualizácií na úvodnej stránke. Prepínanie šípkami + bodkami,
// automatické posúvanie. Prepínač variantov obrázka (Základ / Noc …) je priamo
// v caruseli AJ vo fullscreen náhľade; zvolený variant sa pamätá naprieč
// obrázkami. Klik na obrázok otvorí fullscreen s možnosťou stiahnutia.

import { useCallback, useEffect, useState } from 'react';

// Zoznam verzií obrázka: základ + prípadné varianty. Base má label ''.
function versionsOf(slide) {
  if (!slide) return [];
  if (slide.variants?.length) {
    return [{ id: 'base', label: 'Základ', image: slide.image }, ...slide.variants];
  }
  return [{ id: 'base', label: '', image: slide.image }];
}

// Vyber verziu obrázka podľa zvoleného labelu (fallback = základ).
function pickVersion(slide, label) {
  const vs = versionsOf(slide);
  return vs.find((v) => v.label === label) || vs[0] || null;
}

export default function Carousel({ slides }) {
  const [i, setI] = useState(0);
  const [lightbox, setLightbox] = useState(null); // index otvoreného obrázka alebo null
  const [verLabel, setVerLabel] = useState(''); // zvolený variant (label), '' = Základ
  const n = slides.length;

  // auto-posúvanie (pozastavené, keď je otvorený lightbox)
  useEffect(() => {
    if (n <= 1 || lightbox !== null) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, lightbox]);

  const go = (d) => setI((p) => (p + d + n) % n);
  const goLb = useCallback((d) => setLightbox((p) => (p === null ? p : (p + d + n) % n)), [n]);

  // klávesnica v lightboxe: Esc zavrie, šípky prepínajú obrázky
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowLeft') goLb(-1);
      else if (e.key === 'ArrowRight') goLb(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, goLb]);

  // stiahnutie obrázka (fetch → blob, nech sa naozaj stiahne)
  const download = useCallback(async (src, label) => {
    if (!src) return;
    const base = src.split('/').pop().split('?')[0].split('#')[0];
    const stem = base.replace(/\.[^.]+$/, '') || 'vizualizacia';
    const ext = (base.match(/\.([^.]+)$/) || [, 'jpg'])[1];
    const name = label ? `${stem}_${label.replace(/[^\w-]+/g, '_')}` : stem;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank', 'noopener');
    }
  }, []);

  if (n === 0) return null;
  const idx = Math.min(i, n - 1);
  const slide = slides[idx];

  // prepínač pre práve zobrazený obrázok (v caruseli); rovnaký stav aj v lightboxe
  const stageVersions = versionsOf(slide);
  const stageActive = pickVersion(slide, verLabel);

  const lbSlide = lightbox !== null ? slides[lightbox] : null;
  const lbVersions = versionsOf(lbSlide);
  const lbActive = pickVersion(lbSlide, verLabel);

  // Prepínač variantov (spoločný komponent pre carusel aj lightbox)
  const Switcher = ({ versions, active, className, btnClass }) =>
    versions.length > 1 ? (
      <div className={className} onClick={(e) => e.stopPropagation()}>
        {versions.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`${btnClass} ${v.label === active?.label ? 'is-active' : ''}`}
            onClick={() => setVerLabel(v.label)}
          >
            {v.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="lc">
      <div className="lc__stage">
        {slides.map((s, k) => {
          const img = pickVersion(s, verLabel)?.image;
          return (
            <div
              key={s.id}
              className={`lc__slide ${k === idx ? 'is-active' : ''} ${img ? 'is-zoomable' : ''}`}
              style={img ? { backgroundImage: `url(${img})` } : undefined}
              onClick={img && k === idx ? () => setLightbox(k) : undefined}
              title={img ? 'Klikni pre zväčšenie' : undefined}
            >
              {!img && <span className="lc__ph">Vizualizácia</span>}
            </div>
          );
        })}

        {/* prepínač variantov priamo v caruseli */}
        <Switcher versions={stageVersions} active={stageActive} className="lc__variants" btnClass="lc__var" />

        {(slide.caption || slide.image) && (
          <div className="lc__overlay">
            {slide.caption && <p className="lc__caption">{slide.caption}</p>}
            {slide.image && (
              <button type="button" className="lc__zoom-hint" onClick={() => setLightbox(idx)} aria-label="Zväčšiť obrázok">
                ⤢ Zväčšiť
              </button>
            )}
          </div>
        )}

        {n > 1 && (
          <>
            <button type="button" className="lc__arrow lc__arrow--prev" onClick={() => go(-1)} aria-label="Predchádzajúci">‹</button>
            <button type="button" className="lc__arrow lc__arrow--next" onClick={() => go(1)} aria-label="Ďalší">›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="lc__dots">
          {slides.map((s, k) => (
            <button
              key={s.id}
              type="button"
              className={`lc__dot ${k === idx ? 'is-active' : ''}`}
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox — fullscreen náhľad + prepínač variantov + stiahnutie */}
      {lbSlide && (
        <div className="lb" onClick={() => setLightbox(null)}>
          <div className="lb__bar" onClick={(e) => e.stopPropagation()}>
            {lbSlide.caption && <span className="lb__title">{lbSlide.caption}</span>}

            {/* prepínač variantov (pred tlačidlom Stiahnuť) */}
            <Switcher versions={lbVersions} active={lbActive} className="lb__variants" btnClass="lb__var" />

            <div className="lb__actions">
              <button type="button" className="lb__btn" onClick={() => download(lbActive?.image, lbActive?.label)}>
                ⬇ Stiahnuť
              </button>
              <button type="button" className="lb__btn lb__btn--close" onClick={() => setLightbox(null)} aria-label="Zavrieť">✕</button>
            </div>
          </div>

          <img
            className="lb__img"
            src={lbActive?.image}
            alt={lbSlide.caption || 'Vizualizácia'}
            onClick={(e) => e.stopPropagation()}
          />

          {n > 1 && (
            <>
              <button type="button" className="lb__arrow lb__arrow--prev" onClick={(e) => { e.stopPropagation(); goLb(-1); }} aria-label="Predchádzajúci">‹</button>
              <button type="button" className="lb__arrow lb__arrow--next" onClick={(e) => { e.stopPropagation(); goLb(1); }} aria-label="Ďalší">›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
