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
    path('v/ally/', RedirectView.as_view(url='/', permanent=False)),
    # 광고 유입용 랜딩 페이지
    path('lp/diagnose/', views.lp_diagnose, name='lp_diagnose'),
]
