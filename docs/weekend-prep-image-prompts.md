# 초기 이미지 생성 기록

## 18개 초안 썸네일 확장

새 글 17개에는 내장 imagegen으로 주제별 서로 다른 한글 감성 썸네일을 생성했다. 입력 프롬프트, 바비큐 작업대 수정 프롬프트, 원본 파일 및 최종 프로젝트 경로는 `data/weekend-prep-image-batch.json`을 참고한다. 최종 경로는 `public/prep-images/<slug>-cover-v1.webp`. 모두 육안 검토했고 한글 문구와 AI 연출 표시가 있다. 실제 상품 재현으로 주장하지 않는다. 기존 피크닉 대표·본문 이미지는 유지한다.

도구: 내장 imagegen. 생성 원본은 Codex 이미지 폴더에 보존하고 프로젝트용은 WebP 1200×800으로 압축했다.

## 원본 장면 — public/prep-images/picnic-scene.webp

Use case: photorealistic-natural. Editorial landscape photograph for Korean weekend preparation guide about packing a light picnic. Warm natural late afternoon light in a quiet park, a simple neutral picnic mat with a reusable lunch box, small reusable water bottle, folded cloth napkin and small tote, modest realistic arrangement, grass and softly blurred trees. No text, no brands, no product packaging, no invented features. Lifestyle concept illustration, not an actual specific commercial product photograph. Landscape 3:2.

## 대표 이미지 — public/prep-images/picnic-korean-cover.webp

Edit the supplied picnic editorial photograph into a refined Korean weekend article thumbnail. Preserve the picnic scene, lighting, mat, food, bottle and bag. Add elegant highly legible Korean typography in warm ivory with subtle dark translucent gradient behind text only in upper left negative space. Exact Korean main headline on two balanced lines: '가볍게 챙긴 오후'. Smaller subtitle underneath: '우리만의 작은 피크닉'. Small bottom left disclosure text: 'AI 연출 이미지'. Calm emotional magazine cover aesthetic, elegant bold Korean sans serif, no logos, no sale language, no extra words. Maintain landscape framing and readability on a small mobile card.

## 본문 준비 장면 — public/prep-images/picnic-packing.webp

Use case photorealistic-natural. Landscape Korean weekend picnic preparation editorial photograph. Top down view on a warm wooden table at home: open neutral tote, folded picnic cloth, closed reusable lunch container, small plain water bottle, folded cleaning cloth, and two plain small bags separated for wet and dry used items. Hands arranging the packing, natural morning light. This is a practical packing demonstration, not an outdoor scene. No logos, no packaging claims, no product brands. Tiny subtle legible Korean caption at bottom: 'AI 연출 이미지'. No main headline. 3:2 landscape, restrained warm emotional magazine aesthetic.

글에 사용한 AI 이미지는 대표1+본문1=2장. 원본 장면은 중복 삽입하지 않는다. 최대4장 제한 적용.
