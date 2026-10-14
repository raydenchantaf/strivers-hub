import type { Localised } from '@/lib/i18n/types';

/* The hive game's content. Nothing in it is invented for the game.

   The field is the platform's own vocabulary in both languages: the trades
   are assessment question q2a's industries, and the rest are the topics the
   CMS files its guides under, which is also what lets a lit word find a
   guide at the end.

   The six skills come from question q3b, the one question whose options
   carry points. Its twelve options score 1, 2 or 3, and that score is the
   stage - so where a skill goes in the hive is not our opinion, it is how the
   assessment already counts it. The three stage names are the pathway names
   off the homepage (`path.1t` to `path.3t`): Aspiring, Managing and Growing,
   kept in English on both language versions, as TAF decided (D3 decision 1). */

export type StageIx = 0 | 1 | 2;

export type FieldWord = {
  id: string;
  label: Localised;
  /** A trade is set in the serif italic, a topic in the sans. */
  kind: 'trade' | 'topic';
  /** Category titles (English, as the CMS stores them) this word finds. */
  cats?: string[];
  /** Skills this word makes more likely to be dealt in the second act. */
  tiles?: string[];
};

export type Tile = {
  id: string;
  stage: StageIx;
  label: Localised;
  /** One line on why it sits at this stage, shown when it is placed. */
  why: Localised;
};

export const MAX_PICKS = 3;

export const FIELD: FieldWord[] = [
  { id: 'food', kind: 'trade', label: { en: 'Food & drink', bm: 'Makanan & minuman' } },
  { id: 'fashion', kind: 'trade', label: { en: 'Fashion', bm: 'Fesyen' } },
  { id: 'beauty', kind: 'trade', label: { en: 'Beauty', bm: 'Kecantikan' } },
  { id: 'creative', kind: 'trade', label: { en: 'Creative & media', bm: 'Kreatif & media' } },
  { id: 'education', kind: 'trade', label: { en: 'Education', bm: 'Pendidikan' } },
  { id: 'hospitality', kind: 'trade', label: { en: 'Hospitality', bm: 'Hospitaliti' } },
  { id: 'health', kind: 'trade', label: { en: 'Health & wellness', bm: 'Kesihatan' } },
  { id: 'trade', kind: 'trade', label: { en: 'Wholesale & trade', bm: 'Borong & perdagangan' } },

  {
    id: 'dmkt',
    kind: 'topic',
    label: { en: 'Digital marketing', bm: 'Pemasaran digital' },
    cats: ['Marketing', 'Marketing & Branding', 'Engagement'],
    tiles: ['admkt', 'online'],
  },
  {
    id: 'online',
    kind: 'topic',
    label: { en: 'Online presence', bm: 'Kehadiran dalam talian' },
    cats: ['Digital Presence'],
    tiles: ['online'],
  },
  {
    id: 'brand',
    kind: 'topic',
    label: { en: 'Personal branding', bm: 'Penjenamaan peribadi' },
    cats: ['Personal Branding'],
    tiles: ['online'],
  },
  {
    id: 'clients',
    kind: 'topic',
    label: { en: 'Finding clients', bm: 'Mencari pelanggan' },
    cats: ['Client Acquisition'],
    tiles: ['research', 'network'],
  },
  {
    id: 'trust',
    kind: 'topic',
    label: { en: 'Customer trust', bm: 'Kepercayaan pelanggan' },
    cats: ['Customer Retention'],
    tiles: ['ops'],
  },
  {
    id: 'ai',
    kind: 'topic',
    label: { en: 'AI tools', bm: 'Alat AI' },
    cats: ['Artificial Intelligence', 'ChatGPT'],
    tiles: ['admkt'],
  },
  {
    id: 'automation',
    kind: 'topic',
    label: { en: 'Automation', bm: 'Automasi' },
    cats: ['Automation'],
    tiles: ['ops'],
  },
  {
    id: 'cyber',
    kind: 'topic',
    label: { en: 'Cybersecurity', bm: 'Keselamatan siber' },
    cats: ['Cybersecurity'],
    tiles: ['ops'],
  },
  {
    id: 'funding',
    kind: 'topic',
    label: { en: 'Funding', bm: 'Pembiayaan' },
    cats: ['Finance', 'Funding & Growth'],
    tiles: ['money', 'invest'],
  },
  {
    id: 'pitch',
    kind: 'topic',
    label: { en: 'Pitching', bm: 'Pembentangan' },
    cats: ['Pitching'],
    tiles: ['network'],
  },
  {
    id: 'network',
    kind: 'topic',
    label: { en: 'Networking', bm: 'Jaringan' },
    cats: ['Networking', 'Community'],
    tiles: ['network', 'events'],
  },
  {
    id: 'partner',
    kind: 'topic',
    label: { en: 'Partnerships', bm: 'Kerjasama strategik' },
    cats: ['Partnership'],
    tiles: ['network'],
  },
  {
    id: 'ops',
    kind: 'topic',
    label: { en: 'Operations', bm: 'Operasi' },
    cats: ['Operations & Productivity'],
    tiles: ['ops'],
  },
  {
    id: 'sales',
    kind: 'topic',
    label: { en: 'Sales', bm: 'Jualan' },
    cats: ['Sales'],
    tiles: ['expand'],
  },
  {
    id: 'esg',
    kind: 'topic',
    label: { en: 'Sustainability', bm: 'Kelestarian' },
    cats: ['ESG', 'Sustainability'],
    tiles: ['expand'],
  },
  {
    id: 'legal',
    kind: 'topic',
    label: { en: 'Legal & licensing', bm: 'Undang-undang' },
    cats: ['Legal'],
    tiles: ['reg'],
  },
  {
    id: 'comms',
    kind: 'topic',
    label: { en: 'Communication', bm: 'Komunikasi' },
    cats: ['Communication'],
    tiles: ['people'],
  },
  {
    id: 'digital',
    kind: 'topic',
    label: { en: 'Digital skills', bm: 'Kemahiran digital' },
    cats: ['Digital Skills', 'Technology'],
    tiles: ['online'],
  },
];

