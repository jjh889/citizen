(function() {
  'use strict';

  // ===== Hero Slider =====
  var slides = document.querySelectorAll('.pr-hero__slide');
  var dots = document.querySelectorAll('.pr-hero__dot');
  var counter = document.getElementById('prCounter');
  var totalEl = document.getElementById('prTotal');
  var prevBtn = document.getElementById('prPrev');
  var nextBtn = document.getElementById('prNext');
  var current = 0;
  var autoplay;

  function go(idx) {
    if (!slides.length) return;
    current = (idx + slides.length) % slides.length;
    slides.forEach(function(s, i) {
      s.classList.toggle('is-active', i === current);
    });
    dots.forEach(function(d, i) {
      d.classList.toggle('is-active', i === current);
    });
    if (counter) counter.textContent = String(current + 1).padStart(2, '0');
  }

  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  function startAuto() {
    stopAuto();
    autoplay = setInterval(next, 6000);
  }
  function stopAuto() {
    if (autoplay) clearInterval(autoplay);
  }

  if (slides.length > 0) {
    if (totalEl) totalEl.textContent = String(slides.length).padStart(2, '0');
    dots.forEach(function(d, i) {
      d.addEventListener('click', function() { go(i); startAuto(); });
    });
    if (prevBtn) prevBtn.addEventListener('click', function() { prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { next(); startAuto(); });
    go(0);
    startAuto();
  }

  // ===== Mobile nav =====
  var toggle = document.getElementById('prToggle');
  var mobile = document.getElementById('prMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function() { mobile.classList.toggle('is-open'); });
    mobile.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { mobile.classList.remove('is-open'); });
    });
  }

  // ===== Reveal =====
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.pr-reveal').forEach(function(el) { observer.observe(el); });

  // ===== Counter (about stats) =====
  var counted = false;
  var statsObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll('[data-pr-count]').forEach(function(el) {
          var target = parseInt(el.getAttribute('data-pr-count'), 10);
          var duration = 1800, startTime = null;
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
  var stats = document.querySelector('.pr-about__stats');
  if (stats) statsObs.observe(stats);

  // ===== FAQ =====
  document.querySelectorAll('.pr-faq-item__q').forEach(function(btn) {
    btn.addEventListener('click', function() { btn.parentElement.classList.toggle('is-open'); });
  });

  // ===== Form =====
  var form = document.getElementById('prForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.pr-form__submit');
      btn.disabled = true; btn.textContent = '접수 중...';
      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value, phone: form.phone.value,
          category: form.category.value, message: form.message.value
        })
      }).then(function(r) {
        if (r.ok) {
          form.innerHTML = '<div class="pr-form__success"><strong>상담 신청이 접수되었습니다.</strong><p>전문 변호사가 직접 연락드리겠습니다.<br>감사합니다.</p></div>';
        } else throw new Error();
      }).catch(function() {
        btn.disabled = false; btn.textContent = '상담 신청';
        alert('접수에 실패했습니다.');
      });
    });
  }
})();
