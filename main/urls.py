from django.urls import path
from django.views.generic.base import RedirectView
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/consultation/', views.consultation_api, name='consultation_api'),
    path('api/popups/', views.popup_api, name='popup_api'),
    path('notice/', views.notice_list, name='notice_list'),
    path('notice/<int:pk>/', views.notice_detail, name='notice_detail'),
    path('faq/', views.faq_list, name='faq_list'),
    # 시안 변형들
    path('v/', RedirectView.as_view(url='/', permanent=False)),
    path('v/classic/', views.variant_classic, name='variant_classic'),
    path('v/dark/', views.variant_dark, name='variant_dark'),
    path('v/editorial/', views.variant_editorial, name='variant_editorial'),
    path('v/motion/', views.variant_motion, name='variant_motion'),
    path('v/corporate/', views.variant_corporate, name='variant_corporate'),
    path('v/ally/', views.variant_ally, name='variant_ally'),
    # 광고 유입용 랜딩 페이지
    path('lp/diagnose/', views.lp_diagnose, name='lp_diagnose'),
]
