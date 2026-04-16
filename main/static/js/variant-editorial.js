(function() {
  'use strict';

  var toggle = document.getElementById('edToggle');
  var mobile = document.getElementById('edMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function() { mobile.classList.toggle('is-open'); });
    mobile.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { mobile.classList.remove('is-open'); });
    });
  }

  // Reveal on scroll
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.ed-reveal').forEach(function(el) { observer.observe(el); });

  // Counter animation for stats
  var counted = false;
  var statsObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll('[data-ed-count]').forEach(function(el) {
          var target = parseInt(el.getAttribute('data-ed-count'), 10);
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
  var stats = document.querySelector('.ed-stats');
  if (stats) statsObs.observe(stats);

  // FAQ
  document.querySelectorAll('.ed-faq-item__q').forEach(function(btn) {
    btn.addEventListener('click', function() { btn.parentElement.classList.toggle('is-open'); });
  });

  // Form
  var form = document.getElementById('edForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.ed-form__submit');
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
          form.innerHTML = '<div class="ed-form__success"><strong>Thank You.</strong>상담 신청이 접수되었습니다.<br>빠른 시간 내 연락드립니다.</div>';
        } else throw new Error();
      }).catch(function() {
        btn.disabled = false; btn.textContent = '상담 신청';
        alert('접수에 실패했습니다.');
      });
    });
  }
})();
