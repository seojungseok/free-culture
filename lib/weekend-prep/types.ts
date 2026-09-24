export const PREP_CATEGORIES = ['요리 재료 체크리스트', '캠핑요리 가이드', '캠핑용품', '야외 놀이', '피크닉 준비', '여행 준비'] as const;
export type PrepImage = {url: string; alt: string; width: number; height: number; generated: boolean; usageNotice?: string};
export type PrepChecklistItem = {id: string; label: string; role: string; group: 'main' | 'seasoning' | 'common'};
export type PrepArticle = {slug: string; title: string; description: string; category: typeof PREP_CATEGORIES[number]; coverLabel?: string;
  introduction?: {heading: string; text: string}; imageConnectionNote?: string; checklist?: PrepChecklistItem[];
  status: 'draft' | 'scheduled' | 'published'; publishAt: string; updatedAt: string; reviewed: boolean;
  cover: PrepImage; sections: {heading: string; text: string; image?: PrepImage}[];
  internalLinks: {href: string; label: string}[]};
export type PrepStore = {version: number; articles: PrepArticle[]};
