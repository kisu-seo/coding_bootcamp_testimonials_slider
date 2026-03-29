/**
 * @fileoverview 코딩 부트캠프 후기 슬라이더 — 전체 인터랙션 로직
 *
 * [아키텍처 설명]
 * 이 파일은 슬라이더의 모든 인터랙션(버튼 클릭, 키보드, 터치 스와이프)을
 * 하나의 IIFE(즉시 실행 함수) 안에서 처리합니다.
 *
 * [IIFE를 사용하는 이유]
 * IIFE(Immediately Invoked Function Expression)는 정의되자마자 즉시 실행되는 함수입니다.
 * 함수 안의 변수(currentIndex 등)는 함수 '격리된 방' 안에서만 존재하므로
 * 전역 스코프(window)를 오염시키지 않습니다.
 * 비유: 다른 JS 파일과 변수명이 충돌해도 각자의 방 안에 있으므로 서로 간섭하지 않습니다.
 *
 * ⚠️ 주의: 이 파일의 함수나 변수에 외부에서 접근할 필요가 생기면
 *           IIFE 대신 ES 모듈(import/export) 패턴으로 리팩토링을 고려하세요.
 */
(() => {

  // =========================================
  // 상수 (Constants)
  // — 매직 넘버(의미 없는 숫자)를 이름 있는 상수로 추상화합니다.
  //   이 값을 바꾸고 싶을 때 코드 전체를 뒤질 필요 없이 여기서만 수정합니다.
  // =========================================

  /**
   * 스와이프 판정 최소 거리 (단위: px)
   * 이 값 미만의 짧은 터치는 '스와이프'가 아닌 '탭'으로 간주하여 무시합니다.
   * 너무 작으면 사용자가 화면을 살짝 건드릴 때도 슬라이드가 넘어가는 오작동이 발생합니다.
   * 너무 크면 명확한 스와이프도 무시되어 반응성이 떨어집니다.
   */
  const SWIPE_THRESHOLD = 50;

  // =========================================
  // DOM 요소 참조 (DOM References)
  // — 반복적으로 쓰이는 DOM 요소를 미리 변수에 저장하여 성능을 최적화합니다.
  //   이벤트가 발생할 때마다 getElementById를 호출하면 매번 DOM 트리를 검색하므로 비효율적입니다.
  // =========================================

  /** 슬라이드 필름(track) 요소 — translateX를 적용하는 직접 대상 */
  const track   = document.getElementById('slider-track');
  /** 모든 슬라이드 요소 목록 — 슬라이드 수 계산과 aria-hidden 업데이트에 사용 */
  const slides  = document.querySelectorAll('.slide');
  /** 이전 버튼 */
  const prevBtn = document.getElementById('prev-btn');
  /** 다음 버튼 */
  const nextBtn = document.getElementById('next-btn');

  // =========================================
  // 상태 변수 (State)
  // — 슬라이더가 현재 어떤 상태인지 기억하는 변수들입니다.
  //   React의 useState와 동일한 역할을 Vanilla JS로 구현한 것입니다.
  // =========================================

  /** 현재 보여주고 있는 슬라이드의 인덱스 (0부터 시작) */
  let currentIndex = 0;

  /**
   * 터치 시작 시 손가락의 X 좌표 (스와이프 방향 계산용)
   * touchstart 이벤트에서 기록하고, touchend 이벤트에서 비교합니다.
   */
  let touchStartX = 0;

  // =========================================
  // 핵심 함수 (Core Function)
  // =========================================

  /**
   * 지정한 인덱스의 슬라이드로 화면을 전환합니다.
   * 슬라이더의 모든 인터랙션(클릭, 키보드, 스와이프)이 최종적으로 이 함수를 호출합니다.
   *
   * @param {number} index - 이동할 슬라이드 번호. 범위를 벗어나도 자동으로 순환합니다.
   *   예) 슬라이드 2개 기준:
   *       index = 2  → 0 (마지막에서 다음 → 첫 번째로 순환)
   *       index = -1 → 1 (첫 번째에서 이전 → 마지막으로 순환)
   * @returns {void}
   *
   * [나머지 연산(%)으로 무한 순환을 구현하는 원리]
   * 공식: currentIndex = (index + slides.length) % slides.length
   *
   * 왜 단순히 index % slides.length가 아닌가?
   * JavaScript의 % 연산자는 음수에서 음수 결과를 반환합니다.
   *   예) -1 % 2 = -1  (우리가 원하는 건 1)
   * index에 slides.length를 더하면 음수가 되는 것을 방지합니다.
   *   예) (-1 + 2) % 2 = 1 % 2 = 1  ✓
   *       ( 2 + 2) % 2 = 4 % 2 = 0  ✓
   */
  function goToSlide(index) {
    // 범위 초과/미만 인덱스를 슬라이드 수 안으로 순환시킵니다
    currentIndex = (index + slides.length) % slides.length;

    // 필름(track)을 currentIndex * 100% 만큼 왼쪽으로 밀어 해당 슬라이드를 창문 앞으로 가져옵니다.
    // 예) currentIndex = 1 → translateX(-100%) → 두 번째 슬라이드가 창문 앞으로 옵니다.
    track.style.transform = `translateX(${-currentIndex * 100}%)`;

    // [접근성] 보이는 슬라이드만 스크린 리더가 읽도록 aria-hidden을 갱신합니다.
    // 화면 밖에 있는 슬라이드까지 읽으면 시각 장애인 사용자에게 혼란을 줍니다.
    slides.forEach((slide, i) => {
      // i === currentIndex인 슬라이드만 false(읽기 허용), 나머지는 true(읽기 차단)
      slide.setAttribute('aria-hidden', String(i !== currentIndex));
    });
  }

  // =========================================
  // 이벤트 리스너 (Event Listeners)
  // — 사용자의 3가지 조작 방식을 모두 감지합니다.
  // =========================================

  // [1] 버튼 클릭 — 마우스 사용자용
  // 화살표 버튼을 클릭하면 currentIndex를 ±1 합니다.
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));

  // [2] 키보드 방향키 — 키보드 사용자 및 접근성 대응
  // document 전체에 리스너를 달아 포커스 위치와 관계없이 항상 작동합니다.
  // ⚠️ 주의: 이 리스너는 페이지 전체에 달려 있으므로, 나중에 입력 필드(<input>)가
  //           추가된다면 입력 중 방향키 조작을 막는 예외 처리가 필요합니다.
  document.addEventListener('keydown', ({ key }) => {
    if (key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (key === 'ArrowLeft')  goToSlide(currentIndex - 1);
  });

  // [3] 터치 스와이프 — 모바일/태블릿 터치 사용자용
  //
  // [passive: true를 사용하는 이유 — 스크롤 성능 최적화]
  // 브라우저는 touchstart 이벤트가 발생하면 기본적으로 "이 JS가 스크롤을 막을 수도 있다"고 판단해
  // 스크롤 처리를 잠시 기다립니다(~100ms). 이 대기가 스크롤을 버벅이게 만드는 원인입니다.
  // { passive: true }를 추가하면 "이 리스너는 절대 스크롤을 막지 않겠다"고 선언하는 것이므로
  // 브라우저가 기다리지 않고 스크롤을 즉시 처리합니다.
  // ⚠️ 주의: passive: true가 적용된 리스너 안에서 e.preventDefault()를 호출하면 오류가 발생합니다.

  // 손가락이 화면에 닿는 순간 X 좌표를 기록합니다.
  track.addEventListener('touchstart', ({ changedTouches }) => {
    touchStartX = changedTouches[0].screenX; // 첫 번째 터치 포인트의 화면 X 좌표
  }, { passive: true });

  // 손가락을 뗄 때 이동 거리(delta)를 계산해 방향을 결정합니다.
  track.addEventListener('touchend', ({ changedTouches }) => {
    // delta > 0: 손가락이 왼쪽으로 이동 → 다음 슬라이드
    // delta < 0: 손가락이 오른쪽으로 이동 → 이전 슬라이드
    const delta = touchStartX - changedTouches[0].screenX;

    // SWIPE_THRESHOLD(50px) 미만의 짧은 이동은 스와이프로 인정하지 않고 무시합니다.
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    // 삼항 연산자: delta > 0이면 +1(다음), delta < 0이면 -1(이전)
    goToSlide(currentIndex + (delta > 0 ? 1 : -1));
  }, { passive: true });

  // =========================================
  // 초기화 (Initialization)
  // =========================================

  // 페이지 로드 시 0번 슬라이드를 렌더링합니다.
  // HTML에서 첫 번째 슬라이드에 aria-hidden="false"를 설정해두었지만,
  // goToSlide(0)를 명시적으로 호출하여 CSS 위치(translateX)와
  // aria-hidden 상태를 JS 로직 기준으로 정확히 초기화합니다.
  // ⚠️ 주의: 이 호출을 제거하면 HTML 마크업과 JS 상태가 불일치하여
  //           첫 슬라이드 전환 시 aria-hidden이 잘못 설정될 수 있습니다.
  goToSlide(0);

})();
