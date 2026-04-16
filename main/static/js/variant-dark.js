(function() {
  'use strict';

  // Scroll Progress Bar
  var progress = document.querySelector('.dl-progress');
  var header = document.querySelector('.dl-header');
  function onScroll() {
    var h = document.documentElement;
    var scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    if (progress) progress.style.width = scrolled + '%';
    if (header) {
      if (h.scrollTop > 40) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile Nav
  var toggle = document.getElementById('dlToggle');
  var mobileNav = document.getElementById('dlMobileNav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function() {
      mobileNav.classList.toggle('is-open');
    });
    mobileNav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { mobileNav.classList.remove('is-open'); });
    });
  }

  // Reveal on scroll
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.dl-reveal').forEach(function(el) { observer.observe(el); });

  // Counter animation
  var counted = false;
  var statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll('[data-dl-count]').forEach(function(el) {
          var target = parseInt(el.getAttribute('data-dl-count'), 10);
          var start = 0, duration = 1600, startTime = null;
          function step(t) {
            if (!startTime) startTime = t;
            var p = Math.min((t - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(eased * target).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target.toLocaleString();
          }
          requestAnimationFrame(step);
        });
      }
    });
  }, { threshold: 0.3 });
  var statsEl = document.querySelector('.dl-stats');
  if (statsEl) statsObserver.observe(statsEl);

  // FAQ accordion
  document.querySelectorAll('.dl-faq-item__q').forEach(function(btn) {
    btn.addEventListener('click', function() {
      btn.parentElement.classList.toggle('is-open');
    });
  });

  // Consult form
  var form = document.getElementById('dlForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.dl-form__submit');
      btn.disabled = true; btn.textContent = '접수 중...';
      var data = {
        name: form.name.value,
        phone: form.phone.value,
        category: form.category.value,
        message: form.message.value
      };
      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(r) {
        if (r.ok) {
          form.innerHTML = '<div class="dl-form__success"><strong>상담 신청이 접수되었습니다.</strong>빠른 시일 내에 연락드리겠습니다.</div>';
        } else throw new Error();
      }).catch(function() {
        btn.disabled = false; btn.textContent = '상담 신청';
        alert('접수에 실패했습니다. 전화로 문의해 주세요.');
      });
    });
  }
})();
