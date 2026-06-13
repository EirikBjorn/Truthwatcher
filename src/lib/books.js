export const CHECKLIST_TABS = [
  { id: 'eirik', label: 'Reading Order' },
  { id: 'publication', label: 'Publication Order' },
  { id: 'planet', label: 'By Planet' },
]

export const PLANET_ORDER = [
  'Canticle',
  'First of the Sun',
  'Komashi',
  'Lumar',
  'Nalthis',
  'Roshar',
  'Scadrial',
  'Sel',
  'Taldain',
  'Threnody',
  'Unknown',
]

export const COSMERE_WORKS = [
  {
    id: 'elantris',
    title: 'Elantris',
    type: 'Novel',
    planet: 'Sel',
    publicationOrder: 1,
    releaseDateLabel: 'Apr 21, 2005',
    eirikOrder: 7,
    durationLabel: '~13.5 hours',
    label: 'optional',
    note: 'This is a standalone novel, it is fun to know this book while reading later books, but not required.',
    prerequisites: [],
  },
  {
    id: 'the-hope-of-elantris',
    title: 'The Hope of Elantris',
    type: 'Short Story',
    planet: 'Sel',
    publicationOrder: 2,
    releaseDateLabel: 'Jan 2006',
    eirikOrder: 8,
    durationLabel: '~0.5 hours',
    label: 'optional',
    note: 'This is a standalone short story, it is fun to know this story while reading later books, but not required.',
    prerequisites: ['elantris'],
  },
  {
    id: 'mistborn-final-empire',
    title: 'Mistborn: The Final Empire',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 3,
    releaseDateLabel: 'Jul 17, 2006',
    eirikOrder: 1,
    durationLabel: '~14.5 hours',
    label: 'required',
    note: 'First book in the mistborn series',
    prerequisites: [],
  },
  {
    id: 'mistborn-well-of-ascension',
    title: 'Mistborn: The Well of Ascension',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 4,
    releaseDateLabel: 'Aug 21, 2007',
    eirikOrder: 2,
    durationLabel: '~16.5 hours',
    label: 'required',
    note: 'Second book in the mistborn series',
    prerequisites: ['mistborn-final-empire'],
  },
  {
    id: 'mistborn-hero-of-ages',
    title: 'Mistborn: The Hero of Ages',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 5,
    releaseDateLabel: 'Oct 14, 2008',
    eirikOrder: 3,
    durationLabel: '~15.5 hours',
    label: 'required',
    note: 'Third book in the mistborn series',
    prerequisites: ['mistborn-final-empire', 'mistborn-well-of-ascension'],
  },
  {
    id: 'warbreaker',
    title: 'Warbreaker',
    type: 'Novel',
    planet: 'Nalthis',
    publicationOrder: 6,
    releaseDateLabel: 'Jun 9, 2009',
    eirikOrder: 6,
    durationLabel: '~13.5 hours',
    label: 'recommended',
    note: 'Standalone novel, but has VERY cool connections to the Stormlight Archive series. Highly recommended to read before Stormlight, especially the second book.',
    prerequisites: [],
  },
  {
    id: 'stormlight-way-of-kings',
    title: 'The Stormlight Archive: The Way of Kings',
    type: 'Novel',
    planet: 'Roshar',
    publicationOrder: 7,
    releaseDateLabel: 'Aug 31, 2010',
    eirikOrder: 11,
    durationLabel: '~25.5 hours',
    label: 'required',
    note: 'First book in the Stormlight Archive series',
    prerequisites: [],
  },
  {
    id: 'mistborn-alloy-of-law',
    title: 'Mistborn: The Alloy of Law',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 8,
    releaseDateLabel: 'Nov 8, 2011',
    eirikOrder: 18,
    durationLabel: '~6.5 hours',
    label: 'required',
    note: 'First book in the Mistborn Era 2 series. Set 300 years after the original Mistborn trilogy.',
    prerequisites: ['mistborn-final-empire', 'mistborn-well-of-ascension', 'mistborn-hero-of-ages'],
  },
  {
    id: 'the-eleventh-metal',
    title: 'The Eleventh Metal',
    type: 'Short Story',
    planet: 'Scadrial',
    publicationOrder: 9,
    releaseDateLabel: 'Dec 16, 2011',
    eirikOrder: 4,
    durationLabel: '~1 hour',
    label: 'optional',
    note: 'This is a standalone short stor.',
    prerequisites: ['mistborn-final-empire', 'mistborn-well-of-ascension', 'mistborn-hero-of-ages'],
  },
  {
    id: 'emperors-soul',
    title: "The Emperor's Soul",
    type: 'Novella',
    planet: 'Sel',
    publicationOrder: 10,
    releaseDateLabel: 'Oct 11, 2012',
    eirikOrder: 9,
    durationLabel: '~2 hours',
    label: 'recommended',
    note: 'Highly recommended to read before the fourth Mistborn Era 2 book, The Lost Metal. This is a standalone story, but it is set in the same world as Elantris and has some connections to the magic system.',
    prerequisites: [],
  },
  {
    id: 'shadows-for-silence',
    title: 'Shadows for Silence in the Forests of Hell',
    type: 'Novella',
    planet: 'Threnody',
    publicationOrder: 11,
    releaseDateLabel: 'Dec 3, 2013',
    eirikOrder: 23,
    durationLabel: '~1.5 hours',
    label: 'optional',
    note: 'This is a standalone story, but should be read before The Sunlit Man',
    prerequisites: [],
  },
  {
    id: 'stormlight-words-of-radiance',
    title: 'The Stormlight Archive: Words of Radiance',
    type: 'Novel',
    planet: 'Roshar',
    publicationOrder: 12,
    releaseDateLabel: 'Mar 4, 2014',
    eirikOrder: 12,
    durationLabel: '~26.5 hours',
    label: 'required',
    note: 'Second book in the Stormlight Archive series',
    prerequisites: ['stormlight-way-of-kings'],
  },
  {
    id: 'sixth-of-the-dusk',
    title: 'Sixth of the Dusk',
    type: 'Novella',
    planet: 'First of the Sun',
    publicationOrder: 13,
    releaseDateLabel: 'Jul 1, 2014',
    eirikOrder: 25,
    durationLabel: '~1.5 hours',
    label: 'optional',
    note: 'This is a standalone story, but should be read before Isles of the Emberdark',
    prerequisites: [],
  },
  {
    id: 'allomancer-jak',
    title: 'Allomancer Jak and the Pits of Eltania',
    type: 'Short Story',
    planet: 'Scadrial',
    publicationOrder: 14,
    releaseDateLabel: 'Aug 7, 2014',
    eirikOrder: 19,
    durationLabel: '~1.5 hours',
    label: 'optional',
    note: 'Fun little in world story, but not required to read before any other books. It is set in the same world as Mistborn, but is not part of the main series.',
    prerequisites: [],
  },
  {
    id: 'mistborn-shadows-of-self',
    title: 'Mistborn: Shadows of Self',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 15,
    releaseDateLabel: 'Oct 6, 2015',
    eirikOrder: 20,
    durationLabel: '~7.5 hours',
    label: 'required',
    note: 'Second book in the Mistborn Era 2 series.',
    prerequisites: ['mistborn-alloy-of-law'],
  },
  {
    id: 'mistborn-bands-of-mourning',
    title: 'Mistborn: The Bands of Mourning',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 16,
    releaseDateLabel: 'Jan 26, 2016',
    eirikOrder: 21,
    durationLabel: '~8.5 hours',
    label: 'required',
    note: 'Third book in the Mistborn Era 2 series.',
    prerequisites: ['mistborn-alloy-of-law', 'mistborn-shadows-of-self'],
  },
  {
    id: 'mistborn-secret-history',
    title: 'Mistborn: Secret History',
    type: 'Novella',
    planet: 'Scadrial',
    publicationOrder: 17,
    releaseDateLabel: 'Jan 26, 2016',
    eirikOrder: 5,
    durationLabel: '~3.5 hours',
    label: 'required',
    note: 'This is a standalone novella, following the Mistborn Trilogy from a different perspective. Should be read directly after the original Mistborn trilogy.',
    prerequisites: ['mistborn-final-empire', 'mistborn-well-of-ascension', 'mistborn-hero-of-ages'],
  },
  {
    id: 'stormlight-edgedancer',
    title: 'The Stormlight Archive: Edgedancer',
    type: 'Novella',
    planet: 'Roshar',
    publicationOrder: 18,
    releaseDateLabel: 'Nov 22, 2016',
    eirikOrder: 13,
    durationLabel: '~2.5 hours',
    label: 'optional',
    note: 'Optional, but highly recommended to read before Oathbringer.',
    prerequisites: ['stormlight-way-of-kings', 'stormlight-words-of-radiance'],
  },
  {
    id: 'stormlight-oathbringer',
    title: 'The Stormlight Archive: Oathbringer',
    type: 'Novel',
    planet: 'Roshar',
    publicationOrder: 19,
    releaseDateLabel: 'Nov 14, 2017',
    eirikOrder: 14,
    durationLabel: '~30.5 hours',
    label: 'required',
    note: 'Third book in the Stormlight Archive series.',
    prerequisites: ['stormlight-way-of-kings', 'stormlight-words-of-radiance', 'stormlight-edgedancer'],
  },
  {
    id: 'stormlight-dawnshard',
    title: 'The Stormlight Archive: Dawnshard',
    type: 'Novella',
    planet: 'Roshar',
    publicationOrder: 20,
    releaseDateLabel: 'Nov 5, 2020',
    eirikOrder: 15,
    durationLabel: '~3.5 hours',
    label: 'optional',
    note: 'Optional novella, recommended to read before Rhythm of War.',
    prerequisites: ['stormlight-way-of-kings', 'stormlight-words-of-radiance', 'stormlight-oathbringer'],
  },
  {
    id: 'stormlight-rhythm-of-war',
    title: 'The Stormlight Archive: Rhythm of War',
    type: 'Novel',
    planet: 'Roshar',
    publicationOrder: 21,
    releaseDateLabel: 'Nov 17, 2020',
    eirikOrder: 16,
    durationLabel: '~30.5 hours',
    label: 'required',
    note: 'Fourth book in the Stormlight Archive series. You will notice some extra references if you have read Elantris, Warbreaker, and Dawnshard, but it is not required to read those before Rhythm of War.',
    prerequisites: ['stormlight-way-of-kings', 'stormlight-words-of-radiance', 'stormlight-oathbringer', 'stormlight-dawnshard'],
  },
  {
    id: 'mistborn-lost-metal',
    title: 'Mistborn: The Lost Metal',
    type: 'Novel',
    planet: 'Scadrial',
    publicationOrder: 22,
    releaseDateLabel: 'Nov 15, 2022',
    eirikOrder: 22,
    durationLabel: '~10 hours',
    label: 'required',
    note: 'Fourth book in the Mistborn Era 2 series. This is the final book in the Mistborn Era 2 series. You will notice cool details and extra references to Elantris',
    prerequisites: ['mistborn-alloy-of-law', 'mistborn-shadows-of-self', 'mistborn-bands-of-mourning'],
  },
  {
    id: 'white-sand-omnibus',
    title: 'White Sand Omnibus',
    type: 'Graphic Novel',
    planet: 'Taldain',
    publicationOrder: 23,
    releaseDateLabel: 'Dec 16, 2022',
    eirikOrder: 10,
    durationLabel: '~5 hours',
    label: 'optional',
    note: 'Optional graphic novel, backstory of Khriss, the person writing the Ars Arcanum with details on the magic system at the end of each book.',
    prerequisites: [],
  },
  {
    id: 'tress',
    title: 'Tress of the Emerald Sea',
    type: 'Novel',
    planet: 'Lumar',
    publicationOrder: 24,
    releaseDateLabel: 'Jan 1, 2023',
    eirikOrder: 26,
    durationLabel: '~7.5 hours',
    label: 'optional',
    note: 'Standalone novel.',
    prerequisites: [],
  },
  {
    id: 'yumi',
    title: 'Yumi and the Nightmare Painter',
    type: 'Novel',
    planet: 'Komashi',
    publicationOrder: 25,
    releaseDateLabel: 'Jul 1, 2023',
    eirikOrder: 27,
    durationLabel: '~9 hours',
    label: 'optional',
    note: 'Standalone novel.',
    prerequisites: [],
  },
  {
    id: 'sunlit-man',
    title: 'The Sunlit Man',
    type: 'Novel',
    planet: 'Canticle',
    publicationOrder: 26,
    releaseDateLabel: 'Oct 1, 2023',
    eirikOrder: 24,
    durationLabel: '~7.5 hours',
    label: 'optional',
    note: 'Standalone novel, following an important character you will know from earlier books',
    prerequisites: [],
  },
  {
    id: 'stormlight-wind-and-truth',
    title: 'The Stormlight Archive: Wind and Truth',
    type: 'Novel',
    planet: 'Roshar',
    publicationOrder: 27,
    releaseDateLabel: 'Dec 6, 2024',
    eirikOrder: 17,
    durationLabel: '~33 hours',
    label: 'required',
    note: 'Fifth book in the Stormlight Archive series. You will notice some extra references if you have read Elantris, Warbreaker, and Dawnshard, but it is not required to read those before Wind and Truth.',
    prerequisites: ['stormlight-way-of-kings', 'stormlight-words-of-radiance', 'stormlight-oathbringer', 'stormlight-dawnshard', 'stormlight-rhythm-of-war']
  },
  {
    id: 'isles-of-the-emberdark',
    title: 'Isles of the Emberdark',
    type: 'Novel',
    planet: 'First of the Sun',
    publicationOrder: 28,
    releaseDateLabel: 'Jul 1, 2025',
    eirikOrder: 28,
    durationLabel: '~8 hours',
    label: 'optional',
    note: 'Standalone novel.',
    prerequisites: [],
  },
  {
    id: 'fires-of-december',
    title: 'The Fires of December',
    type: 'Novel',
    planet: 'Unknown',
    publicationOrder: 29,
    releaseDateLabel: 'Dec 8, 2026',
    eirikOrder: 29,
    durationLabel: 'Unknown',
    label: 'optional',
    note: 'Standalone novel.',
    prerequisites: [],
    isReleased: false,
  },
]

