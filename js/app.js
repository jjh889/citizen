/* 모바일 햄버거 메뉴 토글 */
(function () {
  'use strict';

  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('mainNav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  });

  /* 메뉴 링크 클릭 시 모바일 메뉴 닫기 */
  var links = nav.querySelectorAll('.nav__link');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '메뉴 열기');
    });
  }
})();
