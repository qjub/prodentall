// Načítanie, normalizácia a export konfigurácie úvodnej stránky (landing).
//
// Landing je BLOKOVÝ: `blocks` je zoradený zoznam blokov (text, carusel,
// tlačidlo, karty bytov, sekcia variantov). Poradie = poradie na stránke.
// Zdroj pravdy pri nasadení = `public/landing.json`; ak chýba, použije sa
// `siteConfig.js`. V EDIT režime sa landing.json vyrobí tlačidlom Export.
//
// Spätná kompatibilita: staré landing.json (hero/carousel/apartments bez
// `blocks`) sa automaticky prevedie na bloky — nič sa nestratí.

import { siteConfig } from './siteConfig.js';

let _id = 0;
/** Krátke jedinečné id pre nový blok / položku (stabilné v rámci behu). */
export function newId(prefix = 'b') {
  _id += 1;
  return `${prefix}-${Date.now().toString(36)}-${_id}`;
}

/** Načíta landing.json; ak nie je, vráti predvolené hodnoty zo siteConfig. */
export async function loadLanding(src = 'landing.json') {
  try {
    const res = await fetch(src, { cache: 'no-cache' });
    if (res.ok) return normalizeLanding(await res.json());
  } catch {
    /* ignoruj — použijú sa predvolené hodnoty */
  }
  return normalizeLanding(siteConfig);
}

// ── normalizácia jednotlivých typov ────────────────────────────────────────

function normSlide(s = {}) {
  return {
    id: s.id || newId('slide'),
    image: s.image || '',
    caption: s.caption || '',
    // varianty obrázka — prepínateľné vo fullscreen náhľade (napr. Deň/Noc)
    variants: (s.variants || []).map((v, k) => ({
      id: v.id || newId('sv'),
      label: v.label || `Variant ${k + 1}`,
      image: v.image || '',
    })),
  };
}

function normCard(a = {}, i = 0) {
  return {
    id: a.id || newId('byt'),
    title: a.title || `Byt ${i + 1}`,
    meta: a.meta || '',
    image: a.image || '',
    tourSrc: a.tourSrc || null,
  };
}

function normBlock(b = {}, i = 0) {
  const id = b.id || newId('blk');
  switch (b.type) {
    case 'text':
      return {
        id,
        type: 'text',
        text: b.text || '',
        style: ['heading', 'subheading', 'paragraph'].includes(b.style) ? b.style : 'paragraph',
        align: ['left', 'center', 'right'].includes(b.align) ? b.align : 'center',
        color: b.color || '', // '' = prevezme farbu témy (textColor)
      };
    case 'carousel':
      return { id, type: 'carousel', slides: (b.slides || []).map(normSlide) };
    case 'button':
      return {
        id,
        type: 'button',
        label: b.label || '',
        image: b.image || '',
        tourSrc: b.tourSrc || '',
      };
    case 'cards':
      return {
        id,
        type: 'cards',
        title: b.title || '',
        titleColor: b.titleColor || '', // '' = prevezme farbu témy (textColor)
        items: (b.items || []).map(normCard),
      };
    case 'variants':
      return {
        id,
        type: 'variants',
        options: (b.options || []).map((o, k) => ({
          id: o.id || newId('var'),
          label: o.label || `Variant ${k + 1}`,
          text: o.text || '',
          slides: (o.slides || []).map(normSlide),
        })),
      };
    default:
      return null; // neznámy typ preskoč
  }
}

/** Prevod starej (predblokovej) štruktúry na bloky. */
function legacyToBlocks(raw) {
  const blocks = [];
  const hero = raw.hero || {};
  if (hero.textAbove) blocks.push({ type: 'text', text: hero.textAbove, style: 'heading' });
  if ((raw.carousel || []).length) blocks.push({ type: 'carousel', slides: raw.carousel });
  if (hero.textBelow) blocks.push({ type: 'text', text: hero.textBelow, style: 'paragraph' });
  if (hero.buttonLabel) {
    blocks.push({
      type: 'button',
      label: hero.buttonLabel,
      image: hero.buttonImage || '',
      tourSrc: hero.buttonTourSrc || raw.defaultTourSrc || '',
    });
  }
  if ((raw.apartments || []).length) {
    blocks.push({ type: 'cards', title: raw.sectionTitle || 'Prehliadka bytov', items: raw.apartments });
  }
  return blocks;
}

