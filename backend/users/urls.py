from django.urls import path
from .views import RegisterView, LoginView, PreferencesView

urlpatterns = [
    path('users/register', RegisterView.as_view(), name='users-register'),
    path('users/login', LoginView.as_view(), name='users-login'),
    path('users/preferences', PreferencesView.as_view(), name='users-preferences'),
]


