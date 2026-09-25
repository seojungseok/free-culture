export type SiteNavItem = { href: string; label: string };

export function headerNavigation(seasonLabel: string): { primary: SiteNavItem[]; more: SiteNavItem[] } {
  return {
    primary: [
      { href: "/weekend", label: "이번 주말" },
      { href: "/plan", label: "맞춤 추천" },
      { href: "/saved", label: "보관함" },
      { href: "/events", label: "문화행사" },
      { href: "/places", label: "나들이" },
      { href: "/course", label: "여행코스" },
      { href: "/camping", label: "캠핑" },
      { href: "/weekend-prep", label: "준비 가이드" },
    ],
    more: [
      { href: "/pet-travel", label: "반려동물 여행" },
      { href: "/city-tour", label: "시티투어" },
      { href: "/food", label: "맛집 탐방" },
      { href: "/kids", label: "아이와 함께" },
      { href: "/date", label: "데이트" },
      { href: "/season", label: `${seasonLabel} 나들이` },
    ],
  };
}
