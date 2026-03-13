/* ==========================================================================
   법률사무소 시민 - JavaScript
   최소한의 인터랙션만 처리
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 모바일 메뉴 토글 ---------- */
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    });

    /* 메뉴 링크 클릭 시 닫기 (nav__link + nav__bottom 내부 링크 포함) */
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', '메뉴 열기');
      });
    }
  }

  /* ---------- 헤더 스크롤 효과 ---------- */
  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  /* ---------- 숫자 카운트업 애니메이션 ---------- */
  var stats = document.querySelectorAll('[data-target]');
  var statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;

    var statsSection = document.querySelector('.hero__stats');
    if (!statsSection) return;

    var rect = statsSection.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    statsAnimated = true;

    stats.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var duration = 1500;
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        /* easeOutQuart */
        var ease = 1 - Math.pow(1 - progress, 4);
        var current = Math.floor(ease * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString();
        }
      }

      requestAnimationFrame(step);
    });
  }

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  function initFadeIn() {
    /* 애니메이션 대상 요소에 fade-in 클래스 추가 */
    var targets = document.querySelectorAll(
      '.service-card, .about__content, .recovery__card, .civil__card, ' +
      '.corporate__content, .cta__inner, .location__content'
    );

    targets.forEach(function (el) {
      el.classList.add('fade-in');
    });

    function checkVisibility() {
      targets.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var threshold = window.innerHeight * 0.85;
        if (rect.top < threshold) {
          el.classList.add('is-visible');
        }
      });
      animateStats();
    }

    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility(); /* 초기 체크 */
  }

  /* DOM 로드 후 초기화 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFadeIn);
  } else {
    initFadeIn();
  }

})();
