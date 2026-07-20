import json
import logging
import re
import time
from pathlib import Path
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / 'data'

# ===== 상담 신청 스팸 방지 =====
# 링크/스팸 시그니처: 상담 문의에는 URL 이 거의 등장하지 않으므로 강한 신호로 사용
_SPAM_URL_RE = re.compile(
    r'(https?://|www\.|<a\s|\[url|href\s*=|\bt\.me/|xn--|\.(?:ru|xyz|top|click|link|buzz|cn)\b)',
    re.IGNORECASE,
)
# 키릴 문자 등 한국어 상담과 무관한 문자셋 (봇 스팸에서 자주 출현)
_NON_LOCAL_RE = re.compile(r'[Ѐ-ӿ؀-ۿ]')
# SQL 인젝션 / XSS 등 공격 탐지 시그니처 (정상 한국어 상담에는 등장하지 않음)
_ATTACK_RE = re.compile(
    r'(union\s+select|select\s+.+\s+from\s|information_schema|\bfrom\s+dual\b'
    r'|sleep\s*\(|benchmark\s*\(|waitfor\s+delay|pg_sleep|\bdrop\s+table\b'
    r'|<script|javascript:|on(?:error|load|click)\s*=|\bor\s+1\s*=\s*1)',
    re.IGNORECASE,
)


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '') or 'unknown'


def _normalize_phone(phone):
    """전화번호에서 숫자만 추출하고 국가번호(+82)를 0 으로 치환."""
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('82'):
        digits = '0' + digits[2:]
    return digits


def _rate_limited(ip):
    """IP 당 짧은 창/시간당 신청 수 제한 (파일 기반 캐시 사용)."""
    now = time.time()
    windows = (
        (settings.CONSULT_RATE_LIMIT, settings.CONSULT_RATE_WINDOW),
        (settings.CONSULT_RATE_LIMIT_HOUR, 3600),
    )
    for limit, window in windows:
        key = f'consult_rl:{window}:{ip}'
        hits = [t for t in (cache.get(key) or []) if now - t < window]
        if len(hits) >= limit:
            return True
        hits.append(now)
        cache.set(key, hits, window)
    return False


def _looks_like_spam(name, phone, message):
    """봇/스팸 신호 감지. 하나라도 걸리면 사유 문자열, 아니면 None 반환."""
    blob = f'{name}\n{message}'
    if _SPAM_URL_RE.search(blob):
        return 'url'
    if _ATTACK_RE.search(blob):
        return 'attack'
    if _NON_LOCAL_RE.search(blob):
        return 'charset'
    if len(name) > 30 or len(message) > 1000:
        return 'length'
    # 이름에 숫자가 과도하게 많으면 봇 생성 문자열
    if sum(c.isdigit() for c in name) >= 4:
        return 'name_digits'
    digits = _normalize_phone(phone)
    if not (9 <= len(digits) <= 11 and digits.startswith('0')):
        return 'phone'
    return None


def _load_json(filename):
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, encoding='utf-8') as f:
            return json.load(f)
    return []


def _get_notices(limit=None):
    notices = _load_json('notices.json')
    return notices[:limit] if limit else notices


def _get_faqs(limit=None):
    faqs = _load_json('faqs.json')
    return faqs[:limit] if limit else faqs


def index(request):
    return render(request, 'variants/ally.html', _variant_context())


def variant_classic(request):
    return render(request, 'index.html', {
        'notices': _get_notices(5),
        'faqs': _get_faqs(5),
    })


