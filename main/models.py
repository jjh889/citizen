from django.db import models


class Consultation(models.Model):
    STATUS_CHOICES = [
        ('NEW', '신규'),
        ('CHECKED', '확인'),
        ('DONE', '완료'),
    ]

    SOURCE_CHOICES = [
        ('일반', '일반 상담'),
        ('자가진단', '자가진단'),
        ('랜딩페이지', '랜딩페이지'),
    ]

    name = models.CharField('이름', max_length=50)
    phone = models.CharField('연락처', max_length=50)
    category = models.CharField('상담 분야', max_length=30)
    message = models.TextField('상담 내용', blank=True, default='')
    source = models.CharField('유입 경로', max_length=20, choices=SOURCE_CHOICES, default='일반')
    diagnosis_data = models.JSONField('자가진단 답변', blank=True, null=True, default=None)
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
