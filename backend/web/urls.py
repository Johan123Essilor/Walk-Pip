from django.urls import path
from .views import login_page, LoginView,registro_page, main_page,pulsaciones_page

urlpatterns = [
    path('form/', login_page, name='login-form'),        # Login front-end
    path('login/', LoginView.as_view(), name='login-api'),  # Login API
    path('registro-form/', registro_page, name='registro-form'),  # Registro front-end
    path('index/', main_page, name='index'),      
    path('pulsaciones/', pulsaciones_page, name='pulsaciones'),    
]
