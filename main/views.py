import json
import logging
from pathlib import Path
from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import Consultation

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / 'data'


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

        if not name or not phone or not category:
            return JsonResponse({'error': '필수 항목을 입력해주세요.'}, status=400)

        valid_sources = {'일반', '자가진단', '랜딩페이지'}
        if source not in valid_sources:
            source = '일반'

        Consultation.objects.create(
            name=name, phone=phone, category=category,
            message=message, source=source,
            diagnosis_data=diagnosis if isinstance(diagnosis, dict) else None,
        )

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
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        f'Sitemap: {request.scheme}://{request.get_host()}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')
