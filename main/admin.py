from django.contrib import admin
from django.utils.html import format_html
from .models import Consultation


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