const workById = new Map(COSMERE_WORKS.map((work) => [work.id, work]))

const SERIES_META = {
  mistborn: {
    slug: 'mistborn',
    label: 'Mistborn',
    shortLabel: 'MB',
    themeSlug: 'mistborn',
  },
  stormlight: {
    slug: 'stormlight',
    label: 'Stormlight',
    shortLabel: 'SA',
    themeSlug: 'stormlight',
  },
  elantris: {
    slug: 'elantris',
    label: 'Elantris',
    shortLabel: 'EL',
    themeSlug: 'elantris',
  },
  standalone: {
    slug: 'standalone',
    label: 'Standalone',
    shortLabel: 'ST',
    themeSlug: 'standalone',
  },
}

const STANDALONE_THEME_BY_WORK_ID = {
  warbreaker: 'warbreaker',
  'shadows-for-silence': 'shadows',
  'sixth-of-the-dusk': 'sixth',
  'white-sand-omnibus': 'white-sand',
  tress: 'tress',
  yumi: 'yumi',
  'sunlit-man': 'sunlit',
  'isles-of-the-emberdark': 'emberdark',
  'fires-of-december': 'fires',
}

export function getWorkById(id) {
  return workById.get(id) ?? null
}

export function getWorkSeriesMeta(work) {
  const title = String(work?.title ?? '')
  const id = String(work?.id ?? '')

  if (
    title.startsWith('Mistborn:') ||
    id === 'the-eleventh-metal' ||
    id === 'allomancer-jak'
  ) {
    return SERIES_META.mistborn
  }

  if (title.startsWith('The Stormlight Archive:')) {
    return SERIES_META.stormlight
  }

  if (['elantris', 'the-hope-of-elantris', 'emperors-soul'].includes(id)) {
    return SERIES_META.elantris
  }

  return {
    ...SERIES_META.standalone,
    themeSlug: STANDALONE_THEME_BY_WORK_ID[id] ?? SERIES_META.standalone.themeSlug,
  }
}

