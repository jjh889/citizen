from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Consultation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, verbose_name='이름')),
                ('phone', models.CharField(max_length=50, verbose_name='연락처')),
                ('category', models.CharField(max_length=30, verbose_name='상담 분야')),
                ('message', models.TextField(blank=True, default='', verbose_name='상담 내용')),
                ('source', models.CharField(choices=[('일반', '일반 상담'), ('자가진단', '자가진단'), ('랜딩페이지', '랜딩페이지')], default='일반', max_length=20, verbose_name='유입 경로')),
                ('diagnosis_data', models.JSONField(blank=True, default=None, null=True, verbose_name='자가진단 답변')),
                ('status', models.CharField(choices=[('NEW', '신규'), ('CHECKED', '확인'), ('DONE', '완료')], default='NEW', max_length=10, verbose_name='상태')),
                ('admin_memo', models.TextField(blank=True, default='', verbose_name='관리자 메모')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='접수일')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='수정일')),
            ],
            options={
                'verbose_name': '상담 신청',
                'verbose_name_plural': '상담 신청',
                'ordering': ['-created_at'],
            },
        ),
    ]
