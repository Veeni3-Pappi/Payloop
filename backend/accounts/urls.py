"""
URL configuration for the accounts app.

Routes:
- /api/auth/verify-wallet/  -- wallet signature verification + JWT
- /api/auth/health/         -- health check
"""

from django.urls import path
from . import views

urlpatterns = [
    path("verify-wallet/", views.verify_wallet, name="verify-wallet"),
    path("health/", views.health_check, name="health-check"),
]
