import { FilterPillOption } from '../../components/atoms/FilterPills';
import { TrackedSource } from '../../types/models.types';

export type SortFilter = 'newest' | 'oldest' | 'a_z' | 'z_a';

export const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A → Z', value: 'a_z' },
  { label: 'Z → A', value: 'z_a' },
];

export type CategoryId =
  | 'all'
  | 'active'
  | 'favorites'
  | 'tech'
  | 'business'
  | 'news'
  | 'design'
  | 'games'
  | 'food'
  | 'faith'
  | 'education'
  | 'lifestyle'
  | 'entertainment'
  | 'other';

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  icon: string;
  matcher: RegExp;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'active',
    label: 'Active Tracked',
    icon: '⚡',
    matcher: /(?:)/,
  },
  {
    id: 'favorites',
    label: 'Favorites (Priority)',
    icon: '⭐',
    matcher: /(?:)/,
  },
  {
    id: 'faith',
    label: 'Faith & Spirituality',
    icon: '🕌',
    matcher:
      /\b(quran|islam|islamic|hadees|hadith|sunnat|zakir naik|muhammad ali mirza|prophet|ahle|azhari|masjid|deen|bayan|molana|maulana|shia|sunni|sufi|jashn|rekhta|surah|dua|allah|namaz|dargah|alra tv|mehrban ali|hanfi|madani|naat|islamic hub|sabeel|mufti|peer|peerzada|qadri|ilyas qadri|tariq jameel|saqib raza|attari)\b/i,
  },
  {
    id: 'tech',
    label: 'Tech & Dev',
    icon: '💻',
    matcher:
      /\b(flutter|python|javascript|typescript|react|angular|vue|golang|rust|cpp|coding|codebasics|programmer|programming|software|developer|devops|cloud|aws|docker|kubernetes|linux|terminal|backend|frontend|cyber|beebom|techie|technical sagar|google cloud|gyrus sulcus|dcod style|hacker|hacking|web dev|web development|app dev|computer science)\b/i,
  },
  {
    id: 'design',
    label: 'Design & 3D Creative',
    icon: '🎨',
    matcher:
      /\b(blender|photoshop|figma|animschool|phlearn|polygon runway|schaeferart|cg cookie|cg opinions|3d|vfx|cgi|drawing|illustration|illustrator|after effects|premiere pro|graphic design|typography|render|corridor crew|kk create|nafay 3d|black beard projects|diy|woodworking|craft|crafts|animation)\b/i,
  },
  {
    id: 'games',
    label: 'Gaming & Chess',
    icon: '🎮',
    matcher:
      /\b(chess|chessnetwork|thechesswebsite|game|games|gaming|gameplay|esports|gamer|minecraft|gta|pubg|freefire|walkthrough|games4two|strike & pocket)\b/i,
  },
  {
    id: 'food',
    label: 'Food & Cooking',
    icon: '🍔',
    matcher:
      /\b(recipe|recipes|cooking|kitchen|chef|street food|culinary|food pharmer|village food|food secrets|foodie|swad|zaika|baking|meal prep|rasoi|khana|tasty|taste|delicious)\b/i,
  },
  {
    id: 'news',
    label: 'News & Politics',
    icon: '📰',
    matcher:
      /\b(news|aaj tak|ndtv|bbc|cnn|hindustan times|the wire|the deshbhakt|inqalaab|theredmike|samachar|khabar|press|bulletin|times of india|lallantop|abp|republic|firstpost|middle east eye|knockingnews|politics|political|media|lok sabha|rajya sabha|parliament)\b/i,
  },
  {
    id: 'business',
    label: 'Business & Finance',
    icon: '💼',
    matcher:
      /\b(business|finance|crypto|bitcoin|stock|stocks|invest|investing|investor|startup|wealth|economy|economic|money|alex hormozi|garyvee|simon sinek|rahul malodia|entrepreneur|ecommerce|trading|market|sales|real estate|financial|venture|capital|sahil khanna)\b/i,
  },
  {
    id: 'education',
    label: 'Education & Learning',
    icon: '📚',
    matcher:
      /\b(study|study iq|studyiq|ias|upsc|ted-ed|tedx|crashcourse|academy|class101|arabicpod|learn english|english with|physics|chemistry|mathematics|history|science|scientist|facts|roshan facts|getsetflyscience|english addict|impressive english|lisan ul quran|thinktrek|tsmadaan|duncan|education|course|tutorial|lecture|professor|qasim ali shah|ali abdaal|learn|learning|ielts|toefl|knowledge|exam|how to|law advice|advocate|dr ram puniyani|dr sultan sikandar)\b/i,
  },
  {
    id: 'lifestyle',
    label: 'Health & Lifestyle',
    icon: '🏃',
    matcher:
      /\b(thenx|workout|fitness|gym|calisthenics|yoga|diet|health|fashion|teachingmensfashion|mensfashion|style|bikedekho|motovlog|vlog|vlogs|shridesh vlogs|travel|lifestyle|grooming|biker|automobile|car dekho|cars)\b/i,
  },
  {
    id: 'entertainment',
    label: 'Entertainment & Media',
    icon: '🎬',
    matcher:
      /\b(drama|turkish drama|movie|movies|cinema|films|film|bollywood|hollywood|music|songs|song|t-series|speed records|goldmines|comedy|timeliners|roast|funny|hilarious|sab tv|sony sab|colors gujarati|ultra bollywood|sonic enterprise|neeraj beniwal|cut|entertainment|series|clip|talent|drm drama|tlc uk|the social house)\b/i,
  },
  {
    id: 'other',
    label: 'Other Channels',
    icon: '📺',
    matcher: /(?:)/,
  },
];

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const categoryCache = new Map<string, CategoryConfig | null>();

export function getCategoryForChannel(sourceName: string): CategoryConfig | null {
  const cached = categoryCache.get(sourceName);
  if (cached !== undefined) return cached;

  for (const cat of CATEGORIES) {
    if (cat.id === 'favorites' || cat.id === 'active' || cat.id === 'other') continue;
    if (cat.matcher.test(sourceName)) {
      categoryCache.set(sourceName, cat);
      return cat;
    }
  }
  categoryCache.set(sourceName, null);
  return null;
}

export function classifyChannel(sourceName: string, isFav: boolean): CategoryId {
  if (isFav) return 'favorites';
  const cat = getCategoryForChannel(sourceName);
  return cat ? cat.id : 'other';
}

export const sortSources = (arr: TrackedSource[], filter: SortFilter): TrackedSource[] => {
  const copy = [...arr];
  switch (filter) {
    case 'newest':
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    case 'oldest':
      return copy.sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
    case 'a_z':
      return copy.sort((a, b) =>
        a.sourceName.localeCompare(b.sourceName, undefined, { sensitivity: 'base' })
      );
    case 'z_a':
      return copy.sort((a, b) =>
        b.sourceName.localeCompare(a.sourceName, undefined, { sensitivity: 'base' })
      );
  }
};

