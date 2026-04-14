import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone
from .models import Consultation, Notice, Popup, FAQ


def index(request):
    notices = Notice.objects.filter(is_active=True)[:5]
    faqs = FAQ.objects.filter(is_active=True)[:5]
    return render(request, 'index.html', {'notices': notices, 'faqs': faqs})


@csrf_exempt
@require_POST
def consultation_api(request):
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        category = data.get('category', '').strip()
        message = data.get('message', '').strip()

        if not name or not phone or not category:
            return JsonResponse({'error': '필수 항목을 입력해주세요.'}, status=400)

        Consultation.objects.create(
            name=name, phone=phone, category=category, message=message
        )
        return JsonResponse({'success': True}, status=201)
    except (json.JSONDecodeError, Exception):
        return JsonResponse({'error': '서버 오류가 발생했습니다.'}, status=500)


@require_GET
def popup_api(request):
    today = timezone.now().date()
    popups = Popup.objects.filter(
        is_active=True, start_date__lte=today, end_date__gte=today
    ).values('id', 'title', 'content', 'link_url')

    result = []
    for p in popups:
        popup = Popup.objects.get(id=p['id'])
        result.append({
            'id': p['id'],
            'title': p['title'],
            'content': p['content'],
            'linkUrl': p['link_url'],
            'imageUrl': popup.image.url if popup.image else None,
        })

    return JsonResponse(result, safe=False)


def notice_list(request):
    notices = Notice.objects.filter(is_active=True)
    return render(request, 'notice_list.html', {'notices': notices})


def notice_detail(request, pk):
    notice = get_object_or_404(Notice, pk=pk, is_active=True)
    return render(request, 'notice_detail.html', {'notice': notice})


def faq_list(request):
    faqs = FAQ.objects.filter(is_active=True)
    categories = FAQ.objects.filter(is_active=True).values_list('category', flat=True).distinct()
    selected = request.GET.get('category', '')
    if selected:
        faqs = faqs.filter(category=selected)
    return render(request, 'faq_list.html', {
        'faqs': faqs,
        'categories': categories,
        'selected': selected,
    })


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
