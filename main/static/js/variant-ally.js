(function() {
  'use strict';

  // Mobile nav
  var toggle = document.getElementById('alToggle');
  var mobile = document.getElementById('alMobile');
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
  document.querySelectorAll('.al-reveal').forEach(function(el) { observer.observe(el); });

  // Pie chart animation
  var chartObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var fg = e.target.querySelector('.al-case__chart-fg');
        var percent = parseInt(e.target.getAttribute('data-al-percent'), 10);
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
  document.querySelectorAll('[data-al-percent]').forEach(function(el) { chartObs.observe(el); });

  // FAQ
  document.querySelectorAll('.al-faq-item__q').forEach(function(btn) {
    btn.addEventListener('click', function() { btn.parentElement.classList.toggle('is-open'); });
  });


  // ============ DIAGNOSE QUIZ (새 플로우) ============
  var diagState = {
    answers: {},
    currentStep: 1,
    totalSteps: 4,
    route: 'personal' // personal or corporate
  };

  var intro = document.getElementById('diagIntro');
  var quiz = document.getElementById('diagQuiz');
  var startBtn = document.getElementById('diagStart');
  var backBtn = document.getElementById('diagBack');
  var progressBar = document.getElementById('diagProgress');
  var stepCur = document.getElementById('diagStepCur');
  var stepTotal = document.getElementById('diagStepTotal');

  function showStep(n) {
    document.querySelectorAll('.al-quiz__step').forEach(function(el) { el.classList.remove('is-active'); });
    var target = document.querySelector('.al-quiz__step[data-step="' + n + '"]');
    if (target) { target.hidden = false; target.classList.add('is-active'); }
    diagState.currentStep = n;
    if (stepCur) stepCur.textContent = Math.min(n, diagState.totalSteps);
    if (progressBar) progressBar.style.width = Math.min(n / diagState.totalSteps, 1) * 100 + '%';
    if (backBtn) backBtn.hidden = (n <= 1 || n >= 6);
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
      if (diagState.currentStep > 1) showStep(diagState.currentStep - 1);
    });
  }

  // Step 1 분기: 개인 vs 법인
  window.diagRoute = function(route) {
    diagState.route = route;
    var personalH = document.getElementById('diagPersonalHeader');
    var corpH = document.getElementById('diagCorpHeader');
    if (route === 'corporate') {
      diagState.answers[1] = '법인회생/법인파산';
      diagState.totalSteps = 1;
      if (stepTotal) stepTotal.textContent = '1';
      if (personalH) personalH.style.display = 'none';
      if (corpH) corpH.style.display = 'block';
      showStep(5);
    } else {
      diagState.answers[1] = '개인회생/개인파산';
      diagState.totalSteps = 4;
      if (stepTotal) stepTotal.textContent = '4';
      if (personalH) personalH.style.display = 'block';
      if (corpH) corpH.style.display = 'none';
      showStep(2);
    }
  };

  // Step 2 채무 규모: 선택 클릭 → 다음
  document.querySelectorAll('.al-opt[data-q="2"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      diagState.answers[2] = btn.getAttribute('data-value');
      btn.parentElement.querySelectorAll('.al-opt').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      setTimeout(function() { showStep(3); }, 200);
    });
  });

  // Step 2 채무 직접입력 → 다음
  window.diagDebtNext = function() {
    var v = document.getElementById('diagDebtInput').value;
    if (v) diagState.answers[2] = v + '만원 (직접입력)';
    else if (!diagState.answers[2]) { alert('채무 규모를 선택하거나 입력해 주세요.'); return; }
    showStep(3);
  };

  // Step 3 소득: 정기/비정기 선택 시 입력칸 노출
  window.diagIncomeSelect = function(val) {
    diagState.answers[3] = val;
    document.getElementById('diagIncomeWrap').style.display = 'block';
    // 선택 표시
    document.querySelectorAll('.al-opt[data-q="3"]').forEach(function(b) { b.classList.remove('is-selected'); });
    event.currentTarget.classList.add('is-selected');
  };

  // Step 3 무소득 → 바로 다음 (기존 al-opt click)
  document.querySelectorAll('.al-opt[data-q="3"][data-value="무소득"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      diagState.answers[3] = '무소득';
      document.getElementById('diagIncomeWrap').style.display = 'none';
      setTimeout(function() { showStep(4); }, 200);
    });
  });

  window.diagIncomeNext = function() {
    var v = document.getElementById('diagIncomeInput').value;
    if (v) diagState.answers['월소득'] = v + '만원';
    showStep(4);
  };

  // Step 4 법적절차: 기존 al-opt click → 연락처로
  document.querySelectorAll('.al-opt[data-q="4"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      diagState.answers[4] = btn.getAttribute('data-value');
      btn.parentElement.querySelectorAll('.al-opt').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      setTimeout(function() { showStep(5); }, 200);
    });
  });

  // Contact method toggle
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

  // Submit
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

      var category = diagState.answers[1] || '기타';
      var qLabels = { 1: '분야', 2: '채무 규모', 3: '소득 상태', '월소득': '월소득', 4: '법적 절차' };
      var lines = ['[1분 자가진단 결과]'];
      for (var k in qLabels) {
        if (diagState.answers[k]) lines.push('- ' + qLabels[k] + ': ' + diagState.answers[k]);
      }
      lines.push('');
      lines.push('[연락 정보]');
      lines.push('- 연락 방법: ' + method);
      lines.push('- ' + (method === '카카오톡' ? '카카오 ID' : '전화') + ': ' + contact);
      if (time) lines.push('- 연락 가능 시간: ' + time);

      var message = lines.join('\n');
      var phoneValue = method === '카카오톡' ? ('카톡: ' + contact) : contact;

      var diagnosis = {};
      for (var k2 in qLabels) {
        if (diagState.answers[k2]) diagnosis[qLabels[k2]] = diagState.answers[k2];
      }
      diagnosis['연락 방법'] = method;
      if (time) diagnosis['연락 가능 시간'] = time;

      submitBtn.disabled = true; submitBtn.textContent = '접수 중...';

      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, phone: phoneValue,
          category: category, message: message,
          source: '자가진단', diagnosis: diagnosis,
        })
      }).then(function(r) {
        if (r.ok) showStep(6);
        else throw new Error();
      }).catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '무료 상담 신청 완료하기';
        alert('접수에 실패했습니다. 전화로 문의해 주세요.');
      });
    });
  }

  // Form (하단 상담 신청)
  var form = document.getElementById('alForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var agreeBox = document.getElementById('alFormAgree');
      if (agreeBox && !agreeBox.checked) { alert('개인정보 수집·이용에 동의해 주세요.'); return; }
      var btn = form.querySelector('.al-form__submit');
      btn.disabled = true; btn.textContent = '접수 중...';
      var data = {
        name: form.name.value, phone: form.phone.value,
        category: form.category.value, message: form.message.value,
        company: (form.company ? form.company.value : '')
      };
      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(r) {
        if (r.ok) {
          form.innerHTML = '<div class="al-form__success"><strong>상담 신청이 접수되었습니다.</strong><p>내편이 되어 가장 빠른 시간 내에<br>직접 연락드리겠습니다.</p></div>';
        } else throw new Error();
      }).catch(function() {
        btn.disabled = false; btn.textContent = '무료 상담 신청하기 →';
        alert('접수에 실패했습니다.');
      });
    });
  }
})();

