from django.contrib import admin  # Import the admin module
from django.urls import path, include
from accounts.views import home  # Import the home view
from django.contrib.auth import views as auth_views


urlpatterns = [
    path('admin/', admin.site.urls),  # Admin URL
    path('accounts/', include('accounts.urls')),  # Accounts app URLs
    path('', home, name='home'),  # Root URL
    path('oauth/', include('social_django.urls', namespace='social')),
    path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

]