// ─────────────────────────────────────────────────────────────
//  SINGLE SOURCE OF TRUTH for business facts, prices and booking rules.
//  Anything marked TODO needs a real value before launch.
//  If you change SEASON / TIME_WINDOWS / LEAD_HOURS / DEPOSIT here,
//  make the same change at the top of worker/worker.js.
// ─────────────────────────────────────────────────────────────

export const BUSINESS = {
  name: 'Holiday Christmas Lighting Lake Forest',
  shortName: 'Holiday Christmas Lighting',
  city: 'Lake Forest',
  region: 'CA',
  phoneDisplay: '(949) 787-3303',
  phoneHref: 'tel:+19497873303',
  siteUrl: 'https://holiday-lighting-lake-forest.pages.dev', // TODO: swap for custom domain when connected
  googleReviewUrl: null, // TODO: paste the Google Business Profile review link to show a "Read our reviews" button
};

// Shared-dashboard identifiers (must match worker/worker.js)
export const SOURCE_TAG = 'hcl-lakeforest';

// ── Packages ───────────────────────────────────────────────
// startingAt: number in dollars, or null → shows "Priced at visit".
// TODO: enter real starting prices (the build prompt left these blank).
export const PACKAGES = [
  {
    id: 'front',
    name: 'Front Only',
    tagline: 'The classic curb-appeal glow',
    startingAt: null, // TODO
    features: [
      'Professional design for the front of the home',
      'Commercial-grade LED lights (leased, no purchase needed)',
      'Roofline & gutter-line installation',
      'Timer setup',
      'In-season maintenance & bulb replacement',
      'Takedown after the holidays',
    ],
  },
  {
    id: 'front-sides',
    name: 'Front & Sides',
    tagline: 'Wrap-around glow from every angle',
    startingAt: null, // TODO
    features: [
      'Everything in Front Only',
      'Side rooflines & gutters',
      'Expanded custom design',
    ],
  },
];

// ── Add-ons (booking step 2) ───────────────────────────────
// price: dollars or null → "Quoted at visit". TODO: fill in real prices.
export const ADDONS = [
  { id: 'trees', name: 'Tree & bush wrapping', short: 'Tree Wrap', price: null },
  { id: 'wreaths', name: 'Wreaths / garland', short: 'Wreaths', price: null },
  { id: 'pathway', name: 'Pathway / stake lights', short: 'Pathway', price: null },
  { id: 'owned', name: 'Install customer-owned lights', short: 'Own Lights', price: null, flat: true },
  { id: 'storage', name: 'Off-season storage', short: 'Storage', price: null },
];

export const TWO_STORY_MULTIPLIER = 1.5; // Two-story home: +50% of package price

// ── Booking rules ──────────────────────────────────────────
export const TIME_ZONE = 'America/Los_Angeles';
export const SEASON = { startMonth: 10, startDay: 20, endMonth: 12, endDay: 20 };
// `id` is the exact value stored in the D1 `time` column.
export const TIME_WINDOWS = [
  { id: '8AM–12PM', label: '8 AM – 12 PM', startHour: 8, part: 'Morning' },
  { id: '12PM–4PM', label: '12 PM – 4 PM', startHour: 12, part: 'Afternoon' },
];
export const LEAD_HOURS = 48;
export const DEPOSIT_DOLLARS = 149;

// ── Service area ───────────────────────────────────────────
// TODO: confirm the cities you actually serve.
export const SERVICE_AREA = [
  'Lake Forest',
  'Foothill Ranch',
  'Portola Hills',
  'Mission Viejo',
  'Laguna Hills',
  'Irvine',
  'Rancho Santa Margarita',
  'Aliso Viejo',
  'Laguna Woods',
  'Trabuco Canyon',
  'Ladera Ranch',
];

// ── Reviews ────────────────────────────────────────────────
// TODO: add REAL reviews only, e.g.
// { name: 'Jane D.', city: 'Lake Forest', text: '…', stars: 5 }
// Leave empty until real reviews exist; the section shows a neutral message.
export const REVIEWS = [];
// TODO: real aggregate, e.g. { rating: 5.0, count: 37, source: 'Google' } — or keep null.
export const RATING = null;

export const NAV_LEFT = [
  { label: 'Packages', href: '/#packages' },
  { label: 'How It Works', href: '/#how' },
  { label: 'Gallery', href: '/#gallery' },
];
export const NAV_RIGHT = [
  { label: 'Reviews', href: '/#reviews' },
  { label: 'Service Area', href: '/#area' },
  { label: 'FAQ', href: '/#faq' },
];

export const money = (n) =>
  n == null ? null : '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