export function getWorkDurationHours(work) {
  const match = String(work?.durationLabel ?? '').match(/(\d+(?:\.\d+)?)/)

  return match ? Number(match[1]) : 0
}

export function isWorkReleased(work) {
  return Boolean(work) && work.isReleased !== false
}

export function calculateCosmereProgress(readingList = []) {
  const releasedWorks = COSMERE_WORKS.filter(isWorkReleased)
  const releasedReadingList = readingList.filter(isWorkReleased)
  const totalHours = releasedWorks.reduce((sum, work) => sum + getWorkDurationHours(work), 0)
  const completedBooks = releasedReadingList.filter((work) => work.completed).length
  const novels = releasedReadingList.filter((work) => work.type === 'Novel')
  const novellas = releasedReadingList.filter((work) => work.type === 'Novella')
  const shortStories = releasedReadingList.filter((work) => work.type === 'Short Story')
  const totalPlanets = new Set(releasedWorks.map((work) => work.planet)).size
  const completedPlanets = new Set(
    releasedReadingList.filter((work) => work.completed).map((work) => work.planet),
  ).size
  const completedHours = releasedReadingList
    .filter((work) => work.completed)
    .reduce((sum, work) => sum + getWorkDurationHours(work), 0)
  const remainingHours = Math.max(totalHours - completedHours, 0)
  const percentComplete = totalHours ? Math.round((completedHours / totalHours) * 100) : 0

  return {
    completedBooks,
    totalBooks: releasedWorks.length,
    completedNovels: novels.filter((work) => work.completed).length,
    totalNovels: novels.length,
    completedNovellas: novellas.filter((work) => work.completed).length,
    totalNovellas: novellas.length,
    completedShortStories: shortStories.filter((work) => work.completed).length,
    totalShortStories: shortStories.length,
    completedPlanets,
    totalPlanets,
    completedHours,
    totalHours,
    remainingHours,
    percentComplete,
  }
}