@csrf_exempt
@require_POST
def consultation_api(request):
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        category = data.get('category', '').strip()
        message = data.get('message', '').strip()
        source = data.get('source', '일반')
        diagnosis = data.get('diagnosis')
        # honeypot: 사람에겐 보이지 않는 필드. 값이 채워져 있으면 봇.
        honeypot = (data.get('company') or data.get('website') or '').strip()

        if not name or not phone or not category:
            return JsonResponse({'error': '필수 항목을 입력해주세요.'}, status=400)

        ip = _client_ip(request)

        # 1) honeypot 에 값이 있으면 봇 → 성공한 것처럼 응답하되 메일 미발송
        if honeypot:
            logger.info('상담 스팸 차단(honeypot) ip=%s', ip)
            return JsonResponse({'success': True}, status=201)

        # 2) 콘텐츠 스팸 신호 (링크/키릴문자/비정상 전화번호 등)
        spam_reason = _looks_like_spam(name, phone, message)
        if spam_reason:
            logger.info('상담 스팸 차단(%s) ip=%s name=%r', spam_reason, ip, name[:20])
            return JsonResponse({'success': True}, status=201)

        # 3) IP 별 신청 횟수 제한 (폭탄성 대량 전송 차단)
        if _rate_limited(ip):
            logger.info('상담 요청 rate limit ip=%s', ip)
            return JsonResponse(
                {'error': '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'},
                status=429,
            )

        valid_sources = {'일반', '자가진단', '랜딩페이지'}
        if source not in valid_sources:
            source = '일반'

        # 이메일 발송
        diagnosis_text = ''
        if isinstance(diagnosis, dict):
            diagnosis_text = '\n'.join(f'  - {k}: {v}' for k, v in diagnosis.items() if v)
            diagnosis_text = f'\n\n[자가진단 응답]\n{diagnosis_text}'

        email_body = (
            f'새로운 상담 신청이 접수되었습니다.\n\n'
            f'이름: {name}\n'
            f'연락처: {phone}\n'
            f'상담 분야: {category}\n'
            f'유입 경로: {source}\n'
            f'상담 내용: {message or "(없음)"}'
            f'{diagnosis_text}'
        )
        try:
            send_mail(
                subject=f'[법률사무소 시민] 상담 신청 - {name} ({category})',
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONSULTATION_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning('상담 이메일 발송 실패: %s', e)

        return JsonResponse({'success': True}, status=201)
    except (json.JSONDecodeError, Exception):
        return JsonResponse({'error': '서버 오류가 발생했습니다.'}, status=500)


def notice_list(request):
    notices = _get_notices()
    return render(request, 'notice_list.html', {'notices': notices})


def notice_detail(request, pk):
    notices = _get_notices()
    notice = None
    for n in notices:
        if n['id'] == pk:
            notice = n
            break
    if notice is None:
        raise Http404
    return render(request, 'notice_detail.html', {'notice': notice})


def faq_list(request):
    faqs = _get_faqs()
    categories = list(dict.fromkeys(f['category'] for f in faqs))
    selected = request.GET.get('category', '')
    if selected:
        faqs = [f for f in faqs if f['category'] == selected]
    return render(request, 'faq_list.html', {
        'faqs': faqs,
        'categories': categories,
        'selected': selected,
    })


def _variant_context():
    return {
        'notices': _get_notices(5),
        'faqs': _get_faqs(5),
    }


def variant_dark(request):
    return render(request, 'variants/dark.html', _variant_context())


def variant_editorial(request):
    return render(request, 'variants/editorial.html', _variant_context())


def variant_motion(request):
    return render(request, 'variants/motion.html', _variant_context())


def variant_corporate(request):
    return render(request, 'variants/corporate.html', _variant_context())


def variant_ally(request):
    return render(request, 'variants/ally.html', _variant_context())


def variant_main2(request):
    return render(request, 'variants/main2.html', _variant_context())


def variant_main(request):
    return render(request, 'variants/main.html', _variant_context())


def variant_prestige(request):
    return render(request, 'variants/prestige.html', _variant_context())


def variant_story(request):
    return render(request, 'variants/story.html', _variant_context())


def lp_diagnose(request):
    return render(request, 'lp/diagnose.html')


def robots_txt(request):
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        f'Sitemap: {request.scheme}://{request.get_host()}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')
