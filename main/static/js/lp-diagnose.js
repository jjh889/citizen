(function() {
  'use strict';

  var state = {
    answers: {},
    currentStep: 1,
    totalQuestions: 5
  };

  var intro = document.getElementById('lpIntro');
  var quiz = document.getElementById('lpQuiz');
  var startBtn = document.getElementById('lpStart');
  var backBtn = document.getElementById('lpBack');
  var progressBar = document.getElementById('lpProgress');
  var stepCur = document.getElementById('lpStepCur');

  function showStep(n) {
    document.querySelectorAll('.lp-quiz__step').forEach(function(el) {
      el.classList.remove('is-active');
    });
    var target = document.querySelector('.lp-quiz__step[data-step="' + n + '"]');
    if (target) {
      target.hidden = false;
      target.classList.add('is-active');
    }
    state.currentStep = n;
    if (stepCur) stepCur.textContent = Math.min(n, state.totalQuestions);
    if (progressBar) {
      var pct = Math.min(n / state.totalQuestions, 1) * 100;
      progressBar.style.width = pct + '%';
    }
    if (backBtn) backBtn.hidden = (n <= 1 || n >= 7);
    if (quiz) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Start
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      if (intro) intro.style.display = 'none';
      if (quiz) quiz.classList.add('is-active');
      showStep(1);
    });
  }

  // Back
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (state.currentStep > 1) showStep(state.currentStep - 1);
    });
  }

  // Options
  document.querySelectorAll('.lp-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var q = btn.getAttribute('data-q');
      var v = btn.getAttribute('data-value');
      state.answers[q] = v;
      btn.parentElement.querySelectorAll('.lp-opt').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      var next = parseInt(q, 10) + 1;
      setTimeout(function() { showStep(next); }, 200);
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

      var catMap = {
        '개인회생': '개인회생', '개인파산': '개인파산',
        '법인회생': '법인회생', '민사/형사': '민사',
        '가사/이혼': '가사/이혼', '전문가상담': '기타'
      };
      var category = catMap[state.answers[5]] || '기타';

      var qLabels = {
        1: '주요 고민', 2: '채무 규모', 3: '소득 상태',
        4: '법적 절차', 5: '원하는 해결'
      };
      var lines = ['[1분 자가진단 결과] (LP 유입)'];
      for (var i = 1; i <= 5; i++) {
        lines.push('- ' + qLabels[i] + ': ' + (state.answers[i] || '-'));
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

      submitBtn.disabled = true; submitBtn.textContent = '접수 중...';

      // 구조화된 자가진단 데이터
      var diagnosis = {
        '주요 고민': state.answers[1] || '',
        '채무 규모': state.answers[2] || '',
        '소득 상태': state.answers[3] || '',
        '법적 절차': state.answers[4] || '',
        '원하는 해결': state.answers[5] || '',
        '연락 방법': method,
        '연락 가능 시간': time || '가능한 빠르게',
        '유입 경로': document.referrer || '직접 방문',
      };

      fetch('/api/consultation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, phone: phoneValue,
          category: category, message: message,
          source: '랜딩페이지',
          diagnosis: diagnosis,
        })
      }).then(function(r) {
        if (r.ok) {
          showStep(7);
        } else throw new Error();
      }).catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '상담 신청 완료하기';
        alert('접수에 실패했습니다. 전화로 문의해 주세요.');
      });
    });
  }
})();