export function normalizeLanding(raw = {}) {
  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : legacyToBlocks(raw);
  return {
    landingEnabled: raw.landingEnabled !== false,
    defaultTourSrc: raw.defaultTourSrc || 'tours/demo/tour.json',
    mainSiteUrl: raw.mainSiteUrl || '',
    brand: {
      name: raw.brand?.name || 'Prehliadka',
      logo: raw.brand?.logo || '',
    },
    background: {
      type: raw.background?.type === 'image' ? 'image' : 'color',
      color: raw.background?.color || '#f5f3ee',
      image: raw.background?.image || '',
    },
    theme: {
      headerBg: raw.theme?.headerBg || '#173a5e',
      accent: raw.theme?.accent || '#d8a566',
      cardBg: raw.theme?.cardBg || '#ffffff',
      cardText: raw.theme?.cardText || '#173a5e',
      textColor: raw.theme?.textColor || '#1d2733',
    },
    logoHeight: Number(raw.logoHeight) || 46,
    font: raw.font || "'Cormorant Garamond', Georgia, serif",
    blocks: rawBlocks.map(normBlock).filter(Boolean),
  };
}

// ── export (čistý landing.json) ─────────────────────────────────────────────

function exportSlide(s) {
  return {
    image: s.image,
    ...(s.caption ? { caption: s.caption } : {}),
    ...(s.variants?.length
      ? { variants: s.variants.map((v) => ({ id: v.id, label: v.label, image: v.image })) }
      : {}),
  };
}

function exportBlock(b) {
  switch (b.type) {
    case 'text':
      return { type: 'text', text: b.text, style: b.style, align: b.align, ...(b.color ? { color: b.color } : {}) };
    case 'carousel':
      return { type: 'carousel', slides: b.slides.map(exportSlide) };
    case 'button':
      return {
        type: 'button',
        label: b.label,
        ...(b.image ? { image: b.image } : {}),
        tourSrc: b.tourSrc || '',
      };
    case 'cards':
      return {
        type: 'cards',
        ...(b.title ? { title: b.title } : {}),
        ...(b.titleColor ? { titleColor: b.titleColor } : {}),
        items: b.items.map((a) => ({
          id: a.id,
          title: a.title,
          meta: a.meta,
          ...(a.image ? { image: a.image } : {}),
          tourSrc: a.tourSrc || null,
        })),
      };
    case 'variants':
      return {
        type: 'variants',
        options: b.options.map((o) => ({
          id: o.id,
          label: o.label,
          ...(o.text ? { text: o.text } : {}),
          slides: o.slides.map(exportSlide),
        })),
      };
    default:
      return null;
  }
}

/** Čistý landing.json na stiahnutie (Export). */
export function toLandingJson(cfg) {
  const out = {
    landingEnabled: cfg.landingEnabled,
    defaultTourSrc: cfg.defaultTourSrc,
    mainSiteUrl: cfg.mainSiteUrl,
    brand: { name: cfg.brand.name, logo: cfg.brand.logo },
    background: cfg.background,
    theme: cfg.theme,
    logoHeight: cfg.logoHeight,
    font: cfg.font,
    blocks: cfg.blocks.map(exportBlock).filter(Boolean),
  };
  return JSON.stringify(out, null, 2);
}

/** Zoznam dostupných fontov (musia byť naimportované v index.html alebo systémové). */
export const FONTS = [
  { label: 'Cormorant (elegantný serif)', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'Playfair Display (luxusný serif)', value: "'Playfair Display', Georgia, serif" },
  { label: 'Lora (čitateľný serif)', value: "'Lora', Georgia, serif" },
  { label: 'Georgia (systémový serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Montserrat (moderný sans)', value: "'Montserrat', system-ui, sans-serif" },
  { label: 'Poppins (geometrický sans)', value: "'Poppins', system-ui, sans-serif" },
  { label: 'Raleway (jemný sans)', value: "'Raleway', system-ui, sans-serif" },
  { label: 'Systémový sans-serif', value: "system-ui, 'Segoe UI', Roboto, sans-serif" },
];
