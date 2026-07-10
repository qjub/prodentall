// EDIT panel úvodnej stránky (vidíš len ty). Blokový editor: pridávaš, mažeš,
// presúvaš bloky (text, carusel, tlačidlo, karty bytov, sekcia variantov) a
// nastavuješ vzhľad (pozadie, farby, logo, font). Export vyrobí landing.json.

import { FONTS, newId } from './landingData.js';

// ── malé znovupoužiteľné časti (mimo komponentu → input nestráca fokus) ──────

function ColorRow({ label, value, onChange }) {
  return (
    <div className="ilumi-editor__colorrow">
      <span>{label}</span>
      <input type="color" className="ilumi-editor__color" value={value} onChange={(e) => onChange(e.target.value)} />
      <input className="ilumi-editor__hex" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Editor zoznamu obrázkov (carusel / variant). slides = [{id,image,caption,variants}]
function SlidesEditor({ slides, onChange }) {
  const update = (i, patch) => onChange(slides.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const remove = (i) => onChange(slides.filter((_, k) => k !== i));
  const add = () => onChange([...slides, { id: newId('slide'), image: '', caption: '', variants: [] }]);
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const next = slides.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  // varianty obrázka (prepínač v náhľade)
  const vars = (i) => slides[i].variants || [];
  const addVar = (i) => update(i, { variants: [...vars(i), { id: newId('sv'), label: `Variant ${vars(i).length + 1}`, image: '' }] });
  const updateVar = (i, vi, patch) => update(i, { variants: vars(i).map((v, k) => (k === vi ? { ...v, ...patch } : v)) });
  const removeVar = (i, vi) => update(i, { variants: vars(i).filter((_, k) => k !== vi) });

  return (
    <div className="ilumi-editor__slides">
      {slides.map((s, i) => (
        <div className="ilumi-editor__slide" key={s.id}>
          <div className="ilumi-editor__slide-head">
            <span>Obrázok {i + 1}</span>
            <span className="ilumi-editor__slide-btns">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Hore">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1} title="Dole">↓</button>
              <button type="button" className="ilumi-editor__del" onClick={() => remove(i)}>✕</button>
            </span>
          </div>
          <input placeholder="Obrázok (landing/vizual-1.jpg)" value={s.image} onChange={(e) => update(i, { image: e.target.value })} />
          <input placeholder="Popis (voliteľné)" value={s.caption} onChange={(e) => update(i, { caption: e.target.value })} />

          {/* varianty obrázka — prepínač vo fullscreen náhľade */}
          <div className="ilumi-editor__subvars">
            <span className="ilumi-editor__lbl">Varianty (prepínač v náhľade)</span>
            {vars(i).map((v, vi) => (
              <div className="ilumi-editor__row" key={v.id}>
                <input className="ilumi-editor__vlabel" placeholder="Názov (napr. Noc)" value={v.label} onChange={(e) => updateVar(i, vi, { label: e.target.value })} />
                <input placeholder="Obrázok (landing/predsien_noc.jpg)" value={v.image} onChange={(e) => updateVar(i, vi, { image: e.target.value })} />
                <button type="button" className="ilumi-editor__del" onClick={() => removeVar(i, vi)}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => addVar(i)}>+ Variant obrázka</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}>+ Pridať obrázok</button>
    </div>
  );
}

// Editor kariet bytov. items = [{id,title,meta,image,tourSrc}]
function CardsEditor({ items, onChange }) {
  const update = (i, patch) => onChange(items.map((a, k) => (k === i ? { ...a, ...patch } : a)));
  const remove = (i) => onChange(items.filter((_, k) => k !== i));
  const add = () => onChange([...items, { id: newId('byt'), title: 'Nový byt', meta: '', image: '', tourSrc: null }]);
  return (
    <div className="ilumi-editor__slides">
      {items.map((a, i) => (
        <div className="ilumi-editor__slide" key={a.id}>
          <div className="ilumi-editor__slide-head">
            <span>{a.title || `Byt ${i + 1}`}</span>
            <button type="button" className="ilumi-editor__del" onClick={() => remove(i)}>✕</button>
          </div>
          <input placeholder="Názov (Byt 1)" value={a.title} onChange={(e) => update(i, { title: e.target.value })} />
          <input placeholder="Popis (3-izbový · 78 m²)" value={a.meta} onChange={(e) => update(i, { meta: e.target.value })} />
          <input placeholder="Obrázok (landing/byt-1.jpg)" value={a.image} onChange={(e) => update(i, { image: e.target.value })} />
          <input placeholder="Prehliadka (tours/…/tour.json) – prázdne = Pripravujeme" value={a.tourSrc || ''} onChange={(e) => update(i, { tourSrc: e.target.value || null })} />
        </div>
      ))}
      <button type="button" onClick={add}>+ Pridať byt</button>
    </div>
  );
}

// Editor variantov. options = [{id,label,text,slides}]
function VariantsEditor({ options, onChange }) {
  const update = (i, patch) => onChange(options.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  const remove = (i) => onChange(options.filter((_, k) => k !== i));
  const add = () => onChange([...options, { id: newId('var'), label: `Variant ${options.length + 1}`, text: '', slides: [] }]);
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= options.length) return;
    const next = options.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="ilumi-editor__variants-ed">
      {options.map((o, i) => (
        <div className="ilumi-editor__variant" key={o.id}>
          <div className="ilumi-editor__slide-head">
            <span>{o.label || `Variant ${i + 1}`}</span>
            <span className="ilumi-editor__slide-btns">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Vľavo">←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === options.length - 1} title="Vpravo">→</button>
              <button type="button" className="ilumi-editor__del" onClick={() => remove(i)}>✕</button>
            </span>
          </div>
          <label className="ilumi-editor__lbl">Názov variantu (na prepínači)</label>
          <input placeholder="Moderný" value={o.label} onChange={(e) => update(i, { label: e.target.value })} />
          <label className="ilumi-editor__lbl">Popis variantu</label>
          <textarea
            className="ilumi-editor__textarea"
            rows={3}
            placeholder="Popíš tento variant interiéru…"
            value={o.text}
            onChange={(e) => update(i, { text: e.target.value })}
          />
          <label className="ilumi-editor__lbl">Vizualizácie variantu</label>
          <SlidesEditor slides={o.slides} onChange={(slides) => update(i, { slides })} />
        </div>
      ))}
      <button type="button" onClick={add}>+ Pridať variant</button>
    </div>
  );
}

// Editor jedného bloku podľa typu
function BlockEditor({ block, onUpdate }) {
  switch (block.type) {
    case 'text':
      return (
        <>
          <label className="ilumi-editor__lbl">Typ textu</label>
          <select value={block.style} onChange={(e) => onUpdate({ style: e.target.value })}>
            <option value="heading">Veľký nadpis</option>
            <option value="subheading">Menší nadpis</option>
            <option value="paragraph">Bežný odsek</option>
          </select>
          <label className="ilumi-editor__lbl">Zarovnanie</label>
          <select value={block.align} onChange={(e) => onUpdate({ align: e.target.value })}>
            <option value="center">Na stred</option>
            <option value="left">Vľavo</option>
            <option value="right">Vpravo</option>
          </select>
          <ColorRow label="Farba textu" value={block.color || '#1d2733'} onChange={(v) => onUpdate({ color: v })} />
          <textarea
            className="ilumi-editor__textarea"
            rows={3}
            placeholder="Text…"
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
          />
        </>
      );
    case 'carousel':
      return <SlidesEditor slides={block.slides} onChange={(slides) => onUpdate({ slides })} />;
    case 'button':
      return (
        <>
          <label className="ilumi-editor__lbl">Text na tlačidle</label>
          <input placeholder="360° Prehliadka" value={block.label} onChange={(e) => onUpdate({ label: e.target.value })} />
          <label className="ilumi-editor__lbl">Obrázok tlačidla (voliteľné)</label>
          <input placeholder="landing/cta.jpg" value={block.image} onChange={(e) => onUpdate({ image: e.target.value })} />
          <label className="ilumi-editor__lbl">Prehliadka po kliknutí</label>
          <input placeholder="tours/demo/tour.json" value={block.tourSrc} onChange={(e) => onUpdate({ tourSrc: e.target.value })} />
        </>
      );
    case 'cards':
      return (
        <>
          <label className="ilumi-editor__lbl">Nadpis sekcie (voliteľné)</label>
          <input placeholder="Prehliadka bytov" value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} />
          <ColorRow label="Farba nadpisu" value={block.titleColor || '#1d2733'} onChange={(v) => onUpdate({ titleColor: v })} />
          <CardsEditor items={block.items} onChange={(items) => onUpdate({ items })} />
        </>
      );
    case 'variants':
      return <VariantsEditor options={block.options} onChange={(options) => onUpdate({ options })} />;
    default:
      return null;
  }
}

const BLOCK_LABELS = {
  text: 'Text',
  carousel: 'Carusel',
  button: 'Tlačidlo (prehliadka)',
  cards: 'Karty bytov',
  variants: 'Sekcia variantov',
};

// nový prázdny blok daného typu
function makeBlock(type) {
  const id = newId('blk');
  switch (type) {
    case 'text':
      return { id, type, text: 'Nový text', style: 'heading', align: 'center', color: '#1d2733' };
    case 'carousel':
      return { id, type, slides: [] };
    case 'button':
      return { id, type, label: '360° Prehliadka', image: '', tourSrc: '' };
    case 'cards':
      return { id, type, title: 'Prehliadka bytov', titleColor: '#1d2733', items: [] };
    case 'variants':
      return { id, type, options: [{ id: newId('var'), label: 'Variant 1', text: '', slides: [] }] };
    default:
      return null;
  }
}

// ── hlavný komponent ─────────────────────────────────────────────────────────

export default function LandingEditor({ cfg, onChange, onExport }) {
  const set = (patch) => onChange({ ...cfg, ...patch });
  const setBrand = (patch) => onChange({ ...cfg, brand: { ...cfg.brand, ...patch } });
  const setBg = (patch) => onChange({ ...cfg, background: { ...cfg.background, ...patch } });
  const setTheme = (patch) => onChange({ ...cfg, theme: { ...cfg.theme, ...patch } });

  // operácie nad blokmi
  const blocks = cfg.blocks;
  const updateBlock = (id, patch) =>
    set({ blocks: blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  const removeBlock = (id) => set({ blocks: blocks.filter((b) => b.id !== id) });
  const moveBlock = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set({ blocks: next });
  };
  const addBlock = (type) => {
    const b = makeBlock(type);
    if (b) set({ blocks: [...blocks, b] });
  };

  return (
    <div className="ilumi-editor ilumi-editor--landing">
      <div className="ilumi-editor__title">EDIT · úvodná stránka</div>

      {/* Bloky stránky */}
      <section className="ilumi-editor__sec">
        <h4>Bloky stránky</h4>
        {blocks.length === 0 && <p className="ilumi-editor__note">Zatiaľ žiadne bloky — pridaj nižšie.</p>}
        {blocks.map((b, i) => (
          <div className="ilumi-editor__block" key={b.id}>
            <div className="ilumi-editor__block-head">
              <span className="ilumi-editor__block-type">{BLOCK_LABELS[b.type] || b.type}</span>
              <span className="ilumi-editor__slide-btns">
                <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} title="Vyššie">↑</button>
                <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} title="Nižšie">↓</button>
                <button type="button" className="ilumi-editor__del" onClick={() => removeBlock(b.id)}>✕</button>
              </span>
            </div>
            <BlockEditor block={b} onUpdate={(patch) => updateBlock(b.id, patch)} />
          </div>
        ))}

        <div className="ilumi-editor__add">
          <span className="ilumi-editor__lbl">+ Pridať blok:</span>
          <div className="ilumi-editor__add-btns">
            {Object.keys(BLOCK_LABELS).map((t) => (
              <button type="button" key={t} onClick={() => addBlock(t)}>{BLOCK_LABELS[t]}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Vzhľad */}
      <section className="ilumi-editor__sec">
        <h4>Vzhľad · logo &amp; texty</h4>
        <label className="ilumi-editor__lbl">Názov projektu</label>
        <input value={cfg.brand.name} onChange={(e) => setBrand({ name: e.target.value })} />
        <label className="ilumi-editor__lbl">Logo (cesta v public/)</label>
        <input placeholder="landing/logo.svg" value={cfg.brand.logo} onChange={(e) => setBrand({ logo: e.target.value })} />
        <label className="ilumi-editor__lbl">Odkaz z loga (voliteľné)</label>
        <input placeholder="https://hodzova.sk/" value={cfg.mainSiteUrl} onChange={(e) => set({ mainSiteUrl: e.target.value })} />
        <div className="ilumi-editor__logosize">
          <label className="ilumi-editor__lbl">Veľkosť loga: {cfg.logoHeight}px</label>
          <input type="range" min="24" max="140" value={cfg.logoHeight} onChange={(e) => set({ logoHeight: Number(e.target.value) })} />
        </div>
        <label className="ilumi-editor__lbl">Font nadpisov a textov</label>
        <select value={cfg.font} onChange={(e) => set({ font: e.target.value })}>
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </section>

      {/* Pozadie */}
      <section className="ilumi-editor__sec">
        <h4>Pozadie</h4>
        <div className="ilumi-editor__row">
          <label className="ilumi-editor__radio">
            <input type="radio" checked={cfg.background.type === 'color'} onChange={() => setBg({ type: 'color' })} /> Farba
          </label>
          <label className="ilumi-editor__radio">
            <input type="radio" checked={cfg.background.type === 'image'} onChange={() => setBg({ type: 'image' })} /> Obrázok
          </label>
        </div>
        {cfg.background.type === 'color' ? (
          <div className="ilumi-editor__row">
            <input type="color" className="ilumi-editor__color" value={cfg.background.color} onChange={(e) => setBg({ color: e.target.value })} />
            <input value={cfg.background.color} onChange={(e) => setBg({ color: e.target.value })} />
          </div>
        ) : (
          <input placeholder="landing/pozadie.jpg" value={cfg.background.image} onChange={(e) => setBg({ image: e.target.value })} />
        )}
      </section>

      {/* Farby */}
      <section className="ilumi-editor__sec">
        <h4>Farby</h4>
        <ColorRow label="Hlavička" value={cfg.theme.headerBg} onChange={(v) => setTheme({ headerBg: v })} />
        <ColorRow label="Akcent / tlačidlá" value={cfg.theme.accent} onChange={(v) => setTheme({ accent: v })} />
        <ColorRow label="Karta – pozadie" value={cfg.theme.cardBg} onChange={(v) => setTheme({ cardBg: v })} />
        <ColorRow label="Karta – text" value={cfg.theme.cardText} onChange={(v) => setTheme({ cardText: v })} />
        <ColorRow label="Text stránky" value={cfg.theme.textColor} onChange={(v) => setTheme({ textColor: v })} />
      </section>

      {/* Export */}
      <section className="ilumi-editor__sec">
        <h4>Export</h4>
        <button type="button" className="ilumi-editor__export" onClick={onExport}>⬇ Stiahnuť landing.json</button>
        <p className="ilumi-editor__note">
          Súbor ulož do priečinka <code>public/</code> (vedľa index.html) a urob <code>git push</code>.
          Obrázky patria do <code>public/landing/</code>.
        </p>
      </section>
    </div>
  );
}
