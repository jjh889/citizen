from urllib.parse import urlparse
from collections import Counter

from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.db.models import Sum, Count
from datetime import timedelta
from .models import Consultation, Notice, Popup, FAQ, SiteVisit, VisitorLog


admin.site.site_header = '법률사무소 시민 관리자'
admin.site.site_title = '법률사무소 시민'
admin.site.index_title = '관리 메뉴'


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ['id', 'status_badge', 'source_badge', 'name', 'phone', 'category', 'has_memo', 'created_at']
    list_filter = ['status', 'source', 'category', 'created_at']
    search_fields = ['name', 'phone', 'message', 'admin_memo']
    readonly_fields = ['source', 'created_at', 'updated_at', 'message_display', 'diagnosis_display']
    list_per_page = 20
    list_display_links = ['name']

    fieldsets = (
        ('신청 정보', {
            'fields': ('name', 'phone', 'category', 'source', 'message_display')
        }),
        ('자가진단 결과', {
            'fields': ('diagnosis_display',),
            'classes': ('wide',),
        }),
        ('처리', {
            'fields': ('status', 'admin_memo')
        }),
        ('일시', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {
            'NEW': '#DC2626',
            'CHECKED': '#2563EB',
            'DONE': '#16A34A',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = '상태'
    status_badge.admin_order_field = 'status'

    def source_badge(self, obj):
        styles = {
            '일반': ('#E5E7EB', '#374151'),
            '자가진단': ('#DCFCE7', '#166534'),
            '랜딩페이지': ('#FEF3C7', '#92400E'),
        }
        bg, fg = styles.get(obj.source, ('#E5E7EB', '#374151'))
        icon = '🔍' if obj.source == '자가진단' else ('📣' if obj.source == '랜딩페이지' else '💬')
        return format_html(
            '<span style="background:{};color:{};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap">{} {}</span>',
            bg, fg, icon, obj.source
        )
    source_badge.short_description = '유입'
    source_badge.admin_order_field = 'source'

    def has_memo(self, obj):
        if obj.admin_memo:
            return format_html('<span style="color:#16A34A" title="{}">&#9679; 메모</span>', obj.admin_memo[:50])
        return format_html('<span style="color:#D1D5DB">-</span>')
    has_memo.short_description = '메모'

    def message_display(self, obj):
        if obj.message:
            return format_html(
                '<div style="background:#F9FAFB;padding:14px 16px;border-radius:6px;line-height:1.75;white-space:pre-wrap;border-left:3px solid #9CA3AF;font-size:13px">{}</div>',
                obj.message
            )
        return format_html('<span style="color:#9CA3AF">내용 없음</span>')
    message_display.short_description = '상담 내용'

    def diagnosis_display(self, obj):
        if not obj.diagnosis_data:
            return format_html(
                '<div style="color:#9CA3AF;padding:12px;font-style:italic">자가진단을 통한 접수가 아닙니다.</div>'
            )

        rows = []
        for k, v in obj.diagnosis_data.items():
            if not v:
                continue
            rows.append(
                '<tr>'
                '<td style="padding:10px 14px;background:#F9FAFB;font-weight:600;width:30%;border-bottom:1px solid #E5E7EB;color:#374151">{}</td>'
                '<td style="padding:10px 14px;border-bottom:1px solid #E5E7EB;color:#111827">{}</td>'
                '</tr>'.format(k, v)
            )
        if not rows:
            return format_html('<div style="color:#9CA3AF;padding:12px">진단 데이터 없음</div>')

        html = (
            '<div style="background:#F0FDF4;padding:12px 14px;margin-bottom:10px;border-left:4px solid #16A34A;border-radius:4px;font-size:13px">'
            '<strong style="color:#166534">✓ 자가진단 응답</strong> '
            '<span style="color:#6B7280">— 고객이 직접 선택한 답변입니다</span>'
            '</div>'
            '<table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;font-size:13px">'
            + ''.join(rows)
            + '</table>'
        )
        return format_html(html)
    diagnosis_display.short_description = '자가진단 응답'


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    list_editable = ['is_active']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(Popup)
class PopupAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'is_active', 'start_date', 'end_date', 'is_visible']
    list_filter = ['is_active', 'start_date', 'end_date']
    list_editable = ['is_active']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['id', 'category', 'question', 'order', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    list_editable = ['order', 'is_active']
    search_fields = ['question', 'answer']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(SiteVisit)
class SiteVisitAdmin(admin.ModelAdmin):
    list_display = ['date', 'page_views', 'unique_visitors']
    list_filter = ['date']
    ordering = ['-date']
    list_per_page = 30
    readonly_fields = ['date', 'page_views', 'unique_visitors']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        today = timezone.now().date()
        last_7 = today - timedelta(days=6)
        last_30 = today - timedelta(days=29)

        stats_today = SiteVisit.objects.filter(date=today).first()
        stats_7 = SiteVisit.objects.filter(date__gte=last_7).aggregate(
            pv=Sum('page_views'), uv=Sum('unique_visitors')
        )
        stats_30 = SiteVisit.objects.filter(date__gte=last_30).aggregate(
            pv=Sum('page_views'), uv=Sum('unique_visitors')
        )

        # 레퍼럴 통계 (30일)
        referral_logs = VisitorLog.objects.filter(
            visited_at__date__gte=last_30
        ).exclude(referer='').values_list('referer', flat=True)

        referral_counter = Counter()
        for ref in referral_logs:
            try:
                parsed = urlparse(ref)
                domain = parsed.netloc.lower()
                if domain and domain != request.get_host():
                    # 주요 소스 분류
                    if 'google' in domain:
                        referral_counter['Google 검색'] += 1
                    elif 'naver' in domain:
                        referral_counter['네이버'] += 1
                    elif 'daum' in domain or 'kakao' in domain:
                        referral_counter['다음/카카오'] += 1
                    elif 'instagram' in domain:
                        referral_counter['인스타그램'] += 1
                    elif 'facebook' in domain or 'fb.' in domain:
                        referral_counter['페이스북'] += 1
                    elif 'youtube' in domain:
                        referral_counter['유튜브'] += 1
                    elif 'blog' in domain:
                        referral_counter['블로그'] += 1
                    else:
                        referral_counter[domain] += 1
            except Exception:
                pass

        # 직접 방문 (referer 없음) 수
        direct_count = VisitorLog.objects.filter(
            visited_at__date__gte=last_30,
            referer=''
        ).count()
        referral_counter['직접 방문'] = direct_count

        referral_top = referral_counter.most_common(10)
        referral_total = sum(referral_counter.values()) or 1

        # 인기 페이지 (30일)
        popular_pages = VisitorLog.objects.filter(
            visited_at__date__gte=last_30
        ).values('path').annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        extra_context = extra_context or {}
        extra_context['stats_summary'] = {
            'today_pv': stats_today.page_views if stats_today else 0,
            'today_uv': stats_today.unique_visitors if stats_today else 0,
            'week_pv': stats_7['pv'] or 0,
            'week_uv': stats_7['uv'] or 0,
            'month_pv': stats_30['pv'] or 0,
            'month_uv': stats_30['uv'] or 0,
        }
        extra_context['referral_stats'] = [
            {'source': src, 'count': cnt, 'percent': round(cnt / referral_total * 100, 1)}
            for src, cnt in referral_top
        ]
        extra_context['popular_pages'] = popular_pages

        return super().changelist_view(request, extra_context=extra_context)


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = ['visited_at', 'ip_address', 'path', 'short_ua', 'short_referer']
    list_filter = ['visited_at', 'path']
    search_fields = ['ip_address', 'path', 'referer']
    readonly_fields = ['ip_address', 'path', 'user_agent', 'referer', 'visited_at']
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def short_ua(self, obj):
        return obj.user_agent[:60] + '...' if len(obj.user_agent) > 60 else obj.user_agent
    short_ua.short_description = 'User Agent'

    def short_referer(self, obj):
        if not obj.referer:
            return '-'
        return obj.referer[:40] + '...' if len(obj.referer) > 40 else obj.referer
    short_referer.short_description = 'Referer'
