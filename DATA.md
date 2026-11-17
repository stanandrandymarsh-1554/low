# Adding plants and compounds

Every figure on the shelves is one entry in `src/game/data/`:

- `botanicals.ts`: plants, fungi and other natural sources
- `synthetics.ts`: lab-made and semi-synthetic substances

The full field list, with comments, is in `src/game/data/types.ts`. `npm test` checks the data
(unique ids, valid ranges, percentages within 0-100, required fields) and says which entry is wrong.

Each entry also needs a look in `src/game/voxel/looks.ts`, which says how its shelf figure is
drawn: a form (`mushroom`, `root`, `pod`, `crystals`, `vial`, `molecule`, ...) and optionally its
colours. Draw plants as the plant or the part that is used, and lab-made things as the isolated
compound; use `molecule` for a whole class of related compounds. The tests list any entry without a
look. To add a new form, write a draw function in `src/game/voxel/forms.ts`.

Entries marked `sample: true` are placeholders. Delete them once real entries are in.

Optional fields that sources often cover:

- `doses`: `[{ amount: '200-500 µg', context: 'who reported it, and in what setting' }]`. Traditional
  or studied doses as reported, never recommendations.
- `routes`: the ways it is (or was traditionally) taken, e.g. `['smoked leaf', 'tea']`.
- `evidence`: tier `'A'`-`'D'` (shown as a coloured letter sticker on the box): A controlled human
  data or well-characterised human-active compound; B animal/in-vitro with an identified active;
  C traditional reputation, compound identified, activity unconfirmed; D reputation only.
  `evidenceNotes` says what the tier rests on.
- `myth`: `{ reputation, finding }` for reputations that don't hold up. Shows a red BUSTED stamp;
  shelve these in the `'Busted Myths'` aisle.
- `timing`: every number is optional. Leave out whatever the sources don't say.

## Botanical template

```ts
{
  kind: 'botanical',
  id: 'example-plant',               // unique, lowercase-with-dashes
  name: 'Example Plant',
  aka: ['Other name', 'Slang name'],
  latin: 'Genus species',
  family: 'Familyaceae',
  region: 'Where it grows',
  partsUsed: ['leaves', 'root bark'],
  aisle: 'Stimulants',               // shelf it goes on; new names make new aisles
  summary: 'One or two sentences for the back of the box.',
  compounds: [
    // percent = % of dry weight as [min, max]; leave it out if unknown
    { name: 'Compound A', percent: [0.5, 2], part: 'leaves', notes: 'optional' },
    { name: 'Compound B' },
  ],
  effects: ['effect one', 'effect two'],  // short tags; these power effect search
  timing: {
    onsetMinutes: [20, 40],          // optional
    peakMinutes: [60, 90],           // optional
    totalHours: [4, 6],              // required
    afterHours: [2, 4],              // optional
    notes: 'optional, e.g. varies with route',
  },
  toxicity: 'moderate',              // low | moderate | high | severe | unknown
  toxicityNotes: 'Why it got that rating.',
  risks: ['risk one', 'risk two'],
  interactions: ['dangerous combo'],
  history: 'Traditional / historical use.',
  doses: [{ amount: '1-2 g dried', context: 'traditional use, per Source X' }],
  routes: ['tea', 'smoked'],
  evidence: 'B',
  evidenceNotes: 'What the tier rests on.',
  sources: ['https://...'],
},
```

## Synthetic template

```ts
{
  kind: 'synthetic',
  id: 'example-synthetic',
  name: 'Example',
  aka: ['Brand name'],
  chemicalClass: 'phenethylamine',
  synthesis: 'synthetic',            // or 'semi-synthetic'
  aisle: 'Psychedelics',
  summary: 'One or two sentences.',
  origin: {
    year: 1970,                      // optional
    by: 'Person or lab',             // optional
    story: 'Where it came from and what happened next.',
  },
  effects: ['...'],
  timing: { onsetMinutes: [30, 60], totalHours: [6, 8] },
  toxicity: 'high',
  toxicityNotes: '...',
  risks: ['...'],
  interactions: ['...'],
  doses: [{ amount: '...', context: '...' }],
  routes: ['...'],
  evidence: 'A',
  sources: ['https://...'],
},
```

You can also send entries in any format (a list, a spreadsheet, rough notes) and have them
converted to the templates above.