export const TILES: Tile[] = [
  /* q3b options worth 1 point - Aspiring */
  {
    id: 'reg',
    stage: 0,
    label: { en: 'Registration & licensing', bm: 'Pendaftaran & perlesenan' },
    why: {
      en: 'The foundation. Registering makes the business official, and bank accounts, grants and marketplaces usually ask for it.',
      bm: 'Asasnya. Pendaftaran menjadikan perniagaan anda sah, dan akaun bank, geran serta platform jualan biasanya memerlukannya.',
    },
  },
  {
    id: 'online',
    stage: 0,
    label: { en: 'Online presence', bm: 'Kehadiran dalam talian' },
    why: {
      en: 'Customers look you up before they buy. A simple profile or page is where most businesses begin.',
      bm: 'Pelanggan mencari anda dalam talian sebelum membeli. Profil atau laman yang ringkas ialah titik mula kebanyakan perniagaan.',
    },
  },
  {
    id: 'research',
    stage: 0,
    label: { en: 'Market research', bm: 'Kajian pasaran' },
    why: {
      en: 'Know who will buy before you build. A little research early saves a lot of money later.',
      bm: 'Kenali siapa yang akan membeli sebelum anda bermula. Sedikit kajian awal menjimatkan banyak wang kemudian.',
    },
  },
  {
    id: 'money',
    stage: 0,
    label: { en: 'Financial planning', bm: 'Perancangan kewangan' },
    why: {
      en: 'Keep business and personal money apart from day one, and know what each sale really earns.',
      bm: 'Asingkan wang perniagaan daripada wang peribadi sejak hari pertama, dan ketahui untung sebenar setiap jualan.',
    },
  },

  /* worth 2 - Managing */
  {
    id: 'ops',
    stage: 1,
    label: { en: 'Day-to-day operations', bm: 'Operasi harian' },
    why: {
      en: 'Once orders arrive, a steady routine is what keeps your promises on time.',
      bm: 'Apabila tempahan mula masuk, rutin yang tersusun memastikan janji anda ditepati.',
    },
  },
  {
    id: 'people',
    stage: 1,
    label: { en: 'Managing people', bm: 'Sumber manusia' },
    why: {
      en: 'A first hire changes everything. Clear roles let the business run without you doing it all.',
      bm: 'Pekerja pertama mengubah segalanya. Peranan yang jelas membolehkan perniagaan berjalan tanpa anda melakukan semuanya.',
    },
  },
  {
    id: 'cost',
    stage: 1,
    label: { en: 'Cost control & budgeting', bm: 'Kawalan kos & belanjawan' },
    why: {
      en: 'Running costs creep up quietly. A monthly budget shows where the margin goes.',
      bm: 'Kos operasi meningkat tanpa disedari. Belanjawan bulanan menunjukkan ke mana perginya keuntungan.',
    },
  },
  {
    id: 'invest',
    stage: 1,
    label: { en: 'Alternative investments', bm: 'Pelaburan alternatif' },
    why: {
      en: 'With the business steady, spare cash can start working for you — carefully.',
      bm: 'Apabila perniagaan stabil, lebihan wang boleh mula bekerja untuk anda — dengan berhati-hati.',
    },
  },

  /* worth 3 - Growing */
  {
    id: 'network',
    stage: 2,
    label: { en: 'Networks & partnerships', bm: 'Jaringan & perkongsian' },
    why: {
      en: 'Growth rarely happens alone. The right partner opens doors to customers you cannot reach yourself.',
      bm: 'Pertumbuhan jarang berlaku bersendirian. Rakan kongsi yang tepat membuka pintu kepada pelanggan yang sukar anda capai sendiri.',
    },
  },
  {
    id: 'expand',
    stage: 2,
    label: { en: 'Expansion strategy', bm: 'Strategi pengembangan' },
    why: {
      en: 'New markets, new branches, export: expanding works best as a plan, not a leap.',
      bm: 'Pasaran baharu, cawangan baharu, eksport: pengembangan paling berkesan sebagai rancangan, bukan lompatan.',
    },
  },
  {
    id: 'admkt',
    stage: 2,
    label: { en: 'Advanced digital marketing', bm: 'Pemasaran digital lanjutan' },
    why: {
      en: 'With the basics running, data and paid campaigns take you further than posting alone.',
      bm: 'Apabila asasnya kukuh, data dan kempen berbayar membawa anda lebih jauh daripada sekadar memuat naik hantaran.',
    },
  },
  {
    id: 'events',
    stage: 2,
    label: { en: 'Industry updates & events', bm: 'Berita & acara industri' },
    why: {
      en: 'Staying ahead means knowing where your industry is heading. Forums and events keep you in the room.',
      bm: 'Untuk kekal di hadapan, anda perlu tahu hala tuju industri anda. Forum dan acara memastikan anda sentiasa terlibat.',
    },
  },
];

