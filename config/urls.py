from django.contrib.sitemaps.views import sitemap
from django.urls import path, include
from main.sitemaps import StaticSitemap
from main.views import robots_txt

sitemaps = {
    'static': StaticSitemap,
}

urlpatterns = [
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap'),
    path('robots.txt', robots_txt, name='robots_txt'),
    path('', include('main.urls')),
]
