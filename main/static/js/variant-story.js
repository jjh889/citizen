(function() {
  'use strict';

  // Mobile nav
  var toggle = document.getElementById('stToggle');
  var mobile = document.getElementById('stMobile');
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
  document.querySelectorAll('.st-reveal').forEach(function(el) { observer.observe(el); });

  // Pie chart animation
  var chartObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var fg = e.target.querySelector('.st-case__chart-fg');
        var percent = parseInt(e.target.getAttribute('data-st-percent'), 10);
        if (fg) {
          var r = parseFloat(fg.getAttribute('r'));
          var c = 2 * Math.PI * r;
          fg.setAttribute('stroke-dasharray', c);
          fg.setAttribute('stroke-dashoffset', c);
          // animate
          setTimeout(function() {
            fg.setAttribute('stroke-dashoffset', c * (1 - percent / 100));
          }, 50);
        }
        chartObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('[data-st-percent]').forEach(function(el) { chartObs.observe(el); });

  // FAQ
  document.querySelectorAll('.st-faq-item__q').forEach(function(btn) {
    btn.addEventListener('click', function() { btn.parentElement.classList.toggle('is-open'); });
  });

  // ============ DIAGNOSE QUIZ ============
  var stDiag = {
    answers: {},  // {1: 'value', 2: 'value', ...}
    currentStep: 1,
    totalQuestions: 5
  };

  var intro = document.getElementById('diagIntro');
  var quiz = document.getElementById('diagQuiz');
  var startBtn = document.getElementById('diagStart');
  var backBtn = document.getElementById('diagBack');
  var progressBar = document.getElementById('diagProgress');
  var stepCur = document.getElementById('diagStepCur');

  function showStep(n) {
    document.querySelectorAll('.st-quiz__step').forEach(function(el) {
      el.classList.remove('is-active');
    });
    var target = document.querySelector('.st-quiz__step[data-step="' + n + '"]');
    if (target) {
      target.classList.remove('[hidden]');
      target.hidden = false;
      target.classList.add('is-active');
    }
    stDiag.currentStep = n;
    if (stepCur) stepCur.textContent = Math.min(n, stDiag.totalQuestions);
    // progress
    if (progressBar) {
      var pct = Math.min(n / stDiag.totalQuestions, 1) * 100;
      progressBar.style.width = pct + '%';
    }
    // back button visibility
    if (backBtn) {
      backBtn.hidden = (n <= 1 || n >= 7);
    }
    // scroll into view
    if (quiz) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      intro.style.display = 'none';
      quiz.hidden = false;
      showStep(1);
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (stDiag.currentStep > 1) showStep(stDiag.currentStep - 1);
    });
  }

  // Option click → save answer and advance
  document.querySelectorAll('.st-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var q = btn.getAttribute('data-q');
      var v = btn.getAttribute('data-value');
      stDiag.answers[q] = v;
      // highlight (within same step)
      btn.parentElement.querySelectorAll('.st-opt').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      // advance
      var next = parseInt(q, 10) + 1;
      setTimeout(function() { showStep(next); }, 200);
    });
  });

  // Contact method toggle (phone vs kakao)
  var methodRadios = document.querySelectorAll('input[name="diagMethod"]');
  var contactInput = document.getElementById('diagContact');
  var contactLabel = document.getElementById('diagContactLabel');
  methodRadios.forEach(function(r) {
    r.addEventListener('change', function() {
      if (r.value === '카카오톡') {
        if (contactLabel) contactLabel.textContent = '카카오톡 ID';
        if (contactInput) { contactInput.type = 'text'; contactInput.placeholder = '@kakao_id'; }
      } else {
        if (contactLabel) contactLabel.textContent = '전화번호';
        if (contactInput) { contactInput.type = 'tel'; contactInput.placeholder = '010-0000-0000'; }
      }
    });
  });

  // Submit diagnose
  var submitBtn = document.getElementById('diagSubmit');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var name = (document.getElementById('diagName').value || '').trim();
      var contact = (document.getElementById('diagContact').value || '').trim();
      var method = document.querySelector('input[name="diagMethod"]:checked').value;
      var time = document.getElementById('diagTime').value;
      var agree = document.getElementById('diagAgree').checked;

      if (!name) { alert('이름 또는 닉네임을 입력해 주세요.'); return; }
      if (!contact) { alert('연락처를 입력해 주세요.'); return; }
      if (!agree) { alert('개인정보 수집·이용에 동의해 주세요.'); return; }

      // Build category from Q5
      var catMap = {
        '개인회생': '개인회생', '개인파산': '개인파산',
        '법인회생': '법인회생', '민사/형사': '민사',
        '가사/이혼': '가사/이혼', '전문가상담': '기타'
      };
      var category = catMap[stDiag.answers[5]] || '기타';

      // Build message
      var qLabels = {
        1: '주요 고민', 2: '채무 규모', 3: '소득 상태',
        4: '법적 절차', 5: '원하는 해결'
      };
      var lines = ['[1분 자가진단 결과]'];
      for (var i = 1; i <= 5; i++) {
        lines.push('- ' + qLabels[i] + ': ' + (stDiag.answers[i] || '-'));
      }
      lines.push('');
      lines.push('[연락 정보]');
      lines.push('- 연락 방법: ' + method);
      lines.push('- ' + (method === '카카오톡' ? '카카오 ID' : '전화') + ': ' + contact);
      if (time) lines.push('- 연락 가능 시간: ' + time);

      var message = lines.join('\n');

      // Format phone field for CRM (use contact as phone)
      var phoneValue = method === '카카오톡' ? ('카톡: ' + contact) : contact;

      submitBtn.disabled = true; submitBtn.textContent = '접수 중...';

      var diagnosis = {
        '주요 고민': stDiag.answers[1] || '',
        '채무 규모': stDiag.answers[2] || '',
        '소득 상태': stDiag.answers[3] || '',
        '법적 절차': stDiag.answers[4] || '',
        '원하는 해결': stDiag.answers[5] || '',
        '연락 방법': method,
        '연락 가능 시간': time || '가능한 빠르게',
      };

      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          phone: phoneValue,
          category: category,
          message: message,
          source: '자가진단',
          diagnosis: diagnosis,
        })
      }).then(function(r) {
        if (r.ok) {
          showStep(7);
        } else throw new Error();
      }).catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '무료 상담 신청 완료하기';
        alert('접수에 실패했습니다. 전화로 문의해 주세요.');
      });
    });
  }

  // Form
  var form = document.getElementById('stForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('.st-form__submit');
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
          form.innerHTML = '<div class="st-form__success"><strong>상담 신청이 접수되었습니다.</strong><p>내편이 되어 가장 빠른 시간 내에<br>직접 연락드리겠습니다.</p></div>';
        } else throw new Error();
      }).catch(function() {
        btn.disabled = false; btn.textContent = '무료 상담 신청하기';
        alert('접수에 실패했습니다. 전화로 문의해 주세요.');
      });
    });
  }
})();

