// ──────────────────────────────────────────────────────────────────────────
//  KONFIGURÁCIA ÚVODNEJ STRÁNKY (landing) — PREDVOLENÉ hodnoty.
//
//  • landingEnabled: false  → úvodná stránka sa VYPNE a appka pôjde rovno
//    do prehliadky `defaultTourSrc` (ideálne pre iný projekt bez landingu).
//  • Obsah stránky = `blocks` (zoradený zoznam blokov). Bloky pridávaš,
//    mažeš a presúvaš v EDIT režime; Export vyrobí `public/landing.json`,
//    ktorý tieto predvolené hodnoty pri nasadení prebije.
//  • Cesty k obrázkom sú relatívne k priečinku `public/`.
// ──────────────────────────────────────────────────────────────────────────

export const siteConfig = {
  landingEnabled: true,
  defaultTourSrc: 'tours/demo/tour.json',
  mainSiteUrl: 'https://hodzova.sk/',

  brand: {
    name: 'Rezidencia Hodžova',
    logo: 'landing/logo.svg', // negatív (biele) logo do tmavej hlavičky
  },

  background: {
    type: 'color',
    color: '#f5f3ee',
    image: '', // napr. 'landing/pozadie.jpg'
  },

  theme: {
    headerBg: '#173a5e', // hlavička
    accent: '#d8a566', // tlačidlá / akcenty
    cardBg: '#ffffff', // pozadie kariet
    cardText: '#173a5e', // text v kartách
    textColor: '#1d2733', // bežný text
  },
  logoHeight: 46,

  font: "'Cormorant Garamond', Georgia, serif",

  // Obsah stránky — bloky v poradí. Typy: text | carousel | button | cards | variants.
  blocks: [
    { type: 'text', style: 'heading', align: 'center', text: 'Rezidencia Hodžova' },
    {
      type: 'text',
      style: 'paragraph',
      align: 'center',
      text: 'Prezrite si byt v interaktívnej 360° prehliadke.',
    },
    { type: 'button', label: '360° Prehliadka', image: '', tourSrc: 'tours/demo/tour.json' },
    {
      type: 'cards',
      title: 'Prehliadka bytov',
      items: [
        { id: 'byt-1', title: 'Byt 2.3', meta: '2+1 · 51,09 m²', image: 'landing/byt-1.jpg', tourSrc: 'tours/demo/tour.json' },
        { id: 'byt-2', title: 'Byt 2', meta: '2-izbový · 56 m²', image: 'landing/byt-2.jpg', tourSrc: null },
        { id: 'byt-3', title: 'Byt 3', meta: '4-izbový · 102 m²', image: 'landing/byt-3.jpg', tourSrc: null },
      ],
    },
  ],
};
