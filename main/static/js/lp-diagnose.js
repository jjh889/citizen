(function() {
  'use strict';

  var state = { answers: {}, currentStep: 1, totalSteps: 4, route: 'personal' };

  var intro = document.getElementById('lpIntro');
  var quiz = document.getElementById('lpQuiz');
  var startBtn = document.getElementById('lpStart');
  var backBtn = document.getElementById('lpBack');
  var progressBar = document.getElementById('lpProgress');
  var stepCur = document.getElementById('lpStepCur');

  function showStep(n) {
    document.querySelectorAll('.lp-quiz__step').forEach(function(el) { el.classList.remove('is-active'); });
    var target = document.querySelector('.lp-quiz__step[data-step="' + n + '"]');
    if (target) { target.hidden = false; target.classList.add('is-active'); }
    state.currentStep = n;
    if (stepCur) stepCur.textContent = Math.min(n, state.totalSteps);
    if (progressBar) progressBar.style.width = Math.min(n / state.totalSteps, 1) * 100 + '%';
    if (backBtn) backBtn.hidden = (n <= 1 || n >= 6);
    if (quiz) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      if (intro) intro.style.display = 'none';
      if (quiz) quiz.classList.add('is-active');
      showStep(1);
    });
  }
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (state.currentStep > 1) showStep(state.currentStep - 1);
    });
  }

  // Step 1: 개인 vs 법인
  window.lpRoute = function(route) {
    state.route = route;
    var personalH = document.getElementById('lpPersonalHeader');
    var corpH = document.getElementById('lpCorpHeader');
    if (route === 'corporate') {
      state.answers[1] = '법인회생/법인파산';
      state.totalSteps = 1;
      if (personalH) personalH.style.display = 'none';
      if (corpH) corpH.style.display = 'block';
      showStep(5);
    } else {
      state.answers[1] = '개인회생/개인파산';
      state.totalSteps = 4;
      if (personalH) personalH.style.display = 'block';
      if (corpH) corpH.style.display = 'none';
      showStep(2);
    }
  };

  // Step 2: 채무 선택
  document.querySelectorAll('.lp-opt[data-q="2"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.answers[2] = btn.getAttribute('data-value');
      btn.parentElement.querySelectorAll('.lp-opt').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      setTimeout(function() { showStep(3); }, 200);
    });
  });

  window.lpDebtNext = function() {
    var v = document.getElementById('lpDebtInput').value;
    if (v) state.answers[2] = v + '만원 (직접입력)';
    else if (!state.answers[2]) { alert('채무 규모를 선택하거나 입력해 주세요.'); return; }
    showStep(3);
  };

  // Step 3: 소득
  window.lpIncomeSelect = function(val, el) {
    state.answers[3] = val;
    document.getElementById('lpIncomeWrap').style.display = 'block';
    document.querySelectorAll('.lp-opt[data-q="3"]').forEach(function(b) { b.classList.remove('is-selected'); });
    el.classList.add('is-selected');
  };

  document.querySelectorAll('.lp-opt[data-q="3"][data-value="무소득"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.answers[3] = '무소득';
      document.getElementById('lpIncomeWrap').style.display = 'none';
      setTimeout(function() { showStep(4); }, 200);
    });
  });

  window.lpIncomeNext = function() {
    var v = document.getElementById('lpIncomeInput').value;
    if (v) state.answers['월소득'] = v + '만원';
    showStep(4);
  };

  // Step 4: 법적절차
  document.querySelectorAll('.lp-opt[data-q="4"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.answers[4] = btn.getAttribute('data-value');
      btn.parentElement.querySelectorAll('.lp-opt').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      setTimeout(function() { showStep(5); }, 200);
    });
  });

  // Contact method
  var methodRadios = document.querySelectorAll('input[name="lpMethod"]');
  var contactInput = document.getElementById('lpContact');
  var contactLabel = document.getElementById('lpContactLabel');
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
  var submitBtn = document.getElementById('lpSubmit');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var name = (document.getElementById('lpName').value || '').trim();
      var contact = (document.getElementById('lpContact').value || '').trim();
      var method = document.querySelector('input[name="lpMethod"]:checked').value;
      var time = document.getElementById('lpTime').value;
      var agree = document.getElementById('lpAgree').checked;

      if (!name) { alert('이름 또는 닉네임을 입력해 주세요.'); return; }
      if (!contact) { alert('연락처를 입력해 주세요.'); return; }
      if (!agree) { alert('개인정보 수집·이용에 동의해 주세요.'); return; }

      var category = state.answers[1] || '기타';
      var qLabels = { 1: '분야', 2: '채무 규모', 3: '소득 상태', '월소득': '월소득', 4: '법적 절차' };
      var lines = ['[1분 자가진단 결과] (LP 유입)'];
      for (var k in qLabels) {
        if (state.answers[k]) lines.push('- ' + qLabels[k] + ': ' + state.answers[k]);
      }
      lines.push('');
      lines.push('[연락 정보]');
      lines.push('- 연락 방법: ' + method);
      lines.push('- ' + (method === '카카오톡' ? '카카오 ID' : '전화') + ': ' + contact);
      if (time) lines.push('- 연락 가능 시간: ' + time);
      lines.push('');
      lines.push('[유입 경로] ' + (document.referrer || '직접 방문'));

      var message = lines.join('\n');
      var phoneValue = method === '카카오톡' ? ('카톡: ' + contact) : contact;

      var diagnosis = {};
      for (var k2 in qLabels) {
        if (state.answers[k2]) diagnosis[qLabels[k2]] = state.answers[k2];
      }
      diagnosis['연락 방법'] = method;
      if (time) diagnosis['연락 가능 시간'] = time;
      diagnosis['유입 경로'] = document.referrer || '직접 방문';

      submitBtn.disabled = true; submitBtn.textContent = '접수 중...';

      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, phone: phoneValue,
          category: category, message: message,
          source: '랜딩페이지', diagnosis: diagnosis,
        })
      }).then(function(r) {
        if (r.ok) showStep(6);
        else throw new Error();
      }).catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '무료 상담 신청 완료';
        alert('접수에 실패했습니다. 전화로 문의해 주세요.');
      });
    });
  }
})();
