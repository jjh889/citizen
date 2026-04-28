from django.urls import path
from django.views.generic.base import RedirectView
from . import views

def variants_index(request):
    from django.shortcuts import render
    return render(request, 'variants/index.html')

urlpatterns = [
    path('', views.index, name='index'),
    path('api/consultation/', views.consultation_api, name='consultation_api'),
    path('api/popups/', views.popup_api, name='popup_api'),
    path('notice/', views.notice_list, name='notice_list'),
    path('notice/<int:pk>/', views.notice_detail, name='notice_detail'),
    path('faq/', views.faq_list, name='faq_list'),
    # 시안 백업 (전체 목록)
    path('v/', variants_index, name='variant_index'),
    path('v/classic/', views.variant_classic, name='variant_classic'),
    path('v/ally/', RedirectView.as_view(url='/', permanent=False)),
    path('v/main2/', views.variant_main2, name='variant_main2'),
    path('v/main/', views.variant_main, name='variant_main'),
    path('v/dark/', views.variant_dark, name='variant_dark'),
    path('v/editorial/', views.variant_editorial, name='variant_editorial'),
    path('v/motion/', views.variant_motion, name='variant_motion'),
    path('v/corporate/', views.variant_corporate, name='variant_corporate'),
    path('v/prestige/', views.variant_prestige, name='variant_prestige'),
    path('v/story/', views.variant_story, name='variant_story'),
    # 광고 유입용 랜딩 페이지
    path('lp/diagnose/', views.lp_diagnose, name='lp_diagnose'),
]
