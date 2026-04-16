(function() {
  'use strict';

  // Mobile nav
  var toggle = document.getElementById('coToggle');
  var mobile = document.getElementById('coMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function() { mobile.classList.toggle('is-open'); });
    mobile.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { mobile.classList.remove('is-open'); });
    });
  }

  // Reveal
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.co-reveal').forEach(function(el) { observer.observe(el); });

  // Counter
  var counted = false;
  var statsObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll('[data-co-count]').forEach(function(el) {
          var target = parseInt(el.getAttribute('data-co-count'), 10);
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
  var stats = document.querySelector('.co-stats');
  if (stats) statsObs.observe(stats);

  // FAQ accordion
  document.querySelectorAll('.co-faq-item__q').forEach(function(btn) {
    btn.addEventListener('click', function() { btn.parentElement.classList.toggle('is-open'); });
  });

  // Form
  var form = document.getElementById('coForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.co-form__submit');
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
          form.innerHTML = '<div class="co-form__success"><strong>상담 신청이 접수되었습니다.</strong><p>전문 변호사가 직접 연락드립니다.<br>감사합니다.</p></div>';
        } else throw new Error();
      }).catch(function() {
        btn.disabled = false; btn.textContent = '상담 신청';
        alert('접수에 실패했습니다.');
      });
    });
  }
})();
