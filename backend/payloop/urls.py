"""
PayLoop root URL configuration.

Routes API traffic to the accounts, circles, and mpesa apps.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # ── API endpoints ─────────────────────────────────────────────────
    path("api/auth/", include("accounts.urls")),
    path("api/circles/", include("circles.urls")),
    path("api/mpesa/", include("mpesa.urls")),

    # Stand-alone credit-score lookup by wallet address
    path(
        "api/score/<str:wallet>/",
        # Imported lazily so the URL module doesn't break if the
        # circles app hasn't been fully configured yet.
        __import__("circles.views", fromlist=["credit_score_view"]).credit_score_view,
        name="credit-score",
    ),
]
