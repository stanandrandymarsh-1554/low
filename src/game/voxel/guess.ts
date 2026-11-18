import { hashString } from '../aisles';
import type { Entry } from '../data/types';
import type { Form } from './forms';
import type { Look } from './looks';

/** Moves a #rrggbb colour's hue by `deg` degrees, so figures of one form don't all match. */
export function tint(hex: string, deg: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return hex;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (((h * 60 + deg) % 360) + 360) % 360;
  const k = (p: number, q: number, t0: number) => {
    const t = (t0 + 360) % 360;
    if (t < 60) return p + (q - p) * (t / 60);
    if (t < 180) return q;
    if (t < 240) return p + (q - p) * ((240 - t) / 60);
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const to = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(k(p, q, h + 120))}${to(k(p, q, h))}${to(k(p, q, h - 120))}`;
}

/** Keyword rules: what a plant's name says it is. First match wins. */
const PLANT_RULES: readonly [RegExp, Form][] = [
  [/mushroom|reishi|chaga|cordyceps|lion'?s mane|shiitake|maitake|turkey tail|agaric/i, 'shrooms'],
  [/\bhops?\b/i, 'cone'],
  [/kelp|bladderwrack|algae|spirulina|chlorella|seaweed|moss|lichen/i, 'moss'],
  [/\bgrass\b|lemongrass|oat straw|horsetail|bamboo/i, 'grass'],
  [
    /root|ginseng|\bmaca\b|rhodiola|ginger|turmeric|licorice|liquorice|galangal|gentian|astragalus|danshen|eleuthero|burdock|angelica|rehmannia|panax|kudzu|puerar|yam\b|guggul|forskohlii/i,
    'root',
  ],
  [
    /bark|cinnamon|cassia|willow|magnolia|pine\b|pycnogenol|phellodendron|cat'?s claw|uncaria/i,
    'bark',
  ],
  [
    /berry|berries|fruit|cherry|orange|citrus|grape|pomegranate|apple|amla|aronia|goji|acai|noni|lemon|lime|date\b|fig\b|plum|tomato|capsicum|pepper|chili|garcinia|natsudaidai|olive\b/i,
    'berries',
  ],
  [
    /seed|bean|nut\b|guarana|cacao|cocoa|coffee|fenugreek|flax|chia|sesame|grain|barley|oat\b|rice|wheat|kernel|lentil|soy|sunflower|nigella|paradise/i,
    'seeds',
  ],
  [
    /flower|blossom|chamomile|lavender|hibiscus|rose\b|calendula|saffron|lotus|jasmine|elder|chrysanthemum|dandelion|safflower|clover|arnica|damiana/i,
    'flower',
  ],
  [
    /leaf|leaves|\btea\b|\bmate\b|moringa|nettle|basil|mint\b|sage\b|rosemary|lemon balm|tulsi|gotu kola|centella|green tea|matcha|guayusa|yerba|bay\b|stevia|neem|lettuce|arugula|rocket|spinach|kale|cress|broccoli|beet/i,
    'leaf',
  ],
];

const PLANT_FALLBACK: readonly Form[] = ['sprig', 'leaf', 'sprig', 'flower'];

/** Forms for compounds, by the shelf they are on, in the order a name hashes into. */
const COMPOUND_FORMS: Record<string, readonly Form[]> = {
  Stimulants: ['crystals', 'powder', 'pills', 'molecule', 'capsule'],
  Nootropics: ['capsule', 'pills', 'powder', 'molecule'],
  'Hormones & Peptides': ['vial', 'powder', 'molecule', 'vial'],
  'Cannabis-Like': ['vial', 'powder', 'capsule'],
  'Calm & Sedation': ['pills', 'capsule', 'bottle', 'powder'],
  'Longevity & Metabolism': ['capsule', 'powder', 'pills', 'vial', 'molecule'],
  'Amino Acids & Basics': ['powder', 'capsule', 'pills', 'powder', 'bottle'],
  'Mystery Labels': ['bottle', 'canister'],
};

/** Palettes for the compound forms: [a, b, c]. */
const COMPOUND_COLOURS: Partial<Record<Form, readonly [string, string, string]>> = {
  pills: ['#f2f0ea', '#e9b7c9', '#c9c4b8'],
  capsule: ['#e8dcc0', '#c9453b', '#9a9a9a'],
  vial: ['#e6b84a', '#2a2a2a', '#bfe0ea'],
  bottle: ['#b8782e', '#e8e3d6', '#f0c24a'],
};

/**
 * A look for an entry nobody drew by hand: plants from keywords in their name, compounds from
 * the aisle they are on. The colours are nudged by a hash of the id so neighbours differ.
 */
export function guessLook(entry: Entry): Look {
  const h = hashString(entry.id);
  if (entry.kind === 'botanical') {
    const hit = PLANT_RULES.find(([re]) => re.test(entry.name));
    const form = hit ? hit[1] : (PLANT_FALLBACK[h % PLANT_FALLBACK.length] ?? 'sprig');
    // Medicinal mushrooms: brown caps with pale spots (the default is a blue-bruising species).
    if (form === 'shrooms')
      return [form, tint('#a8683a', guessHue(entry) * 2), '#e9d2a0', '#e6d9bb'];
    return [form];
  }
  const forms = COMPOUND_FORMS[entry.aisle] ?? ['powder', 'capsule', 'vial'];
  const form = forms[h % forms.length] ?? 'powder';
  const pal = COMPOUND_COLOURS[form];
  const deg = guessHue(entry) * 3;
  return pal ? [form, tint(pal[0], deg), tint(pal[1], deg), pal[2]] : [form];
}

/** A small hue shift (degrees) for the colours of a guessed look. */
export function guessHue(entry: Entry): number {
  return (hashString(entry.id) % 9) * 9 - 36;
}
