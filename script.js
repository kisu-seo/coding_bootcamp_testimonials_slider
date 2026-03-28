// 1. 필요한 HTML 요소(DOM)들을 모두 찾아 '변수'에 저장합니다. (마치 요리할 재료를 도마 위에 올려두는 것과 같아요!)
const track = document.getElementById('slider-track');     // 긴 필름 (이것을 좌우로 밀어서 넘길 예정입니다.)
const slides = document.querySelectorAll('.slide');        // 개별 사진들 (슬라이드 아이템들)
const prevBtn = document.getElementById('prev-btn');       // 이전 버튼
const nextBtn = document.getElementById('next-btn');       // 다음 버튼

// 2. 현재 몇 번째 슬라이드(사진)를 보고 있는지 기억하는 '상태 변수'입니다. (프로그래밍에서는 첫 리스트를 0부터 셉니다)
let currentIndex = 0; 

// 터치 스와이프를 지원하기 위한 변수 공간 마련 (어디서 누르기 시작했고, 어디서 뗐는지)
let touchStartX = 0;
let touchEndX = 0;

/**
 * 3. 핵심 로직: 슬라이드를 넘기는(화면을 바꾸는) 메인 함수입니다. (The Flow)
 * @param {number} index - 보여줄 슬라이드의 번호 (예: 0번, 1번...)
 */
function goToSlide(index) {
  // 예외 처리: 인덱스가 범위를 벗어나지 않게 안전장치를 둡니다. (0보다 작으면 맨 끝으로, 맨 끝보다 커지면 0으로 순환)
  if (index < 0) {
    currentIndex = slides.length - 1;
  } else if (index >= slides.length) {
    currentIndex = 0;
  } else {
    currentIndex = index;
  }

  // 수학 계산: 필름 전체(track)를 몇 %만큼 왼쪽으로 밀어낼지 계산합니다. (1번 슬라이드면 -100% 만큼 밀고, 0번이면 0%)
  const translateX = -(currentIndex * 100); 
  
  // 자바스크립트로 CSS 속성(transform)을 덮어씌워서 화면을 부드럽게 옆으로 밀어버립니다.
  track.style.transform = `translateX(${translateX}%)`;

  // 접근성(A11y) 업데이트 로직: 스크린 리더 사용자에게 "지금 이 슬라이드가 보입니다/안 보입니다"라고 알려줍니다.
  slides.forEach((slide, i) => {
    if (i === currentIndex) {
      slide.setAttribute('aria-hidden', 'false'); // 현재화면은 보이게
    } else {
      slide.setAttribute('aria-hidden', 'true');  // 다른화면은 숨김처리
    }
  });
}

// --------- 4. 이벤트 감지 구역 (Event Listeners) ---------
// 마우스나 손가락, 키보드가 닿기를 항상 기다리다가, 신호가 오면 함수를 발동시킵니다.

// (1) 마우스 클릭 감지: 이전/다음 버튼을 누르면 인덱스 번호를 +1 하거나 -1 합니다.
nextBtn.addEventListener('click', () => {
  goToSlide(currentIndex + 1); // "다음 번호 사진 띄워줘!"
});

prevBtn.addEventListener('click', () => {
  goToSlide(currentIndex - 1); // "이전 번호 사진 띄워줘!"
});

// (2) 키보드 방향키 감지: 접근성과 데스크톱 유저 편의성을 위해 키보드(→, ←) 조작을 연결합니다.
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    goToSlide(currentIndex + 1); // 오른쪽 화살표: 다음
  } else if (event.key === 'ArrowLeft') {
    goToSlide(currentIndex - 1); // 왼쪽 화살표: 이전
  }
});

// (3) 모바일 터치(스와이프) 감지 (선택적 구현): 화면을 빙그르르 넘길 수 있게 해 줍니다.
// 손가락이 화면에 닿기 시작할 때 X 좌표(가로 위치)를 기억합니다.
track.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].screenX;
});

// 손가락이 화면에서 떨어질 때 X 좌표를 기록하고 어느 쪽으로 밀었는지 판별합니다.
track.addEventListener('touchend', (event) => {
  touchEndX = event.changedTouches[0].screenX;
  handleGesture(); // 밀어붙인 방향을 분석하는 함수 실행
});

// 어느 쪽으로 스와이프 했는지 계산하는 헬퍼 함수입니다.
function handleGesture() {
  // 스와이프 길이 (시작점 - 끝점) 가 50px 보다 클 때 오른쪽(다음)으로 민 것으로 판별
  if (touchStartX - touchEndX > 50) { 
    goToSlide(currentIndex + 1); // 손가락을 왼쪽으로 튕겼다면 다음사진
  }
  
  // 반대의 경우 50px이 넘으면 왼쪽(이전)사진으로 이동
  if (touchEndX - touchStartX > 50) {
    goToSlide(currentIndex - 1);
  }
}

// 5. 초기화 세팅: 처음 사이트 접속 시 0번 코너(첫 슬라이드)를 강제로 한번 렌더링해주어 꼬이지 않게 잡아줍니다.
goToSlide(0);
