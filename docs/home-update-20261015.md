# 2026-10-15 홈페이지 주소·자동 점검·가을겨울 광고 수정

- 속초문화원 원본 메일(2026-10-15 09:01 KST)과 새 공식 사이트의 기관명·주소·연락처·문화강좌 확인. 홈페이지는 https://sokchocul.or.kr/ 로 수정. 본문 출처의 기존 도메인 제거. 자동 수집·런타임에서도 ID 130344의 검증된 주소를 우선한다. 기존 글·발행 상태·내부 URL 유지.
- 실패 실행 38652650450(2026-10-15 KST)은 경주 축제 API 시간 초과. 전날 38485930261에는 여러 공공 API의 통신 실패가 있었다. 성공한 데이터 커밋을 사이트 전체 배포 실패로 해석하지 않는다.
- 지역 API는 30초 제한, 최대 3회, 2초/4초 대기 후 재시도. XML/JSON 게이트웨이 오류를 구분하고 인증·형식 오류는 즉시 실패. 일시 장애만 마지막 확인 72시간 이내에 한해 갱신 연기로 기록한다. 기존 자료와 원래 확인시각 보존, 장기 장애는 실패 유지. 실제 요청 횟수와 지역별 결과를 작업 요약에 남긴다.
- 울산 API의 실제 rfcOpenApi 응답 구조를 지원해 정상 데이터를 누락하던 부분 수정.
- 광고: 어묵탕·블랙커피·컵라면 AI 연출 사진 3종. 상품명·옵션·가격·링크는 검증된 토스 피드 사용. 어묵과 커피는 정규 재확인 대상에 추가해 하루특가 종료 후에도 상품 검증이 통과하면 사용한다. 커피 캔디 등 다른 상품에 커피 장면을 연결하지 않는다.
- 세 이미지 모두 기존 camp-pork-v5.webp와 같은 2170×725 WebP. CSS·광고 박스 높이·메인 영역 순서 보존. 사진은 일반 연출이며 실제 상품의 조리 결과가 아님을 표시한다. 판매량이나 판매 순위는 주장하지 않는다.
- 내장 image_gen 사용. 최종 파일: public/affiliate-images/winter-fishcake-20261015.webp, autumn-coffee-20261015.webp, winter-ramen-20261015.webp.

## 생성 프롬프트

### 1

Use case: ads-marketing. Generate ONE premium photorealistic Korean autumn/winter camping food banner background. Output a very wide horizontal image with EXACT aspect ratio 2170:725, matching an existing website advertisement; absolutely no square or portrait format. Scene: a chilly lakeside campsite in late autumn at blue hour, subtly frosted forest and a canvas tent glowing amber in the far background. Main subject on RIGHT 60%: a small stainless steel pot of clear Korean fishcake soup with several wooden skewers of folded beige fishcake, radish slices and green onion, realistic delicate steam rising, placed on a rustic wooden outdoor table, appetizing natural food styling. Warm lantern nearby, no fire or stove in an enclosed tent. LEFT 40% is dark uncluttered blurred pine forest and lake, usable negative space for white website headline; no objects dominating left area. Close cinematic food photography, refined warm amber and cool teal lighting, real materials, no people, no logo, no packaging, NO letters, NO text, no prices, no badges, no watermark. This is an illustrative meal scene, not an exact product depiction. Do not add bowls of unrelated dishes. Preserve wide low-height composition.

### 2

Use case: ads-marketing. Create ONE photorealistic premium Korean cold-season weekend travel advertising background, very wide horizontal aspect ratio EXACTLY 2170:725. Main subject on RIGHT 60%: two simple matte cream ceramic mugs filled with black coffee (NO milk, no latte art), delicate realistic steam rising in crisp cool air, on a wood outdoor terrace ledge; a folded rust orange wool scarf and pine cone are tasteful supporting objects. Background is softly focused golden autumn forest transitioning into lightly snow dusted distant mountains with morning sunlight. LEFT 40% is dark, beautifully blurred forest with clean empty space for website white text. Editorial lifestyle photography, warm brown and amber highlights against deep forest green, elegant tactile ceramics and natural fabric. Entire composition must work as a low-height wide banner, objects large at right-center. No people, no branding, no packages, NO text, letters, prices, graphics, logos or watermark. This is a generic coffee serving scene, not a branded product photo.

### 3

Use case: ads-marketing. Generate ONE premium photorealistic advertising background for a Korean autumn and winter camping website. EXACT very wide horizontal aspect ratio 2170:725, preserving a current banner format. Subject on RIGHT 60%: one open simple unbranded paper noodle cup full of Korean spicy reddish-brown instant noodles, thin wavy noodles lifted naturally by wooden chopsticks held off-camera, realistic steam. The cup is plainly ivory with no text or branding, with small bits of green onion and dried vegetables in broth; no luxurious meat, no seafood, no egg, do not imply extra ingredients supplied with a product. Place it on a camping table beside a metal thermos at a mountain campsite, cool autumn evening, burgundy leaves, warmly illuminated canvas tent in soft background. LEFT 40% deep dark forest and soft bokeh, unobstructed negative space for white website copy. Food photography, rich amber light on noodles, restrained cozy red and forest blue palette, crisp textures, believable scale. No visible people, NO text, letters, logos, prices, badges or watermark. This is an illustrative serving scene, not an exact branded product depiction. Must be wide and low, not square or portrait.