export const TILE_BY_ID: Record<string, Tile> = Object.fromEntries(TILES.map((t) => [t.id, t]));
export const WORD_BY_ID: Record<string, FieldWord> = Object.fromEntries(FIELD.map((w) => [w.id, w]));

/** The pathway colours the homepage cards already use, in stage order. */
export const STAGE_COLOUR = ['var(--jade)', 'var(--magenta)', 'var(--saffron)'] as const;

function shuffle<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Two skills per stage, six in all, in a shuffled tray order. A lit word
 * nudges its related skills into the deal - someone who lit "Digital
 * marketing" is more likely to meet "Advanced digital marketing" - and chance
 * fills the rest, so a second play is not the same six.
 */
export function dealTiles(picks: string[]): string[] {
  const wanted = new Set(picks.flatMap((id) => WORD_BY_ID[id]?.tiles ?? []));
  const hand: string[] = [];
  for (const stage of [0, 1, 2] as StageIx[]) {
    const pool = shuffle(TILES.filter((t) => t.stage === stage).map((t) => t.id));
    pool.sort((a, b) => Number(wanted.has(b)) - Number(wanted.has(a)));
    hand.push(...pool.slice(0, 2));
  }
  return shuffle(hand);
}

export type HiveGuide = { href: string; title: Localised; cats: string[] };

/** Up to three guides filed under what was lit, newest first on a tie. */
export function guidesFor(picks: string[], guides: HiveGuide[]): HiveGuide[] {
  const cats = new Set(picks.flatMap((id) => WORD_BY_ID[id]?.cats ?? []));
  if (!cats.size) return guides.slice(0, 3);
  const scored = guides
    .map((g, i) => ({ g, i, n: g.cats.filter((c) => cats.has(c)).length }))
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((s) => s.g);
  /* a pick with nothing filed under it still gets three guides, topped up
     from the newest rather than leaving the list short */
  for (const g of guides) {
    if (scored.length >= 3) break;
    if (!scored.includes(g)) scored.push(g);
  }
  return scored.slice(0, 3);
}
