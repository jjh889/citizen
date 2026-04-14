from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/consultation/', views.consultation_api, name='consultation_api'),
    path('api/popups/', views.popup_api, name='popup_api'),
    path('notice/', views.notice_list, name='notice_list'),
    path('notice/<int:pk>/', views.notice_detail, name='notice_detail'),
    path('faq/', views.faq_list, name='faq_list'),
]
