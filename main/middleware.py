from django.utils import timezone
from .models import SiteVisit, VisitorLog


class VisitorTrackingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # 정적 파일, admin, api 경로는 제외
        path = request.path
        if path.startswith(('/static/', '/media/', '/admin/', '/api/', '/favicon')):
            return response

        # 봇 제외
        ua = request.META.get('HTTP_USER_AGENT', '')
        if not ua or any(b in ua.lower() for b in ['bot', 'crawler', 'spider', 'curl', 'wget']):
            return response

        try:
            ip = self._get_client_ip(request)
            today = timezone.now().date()

            # 방문 로그 저장
            VisitorLog.objects.create(
                ip_address=ip,
                path=path,
                user_agent=ua[:500],
                referer=request.META.get('HTTP_REFERER', '')[:500],
            )

            # 일별 통계 업데이트
            visit, created = SiteVisit.objects.get_or_create(
                date=today,
                defaults={'page_views': 0, 'unique_visitors': 0}
            )
            visit.page_views += 1

            # 오늘 이 IP가 처음 방문인지 확인
            is_new = not VisitorLog.objects.filter(
                ip_address=ip,
                visited_at__date=today,
            ).exclude(
                id=VisitorLog.objects.filter(ip_address=ip, visited_at__date=today).order_by('-visited_at').first().id
            ).exists()

            if is_new:
                visit.unique_visitors += 1

            visit.save()
        except Exception:
            pass

        return response

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '0.0.0.0')