// ===== CASE STORY MODAL =====
function openAlCase(el) {
  var m = document.getElementById('alModal');
  if (!m) return;
  document.getElementById('alModalCat').textContent = el.getAttribute('data-cat');
  document.getElementById('alModalPct').textContent = el.getAttribute('data-pct') + '%';
  document.getElementById('alModalTitle').textContent = el.getAttribute('data-title');
  document.getElementById('alModalPeriod').textContent = el.getAttribute('data-period');
  document.getElementById('alModalSituation').textContent = el.getAttribute('data-situation');
  document.getElementById('alModalStrategy').textContent = el.getAttribute('data-strategy');
  document.getElementById('alModalResult').textContent = el.getAttribute('data-result');
  document.getElementById('alModalComment').textContent = '"' + el.getAttribute('data-comment') + '"';
  m.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeAlCase() {
  var m = document.getElementById('alModal');
  if (m) { m.hidden = true; document.body.style.overflow = ''; }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeAlCase(); closePractice(); }
});

// ===== PRACTICE MODAL =====
function openPractice(el) {
  var m = document.getElementById('alPracticeModal');
  if (!m) return;
  document.getElementById('alPmEn').textContent = el.getAttribute('data-p-en');
  document.getElementById('alPmTitle').textContent = el.getAttribute('data-p-title');
  document.getElementById('alPmDesc').innerHTML = el.getAttribute('data-p-desc').replace(/\\n/g, '<br>');
  document.getElementById('alPmDetail').innerHTML = el.getAttribute('data-p-detail').replace(/\\n/g, '<br>');
  var tagsEl = document.getElementById('alPmTags');
  tagsEl.innerHTML = '';
  (el.getAttribute('data-p-tags') || '').split(',').forEach(function(t) {
    if (!t) return;
    var span = document.createElement('span');
    span.textContent = t;
    span.style.cssText = 'font-size:0.75rem;font-weight:600;padding:0.25rem 0.65rem;background:var(--al-green-soft);color:var(--al-green);border-radius:999px;';
    tagsEl.appendChild(span);
  });
  m.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closePractice() {
  var m = document.getElementById('alPracticeModal');
  if (m) { m.hidden = true; document.body.style.overflow = ''; }
}

// ===== KAKAO MAP =====
window.addEventListener('DOMContentLoaded', function() {
  if (typeof kakao === 'undefined' || !kakao.maps) return;
  kakao.maps.load(function() {
    var container = document.getElementById('alMap');
    if (!container) return;
    var coords = new kakao.maps.LatLng(37.3089, 126.8665);
    var map = new kakao.maps.Map(container, { center: coords, level: 3 });
    var marker = new kakao.maps.Marker({ map: map, position: coords });
    var info = new kakao.maps.InfoWindow({
      content: '<div style="padding:10px 14px;font-size:13px;line-height:1.6;min-width:160px;font-family:Pretendard,sans-serif;">' +
        '<strong style="font-size:14px;color:#144534;">법률사무소 시민</strong><br>' +
        '<span style="color:#666;">안산시 상록구 광덕1로385. 202호</span></div>'
    });
    info.open(map, marker);
    map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
  });
});