// ===== HERO SLIDER =====
(function() {
  var slides = document.querySelectorAll('.st-hero__slide');
  var dots = document.querySelectorAll('.st-hero__dot');
  var current = 0, timer;

  function go(n) {
    current = (n + slides.length) % slides.length;
    slides.forEach(function(s, i) { s.classList.toggle('is-active', i === current); });
    dots.forEach(function(d, i) { d.classList.toggle('is-active', i === current); });
  }

  dots.forEach(function(d) {
    d.addEventListener('click', function() {
      go(parseInt(d.getAttribute('data-slide'), 10));
      clearInterval(timer);
      timer = setInterval(function() { go(current + 1); }, 7000);
    });
  });

  if (slides.length > 1) {
    timer = setInterval(function() { go(current + 1); }, 7000);
  }
})();

// ===== CASE STORY MODAL =====
function openStory(el) {
  var m = document.getElementById('stModal');
  if (!m) return;
  document.getElementById('stModalCat').textContent = el.getAttribute('data-story-cat');
  document.getElementById('stModalPct').textContent = el.getAttribute('data-story-pct') + '%';
  document.getElementById('stModalTitle').textContent = el.getAttribute('data-story-title');
  document.getElementById('stModalSituation').textContent = el.getAttribute('data-story-situation');
  document.getElementById('stModalStrategy').textContent = el.getAttribute('data-story-strategy');
  document.getElementById('stModalResult').textContent = el.getAttribute('data-story-result');
  document.getElementById('stModalComment').textContent = '"' + el.getAttribute('data-story-comment') + '"';
  m.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeStory() {
  var m = document.getElementById('stModal');
  if (m) { m.hidden = true; document.body.style.overflow = ''; }
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeStory(); });
