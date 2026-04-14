from django.contrib.sitemaps import Sitemap
from django.conf import settings
from django.urls import reverse
from .models import Notice


class StaticSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 1.0

    def items(self):
        return ['index']

    def location(self, item):
        return reverse(item)


class NoticeSitemap(Sitemap):
    changefreq = 'daily'
    priority = 0.7

    def items(self):
        return Notice.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse('notice_detail', args=[obj.pk])
