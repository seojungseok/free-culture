# 캠핑 볶음요리 5편 조사·검토 기록 (2026-09-14)

## 적용 범위

- 기존 주말 준비물 글 6편은 수정하지 않았다.
- 새 글은 캠핑 제육볶음, 순대볶음, 닭갈비, 오징어볶음, 김치볶음밥 5편이다.
- 독자가 현장에서 그대로 따라 할 수 있도록 계량, 손질 크기, 예열, 투입 순서, 완성 신호, 실패 복구, 간편식 대안을 모두 넣었다.
- 조리시간은 재료 두께와 화력에 따라 달라질 수 있으므로 시간과 함께 눈으로 확인하는 익음 신호를 적었다.

## 레시피 근거

- 제육볶음: Maangchi의 spicy pork recipe에서 얇은 돼지고기와 양념 구성, 중강불 조리, 완전 가열 흐름을 확인했다.
  https://www.maangchi.com/recipe/dwaejigogi-bokkeum
- 순대볶음: KBS 편스토랑 영상의 순대 500g·양배추 300g 구성과 양념이 타지 않도록 중불을 유지하는 핵심을 확인했다.
  https://www.youtube.com/watch?v=fZ868_elC80
- 닭갈비: Maangchi의 dakgalbi recipe에서 양배추를 바닥에 두는 구성, 처음 증기를 올린 뒤 중불로 익히는 순서, 닭과 고구마의 완전 가열 확인을 참고했다.
  https://www.maangchi.com/recipe/dakgalbi
- 오징어볶음: Maangchi의 ojingeo-bokkeum recipe에서 채소를 먼저 익히고 오징어는 불투명해질 때까지만 짧게 조리하며 전분물로 마무리하는 흐름을 확인했다.
  https://www.maangchi.com/recipe/ojingeo-bokkeum/comment-page-4
- 김치볶음밥: Maangchi의 kimchi-bokkeumbap recipe에서 김치를 먼저 볶고 밥을 넣어 수분을 조절하며 참기름은 불을 끈 뒤 넣는 흐름을 참고했다.
  https://www.maangchi.com/recipe/kimchi-bokkeumbap/comment-page-2
- 캠핑 식품 안전: USDA FSIS의 캠핑 중 식품 보관·교차오염 방지 안내를 확인했다.
  https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/food-safety-while-hiking-camping

## 상품·이미지 검토

- 상품 조회는 모두 `scripts/prep/coupang.mjs`의 공용 제한기를 거쳤다.
- 60초당 요청·상품 각각 최대 10개, 요청 시작 간격 6.1초 이상을 적용했다.
- 선택한 상품의 상품번호, API가 반환한 원본 제휴 URL, 상품명, 선택 옵션, 원본 사진을 대조했다.
- 가격, 할인율, 배송일, 별점, 개인 사용 후기는 글에 쓰지 않았다.
- 생성 이미지 15장은 각 글마다 대표 1장·준비 1장·조리 1장으로 구성했다. 원본 상품 사진은 `referenceProducts`에 기록하고 사진의 `+` 좌표와 장면 속 품목을 대조했다.
- 대표 이미지에는 감성 한글 제목을 넣었고, 모든 이미지에 AI 연출 고지 문구를 연결했다.

## 제외한 검색 결과

- 상품번호 `6077904634`는 검색어와 달리 김치볶음밥으로 확인되지 않아 사용하지 않았다.
- 같은 상품번호가 두 검색어에서 반복된 경우 한 번만 등록했다.
