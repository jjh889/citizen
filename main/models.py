from django.db import models
from django.utils import timezone


class Consultation(models.Model):
    STATUS_CHOICES = [
        ('NEW', '신규'),
        ('CHECKED', '확인'),
        ('DONE', '완료'),
    ]

    name = models.CharField('이름', max_length=50)
    phone = models.CharField('연락처', max_length=20)
    category = models.CharField('상담 분야', max_length=30)
    message = models.TextField('상담 내용', blank=True, default='')
    status = models.CharField('상태', max_length=10, choices=STATUS_CHOICES, default='NEW')
    admin_memo = models.TextField('관리자 메모', blank=True, default='')
    created_at = models.DateTimeField('접수일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        verbose_name = '상담 신청'
        verbose_name_plural = '상담 신청'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.get_status_display()}] {self.name} - {self.category}'


class Notice(models.Model):
    title = models.CharField('제목', max_length=200)
    content = models.TextField('내용')
    is_active = models.BooleanField('활성', default=True)
    created_at = models.DateTimeField('작성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        verbose_name = '공지사항'
        verbose_name_plural = '공지사항'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Popup(models.Model):
    title = models.CharField('제목', max_length=200)
    image = models.ImageField('이미지', upload_to='popups/', blank=True, null=True)
    content = models.TextField('내용 (HTML)', blank=True, default='')
    link_url = models.URLField('링크 URL', blank=True, default='')
    is_active = models.BooleanField('활성', default=True)
    start_date = models.DateField('시작일')
    end_date = models.DateField('종료일')
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        verbose_name = '팝업'
        verbose_name_plural = '팝업'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def is_visible(self):
        today = timezone.now().date()
        return self.is_active and self.start_date <= today <= self.end_date
    is_visible.boolean = True
    is_visible.short_description = '노출 중'


class FAQ(models.Model):
    CATEGORY_CHOICES = [
        ('개인회생', '개인회생'),
        ('개인파산', '개인파산'),
        ('민사', '민사'),
        ('형사', '형사'),
        ('가사/이혼', '가사/이혼'),
        ('법인회생', '법인회생'),
        ('일반', '일반'),
    ]

    category = models.CharField('분류', max_length=20, choices=CATEGORY_CHOICES, default='일반')
    question = models.CharField('질문', max_length=300)
    answer = models.TextField('답변')
    order = models.PositiveIntegerField('정렬순서', default=0)
    is_active = models.BooleanField('활성', default=True)
    created_at = models.DateTimeField('작성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        verbose_name = '자주하는 질문'
        verbose_name_plural = '자주하는 질문'
        ordering = ['order', '-created_at']

    def __str__(self):
        return f'[{self.category}] {self.question}'


class SiteVisit(models.Model):
    date = models.DateField('날짜', unique=True)
    page_views = models.PositiveIntegerField('페이지뷰', default=0)
    unique_visitors = models.PositiveIntegerField('순방문자', default=0)

    class Meta:
        verbose_name = '접속 통계'
        verbose_name_plural = '접속 통계'
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} - PV:{self.page_views} / UV:{self.unique_visitors}'


class VisitorLog(models.Model):
    ip_address = models.GenericIPAddressField('IP')
    path = models.CharField('경로', max_length=500)
    user_agent = models.TextField('User Agent', blank=True, default='')
    referer = models.TextField('Referer', blank=True, default='')
    visited_at = models.DateTimeField('방문일시', auto_now_add=True)

    class Meta:
        verbose_name = '방문 로그'
        verbose_name_plural = '방문 로그'
        ordering = ['-visited_at']

    def __str__(self):
        return f'{self.ip_address} - {self.path} ({self.visited_at})'
